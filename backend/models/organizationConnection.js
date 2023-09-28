const prisma = require("../utils/prisma");

const OrganizationConnection = {
  supportedConnectors: ["chroma", "pinecone", "qdrant", "weaviate"],
  writable: ["type", "settings"],

  create: async function (
    organizationId = 0,
    connectionType = "",
    connectionSettings = {}
  ) {
    try {
      if (!this.supportedConnectors.includes(connectionType))
        throw new Error(`Unsupport connector ${connectionType} provided.`);

      const connector = await prisma.organization_connections.create({
        data: {
          organization_id: Number(organizationId),
          type: connectionType,
          settings: JSON.stringify(connectionSettings),
        },
      });

      if (!connector) {
        console.error("FAILED TO CREATE ORGANIZATION_CONNECTION RELATIONSHIP.");
        return false;
      }

      return connector;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  get: async function (clause = {}) {
    try {
      const connection = await prisma.organization_connections.findFirst({
        where: clause,
      });
      return connection ? { ...connection } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      const connections = await prisma.organization_connections.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
      });
      return connections;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organization_connections.count({
        where: clause,
      });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  update: async function (id = null, data = {}) {
    try {
      if (!id) throw new Error("No connector id provided for update");
      const validKeys = Object.keys(data).filter((key) =>
        this.writable.includes(key)
      );
      const values = Object.values(data);
      if (validKeys.length === 0 || validKeys.length !== values.length)
        return { connector: { id }, message: "No valid fields to update!" };

      // Assemble update array of only valid changes.
      const validUpdates = {};
      validKeys.forEach((key) => {
        validUpdates[key] = data[key];
      });

      const updatedConnector = await prisma.organization_connections.update({
        where: { id: Number(id) },
        data: validUpdates,
      });

      if (!success) {
        console.error(message);
        return null;
      }

      return updatedConnector;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },
};

module.exports.OrganizationConnection = OrganizationConnection;
