const { DocumentProcessor } = require("../../../models/documentProcessor");
const { userFromSession, validSessionForUser } = require("../../../utils/http");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function documentProcessorEndpoints(app) {
  if (!app) return;

  app.get(
    "/v1/document-processor/status",
    [validSessionForUser],
    async function (request, response) {
      try {
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }
        const online = await DocumentProcessor.status();
        response.sendStatus(online ? 200 : 503).end();
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/v1/document-processor/filetypes",
    [validSessionForUser],
    async function (request, response) {
      try {
        const user = await userFromSession(request);
        if (!user) {
          response.sendStatus(403).end();
          return;
        }

        const types = await DocumentProcessor.acceptedFileTypes();
        if (!types) {
          response.sendStatus(404).end();
          return;
        }

        response.status(200).json({ types });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { documentProcessorEndpoints };
