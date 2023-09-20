require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { serve } = require("inngest/express");
const { InngestClient } = require("./utils/inngest");
const { syncChromaInstance } = require("./functions/syncChroma");
const { findOrCreateDBFile, setupFunctions } = require("./utils/boot");
const { reqBody } = require("./utils/http");
const { Queue } = require("../backend/models/queue");
const { deleteSingleChromaEmbedding, deleteSinglePineconeEmbedding } = require("./functions/deleteEmbedding");
const { updateSingleChromaEmbedding, updateSinglePineconeEmbedding } = require("./functions/updateEmbedding");
const { newWorkspaceCreated } = require("./functions/newWorkspace");
const { workspaceDeleted } = require("./functions/deleteWorkspace");
const { addChromaDocuments } = require("./functions/addChromaDocument");
const { deleteChromaDocument, deletePineconeDocument } = require("./functions/deleteDocument");
const { syncPineconeIndex } = require("./functions/syncPinecone");
const { addPineconeDocuments } = require("./functions/addPineconeDocument");
const { syncChromaWorkspace } = require("./functions/syncChromaWorkspace");
const { syncPineconeWorkspace } = require("./functions/syncPineconeWorkspace");
const { clonePineconeDocument } = require("./functions/clonePineconeDocument");
const { cloneChromaDocument } = require("./functions/cloneChromaDocument");
const { cloneChromaWorkspace } = require("./functions/cloneChromaWorkspace");
const { clonePineconeWorkspace } = require("./functions/clonePineconeWorkspace");
const { updateSinglePineconeEmbeddingMetadata, updateSingleChromaEmbeddingMetadata } = require("./functions/updateEmbeddingMetadata");
const { syncQDrantCluster } = require("./functions/syncQDrantCluster");
const { syncQDrantWorkspace } = require("./functions/syncQDrantWorkspace");
const { cloneQDrantWorkspace } = require("./functions/cloneQDrantWorkspace");
const { cloneQDrantDocument } = require("./functions/cloneQDrantDocument");
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
    syncChromaInstance,
    syncPineconeIndex,
    syncQDrantCluster,

    cloneChromaWorkspace,
    syncChromaWorkspace,

    clonePineconeWorkspace,
    syncPineconeWorkspace,

    cloneQDrantWorkspace,
    syncQDrantWorkspace,

    addChromaDocuments,
    addPineconeDocuments,
    //addQdrantDocuments,

    deleteChromaDocument,
    deleteSingleChromaEmbedding,
    updateSingleChromaEmbedding,
    updateSingleChromaEmbeddingMetadata,
    cloneChromaDocument,

    deletePineconeDocument,
    deleteSinglePineconeEmbedding,
    updateSinglePineconeEmbedding,
    updateSinglePineconeEmbeddingMetadata,
    clonePineconeDocument,

    // deleteQDrantDocument,
    // deleteSingleQDrantEmbedding,
    // updateSingleQDrantEmbedding,
    // updateSingleQDrantEmbeddingMetadata,
    cloneQDrantDocument,

    newWorkspaceCreated,
    workspaceDeleted,
  ], { landingPage: true })
);

app.get('/jobs', async function (_, response) {
  const completed = (await Queue.where(`status = '${Queue.status.complete}'`)).length;
  const pending = (await Queue.where(`status = '${Queue.status.pending}'`)).length;
  const failed = (await Queue.where(`status = '${Queue.status.failed}'`)).length;
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
    await findOrCreateDBFile();
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