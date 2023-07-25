process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { validatedRequest } = require("./utils/middleware/validatedRequest");
const { validSessionForUser } = require("./utils/http");
const { systemEndpoints } = require("./endpoints/system");
const { systemInit } = require("./utils/boot");
const { authenticationEndpoints } = require("./endpoints/auth");
const { v1Endpoints } = require("./endpoints/v1");
// const { validateTablePragmas } = require("./utils/database");
const app = express();
const apiRouter = express.Router();

app.use(cors({ origin: true }));
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

authenticationEndpoints(app);
apiRouter.use("/system/*", validatedRequest);
systemEndpoints(app);

apiRouter.use("/v1/*", validSessionForUser);
v1Endpoints(app);

if (process.env.NODE_ENV !== "development") {
  app.use(
    express.static(path.resolve(__dirname, "public"), { extensions: ["js"] })
  );

  app.use("/", function (_, response) {
    response.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

app.all("*", function (_, response) {
  response.sendStatus(404);
});

app
  .listen(process.env.SERVER_PORT || 3001, async () => {
    // await validateTablePragmas();
    await systemInit();
    console.log(
      `Example app listening on port ${process.env.SERVER_PORT || 3001}`
    );
  })
  .on("error", function (err) {
    process.once("SIGUSR2", function () {
      process.kill(process.pid, "SIGUSR2");
    });
    process.on("SIGINT", function () {
      process.kill(process.pid, "SIGINT");
    });
  });
