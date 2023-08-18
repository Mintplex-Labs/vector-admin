const {
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const { InngestClient } = require('../../utils/inngest');
const { v4, v5 } = require('uuid');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const { DocumentVectors } = require('../../../backend/models/documentVectors');

const syncChromaInstance = InngestClient.createFunction(
  { name: 'Sync Chroma Instance' },
  { event: 'chroma/sync' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, connector, jobId } = event.data;
    try {
      const failedToSync = [];
      const chromaClient = new Chroma(connector);
      const collections = await chromaClient.collections();

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

        try {
          await paginateAndStore(
            chromaClient,
            collection,
            workspace,
            organization
          );
        } catch (e) {
          logger.error(
            `Failed to paginate records for ${collection.name} - workspace will remain in db but may be incomplete.`,
            e
          );
          failedToSync.push({
            namespace: collection.name,
            reason: e.message,
          });
        }
      }

      result = {
        message: `Chroma instance vector data has been synced for ${
          collections.length
        } of ${collections.length - failedToSync.length} collections.`,
        failedToSync,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    } catch (e) {
      const result = {
        canRetry: true,
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await Queue.updateJob(jobId, Queue.status.failed, result);
    }
  }
);

async function paginateAndStore(
  chromaClient,
  collection,
  workspace,
  organization
) {
  const PAGE_SIZE = 10;
  var syncing = true;
  var offset = 0;
  const files = {};

  while (syncing) {
    const {
      ids = [],
      embeddings = [],
      metadatas = [],
      documents = [],
      error = null,
    } = await chromaClient.rawGet(collection.id, PAGE_SIZE, offset);

    if (error !== null) {
      syncing = false;
      throw error;
    }

    if (ids.length === 0) {
      syncing = false;
      continue;
    }

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

    offset += PAGE_SIZE;
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
  syncChromaInstance,
};
