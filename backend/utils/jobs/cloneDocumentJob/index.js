const { Queue } = require("../../../models/queue");
const { selectConnector } = require("../../vectordatabases/providers");

async function cloneDocumentJob(
  organization,
  workspace,
  document,
  connector,
  user
) {
  const taskName = `${connector.type}/cloneDocument`;
  const jobData = { organization, workspace, document, connector };
  const vectorDBClient = selectConnector(connector);

  if (vectorDBClient.name === "pinecone" && vectorDBClient.isStarterTier()) {
    return {
      job: null,
      error: `Your Pinecone index does not allow namespace creation so you cannot perform this action.`,
    };
  }

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
  cloneDocumentJob,
};
