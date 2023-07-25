const { Queue } = require("../../../models/queue");

async function workspaceDeletedJob(
  organization,
  workspace,
  connector,
  documents,
  user
) {
  if (!connector) {
    console.log(
      `No VectorDB connector found - no workspace/delete job will be queued.`
    );
    return;
  }

  const taskName = `workspace/delete`;
  const jobData = { organization, workspace, connector, documents };
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
  workspaceDeletedJob,
};
