const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const { InngestClient } = require('../../utils/inngest');
const { SystemSettings } = require('../../../backend/models/systemSettings');
const { OpenAi } = require('../../../backend/utils/openAi');
const { validEmbedding } = require('../../../backend/utils/tokenizer');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');

const updateSingleChromaEmbedding = InngestClient.createFunction(
  { name: 'Update Single Embedding From ChromaDB' },
  { event: 'chroma/updateFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, document, workspace, connector, newText, jobId } =
      event.data;
    try {
      const chromaClient = new Chroma(connector);
      const { client } = await chromaClient.connect();
      const collection = await client.getCollection({ name: workspace.slug });

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const chromaVector = await collection.get({
        ids: [documentVector.vectorId],
        include: ['metadatas'],
      });
      if (chromaVector.ids.length === 0) {
        result = {
          message: `No vector found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const { length, valid } = validEmbedding(newText);
      if (length === 0 || !valid) {
        result = {
          message: `Text input valid tokenization pre-flight check.`,
          length,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const config = await SystemSettings.get(`label = 'open_ai_api_key'`);
      if (!config || !config.value) {
        result = {
          message: `No OpenAI API Key set for instance - cannot embed text - aborting.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      logger.info(`Embedding text via OpenAi.`);
      const openAi = new OpenAi(config.value);
      const embedding = await openAi.embedTextChunk(newText);
      if (!embedding || embedding.length === 0) {
        result = { message: `Failed to embed text chunk using OpenAI.` };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const existingMetadata = chromaVector?.metadatas?.[0];
      const updatedMetadata = {
        ...existingMetadata,
        wordCount: newText.split(' ').length,
        token_count_estimate: length,
        text: newText,
      };

      await collection.update({
        ids: [documentVector.vectorId],
        embeddings: [embedding],
        metadatas: [updatedMetadata],
        documents: [newText],
      });
      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: embedding,
        metadata: updatedMetadata,
      });
      result = {
        message: `Document ${document.id} with Chroma vector ${documentVector.vectorId} updated with newly embedded text.`,
        oldText: existingMetadata.text,
        newText,
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
);

const updateSinglePineconeEmbedding = InngestClient.createFunction(
  { name: 'Update Single Embedding From PineconeDB' },
  { event: 'pinecone/updateFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, document, workspace, connector, newText, jobId } =
      event.data;
    try {
      const pineconeClient = new Pinecone(connector);
      const { pineconeIndex } = await pineconeClient.connect();
      const namespaceExists = await pineconeClient.namespaceExists(
        pineconeIndex,
        workspace.slug
      );

      if (!namespaceExists) {
        result = {
          message: `No namespace found with name ${workspace.slug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const { vectors } = await pineconeIndex.fetch({
        ids: [documentVector.vectorId],
        namespace: workspace.slug,
      });

      if (vectors.length === 0) {
        result = {
          message: `No vector found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const { length, valid } = validEmbedding(newText);
      if (length === 0 || !valid) {
        result = {
          message: `Text input valid tokenization pre-flight check.`,
          length,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const config = await SystemSettings.get(`label = 'open_ai_api_key'`);
      if (!config || !config.value) {
        result = {
          message: `No OpenAI API Key set for instance - cannot embed text - aborting.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      logger.info(`Embedding text via OpenAi.`);
      const openAi = new OpenAi(config.value);
      const embedding = await openAi.embedTextChunk(newText);
      if (!embedding || embedding.length === 0) {
        result = { message: `Failed to embed text chunk using OpenAI.` };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const existingMetadata = vectors[documentVector.vectorId]?.metadata;
      const updatedMetadata = {
        ...existingMetadata,
        wordCount: newText.split(' ').length,
        token_count_estimate: length,
        text: newText,
      };
      const updateRequest = {
        id: documentVector.vectorId,
        values: embedding,
        setMetadata: updatedMetadata,
        namespace: workspace.slug,
      };

      await pineconeIndex.update({ updateRequest });
      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: embedding,
        metadata: updatedMetadata,
      });
      result = {
        message: `Document ${document.id} with Chroma vector ${documentVector.vectorId} updated with newly embedded text.`,
        oldText: existingMetadata.text,
        newText,
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
);

async function updateVectorCache({
  vectorId,
  cacheFilename,
  values,
  metadata,
}) {
  const fs = require('fs');
  const folder = path.resolve(
    __dirname,
    '../../../backend/storage/vector-cache'
  );
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const destination = path.resolve(
    __dirname,
    `../../../backend/storage/vector-cache/${cacheFilename}`
  );
  const existingData = JSON.parse(fs.readFileSync(destination, 'utf8'));
  const targetObj = existingData.find((obj) => obj.vectorDbId === vectorId);
  targetObj.values = values;
  targetObj.metadata = metadata;
  fs.writeFileSync(destination, JSON.stringify(existingData), 'utf8');
  return;
}

module.exports = {
  updateSingleChromaEmbedding,
  updateSinglePineconeEmbedding,
};
