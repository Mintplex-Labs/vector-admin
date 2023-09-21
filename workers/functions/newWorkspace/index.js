const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const { InngestClient } = require('../../utils/inngest');

const newWorkspaceCreated = InngestClient.createFunction(
  { name: 'New Namespace or Collection' },
  { event: 'workspace/new' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { workspace, connector, jobId } = event.data;
    if (!['chroma', 'qdrant'].includes(connector.type)) {
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
          name: workspace.slug,
        });

        if (!collection) {
          result = {
            message: `No collection could be created with name ${workspace.slug} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.failed, result);
          return { result };
        }

        result = { message: `Collection ${workspace.slug} created in Chroma.` };
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
          workspace.slug,
          {
            vectors: {
              size: 1536, // TODO: Fixed to OpenAI models - when other embeddings exist make variable.
              distance: 'Cosine',
            },
          }
        );

        if (!collectionCreated) {
          result = {
            message: `No collection could be created with name ${workspace.slug} - nothing to do.`,
          };
          await Queue.updateJob(jobId, Queue.status.failed, result);
          return { result };
        }

        result = { message: `Collection ${workspace.slug} created in QDrant.` };
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
