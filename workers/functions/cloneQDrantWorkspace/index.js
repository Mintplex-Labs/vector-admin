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
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');

const cloneQDrantWorkspace = InngestClient.createFunction(
  { name: 'Clone workspace into QDrant' },
  { event: 'qdrant/cloneWorkspace' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { workspace, newWorkspaceName, connector, jobId } = event.data;
    const { workspace: clonedWorkspace } =
      await OrganizationWorkspace.safeCreate(
        newWorkspaceName,
        workspace.organization_id,
        connector
      );
    try {
      const qdrantClient = new QDrant(connector);
      const { client } = await qdrantClient.connect();
      await client.createCollection(clonedWorkspace.slug, {
        vectors: {
          size: 1536, // TODO: Fixed to OpenAI models - when other embeddings exist make variable.
          distance: 'Cosine',
        },
      });

      const documentsToClone = await WorkspaceDocument.where({
        workspace_id: Number(workspace.id),
      });

      for (const document of documentsToClone) {
        const newDocId = v4();

        try {
          const cacheInfo = await cachedVectorInformation(
            WorkspaceDocument.vectorFilename(document)
          );
          if (!cacheInfo.exists) {
            console.error(
              `No vector cache file was found for ${document.name} - cannot clone. Skipping.`
            );
            continue;
          }

          const { document: cloneDocument } = await WorkspaceDocument.create({
            id: newDocId,
            name: document.name,
            workspaceId: clonedWorkspace.id,
            organizationId: clonedWorkspace.organization_id,
          });

          if (!cloneDocument) {
            console.error(
              `Failed to create cloned parent document for ${document.name}. Skipping.`
            );
            continue;
          }

          const newFragments = [];
          const newCacheInfo = [];

          for (const chunks of toChunks(cacheInfo.chunks, 500)) {
            const submission = {
              ids: [],
              vectors: [],
              payloads: [],
            };

            chunks.forEach((chunk) => {
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

              submission.ids.push(vectorDbId);
              submission.vectors.push(values);
              submission.payloads.push(metadata);
            });

            const additionResult = await client.upsert(clonedWorkspace.slug, {
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

          console.log(
            `WorkspaceClone::DocumentClone::Success: ${cloneDocument.name} saved to workspace ${clonedWorkspace.name}`
          );
        } catch (e) {
          console.log(`WorkspaceClone::DocumentClone::Failed`, e.message, e);
          await WorkspaceDocument.delete({ docId: newDocId });
        }
      }

      result = {
        message: `Workspace ${workspace.name} embeddings cloned into ${clonedWorkspace.name} successfully.`,
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
      await OrganizationWorkspace.delete({ id: Number(clonedWorkspace.id) });
      return { result };
    }
  }
);

module.exports = {
  cloneQDrantWorkspace,
};
