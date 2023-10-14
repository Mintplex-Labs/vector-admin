const { Queue } = require("../../../models/queue");
const { selectConnector } = require("../../vectordatabases/providers");

async function cloneWorkspaceJob(
  organization,
  workspace,
  connector,
  newWorkspaceName,
  user
) {
  const taskName = `${connector.type}/cloneWorkspace`;
  const jobData = { organization, workspace, newWorkspaceName, connector };
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
  cloneWorkspaceJob,
};
