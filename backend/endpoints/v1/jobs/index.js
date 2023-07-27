const { Queue } = require("../../../models/queue");
const { userFromSession, validSessionForUser } = require("../../../utils/http");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function jobEndpoints(app) {
  if (!app) return;

  app.post(
    "/v1/jobs/:jobId/retry",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { jobId } = request.params;
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const existingJob = await Queue.get(`id = ${jobId}`);
        if (!existingJob || existingJob.status !== Queue.status.failed) {
          response.sendStatus(403).end();
          return;
        }

        const jobData = JSON.parse(existingJob.data);
        const { job, error } = await Queue.create(
          existingJob.taskName,
          jobData,
          user.id,
          existingJob.organizationId
        );

        if (!!error) {
          response.sendStatus(200).json({ job, error });
          return;
        }
        await Queue.sendJob({
          name: existingJob.taskName,
          data: {
            jobId: job.id,
            ...jobData,
          },
        });

        response.status(200).json({ job, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/v1/jobs/:jobId",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { jobId } = request.params;
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const existingJob = await Queue.get(`id = ${jobId}`);
        if (!existingJob || existingJob.status !== Queue.status.pending) {
          response.sendStatus(403).end();
          return;
        }

        const result = {
          message: `Job was aborted by ${user.email}.`,
          error: `Job was aborted by ${user.email}.`,
          details: null,
        };
        await Queue.updateJob(jobId, Queue.status.failed, result);
        response.sendStatus(200).end();
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { jobEndpoints };
