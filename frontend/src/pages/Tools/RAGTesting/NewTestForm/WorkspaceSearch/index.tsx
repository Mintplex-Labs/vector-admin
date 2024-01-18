import { useState, useEffect } from 'react';
import Organization, {
  IOrganization,
} from '../../../../../models/organization';
import { Circle, Loader, X } from 'react-feather';
import { debounce } from 'lodash';
import { IWorkspace } from '../../../../../models/workspace';

export default function WorkspaceSearch({
  organization,
}: {
  organization: IOrganization;
}) {
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [originalWorkspaces, setOriginalWorkspaces] = useState([]);
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace | null>(
    null
  );

  const handleSearch = async (e: any) => {
    const searchTerm = e.target?.value;
    if (searchTerm !== '') {
      setLoadingWorkspaces(true);
      const { workspacesResults = [] } = await Organization.searchWorkspaces(
        organization.slug,
        1,
        10,
        searchTerm
      );
      setWorkspaces(workspacesResults);
      setLoadingWorkspaces(false);
    } else {
      setWorkspaces(originalWorkspaces);
      setLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    async function fetchWorkspaces() {
      const { workspaces: _workspaces } = await Organization.workspaces(
        organization.slug,
        1,
        10
      );
      setWorkspaces(_workspaces);
      setOriginalWorkspaces(_workspaces);
      setLoadingWorkspaces(false);
    }
    fetchWorkspaces();
  }, []);

  const debouncedSearch = debounce(handleSearch, 500);
  return (
    <div className="sm:col-span-2">
      <div className="mb-2 w-full">
        <label className="block text-sm font-medium text-white">
          Workspace to test
        </label>
        <p className="text-sm text-white/60">
          This is the name of the workspace you want to run tests against. You
          can only run against one workspace at a time.
        </p>
      </div>
      {!selectedWorkspace ? (
        <>
          <div className="flex w-full items-center gap-x-2">
            <input
              type="input"
              onChange={debouncedSearch}
              className="w-48 rounded-lg border border-white/10 bg-main-2/10 px-2 py-2 text-sm text-white outline-none"
              placeholder="Search workspace name"
              autoComplete="off"
            />
            {loadingWorkspaces ? (
              <Loader className="animate-spin text-blue-300" size={20} />
            ) : (
              <Circle className="animate-pulse text-gray-400" size={20} />
            )}
          </div>
          <div className="my-4 flex w-full flex-wrap items-center gap-4">
            {workspaces.map((workspace) => (
              <button
                onClick={() => setSelectedWorkspace(workspace)}
                className="rounded-full bg-sky-600/20 px-2 py-0.5 text-sm font-medium text-sky-400 shadow-sm hover:bg-sky-800"
              >
                {workspace.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <input
            hidden={true}
            name="workspaceId"
            value={selectedWorkspace.id}
          />
          <input
            hidden={true}
            name="workspaceName"
            value={selectedWorkspace.name}
          />
          <div className="flex w-full items-center gap-x-2">
            <input
              type="text"
              disabled={true}
              value={selectedWorkspace.name}
              // mt-2 block w-full rounded-lg border border-white/10 bg-main-2/10 px-2 py-2 text-sm text-white outline-none
              className="block w-fit rounded-lg border border-white/10 bg-main-2/10 px-2 py-2 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setSelectedWorkspace(null)}
              className="flex h-auto items-center justify-center rounded-lg p-2 text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
