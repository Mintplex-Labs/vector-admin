import { FullScreenLoader } from '../../../components/Preloader';
import useUser from '../../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../../layout/DefaultLayout';
import User from '../../../models/user';
import paths from '../../../utils/paths';
import AppLayout from '../../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import Organization from '../../../models/organization';
import { Info, Loader } from 'react-feather';
import { nFormatter } from '../../../utils/numbers';
import pluralize from 'pluralize';
import Tools from '../../../models/tools';
import showToast from '../../../utils/toast';

export default function ResetConnectionView() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [totalVectorCount, setTotalVectorCount] = useState<number>(0);

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
      const { remoteCount } = (
        await Organization.stats(focusedOrg.slug, 'vectorCounts')
      ).value;

      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setTotalVectorCount(remoteCount);
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
              Reset your vector database
            </h4>
            <p className="mt-2 text-gray-600">
              This tool will wipe all existing data in this vector database
              connection.
              <br />
              You should only use this tool if you are absolutely sure you want
              to lose this data.
            </p>
          </div>
        </div>
        <div className="flex w-1/2 flex-col gap-y-2">
          <SubmitResetJob
            organization={organization}
            totalVectorCount={totalVectorCount}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function SubmitResetJob({
  organization,
  totalVectorCount,
}: {
  organization: any;
  totalVectorCount: number;
}) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'failed'
  >('idle');

  async function submitReset() {
    setStatus('loading');
    const { success, message } = await Tools.resetOrg(organization.slug);

    if (success) {
      setStatus('success');
      showToast('Reset job has started as background job.', 'success');
      return;
    }

    setStatus('failed');
    showToast(message as string, 'error');
  }

  if (status === 'success') {
    return (
      <div className="mt-2 flex flex-col gap-y-1">
        <a
          href={paths.jobs(organization)}
          className="full flex items-center justify-center gap-x-1 rounded-lg bg-green-100 px-4 py-2 font-semibold text-green-800 hover:bg-green-200"
        >
          View job in background jobs &rarr;
        </a>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="mt-2 flex flex-col gap-y-1">
        <button
          disabled={true}
          className="full flex items-center justify-center gap-x-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <Loader size={14} className="animate-spin" />
          Deleting {nFormatter(totalVectorCount)}{' '}
          {pluralize('vector', totalVectorCount)} from{' '}
          {organization.connector.type} vector database...
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
        onClick={submitReset}
        className="full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Delete {nFormatter(totalVectorCount)}{' '}
        {pluralize('vector', totalVectorCount)} from{' '}
        {organization.connector.type} vector database
      </button>
      <p className="mx-auto w-4/5 text-center text-xs text-gray-500">
        Depending on the number of vectors this process can take a few moments.
        Please do not edit or update this vector database while the process is
        running.
      </p>
    </div>
  );
}
