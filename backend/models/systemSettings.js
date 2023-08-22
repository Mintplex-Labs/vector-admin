// const { checkForMigrations } = require("../utils/database");

const SystemSettings = {
  supportedFields: [
    "allow_account_creation",
    "account_creation_domain_scope",
    "open_ai_api_key",
    "debug_username",
    "debug_pwd",
    "telemetry_id",
  ],
  privateField: ["open_ai_api_key"],
  tablename: "system_settings",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT UNIQUE NOT NULL,
  value TEXT,
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
      `PRAGMA foreign_keys = ON;CREATE TABLE IF NOT EXISTS ${this.tablename} (${this.colsInit})`
    );

    if (tracing) db.on("trace", (sql) => console.log(sql));
    return db;
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
  updateSettings: async function (updates = {}) {
    const validConfigKeys = Object.keys(updates).filter((key) =>
      this.supportedFields.includes(key)
    );
    for (const key of validConfigKeys) {
      const existingRecord = await this.get(`label = '${key}'`);
      if (!existingRecord) {
        const db = await this.db();
        const value = updates[key] === null ? null : String(updates[key]);
        const { success, message } = await db
          .run(`INSERT INTO ${this.tablename} (label, value) VALUES (?, ?)`, [
            key,
            value,
          ])
          .then((res) => {
            return { id: res.lastID, success: true, message: null };
          })
          .catch((error) => {
            return { id: null, success: false, message: error.message };
          });
        await db.close();
        if (!success) {
          console.error("FAILED TO ADD SYSTEM CONFIG OPTION", message);
          return { success: false, error: message };
        }
      } else {
        const db = await this.db();
        const value = updates[key] === null ? null : String(updates[key]);
        const { success, message } = await db
          .run(`UPDATE ${this.tablename} SET label=?,value=? WHERE id = ?`, [
            key,
            value,
            existingRecord.id,
          ])
          .then(() => {
            return { success: true, message: null };
          })
          .catch((error) => {
            return { success: false, message: error.message };
          });

        await db.close();
        if (!success) {
          console.error("FAILED TO UPDATE SYSTEM CONFIG OPTION", message);
          return { success: false, error: message };
        }
      }
    }
    return { success: true, error: null };
  },
};

module.exports.SystemSettings = SystemSettings;
