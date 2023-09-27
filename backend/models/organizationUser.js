const prisma = require("../utils/prisma");

const OrganizationUser = {
  createMany: async function (userId, organizationIds = []) {
    try {
      if (organizationIds.length === 0) return;
      const inserts = organizationIds.map((orgId) => {
        return {
          user_id: Number(userId),
          organization_id: Number(orgId),
        };
      });

      await prisma.organization_users.createMany({
        data: inserts,
      });
      return;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },
  create: async function (userId = 0, organizationId = 0) {
    try {
      const relationship = await prisma.organization_users.create({
        data: {
          organization_id: Number(organizationId),
          user_id: Number(userId),
        },
      });

      if (!relationship) {
        console.error("FAILED TO CREATE ORGANIZATION_USER RELATIONSHIP.");
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
      const user = await prisma.organization_users.findFirst({ where: clause });
      return user ? { ...user } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      const users = await prisma.organization_users.findMany({
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
      const count = await prisma.organization_users.count({ where: clause });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.organization_users.delete({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  updateOrgPermissions: async function (userId, _orgIds = []) {
    const orgIds = _orgIds.filter((id) => id !== null).map((id) => Number(id));
    if (orgIds.length === 0) return; // Must belong to at least one org.
    await this.delete({ user_id: Number(userId) });
    await this.createMany(userId, orgIds);
  },
};

module.exports.OrganizationUser = OrganizationUser;
