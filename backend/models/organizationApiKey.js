// const { checkForMigrations } = require("../utils/database");
const uuidAPIKey = require("uuid-apikey");

const OrganizationApiKey = {
  tablename: "organization_api_keys",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  apiKey TEXT NOT NULL UNIQUE,
  createdAt TEXT DEFAULT (strftime('%s', 'now')),
  lastUpdatedAt TEXT DEFAULT (strftime('%s', 'now')),
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
  makeKey: () => {
    return `vdms-${uuidAPIKey.create().apiKey}`;
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
    await db.close();

    if (tracing) db.on("trace", (sql) => console.log(sql));
    return db;
  },
  create: async function (organizationId = 0) {
    const db = await this.db();
    const { success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (organization_id, apiKey) VALUES (?, ?)`,
        [organizationId, this.makeKey()]
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
        "FAILED TO CREATE ORGANIZATION_API_KEYS RELATIONSHIP.",
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
      `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${!!limit ? `LIMIT ${limit}` : ""
      }`
    );
    await db.close();

    return results;
  },
  count: async function (clause = null) {
    const db = await this.db();
    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""
      }`
    );
    await db.close();

    return count;
  },
};

module.exports.OrganizationApiKey = OrganizationApiKey;
