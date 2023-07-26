const dbAdmin = require("express-admin");
const path = require("path");
const { SystemSettings } = require("../../models/systemSettings");

function generatePwd(length = 10) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

async function saveDebug(username, password) {
  await SystemSettings.updateSettings({
    debug_username: username,
    debug_pwd: password,
  });
  return true;
}

function setupDebugger(app) {
  const username = generatePwd(12);
  const password = generatePwd(24);

  app.use(
    "/debug/vdbms",
    dbAdmin({
      config: {
        sqlite: {
          database: path.resolve(__dirname, "../../storage/vdbms.db"),
        },
        admin: {
          settings: path.resolve(__dirname, "../../storage/settings.json"),
          layouts: false,
          languages: false,
          favicon: "/favicon.ico",
          root: "/debug/vdbms",
        },
      },
      users: {
        [username]: {
          name: username,
          pass: password,
        },
      },
      custom: {
        ensurePragma: {
          events: path.resolve(__dirname, "dbevents.js"),
        },
      },
    })
  );

  app.use(
    "/debug/jobs",
    dbAdmin({
      config: {
        sqlite: {
          database: path.resolve(__dirname, "../../storage/job_queue.db"),
        },
        admin: {
          settings: path.resolve(__dirname, "../../storage/job_settings.json"),
          layouts: false,
          languages: false,
          favicon: "/favicon.ico",
          root: "/debug/jobs",
        },
      },
      users: {
        [username]: {
          name: username,
          pass: password,
        },
      },
      custom: {
        ensurePragma: {
          events: path.resolve(__dirname, "dbevents.js"),
        },
      },
    })
  );

  saveDebug(username, password);
}
module.exports.setupDebugger = setupDebugger;
