const prisma = require("../utils/prisma");

const RagTest = {
  schedules: {
    hourly: "hourly",
    daily: "daily",
    weekly: "weekly",
    monthly: "monthly",
  },
  status: {
    running: "running",
    failed: "failed",
    complete: "complete",
    alert: "deviation_alert",
  },

  create: async function (data = {}, organizationId, workspaceId) {
    try {
      const { Telemetry } = require("./telemetry");
      const newTest = await prisma.organization_rag_tests.create({
        data: {
          ...data,
          organization_id: Number(organizationId),
          workspace_id: Number(workspaceId),
        },
      });

      if (!newTest) {
        console.error("FAILED TO CREATE RAG TEST.");
        return { job: null, error: "Could not create RAG Test" };
      }

      await Telemetry.sendTelemetry(`rag_test_created`);
      return { test: newTest, error: null };
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  update: async function (testId = 0, updates = {}) {
    try {
      if (!testId) throw new Error("No RAG test run id provided for update");
      const test = await prisma.organization_rag_tests.update({
        where: { id: Number(testId) },
        data: updates,
      });
      return { success: !!test, error: null };
    } catch (e) {
      console.error(e.message);
      return { success: false, error: e.message };
    }
  },

  get: async function (clause = {}, select = null) {
    try {
      const test = await prisma.organization_rag_tests.findFirst({
        where: clause,
        ...(select !== null ? { select } : {}),
      });
      return test ? { ...test } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (
    clause = {},
    limit = null,
    orderBy = null,
    select = null
  ) {
    try {
      const tests = await prisma.organization_rag_tests.findMany({
        where: clause,
        ...(select !== null ? { select } : {}),
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return tests;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organization_rag_tests.count({
        where: clause,
      });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.organization_rag_tests.deleteMany({
        where: clause,
      });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  createRun: async function (testId = 0, status = null, resultJson = {}) {
    try {
      const { Telemetry } = require("./telemetry");
      const test = await this.get({ id: Number(testId) });
      if (!test) throw new Error("Not a valid RAG Test id.");
      if (!status) throw new Error("Invalid status for RAG test run.");

      const newTestRun = await prisma.organization_rag_test_runs.create({
        data: {
          status,
          results: resultJson,
          rag_test_id: test.id,
          organization_id: test.organization_id,
          workspace_id: test.workspace_id,
        },
      });
      if (!newTestRun)
        throw new Error("Failed to create a valid RAG Test Run.");

      await this.update(test.id, { lastRun: new Date() });
      await Telemetry.sendTelemetry(`rag_test_run`);
      return { run: newTestRun, error: null };
    } catch (e) {
      console.error(e.message);
      return { run: null, error: e.message };
    }
  },

  updateRun: async function (runId = 0, updates = {}) {
    try {
      if (!runId) throw new Error("No RAG test run id provided for update");
      const run = await prisma.organization_rag_test_runs.update({
        where: { id: Number(runId) },
        data: updates,
      });
      return { success: !!run, error: null };
    } catch (e) {
      console.error(e.message);
      return { success: false, error: e.message };
    }
  },

  getRuns: async function (
    testId,
    clause = {},
    limit = {},
    orderBy = {},
    select = null
  ) {
    try {
      const testRuns = await prisma.organization_rag_test_runs.findMany({
        where: {
          rag_test_id: testId,
          ...(select !== null ? clause : {}),
        },
        ...(select !== null ? { select } : {}),
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return testRuns;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },
};

module.exports.RagTest = RagTest;
