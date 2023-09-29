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
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const {
  Weaviate,
} = require('../../../backend/utils/vectordatabases/providers/weaviate');

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
      const collection = await client.getCollection({ name: workspace.fname });

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.fname} - nothing to do.`,
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

      const config = await SystemSettings.get({ label: 'open_ai_api_key' });
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
        workspace.fname
      );

      if (!namespaceExists) {
        result = {
          message: `No namespace found with name ${workspace.slfnameug} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const { vectors } = await pineconeIndex.fetch({
        ids: [documentVector.vectorId],
        namespace: workspace.fname,
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

      const config = await SystemSettings.get({ label: 'open_ai_api_key' });
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
        namespace: workspace.fname,
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

const updateSingleQDrantEmbedding = InngestClient.createFunction(
  { name: 'Update Single Embedding From QDrant' },
  { event: 'qdrant/updateFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, document, workspace, connector, newText, jobId } =
      event.data;
    try {
      const qdrantClient = new QDrant(connector);
      const { client } = await qdrantClient.connect();
      const collection = await qdrantClient.namespaceExists(
        client,
        workspace.fname
      );

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.fname} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const vectorMatches = await client.retrieve(workspace.fname, {
        ids: [documentVector.vectorId],
        with_vector: true,
        with_payload: true,
      });

      if (vectorMatches.length === 0) {
        result = {
          message: `No vectors found with ID ${documentVector.vectorId}!`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }
      const qdrantVector = vectorMatches[0];

      const { length, valid } = validEmbedding(newText);
      if (length === 0 || !valid) {
        result = {
          message: `Text input valid tokenization pre-flight check.`,
          length,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      const config = await SystemSettings.get({ label: 'open_ai_api_key' });
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

      const existingMetadata = qdrantVector?.payload || {};
      const updatedMetadata = {
        ...existingMetadata,
        wordCount: newText.split(' ').length,
        token_count_estimate: length,
        text: newText,
      };

      await client.upsert(workspace.fname, {
        wait: true,
        batch: {
          ids: [documentVector.vectorId],
          vectors: [embedding],
          payloads: [updatedMetadata],
        },
      });

      await updateVectorCache({
        vectorId: documentVector.vectorId,
        cacheFilename: `${WorkspaceDocument.vectorFilename(document)}.json`,
        values: embedding,
        metadata: updatedMetadata,
      });
      result = {
        message: `Document ${document.id} with QDrant vector ${documentVector.vectorId} updated with newly embedded text.`,
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

const updateSingleWeaviateEmbedding = InngestClient.createFunction(
  { name: 'Update Single Embedding From Weaviate' },
  { event: 'weaviate/updateFragment' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documentVector, document, workspace, connector, newText, jobId } =
      event.data;
    try {
      const weaviateClient = new Weaviate(connector);
      const { client } = await weaviateClient.connect();
      const className = weaviateClient.camelCase(workspace.fname);
      const collection = await weaviateClient.namespaceExists(
        client,
        workspace.fname
      );

      if (!collection) {
        result = {
          message: `No collection found with name ${workspace.fname} (class: ${className}) - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      var queryResponse;
      try {
        queryResponse = await client.data
          .getterById()
          .withClassName(className)
          .withId(documentVector.vectorId)
          .do();
      } catch {}

      if (!queryResponse) {
        result = {
          message: `No vectors found with ID ${documentVector.vectorId}!`,
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

      const config = await SystemSettings.get({ label: 'open_ai_api_key' });
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

      const existingMetadata = queryResponse.properties || {};
      const updatedMetadata = weaviateClient.flattenObjectForWeaviate({
        ...existingMetadata,
        wordCount: newText.split(' ').length,
        token_count_estimate: length,
        text: newText,
      });

      // Weaviate TS-client cannot upsert vector data,
      // so we have to do a destroy-create process here to ensure IDs remain the same.
      // Since we are only doing a single vector - no need to batch.
      await client.data
        .deleter()
        .withClassName(className)
        .withId(queryResponse.id)
        .do();
      await client.data
        .creator()
        .withClassName(className)
        .withId(queryResponse.id)
        .withVector(embedding)
        .withProperties(updatedMetadata)
        .do();

      result = {
        message: `Document ${document.id} with Weaviate vector ${documentVector.vectorId} updated with newly embedded text.`,
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
  updateSingleQDrantEmbedding,
  updateSingleWeaviateEmbedding,
};
