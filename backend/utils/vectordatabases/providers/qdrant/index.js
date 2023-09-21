const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAi } = require("../../../openAi");
const { v4 } = require("uuid");
const { DocumentVectors } = require("../../../../models/documentVectors");
const { toChunks } = require("../../utils");
const { storeVectorResult } = require("../../../storage");
const { WorkspaceDocument } = require("../../../../models/workspaceDocument");

class QDrant {
  constructor(connector) {
    this.name = "qdrant";
    this.config = this.setConfig(connector);
  }

  setConfig(config) {
    var { type, settings } = config;
    if (typeof settings === "string") settings = JSON.parse(settings);
    return { type, settings };
  }

  async connect() {
    const { QdrantClient } = require("@qdrant/js-client-rest");
    const { type, settings } = this.config;

    if (type !== "qdrant")
      throw new Error("QDrant::Invalid Not a QDrant connector instance.");

    const client = new QdrantClient({
      url: settings.clusterUrl,
      ...(settings.apiKey ? { apiKey: settings.apiKey } : {}),
    });

    const clusterReady =
      (await client.api("cluster")?.clusterStatus())?.ok || false;
    if (!clusterReady) throw new Error("Qdrant::Cluster not ready.");

    return { client };
  }

  async indexDimensions(namespace) {
    const collection = await this.namespace(namespace);
    if (!collection) return 0;

    console.log("qdrant Index dimensions");
    console.log({ collection });

    return Number(collection?.config?.params?.vectors?.size || 0);
  }

  async totalIndicies() {
    const { client } = await this.connect();
    const { collections } = await client.getCollections();
    var totalVectors = 0;
    for (const collection of collections) {
      if (!collection || !collection.name) continue;
      totalVectors +=
        (await this.namespaceWithClient(client, collection.name))
          ?.vectorCount || 0;
    }

    return { result: totalVectors, error: null };
  }

  // Collections === namespaces for qdrant to normalize interfaces
  // and also return verbose information about each collection.
  async collections() {
    const { client } = await this.connect();
    const collections = [];
    const collectionNames = await this.namespaces();

    for (const collection of collectionNames) {
      const collectionInfo = await client
        .getCollection(collection.name)
        .catch(() => null);
      if (!collectionInfo) continue;
      collections.push({
        name: collection.name,
        ...collectionInfo,
        vectorCount: collectionInfo.vectors_count,
      });
    }

    return collections;
  }

  async namespaces() {
    const { client } = await this.connect();
    const { collections } = await client.getCollections();
    return collections;
  }

  async namespaceExists(client, namespace = null) {
    if (!namespace) throw new Error("No namespace value provided.");
    const collection = await client.getCollection(namespace).catch((e) => {
      console.error("QDrant::namespaceExists", e.message);
      return null;
    });
    return !!collection;
  }

  async namespace(name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const { client } = await this.connect();
    const collection = await client.getCollection(name).catch(() => null);
    if (!collection) return null;

    return {
      name,
      ...collection,
      vectorCount: collection.vectors_count,
    };
  }

  async namespaceWithClient(client, name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const collection = await client.getCollection(name).catch(() => null);
    if (!collection) return null;

    return {
      name,
      ...collection,
      vectorCount: collection.vectors_count,
    };
  }

  // Split, embed, and save a given document data that we get from the document processor
  // API.
  async processDocument(namespace, documentData, embedderApiKey, dbDocument) {
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

      if (!!vectorValues && vectorValues.length > 0) {
        for (const [i, vector] of vectorValues.entries()) {
          const vectorRecord = {
            id: v4(),
            vector: vector,
            // [DO NOT REMOVE]
            // LangChain will be unable to find your text if you embed manually and dont include the `text` key.
            // https://github.com/hwchase17/langchainjs/blob/2def486af734c0ca87285a48f1a04c057ab74bdf/langchain/src/vectorstores/pinecone.ts#L64
            payload: { ...metadata, text: textChunks[i] },
          };

          vectors.push(vectorRecord);
          documentVectors.push({
            docId: id,
            vectorId: vectorRecord.id,
            documentId: dbDocument.id,
          });
          cacheInfo.push({
            vectorDbId: vectorRecord.id,
            values: vectorValues,
            metadata: vectorRecord.payload,
          });
        }
      } else {
        console.error(
          "Could not use OpenAI to embed document chunk! This document will not be recorded."
        );
      }

      const { client } = await this.connect();
      if (vectors.length > 0) {
        for (const chunk of toChunks(vectors, 500)) {
          const submission = {
            ids: chunk.map((c) => c.id),
            vectors: chunk.map((c) => c.vector),
            payloads: chunk.map((c) => c.payload),
          };
          await client.upsert(namespace, {
            wait: true,
            batch: { ...submission },
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
    const { client } = await this.connect();
    const result = {
      vectorIds: [],
      contextTexts: [],
      sourceDocuments: [],
    };

    const responses = await client.search(namespace, {
      vector: queryVector,
      limit: 4,
      with_payload: true,
    });

    responses.forEach((response) => {
      result.contextTexts.push(response?.payload?.text || "");
      result.sourceDocuments.push({
        ...(response?.payload || {}),
        id: response.id,
      });
      result.vectorIds.push(response.id);
    });

    return result;
  }

  async getMetadata(namespace = "", vectorIds = []) {
    const { client } = await this.connect();
    const points = await client.retrieve(namespace, {
      ids: vectorIds,
      with_payload: true,
      with_vector: false,
    });

    const metadatas = [];
    points.forEach((point) => {
      metadatas.push({
        vectorId: point.id,
        ...(point?.payload || {}),
      });
    });

    return metadatas;
  }
}

module.exports.QDrant = QDrant;
