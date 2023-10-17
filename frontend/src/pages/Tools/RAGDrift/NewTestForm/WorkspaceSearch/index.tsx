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
        <label className="block text-sm font-medium text-gray-900">
          Workspace to test
        </label>
        <p className="text-sm text-gray-600">
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
              className="focus:ring-primary-600 focus:border-primary-600 block w-1/2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900"
              placeholder="Search workspace name"
              autoComplete="off"
            />
            {loadingWorkspaces ? (
              <Loader className="animate-spin text-blue-300" size={20} />
            ) : (
              <Circle className="animate-pulse text-gray-400" size={20} />
            )}
          </div>
          <div className="my-2 flex w-full flex-wrap items-center gap-4">
            {workspaces.map((workspace) => (
              <button
                onClick={() => setSelectedWorkspace(workspace)}
                className="rounded-full bg-blue-200 px-4 py-1.5 text-xs text-blue-700 hover:bg-blue-300"
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
              className="block w-fit rounded-lg p-2.5 text-lg text-gray-900"
            />
            <button
              type="button"
              onClick={() => setSelectedWorkspace(null)}
              className="flex h-auto items-center justify-center rounded-lg p-2 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
