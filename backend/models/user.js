const prisma = require("../utils/prisma");

const User = {
  create: async function ({ email, password, role = null }) {
    try {
      const bcrypt = require("bcrypt");
      const user = await prisma.users.create({
        data: {
          email,
          password: bcrypt.hashSync(password, 10),
          role: role ?? "default",
        },
      });

      return { user, message: null };
    } catch (e) {
      console.error("FAILED TO CREATE USER.", e.message);
      return { user: null, error: e.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const user = await prisma.users.findFirst({ where: clause });
      return user ? { ...user } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      const users = await prisma.users.findMany({
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
      const count = await prisma.users.count({ where: clause });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  whereWithOrgs: async function (clause = {}, limit = null) {
    const { Organization } = require("./organization");
    const { OrganizationUser } = require("./organizationUser");

    const users = await this.where(clause, limit);
    const organizations = await Organization.where();

    for (const user of users) {
      const memberships = await OrganizationUser.where({
        user_id: Number(user.id),
      });
      delete user.password;
      user.memberships = [];

      for (const membership of memberships) {
        const org = organizations.find(
          (org) => org.id === membership.organization_id
        );
        user.memberships.push({ ...org, organization_id: org.id });
      }
    }

    return users;
  },

  addToAllOrgs: async function (userId = null) {
    if (!userId) return false;
    const { Organization } = require("./organization");
    const { OrganizationUser } = require("./organizationUser");

    const organizations = await Organization.where();
    if (!organizations.length) return;

    const orgIds = organizations.map((org) => org.id);
    await OrganizationUser.createMany(userId, orgIds);
    return;
  },

  delete: async function (clause = {}) {
    try {
      await prisma.users.deleteMany({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  update: async function (userId, updates = {}) {
    try {
      const user = await this.get({ id: parseInt(userId) });
      if (!user) return { success: false, error: "User does not exist." };

      const { email, password, role, memberships } = updates;
      const toUpdate = {};
      if (user.email !== email && email?.length > 0) {
        const usedEmail = !!(await this.get({ email }));
        if (usedEmail)
          return { success: false, error: `${email} is already in use.` };
        toUpdate.email = email;
      }

      if (!!password) {
        const bcrypt = require("bcrypt");
        toUpdate.password = bcrypt.hashSync(password, 10);
      }

      if (user.role !== role && ["admin", "default"].includes(role)) {
        // If was existing admin and that has been changed
        // make sure at least one admin exists
        if (user.role === "admin") {
          const validAdminCount = (await this.count({ role: "admin" })) > 1;
          if (!validAdminCount)
            return {
              success: false,
              error: `There would be no admins if this action was completed. There must be at least one admin.`,
            };
        }
        toUpdate.role = role;
      }

      const updatedUser = await prisma.users.update({
        where: { id: parseInt(userId) },
        data: toUpdate,
      });

      const { OrganizationUser } = require("./organizationUser");
      await OrganizationUser.updateOrgPermissions(user.id, memberships);
      return { success: !!updatedUser, error: null };
    } catch (e) {
      console.error(e.message);
      return { success: false, error: e.message };
    }
  },
};

module.exports.User = User;
