import { FullScreenLoader } from '@/components/Preloader';
import useUser from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import User from '@/models/user';
import paths from '@/utils/paths';
import AppLayout from '@/layout/AppLayout';
import { NavLink, useParams } from 'react-router-dom';
import Organization from '@/models/organization';
import { Loader } from 'react-feather';
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

export default function ResetConnectionView() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [totalVectorCount, setTotalVectorCount] = useState<number>(0);
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
      const { remoteCount } = (
        await Organization.stats(focusedOrg.slug, 'vectorCounts')
      ).value;

      const _connector = await Organization.connector(focusedOrg.slug);
      setConnector(_connector);

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
      headerExtendedItems={
        <ResetConnectionHeader
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
            Reset your vector database
          </div>
        </div>

        <div className="ml-13 pr-6">
          <div className="mt-1 w-125 text-sm text-white text-opacity-60">
            This tool will wipe all existing data in this vector database
            connection.
            <br />
            You should only use this tool if you are absolutely sure you want to
            lose this data.
          </div>
        </div>

        <div className="ml-13 flex w-1/2 flex-col gap-y-2">
          <SubmitResetJob
            organization={organization}
            totalVectorCount={totalVectorCount}
          />
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
          className="full flex h-11 w-full items-center justify-center gap-x-1 rounded-lg bg-green-300 p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
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
          className="full flex h-11 w-full items-center justify-center gap-x-1 rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          <Loader size={14} className="animate-spin" />
          Deleting {nFormatter(totalVectorCount)}{' '}
          {pluralize('vector', totalVectorCount)} from{' '}
          {organization.connector.type} vector database...
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
      <button
        onClick={submitReset}
        className="h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
      >
        Delete {nFormatter(totalVectorCount)}{' '}
        {pluralize('vector', totalVectorCount)} from{' '}
        {organization.connector.type} vector database
      </button>
      <p className="mx-auto mt-4 text-xs text-white/60">
        Depending on the number of vectors this process can take a few moments.
        Please do not edit or update this vector database while the process is
        running.
      </p>
    </div>
  );
}

function ResetConnectionHeader({ organization, connector }: any) {
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
