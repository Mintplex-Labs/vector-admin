const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const {
  Weaviate,
} = require('../../../backend/utils/vectordatabases/providers/weaviate');
const { InngestClient } = require('../../utils/inngest');

const newWorkspaceCreated = InngestClient.createFunction(
  { name: 'New Namespace or Collection' },
  { event: 'workspace/new' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { workspace, connector, jobId } = event.data;
    if (!['chroma', 'qdrant', 'weaviate'].includes(connector.type)) {
      result = {
        message: `Connector type does not support empty collection creation - nothing to do.`,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    }

    if (connector.type === 'chroma') {
      try {
        const chromaClient = new Chroma(connector);
        const { client } = await chromaClient.connect();
        const collection = await client.createCollection({
          name: workspace.fname,
        });

        if (!collection) {
          result = {
            message: `No collection could be created with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.failed, result);
          return { result };
        }

        result = {
          message: `Collection ${workspace.fname} created in Chroma.`,
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
        const collectionCreated = await client.createCollection(
          workspace.fname,
          {
            vectors: {
              size: 3072, // Updated for text-embedding-3-large model
              distance: 'Cosine',
            },
          }
        );

        if (!collectionCreated) {
          result = {
            message: `No collection could be created with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.failed, result);
          return { result };
        }

        result = {
          message: `Collection ${workspace.fname} created in QDrant.`,
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
        const className = weaviateClient.camelCase(workspace.fname);
        const { client } = await weaviateClient.connect();
        const collectionCreated = await client.schema
          .classCreator()
          .withClass({
            class: className,
            description: `Class created by VectorAdmin named ${className}`,
            vectorizer: 'none',
          })
          .do();

        if (!collectionCreated?.class) {
          result = {
            message: `No collection could be created with name ${workspace.fname} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.failed, result);
          return { result };
        }

        result = {
          message: `Collection ${workspace.fname} (class ${className}) created in Weaviate.`,
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
  newWorkspaceCreated,
};
