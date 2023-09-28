import { Link } from 'react-router-dom';
import Jazzicon from '../../../components/Jazzicon';
import paths from '../../../utils/paths';
import moment from 'moment';
import { nFormatter } from '../../../utils/numbers';
import { FileText } from 'react-feather';
import truncate from 'truncate';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import Organization from '../../../models/organization';
import WorkspaceSearch from '../../../components/Sidebar/WorkspaceSearch';

export default function WorkspacesList({
  knownConnector,
  organization,
  workspaces,
  totalWorkspaces = 0,
}: {
  knownConnector: any;
  organization: any;
  workspaces: any[];
  totalWorkspaces?: number;
}) {
  return (
    <div className="col-span-12 flex-1 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className=" top-0 z-10 bg-white">
        <div className="mb-6 flex w-full items-center justify-between px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Workspaces {totalWorkspaces ? `(${totalWorkspaces})` : ''}
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
      </div>

      <WorkspaceSearch
        // @ts-ignore
        RenderComponent={WorkspaceCard}
        waitingContainerClassName="flex h-[40vh] w-full items-center justify-center rounded-sm bg-transparent rounded-lg text-slate-800 text-md font-semibold"
        searchInputClassName="light-search w-3/4 rounded-md border focus:border-blue-600 mx-auto bg-transparent px-4 py-2 text-sm text-slate-800 outline-none"
        canSearch={totalWorkspaces >= Organization.workspacePageSize}
      >
        <div className="h-auto w-full">
          {workspaces.length > 0 ? (
            <div className="no-scrollbar flex max-h-[800px] w-full flex-col overflow-y-scroll px-4">
              {workspaces.map((workspace) => (
                <WorkspaceCard workspace={workspace} slug={organization.slug} />
              ))}
            </div>
          ) : (
            <>
              {!!knownConnector ? (
                <div className="flex h-[40vh] w-full px-4">
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
              ) : (
                <div>
                  <div className="flex min-h-[40vh] w-full px-4">
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
        </div>
      </WorkspaceSearch>
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
  slug: string;
}
const WorkspaceCard = ({ workspace, slug }: WorkspaceCardProps) => (
  <Link
    key={workspace.uid}
    to={paths.workspace(slug, workspace.slug)}
    className="flex items-center gap-5 px-7.5 py-3 hover:bg-gray-50 dark:hover:bg-meta-4"
  >
    <div className="relative h-14 w-14 rounded-full">
      <Jazzicon uid={workspace.uid} size={55} />
    </div>

    <div className="flex flex-1 items-start justify-between">
      <div>
        <h5 className="max-w-[8vw] truncate font-medium text-black dark:text-white">
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
          <FileText className="h-4 w-4 text-gray-600" />
        </div>
        <p>
          <span className="whitespace-nowrap text-xs text-black dark:text-white">
            created {moment(workspace.createdAt).fromNow()}
          </span>
        </p>
      </div>
    </div>
  </Link>
);
