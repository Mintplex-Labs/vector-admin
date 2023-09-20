const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const { InngestClient } = require('../../utils/inngest');
const { DocumentVectors } = require('../../../backend/models/documentVectors');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const {
  cachedVectorInformation,
  storeVectorResult,
} = require('../../../backend/utils/storage');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');

const deleteSingleChromaEmbedding = InngestClient.createFunction(
  { name: 'Delete Single Embedding From ChromaDB' },
  { event: 'chroma/deleteFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, workspace, connector, jobId } = event.data;
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

      logger.info(
        `Deleting vector ${documentVector.vectorId} from ${workspace.name}.`
      );
      await collection.delete({ ids: [documentVector.vectorId] });
      await DocumentVectors.delete(documentVector.id);
      await cleanupCacheFile(documentVector);

      result = {
        message: `Vector ${documentVector.vectorId} removed from Chroma collection ${workspace.name}.`,
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

const deleteSinglePineconeEmbedding = InngestClient.createFunction(
  { name: 'Delete Single Embedding From PineconeDB' },
  { event: 'pinecone/deleteFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, workspace, connector, jobId } = event.data;
    try {
      const pineconeClient = new Pinecone(connector);
      const { pineconeIndex } = await pineconeClient.connect();
      const hasNamespace = await pineconeClient.namespaceExists(
        pineconeIndex,
        workspace.slug
      );

      if (!hasNamespace) {
        result = {
          message: `No namespace found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      logger.info(
        `Deleting vector ${documentVector.vectorId} from ${workspace.name}.`
      );

      await pineconeIndex.delete1({
        ids: [documentVector.vectorId],
        namespace: workspace.slug,
      });
      await DocumentVectors.delete(documentVector.id);
      await cleanupCacheFile(documentVector);

      result = {
        message: `Vector ${documentVector.vectorId} removed from Pinecone namespace ${workspace.name}.`,
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

const deleteSingleQDrantEmbedding = InngestClient.createFunction(
  { name: 'Delete Single Embedding From QDrant' },
  { event: 'qdrant/deleteFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, workspace, connector, jobId } = event.data;
    try {
      const qdrantClient = new QDrant(connector);
      const { client } = await qdrantClient.connect();
      const hasNamespace = await qdrantClient.namespaceExists(
        client,
        workspace.slug
      );

      if (!hasNamespace) {
        result = {
          message: `No namespace found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      logger.info(
        `Deleting vector ${documentVector.vectorId} from ${workspace.name}.`
      );

      await client.delete(workspace.slug, {
        wait: true,
        points: [documentVector.vectorId],
      });
      await DocumentVectors.delete(documentVector.id);
      await cleanupCacheFile(documentVector);

      result = {
        message: `Vector ${documentVector.vectorId} removed from Qdrant namespace ${workspace.name}.`,
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

// Keep cache file in sync with changes so when user copies it later the information is not out of sync.
async function cleanupCacheFile(documentVector) {
  const document = await WorkspaceDocument.get(
    `id = ${documentVector.document_id}`
  );
  console.log({ document });
  if (!document) return;
  const digestFilename = WorkspaceDocument.vectorFilename(document);
  const existingInfo = await cachedVectorInformation(digestFilename);

  console.log({ digestFilename, existingInfoExists: existingInfo.exists });
  if (!existingInfo.exists) return;

  const updatedData = existingInfo.chunks.filter(
    (obj) => obj.vectorDbId !== documentVector.vectorId
  );
  console.log({ updatedData: updatedData });
  await storeVectorResult(updatedData, digestFilename);
  return;
}

module.exports = {
  deleteSingleChromaEmbedding,
  deleteSinglePineconeEmbedding,
  deleteSingleQDrantEmbedding,
};
