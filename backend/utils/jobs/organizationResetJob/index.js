const { Queue } = require("../../../models/queue");

async function organizationResetJob(organization, user) {
  const taskName = `organization/reset`;
  const jobData = { organization };
  const { job, error } = await Queue.create(
    taskName,
    jobData,
    user.id,
    organization.id
  );
  if (!!error) return { job, error };
  await Queue.sendJob({
    name: taskName,
    data: {
      jobId: job.id,
      ...jobData,
    },
  });
  return { job, error: null };
}

module.exports = {
  organizationResetJob,
};
