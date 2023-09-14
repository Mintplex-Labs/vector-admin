const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAi } = require("../../../openAi");
const { v4 } = require("uuid");
const { DocumentVectors } = require("../../../../models/documentVectors");
const { toChunks } = require("../../utils");
const { storeVectorResult } = require("../../../storage");
const { WorkspaceDocument } = require("../../../../models/workspaceDocument");

class Pinecone {
  constructor(connector) {
    this.name = "pinecone";
    this.config = this.setConfig(connector);
  }

  setConfig(config) {
    var { type, settings } = config;
    if (typeof settings === "string") settings = JSON.parse(settings);
    return { type, settings };
  }

  async connect() {
    const { PineconeClient } = require("@pinecone-database/pinecone");
    const { type, settings } = this.config;

    if (type !== "pinecone")
      throw new Error("Pinecone::Invalid Not a Pinecone connector instance.");

    const client = new PineconeClient();
    await client.init({
      apiKey: settings.apiKey,
      environment: settings.environment,
    });

    const pineconeIndex = client.Index(settings.index);
    const {
      status: { ready, host },
    } = await this.describeIndexRaw();
    if (!ready) throw new Error("Pinecone::Index not ready.");

    return { client, host, pineconeIndex };
  }

  async indexDimensions() {
    const { pineconeIndex } = await this.connect();
    const description = await pineconeIndex.describeIndexStats1();
    return Number(description?.dimension || 0);
  }

  async describeIndexRaw() {
    const { settings } = this.config;
    // 200 OK Example
    //   {
    //     "database": {
    //         "name": string,
    //         "metric": "cosine",
    //         "dimension": 1536,
    //         "replicas": 1,
    //         "shards": 1,
    //         "pods": 1
    //     },
    //     "status": {
    //         "waiting": [],
    //         "crashed": [],
    //         "host": URL without protocol,
    //         "port": 433,
    //         "state": "Ready",
    //         "ready": true
    //     }
    // }
    return await fetch(
      `https://controller.${settings.environment}.pinecone.io/databases/${settings.index}`,
      {
        method: "GET",
        headers: {
          "Api-Key": settings.apiKey,
        },
      }
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        }

        const error = {
          code: res?.status,
          message: res?.statusText,
          url: res?.url,
        };
        throw error;
      })
      .catch((e) => {
        console.error("Pinecone.describeIndexRaw", e);
        return {
          database: {},
          status: {
            ready: false,
            host: null,
          },
        };
      });
  }

  async totalIndicies() {
    const { pineconeIndex } = await this.connect();
    const { namespaces } = await pineconeIndex.describeIndexStats1();
    const totalVectors = Object.values(namespaces).reduce(
      (a, b) => a + (b?.vectorCount || 0),
      0
    );
    return { result: totalVectors, error: null };
  }

  // Collections === namespaces for Pinecone to normalize interfaces
  async collections() {
    return await this.namespaces();
  }

  async namespaces() {
    const { pineconeIndex } = await this.connect();
    const { namespaces } = await pineconeIndex.describeIndexStats1();
    const collections = Object.entries(namespaces).map(([name, values]) => {
      return {
        name,
        count: values?.vectorCount || 0,
      };
    });

    return collections;
  }

  async namespaceExists(index, namespace = null) {
    if (!namespace) throw new Error("No namespace value provided.");
    const { namespaces } = await index.describeIndexStats1();
    return namespaces.hasOwnProperty(namespace);
  }

  async namespace(name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const { pineconeIndex } = await this.connect();
    const { namespaces } = await pineconeIndex.describeIndexStats1();
    const collection = namespaces.hasOwnProperty(name)
      ? namespaces[name]
      : null;
    if (!collection) return null;

    return {
      name,
      ...collection,
      count: collection?.vectorCount || 0,
    };
  }

  // 200OK
  // {
  //   "results": [],
  //   "matches": [
  //       {
  //           "id": string,
  //           "score": number,
  //           "values": number[],
  //           "metadata": object
  //       },
  //       ...
  //     ],
  //   "error": // only present if there was an error
  // }
  async _rawQuery(host, queryParams = {}) {
    const { settings } = this.config;
    return await fetch(`https://${host}/query`, {
      method: "POST",
      headers: {
        "Api-Key": settings.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryParams),
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }

        const { vector, ...params } = queryParams;
        const error = {
          code: res?.status,
          message: res?.statusText,
          url: res?.url,
          failedWith: JSON.stringify(params),
        };
        throw error;
      })
      .catch((e) => {
        console.error("Pinecone.rawQuery", e);
        return {
          matches: [],
          error: e,
        };
      });
  }

  // 3-try topK progressive backoff when 500 error. This would be because the associated text/metadata
  // exceeds the max POST response size Pinecone is willing to send.
  // default topK is 1000, which is the max Pinecone allows.
  // So first we try the given topK, then half, lastly quarter.
  // Nothing fancy like an expo-backoff because we need to make sure we don't rate-limit ourselves.
  async rawQuery(host = "", queryParams = {}) {
    var queryResponse;
    const initialPageSize = queryParams?.topK || 1_000;

    queryResponse = await this._rawQuery(host, queryParams);
    if (
      !queryResponse.hasOwnProperty("error") ||
      queryResponse?.error?.code !== 500
    )
      return queryResponse;

    queryResponse = await this._rawQuery(host, {
      ...queryParams,
      topK: Math.floor(initialPageSize / 2),
    });
    if (
      !queryResponse.hasOwnProperty("error") ||
      queryResponse?.error?.code !== 500
    )
      return queryResponse;

    queryResponse = await this._rawQuery(host, {
      ...queryParams,
      topK: Math.floor(initialPageSize / 4),
    });
    return queryResponse;
  }

  async rawGet(host, namespace, offset = 10, filterRunId = "") {
    try {
      const data = {
        ids: [],
        embeddings: [],
        metadatas: [],
        documents: [],
        error: null,
      };
      const queryRequest = {
        namespace,
        topK: offset,
        includeValues: true,
        includeMetadata: true,
        vector: Array.from({ length: 1536 }, () => 0),
        filter: {
          runId: { $ne: filterRunId },
        },
      };

      const queryResult = await this.rawQuery(host, queryRequest);
      if (!queryResult?.matches || queryResult.matches.length === 0) {
        return { ...data, error: queryResult?.error || null };
      }

      queryResult.matches.forEach((match) => {
        const { id, values = [], metadata = {} } = match;
        data.ids.push(id);
        data.embeddings.push(values);
        data.metadatas.push(metadata);
        data.documents.push(metadata?.text ?? "");
      });
      return data;
    } catch (error) {
      console.error("Pinecone::RawGet", error);
      return {
        ids: [],
        embeddings: [],
        metadatas: [],
        documents: [],
        error,
      };
    }
  }

  // Split, embed, and save a given document data that we get from the document processor
  // API.
  async processDocument(
    namespace,
    documentData,
    embedderApiKey,
    dbDocument,
    pineconeIndex
  ) {
    try {
      const openai = new OpenAi(embedderApiKey);
      const { pageContent, id, ...metadata } = documentData;
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 20,
      });
      const textChunks = await textSplitter.splitText(pageContent);

      console.log("Chunks created from document:", textChunks.length);
      const documentVectors = [];
      const cacheInfo = [];
      const vectors = [];
      const vectorValues = await openai.embedTextChunks(textChunks);
      const submission = {
        ids: [],
        embeddings: [],
        metadatas: [],
        documents: [],
      };

      if (!!vectorValues && vectorValues.length > 0) {
        for (const [i, vector] of vectorValues.entries()) {
          const vectorRecord = {
            id: v4(),
            values: vector,
            // [DO NOT REMOVE]
            // LangChain will be unable to find your text if you embed manually and dont include the `text` key.
            // https://github.com/hwchase17/langchainjs/blob/2def486af734c0ca87285a48f1a04c057ab74bdf/langchain/src/vectorstores/pinecone.ts#L64
            metadata: { ...metadata, text: textChunks[i] },
          };

          submission.ids.push(vectorRecord.id);
          submission.embeddings.push(vectorRecord.values);
          submission.metadatas.push(metadata);
          submission.documents.push(textChunks[i]);

          vectors.push(vectorRecord);
          documentVectors.push({
            docId: id,
            vectorId: vectorRecord.id,
            documentId: dbDocument.id,
          });
          cacheInfo.push({
            vectorDbId: vectorRecord.id,
            values: vectorValues,
            metadata: vectorRecord.metadata,
          });
        }
      } else {
        console.error(
          "Could not use OpenAI to embed document chunk! This document will not be recorded."
        );
      }

      if (vectors.length > 0) {
        const chunks = [];
        for (const chunk of toChunks(vectors, 500)) {
          chunks.push(chunk);
          await pineconeIndex.upsert({
            upsertRequest: {
              vectors: [...chunk],
              namespace,
            },
          });
        }
      }

      await DocumentVectors.createMany(documentVectors);
      await storeVectorResult(
        cacheInfo,
        WorkspaceDocument.vectorFilename(dbDocument)
      );
      return { success: true, message: null };
    } catch (e) {
      console.error("addDocumentToNamespace", e.message);
      return { success: false, message: e.message };
    }
  }

  async similarityResponse(namespace, queryVector) {
    const { pineconeIndex } = await this.connect();
    const result = {
      vectorIds: [],
      contextTexts: [],
      sourceDocuments: [],
    };
    const response = await pineconeIndex.query({
      queryRequest: {
        namespace,
        vector: queryVector,
        topK: 4,
        includeMetadata: true,
      },
    });

    response.matches.forEach((match) => {
      result.vectorIds.push(match.id);
      result.contextTexts.push(match.metadata.text);
      result.sourceDocuments.push(match);
    });

    return result;
  }
}

module.exports.Pinecone = Pinecone;
