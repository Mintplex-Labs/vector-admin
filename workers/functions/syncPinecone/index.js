const {
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
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

const syncPineconeIndex = InngestClient.createFunction(
  { name: 'Sync Pinecone Instance' },
  { event: 'pinecone/sync' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, connector, jobId } = event.data;
    try {
      const pineconeClient = new Pinecone(connector);
      const collections = await pineconeClient.collections();

      if (collections.length === 0) {
        result = { message: 'No collections found - nothing to do.' };
        await Queue.updateJob(jobId, Queue.status.complete, result);
        return { result };
      }

      logger.info(
        `Deleting ALL existing workspaces for ${organization.name} and reseeding.`
      );
      await OrganizationWorkspace.deleteAllForOrganization(organization.id);

      for (const collection of collections) {
        logger.info(
          `Creating new workspace ${collection.name} for ${organization.name}`
        );
        const { workspace } = await OrganizationWorkspace.create(
          collection.name,
          organization.id
        );
        if (!workspace || collection.count === 0) continue;

        logger.info(
          `Working on ${collection.count} embeddings of ${collection.name}`
        );
        await paginateAndStore(
          pineconeClient,
          collection,
          workspace,
          organization
        );
      }

      result = {
        message:
          'Pinecone instance vector data has been synced. Previous workspaces were deleted.',
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
  const { pineconeIndex } = await pineconeClient.connect();
  const PAGE_SIZE = 1_000;
  var syncing = true;
  const files = {};

  while (syncing) {
    const {
      ids = [],
      embeddings = [],
      metadatas = [],
      documents = [],
    } = await pineconeClient.rawGet(
      pineconeIndex,
      collection.name,
      PAGE_SIZE,
      runId
    );
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
        metadatas[i].title ||
        metadatas[i].source?.split('/')?.at(-1) ||
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
  }

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
  const existingDocuments = await WorkspaceDocument.where(
    `docId IN (${docIds.map((id) => `'${id}'`).join(',')})`
  );
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
        documentId: dbDocument.id,
        docId: data.documentId,
        vectorId,
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
  syncPineconeIndex,
};
