// const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
// const { OpenAi } = require("../../../openAi");
// const { v4 } = require("uuid");
// const { DocumentVectors } = require("../../../../models/documentVectors");
// const { toChunks } = require("../../utils");
// const { storeVectorResult } = require("../../../storage");
// const { WorkspaceDocument } = require("../../../../models/workspaceDocument");

class Weaviate {
  constructor(connector) {
    this.name = "weaviate";
    this.config = this.setConfig(connector);
  }

  camelCase(input) {
    const { camelCase: toCamelCase } = require("../../utils/camelcase");
    return toCamelCase(input);
  }

  setConfig(config) {
    var { type, settings } = config;
    if (typeof settings === "string") settings = JSON.parse(settings);
    return { type, settings };
  }

  async connect() {
    const { default: weaviate } = require("weaviate-ts-client");
    const { type, settings } = this.config;

    if (type !== "weaviate")
      throw new Error("Weaviate::Invalid Not a Weaviate connector instance.");

    const weaviateUrl = new URL(settings.clusterUrl);
    const options = {
      scheme: weaviateUrl.protocol?.replace(":", "") || "http",
      host: weaviateUrl?.host,
      ...(settings.apiKey
        ? { apiKey: new weaviate.ApiKey(settings.apiKey) }
        : {}),
    };

    const client = weaviate.client(options);
    const clusterReady = await client.misc.liveChecker().do();
    if (!clusterReady) throw new Error("Weaviate::Cluster not ready.");
    return { client };
  }

  async indexDimensions(namespace) {
    const { client } = await this.connect();
    const response = await client.graphql
      .get()
      .withClassName(this.camelCase(namespace))
      .withLimit(1)
      .withFields("_additional { vector }")
      .do();

    return Number(
      response?.data?.Get?.[this.camelCase(namespace)]?.[0]?._additional?.vector
        ?.length || 0
    );
  }

  async totalIndicies() {
    const { client } = await this.connect();
    const collections = await this.collections();
    var totalVectors = 0;
    for (const collection of collections) {
      if (!collection || !collection.name) continue;
      console.log({ dim: await this.indexDimensions(collection.name) });
      totalVectors +=
        (await this.namespaceWithClient(client, collection.name))
          ?.vectorCount || 0;
    }

    return { result: totalVectors, error: null };
  }

  // Classes === namespaces === collections for weaviate to normalize interfaces
  // and also return verbose information about each collection.
  async collections() {
    const { client } = await this.connect();
    const collections = [];
    const classNames = await this.namespaces();

    for (const className of classNames) {
      collections.push({
        name: className,
        vectorCount: await this.namespaceCountWithClient(client, className),
      });
    }

    return collections;
  }

  async namespaces() {
    try {
      const { client } = await this.connect();
      const { classes = [] } = await client.schema.getter().do();
      return classes.map((classObj) => classObj.class);
    } catch (e) {
      console.error("Weaviate::namespaces", e);
      return [];
    }
  }

  async namespaceCount(namespace = null) {
    try {
      const { client } = await this.connect();
      const response = await client.graphql
        .aggregate()
        .withClassName(this.camelCase(namespace))
        .withFields("meta { count }")
        .do();

      return (
        response?.data?.Aggregate?.[this.camelCase(namespace)]?.[0]?.meta
          ?.count || 0
      );
    } catch (e) {
      console.error(`Weaviate:namespaceCountWithClient`, e.message);
      return 0;
    }
  }

  async namespaceCountWithClient(client, namespace = null) {
    try {
      const className = this.camelCase(namespace);
      const response = await client.graphql
        .aggregate()
        .withClassName(className)
        .withFields("meta { count }")
        .do();

      return response?.data?.Aggregate?.[className]?.[0]?.meta?.count || 0;
    } catch (e) {
      console.error(`Weaviate:namespaceCountWithClient`, e.message);
      return 0;
    }
  }

  async namespaceExists(_client, namespace = null) {
    if (!namespace) throw new Error("No namespace value provided.");
    const weaviateClasses = await this.namespaces();
    return weaviateClasses.includes(this.camelCase(namespace));
  }

  async namespace(name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const { client } = await this.connect();
    const className = this.camelCase(name);
    try {
      const response = await client.graphql
        .aggregate()
        .withClassName(className)
        .withFields("meta { count }")
        .do();

      const weaviateClass = response?.data?.Aggregate?.[className]?.[0];
      if (!weaviateClass) return null;

      return {
        name: className,
        vectorCount: weaviateClass?.meta?.count || 0,
      };
    } catch (e) {
      // This will fail is the namespace is just not found or has no data.
      return null;
    }
  }

  async namespaceWithClient(client, name = null) {
    if (!name) throw new Error("No namespace value provided.");
    const className = this.camelCase(name);
    const response = await client.graphql
      .aggregate()
      .withClassName(className)
      .withFields("meta { count }")
      .do();

    const weaviateClass = response?.data?.Aggregate?.[className]?.[0];
    if (!weaviateClass) return null;

    return {
      name: className,
      vectorCount: weaviateClass?.meta?.count || 0,
    };
  }

  // Split, embed, and save a given document data that we get from the document processor
  // API.
  // async processDocument(namespace, documentData, embedderApiKey, dbDocument) {
  //   try {
  //     const openai = new OpenAi(embedderApiKey);
  //     const { pageContent, id, ...metadata } = documentData;
  //     const textSplitter = new RecursiveCharacterTextSplitter({
  //       chunkSize: 1000,
  //       chunkOverlap: 20,
  //     });
  //     const textChunks = await textSplitter.splitText(pageContent);

  //     console.log("Chunks created from document:", textChunks.length);
  //     const documentVectors = [];
  //     const cacheInfo = [];
  //     const vectors = [];
  //     const vectorValues = await openai.embedTextChunks(textChunks);

  //     if (!!vectorValues && vectorValues.length > 0) {
  //       for (const [i, vector] of vectorValues.entries()) {
  //         const vectorRecord = {
  //           id: v4(),
  //           vector: vector,
  //           // [DO NOT REMOVE]
  //           // LangChain will be unable to find your text if you embed manually and dont include the `text` key.
  //           // https://github.com/hwchase17/langchainjs/blob/2def486af734c0ca87285a48f1a04c057ab74bdf/langchain/src/vectorstores/pinecone.ts#L64
  //           payload: { ...metadata, text: textChunks[i] },
  //         };

  //         vectors.push(vectorRecord);
  //         documentVectors.push({
  //           docId: id,
  //           vectorId: vectorRecord.id,
  //           documentId: dbDocument.id,
  //         });
  //         cacheInfo.push({
  //           vectorDbId: vectorRecord.id,
  //           values: vectorValues,
  //           metadata: vectorRecord.payload,
  //         });
  //       }
  //     } else {
  //       console.error(
  //         "Could not use OpenAI to embed document chunk! This document will not be recorded."
  //       );
  //     }

  //     const { client } = await this.connect();
  //     if (vectors.length > 0) {
  //       for (const chunk of toChunks(vectors, 500)) {
  //         const submission = {
  //           ids: chunk.map((c) => c.id),
  //           vectors: chunk.map((c) => c.vector),
  //           payloads: chunk.map((c) => c.payload),
  //         };
  //         await client.upsert(namespace, {
  //           wait: true,
  //           batch: { ...submission },
  //         });
  //       }
  //     }

  //     await DocumentVectors.createMany(documentVectors);
  //     await storeVectorResult(
  //       cacheInfo,
  //       WorkspaceDocument.vectorFilename(dbDocument)
  //     );
  //     return { success: true, message: null };
  //   } catch (e) {
  //     console.error("addDocumentToNamespace", e.message);
  //     return { success: false, message: e.message };
  //   }
  // }

  // async similarityResponse(namespace, queryVector) {
  //   const { client } = await this.connect();
  //   const result = {
  //     vectorIds: [],
  //     contextTexts: [],
  //     sourceDocuments: [],
  //   };

  //   const responses = await client.search(namespace, {
  //     vector: queryVector,
  //     limit: 4,
  //     with_payload: true,
  //   });

  //   responses.forEach((response) => {
  //     result.contextTexts.push(response?.payload?.text || "");
  //     result.sourceDocuments.push({
  //       ...(response?.payload || {}),
  //       id: response.id,
  //     });
  //     result.vectorIds.push(response.id);
  //   });

  //   return result;
  // }

  // async getMetadata(namespace = "", vectorIds = []) {
  //   const { client } = await this.connect();
  //   const points = await client.retrieve(namespace, {
  //     ids: vectorIds,
  //     with_payload: true,
  //     with_vector: false,
  //   });

  //   const metadatas = [];
  //   points.forEach((point) => {
  //     metadatas.push({
  //       vectorId: point.id,
  //       ...(point?.payload || {}),
  //     });
  //   });

  //   return metadatas;
  // }
}

module.exports.Weaviate = Weaviate;
