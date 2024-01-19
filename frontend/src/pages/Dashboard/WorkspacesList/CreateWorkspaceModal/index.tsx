import { useState } from 'react';
import Workspace from '@/models/workspace';
import PreLoader from '@/components/Preloader';
import { APP_NAME } from '@/utils/constants';
import Organization from '@/models/organization';
import { debounce } from 'lodash';
import { AlertCircle } from 'react-feather';
import paths from '@/utils/paths';

export default function CreateWorkspaceModal({
  organization,
}: {
  organization: any;
}) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [match, setMatch] = useState(null);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState(null);

  const searchForNamespace = async (e: any) => {
    setMatch(null);
    setSearching(true);
    setError(null);
    const { match } = await Organization.vectorDBExists(
      organization.slug,
      e.target.value
    );
    setMatch(match);
    setSearching(false);
  };

  const createAndImport = async (e: any) => {
    if (!match) return false;
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { workspace } = await Workspace.createAndImport(
      organization.slug,
      match
    );

    if (!workspace) {
      setLoading(false);
      return false;
    }

    setImported(true);

    window.location.replace(paths.workspace(organization.slug, workspace.slug));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { workspace, error } = await Workspace.createNew(
      organization.slug,
      e.target.name.value
    );
    if (!workspace) {
      setLoading(false);
      setError(error);
      return false;
    }

    window.location.replace(paths.workspace(organization.slug, workspace.slug));
  };

  if (imported) {
    return (
      <ModalWrapper>
        <div className="px-6.5">
          <div className="mb-4.5 flex w-full flex-col gap-y-2">
            <p className="text-base text-gray-800">
              <code>{match || 'Your workspace'}</code> is importing into{' '}
              {APP_NAME} now in the background. Depending on the amount of
              vectors in this workspace it may take a few minutes. You can check
              on the progress in the background jobs queue via the link below.
            </p>
            <button
              type="button"
              onClick={() => window.location.replace(paths.jobs(organization))}
              className="w-full rounded-lg bg-blue-500 bg-opacity-20 py-2 text-center text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Check import progress &rarr;
            </button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  const debouncedOnChange = debounce(searchForNamespace, 500);
  return (
    <ModalWrapper>
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
              <div className="mb-2.5 flex flex-col">
                <label className="block text-sm font-medium text-white">
                  Workspace Name
                </label>
                {/* <p className="text-xs text-gray-600">
                  if a workspace with a matching name is found in your vector
                  database we will ask you to confirm before creating it in{' '}
                  {APP_NAME}.
                </p> */}
              </div>
              <input
                required={true}
                type="text"
                name="name"
                placeholder="My workspace"
                autoComplete="off"
                onChange={debouncedOnChange}
                className="placeholder-text-white/60 w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
              />
              {error && (
                <p className="my-2 rounded-lg border border-red-800 bg-red-600/10 p-2 px-2 text-sm text-red-600">
                  Error: {error}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              {!match ? (
                <>
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full rounded-lg bg-white p-2 font-medium text-main shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
                  >
                    Create new workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      document
                        .getElementById('workspace-creation-modal')
                        ?.close();
                    }}
                    className="w-full rounded-lg bg-transparent p-2 font-medium text-white transition-all duration-300 hover:bg-red-500/80 hover:bg-opacity-90 hover:text-white"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={createAndImport}
                    className="flex w-full items-center gap-x-4 rounded-lg bg-blue-500 bg-opacity-10 px-4 py-2 text-blue-600 transition-all duration-300 hover:bg-opacity-100 hover:text-white"
                  >
                    <AlertCircle className="h-6 w-6" />
                    <div className="flex w-full flex-col items-center gap-x-1">
                      <p>
                        We found an existing workspace for{' '}
                        <code className="px-1">{match}</code>.
                      </p>
                      <p className="text-xs underline">
                        click to import this workspace instead of creating a new
                        one.
                      </p>
                    </div>
                  </button>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-transparent p-2 font-medium text-white transition-all duration-300 hover:bg-red-500/80 hover:bg-opacity-90 hover:text-white"
                  >
                    No, create new workspace
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </ModalWrapper>
  );
}

const ModalWrapper = ({ children }: { children: React.ReactElement }) => {
  return (
    <dialog
      id="workspace-creation-modal"
      className="w-1/3 rounded-xl border-2 border-white/20 bg-main shadow"
    >
      <div className="w-full overflow-y-scroll rounded-sm p-[20px]">
        <div className="px-6.5 py-4">
          <h3 className="text-lg font-medium text-white">
            Create or find a new workspace
          </h3>
          <p className="text-sm text-white/60">
            {/* Workspaces are collections of documents inside of your organization.
            They allow you to control permissions and documents with ultimate
            visibility.
            <br /> */}
            Workspaces should match with what you are calling your namespaces or
            collections in your vector database.
          </p>
        </div>
        {children}
      </div>
    </dialog>
  );
};
