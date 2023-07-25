const { Queue } = require("../../../models/queue");

async function cloneWorkspaceJob(
  organization,
  workspace,
  connector,
  newWorkspaceName,
  user
) {
  const taskName = `${connector.type}/cloneWorkspace`;
  const jobData = { organization, workspace, newWorkspaceName, connector };
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
  cloneWorkspaceJob,
};
