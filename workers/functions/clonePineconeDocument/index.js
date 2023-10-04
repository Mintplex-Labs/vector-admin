const { Queue } = require('../../../backend/models/queue');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');
const { InngestClient } = require('../../utils/inngest');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const {
  cachedVectorInformation,
  storeVectorResult,
} = require('../../../backend/utils/storage');
const { toChunks } = require('../../../backend/utils/vectordatabases/utils');
const { v4 } = require('uuid');
const { DocumentVectors } = require('../../../backend/models/documentVectors');
const { vectorSpaceMetric } = require('../../utils/telemetryHelpers');

const clonePineconeDocument = InngestClient.createFunction(
  { name: 'Clone document into PineconeDB' },
  { event: 'pinecone/cloneDocument' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { document, workspace: destinationWs, connector, jobId } = event.data;
    const newDocId = v4();

    try {
      const cacheInfo = await cachedVectorInformation(
        WorkspaceDocument.vectorFilename(document)
      );
      if (!cacheInfo.exists) {
        result = {
          message: `No vector cache file was found for ${document.name} - cannot clone. Aborting.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const { document: cloneDocument } = await WorkspaceDocument.create({
        id: newDocId,
        name: document.name,
        workspaceId: destinationWs.id,
        organizationId: destinationWs.organization_id,
      });
      if (!cloneDocument) {
        result = {
          message: `Failed to create cloned parent document for ${document.name}. Aborting.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const newFragments = [];
      const newCacheInfo = [];

      const pineconeClient = new Pinecone(connector);
      const { pineconeIndex } = await pineconeClient.connect();

      for (const chunks of toChunks(cacheInfo.chunks, 500)) {
        const chunk = chunks.map((chunk) => {
          const vectorDbId = v4();
          const { metadata, values } = chunk;
          newFragments.push({
            docId: newDocId,
            vectorId: vectorDbId,
            documentId: cloneDocument.id,
            workspaceId: cloneDocument.workspace_id,
            organizationId: cloneDocument.organization_id,
          });
          newCacheInfo.push({
            vectorDbId: vectorDbId,
            values,
            metadata,
          });
          return {
            metadata,
            values,
            id: vectorDbId,
          };
        });
        await pineconeIndex.upsert({
          upsertRequest: {
            vectors: [...chunk],
            namespace: destinationWs.fname,
          },
        });
      }

      await DocumentVectors.createMany(newFragments);
      await storeVectorResult(
        newCacheInfo,
        WorkspaceDocument.vectorFilename(cloneDocument)
      );

      result = {
        ...result,
        message: `Document ${document.name} cloned to ${destinationWs.name} completed`,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      await vectorSpaceMetric();
      return { result };
    } catch (e) {
      const result = {
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Queue.updateJob(jobId, Queue.status.failed, result);
      await WorkspaceDocument.delete({ docId: newDocId });
      return { result };
    }
  }
);

module.exports = {
  clonePineconeDocument,
};
