const { Queue } = require("../../../models/queue");

async function documentDeletedJob(
  organization,
  workspace,
  document,
  connector,
  user
) {
  const taskName = `${connector.type}/deleteDocument`;
  const jobData = { organization, workspace, connector, document };
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
  documentDeletedJob,
};
