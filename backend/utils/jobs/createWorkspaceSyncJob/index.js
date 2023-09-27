const { Queue } = require("../../../models/queue");

async function createWorkspaceSyncJob(
  organization,
  workspace,
  connector,
  user
) {
  const taskName = `${connector.type}/sync-workspace`;
  const hasPendingJob = await Queue.get({
    organization_id: Number(organization.id),
    status: Queue.status.pending,
    taskName,
  });
  if (hasPendingJob) return { job: hasPendingJob, error: null };

  const jobData = { organization, workspace, connector };
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
  createWorkspaceSyncJob,
};
