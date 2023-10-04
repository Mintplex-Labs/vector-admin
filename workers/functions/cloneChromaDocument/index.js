const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
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

const cloneChromaDocument = InngestClient.createFunction(
  { name: 'Clone document into ChromaDB' },
  { event: 'chroma/cloneDocument' },
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
      const chromaClient = new Chroma(connector);
      const { client } = await chromaClient.connect();
      const collection = await client.getCollection({
        name: destinationWs.fname,
      });

      for (const chunks of toChunks(cacheInfo.chunks, 500)) {
        const chunk = {
          ids: [],
          embeddings: [],
          metadatas: [],
          documents: [],
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
          chunk.ids.push(vectorDbId);
          chunk.embeddings.push(values);
          chunk.metadatas.push(metadata);
          chunk.documents.push(metadata?.text || '');
        });

        await collection.add(chunk);
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
  cloneChromaDocument,
};
