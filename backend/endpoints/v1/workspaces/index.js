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
const { setupMulter } = require("../../..//utils/files/multer");
const { DocumentProcessor } = require("../../../models/documentProcessor");
const { addDocumentJob } = require("../../../utils/jobs/addDocumentsJob");
const {
  workspaceDeletedJob,
} = require("../../../utils/jobs/workspaceDeletedJob");
const { newWorkspaceJob } = require("../../../utils/jobs/newWorkspaceJob");
const {
  createWorkspaceSyncJob,
} = require("../../../utils/jobs/createWorkspaceSyncJob");
const { cloneWorkspaceJob } = require("../../../utils/jobs/cloneWorkspaceJob");
const {
  workspaceDocumentSearch,
} = require("../../../utils/search/workspaceDocuments");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function workspaceEndpoints(app) {
  if (!app) return;
  const { handleUploads } = setupMulter();

  app.post(
    "/v1/org/:orgSlug/new-workspace",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug } = request.params;
        const { workspaceName } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${orgSlug}'`
        );
        if (!organization) {
          response
            .status(200)
            .json({ workspace: null, error: "No org by that slug." });
          return;
        }

        const connector = await OrganizationConnection.get(
          `organization_id = ${organization.id}`
        );
        if (!connector) {
          response.status(200).json({
            workspace: null,
            error:
              "You need to connect to a vector database before doing this.",
          });
          return;
        }

        const { workspace, message: error } =
          await OrganizationWorkspace.safeCreate(
            workspaceName,
            organization.id,
            connector
          );
        await newWorkspaceJob(organization, workspace, connector, user);
        response.status(200).json({ workspace, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/org/:orgSlug/import-workspace",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug } = request.params;
        const { workspaceName } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${orgSlug}'`
        );
        if (!organization) {
          response
            .status(200)
            .json({ workspace: null, error: "No org by that slug." });
          return;
        }

        const connector = await OrganizationConnection.get(
          `organization_id = ${organization.id}`
        );
        if (!connector) {
          response.status(200).json({
            workspace: null,
            error:
              "You need to connect to a vector database before doing this.",
          });
          return;
        }

        const { workspace, message: error } =
          await OrganizationWorkspace.create(workspaceName, organization.id);
        await createWorkspaceSyncJob(organization, workspace, connector, user);
        response.status(200).json({ workspace, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:orgSlug/workspace/:wsSlug",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug, wsSlug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${orgSlug}'`
        );
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        const workspace = await OrganizationWorkspace.get(`slug = '${wsSlug}'`);
        response.status(200).json({ workspace, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/v1/org/:orgSlug/workspace/:wsSlug",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug, wsSlug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${orgSlug}'`
        );
        if (!organization) {
          response
            .status(200)
            .json({ workspace: null, error: "No org by that slug." });
          return;
        }

        const workspace = await OrganizationWorkspace.get(`slug = '${wsSlug}'`);
        if (!workspace) {
          response
            .status(200)
            .json({ workspace: null, error: "No workspace by that slug." });
          return;
        }

        const documents = await WorkspaceDocument.where(
          `workspace_id = ${workspace.id}`
        );
        await OrganizationWorkspace.delete(`id = ${workspace.id}`);

        const connector = await OrganizationConnection.get(
          `organization_id = ${organization.id}`
        );
        await workspaceDeletedJob(
          organization,
          workspace,
          connector,
          documents,
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
    "/v1/org/:orgSlug/workspace/:wsSlug/documents",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug, wsSlug } = request.params;
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${orgSlug}'`
        );
        const workspace = await OrganizationWorkspace.get(
          `slug = '${wsSlug}' AND organization_id = ${organization.id}`
        );
        if (!organization || !workspace) {
          response
            .status(200)
            .json({ organization: null, error: "No  org found." });
          return;
        }

        const documents = await WorkspaceDocument.where(
          `organization_id = ${organization.id} AND workspace_id = ${workspace.id}`,
          pageSize,
          (page - 1) * pageSize,
          true
        );
        const totalDocuments = await WorkspaceDocument.count(
          `organization_id = ${organization.id} AND workspace_id = ${workspace.id}`
        );
        response.status(200).json({ documents, totalDocuments });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/workspace/:workspaceSlug/statistics/:statistic",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug, workspaceSlug, statistic } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.status(200).json({ value: null });
          return;
        }

        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${slug}'`
        );
        const workspace = await OrganizationWorkspace.bySlugAndOrg(
          workspaceSlug,
          organization.id
        );
        if (!organization || !workspace) {
          response
            .status(200)
            .json({ organization: null, error: "No org or workspace found." });
          return;
        }

        const methods = {
          documents: "countForEntity",
          vectors: "calcVectors",
          "cache-size": "calcVectorCache",
        };

        if (!Object.keys(methods).includes(statistic)) {
          response
            .status(200)
            .json({ value: null, error: "Invalid statistic." });
          return;
        }

        const value = await WorkspaceDocument[methods[statistic]](
          "workspace_id",
          workspace.id,
          workspace.slug
        );
        response.status(200).json({ value });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/org/:slug/workspace/:workspaceSlug/upload",
    handleUploads.single("file"),
    async function (request, response) {
      const { slug, workspaceSlug } = request.params;
      const { originalname } = request.file;
      const processingOnline = await DocumentProcessor.status();

      if (!processingOnline) {
        response.status(500).json({
          success: false,
          error: `Python processing API is not online. Document ${originalname} will not be processed automatically.`,
        });
        return;
      }

      const {
        success,
        reason,
        metadata = [],
      } = await DocumentProcessor.prepareForEmbed(originalname);
      if (!success) {
        response.status(500).json({ success: false, error: reason });
        return false;
      }

      try {
        const user = await userFromSession(request);
        const organization = await Organization.get(`slug = '${slug}'`);
        const workspace = await OrganizationWorkspace.get(
          `slug = '${workspaceSlug}' AND organization_id = ${organization.id}`
        );
        const connector = await OrganizationConnection.get(
          `organization_id = ${organization.id}`
        );
        await addDocumentJob(
          metadata,
          organization,
          workspace,
          connector,
          user
        );
      } catch (e) {
        console.error(e.message);
        response.status(500).json({ success: false, error: e.message });
        return;
      }

      response.status(200).json({ success: true, error: null });
    }
  );

  app.post(
    "/v1/org/:slug/workspace/:workspaceSlug/clone",
    handleUploads.single("file"),
    async function (request, response) {
      try {
        const { slug, workspaceSlug } = request.params;
        const { newWorkspaceName } = reqBody(request);

        const user = await userFromSession(request);
        const organization = await Organization.get(`slug = '${slug}'`);
        const workspace = await OrganizationWorkspace.get(
          `slug = '${workspaceSlug}' AND organization_id = ${organization.id}`
        );
        const connector = await OrganizationConnection.get(
          `organization_id = ${organization.id}`
        );

        await cloneWorkspaceJob(
          organization,
          workspace,
          connector,
          newWorkspaceName,
          user
        );
      } catch (e) {
        console.error(e.message);
        response.status(500).json({ success: false, error: e.message });
        return;
      }

      response.status(200).json({ success: true, error: null });
    }
  );

  app.get(
    "/v1/org/:slug/connector/:connectorId/sync/:workspaceSlug",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug, workspaceSlug, connectorId } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const connector = await OrganizationConnection.get(
          `id = ${connectorId}`
        );
        const organization = await Organization.getWithOwner(
          user.id,
          `slug = '${slug}'`
        );
        const workspace = await OrganizationWorkspace.bySlugAndOrg(
          workspaceSlug,
          organization.id
        );
        if (!organization || !connector || !workspace) {
          response.status(200).json({
            organization: null,
            error: "No org or connector for org found.",
          });
          return;
        }

        const { job, error } = await createWorkspaceSyncJob(
          organization,
          workspace,
          connector,
          user
        );
        response.status(200).json({ job, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/workspace/:workspaceId/search-documents",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { workspaceId } = request.params;
        const { method, q: query } = request.query;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const workspace = await OrganizationWorkspace.get(
          `id = ${workspaceId}`
        );
        if (!workspace) {
          response.status(200).json({
            documents: [],
            error: "No workspace found.",
          });
          return;
        }

        const { documents, error } = await workspaceDocumentSearch(
          workspace,
          method,
          query
        );
        response.status(200).json({ documents, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { workspaceEndpoints };
