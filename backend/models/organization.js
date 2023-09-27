const prisma = require("../utils/prisma");
const uuidAPIKey = require("uuid-apikey");
const slugify = require("slugify");
const { OrganizationUser } = require("./organizationUser");
const { OrganizationApiKey } = require("./organizationApiKey");

const Organization = {
  writable: ["name"],
  makeKey: () => {
    return `org-${uuidAPIKey.create().apiKey}`;
  },
  create: async function (orgName = "", adminId) {
    try {
      if (!orgName)
        return {
          organization: null,
          message: "No Organization name provided.",
        };
      var slug = slugify(orgName, { lower: true });

      const existingBySlug = await this.get({ slug });
      if (!!existingBySlug) {
        const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
        slug = slugify(`${orgName}-${slugSeed}`, { lower: true });
      }

      const organization = await prisma.organizations.create({
        data: {
          name: orgName,
          slug,
          uuid: this.makeKey(),
        },
      });

      if (!organization) {
        await db.close();
        console.error("FAILED TO CREATE ORGANIZATION.", message);
        return { organization: null, message };
      }

      await OrganizationUser.create(adminId, organization.id);
      await OrganizationApiKey.create(organization.id);
      return { organization, message: null };
    } catch (e) {
      console.error(e.message);
      return { organization: null, error: e.message };
    }
  },
  update: async function (orgId = null, updates = {}) {
    try {
      if (!orgId) throw new Error("No workspace id provided for update");

      const validKeys = Object.keys(updates).filter((key) =>
        this.writable.includes(key)
      );
      const values = Object.values(updates);
      if (validKeys.length === 0 || validKeys.length !== values.length)
        return { success: false, error: "No valid fields to update!" };

      // Assemble update array of only valid changes.
      const validUpdates = {};
      validKeys.forEach((key) => {
        validUpdates[key] = updates[key];
      });

      const organization = await prisma.organizations.update({
        where: { id: Number(orgId) },
        data: validUpdates,
      });
      return { success: !!organization, error };
    } catch (e) {
      console.error(e.message);
      return { success: false, error: e.message };
    }
  },
  get: async function (clause = {}) {
    try {
      const organization = await prisma.organizations.findFirst({
        where: clause,
      });
      return organization;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  getWithOwner: async function (userId, clause = {}) {
    try {
      const result = await prisma.organizations.findFirst({
        where: {
          ...clause,
          organization_users: {
            every: {
              user_id: Number(userId),
            },
          },
        },
      });
      return result;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null, orderBy = null) {
    try {
      const results = await prisma.organizations.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return results;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organizations.count({ where: clause });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  whereWithOwner: async function (
    // TODO
    userId,
    clause = {},
    limit = null,
    orderBy = null
  ) {
    try {
      const results = await prisma.organizations.findMany({
        where: {
          ...clause,
          organization_users: {
            every: {
              user_id: Number(userId),
            },
          },
        },
        ...(limit ? { take: limit } : {}),
        ...(orderBy ? { orderBy } : {}),
      });
      return results;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.organizations.delete({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },
};

module.exports.Organization = Organization;
