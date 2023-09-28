process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();
const { SystemSettings } = require("../models/systemSettings");
const { systemInit } = require("../utils/boot");
const { dumpENV } = require("../utils/env");
const { reqBody, userFromSession } = require("../utils/http");
const { getGitVersion, getDiskStorage } = require("../utils/metrics");
const { validatedRequest } = require("../utils/middleware/validatedRequest");

function systemEndpoints(app) {
  if (!app) return;

  app.get("/ping", (_, response) => {
    response.sendStatus(200);
  });

  app.get("/system/metrics", async (_, response) => {
    try {
      const metrics = {
        online: true,
        version: getGitVersion(),
        storage: await getDiskStorage(),
      };
      response.status(200).json(metrics);
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.get("/env-dump", async (_, response) => {
    if (process.env.NODE_ENV !== "production")
      return response.sendStatus(200).end();
    await dumpENV();
    response.sendStatus(200).end();
  });

  app.get("/migrate", async (_, response) => {
    const execSync = require("child_process").execSync;
    execSync("npx prisma migrate deploy --schema=./prisma/schema.prisma", {
      stdio: "inherit",
    });
    response.sendStatus(200).end();
  });

  app.get(
    "/system/setting/:label/exists",
    [validatedRequest],
    async (request, response) => {
      try {
        const { label } = request.params;
        if (!SystemSettings.supportedFields.includes(label)) {
          response.status(404).json({ label, exists: false });
          return;
        }

        const config = await SystemSettings.get({ label });
        response.status(200).json({ label, exists: !!config?.value });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/system/setting/:label",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const { label } = request.params;
        if (!SystemSettings.supportedFields.includes(label)) {
          response.status(404).json({ label, value: null });
          return;
        }

        const config = await SystemSettings.get({ label });
        if (!config) {
          response.status(200).json({
            label,
            value: "",
          });
          return;
        }

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
    }
  );

  app.post(
    "/system/update-settings",
    [validatedRequest],
    async (request, response) => {
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
    }
  );

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
