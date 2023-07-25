// const { checkForMigrations } = require("../utils/database");
require("dotenv").config();

const Queue = {
  tablename: "jobs",
  status: {
    pending: "pending",
    failed: "failed",
    complete: "complete",
  },
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskName TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data TEXT NOT NULL,
  result TEXT NOT NULL,
  runByUserId INTEGER DEFAULT NULL,
  organizationId INTEGER,
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
    const dbFilePath = path.resolve(__dirname, "../storage/job_queue.db");
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
  create: async function (task, data = {}, userId = null, organizationId) {
    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (taskName, data, result, runByUserId, organizationId) VALUES (?, ?, ?, ?, ?)`,
        [task, JSON.stringify(data), JSON.stringify({}), userId, organizationId]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      db.close();
      console.error("FAILED TO CREATE JOB.", message);
      return { job: null, error: message };
    }

    const job = await db.get(
      `SELECT * FROM ${this.tablename} WHERE id = ${id}`
    );
    db.close();

    return { job, error: null };
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
  where: async function (clause = null, limit = null, orderBy = null) {
    const db = await this.db();
    const results = await db.all(
      `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${
        !!limit ? `LIMIT ${limit}` : ""
      } ${orderBy ? orderBy : ""}`
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
  sendJob: async function (data) {
    await fetch(`http://127.0.0.1:3355/send`, {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.ok)
      .catch((e) => {
        console.error("Failed to send background worker job", e.message);
      });
  },
  updateJob: async function (jobId, status, result) {
    const template = `UPDATE ${this.tablename} SET status=?, result=? WHERE id = ?`;
    const db = await this.db();
    const { success, message } = await db
      .run(template, [status, JSON.stringify(result), jobId])
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

    const updatedJob = await this.get(`id = ${jobId}`);
    return updatedJob;
  },
};

module.exports.Queue = Queue;
