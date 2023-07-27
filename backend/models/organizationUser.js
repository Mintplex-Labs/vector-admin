// const { checkForMigrations } = require("../utils/database");

const OrganizationUser = {
  tablename: "organization_users",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  createdAt TEXT DEFAULT (strftime('%s', 'now')),
  lastUpdatedAt TEXT DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
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
  createMany: async function (userId, organizationIds = []) {
    if (organizationIds.length === 0) return;
    const db = await this.db();
    const stmt = await db.prepare(
      `INSERT INTO ${this.tablename} (user_id, organization_id) VALUES (?,?)`
    );

    await db.exec("BEGIN TRANSACTION");
    try {
      for (const orgId of organizationIds) {
        await stmt.run([userId, orgId]);
      }
      await db.exec("COMMIT");
    } catch {
      await db.exec("ROLLBACK");
    }

    await stmt.finalize();
    await db.close();
    return;
  },
  create: async function (userId = 0, organizationId = 0) {
    const db = await this.db();
    const { success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (user_id, organization_id) VALUES (?, ?)`,
        [userId, organizationId]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await db.close();
      console.error(
        "FAILED TO CREATE ORGANIZATION_USER RELATIONSHIP.",
        message
      );
      return false;
    }
    return true;
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
  where: async function (clause = null, limit = null) {
    const db = await this.db();
    const results = await db.all(
      `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${
        !!limit ? `LIMIT ${limit}` : ""
      }`
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
  delete: async function (clause = null) {
    const db = await this.db();
    await db.exec(`DELETE FROM ${this.tablename} WHERE ${clause}`);
    await db.close();
    return;
  },
  updateOrgPermissions: async function (userId, _orgIds = []) {
    const orgIds = _orgIds.filter((id) => id !== null).map((id) => Number(id));
    if (orgIds.length === 0) return; // Must belong to at least one org.

    await this.delete(`user_id = ${userId}`);
    await this.createMany(userId, orgIds);
  },
};

module.exports.OrganizationUser = OrganizationUser;
