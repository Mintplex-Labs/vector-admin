const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAi } = require("../../../openAi");
const { v4 } = require("uuid");
const { DocumentVectors } = require("../../../../models/documentVectors");
const { toChunks } = require("../../utils");
const { storeVectorResult } = require("../../../storage");
const { WorkspaceDocument } = require("../../../../models/workspaceDocument");

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
      const weaviateClass = await client.schema
        .classGetter()
        .withClassName(className)
        .do();

      const metadata = await client.graphql
        .aggregate()
        .withClassName(className)
        .withFields("meta { count }")
        .do();

      return {
        name: className,
        ...weaviateClass,
        vectorCount:
          metadata?.data?.Aggregate?.[className]?.[0]?.meta?.count || 0,
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

  async addVectors(client, vectors = []) {
    const response = { success: true, errors: new Set([]) };
    const results = await client.batch
      .objectsBatcher()
      .withObjects(...vectors)
      .do();

    results.forEach((res) => {
      const { status, errors = [] } = res.result;
      if (status === "SUCCESS" || errors.length === 0) return;
      response.success = false;
      response.errors.add(errors.error?.[0]?.message || null);
    });

    response.errors = [...response.errors];
    return response;
  }

  // Weaviate does not support batch deletion of ids.
  // To work around this without taking hours on large-document embeddings
  // we chunk some batches of deletions to stay under the rate limit as well
  // as not wait forever.
  async bulkDeleteIds(client, className, vectorIds = []) {
    const deletePromises = [];
    for (const vectorId of vectorIds) {
      deletePromises.push(
        new Promise(async (resolve) => {
          await client.data
            .deleter()
            .withClassName(className)
            .withId(vectorId)
            .do();
          resolve(`Deleted ${vectorId} from ${className}`);
        })
      );
    }

    for (const batch of toChunks(deletePromises, 50)) {
      await Promise.all(batch);
      //.then((result) => console.log(result)) // Note: uncomment for debug of deletion logs
    }

    return;
  }

  async schemaForCollection(namespace) {
    if (!namespace) throw new Error("No namespace value provided.");
    const { client } = await this.connect();
    const className = await this.camelCase(namespace);
    const weaviateClass = await client.schema
      .classGetter()
      .withClassName(className)
      .do();

    return {
      name: className,
      ...weaviateClass,
    };
  }

  async fieldNamesForCollection(namespace) {
    if (!namespace) throw new Error("No namespace value provided.");
    const weaviateClass = await this.namespace(namespace);
    if (!weaviateClass) return [];
    return weaviateClass.properties.map((prop) => prop.name);
  }

  flattenObjectForWeaviate(obj = {}) {
    // Note this function is not generic, it is designed specifically for Weaviate
    // https://weaviate.io/developers/weaviate/config-refs/datatypes#introduction
    // Credit to LangchainJS
    // https://github.com/hwchase17/langchainjs/blob/5485c4af50c063e257ad54f4393fa79e0aff6462/langchain/src/vectorstores/weaviate.ts#L11C1-L50C3
    const flattenedObject = {};

    for (const key in obj) {
      if (!Object.hasOwn(obj, key)) {
        continue;
      }
      const value = obj[key];
      if (typeof obj[key] === "object" && !Array.isArray(value)) {
        const recursiveResult = this.flattenObjectForWeaviate(value);

        for (const deepKey in recursiveResult) {
          if (Object.hasOwn(obj, key)) {
            flattenedObject[`${key}_${deepKey}`] = recursiveResult[deepKey];
          }
        }
      } else if (Array.isArray(value)) {
        if (
          value.length > 0 &&
          typeof value[0] !== "object" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          value.every((el) => typeof el === typeof value[0])
        ) {
          // Weaviate only supports arrays of primitive types,
          // where all elements are of the same type
          flattenedObject[key] = value;
        }
      } else {
        flattenedObject[key] = value;
      }
    }

    // Lastly, use of field names must be GraphQL compliant (/[_A-Za-z][_0-9A-Za-z]*/)
    const sanitizedObject = {};
    Object.entries(flattenedObject).map(([key, value]) => {
      if (/^[A-Za-z0-9_]+$/.test(key)) {
        sanitizedObject[key] = value;
      } else {
        sanitizedObject[this.camelCase(key)] = value;
      }
    });

    return sanitizedObject;
  }

  // Split, embed, and save a given document data that we get from the document processor
  // API.
  async processDocument(namespace, documentData, embedderApiKey, dbDocument) {
    try {
      const className = this.camelCase(namespace);
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

      if (!!vectorValues && vectorValues.length > 0) {
        for (const [i, vector] of vectorValues.entries()) {
          const vectorRecord = {
            id: v4(),
            class: className,
            vector: vector,
            // [DO NOT REMOVE]
            // LangChain will be unable to find your text if you embed manually and dont include the `text` key.
            // https://github.com/hwchase17/langchainjs/blob/2def486af734c0ca87285a48f1a04c057ab74bdf/langchain/src/vectorstores/pinecone.ts#L64
            properties: this.flattenObjectForWeaviate({
              ...metadata,
              text: textChunks[i],
            }),
          };

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
          await this.addVectors(client, chunk);
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

  async similarityResponse(namespace, queryVector, topK = 4) {
    const { client } = await this.connect();
    const className = this.camelCase(namespace);
    const result = {
      vectorIds: [],
      contextTexts: [],
      sourceDocuments: [],
      scores: [],
    };
    const fieldsForCollection = await this.fieldNamesForCollection(namespace);
    const queryString = `${fieldsForCollection.join(
      " "
    )} _additional { id certainty }`;
    const queryResponse = await client.graphql
      .get()
      .withClassName(className)
      .withFields(queryString)
      .withNearVector({ vector: queryVector })
      .withLimit(topK)
      .do();

    const responses = queryResponse?.data?.Get?.[className];
    responses.forEach((response) => {
      const {
        _additional: { id, certainty },
        ...rest
      } = response;
      result.contextTexts.push(rest?.text || "");
      result.sourceDocuments.push({
        ...(rest || {}),
        id,
      });
      result.vectorIds.push(id);
      result.scores.push(certainty);
    });

    return result;
  }

  async getMetadata(namespace = "", vectorIds = []) {
    const { client } = await this.connect();
    const className = this.camelCase(namespace);
    const fieldsForCollection = await this.fieldNamesForCollection(namespace);
    const queryString = `${fieldsForCollection.join(" ")} _additional { id }`;
    const response = await client.graphql
      .get()
      .withClassName(className)
      .withFields(queryString)
      .do();

    const metadatas = [];
    const objects = response?.data?.Get?.[className] || [];

    objects.forEach((object) => {
      const { _additional, ...metadata } = object;
      metadatas.push({
        vectorId: _additional.id,
        ...(metadata || {}),
      });
    });

    return metadatas;
  }
}

module.exports.Weaviate = Weaviate;
