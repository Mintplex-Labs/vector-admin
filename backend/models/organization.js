// const { checkForMigrations } = require("../utils/database");
const uuidAPIKey = require("uuid-apikey");
const slugify = require("slugify");
const { OrganizationUser } = require("./organizationUser");
const { OrganizationApiKey } = require("./organizationApiKey");

const Organization = {
  tablename: "organizations",
  writable: ["name"],
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  uuid TEXT NOT NULL UNIQUE,
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
      `PRAGMA foreign_keys = ON;CREATE TABLE IF NOT EXISTS ${this.tablename} (${this.colsInit});`
    );

    if (tracing) db.on("trace", (sql) => console.log(sql));
    return db;
  },
  makeKey: () => {
    return `org-${uuidAPIKey.create().apiKey}`;
  },
  create: async function (orgName = "", adminId) {
    if (!orgName)
      return { organization: null, message: "No Organization name provided." };
    var slug = slugify(orgName, { lower: true });

    const existingBySlug = await this.get(`slug = '${slug}'`);
    if (!!existingBySlug) {
      const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
      slug = slugify(`${orgName}-${slugSeed}`, { lower: true });
    }

    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (name, slug, uuid) VALUES (?, ?, ?)`,
        [orgName, slug, this.makeKey()]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await db.close();
      console.error("FAILED TO CREATE ORGANIZATION.", message);
      return { organization: null, message };
    }

    const organization = await db.get(
      `SELECT * FROM ${this.tablename} WHERE id = ${id}`
    );
    await db.close();

    await OrganizationUser.create(adminId, organization.id);
    await OrganizationApiKey.create(organization.id);
    return { organization, message: null };
  },
  update: async function (orgId = null, updates = {}) {
    if (!orgId) throw new Error("No workspace id provided for update");

    const validKeys = Object.keys(updates).filter((key) =>
      this.writable.includes(key)
    );
    const values = Object.values(updates);
    if (validKeys.length === 0 || validKeys.length !== values.length)
      return { success: false, error: "No valid fields to update!" };

    const template = `UPDATE ${this.tablename} SET ${validKeys.map((key) => {
      return `${key}=?`;
    })} WHERE id = ?`;
    const db = await this.db();
    const { success, error } = await db
      .run(template, [...values, orgId])
      .then(() => {
        return { success: true, error: null };
      })
      .catch((error) => {
        return { success: false, error: error.message };
      });

    await db.close();
    return { success, error };
  },
  get: async function (clause = "") {
    const db = await this.db();
    const result = await db
      .get(`SELECT * FROM ${this.tablename} WHERE ${clause}`)
      .then((res) => res || null);
    if (!result) return null;
    await db.close();

    return result;
  },
  getWithOwner: async function (userId, clause = "") {
    const db = await this.db();
    const result = await db
      .get(
        `SELECT * FROM ${this.tablename} as org 
      LEFT JOIN organization_users as org_users 
      ON org_users.organization_id = org.id 
      WHERE org_users.user_id = ${userId} AND ${clause}`
      )
      .then((res) => res || null);
    if (!result) return null;
    await db.close();

    return { ...result, id: result.organization_id };
  },
  where: async function (clause = null, limit = null, orderBy = null) {
    const db = await this.db();
    const results = await db.all(
      `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${
        !!limit ? `LIMIT ${limit}` : ""
      } ${!!orderBy ? orderBy : ""}`
    );
    await db.close();

    return results;
  },
  count: async function (clause = null) {
    const db = await this.db();
    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM ${this.tablename} ${
        clause ? `WHERE ${clause}` : ""
      }`
    );
    await db.close();

    return count;
  },
  whereWithOwner: async function (
    userId,
    clause = null,
    limit = null,
    orderBy = null
  ) {
    const db = await this.db();
    const results = await db.all(
      `SELECT * FROM ${this.tablename} as org 
      LEFT JOIN organization_users as org_users 
      ON org_users.organization_id = org.id 
      WHERE org_users.user_id = ${userId} ${clause ? `AND ${clause}` : ""} ${
        !!limit ? `LIMIT ${limit}` : ""
      } ${!!orderBy ? orderBy : ""}`
    );
    await db.close();

    return results;
  },
  delete: async function (clause = null) {
    const db = await this.db();
    await db.exec(`DELETE FROM ${this.tablename} WHERE ${clause}`);
    await db.close();
    return;
  },
};

module.exports.Organization = Organization;
