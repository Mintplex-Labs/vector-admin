require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { serve } = require("inngest/express");
const { InngestClient } = require("./utils/inngest");
const { syncChromaInstance } = require("./functions/syncChroma");
const { setupFunctions } = require("./utils/boot");
const { reqBody } = require("./utils/http");
const { Queue } = require("../backend/models/queue");
const { deleteSingleChromaEmbedding, deleteSinglePineconeEmbedding, deleteSingleQDrantEmbedding, deleteSingleWeaviateEmbedding } = require("./functions/deleteEmbedding");
const { updateSingleChromaEmbedding, updateSinglePineconeEmbedding, updateSingleQDrantEmbedding, updateSingleWeaviateEmbedding } = require("./functions/updateEmbedding");
const { newWorkspaceCreated } = require("./functions/newWorkspace");
const { workspaceDeleted } = require("./functions/deleteWorkspace");
const { addChromaDocuments } = require("./functions/addChromaDocument");
const { deleteChromaDocument, deletePineconeDocument, deleteQdrantDocument, deleteWeaviateDocument } = require("./functions/deleteDocument");
const { syncPineconeIndex } = require("./functions/syncPinecone");
const { addPineconeDocuments } = require("./functions/addPineconeDocument");
const { syncChromaWorkspace } = require("./functions/syncChromaWorkspace");
const { syncPineconeWorkspace } = require("./functions/syncPineconeWorkspace");
const { clonePineconeDocument } = require("./functions/clonePineconeDocument");
const { cloneChromaDocument } = require("./functions/cloneChromaDocument");
const { cloneChromaWorkspace } = require("./functions/cloneChromaWorkspace");
const { clonePineconeWorkspace } = require("./functions/clonePineconeWorkspace");
const { updateSinglePineconeEmbeddingMetadata, updateSingleChromaEmbeddingMetadata, updateSingleQDrantEmbeddingMetadata, updateSingleWeaviateEmbeddingMetadata } = require("./functions/updateEmbeddingMetadata");
const { syncQDrantCluster } = require("./functions/syncQDrantCluster");
const { syncQDrantWorkspace } = require("./functions/syncQDrantWorkspace");
const { cloneQDrantWorkspace } = require("./functions/cloneQDrantWorkspace");
const { cloneQDrantDocument } = require("./functions/cloneQDrantDocument");
const { addQdrantDocuments } = require("./functions/addQdrantDocuments");
const { syncWeaviateCluster } = require("./functions/syncWeaviateCluster");
const { syncWeaviateWorkspace } = require("./functions/syncWeaviateWorkspace");
const { cloneWeaviateWorkspace } = require("./functions/cloneWeaviateWorkspace");
const { cloneWeaviateDocument } = require("./functions/cloneWeaviateDocument");
const { addWeaviateDocuments } = require("./functions/addWeaviateDocuments");
const { migrateOrganization } = require("./functions/migrateOrganization");
const { resetOrganization } = require("./functions/resetOrganization");
const { runRAGTest } = require("./functions/runRAGTest");
const app = express();

app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: '10GB' }));
app.use(bodyParser.json({ limit: '10GB' }));
app.use(
  bodyParser.urlencoded({
    limit: '10GB',
    extended: true,
  })
);

// Documentation https://www.inngest.com/docs
app.use(
  "/background-workers",
  serve(InngestClient, [
    // Chroma Functions
    syncChromaInstance,
    cloneChromaWorkspace,
    syncChromaWorkspace,
    addChromaDocuments,
    deleteChromaDocument,
    deleteSingleChromaEmbedding,
    updateSingleChromaEmbedding,
    updateSingleChromaEmbeddingMetadata,
    cloneChromaDocument,

    // Pinecone
    syncPineconeIndex,
    clonePineconeWorkspace,
    syncPineconeWorkspace,
    addPineconeDocuments,
    deletePineconeDocument,
    deleteSinglePineconeEmbedding,
    updateSinglePineconeEmbedding,
    updateSinglePineconeEmbeddingMetadata,
    clonePineconeDocument,

    // QDrant
    syncQDrantCluster,
    cloneQDrantWorkspace,
    syncQDrantWorkspace,
    addQdrantDocuments,
    deleteQdrantDocument,
    deleteSingleQDrantEmbedding,
    updateSingleQDrantEmbedding,
    updateSingleQDrantEmbeddingMetadata,
    cloneQDrantDocument,

    // Weaviate
    syncWeaviateCluster,
    cloneWeaviateWorkspace,
    syncWeaviateWorkspace,
    addWeaviateDocuments,
    deleteWeaviateDocument,
    deleteSingleWeaviateEmbedding,
    updateSingleWeaviateEmbedding,
    updateSingleWeaviateEmbeddingMetadata,
    cloneWeaviateDocument,

    // Generics
    newWorkspaceCreated,
    workspaceDeleted,
    migrateOrganization,
    resetOrganization,

    // RAGTesting
    runRAGTest,
  ], { landingPage: true })
);

app.get('/jobs', async function (_, response) {
  const completed = (await Queue.where({ status: Queue.status.complete })).length;
  const pending = (await Queue.where({ status: Queue.status.pending })).length;
  const failed = (await Queue.where({ status: Queue.status.failed })).length;
  response.status(200).send(`${completed + pending + failed} jobs processed.\n${completed} completed.\n${pending} pending.\n${failed} failed.`);
})

app.post('/send', async function (request, response) {
  try {
    const body = reqBody(request)
    InngestClient.setEventKey(process.env.INNGEST_EVENT_KEY || 'background_workers')
    await InngestClient.send(body);
    response.sendStatus(200).end();
  } catch (e) {
    console.error(e)
    response.sendStatus(500).end();
  }
})

app
  .listen(process.env.WORKERS_PORT || 3355, async () => {
    await setupFunctions();
    console.log(
      `Background workers listening on port ${process.env.WORKERS_PORT || 3355}`
    );
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[34m[Developer Notice]\x1b[0m Run npx inngest-cli@latest dev -u http://127.0.0.1:${process.env.WORKERS_PORT || 3355}/background-workers to debug events for workers or visit http://127.0.0.1:${process.env.WORKERS_PORT || 3355}/background-workers`);
    }
  })
  .on("error", function (err) {
    process.once("SIGUSR2", function () {
      process.kill(process.pid, "SIGUSR2");
    });
    process.on("SIGINT", function () {
      process.kill(process.pid, "SIGINT");
    });
  });