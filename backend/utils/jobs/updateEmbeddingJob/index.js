const { Queue } = require("../../../models/queue");

async function updateEmbeddingJob(
  documentVector,
  document,
  organization,
  workspace,
  connector,
  user,
  newText
) {
  const taskName = `${connector.type}/updateFragment`;
  const jobData = {
    documentVector,
    document,
    organization,
    workspace,
    connector,
    newText,
  };
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
  updateEmbeddingJob,
};
