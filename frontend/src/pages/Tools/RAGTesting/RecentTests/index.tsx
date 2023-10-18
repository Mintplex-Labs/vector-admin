import { AlertTriangle, Box, Loader, Trash } from 'react-feather';
import Tools, { IRagTest } from '../../../../models/tools';
import moment from 'moment';
import paths from '../../../../utils/paths';
import showToast from '../../../../utils/toast';
import TestDetailsModal from '../TestDetails';
import { memo, useEffect, useRef, useState } from 'react';

export default function RecentTestRuns({
  tests,
  setTests,
}: {
  tests: IRagTest[];
  setTests: (tests: IRagTest[]) => void;
}) {
  return (
    <>
      <div className="w-full">
        <div className="flex items-center gap-x-2">
          <p className="text-xl font-semibold text-gray-800">
            Recently Run RAG Tests
          </p>
          <button
            onClick={() => {
              document.getElementById('new-rag-test-modal')?.showModal();
            }}
            className="rounded-lg px-2 py-1 text-blue-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
          >
            + New test
          </button>
        </div>

        <div className="mt-4 flex flex-col">
          <div className="border-b border-stroke px-4 pb-5 dark:border-strokedark md:px-6 xl:px-7.5">
            <div className="flex items-center gap-3">
              <div className="w-3/12 ">
                <span className="font-medium">Target workspace</span>
              </div>
              <div className="w-2/12">
                <span className="font-medium">Last run</span>
              </div>
              <div className="w-2/12">
                <span className="font-medium">Run result</span>
              </div>
              <div className="w-5/12 text-center">
                <span className="font-medium"></span>
              </div>
            </div>
          </div>
          {tests.map((test) => (
            <TestItem
              key={test.id}
              item={test}
              onDelete={() => {
                setTests(tests.filter((t) => t.id !== test.id));
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

const TestItem = memo(
  ({ item, onDelete }: { item: IRagTest; onDelete: any }) => {
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);
    const [test, setTest] = useState<IRagTest>(item);

    useEffect(() => {
      async function pollChanges() {
        if (!!pollingInterval.current) return;
        pollingInterval.current = setInterval(async () => {
          const { test: testUpdates, runs } = await Tools.ragTest(
            test.organization.slug,
            test.id
          );
          if (!testUpdates) return;
          setTest({
            ...test,
            ...testUpdates,
            organization_rag_test_runs: runs,
          });
        }, 30_000);
      }
      pollChanges();
    }, []);

    return (
      <>
        <div
          id={`test-${test.id}`}
          key={test.id}
          className="flex w-full items-center gap-5 px-7.5 py-3 text-gray-600 hover:bg-gray-3 dark:hover:bg-meta-4"
        >
          <div className="flex w-full items-center gap-3">
            <div className="flex w-3/12 ">
              <div className="flex items-center gap-x-1 overflow-x-hidden">
                <Box className="h-4 w-4" />
                <span className="font-medium xl:block">
                  {test.workspace.name}
                </span>
              </div>
            </div>
            <div className="flex w-2/12 overflow-x-scroll">
              <span className="font-medium">
                {test.lastRun ? moment(test.lastRun).fromNow() : '--'}
                <br />
                {test.frequencyType !== 'demand' && (
                  <p className="text-xs font-normal italic text-gray-400">
                    Runs {test.frequencyType}
                  </p>
                )}
              </span>
            </div>
            <div className="flex w-2/12">
              <TestResultBadge test={test} />
            </div>
            <div className="flex w-5/12 items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById(`test-${test.id}-details-modal`)
                    ?.showModal();
                }}
                className="rounded-lg px-2 py-1 text-blue-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
              >
                Details
              </button>
              {test.organization_rag_test_runs.length > 0 && (
                <a
                  href={paths.tools.ragTestRuns(
                    test.organization.slug,
                    test.id
                  )}
                  className="rounded-lg px-2 py-1 text-gray-400 transition-all duration-300 hover:bg-gray-50 hover:text-gray-600"
                >
                  View Runs
                </a>
              )}
              <RunNowButton test={test} />
              <EnableDisableButton test={test} onChange={setTest} />
            </div>
          </div>
        </div>
        <TestDetailsModal test={test} />
      </>
    );
  }
);

function EnableDisableButton({
  test,
  onChange,
}: {
  test: IRagTest;
  onChange: (test: IRagTest) => void;
}) {
  const [status, setStatus] = useState(test.enabled);
  const [loading, setLoading] = useState(false);
  const toggleStatus = async () => {
    setLoading(true);
    const success = await Tools.toggleRagTest(test);
    if (success) {
      setStatus(!status);
      showToast(`This test is now ${status ? 'disabled' : 'enabled'}.`, 'info');
      onChange({ ...test, enabled: !status });
    } else {
      showToast(
        `Could not ${status ? 'disable' : 'enable'} this test.`,
        'info'
      );
    }
    setLoading(false);
  };

  if (test.frequencyType === 'demand') return null;
  return (
    <>
      <i className="hidden text-green-400 text-red-400 hover:bg-green-600 hover:bg-red-600 disabled:bg-green-600 disabled:bg-red-600" />
      <button
        type="button"
        disabled={loading}
        onClick={toggleStatus}
        className={`flex items-center gap-x-2 rounded-lg px-2 py-1 text-${
          status ? 'red' : 'green'
        }-400 transition-all duration-300 hover:bg-${
          status ? 'red' : 'green'
        }-600 hover:text-white disabled:bg-${
          status ? 'red' : 'green'
        }-600 disabled:text-white`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={14} />
            <p>Updating...</p>
          </>
        ) : (
          <>{status ? 'Disable Test' : 'Enable Test'}</>
        )}
      </button>
    </>
  );
}

function RunNowButton({ test }: { test: IRagTest }) {
  const [loading, setLoading] = useState(false);
  const handleRunNow = async () => {
    setLoading(true);
    const { job, error } = await Tools.runRagTest(test);
    if (job) {
      showToast(`RAG Test is now running in background jobs`, 'success');
      setLoading(false);
      return;
    }

    showToast(error || 'Rag test could not be run.', 'error');
    setLoading(false);
  };

  if (!test.enabled) return null;
  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleRunNow}
      className="flex items-center gap-x-2 rounded-lg px-2 py-1 text-orange-400 transition-all duration-300 hover:bg-orange-600 hover:text-white disabled:bg-orange-600 disabled:text-white"
    >
      {loading ? (
        <>
          <Loader className="animate-spin" size={14} />
          <p>Running</p>
        </>
      ) : (
        'Run now'
      )}
    </button>
  );
}

function TestResultBadge({ test }: { test: IRagTest }) {
  const { organization_rag_test_runs = [] } = test;
  if (organization_rag_test_runs.length === 0) {
    return (
      <span className="inline-block rounded bg-gray-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-gray-500">
        Unknown
      </span>
    );
  }

  const recentRun = organization_rag_test_runs[0];
  switch (recentRun.status) {
    case 'running':
      return (
        <span className="inline-block rounded bg-blue-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-blue-500">
          Running
        </span>
      );
    case 'failed':
      return (
        <span className="inline-block rounded bg-red-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-red-500">
          Exited
        </span>
      );
    case 'complete':
      return (
        <span className="inline-block rounded bg-green-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-green-500">
          Passing
        </span>
      );
    case 'deviation_alert':
      return (
        <a href={paths.tools.ragTestRuns(test.organization.slug, test.id)}>
          <span className="inline-block flex items-center gap-x-1 rounded bg-orange-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-orange-500">
            <AlertTriangle size={12} />
            Drift detected
          </span>
        </a>
      );
    default:
      return (
        <span className="inline-block rounded bg-yellow-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-yellow-500">
          Unknown
        </span>
      );
  }
}
