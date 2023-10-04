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
  Weaviate,
} = require('../../../backend/utils/vectordatabases/providers/weaviate');
const { vectorSpaceMetric } = require('../../utils/telemetryHelpers');

const cloneWeaviateDocument = InngestClient.createFunction(
  { name: 'Clone document into Weaviate' },
  { event: 'weaviate/cloneDocument' },
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
      const weaviateClient = new Weaviate(connector);
      const { client } = await weaviateClient.connect();
      const className = weaviateClient.camelCase(destinationWs.fname);

      for (const chunks of toChunks(cacheInfo.chunks, 500)) {
        const weaviateVectors = [];

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

          const vectorRecord = {
            id: vectorDbId,
            class: className,
            vector: values,
            properties: weaviateClient.flattenObjectForWeaviate(metadata),
          };
          weaviateVectors.push(vectorRecord);
        });

        const { success: additionResult, errors = [] } =
          await weaviateClient.addVectors(client, weaviateVectors);
        if (!additionResult) {
          console.error('Weaviate::addVectors failed to insert', errors);
          throw new Error('Error embedding into Weaviate');
        }
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
  cloneWeaviateDocument,
};
