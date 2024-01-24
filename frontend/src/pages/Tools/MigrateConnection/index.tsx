import { FullScreenLoader } from '@/components/Preloader';
import useUser from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import User from '@/models/user';
import paths from '@/utils/paths';
import AppLayout from '@/layout/AppLayout';
import { NavLink, useParams } from 'react-router-dom';
import { APP_NAME } from '@/utils/constants';
import Organization from '@/models/organization';
import { CheckCircle, Info, Loader } from 'react-feather';
import { nFormatter } from '@/utils/numbers';
import pluralize from 'pluralize';
import Tools from '@/models/tools';
import showToast from '@/utils/toast';

import ChromaLogo from '@/images/vectordbs/chroma.png';
import PineconeLogoInverted from '@/images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '@/images/vectordbs/qdrant.png';
import WeaviateLogo from '@/images/vectordbs/weaviate.png';
import truncate from 'truncate';
import { CaretDown, GearSix, Prohibit } from '@phosphor-icons/react';
import SyncConnectorModal from '@/components/Modals/SyncConnectorModal';
import UpdateConnectorModal from '@/components/Modals/UpdateConnectorModal';
import NewConnectorModal from '@/components/Modals/NewConnectorModal';

export default function MigrateConnectionView() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [totalVectorCount, setTotalVectorCount] = useState<number>(0);
  const [destination, setDestination] = useState<object | null>(null);
  const [connector, setConnector] = useState<object | null>(null);

  useEffect(() => {
    async function userOrgs() {
      if (!slug) return false;

      const orgs = await User.organizations();
      if (orgs.length === 0) {
        window.location.replace(paths.onboarding.orgName());
        return false;
      }
      for (const org of orgs) {
        const connector = await Organization.connector(org.slug);
        org.connector = connector || {};
      }

      const focusedOrg =
        orgs?.find((org: any) => org.slug === slug) || orgs?.[0];

      const _connector = await Organization.connector(focusedOrg.slug);
      setConnector(_connector);

      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

  if (loading || organizations.length === 0) {
    return (
      <DefaultLayout>
        <FullScreenLoader />
      </DefaultLayout>
    );
  }

  if (!organization) return null;
  return (
    <AppLayout
      headerEntity={organization}
      headerProp="uuid"
      organizations={organizations}
      organization={organization}
      workspaces={[]}
      headerExtendedItems={
        <MigrateConnectionHeader
          organization={organization}
          connector={connector}
        />
      }
    >
      <div className="col-span-12 mt-4 h-screen flex-1 rounded-sm bg-main pb-6 xl:col-span-4">
        <div className="-mt-10 flex items-center gap-x-4">
          <button
            onClick={() => window.history.back()}
            className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
          >
            <CaretDown weight="bold" size={18} />
          </button>
          <div className="text-lg font-medium text-white">
            Migrate your vector data
          </div>
        </div>

        <div className="ml-13 pr-6">
          <div className="mt-1 w-125 text-sm text-white text-opacity-60">
            This tool will enable you to migrate all data in this vector
            database to another known {APP_NAME} vector database connection.
            <br />
            No data will be modified or removed from the current vector
            database.
            <br />
            You should only migrate to empty vector databases.
          </div>
        </div>

        <div className="ml-13 mt-4 flex w-1/2 flex-col gap-y-2">
          <div className="flex w-full items-center justify-between">
            <CurrentOrgCard
              organization={organization}
              onCount={setTotalVectorCount}
            />
            <div className="flex px-4">
              <p className="text-md my-auto font-semibold text-white">to</p>
            </div>
            <DestinationOrgCard
              currentOrg={organization}
              selection={destination}
              organizations={organizations}
              onSelect={setDestination}
            />
          </div>

          {!!destination && totalVectorCount > 0 && (
            <SubmitMigrationJob
              organization={organization}
              destination={destination}
              totalVectorCount={totalVectorCount}
            />
          )}
        </div>
      </div>
      {connector && (
        <>
          <UpdateConnectorModal
            organization={organization}
            connector={connector}
            onUpdate={(newConnector) => setConnector(newConnector)}
          />
          <SyncConnectorModal
            organization={organization}
            connector={connector}
          />
        </>
      )}
    </AppLayout>
  );
}

function CurrentOrgCard({
  organization,
  onCount,
}: {
  organization: any;
  onCount: (count: number) => void;
}) {
  const [inSync, setInSync] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function OrgInSync() {
      const { remoteCount, localCount } = (
        await Organization.stats(organization.slug, 'vectorCounts')
      ).value;
      if (remoteCount === 0) {
        setInSync(false);
        setLoading(false);
        return;
      }

      setInSync(remoteCount === localCount);
      onCount(remoteCount);
      setLoading(false);
    }
    OrgInSync();
  }, []);

  return (
    <div>
      <p className="mb-2 font-semibold text-white">Migrating all data from</p>
      <div className="w-[20rem] rounded-lg border-2 border-white/20 bg-main-2/10 p-6 shadow">
        <h5 className="text-md mb-2 font-bold tracking-tight text-white">
          {organization?.name}
        </h5>
        <p className="mb-3 text-sm font-normal text-white">
          Connected to a <b>{organization?.connector?.type}</b> vector database.
        </p>
        <div>
          {loading ? (
            <div className="flex h-8 w-full animate-pulse items-center justify-center gap-x-1 rounded-lg bg-gray-100 py-1 text-sm" />
          ) : (
            <>
              {inSync ? (
                <div className="flex w-full items-center justify-center gap-x-1 rounded-lg bg-green-300 py-1 text-sm text-neutral-700">
                  <CheckCircle size={18} />
                  <p>Ready to migrate!</p>
                </div>
              ) : (
                <div className="flex w-full flex-1 items-center justify-center gap-x-1 rounded-lg bg-main-2/90 px-1 py-1 text-sm text-gray-600">
                  <Info size={18} className="shrink-0" />
                  <p className="text-center">
                    Some vectors are not synced and will not migrate.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DestinationOrgCard({
  currentOrg,
  selection,
  organizations,
  onSelect,
}: {
  currentOrg: any;
  selection?: any | null;
  organizations: any[];
  onSelect: (org: object) => void;
}) {
  const availableDestinations = organizations.filter(
    (org) => org.slug !== currentOrg.slug && !!org.connector
  );
  const [destination, setDestination] = useState(selection || null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSelection = (e) => {
    const selectedDestination = availableDestinations.find(
      (org) => org.id === Number(e.target.value)
    );
    setDestination(selectedDestination);
    onSelect(selectedDestination);
  };

  useEffect(() => {
    async function OrgIsEmpty() {
      if (!destination) return;
      const { remoteCount } = (
        await Organization.stats(destination.slug, 'vectorCounts')
      ).value;
      setIsEmpty(remoteCount === 0);
      setLoading(false);
    }
    OrgIsEmpty();
  }, [destination]);

  if (!destination) {
    return (
      <div className="flex flex-col">
        <p className="mb-1 font-semibold text-gray-700">&nbsp;</p>
        <div className="w-[20rem] rounded-lg border-2 border-white/20 bg-main-2/10 p-6 shadow">
          <select
            onChange={handleSelection}
            name="destinationOrgId"
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-2xl text-gray-800 outline-none"
          >
            <option>Select organization</option>
            {availableDestinations.map((org: any) => {
              return <option value={org.id}>{org.name}</option>;
            })}
          </select>
          <p className="mb-3 text-sm font-normal text-gray-700"></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="mb-1 font-semibold text-gray-700">&nbsp;</p>
      <div className="w-[20rem] rounded-lg border-2 border-white/20 bg-main-2/10 p-6 shadow">
        <select
          onChange={handleSelection}
          name="destinationOrgId"
          className="w-full rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-2xl text-gray-800 outline-none"
        >
          <option value={destination.id}>{destination.name}</option>
          {availableDestinations
            .filter((org) => org.id !== destination.id)
            .map((org: any) => {
              return <option value={org.id}>{org.name}</option>;
            })}
        </select>
        <p className="mb-3 mt-3 text-sm font-normal text-white">
          Connected to a <b>{destination?.connector?.type}</b> vector database.
        </p>
        <div>
          {loading ? (
            <div className="flex h-8 w-full animate-pulse items-center justify-center gap-x-1 rounded-lg bg-gray-100 py-1 text-sm" />
          ) : (
            <>
              {isEmpty ? (
                <div className="flex w-full items-center justify-center gap-x-1 rounded-lg bg-green-300 py-1 text-sm text-neutral-700">
                  <CheckCircle size={18} />
                  <p>Ready to migrate!</p>
                </div>
              ) : (
                <div className="text-grey-600 flex w-full flex-1 items-center justify-center gap-x-1 rounded-lg bg-gray-100 px-1 py-1 text-sm">
                  <Info size={18} className="shrink-0" />
                  <p className="text-center">
                    You should only migrate to a empty vector database.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface IDestination {
  name: string;
  connector: {
    type: 'pinecone' | 'chroma' | 'qdrant' | 'weaviate';
    settings: string;
  };
}

function SubmitMigrationJob({
  organization,
  destination,
  totalVectorCount,
}: {
  organization: any;
  destination: IDestination;
  totalVectorCount: number;
}) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'failed'
  >('idle');

  async function submitMigration() {
    setStatus('loading');
    const { success, message } = await Tools.migrateOrg(organization.slug, {
      destinationOrgId: destination.id,
    });

    if (success) {
      setStatus('success');
      showToast('Migration has started as background job.', 'success');
      return;
    }

    setStatus('failed');
    showToast(message as string, 'error');
  }

  if (status === 'success') return null;

  if (status === 'loading') {
    return (
      <div className="mt-2 flex flex-col gap-y-1">
        <button
          disabled={true}
          className="full flex h-11 w-full items-center justify-center gap-x-1 rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          <Loader size={14} className="animate-spin" />
          Migrating {nFormatter(totalVectorCount)}{' '}
          {pluralize('vector', totalVectorCount)} to {destination.name}...
        </button>
        <p className="mx-auto mt-4 text-xs text-white/60">
          This task will run in the background. You can view its progress in
          Background Jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-y-1">
      {isIneligibleConnector(destination) && (
        <div className="my-2 flex flex-col gap-y-1">
          <p className="mx-auto w-full rounded-lg bg-red-600/20 p-2 text-center text-sm text-red-800">
            Namespace support for Pinecone db "{destination.name}" is not
            supported.
            <br />
            Migration of namespaced data will not succeed.
          </p>
        </div>
      )}

      <button
        onClick={submitMigration}
        className="h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
      >
        Migrate {nFormatter(totalVectorCount)}{' '}
        {pluralize('vector', totalVectorCount)} to {destination.name}
      </button>
      <p className="mx-auto mt-4 text-xs text-white/60">
        Depending on the number of vectors this process can take a long time.
        Please do not edit or update either vector database while the process is
        running.
      </p>
    </div>
  );
}

function isIneligibleConnector(destination?: IDestination) {
  if (!destination) return false;
  if (destination.connector.type !== 'pinecone') return false;

  const { environment } = JSON.parse(destination.connector.settings);
  return environment === 'gcp-starter';
}

function MigrateConnectionHeader({ organization, connector }: any) {
  let logo;
  switch (connector?.type) {
    case 'chroma':
      logo = ChromaLogo;
      break;
    case 'qdrant':
      logo = qDrantLogo;
      break;
    case 'weaviate':
      logo = WeaviateLogo;
      break;
    case 'pinecone':
      logo = PineconeLogoInverted;
      break;
  }

  return (
    <>
      <div className=" mr-10 w-full rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
        <div className="flex items-center gap-x-2">
          <span className="text-lg font-medium text-white">
            {truncate(organization?.name, 20)}
          </span>
        </div>
      </div>
      <div className="flex gap-x-3">
        <button
          onClick={() =>
            window.document?.getElementById('edit-connector-modal')?.showModal()
          }
          className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-white border-opacity-20 transition-all duration-300 hover:bg-opacity-5"
        >
          {!!connector?.type ? (
            <img src={logo} alt="Connector logo" className="h-full p-1" />
          ) : (
            <>
              <NewConnectorModal
                organization={organization}
                onNew={() => window.location.reload()}
              />
              <div className="text-white/60 hover:cursor-not-allowed">
                <Prohibit size={28} />
              </div>
            </>
          )}
        </button>

        <button
          onClick={() =>
            document?.getElementById('sync-connector-modal')?.showModal()
          }
          className="inline-flex h-11 w-[74px] flex-col items-center justify-center gap-2.5 rounded-lg bg-white bg-opacity-10 px-5 py-2.5 transition-all duration-300 hover:bg-opacity-5"
        >
          <div className="h-[25.53px] w-11 text-center font-['Satoshi'] text-base font-bold text-white">
            Sync
          </div>
        </button>

        <NavLink
          to={paths.organizationSettings(organization)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-white border-opacity-20 text-white transition-all duration-300 hover:bg-opacity-5"
        >
          <GearSix size={28} />
        </NavLink>
      </div>
    </>
  );
}
