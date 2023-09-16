const { Queue } = require("../../../models/queue");

async function updateEmbeddingMetadataJob(
  documentVector,
  document,
  organization,
  workspace,
  connector,
  user,
  newMetadata
) {
  const taskName = `${connector.type}/updateFragmentMetadata`;
  const jobData = {
    documentVector,
    document,
    organization,
    workspace,
    connector,
    newMetadata,
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
  updateEmbeddingMetadataJob,
};
