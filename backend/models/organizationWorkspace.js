const prisma = require("../utils/prisma");
const uuidAPIKey = require("uuid-apikey");
const slugify = require("slugify");
const { WorkspaceDocument } = require("./workspaceDocument");
const { selectConnector } = require("../utils/vectordatabases/providers");

const OrganizationWorkspace = {
  makeKey: () => {
    return `ws-${uuidAPIKey.create().apiKey}`;
  },
  // Will check the relevant connector to make sure the slug and namespace/collection map
  safeCreate: async function (
    workspaceName = "",
    organizationId = 0,
    dbConnectorRecord
  ) {
    try {
      if (!workspaceName)
        return { workspace: null, message: "No Workspace name provided." };
      const connector = selectConnector(dbConnectorRecord);

      var slug = slugify(workspaceName, { lower: true });
      const existingDbBySlug = await this.get({ slug });
      const existingConnectorNamespace = await connector.namespace(slug);

      // If there was a name collision in the DB or the vectorstore collection - make a unique slug.
      // as the namespace/collection will always be the slug.
      if (!!existingDbBySlug || !!existingConnectorNamespace) {
        const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
        slug = slugify(`${workspaceName}-${slugSeed}`, { lower: true });
      }

      const workspace = await prisma.organization_workspaces.create({
        data: {
          name: workspaceName,
          slug,
          uuid: this.makeKey(),
          organization_id: Number(organizationId),
        },
      });

      if (!workspace) {
        await db.close();
        console.error("FAILED TO CREATE WORKSPACE.");
        return { workspace: null, message: "Could not create workspace" };
      }

      return { workspace, message: null };
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  create: async function (workspaceName = "", organizationId = 0) {
    try {
      if (!workspaceName)
        return { workspace: null, message: "No Workspace name provided." };
      var slug = slugify(workspaceName, { lower: true });

      const existingBySlug = await this.get({ slug });
      if (!!existingBySlug) {
        const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
        slug = slugify(`${workspaceName}-${slugSeed}`, { lower: true });
      }

      const workspace = await prisma.organization_workspaces.create({
        data: {
          name: workspaceName,
          slug,
          uuid: this.makeKey(),
          organization_id: Number(organizationId),
        },
      });

      if (!workspace) {
        await db.close();
        console.error("FAILED TO CREATE WORKSPACE.");
        return { workspace: null, message: "Could not create workspace" };
      }

      return { workspace, message: null };
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  get: async function (clause = {}) {
    try {
      const workspace = await prisma.organization_workspaces.findFirst({
        where: clause,
      });
      return workspace ? { ...workspace } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  forOrganization: async function (
    organizationId,
    page = 1,
    pageSize = 10,
    includeSlugs = [],
    searchTerm = ""
  ) {
    try {
      const offset = (page - 1) * pageSize;
      const orgWorkspaces = [
        ...(includeSlugs?.length > 0
          ? await this.where({
              organization_id: Number(organizationId),
              ...(includeSlugs.length > 0
                ? { slug: { in: includeSlugs } }
                : {}),
            })
          : []),
        ...(await this.likeWhere(organizationId, searchTerm, pageSize, offset)),
      ];

      const slugs = new Set();
      const workspaces = [];
      for (const workspace of orgWorkspaces) {
        if (slugs.has(workspace.slug)) continue;
        workspaces.push({
          ...workspace,
          documentCount: await WorkspaceDocument.count({
            workspace_id: Number(workspace.id),
          }),
        });
        slugs.add(workspace.slug);
      }

      return workspaces;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  bySlugAndOrg: async function (wsSlug, organizationId = null) {
    return await this.get({
      slug: wsSlug,
      organization_id: Number(organizationId),
    });
  },

  where: async function (
    clause = {},
    limit = null,
    offset = null,
    orderBy = null
  ) {
    try {
      const workspaces = await prisma.organization_workspaces.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(offset !== null ? { skip: offset } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return workspaces;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  // We have to break this out separately so Prisma can find it as it does not
  // support % searching.
  likeWhere: async function (
    organization_id = 0,
    searchTerm = "",
    limit = 1,
    offset = 0
  ) {
    return await prisma.$queryRaw`SELECT * FROM organization_workspaces WHERE organization_id = ${organization_id} AND name LIKE ${
      "%" + searchTerm + "%"
    } LIMIT ${limit} OFFSET ${offset}`;
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organization_workspaces.count({
        where: clause,
      });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.organization_workspaces.deleteMany({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },
};

module.exports.OrganizationWorkspace = OrganizationWorkspace;
