process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();
const { DocumentVectors } = require("../../models/documentVectors");
const { Organization } = require("../../models/organization");
const { OrganizationApiKey } = require("../../models/organizationApiKey");
const {
  OrganizationConnection,
} = require("../../models/organizationConnection");
const { OrganizationUser } = require("../../models/organizationUser");
const { OrganizationWorkspace } = require("../../models/organizationWorkspace");
const { Queue } = require("../../models/queue");
const { SystemSettings } = require("../../models/systemSettings");
const { Telemetry } = require("../../models/telemetry");
const { User } = require("../../models/user");
const { WorkspaceDocument } = require("../../models/workspaceDocument");
const { getGitVersion } = require("../metrics");

function findOrCreateDBFile() {
  const fs = require("fs");
  const path = require("path");
  const storageFolder = path.resolve(__dirname, `../../storage/`);
  const dbPath = `${storageFolder}/vdbms.db`;
  if (!fs.existsSync(storageFolder)) fs.mkdirSync(storageFolder);
  if (fs.existsSync(dbPath)) return;
  fs.writeFileSync(dbPath, "");
  console.log("SQLite db created on boot.");
  return;
}

function findOrCreateJobDBFile() {
  const path = require("path");
  const fs = require("fs");
  const storageFolder = path.resolve(__dirname, `../../storage/`);
  const dbPath = `${storageFolder}/job_queue.db`;
  if (!fs.existsSync(storageFolder)) fs.mkdirSync(storageFolder);
  if (fs.existsSync(dbPath)) return;
  fs.writeFileSync(dbPath, "");
  console.log("SQLite jobs db created on boot.");
  return;
}

function setupVectorCacheStorage() {
  const fs = require("fs");
  const path = require("path");
  const storageFolder = path.resolve(__dirname, `../../storage/vector-cache`);
  if (!fs.existsSync(storageFolder))
    fs.mkdirSync(storageFolder, { recursive: true });
  console.log("Storage folder for vector-cache created.");
  return;
}

// Init all tables so to not try to reference foreign key
// tables that may not exist and also have their schema available.
async function initTables() {
  (await SystemSettings.db()).close();
  (await User.db()).close();
  (await Organization.db()).close();
  (await OrganizationApiKey.db()).close();
  (await OrganizationConnection.db()).close();
  (await OrganizationUser.db()).close();
  (await OrganizationWorkspace.db()).close();
  (await WorkspaceDocument.db()).close();
  (await DocumentVectors.db()).close();
  (await Queue.db()).close();
}

// Telemetry is anonymized and your data is never read. This can be disabled by setting
// DISABLE_TELEMETRY=true in the `.env` of however you setup. Telemetry helps us determine use
// of how VectorAdmin is used and how to improve this product!
// You can see all Telemetry events by ctrl+f `Telemetry.sendEvent` calls to verify this claim.
async function setupTelemetry() {
  if (process.env.DISABLE_TELEMETRY === "true") {
    console.log(
      `\x1b[31m[TELEMETRY DISABLED]\x1b[0m Telemetry is marked as disabled - no events will send. Telemetry helps Mintplex Labs Inc improve VectorAdmin.`
    );
    return true;
  }

  if (Telemetry.isDev()) {
    console.log(
      `\x1b[33m[TELEMETRY STUBBED]\x1b[0m Anonymous Telemetry stubbed in development.`
    );
    return;
  }

  console.log(
    `\x1b[32m[TELEMETRY ENABLED]\x1b[0m Anonymous Telemetry enabled. Telemetry helps Mintplex Labs Inc improve VectorAdmin.`
  );
  await Telemetry.findOrCreateId();
  await Telemetry.sendTelemetry("server_boot", {
    commit: getGitVersion(),
  });
  return;
}

async function systemInit() {
  try {
    await findOrCreateDBFile();
    await findOrCreateJobDBFile();
    await setupVectorCacheStorage();
    await initTables();
    await setupTelemetry();
    const completeSetup = (await User.count('role = "admin"')) > 0;
    if (completeSetup) return;

    process.env.SYS_EMAIL = process.env.SYS_EMAIL ?? "root@vectoradmin.com";
    process.env.SYS_PASSWORD = process.env.SYS_PASSWORD ?? "password";

    const existingRootUser = await User.get(
      `email = '${process.env.SYS_EMAIL}' AND role = 'root'`
    );
    if (existingRootUser) return;

    const bcrypt = require("bcrypt");
    const userDb = await User.db();
    const { success, message } = await userDb
      .run(
        `INSERT INTO ${User.tablename} (email, password, role) VALUES (?, ?, 'root')`,
        [process.env.SYS_EMAIL, bcrypt.hashSync(process.env.SYS_PASSWORD, 10)]
      )
      .then((res) => {
        return { id: res.lastID, success: true, message: null };
      })
      .catch((error) => {
        return { id: null, success: false, message: error.message };
      });

    if (!success) {
      await userDb.close();
      console.error("FAILED TO CREATE ROOT USER.", message);
    }

    console.log("Root user created with credentials");
    return;
  } catch (e) {
    console.error("systemInit", e.message, e);
    return;
  }
}

module.exports.systemInit = systemInit;
