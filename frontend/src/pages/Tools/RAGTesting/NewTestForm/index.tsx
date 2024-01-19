import { useState } from 'react';
import Tools from '@/models/tools';
import { debounce } from 'lodash';
import WorkspaceSearch from './WorkspaceSearch';
import PromptInputAndSearchSubmission from './PromptInputAndSearchSubmission';
import { IOrganization } from '@/models/organization';
import { Loader } from 'react-feather';

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
        'mt-4 h-screen w-full flex-1 rounded-sm bg-main pb-6 xl:col-span-4'
      }
    >
      <h2 className="mb-4 text-lg font-medium text-white">
        {title || 'Create your first Context Drift test'}
      </h2>

      {error && (
        <div className="my-4 ml-13 flex w-3/4 rounded-lg bg-red-600/20 p-4 text-center text-sm text-red-800">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} onChange={debouncedFormChange}>
        <div hidden={saving} className="pr-6">
          <div className="flex w-full flex-col gap-y-2">
            <FrequencySelection />
            <WorkspaceSearch organization={organization} />
            <TopKSelection />
            <PromptInputAndSearchSubmission
              organization={organization}
              formData={formData}
            />
          </div>
        </div>

        <div hidden={!saving} className="ml-13 mt-4 pr-6">
          <div className="flex h-11 w-full items-center justify-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90">
            <Loader size={14} className="animate-spin" />
            <p>Saving test...</p>
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
        <label className="block text-sm font-medium text-white">
          Testing frequency
        </label>
        <p className="text-sm text-white/60">
          The frequency in which this test will be run. Times are in server
          timezone.
        </p>
      </div>
      <select
        name="frequency"
        required={true}
        className={`block w-fit rounded-lg border border-white/10 bg-main-2/10 px-2 py-2 text-sm text-white outline-none`}
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
        <label className="block text-sm font-medium text-white">
          TopK to test
        </label>
        <p className="text-sm text-white/60">
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
        className="w-212 rounded-lg border border-white/10 bg-main-2/10 px-2 py-2 text-sm text-white outline-none"
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
      className="my-4 h-fit w-1/2 rounded-lg bg-main px-4"
    >
      <NewTestForm
        title="Create a new test"
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
