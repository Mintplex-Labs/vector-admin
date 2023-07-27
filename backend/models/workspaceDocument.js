// const { checkForMigrations } = require("../utils/database");
const path = require("path");
const { v5 } = require("uuid");
const { fetchMetadata } = require("../utils/storage");
const { DocumentVectors } = require("./documentVectors");

const WorkspaceDocument = {
  tablename: "workspace_documents",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  docId TEXT NOT NULL UNIQUE,
  organization_id INTEGER NOT NULL,
  workspace_id INTEGER NOT NULL,
  createdAt TEXT DEFAULT (strftime('%s', 'now')),
  lastUpdatedAt TEXT DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
  FOREIGN KEY (workspace_id) REFERENCES organization_workspaces (id) ON DELETE CASCADE
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
  vectorFilenameRaw: function (documentName, workspaceId) {
    const document = { name: documentName, workspace_id: workspaceId };
    return this.vectorFilename(document);
  },
  vectorFilename: function (document) {
    if (!document?.name) return null;
    return v5(`ws_${document.workspace_id}_` + document.name, v5.URL);
  },
  vectorFilepath: function (document) {
    const cacheFilename = this.vectorFilename(document);
    return path.resolve(
      __dirname,
      `../storage/vector-cache/${cacheFilename}.json`
    );
  },
  create: async function (data = null) {
    if (!data) return;
    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (docId, name, workspace_id, organization_id) VALUES (?,?,?,?)`,
        [data.id, data.name, data.workspaceId, data.organizationId]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        console.log(error);
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await db.close();
      console.error("FAILED TO CREATE DOCUMENT.", message);
      return { document: null, message };
    }

    const document = await db.get(
      `SELECT * FROM ${this.tablename} WHERE id = ${id}`
    );
    await db.close();

    return { document, message: null };
  },

  // Used by workers paginateAndStore method to bulk create documents easily during import.
  // document items in array must have documentId, name, metadata (this is document specific - not each vector chunk.), workspaceId, organizationId,
  createMany: async function (documents = []) {
    if (documents.length === 0) return;
    const db = await this.db();
    const stmt = await db.prepare(
      `INSERT INTO ${this.tablename} (docId, name, workspace_id, organization_id) VALUES (?,?,?,?)`
    );

    await db.exec("BEGIN TRANSACTION");
    try {
      for (const document of documents) {
        await stmt.run([
          document.documentId,
          document.name,
          document.workspaceId,
          document.organizationId,
        ]);
      }
      await db.exec("COMMIT");
    } catch {
      await db.exec("ROLLBACK");
    }

    await stmt.finalize();
    await db.close();
    return;
  },
  get: async function (clause = "", withReferences = false) {
    const { OrganizationWorkspace } = require("./organizationWorkspace");
    const db = await this.db();
    const result = await db
      .get(`SELECT * FROM ${this.tablename} WHERE ${clause}`)
      .then((res) => res || null);
    if (!result) return null;
    await db.close();
    if (!withReferences) return result;

    return {
      ...result,
      workspace: await OrganizationWorkspace.get(`id = ${result.workspace_id}`),
    };
  },
  where: async function (clause = null, limit = null, withReferences = false) {
    if (!withReferences) {
      const db = await this.db();
      const results = await db.all(
        `SELECT * FROM ${this.tablename} ${clause ? `WHERE ${clause}` : ""} ${!!limit ? `LIMIT ${limit}` : ""
        }`
      );
      await db.close();
      return results;
    }

    const { OrganizationWorkspace } = require("./organizationWorkspace");
    const db = await this.db();
    const results = await db.all(
      `SELECT *, ow.slug as workspace_slug, ow.name as workspace_name
      FROM ${this.tablename} as wd
      LEFT JOIN ${OrganizationWorkspace.tablename} as ow ON ow.id = wd.workspace_id
       ${clause ? `WHERE wd.${clause}` : ""} ${!!limit ? `LIMIT ${limit}` : ""
      }`
    );
    await db.close();

    const completeResults = results.map((res) => {
      const { workspace_slug, workspace_name, ...rest } = res
      return {
        ...rest,
        workspace: {
          slug: workspace_slug,
          name: workspace_name,
        }
      }
    })

    return completeResults;
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
  countForEntity: async function (field = "organization_id", value = null) {
    return await this.count(`${field} = ${value}`);
  },
  calcVectors: async function (field = "organization_id", value = null) {
    try {
      const documents = await this.where(`${field} = ${value}`);
      if (documents.length === 0) return 0;

      const docIdSet = new Set();
      documents.forEach((doc) => docIdSet.add(doc.id));
      const docIds = Array.from(docIdSet);
      const vectorCount = await DocumentVectors.count(
        `document_id IN (${docIds.join(",")})`
      );
      return vectorCount;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },
  calcVectorCache: async function (field = "organization_id", value = null) {
    const documents = await this.where(`${field} = ${value}`);

    var totalBytes = 0;
    for (const document of documents) {
      try {
        const cacheFilepath = this.vectorFilepath(document);
        const metadata = await fetchMetadata(cacheFilepath);
        totalBytes += Number(metadata?.size);
      } catch (e) {
        console.error(e);
      }
    }

    return totalBytes;
  },
  deleteWhere: async function (clause = null) {
    const db = await this.db();
    await db.get(`DELETE FROM ${this.tablename} WHERE ${clause}`);
    await db.close();
    return;
  },
  delete: async function (id = null) {
    const db = await this.db();
    await db.get(`DELETE FROM ${this.tablename} WHERE id = ${id}`);
    await db.close();
    return;
  },
};

module.exports.WorkspaceDocument = WorkspaceDocument;
