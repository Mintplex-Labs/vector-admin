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
  Weaviate,
} = require('../../../backend/utils/vectordatabases/providers/weaviate');

const cloneWeaviateWorkspace = InngestClient.createFunction(
  { name: 'Clone workspace into Weaviate' },
  { event: 'weaviate/cloneWorkspace' },
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
      const weaviateClient = new Weaviate(connector);
      const { client } = await weaviateClient.connect();
      const className = weaviateClient.camelCase(clonedWorkspace.slug);
      await client.schema
        .classCreator()
        .withClass({
          class: className,
          description: `Class created by VectorAdmin named ${className}`,
          vectorizer: 'none',
        })
        .do();

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
            const weaviateVectors = [];

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

              const vectorRecord = {
                id: vectorDbId,
                class: className,
                vector: chunk.values,
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
  cloneWeaviateWorkspace,
};
