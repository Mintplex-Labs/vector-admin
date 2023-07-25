// const { checkForMigrations } = require("../utils/database");

const OrganizationConnection = {
  supportedConnectors: ["chroma", "pinecone"],
  tablename: "organization_connections",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  settings TEXT NOT NULL,
  organization_id INTEGER NOT NULL,
  createdAt TEXT DEFAULT (strftime('%s', 'now')),
  lastUpdatedAt TEXT DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
  `,
  writable: ["type", "settings"],
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
  create: async function (
    organizationId = 0,
    connectionType = "",
    connectionSettings = {}
  ) {
    if (!this.supportedConnectors.includes(connectionType))
      throw new Error(`Unsupport connector ${connectionType} provided.`);

    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (organization_id, type, settings) VALUES (?, ?, ?)`,
        [organizationId, connectionType, JSON.stringify(connectionSettings)]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    db.close();
    if (!success) {
      console.error(
        "FAILED TO CREATE ORGANIZATION_CONNECTION RELATIONSHIP.",
        message
      );
      return false;
    }

    const connector = await this.get(`id = ${id}`);
    return connector;
  },
  get: async function (clause = "") {
    const db = await this.db();
    const result = await db
      .get(`SELECT * FROM ${this.tablename} WHERE ${clause}`)
      .then((res) => res || null);
    if (!result) return null;
    db.close();

    return result;
  },
  update: async function (id = null, data = {}) {
    if (!id) throw new Error("No workspace id provided for update");

    const validKeys = Object.keys(data).filter((key) =>
      this.writable.includes(key)
    );
    const values = Object.values(data);
    if (validKeys.length === 0 || validKeys.length !== values.length)
      return { connector: { id }, message: "No valid fields to update!" };

    const template = `UPDATE ${this.tablename} SET ${validKeys.map((key) => {
      return `${key}=?`;
    })} WHERE id = ?`;
    const db = await this.db();
    const { success, message } = await db
      .run(template, [...values, id])
      .then(() => {
        return { success: true, message: null };
      })
      .catch((error) => {
        return { success: false, message: error.message };
      });

    db.close();
    if (!success) {
      console.error(message);
      return null;
    }

    const updatedConnector = await this.get(`id = ${id}`);
    return updatedConnector;
  },
  where: async function (clause = null, limit = null) {
    const db = await this.db();
    const results = await db.all(
      `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${
        !!limit ? `LIMIT ${limit}` : ""
      }`
    );
    db.close();

    return results;
  },
  count: async function (clause = null) {
    const db = await this.db();
    const { count } = await db.get(
      `SELECT COUNT(*) as count FROM ${this.tablename} ${
        clause ? `WHERE ${clause}` : ""
      }`
    );
    db.close();

    return count;
  },
};

module.exports.OrganizationConnection = OrganizationConnection;
