const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const { InngestClient } = require('../../utils/inngest');
const { SystemSettings } = require('../../../backend/models/systemSettings');
const { OpenAi } = require('../../../backend/utils/openAi');
const { validEmbedding } = require('../../../backend/utils/tokenizer');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');

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
};
