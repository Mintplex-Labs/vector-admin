import { useEffect, useState } from 'react';
import { CheckCircle, Circle, XCircle } from 'react-feather';
import Organization from '../../../models/organization';
import { SUPPORTED_VECTOR_DBS } from '../../../utils/constants';
import { titleCase } from 'title-case';
import SyncConnectorModal from '../../../components/Modals/SyncConnectorModal';
import UpdateConnectorModal from '../../../components/Modals/UpdateConnectorModal';
import NewConnectorModal from '../../../components/Modals/NewConnectorModal';

export default function ConnectorCard({
  knownConnector,
  organization,
  workspaces,
}: {
  knownConnector?: any;
  organization?: any;
  workspaces?: any[];
}) {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<object | null>(null);
  const [canSync, setCanSync] = useState(false);

  useEffect(() => {
    async function fetchConnector() {
      if (!!knownConnector) {
        if (SUPPORTED_VECTOR_DBS.includes(knownConnector.type)) {
          const { value: result } = await Organization.stats(
            organization.slug,
            'vectorCounts'
          );

          if (!!result) {
            if (
              result.remoteCount > 0 &&
              result.remoteCount !== result.localCount
            )
              setCanSync(true);
          }
        }

        setLoading(false);
        setConnector(knownConnector);
        return;
      }

      setLoading(false);
    }
    fetchConnector();
  }, []);

  async function handleNewConnector(connector: object) {
    if (!connector) return;
    setLoading(true);

    if (SUPPORTED_VECTOR_DBS.includes(connector.type)) {
      const { value: result } = await Organization.stats(
        organization.slug,
        'vectorCounts'
      );

      if (!!result) {
        if (result.remoteCount > 0 && result.remoteCount !== result.localCount)
          setCanSync(true);
      }
    }

    setConnector(connector);
    setLoading(false);
  }

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
            <button
              type="button"
              onClick={() =>
                document?.getElementById('new-connector-modal')?.showModal()
              }
              className="w-full rounded-lg border border-red-800 py-2 text-center text-sm text-red-800 hover:bg-red-800 hover:text-white"
            >
              Connect Database
            </button>
          </div>
        </div>
        <NewConnectorModal
          organization={organization}
          onNew={handleNewConnector}
        />
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
            {canSync ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    document
                      ?.getElementById('sync-connector-modal')
                      ?.showModal()
                  }
                  className="w-full rounded-lg border border-blue-600 py-2 text-center text-sm text-blue-600 hover:bg-blue-800 hover:text-white"
                >
                  Sync {titleCase(connector.type)} Data
                </button>
                <button
                  type="button"
                  onClick={() =>
                    document
                      ?.getElementById('edit-connector-modal')
                      ?.showModal()
                  }
                  className="w-full text-center text-xs text-slate-400"
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  document?.getElementById('edit-connector-modal')?.showModal()
                }
                className="w-full rounded-lg border border-blue-600 py-2 text-center text-sm text-blue-600 hover:bg-blue-800 hover:text-white"
              >
                Edit Connector
              </button>
            )}
          </div>
        </div>
      </div>
      <UpdateConnectorModal
        organization={organization}
        connector={connector}
        onUpdate={setConnector}
      />
      <SyncConnectorModal organization={organization} connector={connector} />
    </>
  );
}
