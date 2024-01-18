import { AlertTriangle, ChevronDown } from 'react-feather';
import { IRagTest } from '../../../../../models/tools';
import moment from 'moment';
import paths from '../../../../../utils/paths';
import showToast from '../../../../../utils/toast';
import { useState } from 'react';
import { IRagTestRun } from '../../../../../models/tools';
import { StringDiff, DiffMethod } from 'react-string-diff';

export default function RunsList({
  test,
  runs,
}: {
  test: IRagTest;
  runs: IRagTestRun[];
}) {
  return (
    <>
      <TestDetails test={test} />
      <div className="w-full">
        <div className="mt-4 flex flex-col">
          <div className="grid grid-cols-12 gap-3 border-b border-white/20 px-4 pb-5 text-white md:px-6 xl:px-7.5">
            <div className="col-span-2">
              <span className="font-medium">Run at</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Run result</span>
            </div>
            <div className="col-span-6 text-center">
              <span className="font-medium">Issues</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-medium"></span>{' '}
              {/* This is intentionally blank */}
            </div>
          </div>
          {runs.map((run, i) => (
            <TestRunItem
              key={run.id}
              run={run}
              test={test}
              showAsExpanded={i === 0}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function TestDetails({ test }: { test: IRagTest }) {
  return (
    <details className="flex w-fit flex-col rounded-lg border-2 border-white/20 bg-main-2 px-4 py-2">
      <summary className="text-md w-full cursor-pointer font-semibold text-white">
        Show test parameters
      </summary>
      <div className="mt-4 overflow-hidden text-white">
        <ul className="flex flex-col gap-y-2">
          <li className="flex items-center gap-x-2">
            <b>Run Schedule:</b> {test.frequencyType}
          </li>
          <li className="flex items-center gap-x-2">
            <b>Workspace:</b>
            <a
              href={paths.workspace(
                test.organization.slug,
                test.workspace.slug
              )}
              className="flex items-center gap-x-1 text-sky-400 underline"
            >
              {test.workspace.name}
            </a>
          </li>
          <li className="flex items-center gap-x-2">
            <b>TopK:</b> {test.topK}
          </li>

          <li className="flex w-full items-center gap-x-2">
            <b className="whitespace-nowrap">Prompt Text:</b>
            <p className="whitespace-normal break-all">
              {test.promptText ? `"${test.promptText}"` : '--'}
            </p>
          </li>

          <li className="flex items-center gap-x-2">
            <b>Prompt Vector:</b> {test.promptVector.length} dimensions
            <button
              onClick={() => {
                window.navigator.clipboard.writeText(
                  test.promptVector.toString()
                );
                showToast('Test prompt vector copied to clipboard!', 'info');
              }}
              className="text-sm text-sky-400 hover:underline"
            >
              Copy to clipboard
            </button>
          </li>

          <li className="flex flex-col gap-y-2">
            <b>Comparison Vectors:</b>
            <ul className="ml-4 list-disc">
              {test.comparisons.map((comp) => {
                return (
                  <li>
                    <b>{comp.vectorId}:</b> {(comp.score * 100).toFixed(2)}%
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </div>
    </details>
  );
}

function TestRunItem({
  run,
  test,
  showAsExpanded,
}: {
  run: IRagTestRun;
  test: IRagTest;
  showAsExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(showAsExpanded);

  return (
    <div key={run.id} className="flex flex-col gap-y-1">
      <button
        id={`test-run-${run.id}-row`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="grid grid-cols-12 gap-3 px-7.5 py-3 text-white hover:bg-main-2/10"
      >
        <div className="col-span-2">
          <span>{moment(run.createdAt).fromNow()}</span>
        </div>
        <div className="col-span-2">
          <RunResultBadge run={run} />
        </div>
        <div className="col-span-6">
          <RunIssueList run={run} />
        </div>
        <div className="col-span-2 flex justify-end">
          <ChevronDown
            className={`duration-300ms transition-all ${
              expanded ? 'rotate-180' : 'rotate-0'
            }`}
            size={20}
          />
        </div>
      </button>
      <div hidden={!expanded}>
        <div className="my-2 flex w-full flex-col gap-y-4 rounded-lg border-2 border-white/20 bg-main-2 p-4">
          <ChangeLog run={run} />
          <ScoreComp run={run} />
          <TextComp run={run} comparisons={test.comparisons} />
          <NewVectorsFound run={run} />
          <MissingVector run={run} />
        </div>
      </div>
    </div>
  );
}

function RunIssueList({ run }: { run: IRagTestRun }) {
  if (run.status !== 'deviation_alert') {
    return (
      <span className="inline-block rounded-full bg-gray-500/20 px-2 py-0.5 text-sm font-medium text-gray-500 shadow-sm">
        None found
      </span>
    );
  }

  return (
    <div className="mx-auto flex w-fit items-center gap-x-2 overflow-x-scroll">
      {run.results.highScoreDeltaVectorIds.length > 0 && (
        <span className="whitespace-nowrap rounded-full bg-red-500 bg-opacity-25 px-2.5 py-0.5 text-xs font-medium text-red-500">
          High Relevancy score delta
        </span>
      )}
      {run.results.missingVectorIds.length > 0 && (
        <span className="whitespace-nowrap rounded-full bg-red-500 bg-opacity-25 px-2.5 py-0.5 text-xs font-medium text-red-500">
          Missing expected Vectors
        </span>
      )}
      {run.results.newVectorIds.length > 0 && (
        <span className="whitespace-nowrap rounded-full bg-red-500 bg-opacity-25 px-2.5 py-0.5 text-xs font-medium text-red-500">
          New vectors matched
        </span>
      )}
    </div>
  );
}

function RunResultBadge({ run }: { run: IRagTestRun }) {
  switch (run.status) {
    case 'running':
      return (
        <span className="inline-block rounded-full bg-sky-600/20 px-2 py-0.5 text-sm font-medium text-sky-400 shadow-sm">
          Running
        </span>
      );
    case 'failed':
      return (
        <span className="inline-block rounded-full bg-red-500/25 px-2 py-0.5 text-sm font-medium text-red-500 shadow-sm">
          Exited
        </span>
      );
    case 'complete':
      return (
        <span className="inline-block rounded-full bg-green-600/20 px-2 py-0.5 text-sm font-medium text-green-500 shadow-sm">
          Passing
        </span>
      );
    case 'deviation_alert':
      return (
        <span className="inline-block flex items-center gap-x-1 rounded bg-orange-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-orange-500">
          <AlertTriangle size={12} />
          Drift detected
        </span>
      );
    default:
      return (
        <span className="inline-block rounded bg-yellow-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-yellow-500">
          Unknown
        </span>
      );
  }
}

function ChangeLog({ run }: { run: IRagTestRun }) {
  const { errorLog = [] } = run.results;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <p className="text-lg font-semibold text-white">Reported errors:</p>
      {errorLog.length > 0 ? (
        <ul className="ml-4 list-disc">
          {errorLog.map((error, i) => {
            return (
              <li key={`${run.id}_error_${i}`} className="text-sm text-white">
                {error.message}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-white">no reported errors on this run.</p>
      )}
    </div>
  );
}

function ScoreComp({ run }: { run: IRagTestRun }) {
  const { vectorMap = {} } = run.results;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <p className="text-lg font-semibold text-white">Relevancy Scores:</p>
      {Object.keys(vectorMap).length > 0 ? (
        <ul className="ml-4 list-disc">
          {Object.entries(vectorMap).map(([key, values], i) => {
            const { newScore, deltaScore } = values;
            // This will show red and negative for really small deltas (-1e4);
            // May want to change this in future.
            const color = Math.sign(deltaScore) < 0 ? 'red' : 'green';

            return (
              <li
                key={`${run.id}_score_${i}`}
                className="flex items-center gap-x-1 pb-1 text-sm"
              >
                <p className="text-white ">
                  <b>{key}</b>: {(newScore * 100).toFixed(2)}%
                </p>
                <p
                  className={`w-fit rounded-full px-2 py-1 text-xs font-semibold text-${color}-500 bg-${color}-500 bg-opacity-20`}
                >
                  {(deltaScore * 100).toFixed(2)}% from baseline
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">no reported scores on this run.</p>
      )}
    </div>
  );
}

function TextComp({
  run,
  comparisons,
}: {
  run: IRagTestRun;
  comparisons: IRagTest['comparisons'];
}) {
  const { vectorMap = {} } = run.results;
  const hasDiffs = Object.entries(vectorMap).some(([key, values]) => {
    const { textContent = null } = values;
    const comparison = comparisons.find((comp) => comp.vectorId === key);
    if (!comparison) return false;
    return (
      !!textContent &&
      !!comparison &&
      !!comparison.hasOwnProperty('text') &&
      comparison.text !== textContent
    );
  });

  return (
    <div className="flex w-full flex-col gap-y-2">
      <p className="text-lg font-semibold text-white">Text chunk diffs</p>
      {hasDiffs ? (
        <ul className="ml-4 list-disc">
          {Object.entries(vectorMap).map(([key, values], i) => {
            const { textContent = null } = values;
            const comparison = comparisons.find(
              (comp) => comp.vectorId === key
            );
            if (
              !textContent ||
              !comparison ||
              !comparison.hasOwnProperty('text') ||
              comparison.text === textContent
            )
              return null;

            return (
              <li
                key={`${run.id}_text_comp_${i}`}
                className="flex items-center gap-x-1 text-sm"
              >
                <details className="flex flex-col">
                  <summary className="w-full cursor-pointer text-sm text-white">
                    Text chunk diff for <b>{key}</b>
                  </summary>
                  <div className="mt-2 rounded-lg border border-gray-500 bg-gray-100 p-2">
                    <StringDiff
                      oldValue={comparison.text ?? ''}
                      newValue={textContent}
                      method={DiffMethod.WordsWithSpace}
                      className="text-gray-700"
                      styles={{
                        added: {
                          fontFamily: 'monospace',
                          backgroundColor: '#def7ec',
                          margin: '0px 2px 0px 2px',
                          padding: '0px 4px',
                          borderRadius: '2px',
                          color: '#04553f',
                        },
                        removed: {
                          fontFamily: 'monospace',
                          textDecoration: 'line-through',
                          backgroundColor: '#fce8e8',
                          margin: '0px 2px 0px 2px',
                          padding: '0px 4px',
                          borderRadius: '2px',
                          color: '#9b1d1c',
                        },
                        default: {
                          fontFamily: 'monospace',
                          whiteSpace: 'break-spaces',
                        },
                      }}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-white">
          no reported text chunk diffs on this run.
        </p>
      )}
    </div>
  );
}

function NewVectorsFound({ run }: { run: IRagTestRun }) {
  const { newVectorIds } = run.results;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <p className="text-lg font-semibold text-white">
        Newly Referenced vectors:
      </p>
      {newVectorIds.length > 0 ? (
        <ul className="ml-4 list-disc">
          {newVectorIds.map((vectorId, i) => {
            return (
              <li
                key={`${run.id}_new_vector_${i}`}
                className="text-sm text-white"
              >
                {vectorId}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-white">
          no new vectors were referenced in this run.
        </p>
      )}
    </div>
  );
}

function MissingVector({ run }: { run: IRagTestRun }) {
  const { missingVectorIds } = run.results;

  return (
    <div className="flex w-full flex-col gap-y-2">
      <p className="text-lg font-semibold text-white">Missing vectors:</p>
      {missingVectorIds.length > 0 ? (
        <ul className="ml-4 list-disc">
          {missingVectorIds.map((vectorId, i) => {
            return (
              <li
                key={`${run.id}_missing_vector_${i}`}
                className="text-sm text-white"
              >
                {vectorId}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-white">
          no expected vectors were missing in this run.
        </p>
      )}
    </div>
  );
}
