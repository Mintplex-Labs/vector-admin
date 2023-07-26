// const { checkForMigrations } = require("../utils/database");

const User = {
  tablename: "users",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT "default",
  createdAt TEXT DEFAULT (strftime('%s', 'now')),
  lastUpdatedAt TEXT DEFAULT (strftime('%s', 'now'))
  `,
  // migrateTable: async function () {
  //   console.log(`\x1b[34m[MIGRATING]\x1b[0m Checking for Document migrations`);
  //   const db = await this.db(false);
  //   await checkForMigrations(this, db);
  // },
  migrations: function () {
    return [];
  },
  db: async function (tracing = true) {
    const sqlite3 = require("sqlite3").verbose();
    const { open } = require("sqlite");
    const path = require("path");
    const dbFilePath = path.resolve(__dirname, "../storage/vdbms.db");
    const db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });

    await db.exec(
      `PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS ${this.tablename} (${this.colsInit})`
    );

    if (tracing) db.on("trace", (sql) => console.log(sql));
    return db;
  },
  create: async function ({ email, password, role = null }) {
    const bcrypt = require("bcrypt");
    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (email, password, role) VALUES(?, ?, ?)`,
        [email, bcrypt.hashSync(password, 10), role ?? "default"]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await db.close();
      console.error("FAILED TO CREATE USER.", message);
      return { user: null, message };
    }

    const user = await db.get(
      `SELECT * FROM ${this.tablename} WHERE id = ${id} `
    );
    await db.close();

    return { user, message: null };
  },
  get: async function (clause = "") {
    const db = await this.db();
    const result = await db
      .get(`SELECT * FROM ${this.tablename} WHERE ${clause} `)
      .then((res) => res || null);
    if (!result) return null;
    await db.close();

    return result;
  },
  where: async function (clause = null, limit = null) {
    const db = await this.db();
    const results = await db.all(
      `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${
        !!limit ? `LIMIT ${limit}` : ""
      } `
    );
    await db.close();

    return results;
  },
  count: async function (clause = null) {
    const db = await this.db();
    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM ${this.tablename} ${
        clause ? `WHERE ${clause}` : ""
      } `
    );
    await db.close();

    return count;
  },
  whereWithOrgs: async function (clause = null, limit = null) {
    const { Organization } = require("./organization");
    const { OrganizationUser } = require("./organizationUser");

    const users = await this.where(clause, limit);
    const organizations = await Organization.where();

    for (const user of users) {
      const memberships = await OrganizationUser.where(`user_id = ${user.id}`);
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
  delete: async function (clause = null) {
    const db = await this.db();
    await db.get(`DELETE FROM ${this.tablename} WHERE ${clause}`);
    return;
  },
  update: async function (userId, updates = {}) {
    const user = await this.get(`id = ${userId}`);
    if (!user) return { success: false, error: "User does not exist." };
    const { email, password, role, memberships } = updates;
    const toUpdate = {};

    if (user.email !== email && email?.length > 0) {
      const usedEmail = !!(await this.get(`email = '${email}'`));
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
        const validAdminCount = (await this.count(`role = 'admin'`)) > 1;
        if (!validAdminCount)
          return {
            success: false,
            error: `There would be no admins if this action was completed. There must be at least one admin.`,
          };
      }

      toUpdate.role = role;
    }

    if (Object.keys(toUpdate).length !== 0) {
      const values = Object.values(toUpdate);
      const template = `UPDATE ${this.tablename} SET ${Object.keys(
        toUpdate
      ).map((key) => {
        return `${key}=?`;
      })} WHERE id = ?`;

      const db = await this.db();
      const { success, message } = await db
        .run(template, [...values, userId])
        .then(() => {
          return { success: true, message: null };
        })
        .catch((error) => {
          return { success: false, message: error.message };
        });

      await db.close();
      if (!success) {
        console.error(message);
        return { success: false, error: message };
      }
    }

    const { OrganizationUser } = require("./organizationUser");
    await OrganizationUser.updateOrgPermissions(user.id, memberships);
    return { success: true, error: null };
  },
};

module.exports.User = User;
