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
    <dialog
      id="organization-creation-modal"
      className="w-1/3 rounded-xl border-2 border-white/20 bg-main shadow"
    >
      <div className="w-full overflow-y-scroll rounded-sm p-[20px]">
        <div className="px-6.5 py-4">
          <h3 className="text-lg font-medium text-white">
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
                <label className="mb-2.5 block text-sm font-medium text-white">
                  Organization Name
                </label>
                <input
                  required={true}
                  type="text"
                  name="name"
                  placeholder="My Organization"
                  autoComplete="off"
                  className="placeholder-text-white/60 w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-white p-2 font-medium text-main shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
                >
                  Create Organization &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('organization-creation-modal')
                      ?.close();
                  }}
                  className="w-full rounded-lg bg-transparent p-2 font-medium text-white transition-all duration-300 hover:bg-red-500/80 hover:bg-opacity-90 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <p className="my-2 rounded-lg border border-white/20 bg-main-2 p-2 text-center text-sm text-white">
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
