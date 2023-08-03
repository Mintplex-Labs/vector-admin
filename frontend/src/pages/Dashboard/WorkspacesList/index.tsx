import { Link, useParams } from 'react-router-dom';
import Jazzicon from '../../../components/Jazzicon';
import paths from '../../../utils/paths';
import moment from 'moment';
import { nFormatter } from '../../../utils/numbers';
import { File } from 'react-feather';
import truncate from 'truncate';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import { useState } from 'react';
import Organization from '../../../models/organization';
import { debounce } from 'lodash';

export default function WorkspacesList({
  knownConnector,
  organization,
  workspaces,
}: {
  knownConnector: any;
  organization: any;
  workspaces: any[];
}) {
  const { slug } = useParams();
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSearch = async (e: any) => {
    if (!slug) return null;
    const searchTerm = e.target?.value;
    if (searchTerm !== '') {
      setIsTyping(true);
      setSearching(true);

      const { workspacesResults = [] } = await Organization.searchWorkspaces(
        slug,
        1, // Page 1
        30, // 30 results per page
        searchTerm
      );

      setResults(workspacesResults);
      setIsTyping(false);
    } else {
      setIsTyping(false);
      setSearching(false);
    }
  };

  if (!slug) return null;
  const debouncedSearch = debounce(handleSearch, 500);

  return (
    <div
      className="col-span-12 flex-1 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4"
      style={{ maxHeight: '860px', overflowY: 'auto' }}
    >
      <div
        className=" top-0 z-10 bg-white"
        style={{ top: '0px', backgroundColor: 'white' }}
      >
        <div className="mb-6 flex w-full items-center justify-between px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Workspaces {workspaces.length > 0 ? `(${workspaces.length})` : ''}
          </h4>
          {workspaces.length > 0 && (
            <button
              onClick={() => {
                document
                  .getElementById('workspace-creation-modal')
                  ?.showModal();
              }}
              className="rounded-lg px-2 py-1 text-sm text-slate-800  hover:bg-slate-200"
            >
              New workspace
            </button>
          )}
        </div>
        <div className="px-4">
          <input
            type="search"
            placeholder="Search for workspace"
            className="dark-search mb-4 w-full rounded-lg border border-stroke bg-white px-4 py-2 text-sm text-black placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500 dark:border-strokedark dark:text-white"
            onChange={debouncedSearch}
          />
        </div>
      </div>

      {searching ? (
        <>
          {isTyping ? (
            <div className="flex h-20 w-full animate-pulse items-center justify-center rounded-sm bg-white">
              <p className="p-1 text-lg text-slate-500">Loading...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((workspace: any) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  organization={organization}
                />
              ))}
            </>
          ) : (
            <div className="flex h-20 w-full items-center justify-center rounded-sm bg-white">
              <p className="p-1 text-lg text-slate-500">No results found.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {workspaces.length > 0 ? (
            <div>
              <>
                {workspaces.map((workspace) => (
                  <WorkspaceCard
                    workspace={workspace}
                    organization={organization}
                  />
                ))}
              </>
            </div>
          ) : (
            <>
              {!!knownConnector ? (
                <div>
                  <div className="flex min-h-[40vh] w-full px-8">
                    <div className="flex h-auto w-full items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200">
                      <button
                        onClick={() => {
                          document
                            .getElementById('workspace-creation-modal')
                            ?.showModal();
                        }}
                        className="rounded-lg border border-slate-800 px-4 py-2 text-slate-800 hover:bg-slate-800 hover:text-white"
                      >
                        Find or Create a Workspace
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex min-h-[40vh] w-full px-8">
                    <div className="flex h-auto w-full items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200">
                      <p className="px-4 text-center text-sm">
                        Creation of workspaces is disabled until you add a
                        vector database connection
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <CreateWorkspaceModal organization={organization} />
    </div>
  );
}

interface WorkspaceCardProps {
  workspace: {
    uid: string;
    name: string;
    workspaceId: string;
    createdAt: number;
    documentCount: number;
    slug: string;
  };
  organization: {
    slug: string;
  };
}
const WorkspaceCard = ({ workspace, organization }: WorkspaceCardProps) => (
  <Link
    key={workspace.uid}
    to={paths.workspace(organization.slug, workspace.slug)}
    className="flex items-center gap-5 px-7.5 py-3 hover:bg-gray-3 dark:hover:bg-meta-4"
  >
    <div className="relative h-14 w-14 rounded-full">
      <Jazzicon uid={workspace.uid} size={55} />
    </div>

    <div className="flex flex-1 items-center justify-between">
      <div>
        <h5 className="font-medium text-black dark:text-white">
          {workspace.name}
        </h5>
        <p>
          <span className="text-xs text-slate-500">
            {truncate(workspace.workspaceId, 15)}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-y-1">
        <div className="flex items-center justify-center gap-x-1">
          <p className="text-sm text-gray-600">
            {nFormatter(workspace?.documentCount || 0)}
          </p>
          <File className="h-4 w-4 text-gray-600" />
        </div>
        <p>
          <span className="text-sm text-black dark:text-white">
            created {moment.unix(workspace.createdAt).fromNow()}
          </span>
        </p>
      </div>
    </div>
  </Link>
);
