import { useState } from 'react';
import Tools from '../../../../models/tools';
import { debounce } from 'lodash';
import WorkspaceSearch from './WorkspaceSearch';
import PromptInputAndSearchSubmission from './PromptInputAndSearchSubmission';
import { IOrganization } from '../../../../models/organization';

export default function NewTestForm({
  title,
  organization,
  postCreate,
  classOverrides,
}: {
  title?: string;
  organization: IOrganization;
  postCreate?: ([any]: any) => void;
  classOverrides?: string;
}) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const handleFormChange = (e: any) => {
    const data = new FormData(e.target.form);
    setFormData(data);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.target);
    const data = {};

    for (var [_k, value] of form.entries()) {
      if (_k.includes('embeddings_')) {
        const [_key] = _k.split('_');
        if (!data.hasOwnProperty(_key)) data[_key] = [];
        data[_key].push(JSON.parse(value));
      } else {
        data[_k] = value;
      }
    }

    const { test, error } = await Tools.newRAGTest(organization.slug, data);
    if (!!test)
      postCreate?.({
        ...test,
        organization,
        workspace: {
          id: form.get('workspaceId'),
          name: form.get('workspaceName'),
        },
        organization_rag_test_runs: [],
      });
    if (error) {
      setError(error);
      setSaving(false);
    }
  };

  const debouncedFormChange = debounce(handleFormChange, 500);
  return (
    <div
      className={
        classOverrides ??
        'w-full rounded-lg border border-gray-200 bg-gray-50/20 p-2'
      }
    >
      <h2 className="mb-4 text-2xl font-bold text-gray-900">
        {title || 'Create your first RAG test'}
      </h2>

      {error && (
        <div className="my-4 flex w-3/4 rounded-lg border border-red-600 bg-red-100 p-4">
          <p className="animate-none text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} onChange={debouncedFormChange}>
        <div hidden={saving}>
          <div className="flex flex-col gap-y-6">
            <FrequencySelection />
            <WorkspaceSearch organization={organization} />
            <TopKSelection />
            <PromptInputAndSearchSubmission
              organization={organization}
              formData={formData}
            />
          </div>
        </div>

        <div hidden={!saving}>
          <div className="flex h-[200px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-100 p-4">
            <p className="animate-none text-gray-600">Saving test...</p>
          </div>
        </div>
      </form>
    </div>
  );
}

function FrequencySelection() {
  return (
    <div className="w-full">
      <div className="mb-2 w-full ">
        <label className="block text-sm font-medium text-gray-900">
          Testing frequency
        </label>
        <p className="text-sm text-gray-600">
          The frequency in which this test will be run. Times are in server
          timezone.
        </p>
      </div>
      <select
        name="frequency"
        required={true}
        className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500`}
      >
        <option value="demand" selected>
          Do not run automatically
        </option>
        <option value="hourly">Hourly</option>
        <option value="daily">Once daily (6PM)</option>
        <option value="weekly">Once weekly (Wed @ 6PM)</option>
        <option value="monthly">Once monthly (15th)</option>
      </select>
    </div>
  );
}

function TopKSelection() {
  return (
    <div className="w-full">
      <div className="mb-2 w-full ">
        <label className="block text-sm font-medium text-gray-900">
          TopK to test
        </label>
        <p className="text-sm text-gray-600">
          How many embeddings do you want to test against? Maximum of 10.
        </p>
      </div>
      <input
        type="number"
        name="topK"
        min={1}
        max={10}
        onWheel={(e) => e.target.blur()}
        defaultValue={3}
        className="focus:ring-primary-600 focus:border-primary-600 block w-fit rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-lg text-gray-900"
        placeholder="TopK embeddings to test"
        required={true}
      />
    </div>
  );
}

export function NewTestFormModal({
  organization,
  postCreate,
}: {
  organization: IOrganization;
  postCreate?: ([any]: any) => void;
}) {
  return (
    <dialog
      id={`new-rag-test-modal`}
      className="my-4 h-auto w-1/2 rounded-lg px-4"
    >
      <NewTestForm
        title="Create a new RAG Test"
        organization={organization}
        postCreate={postCreate}
        classOverrides="w-full overflow-scroll mx-auto p-4"
      />
      <button
        type="button"
        onClick={() => {
          document.getElementById('new-rag-test-modal')?.close();
        }}
        className="my-2 flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
      >
        Cancel
      </button>
    </dialog>
  );
}
