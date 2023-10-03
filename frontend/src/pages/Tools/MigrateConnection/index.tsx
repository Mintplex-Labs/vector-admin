import { FullScreenLoader } from '../../../components/Preloader';
import useUser from '../../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../../layout/DefaultLayout';
import User from '../../../models/user';
import paths from '../../../utils/paths';
import AppLayout from '../../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import { APP_NAME } from '../../../utils/constants';
import Organization from '../../../models/organization';
import { CheckCircle, Info, Loader } from 'react-feather';
import { nFormatter } from '../../../utils/numbers';
import pluralize from 'pluralize';
import Tools from '../../../models/tools';
import showToast from '../../../utils/toast';

export default function MigrateConnectionView() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [totalVectorCount, setTotalVectorCount] = useState<number>(0);
  const [destination, setDestination] = useState<object | null>(null);

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
    >
      <div className="flex-1 rounded-sm bg-white px-6 pb-6">
        <div className="flex items-start justify-between">
          <div className="mb-6">
            <h4 className="text-3xl font-semibold text-black">
              Migrate your vector data
            </h4>
            <p className="mt-2 text-gray-600">
              This tool will enable you to migrate all data in this vector
              database to another known {APP_NAME} vector database connection.
              <br />
              No data will be modified or removed from the current vector
              database.
              <br />
              You should only migrate to empty vector databases.
            </p>
          </div>
        </div>

        <div className="flex w-1/2 flex-col gap-y-2">
          <div className="flex w-full justify-between ">
            <CurrentOrgCard
              organization={organization}
              onCount={setTotalVectorCount}
            />
            <div className="flex">
              <p className="my-auto text-xl font-semibold text-gray-700">to</p>
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
      <p className="mb-1 font-semibold text-gray-700">
        Migrating all data from
      </p>
      <div className="w-[20rem] rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
          {organization?.name}
        </h5>
        <p className="mb-3 text-sm font-normal text-gray-700">
          Connected to a <b>{organization?.connector?.type}</b> vector database.
        </p>
        <div>
          {loading ? (
            <div className="flex h-8 w-full animate-pulse items-center justify-center gap-x-1 rounded-lg bg-gray-100 py-1 text-sm" />
          ) : (
            <>
              {inSync ? (
                <div className="flex w-full items-center justify-center gap-x-1 rounded-lg bg-green-100 py-1 text-sm text-green-600">
                  <CheckCircle size={18} />
                  <p>Ready to migrate!</p>
                </div>
              ) : (
                <div className="text-grey-600 flex w-full flex-1 items-center justify-center gap-x-1 rounded-lg bg-gray-100 px-1 py-1 text-sm">
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
        <div className="h-full w-[20rem] rounded-lg border border-gray-200 bg-white p-6 shadow">
          <select
            onChange={handleSelection}
            name="destinationOrgId"
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-2xl text-gray-800 outline-none"
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
      <div className="h-full w-[20rem] rounded-lg border border-gray-200 bg-white p-6 shadow">
        <select
          onChange={handleSelection}
          name="destinationOrgId"
          className="w-full rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-2xl text-gray-800 outline-none"
        >
          <option value={destination.id}>{destination.name}</option>
          {availableDestinations
            .filter((org) => org.id !== destination.id)
            .map((org: any) => {
              return <option value={org.id}>{org.name}</option>;
            })}
        </select>
        <p className="mb-3 text-sm font-normal text-gray-700">
          Connected to a <b>{destination?.connector?.type}</b> vector database.
        </p>
        <div>
          {loading ? (
            <div className="flex h-8 w-full animate-pulse items-center justify-center gap-x-1 rounded-lg bg-gray-100 py-1 text-sm" />
          ) : (
            <>
              {isEmpty ? (
                <div className="flex w-full items-center justify-center gap-x-1 rounded-lg bg-green-100 py-1 text-sm text-green-600">
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

function SubmitMigrationJob({
  organization,
  destination,
  totalVectorCount,
}: {
  organization: any;
  destination: any;
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
          className="full flex items-center justify-center gap-x-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <Loader size={14} className="animate-spin" />
          Migrating {nFormatter(totalVectorCount)}{' '}
          {pluralize('vector', totalVectorCount)} to {destination.name}...
        </button>
        <p className="mx-auto w-4/5 text-center text-xs text-gray-500">
          This task will run in the background. You can view its progress in
          Background Jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-y-1">
      <button
        onClick={submitMigration}
        className="full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Migrate {nFormatter(totalVectorCount)}{' '}
        {pluralize('vector', totalVectorCount)} to {destination.name}
      </button>
      <p className="mx-auto w-4/5 text-center text-xs text-gray-500">
        Depending on the number of vectors this process can take a long time.
        Please do not edit or update either vector database while the process is
        running.
      </p>
    </div>
  );
}
