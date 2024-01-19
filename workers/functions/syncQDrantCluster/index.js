const {
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
const { Queue } = require('../../../backend/models/queue');
const { InngestClient } = require('../../utils/inngest');
const { v4 } = require('uuid');
const path = require('path');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');
const { DocumentVectors } = require('../../../backend/models/documentVectors');
const {
  QDrant,
} = require('../../../backend/utils/vectordatabases/providers/qdrant');
const { vectorSpaceMetric } = require('../../utils/telemetryHelpers');
const { Notification } = require('../../../backend/models/notification');

const syncQDrantCluster = InngestClient.createFunction(
  { name: 'Sync Qdrant Instance' },
  { event: 'qdrant/sync' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, connector, jobId } = event.data;
    try {
      const failedToSync = [];
      const qdrantClient = new QDrant(connector);
      const collections = await qdrantClient.collections();

      if (collections.length === 0) {
        result = { message: 'No collections found - nothing to do.' };
        await Queue.updateJob(jobId, Queue.status.complete, result);
        return { result };
      }

      logger.info(
        `Deleting ALL existing workspaces for ${organization.name} and reseeding.`
      );
      await OrganizationWorkspace.delete({
        organization_id: Number(organization.id),
      });

      for (const collection of collections) {
        logger.info(
          `Creating new workspace ${collection.name} for ${organization.name}`
        );
        const { workspace } = await OrganizationWorkspace.create(
          collection.name,
          organization.id
        );
        if (!workspace || collection.vectorCount === 0) continue;

        logger.info(
          `Working on ${collection.vectorCount} embeddings of ${collection.name}`
        );

        try {
          await paginateAndStore(
            qdrantClient,
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
        message: `Qdrant instance vector data has been synced for ${
          collections.length
        } of ${collections.length - failedToSync.length} collections.`,
        failedToSync,
      };

      await Notification.create(organization.id, {
        textContent: 'Your QDrant cluster has been fully synced.',
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
        textContent: 'Your QDrant cluster failed to sync.',
        symbol: Notification.symbols.qdrant,
        link: `/dashboard/${organization.slug}/jobs`,
        target: '_blank',
      });
      await Queue.updateJob(jobId, Queue.status.failed, result);
    }
  }
);

async function paginateAndStore(
  qdrantClient,
  collection,
  workspace,
  organization
) {
  const PAGE_SIZE = 10;
  var syncing = true;
  var offset = 0;
  const files = {};
  const { client } = await qdrantClient.connect();

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
  syncQDrantCluster,
};
