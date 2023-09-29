const { Organization } = require("../../../models/organization");
const { OrganizationApiKey } = require("../../../models/organizationApiKey");
const {
  OrganizationConnection,
} = require("../../../models/organizationConnection");
const {
  OrganizationWorkspace,
} = require("../../../models/organizationWorkspace");
const { Queue } = require("../../../models/queue");
const { User } = require("../../../models/user");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const {
  reqBody,
  userFromSession,
  validSessionForUser,
} = require("../../../utils/http");
const { createSyncJob } = require("../../../utils/jobs/createSyncJob");
const { deleteVectorCacheFile } = require("../../../utils/storage");
const { selectConnector } = require("../../../utils/vectordatabases/providers");
const {
  validateNewDatabaseConnector,
} = require("../../../utils/vectordatabases/validateNewDatabaseConnector");
const {
  validateUpdatedDatabaseConnector,
} = require("../../../utils/vectordatabases/validateUpdatedDatabaseConnector");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function organizationEndpoints(app) {
  if (!app) return;

  app.post(
    "/v1/org/create",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgName } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const { organization, message } = await Organization.create(
          orgName,
          user.id
        );
        if (!organization) {
          response.status(200).json({
            organization: null,
            error: message ?? "Failed to create organization.",
          });
          return;
        }

        response.status(200).json({ organization, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/orgs",
    [validSessionForUser],
    async function (request, response) {
      try {
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }
        const organizations = await Organization.whereWithOwner(
          user.id,
          {},
          null,
          { createdAt: "asc" }
        );
        response.status(200).json({ organizations, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/orgs/all",
    [validSessionForUser],
    async function (request, response) {
      try {
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }
        const organizations = await Organization.where({});
        response.status(200).json({ organizations, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }
        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        response.status(200).json({ organization, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/org/:slug",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const { updates = {} } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }
        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ success: false, error: "No org by that slug." });
          return;
        }

        const updateResponse = await Organization.update(
          organization.id,
          updates
        );
        response.status(200).json(updateResponse);
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/api-key",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        const apiKey = await OrganizationApiKey.get({
          organization_id: Number(organization.id),
        });
        if (!apiKey) {
          response.status(200).json({
            organization: null,
            error: "No api key for that organization.",
          });
          return;
        }

        response.status(200).json({ apiKey, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/connection",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        const connector = await OrganizationConnection.get({
          organization_id: Number(organization.id),
        });
        if (!connector) {
          response.status(200).json({
            connector: null,
            error: "No data connector for that organization.",
          });
          return;
        }

        response.status(200).json({ connector, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/org/:slug/add-connection",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const { config } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        const connector = await OrganizationConnection.get({
          organization_id: Number(organization.id),
        });
        if (!!connector) {
          response.status(200).json({
            connector: null,
            error: "Vector database connector already exists for organization.",
          });
          return;
        }

        const result = await validateNewDatabaseConnector(organization, config);
        response.status(200).json(result);
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/org/:slug/update-connection",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const { config } = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        const connector = await OrganizationConnection.get({
          organization_id: Number(organization.id),
        });
        if (!connector) {
          response.status(200).json({
            connector: null,
            error: "No Vector database connector exists for organization.",
          });
          return;
        }

        const result = await validateUpdatedDatabaseConnector(
          connector,
          config
        );
        response.status(200).json(result);
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/org/:slug/connector/:command",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug, command } = request.params;
        const body = reqBody(request);
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org by that slug." });
          return;
        }

        const connector = await OrganizationConnection.get({
          organization_id: Number(organization.id),
        });
        if (!connector) {
          response.status(200).json({
            connector: null,
            error: "No Vector database connector exists for organization.",
          });
          return;
        }

        const VectorDb = selectConnector(connector);
        const { result, error } = await VectorDb[command](body);
        response.status(200).json({ result, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/connector/:connectorId/sync",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug, connectorId } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const connector = await OrganizationConnection.get({
          id: Number(connectorId),
        });
        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization || !connector) {
          response.status(200).json({
            organization: null,
            error: "No org or connector for org found.",
          });
          return;
        }

        const { job, error } = await createSyncJob(
          organization,
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
    "/v1/org/:slug/workspaces/search",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;
        const includeSlugs = request.query.includeSlugs?.split(",") || [];
        const searchTerm = request.query.searchTerm || "";

        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org found." });
          return;
        }

        const workspacesResults = await OrganizationWorkspace.forOrganization(
          organization.id,
          page,
          pageSize,
          includeSlugs,
          searchTerm
        );

        const totalWorkspaces = workspacesResults.length;

        response.status(200).json({ workspacesResults, totalWorkspaces });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/workspaces",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;
        const includeSlugs = request.query.includeSlugs?.split(",") || [];

        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No  org found." });
          return;
        }

        const workspaces = await OrganizationWorkspace.forOrganization(
          organization.id,
          page,
          pageSize,
          includeSlugs
        );

        const totalWorkspaces = await OrganizationWorkspace.count({
          organization_id: Number(organization.id),
        });
        response.status(200).json({ workspaces, totalWorkspaces });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/jobs",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No  org found." });
          return;
        }

        const jobs = await Queue.where(
          { organization_id: Number(organization.id) },
          null,
          { createdAt: "desc" }
        );
        for (const job of jobs) {
          const { id, email, role } = await User.get({
            id: Number(job.run_by_user_id),
          });
          job.run_by_user_id = { id, email, role };
        }
        response.status(200).json({ jobs });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/documents",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;

        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No org found." });
          return;
        }

        const documents = await WorkspaceDocument.where(
          { organization_id: Number(organization.id) },
          pageSize,
          (page - 1) * pageSize,
          true
        );

        const totalDocuments = await WorkspaceDocument.count({
          organization_id: Number(organization.id),
        });
        response.status(200).json({ documents, totalDocuments });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/statistics/:statistic",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug, statistic } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.status(200).json({ value: null });
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response
            .status(200)
            .json({ organization: null, error: "No  org found." });
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
          "organization_id",
          organization.id
        );
        response.status(200).json({ value });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/org/:slug/namespace-search",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { slug } = request.params;
        const namespace = String(request.query?.name) || null;

        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        if (!namespace || !namespace?.length) {
          response
            .status(200)
            .json({ match: null, error: "No namespace query found." });
          return;
        }

        const organization = await Organization.getWithOwner(user.id, { slug });
        if (!organization) {
          response.status(200).json({ match: null, error: "No org found." });
          return;
        }

        const connector = await OrganizationConnection.get({
          organization_id: Number(organization.id),
        });
        if (!connector) {
          response
            .status(200)
            .json({ match: null, error: "No connector found." });
          return;
        }

        const vectorDb = selectConnector(connector);
        const existsInVectorDB = await vectorDb.namespace(namespace);
        const existingInVdbms = await OrganizationWorkspace.bySlugAndOrg(
          namespace,
          organization.id
        );
        const exists = existsInVectorDB && !existingInVdbms;
        response
          .status(200)
          .json({ match: exists ? namespace : null, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/v1/org/:orgSlug",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug } = request.params;
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, {
          slug: orgSlug,
        });
        if (!organization) {
          response
            .status(200)
            .json({ success: false, error: "No org by that slug." });
          return;
        }

        const documents = await WorkspaceDocument.where({
          organization_id: Number(organization.id),
        });
        for (const document of documents) {
          const digestFilename = WorkspaceDocument.vectorFilename(document);
          await deleteVectorCacheFile(digestFilename);
        }

        await Organization.delete({ id: Number(organization.id) });
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.status(500).json({ success: false, error: e.message });
      }
    }
  );
}

module.exports = { organizationEndpoints };
