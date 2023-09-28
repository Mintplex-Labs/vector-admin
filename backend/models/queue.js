const prisma = require("../utils/prisma");
require("dotenv").config();

const Queue = {
  status: {
    pending: "pending",
    failed: "failed",
    complete: "complete",
  },

  create: async function (task, data = {}, userId = null, organizationId) {
    try {
      const { Telemetry } = require("./telemetry");
      const newJob = await prisma.jobs.create({
        data: {
          taskName: task,
          data: JSON.stringify(data),
          result: JSON.stringify({ status: "Job queued" }),
          run_by_user_id: Number(userId),
          organization_id: Number(organizationId),
        },
      });

      if (!newJob) {
        console.error("FAILED TO CREATE JOB.");
        return { job: null, error: "Could not create Job" };
      }

      await Telemetry.sendTelemetry(`job_queued`, { name: task });
      return { job: newJob, error: null };
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  get: async function (clause = {}) {
    try {
      const job = await prisma.jobs.findFirst({
        where: clause,
      });
      return job ? { ...job } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null, orderBy = null) {
    try {
      const jobs = await prisma.jobs.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return jobs;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.jobs.count({
        where: clause,
      });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  sendJob: async function (data) {
    await fetch(`http://127.0.0.1:3355/send`, {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.ok)
      .catch((e) => {
        console.error("Failed to send background worker job", e.message);
      });
  },

  updateJob: async function (jobId, status, result) {
    try {
      const updatedJob = await prisma.jobs.update({
        where: { id: Number(jobId) },
        data: {
          status,
          result: JSON.stringify(result),
        },
      });

      if (!updatedJob) {
        console.error("Could not update Job");
        return null;
      }
      return updatedJob;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },
};

module.exports.Queue = Queue;
