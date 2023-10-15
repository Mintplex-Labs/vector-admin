import { useState } from 'react';
import Organization from '../../../models/organization';
import { Loader } from 'react-feather';
import paths from '../../../utils/paths';

export default function OrgSettings({ organization }: { organization: any }) {
  const [hasOrgChanges, setHasOrgChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{
    show: boolean;
    success: boolean;
    error: null | string;
  }>({ show: false, success: false, error: null });
  const handleOrgUpdate = async (e: any) => {
    e.preventDefault();
    setResult({ show: false, success: false, error: null });
    const form = new FormData(e.target);
    const newOrgName =
      (form.get('organization_name') as string) || organization?.name;
    const data = { name: newOrgName };

    const { success, error } = await Organization.update(
      organization.slug,
      data
    );
    setResult({ show: true, success, error });
    success && setHasOrgChanges(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to do this. All associated information will be deleted.\n\nThis operation will ONLY remove information from Vector Admin and will not remove any data from your connected vector database.'
      )
    )
      return false;
    setDeleting(true);
    const { success, error } = await Organization.deleteOrg(organization.slug);
    if (!success) {
      alert(error);
      setDeleting(false);
      return;
    }

    window.location.replace(paths.dashboard());
  };

  return (
    <div className="col-span-12 flex-1 rounded-sm bg-white pb-6 xl:col-span-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="mb-6 px-7.5 text-3xl font-semibold text-black dark:text-white">
            Organization Settings
          </h4>
        </div>
      </div>

      <div className="px-6">
        {result.show && (
          <>
            {result.success ? (
              <p className="my-2 w-full rounded-lg border-green-800 bg-green-50 px-4 py-2 text-lg text-green-800">
                Settings updated successfully.
              </p>
            ) : (
              <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-lg text-red-800">
                {result.error}
              </p>
            )}
          </>
        )}

        <form
          onChange={() => setHasOrgChanges(true)}
          onSubmit={handleOrgUpdate}
          className="border-b border-gray-200 pb-4"
        >
          <div className="my-4">
            <label className=" block flex items-center gap-x-1 font-medium text-black dark:text-white">
              Organization name
            </label>
            <p className="mb-2.5 text-sm text-slate-600">
              This will only change the display name of the organization.
            </p>
            <div className="relative flex w-1/2 items-center gap-x-4">
              <input
                type="text"
                name="organization_name"
                placeholder="My Organization"
                defaultValue={organization.name}
                required={true}
                className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
              <button
                hidden={!hasOrgChanges}
                type="submit"
                className="rounded-lg border border-primary px-8 py-3 text-lg text-blue-500 transition-all duration-300 hover:bg-primary hover:text-white"
              >
                Save
              </button>
            </div>
          </div>
        </form>

        <div className="my-2 flex w-full">
          <button
            disabled={deleting}
            onClick={handleDelete}
            className="flex items-center gap-x-1 rounded-lg bg-red-100 px-4 py-2 text-red-400 hover:bg-red-600 hover:text-white disabled:cursor-wait disabled:bg-red-600 disabled:text-white"
          >
            <Loader hidden={!deleting} size={16} className="animate-spin" />
            {deleting ? 'Removing Organization' : 'Delete Organization'}
          </button>
        </div>
      </div>
    </div>
  );
}
