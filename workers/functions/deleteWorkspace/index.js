const { Queue } = require('../../../backend/models/queue');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const { deleteVectorCacheFile } = require('../../../backend/utils/storage');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const {
  Weaviate,
} = require('../../../backend/utils/vectordatabases/providers/weaviate');
const { InngestClient } = require('../../utils/inngest');

const workspaceDeleted = InngestClient.createFunction(
  { name: 'Namespace or Collection deleted' },
  { event: 'workspace/delete' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { workspace, connector, documents = [], jobId } = event.data;

    if (connector.type === 'chroma') {
      try {
        const chromaClient = new Chroma(connector);
        const { client } = await chromaClient.connect();
        const collection = await client.getCollection({
          name: workspace.fname,
        });

        if (!collection) {
          result = {
            message: `No collection found with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.complete, result);
          return { result };
        }

        for (const document of documents) {
          const digestFilename = WorkspaceDocument.vectorFilename(document);
          await deleteVectorCacheFile(digestFilename);
        }

        await client.deleteCollection({ name: workspace.fname });
        result = {
          message: `Collection ${workspace.fname} deleted from Chroma along with ${documents.length} vectorized documents.`,
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

    if (connector.type === 'pinecone') {
      try {
        const pineconeClient = new Pinecone(connector);
        const { pineconeIndex } = await pineconeClient.connect();
        const namespaceExists = await pineconeClient.namespaceExists(
          pineconeIndex,
          workspace.fname
        );

        if (!namespaceExists) {
          result = {
            message: `No namespace found with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.complete, result);
          return { result };
        }

        for (const document of documents) {
          const digestFilename = WorkspaceDocument.vectorFilename(document);
          await deleteVectorCacheFile(digestFilename);
        }

        await pineconeIndex.delete1({
          namespace: workspace.fname,
          deleteAll: true,
        });
        result = {
          message: `Namespace ${workspace.fname} deleted from Pinecone along with ${documents.length} vectorized documents.`,
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

    if (connector.type === 'qdrant') {
      try {
        const qdrantClient = new QDrant(connector);
        const { client } = await qdrantClient.connect();
        const collection = await client.getCollection(workspace.fname);

        if (!collection) {
          result = {
            message: `No collection found with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.complete, result);
          return { result };
        }

        for (const document of documents) {
          const digestFilename = WorkspaceDocument.vectorFilename(document);
          await deleteVectorCacheFile(digestFilename);
        }

        await client.deleteCollection(workspace.fname);
        result = {
          message: `Collection ${workspace.fname} deleted from QDrant along with ${documents.length} vectorized documents.`,
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

    if (connector.type === 'weaviate') {
      try {
        const weaviateClient = new Weaviate(connector);
        const { client } = await weaviateClient.connect();
        const targetClassName = weaviateClient.camelCase(workspace.fname);
        const collection = await weaviateClient.namespaceExists(
          client,
          targetClassName
        );

        if (!collection) {
          result = {
            message: `No collection found with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.complete, result);
          return { result };
        }

        for (const document of documents) {
          const digestFilename = WorkspaceDocument.vectorFilename(document);
          await deleteVectorCacheFile(digestFilename);
        }

        await client.schema.classDeleter().withClassName(targetClassName).do();
        result = {
          message: `Collection ${workspace.fname} (class: ${targetClassName}) deleted from Weaviate along with ${documents.length} vectorized documents.`,
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

module.exports = {
  workspaceDeleted,
};
