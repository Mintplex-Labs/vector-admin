const prisma = require("../utils/prisma");
const path = require("path");
const { v5 } = require("uuid");
const { fetchMetadata } = require("../utils/storage");
const { DocumentVectors } = require("./documentVectors");
const { selectConnector } = require("../utils/vectordatabases/providers");

const WorkspaceDocument = {
  vectorFilenameRaw: function (documentName, workspaceId) {
    const document = { name: documentName, workspace_id: workspaceId };
    return this.vectorFilename(document);
  },
  vectorFilename: function (document) {
    if (!document?.name) return null;
    return v5(`ws_${document.workspace_id}_` + document.name, v5.URL);
  },
  vectorFilepath: function (document) {
    const cacheFilename = this.vectorFilename(document);
    return path.resolve(
      __dirname,
      `../storage/vector-cache/${cacheFilename}.json`
    );
  },

  create: async function (data = null) {
    try {
      if (!data) return;
      const document = await prisma.workspace_documents.create({
        data: {
          docId: data.id,
          name: data.name,
          workspace_id: Number(data.workspaceId),
          organization_id: Number(data.organizationId),
        },
      });

      if (!document) {
        await db.close();
        console.error("FAILED TO CREATE DOCUMENT.");
        return { document: null, message: "Failed to create document" };
      }
      return { document, message: null };
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  // Used by workers paginateAndStore method to bulk create documents easily during import.
  // document items in array must have documentId, name, metadata (this is document specific - not each vector chunk.), workspaceId, organizationId,
  createMany: async function (documents = null) {
    try {
      if (documents.length === 0) return;
      const inserts = documents.map((doc) => {
        return {
          docId: doc.documentId,
          name: doc.name,
          workspace_id: Number(doc.workspaceId),
          organization_id: Number(doc.organizationId),
        };
      });

      await prisma.workspace_documents.createMany({
        data: inserts,
      });
      return;
    } catch (e) {
      console.error(e.message);
      return;
    }
  },

  get: async function (clause = {}, withReferences = false) {
    try {
      const document = await prisma.workspace_documents.findFirst({
        where: clause,
        include: {
          workspace: withReferences,
        },
      });
      return document ? { ...document } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (
    clause = {},
    limit = null,
    offset = null,
    withReferences = false
  ) {
    try {
      const documents = await prisma.workspace_documents.findMany({
        where: clause,
        include: {
          workspace: withReferences,
        },
        ...(offset !== null ? { skip: offset } : {}),
        ...(limit !== null ? { take: limit } : {}),
      });
      return documents;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.workspace_documents.count({ where: clause });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.workspace_documents.deleteMany({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },
  countForEntity: async function (field = "organization_id", value = null) {
    return await this.count({ [field]: value });
  },
  calcVectors: async function (field = "organization_id", value = null) {
    try {
      const documents = await this.where({ [field]: value });
      if (documents.length === 0) return 0;

      const vectorCount = await DocumentVectors.count({
        [field]: value,
      });
      return vectorCount;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },
  calcVectorCache: async function (field = "organization_id", value = null) {
    const documents = await this.where({ [field]: value });

    var totalBytes = 0;
    for (const document of documents) {
      try {
        const cacheFilepath = this.vectorFilepath(document);
        const metadata = await fetchMetadata(cacheFilepath);
        totalBytes += Number(metadata?.size);
      } catch (e) {
        console.error(e);
      }
    }

    return totalBytes;
  },

  calcDimensions: async function (field = "workspace_id", value = null) {
    try {
      const { OrganizationConnection } = require("./organizationConnection");

      const workspace = await prisma.organization_workspaces.findUnique({
        where: { id: value },
        include: { organization: true },
      });

      const connector = await OrganizationConnection.get({
        organization_id: workspace.organization.id,
      });

      const vectorDb = selectConnector(connector);
      const dimensions = await vectorDb.indexDimensions(workspace.fname);

      return dimensions;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },

  // Will get both the remote and local count of vectors to see if the numbers match.
  vectorCount: async function (field = "organization_id", value = null) {
    try {
      const { OrganizationConnection } = require("./organizationConnection");
      const connector = await OrganizationConnection.get({ [field]: value });
      if (!connector) return { remoteCount: 0, localCount: 0 };
      const vectorDb = selectConnector(connector);

      return {
        remoteCount: (await vectorDb.totalIndicies())?.result,
        localCount: await DocumentVectors.count({
          [field]: value,
        }),
      };
    } catch (e) {
      console.error(e);
      return 0;
    }
  },
};

module.exports.WorkspaceDocument = WorkspaceDocument;
