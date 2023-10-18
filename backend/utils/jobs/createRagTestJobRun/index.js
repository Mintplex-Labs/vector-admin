const { Queue } = require("../../../models/queue");

async function createRagTestJobRun(organization, testId, user) {
  const taskName = `rag-test/run`;
  const pendingJob = await Queue.get({
    organization_id: Number(organization.id),
    status: Queue.status.pending,
    taskName,
  });

  // TODO ENABLE for merge
  // if (pendingJob) {
  //   const pendingJobData = JSON.parse(pendingJob.data);
  //   if (pendingJobData.testId === testId) {
  //     return { job: null, error: "A job like this is currently running." };
  //   }
  // }

  const jobData = { organization, testId };
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
  createRagTestJobRun,
};
