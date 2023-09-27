process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { systemEndpoints } = require("./endpoints/system");
const { systemInit } = require("./utils/boot");
const { authenticationEndpoints } = require("./endpoints/auth");
const { v1Endpoints } = require("./endpoints/v1");
const { setupDebugger } = require("./utils/debug");
const { Telemetry } = require("./models/telemetry");
const app = express();
const apiRouter = express.Router();

app.use(cors({ origin: true }));
app.use(
  bodyParser.text({
    limit: "10GB",
  })
);
app.use(
  bodyParser.json({
    limit: "10GB",
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "10GB",
    extended: true,
  })
);

app.use("/api", apiRouter);
authenticationEndpoints(apiRouter);
systemEndpoints(apiRouter);
v1Endpoints(apiRouter);

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
    // setupDebugger(apiRouter); //TODO: DEBUGGER
    console.log(
      `Example app listening on port ${process.env.SERVER_PORT || 3001}`
    );
  })
  .on("error", function (err) {
    process.once("SIGUSR2", function () {
      Telemetry.flush();
      process.kill(process.pid, "SIGUSR2");
    });
    process.on("SIGINT", function () {
      Telemetry.flush();
      process.kill(process.pid, "SIGINT");
    });
  });
