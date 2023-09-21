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

// Because of the nature of Weaviate and their class model we cannot atomically control the metadata of independent vectors.
// Since adding a new field would warrant a total schema update which would be now empty for all existing vectors and would fail...
// and deleting would have the inverse problem of existing vectors keeping a property which cannot exist. It would mean our only
// option is to then update every single vector in the DB - will just wait for Weaviate to make this sensible for our use cases.

// TODO: Allow appending only, no key deletes. When adding a record with metadata any properties not in known schema are dropped
// so the only real concern is removing keys which _do_ have data on existing properties. We can pull the current schema and then
// just add the newest keys.
const updateSingleWeaviateEmbeddingMetadata = InngestClient.createFunction(
  { name: "Update Single Embedding's metadata in Weaviate" },
  { event: 'weaviate/updateFragmentMetadata' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const {
      // documentVector,
      // document,
      // workspace,
      // connector,
      // newMetadata,
      jobId,
    } = event.data;
    try {
      result = {
        message: `Metadata updates are not enabled for Weaviate database connections - nothing was done.`,
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
