const { Queue } = require('../../../backend/models/queue');
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
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');

const cloneQDrantDocument = InngestClient.createFunction(
  { name: 'Clone document into QDrant' },
  { event: 'qdrant/cloneDocument' },
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
      const qdrantClient = new QDrant(connector);
      const { client } = await qdrantClient.connect();

      for (const chunks of toChunks(cacheInfo.chunks, 500)) {
        const submission = {
          ids: [],
          vectors: [],
          payloads: [],
        };

        chunks.forEach((chunkData) => {
          const vectorDbId = v4();
          const { metadata, values } = chunkData;
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
          submission.ids.push(vectorDbId);
          submission.vectors.push(values);
          submission.payloads.push(metadata);
        });

        const additionResult = await client.upsert(destinationWs.fname, {
          wait: true,
          batch: { ...submission },
        });
        if (additionResult?.status !== 'completed')
          throw new Error('Error embedding into QDrant', additionResult);
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
  cloneQDrantDocument,
};
