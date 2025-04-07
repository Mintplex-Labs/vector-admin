const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAi } = require("../../../openAi");
const { v4 } = require("uuid");
const { DocumentVectors } = require("../../../../models/documentVectors");
const { toChunks } = require("../../utils");
const { storeVectorResult } = require("../../../storage");
const { WorkspaceDocument } = require("../../../../models/workspaceDocument");

class Chroma {
  constructor(connector) {
    this.name = "chroma";
    this.config = this.setConfig(connector);
  }

  // For use with ChromaClient SDK only.
  #appendClientAuthHeaders() {
    const { settings } = this.config;
    if (!settings?.authToken) return {};

    const headerName = settings.authTokenHeader || "X-Api-Key";
    const authToken =
      headerName === "Authorization"
        ? `Bearer ${settings.authToken}`
        : settings.authToken;
    return {
      fetchOptions: {
        headers: {
          [headerName]: authToken,
        },
      },
    };
  }

  // For use with fetch API endpoints only.
  #appendRawAuthHeaders() {
    const { settings } = this.config;
    if (!settings?.authToken) return {};

    const headerName = settings.authTokenHeader || "X-Api-Key";
    const authToken =
      headerName === "Authorization"
        ? `Bearer ${settings.authToken}`
        : settings.authToken;
    return {
      [headerName]: authToken,
    };
  }

  setConfig(config) {
    var { type, settings } = config;
    if (typeof settings === "string") settings = JSON.parse(settings);
    return { type, settings };
  }

  distanceToScore(distance = null) {
    if (distance === null || typeof distance !== "number") return 0.0;
    if (distance >= 1.0) return 1;
    if (distance <= 0) return 0;
    return 1 - distance;
  }

  async connect() {
    const { ChromaClient } = require("chromadb");
    const { type, settings } = this.config;

    if (type !== "chroma")
      throw new Error("Chroma::Invalid Not a Chroma connector instance.");

    const client = new ChromaClient({
      path: settings.instanceURL,
      ...this.#appendClientAuthHeaders(),
    });

    const isAlive = await client.heartbeat();
    if (!isAlive)
      throw new Error(
        "ChromaDB::Invalid Heartbeat received - is the instance online?"
      );
    return { client };
  }

  async heartbeat() {
    const { client } = await this.connect();
    return { result: await client.heartbeat(), error: null };
  }

  async totalIndicies() {
    const { client } = await this.connect();
    const collections = await client.listCollections();
    var totalVectors = 0;
    for (const collectionObj of collections) {
      const collection = await client
        .getCollection({ name: collectionObj.name })
        .catch(() => null);
      if (!collection) continue;
      totalVectors += await collection.count();
    }
    return { result: totalVectors, error: null };
  }

  // TODO: Solve this issue
  async indexDimensions() {
    // Chroma does not support this, defaulting to openai's 1536
    return 1536;
  }

  // Collections === namespaces for Chroma to normalize interfaces
  async collections() {
    return await this.namespaces();
  }
  async namespaces() {
    const { client } = await this.connect();
    const allCollections = await client.listCollections();
    const collections = [];

    for (const collectionInfo of allCollections) {
      const collection = await client
        .getCollection(collectionInfo)
        .catch(() => null);
      collections.push({
        ...collectionInfo,
        count: collection ? await collection.count() : 0,
      });
    }

    return collections;
  }

  async namespace(name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const { client } = await this.connect();
    const collection = await client.getCollection({ name }).catch(() => null);
    if (!collection) return null;

    return {
      ...collection,
      count: await collection.count(),
    };
  }

  async namespaceExists(_client, name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const { client } = await this.connect();
    const collection = await client.getCollection({ name }).catch(() => null);
    return !!collection;
  }

  async rawGet(collectionId, pageSize = 10, offset = 0) {
    return await fetch(
      `${this.config.settings.instanceURL}/api/v1/collections/${collectionId}/get`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          ...this.#appendRawAuthHeaders(),
        },
        body: JSON.stringify({
          limit: pageSize,
          offset: offset,
          include: ["embeddings", "documents", "metadatas"],
        }),
      }
    )
      .then((res) => res.json())
      .then((res) => res)
      .catch((error) => {
        console.error(e.message);
        return { ids: [], embeddings: [], metadatas: [], documents: [], error };
      });
  }

  // Split, embed, and save a given document data that we get from the document processor
  // API.
  async processDocument(
    collectionName,
    documentData,
    embedderApiKey,
    dbDocument
  ) {
    try {
      const openai = new OpenAi(embedderApiKey);
      const { pageContent, id, ...metadata } = documentData;
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 3000,
        chunkOverlap: 100,
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
            // LangChain will be unable to find your text if you embed manually and dont include the `page_content` key.
            // https://github.com/hwchase17/langchainjs/blob/2def486af734c0ca87285a48f1a04c057ab74bdf/langchain/src/vectorstores/pinecone.ts#L64
            metadata: { ...metadata, page_content: textChunks[i] },
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
            workspaceId: dbDocument.workspace_id,
            organizationId: dbDocument.organization_id,
          });
          cacheInfo.push({
            vectorDbId: vectorRecord.id,
            values: vector,
            metadata: vectorRecord.metadata,
          });
        }
      } else {
        console.error(
          "Could not use OpenAI to embed document chunk! This document will not be recorded."
        );
      }

      const { client } = await this.connect();
      const collection = await client.getCollection({ name: collectionName });

      if (vectors.length > 0) {
        const chunks = [];
        for (const chunk of toChunks(vectors, 500)) chunks.push(chunk);
        const additionResult = await collection.add(submission);
        if (!additionResult)
          return {
            success: false,
            message: "Failed to push data to Chroma instance.",
          };
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

  async similarityResponse(namespace, queryVector, topK = 4) {
    const { client } = await this.connect();
    const collection = await client.getCollection({ name: namespace });
    const result = {
      vectorIds: [],
      contextTexts: [],
      sourceDocuments: [],
      scores: [],
    };

    const response = await collection.query({
      queryEmbeddings: queryVector,
      nResults: topK,
    });
    response.ids[0].forEach((_, i) => {
      result.vectorIds.push(response.ids[0][i]);
      result.contextTexts.push(response.documents[0][i]);
      result.sourceDocuments.push(response.metadatas[0][i]);
      result.scores.push(this.distanceToScore(response.distances[0][i]));
    });

    return result;
  }

  async getMetadata(namespace = "", vectorIds = []) {
    const { client } = await this.connect();
    const collection = await client.getCollection({ name: namespace });
    const result = await collection.get({
      ids: vectorIds,
      include: ["metadatas", "documents"],
    });

    const metadatas = result.metadatas.map((metadata) => metadata ?? {});
    metadatas.forEach((metadata, i) => {
      metadata.vectorId = vectorIds[i];
      metadata.page_content = result.documents[i];
    });

    return metadatas;
  }
}

module.exports.Chroma = Chroma;
