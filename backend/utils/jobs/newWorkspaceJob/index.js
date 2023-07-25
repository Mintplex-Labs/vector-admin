const { Queue } = require("../../../models/queue");

async function newWorkspaceJob(organization, workspace, connector, user) {
  const taskName = `workspace/new`;
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
  newWorkspaceJob,
};
