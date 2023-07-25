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

  async indexDimensions() {
    const { pineconeIndex } = await this.connect();
    const description = await pineconeIndex.describeIndexStats1();
    return Number(description?.dimension || 0);
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
    const { status } = await client.describeIndex({
      indexName: settings.index,
    });
    if (!status.ready) throw new Error("Pinecode::Index not ready.");

    return { client, pineconeIndex };
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

  async rawGet(pineconeIndex, namespace, offset = 10, filterRunId = "") {
    const data = {
      ids: [],
      embeddings: [],
      metadatas: [],
      documents: [],
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

    const queryResult = await pineconeIndex.query({ queryRequest });
    if (!queryResult?.matches || queryResult.matches.length === 0) return data;

    queryResult.matches.forEach((match) => {
      const { id, values, metadata } = match;
      data.ids.push(id);
      data.embeddings.push(values);
      data.metadatas.push(metadata);
      data.documents.push(metadata?.text ?? "");
    });

    return data;
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

      const submission = {
        ids: [],
        embeddings: [],
        metadatas: [],
        documents: [],
      };

      for (const textChunk of textChunks) {
        const vectorValues = await openai.embedTextChunk(textChunk);

        if (!!vectorValues) {
          const vectorRecord = {
            id: v4(),
            values: vectorValues,
            // [DO NOT REMOVE]
            // LangChain will be unable to find your text if you embed manually and dont include the `text` key.
            // https://github.com/hwchase17/langchainjs/blob/2def486af734c0ca87285a48f1a04c057ab74bdf/langchain/src/vectorstores/pinecone.ts#L64
            metadata: { ...metadata, text: textChunk },
          };

          submission.ids.push(vectorRecord.id);
          submission.embeddings.push(vectorRecord.values);
          submission.metadatas.push(metadata);
          submission.documents.push(textChunk);

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
        } else {
          console.error(
            "Could not use OpenAI to embed document chunk! This document will not be recorded."
          );
        }
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
}

module.exports.Pinecone = Pinecone;
