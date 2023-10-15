const { DocumentVectors } = require('../../../backend/models/documentVectors');
const {
  OrganizationConnection,
} = require('../../../backend/models/organizationConnection');
const {
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
const { Queue } = require('../../../backend/models/queue');
const {
  selectConnector,
} = require('../../../backend/utils/vectordatabases/providers');
const { toChunks } = require('../../../backend/utils/vectordatabases/utils');

const { InngestClient } = require('../../utils/inngest');

const resetOrganization = InngestClient.createFunction(
  { name: 'Reset vector database connected for organization' },
  { event: 'organization/reset' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, jobId } = event.data;
    const connector = await OrganizationConnection.get({
      organization_id: Number(organization.id),
    });
    const vectorDb = selectConnector(connector);

    if (vectorDb.name === 'pinecone') {
      try {
        // Pinecone starter tier does not support `deleteAll`
        // So here we must chunk delete ids in batches.
        // Docs: https://docs.pinecone.io/docs/starter-environment#limitations
        if (vectorDb.isStarterTier()) {
          const vectors = await DocumentVectors.where({
            organization_id: Number(organization.id),
          });
          const vectorIds = vectors.map((vector) => vector.vectorId);
          const chunksOfVectorIds = toChunks(vectorIds, 100);

          const { pineconeIndex } = await vectorDb.connect();
          for (const vectorIds of chunksOfVectorIds) {
            await pineconeIndex.delete1({
              ids: vectorIds,
            });
          }
        } else {
          const namespaces = await vectorDb.namespaces();
          const { pineconeIndex } = await vectorDb.connect();
          for (const collection of namespaces) {
            await pineconeIndex.delete1({
              namespace: collection.name,
              deleteAll: true,
            });
          }
        }

        await removeWorkspaces(organization);
        result = {
          message: `All namespaces and vectors deleted from Pinecone.`,
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

    if (vectorDb.name === 'chroma') {
      try {
        // cannot use .reset as it may not be enabled.
        const namespaces = await vectorDb.namespaces();
        const { client } = await vectorDb.connect();
        for (const collectionInfo of namespaces) {
          await client.deleteCollection({ name: collectionInfo.name });
        }

        await removeWorkspaces(organization);
        result = {
          message: `All namespaces deleted from Chroma.`,
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

    if (vectorDb.name === 'qdrant') {
      try {
        const namespaces = await vectorDb.namespaces();
        const { client } = await vectorDb.connect();
        for (const collectionInfo of namespaces) {
          await client.deleteCollection(collectionInfo.name);
        }

        await removeWorkspaces(organization);
        result = {
          message: `All namespaces deleted from Chroma.`,
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

    if (vectorDb.name === 'weaviate') {
      try {
        const { client } = await weaviateClient.connect();
        const collections = await vectorDb.collections();
        for (const collectionInfo of collections) {
          await client.schema
            .classDeleter()
            .withClassName(collectionInfo.name)
            .do();
        }

        await removeWorkspaces(organization);
        result = {
          message: `All namespaces deleted from Chroma.`,
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

    result = { message: `Nothing to do.` };
    await Queue.updateJob(jobId, Queue.status.complete, result);
    return { result };
  }
);

async function removeWorkspaces(organization) {
  const workspaces = await OrganizationWorkspace.where({
    organization_id: Number(organization.id),
  });
  OrganizationWorkspace.delete({
    id: { in: workspaces.map((ws) => ws.id) },
  });
}

module.exports = {
  resetOrganization,
};
