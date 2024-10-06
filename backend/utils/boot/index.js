process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

const { Telemetry } = require("../../models/telemetry");
const { getGitVersion } = require("../metrics");

function setupVectorCacheStorage() {
  const fs = require("fs");
  const path = require("path");
  const storageFolder = path.resolve(__dirname, `../../storage/vector-cache`);
  if (!fs.existsSync(storageFolder))
    fs.mkdirSync(storageFolder, { recursive: true });
  console.log("Storage folder for vector-cache created.");
  return;
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

  if (!Telemetry.isDev()) {
    console.log(
      `\x1b[32m[TELEMETRY ENABLED]\x1b[0m Anonymous Telemetry enabled. Telemetry helps Mintplex Labs Inc improve VectorAdmin.`
    );
  }

  await Telemetry.findOrCreateId();
  await Telemetry.sendTelemetry("server_boot", {
    commit: getGitVersion(),
  });
  return;
}

async function systemInit() {
  try {
    setupVectorCacheStorage();
    await setupTelemetry();
  } catch (e) {
    console.error("systemInit", e.message, e);
    return;
  }
}

module.exports.systemInit = systemInit;
