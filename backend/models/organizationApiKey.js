const prisma = require("../utils/prisma");
const uuidAPIKey = require("uuid-apikey");

const OrganizationApiKey = {
  makeKey: () => {
    return `vdms-${uuidAPIKey.create().apiKey}`;
  },

  create: async function (organizationId = 0) {
    try {
      const orgApiKey = await prisma.organization_api_keys.create({
        data: {
          organization_id: Number(organizationId),
          apiKey: this.makeKey(),
        },
      });

      if (!orgApiKey) {
        console.error("FAILED TO CREATE ORGANIZATION_API_KEYS RELATIONSHIP.");
        return false;
      }
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  get: async function (clause = {}) {
    try {
      const user = await prisma.organization_api_keys.findFirst({
        where: clause,
      });
      return user ? { ...user } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      const users = await prisma.organization_api_keys.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
      });
      return users;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organization_api_keys.count({ where: clause });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },
};

module.exports.OrganizationApiKey = OrganizationApiKey;
