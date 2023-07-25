process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();
const { SystemSettings } = require("../models/systemSettings");
const { systemInit } = require("../utils/boot");
const { reqBody, userFromSession } = require("../utils/http");
// const { validateTablePragmas } = require("../utils/database");

function systemEndpoints(app) {
  if (!app) return;

  app.get("/ping", (_, response) => {
    response.sendStatus(200);
  });

  app.get("/migrate", async (_, response) => {
    // await validateTablePragmas(true);
    response.sendStatus(200).end();
  });

  app.get("/system/setting/:label/exists", async (request, response) => {
    try {
      const { label } = request.params;
      if (!SystemSettings.supportedFields.includes(label)) {
        response.status(404).json({ label, exists: false });
        return;
      }

      const config = await SystemSettings.get(`label = '${label}'`);
      response.status(200).json({ label, exists: !!config?.value });
    } catch (e) {
      console.log(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.get("/system/setting/:label", async (request, response) => {
    try {
      const { label } = request.params;
      if (!SystemSettings.supportedFields.includes(label)) {
        response.status(404).json({ label, value: null });
        return;
      }

      const config = await SystemSettings.get(`label = '${label}'`);
      if (SystemSettings.privateField.includes(label)) {
        response.status(200).json({
          ...config,
          value: new Array((config?.value?.length || 0) + 1).join("*"),
        });
      } else {
        response.status(200).json(config);
      }
    } catch (e) {
      console.log(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.post("/system/update-settings", async (request, response) => {
    try {
      const { config } = reqBody(request);
      const user = await userFromSession(request);
      if (!user) {
        response.sendStatus(403).end();
        return;
      }
      const { success, error } = await SystemSettings.updateSettings(config);
      response.status(200).json({ success, error });
    } catch (e) {
      console.log(e.message, e);
      response.sendStatus(500).end();
    }
  });

  app.get("/boot", async (_, response) => {
    try {
      await systemInit();
      response.sendStatus(200).end();
    } catch (e) {
      console.log(e.message, e);
      response.sendStatus(500).end();
    }
  });
}

module.exports = { systemEndpoints };
