import { Fragment, useState } from 'react';
import { IRagTest } from '../../../../models/tools';

export default function TestDetailsModal({ test }: { test: IRagTest }) {
  return (
    <dialog
      id={`test-${test.id}-details-modal`}
      className="my-4 h-fit w-1/2 rounded-lg px-4"
    >
      <TestDetails test={test} />
      <button
        type="button"
        onClick={() => {
          document.getElementById(`test-${test.id}-details-modal`)?.close();
        }}
        className="my-2 flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
      >
        Close
      </button>
    </dialog>
  );
}

function TestDetails({ test }: { test: IRagTest }) {
  return (
    <div className="mx-auto w-full overflow-scroll p-4">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">
        Test settings for Test #{test.id}
      </h2>

      <div>
        <div className="flex flex-col gap-y-6">
          <FrequencySelection test={test} />
          <WorkspaceSelection test={test} />
          <TopKSelection test={test} />
          <PromptSelection test={test} />
          <EmbeddingSample test={test} />
        </div>
      </div>
    </div>
  );
}

function FrequencySelection({ test }: { test: IRagTest }) {
  return (
    <div className="w-full">
      <div className="mb-2 w-full ">
        <label className="block text-sm font-medium text-gray-900">
          Testing frequency
        </label>
        <p className="text-sm text-gray-600">
          The frequency in which this test is running.
        </p>
      </div>
      <select
        name="frequency"
        disabled={true}
        value={test.frequencyType}
        className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500`}
      >
        <option value="demand">Do not run automatically</option>
        <option value="hourly">Hourly</option>
        <option value="daily">Once daily (6PM)</option>
        <option value="weekly">Once weekly (Wed @ 6PM)</option>
        <option value="monthly">Once monthly (15th)</option>
      </select>
    </div>
  );
}

function WorkspaceSelection({ test }: { test: IRagTest }) {
  return (
    <div className="w-full">
      <div className="mb-2 w-full ">
        <label className="block text-sm font-medium text-gray-900">
          Workspace to test
        </label>
        <p className="text-sm text-gray-600">
          This is the name of the workspace you are running tests against.
        </p>
      </div>
      <input
        type="input"
        disabled={true}
        className="focus:ring-primary-600 focus:border-primary-600 block w-1/2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
        placeholder="Search workspace name"
        autoComplete="off"
        value={test.workspace.name}
      />
    </div>
  );
}

function TopKSelection({ test }: { test: IRagTest }) {
  return (
    <div className="w-full">
      <div className="mb-2 w-full ">
        <label className="block text-sm font-medium text-gray-900">
          TopK to test
        </label>
        <p className="text-sm text-gray-600">
          The number of embeddings to reference for each test run.
        </p>
      </div>
      <input
        type="number"
        name="topK"
        disabled={true}
        readOnly={true}
        value={test.topK}
        className="focus:ring-primary-600 focus:border-primary-600 block w-fit rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-lg text-gray-900"
        placeholder="TopK embeddings to test"
      />
    </div>
  );
}

function PromptSelection({ test }: { test: IRagTest }) {
  const [selection, setSelection] = useState(
    test.promptText ? 'text' : 'vector'
  );

  return (
    <div className="w-full">
      <div className="mb-2 w-full ">
        <label className="block text-sm font-medium text-gray-900">
          Using this input for similarity search
        </label>
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-gray-600">
            This is the information that is being used for comparison analysis.
          </p>
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}
            className="rounded-lg border border-gray-100 p-2 text-sm text-gray-600"
          >
            <option value="text">Showing as text</option>
            <option value="vector">Showing as vector</option>
          </select>
        </div>
      </div>
      <textarea
        name="prompt"
        required={true}
        disabled={true}
        rows={8}
        className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
        placeholder="ex: 'What is VectorAdmin?' or [0.2,0.81,0.89,...,0.05,0.93,0.91,0.17]"
        value={
          selection === 'text'
            ? test.promptText
            : JSON.stringify(test.promptVector)
        }
      ></textarea>
    </div>
  );
}

function EmbeddingSample({ test }: { test: IRagTest }) {
  return (
    <div className="flex w-full flex-col">
      <p className="text-sm text-gray-600">
        These are the samples being compared to for each run.
      </p>
      <div className="flex flex-col gap-y-2">
        {test.comparisons.map((embedding, i) => {
          return (
            <Fragment key={i}>
              <input
                name={`embeddings_${i}`}
                value={JSON.stringify(embedding)}
                type="hidden"
              />
              <div className="flex w-full flex-col rounded-lg border border-gray-300 bg-gray-50 p-2 px-4">
                <div className="flex w-full items-center justify-between border-b border-gray-200 py-1">
                  <p className="text-sm text-gray-600">{embedding.vectorId}</p>
                  <p className="text-sm text-gray-600">
                    Original Similarity {(embedding.score * 100.0).toFixed(2)}%
                  </p>
                </div>
                <pre className="whitespace-break my-2 overflow-scroll text-gray-600">
                  {JSON.stringify(embedding.metadata || {}, null, 2)}
                </pre>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
