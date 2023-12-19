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

      // If the new name contains bad characters
      // replace them with spaces and continue creation.
      const newOrgName = orgName.replace(/[:\.,<>@]/, " ");
      var slug = slugify(newOrgName, { lower: true });

      const existingBySlug = await this.get({ slug });
      if (!!existingBySlug) {
        const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
        slug = slugify(`${newOrgName}-${slugSeed}`, { lower: true });
      }

      const organization = await prisma.organizations.create({
        data: {
          name: newOrgName,
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
      return { success: !!organization, error: null };
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
      const orgIds = (
        await OrganizationUser.where({ user_id: Number(userId) })
      ).map((record) => record.organization_id);
      const result = await prisma.organizations.findFirst({
        where: {
          ...clause,
          id: { in: orgIds },
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
    userId,
    clause = {},
    limit = null,
    orderBy = null
  ) {
    try {
      const orgIds = (
        await OrganizationUser.where({ user_id: Number(userId) })
      ).map((record) => record.organization_id);
      const results = await prisma.organizations.findMany({
        where: {
          id: { in: orgIds },
          ...clause,
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
      await prisma.organizations.deleteMany({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },
};

module.exports.Organization = Organization;
