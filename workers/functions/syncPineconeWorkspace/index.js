const { Queue } = require('../../../backend/models/queue');
const {
  Pinecone,
} = require('../../../backend/utils/vectordatabases/providers/pinecone');
const { InngestClient } = require('../../utils/inngest');
const { v4 } = require('uuid');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const { DocumentVectors } = require('../../../backend/models/documentVectors');
const { deleteVectorCacheFile } = require('../../../backend/utils/storage');
const { vectorSpaceMetric } = require('../../utils/telemetryHelpers');
const { Notification } = require('../../../backend/models/notification');

// Will sync ENTIRE workspace - from a fresh pull.
// Ideally we should only be creating/deleting documents which are not known to the system already.
const syncPineconeWorkspace = InngestClient.createFunction(
  { name: 'Sync Pinecone Workspace' },
  { event: 'pinecone/sync-workspace' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, workspace, connector, jobId } = event.data;
    try {
      const pineconeClient = new Pinecone(connector);
      const collection = await pineconeClient.namespace(workspace.fname);

      if (!collection) {
        result = {
          message: `No Pinecone namespace found for ${workspace.fname} - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.complete, result);
        return { result };
      }

      logger.info(
        `Syncing data for namespace ${collection.name} for ${organization.name}`
      );
      if (collection.count === 0) {
        result = {
          message: `Pinecone namespace ${workspace.fname} has no data- nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.complete, result);
        return { result };
      }

      logger.info(
        `Syncing on ${collection.count} embeddings of ${collection.name}`
      );
      await paginateAndStore(
        pineconeClient,
        collection,
        workspace,
        organization
      );

      result = {
        message:
          'Pinecone instance vector data has been synced. Workspace updated.',
      };

      await Notification.create(organization.id, {
        textContent: 'Your Pinecone namespace has been fully synced.',
        symbol: Notification.symbols.pinecone,
        link: `/dashboard/${organization.slug}/workspace/${workspace.fname}`,
        target: '_blank',
      });
      await Queue.updateJob(jobId, Queue.status.complete, result);
      await vectorSpaceMetric();
      return { result };
    } catch (e) {
      const result = {
        canRetry: true,
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Notification.create(organization.id, {
        textContent: 'Your Pinecone namespace failed to sync.',
        symbol: Notification.symbols.pinecone,
        link: `/dashboard/${organization.slug}/jobs`,
        target: '_blank',
      });
      await Queue.updateJob(jobId, Queue.status.failed, result);
    }
  }
);

async function paginateAndStore(
  pineconeClient,
  collection,
  workspace,
  organization
) {
  const runId = v4();
  const { pineconeIndex, host } = await pineconeClient.connect();
  const PAGE_SIZE = 1_000;
  var syncing = true;
  const files = {};

  while (syncing) {
    const {
      ids = [],
      embeddings = [],
      metadatas = [],
      documents = [],
      error = null,
    } = await pineconeClient.rawGet(host, collection.name, PAGE_SIZE, runId);

    if (error !== null) {
      syncing = false;
      throw error;
    }

    if (ids.length === 0) {
      syncing = false;
      continue;
    }

    // Since Pinecone does not support pagination we need to now go an update all the discovered ids
    // with some unique key <runId> in its metadata so on subsequent runs the same vectors are not discovered
    // again.
    await updateAllPineconeIds(pineconeIndex, collection.name, ids, runId);

    for (let i = 0; i < ids.length; i++) {
      const documentName =
        metadatas[i]?.title ||
        metadatas[i]?.name ||
        `imported-document-${v4()}.txt`;
      if (!files.hasOwnProperty(documentName)) {
        files[documentName] = {
          currentLine: 0,
          name: documentName,
          documentId: v4(),
          cacheFilename: `${WorkspaceDocument.vectorFilenameRaw(
            documentName,
            workspace.id
          )}.json`,
          ids: [],
          embeddings: [],
          metadatas: [],
          fullText: '',
        };
      }
      const text = documents[i];
      const totalLines = (String(text).match(/\n/g) || '').length;
      files[documentName].ids.push(ids[i]);
      files[documentName].embeddings.push(embeddings[i]);
      files[documentName].metadatas.push({
        title: documentName,
        'loc.lines.from': files[documentName].currentLine + 1,
        'loc.lines.to': files[documentName].currentLine + 1 + totalLines,
        ...metadatas[i],
        text,
      });
      files[documentName].fullText += text;
      files[documentName].currentLine =
        files[documentName].currentLine + 1 + totalLines;
    }

    // When on the free starter tier upserts can be delayed anywhere from 10 - 60 seconds.
    // So we need to sleep for this entire loop to ensure the RunID was saved + indexed.
    // Ref: https://docs.pinecone.io/docs/starter-environment#limitations
    if (pineconeClient.isStarterTier()) {
      console.log(
        `\x1b[34m[Sync Notice]\x1b[0m Pinecone Starter Tier detected - need to sleep ${pineconeClient.STARTER_TIER_UPSERT_DELAY}ms between upserts.`,
        {
          pineconeDocsLink:
            'https://docs.pinecone.io/docs/starter-environment#limitations',
        }
      );
      await new Promise((r) =>
        setTimeout(r, pineconeClient.STARTER_TIER_UPSERT_DELAY)
      );
    }
  }

  console.log('Removing existing Workspace Documents & Document Vectors');
  const documents = await WorkspaceDocument.where({
    workspace_id: Number(workspace.id),
  });
  for (const document of documents) {
    const digestFilename = WorkspaceDocument.vectorFilename(document);
    await deleteVectorCacheFile(digestFilename);
  }
  await WorkspaceDocument.delete({ workspace_id: Number(workspace.id) });
  console.log(
    `Removed ${documents.length} existing Workspace Documents & Document Vectors`
  );

  console.log('Creating Workspace Documents & Document Vectors');
  await createDocuments(files, workspace, organization);
  await createDocumentVectors(files);

  for (const fileKey of Object.keys(files)) {
    console.log('Creating vector cache for ', fileKey);
    await saveVectorCache(files[fileKey]);
  }

  return;
}

// Here we take a RunID - which is a unique value that we can append or upsert on each vector id.
// Since Pinecone does not support a bulk update we queue up all the modified ids and then
// send them "concurrently" at once so they are not stuck in sequential execution.
// Maybe this should be a node worker for true multi-threading? Or Maybe Pinecone can add in this simple feature to the API.
// Who knows.
async function updateAllPineconeIds(pineconeIndex, namespace, ids = [], runId) {
  if (ids.length === 0) return;

  console.log(`Updating ${ids.length} Pinecone vectors with runID: ${runId}`);
  const items = ids.map((id) => {
    return new Promise((resolve) => {
      const updateRequest = {
        id,
        namespace,
        setMetadata: {
          runId,
        },
      };
      pineconeIndex
        .update({ updateRequest })
        .then(() => resolve(true))
        .catch(() => resolve(true));
    });
  });

  await Promise.all(items);
  return true;
}

async function createDocuments(files, workspace, organization) {
  const documents = [];
  Object.values(files).map((data) => {
    documents.push({
      documentId: data.documentId,
      name: data.name,
      workspaceId: workspace.id,
      organizationId: organization.id,
    });
  });

  await WorkspaceDocument.createMany(documents);
  return;
}

async function createDocumentVectors(files) {
  const docIds = Object.values(files).map((data) => data.documentId);
  const existingDocuments = await WorkspaceDocument.where({
    docId: { in: docIds },
  });
  const vectors = [];

  Object.values(files).map((data) => {
    const dbDocument = existingDocuments.find(
      (doc) => doc.docId === data.documentId
    );
    if (!dbDocument) {
      console.error(
        'Could not find a database workspace document for ',
        data.documentId
      );
      return;
    }

    data.ids.map((vectorId) => {
      vectors.push({
        docId: data.documentId,
        vectorId,
        documentId: dbDocument.id,
        workspaceId: dbDocument.workspace_id,
        organizationId: dbDocument.organization_id,
      });
    });
  });

  await DocumentVectors.createMany(vectors);
  return;
}

async function saveVectorCache(data) {
  const fs = require('fs');
  const folder = path.resolve(
    __dirname,
    '../../../backend/storage/vector-cache'
  );
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const destination = path.resolve(
    __dirname,
    `../../../backend/storage/vector-cache/${data.cacheFilename}`
  );
  const toSave = [];
  for (let i = 0; i < data.ids.length; i++) {
    toSave.push({
      vectorDbId: data.ids[i],
      values: data.embeddings[i],
      metadata: data.metadatas[i],
    });
  }
  fs.writeFileSync(destination, JSON.stringify(toSave), 'utf8');
  return;
}

module.exports = {
  syncPineconeWorkspace,
};
