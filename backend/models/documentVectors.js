// const { checkForMigrations } = require("../utils/database");

const DocumentVectors = {
  tablename: "document_vectors",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  docId TEXT NOT NULL,
  vectorId TEXT NOT NULL,
  document_id INTEGER NOT NULL,
  createdAt TEXT DEFAULT (strftime('%s', 'now')),
  lastUpdatedAt TEXT DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (document_id) REFERENCES workspace_documents (id) ON DELETE CASCADE
  `,
  // migrateTable: async function () {
  //   console.log(`\x1b[34m[MIGRATING]\x1b[0m Checking for ${this.tablename} migrations`);
  //   const db = await this.db(false);
  //   await checkForMigrations(this, db);
  // },
  migrations: function () {
    return [
      //   {
      //     colName: "id",
      //     execCmd: `CREATE TRIGGER IF NOT EXISTS Trg_LastUpdated AFTER UPDATE ON ${this.tablename}
      //                              FOR EACH ROW
      //                              BEGIN
      //                               UPDATE ${this.tablename} SET lastUpdatedAt = (strftime('%s', 'now')) WHERE id = old.id;
      //                              END`,
      //     doif: true,
      //   },
    ];
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

  createMany: async function (vectors = []) {
    if (vectors.length === 0) return;
    const db = await this.db();
    const stmt = await db.prepare(
      `INSERT INTO ${this.tablename} (docId, vectorId, document_id) VALUES (?,?,?)`
    );

    for (const vector of vectors) {
      stmt.run([vector.docId, vector.vectorId, vector.documentId]);
    }

    stmt.finalize();
    db.close();
    return;
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
  delete: async function (id = null) {
    const db = await this.db();
    await db.get(`DELETE FROM ${this.tablename} WHERE id = ${id}`);
    db.close();
    return;
  },
};

module.exports.DocumentVectors = DocumentVectors;
