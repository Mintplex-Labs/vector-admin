import { useState, memo } from 'react';
import Organization from '../../models/organization';
import { titleCase } from 'title-case';
import paths from '../../utils/paths';

const SyncConnectorModal = memo(
  ({ organization, connector }: { organization: any; connector: any }) => {
    const [synced, setSynced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const sync = async () => {
      setError(null);
      setLoading(true);
      const { job, error } = await Organization.syncConnector(
        organization.slug,
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
        className="w-1/3 rounded-xl border-2 border-white/20 bg-main shadow"
        onClick={(event) =>
          event.target == event.currentTarget && event.currentTarget?.close()
        }
      >
        <div className="overflow-y-scroll rounded-sm bg-main p-[20px]">
          <div className="px-6.5 py-4">
            <h3 className="text-lg font-medium text-white">
              Sync Vector Database Connection
            </h3>
            <p className="mt-4 text-sm text-white/60">
              Automatically sync existing information in your{' '}
              {titleCase(connector.type)}{' '}
              {connector.type === 'chroma' ? 'collections' : 'namespaces'} so
              you can manage it more easily. This process can take a long time
              to complete depending on how much data you have embedded already.
              <br />
              <br />
              Once you start this process you can check on its progress in the{' '}
              <a
                href={paths.jobs(organization)}
                className="font-semibold text-sky-400 hover:underline"
              >
                job queue.
              </a>
            </p>
          </div>
          <div className="w-full px-6">
            {error && (
              <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-sm text-red-800">
                {error}
              </p>
            )}
            {synced ? (
              <button
                type="button"
                onClick={() =>
                  window.location.replace(paths.jobs(organization))
                }
                className="w-full rounded-lg py-2 text-center text-gray-600 hover:bg-gray-400 hover:text-white"
              >
                Check progress
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={sync}
                className="mb-4 h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
              >
                {loading ? 'Synchronizing...' : 'Synchronize embeddings'}
              </button>
            )}
          </div>
        </div>
      </dialog>
    );
  }
);

export default SyncConnectorModal;
