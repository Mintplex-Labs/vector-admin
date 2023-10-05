import { useEffect, useState } from 'react';
import { CheckCircle, Circle, XCircle } from 'react-feather';
import { APP_NAME } from '../../../utils/constants';
import paths from '../../../utils/paths';
import { titleCase } from 'title-case';
import Workspace from '../../../models/workspace';

export default function ConnectorCard({
  knownConnector,
  workspace,
  organization,
}: {
  knownConnector?: any;
  workspace?: any;
  organization?: any;
}) {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState(null);

  useEffect(() => {
    async function fetchConnector() {
      if (!!knownConnector) {
        setLoading(false);
        setConnector(knownConnector);
        return;
      }

      setLoading(false);
    }
    fetchConnector();
  }, []);

  if (loading) {
    return (
      <div className="rounded-md border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800">
            Vector Database Connection
          </p>
          <Circle className="h-4 w-4 animate-pulse fill-slate-50 text-slate-200" />
        </div>

        <div className="mt-4 flex h-[70%] animate-pulse items-end justify-between rounded-lg bg-slate-100"></div>
      </div>
    );
  }

  if (!connector) {
    return (
      <>
        <div className="rounded-md border border-red-600 border-stroke bg-red-50 px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-red-800">
              Vector Database Connection
            </p>
            <XCircle className="h-4 w-4 fill-red-300 text-red-800" />
          </div>

          <div className="mt-4 flex h-[70%] flex-col gap-y-2">
            <p className="text-sm text-red-800">
              You have no vector database connected to this organization. You
              will be limited to read-only permissions until full setup.
            </p>

            <p className="text-sm text-red-800">
              Go to the organization dashboard to connect to a vector database.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rounded-md border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800">
            Vector Database Connection
          </p>
          <CheckCircle className="h-4 w-4 fill-green-50 text-green-600" />
        </div>

        <div className="mt-4 flex h-[70%] flex-col gap-y-2">
          <p className="text-sm text-slate-500">
            You are currently connected to a {connector.type} instance.
          </p>
          <div className="flex flex-col gap-y-2">
            <button
              type="button"
              onClick={() =>
                document?.getElementById('sync-connector-modal')?.showModal()
              }
              className="w-full rounded-lg border border-blue-600 py-2 text-center text-sm text-blue-600 hover:bg-blue-800 hover:text-white"
            >
              Sync Workspace Data
            </button>
          </div>
        </div>
      </div>
      <SyncConnectorModal
        organization={organization}
        workspace={workspace}
        connector={connector}
      />
    </>
  );
}

const SyncConnectorModal = ({
  organization,
  workspace,
  connector,
}: {
  organization: any;
  workspace: any;
  connector: any;
}) => {
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const sync = async () => {
    setError(null);
    setLoading(true);
    const { job, error } = await Workspace.syncConnector(
      organization.slug,
      workspace.slug,
      connector.id
    );

    if (!job) {
      setError(error);
      setLoading(false);
      setSynced(false);
      return;
    }

    setLoading(false);
    setSynced(true);
  };

  return (
    <dialog
      id="sync-connector-modal"
      className="w-1/3 rounded-lg"
      onClick={(event) =>
        event.target == event.currentTarget && event.currentTarget?.close()
      }
    >
      <div className="overflow-y-scroll rounded-sm bg-white p-[20px]">
        <div className="px-6.5 py-4">
          <h3 className="font-medium text-black dark:text-white">
            Sync Vector Database Workspace
          </h3>
          <p className="text-sm text-gray-500">
            {APP_NAME} can automatically sync existing vectors in your{' '}
            {titleCase(connector.type)}{' '}
            {connector.type === 'chroma' ? 'collection' : 'namespace'} so you
            can manage it more easily. This process can take a long time to
            complete depending on how much data you have embedded already.
            <br />
            <br />
            Once you start this process you can check on its progress in the{' '}
            <a
              href={paths.jobs(organization)}
              className="font-semibold text-blue-500"
            >
              job queue.
            </a>
          </p>
        </div>
        <div className="w-full px-6">
          {error && (
            <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-red-800">
              {error}
            </p>
          )}
          {synced ? (
            <button
              type="button"
              onClick={() => window.location.replace(paths.jobs(organization))}
              className="w-full rounded-lg py-2 text-center text-gray-600 hover:bg-gray-400 hover:text-white"
            >
              Check progress
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={sync}
              className="w-full rounded-lg bg-blue-600 py-2 text-center text-white"
            >
              {loading ? 'Synchronizing...' : 'Synchronize embeddings'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};
