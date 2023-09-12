const { DocumentVectors } = require("../../../models/documentVectors");
const { Organization } = require("../../../models/organization");
const {
  OrganizationConnection,
} = require("../../../models/organizationConnection");
const {
  OrganizationWorkspace,
} = require("../../../models/organizationWorkspace");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const {
  userFromSession,
  reqBody,
  validSessionForUser,
} = require("../../../utils/http");
const {
  updateEmbeddingJob,
} = require("../../../utils/jobs/updateEmbeddingJob");
const {
  createDeleteEmbeddingJob,
} = require("../../../utils/jobs/createDeleteEmbeddingJob");
const { readJSON } = require("../../../utils/storage");
const { validEmbedding } = require("../../../utils/tokenizer");
const { documentDeletedJob } = require("../../../utils/jobs/documentDeleteJob");
const { cloneDocumentJob } = require("../../../utils/jobs/cloneDocumentJob");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function documentEndpoints(app) {
  if (!app) return;

  app.get(
    "/v1/document/:id",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const document = await WorkspaceDocument.get(`id = ${id}`);
        response.status(200).json({ document });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/v1/document/:id",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const document = await WorkspaceDocument.get(`id = ${id}`);
        const organization = await Organization.get(
          `id = ${document.organization_id}`
        );
        const workspace = await OrganizationWorkspace.get(
          `id = ${document.workspace_id}`
        );
        const connector = await OrganizationConnection.get(
          `organization_id = ${organization.id}`
        );
        await documentDeletedJob(
          organization,
          workspace,
          document,
          connector,
          user
        );
        response.sendStatus(200).end();
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document/:id/fragments",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;

        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const offset = (page - 1) * pageSize;
        const fragments = await DocumentVectors.where(
          `document_id = ${id}`,
          pageSize,
          `OFFSET ${offset}`
        );

        const totalFragments = await DocumentVectors.count(
          `document_id = ${id}`
        );
        response.status(200).json({ fragments, totalFragments });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/:id/fragment",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const { newText } = reqBody(request);
        const { length, valid } = validEmbedding(newText);

        if (length === 0 || !valid) {
          response.status(412).json({
            success: false,
            error: "Invalid new text to embed for fragment.",
          });
          return;
        }

        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const fragment = await DocumentVectors.get(`id = ${id}`);
        if (!fragment) {
          response.sendStatus(404).end();
          return;
        }

        const document = await WorkspaceDocument.get(
          `id = ${fragment.document_id}`
        );
        const workspace = await OrganizationWorkspace.get(
          `id = ${document.workspace_id}`
        );
        const organization = await Organization.get(
          `id = ${document.organization_id}`
        );
        const connector = await OrganizationConnection.get(
          `organization_id = ${document.organization_id}`
        );
        await updateEmbeddingJob(
          fragment,
          document,
          organization,
          workspace,
          connector,
          user,
          newText
        );
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/v1/document/:id/fragment",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const fragment = await DocumentVectors.get(`id = ${id}`);
        if (!fragment) {
          response.sendStatus(404).end();
          return;
        }

        const document = await WorkspaceDocument.get(
          `id = ${fragment.document_id}`
        );
        const workspace = await OrganizationWorkspace.get(
          `id = ${document.workspace_id}`
        );
        const organization = await Organization.get(
          `id = ${document.organization_id}`
        );
        const connector = await OrganizationConnection.get(
          `organization_id = ${document.organization_id}`
        );
        await createDeleteEmbeddingJob(
          fragment,
          workspace,
          organization,
          connector,
          user
        );
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document/:id/source",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const document = await WorkspaceDocument.get(`id = ${id}`);
        const filepath = WorkspaceDocument.vectorFilepath(document);
        console.log(filepath);
        const source = await readJSON(filepath).then((res) => {
          const data = {};
          Object.values(res).map((d) => {
            data[d.vectorDbId] = { ...d };
          });
          return data;
        });
        response.status(200).json({ ...source });
      } catch (e) {
        console.log(e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/document/:id/clone",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { id } = request.params;
        const { toWorkspaceId } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const document = await WorkspaceDocument.get(`id = ${id}`);
        if (!document) {
          response
            .status(404)
            .json({ success: false, error: "Document does not exist" });
          return;
        }

        const workspace = await OrganizationWorkspace.get(
          `id = ${toWorkspaceId}`
        );
        if (!workspace) {
          response.status(404).json({
            success: false,
            error: "Destination workspace does not exist",
          });
          return;
        }

        const organization = await Organization.get(
          `id = ${workspace.organization_id}`
        );
        const connector = await OrganizationConnection.get(
          `organization_id = ${workspace.organization_id}`
        );
        if (!connector) {
          response.status(404).json({
            success: false,
            error: "Organization connector does not exist",
          });
          return;
        }

        await cloneDocumentJob(
          organization,
          workspace,
          document,
          connector,
          user
        );
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.log(e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { documentEndpoints };
