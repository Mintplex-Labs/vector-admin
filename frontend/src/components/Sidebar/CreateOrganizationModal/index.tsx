import { useState } from 'react';
import paths from '../../../utils/paths';
import Organization from '../../../models/organization';
import PreLoader from '../../Preloader';

export default function CreateOrganizationModal() {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { organization } = await Organization.create(e.target.name.value);
    if (!organization) {
      setLoading(false);
      return false;
    }

    window.location.replace(paths.organization(organization));
  };

  return (
    <dialog id="organization-creation-modal" className="w-1/3 rounded-lg">
      <div className="w-full rounded-sm bg-white p-[20px] dark:border-strokedark dark:bg-boxdark">
        <div className="px-6.5 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Create a New Organization
          </h3>
        </div>
        {loading ? (
          <div className="px-6.5">
            <div className="mb-4.5 flex w-full justify-center">
              <PreLoader />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6.5">
              <div className="mb-4.5">
                <label className="mb-2.5 block text-black dark:text-white">
                  Organization Name
                </label>
                <input
                  required={true}
                  type="text"
                  name="name"
                  placeholder="My Organization"
                  autoComplete="off"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded bg-blue-500 p-3 font-medium text-white"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('organization-creation-modal')
                      ?.close();
                  }}
                  className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
              <p className="my-2 rounded-lg border border-orange-800 bg-orange-100 p-2 text-center text-sm text-orange-800">
                Once your organization exists you can start workspaces and
                documents.
              </p>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
