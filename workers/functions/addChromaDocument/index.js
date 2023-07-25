const { Queue } = require('../../../backend/models/queue');
const {
  Chroma,
} = require('../../../backend/utils/vectordatabases/providers/chroma');
const { InngestClient } = require('../../utils/inngest');
const { SystemSettings } = require('../../../backend/models/systemSettings');
const {
  WorkspaceDocument,
} = require('../../../backend/models/workspaceDocument');

const addChromaDocuments = InngestClient.createFunction(
  { name: 'Add and Embed documents into ChromaDB' },
  { event: 'chroma/addDocument' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { documents, organization, workspace, connector, jobId } = event.data;

    try {
      const openAiSetting = await SystemSettings.get(
        `label = 'open_ai_api_key'`
      );
      if (!openAiSetting) {
        result = {
          message: `No OpenAI Key set for instance to be used for embedding - aborting`,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        return { result };
      }

      for (const document of documents) {
        const exists = await WorkspaceDocument.get(
          `name = '${document.title}' AND workspace_id = ${workspace.id}`
        );
        if (exists) {
          result.files = {
            [document.title]: { skipped: true },
          };
          continue;
        }

        const { document: dbDocument, message: dBInsertResponse } =
          await WorkspaceDocument.create({
            id: document.id,
            name: document.title,
            workspaceId: workspace.id,
            organizationId: organization.id,
          });

        if (!dbDocument) {
          result = {
            message: `Failed to create document ${document.id} ${document.title} - aborting`,
            dBInsertResponse,
          };
          await Queue.updateJob(jobId, Queue.status.failed, result);
          return { result };
        }

        const chroma = new Chroma(connector);
        const { success, message: insertResponse } =
          await chroma.processDocument(
            workspace.slug,
            document,
            openAiSetting.value,
            dbDocument
          );
        if (!success) await WorkspaceDocument.delete(dbDocument.id);
        result.files = {
          [document.title]: {
            skipped: false,
            createStatus: success,
            message: insertResponse,
          },
        };
      }

      result = { ...result, message: `Document processing complete` };
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

module.exports = {
  addChromaDocuments,
};
