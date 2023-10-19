const { Notification } = require('../../../backend/models/notification');
const {
  OrganizationConnection,
} = require('../../../backend/models/organizationConnection');
const {
  OrganizationWorkspace,
} = require('../../../backend/models/organizationWorkspace');
const { Queue } = require('../../../backend/models/queue');
const { RagTest } = require('../../../backend/models/ragTest');
const {
  selectConnector,
} = require('../../../backend/utils/vectordatabases/providers');
const { InngestClient } = require('../../utils/inngest');

const DELTA_THRESHOLD = 0.25;
const runRAGTest = InngestClient.createFunction(
  { name: 'RAG Test for Workspace' },
  { event: 'rag-test/run' },
  async ({ event, step: _step, logger }) => {
    var result = {};
    const { organization, testId, jobId = null } = event.data;
    const { run } = await RagTest.createRun(testId, RagTest.status.running);

    try {
      const test = await RagTest.get({ id: Number(testId) });
      const workspace = await OrganizationWorkspace.get({
        id: test.workspace_id,
      });
      const connector = await OrganizationConnection.get({
        organization_id: Number(organization.id),
      });
      if (!test) throw new Error(`No RAG test found for id ${testId}`);
      if (!connector) throw new Error(`No vector database connection found.`);

      const errorLog = [];
      const knownVectors = {};
      Object.values(test.comparisons).forEach((obj) => {
        knownVectors[obj.vectorId] = obj;
      });

      const vectorDB = selectConnector(connector);
      const { vectorIds, contextTexts, scores } =
        await vectorDB.similarityResponse(
          workspace.fname,
          test.promptVector,
          test.topK
        );

      // Check if searched vectorIds all appear in known ids
      const newVectorIds = vectorIds.filter(
        (id) => !knownVectors.hasOwnProperty(id)
      );
      const missingVectorIds = Object.keys(knownVectors).filter(
        (id) => !vectorIds.includes(id)
      );

      // Calculate Score deviations for known vectors
      const highScoreDeltaVectorIds = [];
      const matchedVectorIds = vectorIds.filter((id) =>
        knownVectors.hasOwnProperty(id)
      );
      matchedVectorIds.forEach((vectorId, i) => {
        // idx wont be -1 because matchedVectorIds already
        // checked this vectorId was returned.
        const matchingIdx = vectorIds.indexOf(vectorId);
        const currentScore = knownVectors[vectorId].score;
        const score = scores[matchingIdx];
        const signMultiple = score < currentScore ? -1 : 1;
        const delta = (currentScore - score) * signMultiple;

        if (Math.abs(delta) >= DELTA_THRESHOLD)
          highScoreDeltaVectorIds.push(vectorId);
        knownVectors[vectorId].newScore = score;
        knownVectors[vectorId].deltaScore = delta;

        // Append the text content of the search to the data so we
        // can compare with testing text later.
        knownVectors[vectorId].textContent = contextTexts[matchingIdx];
      });

      newVectorIds.forEach((vectorId) => {
        errorLog.push({
          vectorId,
          message: `A new vector ${vectorId} was returned. It was not previously seen in the comparison data.`,
        });
      });

      missingVectorIds.forEach((vectorId) => {
        errorLog.push({
          vectorId,
          message: `Vector ${vectorId} was expected to be present, but is missing.`,
        });
      });

      highScoreDeltaVectorIds.forEach((vectorId) => {
        const delta = knownVectors[vectorId].deltaScore;
        errorLog.push({
          vectorId,
          message: `Known vector ${vectorId} had a relevancy score deviation greater than ±${
            DELTA_THRESHOLD * 100
          }% with ${(delta * 100).toFixed(2)}%.`,
        });
      });

      const compactResult = {};
      Object.keys(knownVectors).map((vector) => {
        const {
          score: baseScore,
          newScore,
          deltaScore,
          textContent,
        } = knownVectors[vector];
        compactResult[vector] = {
          baseScore,
          newScore,
          deltaScore,
          textContent,
        };
      });

      await RagTest.updateRun(run?.id, {
        status:
          errorLog.length > 0 ? RagTest.status.alert : RagTest.status.complete,
        results: {
          errorLog,
          newVectorIds,
          missingVectorIds,
          highScoreDeltaVectorIds,
          vectorMap: compactResult,
        },
      });

      // If test failed - push to notifications
      if (errorLog.length > 0) {
        await Notification.create(test.organization_id, {
          textContent: 'Your RAG test did not pass.',
          symbol: Notification.symbols.error,
          link: `dashboard/${organization.slug}/tools/rag-testing/${test.id}`,
          target: '_blank',
        });
      }

      result = {
        message: `RAG test #${test.id} completed without exiting. Test run was logged.`,
      };
      await Queue.updateJob(jobId, Queue.status.complete, result);
      return { result };
    } catch (e) {
      const result = {
        message: `Job failed with error`,
        error: e.message,
        details: e,
      };
      await RagTest.updateRun(run?.id, {
        status: RagTest.status.failed,
        results: {
          message: e.message,
        },
      });
      await Queue.updateJob(jobId, Queue.status.failed, result);
      return { result };
    }
  }
);

module.exports = {
  runRAGTest,
};
