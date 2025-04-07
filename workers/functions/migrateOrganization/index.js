const { DocumentVectors } = require('../../../backend/models/documentVectors');
const {
  OrganizationConnection,
} = require('../../../backend/models/organizationConnection');
const {
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
const { Queue } = require('../../../backend/models/queue');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const {
  cachedVectorInformation,
  storeVectorResult,
} = require('../../../backend/utils/storage');
const {
  selectConnector,
} = require('../../../backend/utils/vectordatabases/providers');
const { toChunks } = require('../../../backend/utils/vectordatabases/utils');
const { v4 } = require('uuid');
const { InngestClient } = require('../../utils/inngest');
const { vectorSpaceMetric } = require('../../utils/telemetryHelpers');

const migrateOrganization = InngestClient.createFunction(
  { name: 'Migrate all vector data from one vector db to another' },
  { event: 'organization/migrate' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, destinationOrganization, jobId } = event.data;
    try {
      const skipped = [];
      const orgConnector = await OrganizationConnection.get({
        organization_id: Number(organization.id),
      });
      const destinationConnector = await OrganizationConnection.get({
        organization_id: Number(destinationOrganization.id),
      });

      if (!orgConnector || !destinationConnector) {
        const result = {
          message: `Job failed with error`,
          error:
            'The organization or destination organization does not have a connected vector database.',
          details: e,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const destinationVectorDb = selectConnector(destinationConnector);

      var count = 1;
      const workspaces = await OrganizationWorkspace.where({
        organization_id: Number(organization.id),
      });

      for (const workspace of workspaces) {
        await Queue.updateJob(jobId, Queue.status.pending, {
          message: `Working on namespace ${count} of ${workspaces.length}`,
        });

        const migratedWorkspace = await createMigrationWorkspace(
          destinationVectorDb,
          workspace,
          destinationOrganization
        );
        if (!migratedWorkspace) {
          skipped.push(workspace.fname);
          count++;
          continue;
        }

        const documentsToClone = await WorkspaceDocument.where({
          workspace_id: Number(workspace.id),
        });

        console.log(
          `Migrating ${documentsToClone.length} documents to ${destinationOrganization.name}:${migratedWorkspace.fname}`
        );
        for (const document of documentsToClone) {
          const newDocId = v4();
          const cacheInfo = await cachedVectorInformation(
            WorkspaceDocument.vectorFilename(document)
          );
          if (!cacheInfo.exists) {
            console.error(
              `No vector cache file was found for ${document.name} - cannot clone. Skipping.`
            );
            continue;
          }

          const { document: migratedDocument } = await WorkspaceDocument.create(
            {
              id: newDocId,
              name: document.name,
              workspaceId: migratedWorkspace.id,
              organizationId: migratedWorkspace.organization_id,
            }
          );

          if (!migratedDocument) {
            console.error(
              `Failed to migrate document for ${document.name}. Skipping.`
            );
            continue;
          }

          const newFragments = [];
          const newCacheInfo = [];

          for (const chunks of toChunks(cacheInfo.chunks, 500)) {
            const chunk = chunks.map((chunk) => {
              const vectorDbId = v4();
              const { metadata, values } = chunk;
              newFragments.push({
                docId: newDocId,
                vectorId: vectorDbId,
                documentId: migratedDocument.id,
                workspaceId: migratedDocument.workspace_id,
                organizationId: migratedDocument.organization_id,
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

            console.log(
              `Need to insert ${chunk.length} vectors into ${destinationConnector.type}`
            );
            await upsertVectors(
              destinationVectorDb,
              migratedWorkspace.fname,
              chunk
            );
          }

          await DocumentVectors.createMany(newFragments);
          await storeVectorResult(
            newCacheInfo,
            WorkspaceDocument.vectorFilename(migratedDocument)
          );
        }
        count++;
      }

      result = {
        message: `Organization ${organization.name} vectors migrated to ${destinationOrganization.name}.`,
        details: {
          skippedNamespaces: skipped,
        },
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
      return { result };
    }
  }
);

// Pinecone, which has a default empty namespace needs to be able to be ported.
// since this namespace will exist for every pinecone instance we need to skip
// the check + creation of workspace for the empty workspace and allow it to pass-through
async function createMigrationWorkspace(
  vectorDBClient,
  workspace,
  destinationOrganization
) {
  if (
    vectorDBClient.name === 'pinecone' &&
    vectorDBClient.isStarterTier() &&
    workspace.fname !== ''
  ) {
    console.log(
      `Destination Pinecone vector DB does not support namespace - so must skip upsert for ${workspace.fname}`
    );
    return null;
  }

  if (vectorDBClient.name === 'pinecone' && workspace.fname === '') {
    const { workspace: migratedWorkspace } = await OrganizationWorkspace.create(
      '(default)',
      destinationOrganization.id,
      ''
    );
    return migratedWorkspace;
  }

  // Otherwise migrate over as normal
  const existsInDestination = await namespaceExists(
    vectorDBClient,
    workspace.fname
  );
  if (existsInDestination) return null;

  const collection = await createVectorSpace(vectorDBClient, workspace.fname);
  const { workspace: migratedWorkspace } = await OrganizationWorkspace.create(
    collection.name,
    destinationOrganization.id
  );

  return migratedWorkspace;
}

async function namespaceExists(vectorDBClient, namespace) {
  if (vectorDBClient.name === 'pinecone') {
    try {
      const { pineconeIndex } = await vectorDBClient.connect();
      return await vectorDBClient.namespaceExists(pineconeIndex, namespace);
    } catch (e) {
      return null;
    }
  }

  if (vectorDBClient.name === 'chroma') {
    try {
      return await vectorDBClient.namespaceExists(null, namespace);
    } catch (e) {
      return null;
    }
  }

  if (vectorDBClient.name === 'qdrant') {
    try {
      const { client } = await vectorDBClient.connect();
      return await vectorDBClient.namespaceExists(client, namespace);
    } catch (e) {
      return null;
    }
  }

  if (vectorDBClient.name === 'weaviate') {
    try {
      const className = vectorDBClient.camelCase(namespace);
      return await vectorDBClient.namespaceExists(null, className);
    } catch (e) {
      return null;
    }
  }

  return null;
}

async function createVectorSpace(vectorDBClient, namespace) {
  if (vectorDBClient.name === 'chroma') {
    try {
      const { client } = await vectorDBClient.connect();
      const collection = await client.createCollection({
        name: namespace,
      });

      return { name: namespace, ...collection };
    } catch (e) {
      return null;
    }
  }

  if (vectorDBClient.name === 'qdrant') {
    try {
      const { client } = await vectorDBClient.connect();
      const collectionCreated = await client.createCollection(namespace, {
        vectors: {
          size: 3072, // Updated for text-embedding-3-large model
          distance: 'Cosine',
        },
      });
      return collectionCreated ? { name: namespace } : null;
    } catch (e) {
      return null;
    }
  }

  if (vectorDBClient.name === 'weaviate') {
    try {
      const className = vectorDBClient.camelCase(namespace);
      const { client } = await vectorDBClient.connect();
      const collectionCreated = await client.schema
        .classCreator()
        .withClass({
          class: className,
          description: `Class created by VectorAdmin named ${className}`,
          vectorizer: 'none',
        })
        .do();

      return collectionCreated?.class ? { name: className } : null;
    } catch (e) {
      return null;
    }
  }

  return { name: namespace };
}

// Data will always be an object[] with the following schema:
// metadata: {object with key value pairs}
// values: number[]
// id: string
// This function will take a known format and re-format it to be able to
// be easily inserted into the correct vector database.
async function upsertVectors(vectorDBClient, namespace, data = []) {
  if (vectorDBClient.name === 'pinecone') {
    try {
      const { pineconeIndex } = await vectorDBClient.connect();
      const upserts = data; // data array is fine in default format.
      await pineconeIndex.upsert({
        upsertRequest: {
          vectors: upserts,
          namespace: namespace,
        },
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  if (vectorDBClient.name === 'chroma') {
    try {
      const { client } = await vectorDBClient.connect();
      const collection = await client.getCollection({ name: namespace });
      const upserts = {
        ids: [],
        embeddings: [],
        metadatas: [],
        documents: [],
      };
      data.forEach((chunk) => {
        upserts.ids.push(chunk.id);
        upserts.embeddings.push(chunk.values);
        upserts.metadatas.push(chunk.metadata);
        upserts.documents.push(chunk.metadata?.text || '');
      });
      await collection.add(upserts);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  if (vectorDBClient.name === 'qdrant') {
    try {
      const { client } = await vectorDBClient.connect();
      const upserts = {
        ids: [],
        vectors: [],
        payloads: [],
      };
      data.forEach((chunk) => {
        upserts.ids.push(chunk.id);
        upserts.vectors.push(chunk.values);
        upserts.payloads.push(chunk.metadata);
      });

      await client.upsert(namespace, {
        wait: true,
        batch: upserts,
      });
      return true;
    } catch (e) {
      return null;
    }
  }

  if (vectorDBClient.name === 'weaviate') {
    try {
      const { client } = await vectorDBClient.connect();
      const weaviateVectors = [];

      data.forEach((chunk) => {
        weaviateVectors.push({
          id: chunk.id,
          class: namespace,
          vector: chunk.values,
          properties: vectorDBClient.flattenObjectForWeaviate(chunk.metadata),
        });
      });
      await vectorDBClient.addVectors(client, weaviateVectors);
      return true;
    } catch (e) {
      return null;
    }
  }
}

module.exports = {
  migrateOrganization,
};
