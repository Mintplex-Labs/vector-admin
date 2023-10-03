const { Organization } = require("../../../models/organization");
const { Queue } = require("../../../models/queue");
const {
  userFromSession,
  validSessionForUser,
  reqBody,
} = require("../../../utils/http");
const {
  organizationMigrationJob,
} = require("../../../utils/jobs/organizationMigrationJob");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function toolEndpoints(app) {
  if (!app) return;

  app.post(
    "/v1/tools/org/:orgSlug/migrate",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { orgSlug } = request.params;
        const { destinationOrgId } = reqBody(request);
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const organization = await Organization.getWithOwner(user.id, {
          slug: orgSlug,
        });
        if (!organization) {
          response
            .status(200)
            .json({ success: false, message: "No org found." });
          return;
        }

        const destinationOrg = await Organization.getWithOwner(user.id, {
          id: Number(destinationOrgId),
        });
        if (!destinationOrg) {
          response
            .status(200)
            .json({
              success: false,
              message: "Destination org does not exit.",
            });
          return;
        }

        const existingJobForOrg = await Queue.get({
          taskName: "workspace/migrate",
          status: "pending",
          organization_id: organization.id,
        });
        const existingJobForDestinationOrg = await Queue.get({
          taskName: "workspace/migrate",
          status: "pending",
          organization_id: destinationOrg.id,
        });
        //TODO - uncomment if (!!existingJobForOrg || !!existingJobForDestinationOrg) {
        //   response.status(200).json({ success: false, message: "There is an existing migration job already running for these organizations." });
        //   return;
        // }

        await organizationMigrationJob(organization, destinationOrg, user);
        response
          .status(200)
          .json({ success: true, message: "Migration job queued." });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { toolEndpoints };
