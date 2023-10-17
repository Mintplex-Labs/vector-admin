const prisma = require("../utils/prisma");

const RagTest = {
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

  get: async function (clause = {}, select = {}) {
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

  getRuns: async function (
    testId,
    clause = {},
    limit = {},
    orderBy = {},
    select = {}
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
