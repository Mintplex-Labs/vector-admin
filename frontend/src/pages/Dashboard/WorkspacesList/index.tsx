import { Link } from 'react-router-dom';
import Jazzicon from '../../../components/Jazzicon';
import paths from '../../../utils/paths';
import moment from 'moment';
import { nFormatter } from '../../../utils/numbers';
import { File } from 'react-feather';
import truncate from 'truncate';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function WorkspacesList({
  knownConnector,
  organization,
  workspaces,
}: {
  knownConnector: any;
  organization: any;
  workspaces: any[];
}) {
  return (
    <div className="col-span-12 flex-1 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-6 flex w-full items-center justify-between px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Workspaces {workspaces.length > 0 ? `(${workspaces.length})` : ''}
        </h4>
        {workspaces.length > 0 && (
          <button
            onClick={() => {
              document.getElementById('workspace-creation-modal')?.showModal();
            }}
            className="rounded-lg px-2 py-1 text-sm text-slate-800  hover:bg-slate-200"
          >
            New workspace
          </button>
        )}
      </div>

      {workspaces.length > 0 ? (
        <div>
          <>
            {workspaces.map((workspace) => {
              return (
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
            })}
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
                    Creation of workspaces is disabled until you add a vector
                    database connection
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <CreateWorkspaceModal organization={organization} />
    </div>
  );
}
