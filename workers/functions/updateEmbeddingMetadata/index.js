const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const { InngestClient } = require('../../utils/inngest');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const {
  Weaviate,
} = require('../../../backend/utils/vectordatabases/providers/weaviate');

// Chroma will only drop null values. So to "reset" the metadata we need to make every existing key null.
function nullifyExisting(json = {}) {
  const nullObj = {};
  Object.keys(json).map((key) => (nullObj[key] = null));
  return nullObj;
}

const updateSingleChromaEmbeddingMetadata = InngestClient.createFunction(
  { name: "Update Single Embedding's metadata in ChromaDB" },
  { event: 'chroma/updateFragmentMetadata' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const {
      documentVector,
      document,
      workspace,
      connector,
      newMetadata,
      jobId,
    } = event.data;
    try {
      const chromaClient = new Chroma(connector);
      const { client } = await chromaClient.connect();
      const collection = await client.getCollection({ name: workspace.slug });

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const chromaVector = await collection.get({
        ids: [documentVector.vectorId],
        include: ['metadatas', 'documents', 'embeddings'],
      });
      if (chromaVector.ids.length === 0) {
        result = {
          message: `No vector found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const existingMetadata = chromaVector?.metadatas?.[0] || {};
      const updatedMetadata = {
        ...nullifyExisting(existingMetadata), // ensure all existing keys are dropped as new metadata is complete.
        ...newMetadata,
        ...(existingMetadata.hasOwnProperty('text')
          ? { text: existingMetadata.text }
          : {}), // Persist text key if it was present
      };

      await collection.update({
        ids: [documentVector.vectorId],
        metadatas: [updatedMetadata],
      });

      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: chromaVector.embeddings[0], // in Cache we make sure we keep embeddings in sync
        metadata: { ...updatedMetadata, text: chromaVector.documents[0] }, // in Cache we make sure to persist text key in metadata directly.
      });

      result = {
        message: `Document ${document.id} with Chroma vector ${documentVector.vectorId} updated with new metadata.`,
        oldMetadata: existingMetadata,
        updatedMetadata,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    } catch (e) {
      const result = {
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Queue.updateJob(jobId, Queue.status.failed, result);
      return { result };
    }
  }
);

const updateSinglePineconeEmbeddingMetadata = InngestClient.createFunction(
  { name: "Update Single Embedding's metadata in PineconeDB" },
  { event: 'pinecone/updateFragmentMetadata' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const {
      documentVector,
      document,
      workspace,
      connector,
      newMetadata,
      jobId,
    } = event.data;
    try {
      const pineconeClient = new Pinecone(connector);
      const { pineconeIndex } = await pineconeClient.connect();
      const namespaceExists = await pineconeClient.namespaceExists(
        pineconeIndex,
        workspace.slug
      );

      if (!namespaceExists) {
        result = {
          message: `No namespace found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const { vectors } = await pineconeIndex.fetch({
        ids: [documentVector.vectorId],
        namespace: workspace.slug,
      });

      if (vectors.length === 0) {
        result = {
          message: `No vector found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const existingMetadata = vectors[documentVector.vectorId]?.metadata || {};
      const updatedMetadata = {
        ...newMetadata,
        ...(existingMetadata.hasOwnProperty('text')
          ? { text: existingMetadata.text }
          : {}), // Persist text key if it was present
      };

      // Pinecone does not support deletion of metadata keys by nullification
      // so we have to delete the entire vector and replace it with the same ID so there is no change
      // to the relationships in the DB and vectorDB
      await pineconeIndex.delete1({ ids: [documentVector.vectorId] });
      await pineconeIndex.upsert({
        upsertRequest: {
          vectors: [
            {
              id: documentVector.vectorId,
              metadata: updatedMetadata,
              values: vectors[documentVector.vectorId]?.values,
            },
          ],
          namespace: workspace.slug,
        },
      });

      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: vectors[documentVector.vectorId]?.values,
        metadata: updatedMetadata,
      });

      result = {
        message: `Document ${document.id} with Chroma vector ${documentVector.vectorId} updated with newly embedded text.`,
        oldMetadata: existingMetadata,
        updatedMetadata,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    } catch (e) {
      const result = {
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Queue.updateJob(jobId, Queue.status.failed, result);
      return { result };
    }
  }
);

const updateSingleQDrantEmbeddingMetadata = InngestClient.createFunction(
  { name: "Update Single Embedding's metadata in QDrant" },
  { event: 'qdrant/updateFragmentMetadata' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const {
      documentVector,
      document,
      workspace,
      connector,
      newMetadata,
      jobId,
    } = event.data;
    try {
      const qdrantClient = new QDrant(connector);
      const { client } = await qdrantClient.connect();
      const collection = await qdrantClient.namespaceExists(
        client,
        workspace.slug
      );

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const vectorMatches = await client.retrieve(workspace.slug, {
        ids: [documentVector.vectorId],
        with_vector: true,
        with_payload: true,
      });

      if (vectorMatches.length === 0) {
        result = {
          message: `No vectors found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }
      const qdrantVector = vectorMatches[0];
      const existingMetadata = qdrantVector.payload || {};
      const updatedMetadata = {
        ...newMetadata,
        ...(existingMetadata.hasOwnProperty('text')
          ? { text: existingMetadata.text }
          : {}), // Persist text key if it was present
      };

      await client.overwritePayload(workspace.slug, {
        payload: updatedMetadata,
        points: [qdrantVector.id],
      });

      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: qdrantVector.vector, // in Cache we make sure we keep embeddings in sync
        metadata: updatedMetadata,
      });

      result = {
        message: `Document ${document.id} with Qdrant vector ${documentVector.vectorId} updated with new metadata.`,
        oldMetadata: existingMetadata,
        updatedMetadata,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    } catch (e) {
      const result = {
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Queue.updateJob(jobId, Queue.status.failed, result);
      return { result };
    }
  }
);

// Given the nature of Weaviate's class system we can only append new fields to classes.
// Weaviate does not allow deletion of properties see alert at https://weaviate.io/developers/weaviate/configuration/schema-configuration#add-a-property
// So we are relegated to only append and updating existing fields ¯\_(ツ)_/¯.
const updateSingleWeaviateEmbeddingMetadata = InngestClient.createFunction(
  { name: "Update Single Embedding's metadata in Weaviate" },
  { event: 'weaviate/updateFragmentMetadata' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const {
      documentVector,
      document,
      workspace,
      connector,
      newMetadata,
      jobId,
    } = event.data;
    try {
      const weaviateClient = new Weaviate(connector);
      const { client } = await weaviateClient.connect();
      const className = weaviateClient.camelCase(workspace.slug);
      const collection = await weaviateClient.namespaceExists(
        client,
        workspace.slug
      );

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.slug} (class: ${className}) - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      var vectorMatch;
      const schema = await weaviateClient.schemaForCollection(className);
      try {
        vectorMatch = await client.data
          .getterById()
          .withClassName(className)
          .withId(documentVector.vectorId)
          .withVector()
          .do();
      } catch {}

      if (!vectorMatch) {
        result = {
          message: `No vectors found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const existingMetadata = vectorMatch.properties || {};
      const { updatedMetadata, newProperties } = prepareMetadata(
        schema.properties,
        existingMetadata,
        weaviateClient.flattenObjectForWeaviate(newMetadata)
      );

      for (const propDef of newProperties) {
        await client.schema
          .propertyCreator()
          .withClassName(className)
          .withProperty(propDef)
          .do();
      }

      await client.data
        .updater()
        .withId(documentVector.vectorId)
        .withClassName(className)
        .withProperties(updatedMetadata)
        .do();
      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: vectorMatch.vector, // in Cache we make sure we keep embeddings in sync
        metadata: updatedMetadata,
      });

      result = {
        message: `Document ${document.id} with Weaviate vector ${documentVector.vectorId} updated with new metadata.`,
        oldMetadata: existingMetadata,
        updatedMetadata,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    } catch (e) {
      const result = {
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Queue.updateJob(jobId, Queue.status.failed, result);
      return { result };
    }
  }
);

// https://weaviate.io/developers/weaviate/config-refs/datatypes
function jsTypeToWeaviateType(value) {
  const jsType = typeof value;
  switch (jsType) {
    case 'string':
      return 'text';
    case 'bigint':
      return 'number';
    case 'number':
      let num = Number(value);
      if (isNaN(num)) return 'text';
      return num % 1 === 0 ? 'int' : 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'text';
  }
}

// From a given weaviate type, cast the value to the correct JS
// type so the insert does not fail. Unsupported types will be ignored in the update.
function weaviateToJsTypeCast(weaviateType, value) {
  switch (weaviateType) {
    case 'text':
      return String(value);
    case 'number':
      if (isNaN(Number(value))) return null;
      return parseFloat(Number(value));
    case 'int':
      if (isNaN(Number(value))) return null;
      return Number(value);
    case 'boolean':
      return Boolean(value);
    default:
      return null;
  }
}

// This function will set the new properties as well as
// ensure type correctness for each key:value in the known schema at runtime.
// New metadata is flattened and key-sanitized here so we are good to append-only merge.
// returns the new metadata to insert and an array of properties to add to schema via weaviate client.
function prepareMetadata(propertiesSchema, prevMetadata, newMetadata) {
  const newProperties = [];
  const updatedMetadata = { ...prevMetadata };

  // Go over each key in the old metadata, and if an update exists we need to type check and update it.
  Object.keys(prevMetadata).forEach((key) => {
    if (!newMetadata.hasOwnProperty(key)) return;
    if (newMetadata[key] === null) return;

    const propertySchema = propertiesSchema.find((prop) => prop.name === key);
    if (!propertySchema) return;
    const weaviateType = propertySchema.dataType[0];
    const castValue = weaviateToJsTypeCast(weaviateType, newMetadata[key]);

    if (!castValue) return;
    updatedMetadata[key] = castValue;
  });

  // If the new metadata has a key that does not exist yet in the known schema so we can add it
  // and also type check and update the metadata to comply to weaviate types.
  Object.entries(newMetadata).forEach(([key, value]) => {
    const propertySchema = propertiesSchema.find((prop) => prop.name === key);
    if (!!propertySchema) return;

    const weaviateType = jsTypeToWeaviateType(value);
    const castValue = weaviateToJsTypeCast(weaviateType, value);
    if (!castValue) return;

    newProperties.push({
      dataType: [weaviateType],
      name: key,
    });
    updatedMetadata[key] = castValue;
  });

  return { updatedMetadata, newProperties };
}

async function updateVectorCache({
  vectorId,
  cacheFilename,
  values,
  metadata,
}) {
  const fs = require('fs');
  const folder = path.resolve(
    __dirname,
    '../../../backend/storage/vector-cache'
  );
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const destination = path.resolve(
    __dirname,
    `../../../backend/storage/vector-cache/${cacheFilename}`
  );
  const existingData = JSON.parse(fs.readFileSync(destination, 'utf8'));
  const targetObj = existingData.find((obj) => obj.vectorDbId === vectorId);
  targetObj.values = values;
  targetObj.metadata = metadata;
  fs.writeFileSync(destination, JSON.stringify(existingData), 'utf8');
  return;
}

module.exports = {
  updateSingleChromaEmbeddingMetadata,
  updateSinglePineconeEmbeddingMetadata,
  updateSingleQDrantEmbeddingMetadata,
  updateSingleWeaviateEmbeddingMetadata,
};
