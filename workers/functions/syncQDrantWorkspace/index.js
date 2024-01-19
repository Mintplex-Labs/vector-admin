const { Queue } = require('../../../backend/models/queue');
const { InngestClient } = require('../../utils/inngest');
const { v4 } = require('uuid');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const { DocumentVectors } = require('../../../backend/models/documentVectors');
const { deleteVectorCacheFile } = require('../../../backend/utils/storage');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const { vectorSpaceMetric } = require('../../utils/telemetryHelpers');
const { Notification } = require('../../../backend/models/notification');

const syncQDrantWorkspace = InngestClient.createFunction(
  { name: 'Sync QDrant Workspace' },
  { event: 'qdrant/sync-workspace' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, workspace, connector, jobId } = event.data;
    try {
      const qdrantClient = new QDrant(connector);
      const { client } = await qdrantClient.connect();
      const collection = await qdrantClient.namespaceWithClient(
        client,
        workspace.fname
      );

      if (!collection) {
        result = {
          message: `No collection ${workspace.fname} found - nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.complete, result);
        return { result };
      }

      if (collection.vectorCount === 0) {
        result = {
          message: `QDrant collection ${workspace.fname} has no data- nothing to do.`,
        };
        await Queue.updateJob(jobId, Queue.status.complete, result);
        return { result };
      }

      logger.info(
        `Working on ${collection.count} embeddings of ${collection.name}`
      );
      await paginateAndStore(client, collection, workspace, organization);

      result = {
        message:
          'QDrant instance vector data has been synced. Workspaces data synced.',
      };

      await Notification.create(organization.id, {
        textContent: 'Your QDrant namespace has been fully synced.',
        symbol: Notification.symbols.qdrant,
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
        textContent: 'Your QDrant namespace failed to sync.',
        symbol: Notification.symbols.qdrant,
        link: `/dashboard/${organization.slug}/jobs`,
        target: '_blank',
      });
      await Queue.updateJob(jobId, Queue.status.failed, result);
    }
  }
);

async function paginateAndStore(client, collection, workspace, organization) {
  const PAGE_SIZE = 10;
  var syncing = true;
  var offset = 0;
  const files = {};

  while (syncing) {
    const { points, next_page_offset } = await client.scroll(collection.name, {
      limit: PAGE_SIZE,
      offset,
      with_payload: true,
      with_vector: true,
    });

    // If nothing to do - exit loop early
    if (points.length === 0) {
      syncing = false;
      continue;
    }

    // No offset means we are on the last page - so don't loop again after this
    // iteration.
    if (next_page_offset === null) syncing = false;

    // Normalize QDrant points into vectors with known keys.
    const data = {
      ids: [],
      embeddings: [],
      metadatas: [],
      documents: [],
    };
    points.forEach((point) => {
      const { id, vector = [], payload = {} } = point;
      data.ids.push(id);
      data.embeddings.push(vector);
      data.metadatas.push(payload);
      data.documents.push(payload?.text ?? '');
    });

    const { ids, metadatas, embeddings, documents } = data;
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

    offset = next_page_offset;
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
  syncQDrantWorkspace,
};
