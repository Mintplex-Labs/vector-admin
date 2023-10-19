const { RagTest } = require('../../../../backend/models/ragTest');
const { InngestClient } = require('../../../utils/inngest');

const runHourlyRagTest = InngestClient.createFunction(
  {
    id: 'rag-testing-hourly-cron',
    name: 'RAG Test for Workspace - Hourly Cron',
  },
  { cron: 'TZ=America/Los_Angeles * * * * *' },
  async () => {
    try {
      console.log(`\n\x1b[33m[CRON: Running hourly RAG Test Cron]\x1b[0m`);
      const eligibleTests = await RagTest.where(
        {
          enabled: true,
          frequencyType: RagTest.schedules.hourly,
        },
        null,
        null,
        {
          id: true,
          enabled: true,
          organization: true,
        }
      );
      if (eligibleTests.length === 0) return;

      console.log(
        `\x1b[34m[INFO]\x1b[0m ${eligibleTests.length} eligible tests to run. Fanning out workers.`
      );
      eligibleTests.forEach(async (test) => {
        await InngestClient.send({
          name: 'rag-test/run',
          data: {
            jobId: null, // not associated with a job.
            organization: test.organization,
            testId: test.id,
          },
        });
      });

      return;
    } catch (e) {
      console.error(e.message);
      return;
    }
  }
);

const runDailyRagTest = InngestClient.createFunction(
  {
    id: 'rag-testing-daily-cron',
    name: 'RAG Test for Workspace - Daily Cron',
  },
  { cron: 'TZ=America/Los_Angeles 0 18 * * *' },
  async () => {
    try {
      console.log(`\n\x1b[33m[CRON: Running daily RAG Test Cron]\x1b[0m`);
      const eligibleTests = await RagTest.where(
        {
          enabled: true,
          frequencyType: RagTest.schedules.daily,
        },
        null,
        null,
        {
          id: true,
          enabled: true,
          organization: true,
        }
      );
      if (eligibleTests.length === 0) return;

      console.log(
        `\x1b[34m[INFO]\x1b[0m ${eligibleTests.length} eligible tests to run. Fanning out workers.`
      );
      eligibleTests.forEach(async (test) => {
        await InngestClient.send({
          name: 'rag-test/run',
          data: {
            jobId: null, // not associated with a job.
            organization: test.organization,
            testId: test.id,
          },
        });
      });

      return;
    } catch (e) {
      console.error(e.message);
      return;
    }
  }
);

const runWeeklyRagTest = InngestClient.createFunction(
  {
    id: 'rag-testing-weekly-cron',
    name: 'RAG Test for Workspace - Weekly Cron',
  },
  { cron: 'TZ=America/Los_Angeles 0 18 * * WED' },
  async () => {
    try {
      console.log(`\n\x1b[33m[CRON: Running weekly RAG Test Cron]\x1b[0m`);
      const eligibleTests = await RagTest.where(
        {
          enabled: true,
          frequencyType: RagTest.schedules.weekly,
        },
        null,
        null,
        {
          id: true,
          enabled: true,
          organization: true,
        }
      );
      if (eligibleTests.length === 0) return;

      console.log(
        `\x1b[34m[INFO]\x1b[0m ${eligibleTests.length} eligible tests to run. Fanning out workers.`
      );
      eligibleTests.forEach(async (test) => {
        await InngestClient.send({
          name: 'rag-test/run',
          data: {
            jobId: null, // not associated with a job.
            organization: test.organization,
            testId: test.id,
          },
        });
      });

      return;
    } catch (e) {
      console.error(e.message);
      return;
    }
  }
);

const runMonthlyRagTest = InngestClient.createFunction(
  {
    id: 'rag-testing-monthly-cron',
    name: 'RAG Test for Workspace - Monthly Cron',
  },
  { cron: 'TZ=America/Los_Angeles 0 18 15 * *' },
  async () => {
    try {
      console.log(`\n\x1b[33m[CRON: Running monthly RAG Test Cron]\x1b[0m`);
      const eligibleTests = await RagTest.where(
        {
          enabled: true,
          frequencyType: RagTest.schedules.monthly,
        },
        null,
        null,
        {
          id: true,
          enabled: true,
          organization: true,
        }
      );
      if (eligibleTests.length === 0) return;

      console.log(
        `\x1b[34m[INFO]\x1b[0m ${eligibleTests.length} eligible tests to run. Fanning out workers.`
      );
      eligibleTests.forEach(async (test) => {
        await InngestClient.send({
          name: 'rag-test/run',
          data: {
            jobId: null, // not associated with a job.
            organization: test.organization,
            testId: test.id,
          },
        });
      });

      return;
    } catch (e) {
      console.error(e.message);
      return;
    }
  }
);

module.exports = {
  runHourlyRagTest,
  runDailyRagTest,
  runWeeklyRagTest,
  runMonthlyRagTest,
};
