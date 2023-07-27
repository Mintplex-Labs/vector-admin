// const { checkForMigrations } = require("../utils/database");
const uuidAPIKey = require("uuid-apikey");
const slugify = require("slugify");
const { WorkspaceDocument } = require("./workspaceDocument");
const { selectConnector } = require("../utils/vectordatabases/providers");

const OrganizationWorkspace = {
  tablename: "organization_workspaces",
  colsInit: `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  uuid TEXT NOT NULL UNIQUE,
  organization_id INTEGER NOT NULL,
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
    return `ws-${uuidAPIKey.create().apiKey}`;
  },
  // Will check the relevant connector to make sure the slug and namespace/collection map
  safeCreate: async function (
    workspaceName = "",
    organizationId = 0,
    dbConnectorRecord
  ) {
    if (!workspaceName)
      return { workspace: null, message: "No Workspace name provided." };
    const connector = selectConnector(dbConnectorRecord);

    var slug = slugify(workspaceName, { lower: true });
    const existingDbBySlug = await this.get(`slug = '${slug}'`);
    const existingConnectorNamespace = await connector.namespace(slug);

    // If there was a name collision in the DB or the vectorstore collection - make a unique slug.
    // as the namespace/collection will always be the slug.
    if (!!existingDbBySlug || !!existingConnectorNamespace) {
      const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
      slug = slugify(`${workspaceName}-${slugSeed}`, { lower: true });
    }

    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (name, slug, uuid, organization_id) VALUES (?, ?, ?, ?)`,
        [workspaceName, slug, this.makeKey(), organizationId]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await db.close();
      console.error("FAILED TO CREATE WORKSPACE.", message);
      return { workspace: null, message };
    }

    const workspace = await db.get(
      `SELECT * FROM ${this.tablename} WHERE id = ${id}`
    );
    await db.close();

    return { workspace, message: null };
  },
  create: async function (workspaceName = "", organizationId = 0) {
    if (!workspaceName)
      return { workspace: null, message: "No Workspace name provided." };
    var slug = slugify(workspaceName, { lower: true });

    const existingBySlug = await this.get(`slug = '${slug}'`);
    if (!!existingBySlug) {
      const slugSeed = Math.floor(10000000 + Math.random() * 90000000);
      slug = slugify(`${workspaceName}-${slugSeed}`, { lower: true });
    }

    const db = await this.db();
    const { id, success, message } = await db
      .run(
        `INSERT INTO ${this.tablename} (name, slug, uuid, organization_id) VALUES (?, ?, ?, ?)`,
        [workspaceName, slug, this.makeKey(), organizationId]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await db.close();
      console.error("FAILED TO CREATE WORKSPACE.", message);
      return { workspace: null, message };
    }

    const workspace = await db.get(
      `SELECT * FROM ${this.tablename} WHERE id = ${id}`
    );
    await db.close();

    return { workspace, message: null };
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
  forOrganization: async function (organizationId) {
    const orgWorkspaces = await this.where(
      `organization_id = ${organizationId}`
    );
    const workspaces = [];
    for (const workspace of orgWorkspaces) {
      workspaces.push({
        ...workspace,
        documentCount: await WorkspaceDocument.count(
          `workspace_id = ${workspace.id}`
        ),
      });
    }

    return workspaces;
  },
  bySlugAndOrg: async function (wsSlug, organizationId = null) {
    return await this.get(
      `slug = '${wsSlug}' AND organization_id = ${organizationId}`
    );
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
  deleteAllForOrganization: async function (organizationId = "") {
    const db = await this.db();
    await db.exec(
      `DELETE FROM ${this.tablename} WHERE organization_id = ${organizationId}`
    );
    await db.close();
    return;
  },
  delete: async function (clause = null) {
    const db = await this.db();
    await db.exec(`DELETE FROM ${this.tablename} WHERE ${clause}`);
    await db.close();
    return;
  },
};

module.exports.OrganizationWorkspace = OrganizationWorkspace;
