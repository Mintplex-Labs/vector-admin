const { Queue } = require("../../../models/queue");

async function organizationMigrationJob(
  organization,
  destinationOrganization,
  user
) {
  const taskName = `organization/migrate`;
  const jobData = { organization, destinationOrganization };
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
  organizationMigrationJob,
};
