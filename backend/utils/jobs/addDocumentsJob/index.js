const { Queue } = require("../../../models/queue");

async function addDocumentJob(
  metadata,
  organization,
  workspace,
  connector,
  user
) {
  const taskName = `${connector.type}/addDocument`;
  const jobData = { documents: metadata, organization, workspace, connector };
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
  addDocumentJob,
};
