import PreLoader, { FullScreenLoader } from '@/components/Preloader';
import useUser from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import User from '@/models/user';
import paths from '@/utils/paths';
import AppLayout from '@/layout/AppLayout';
import { NavLink, useParams } from 'react-router-dom';
import Organization, { IOrganization } from '@/models/organization';
import Tools, { IRagTest, IRagTestRun } from '@/models/tools';
import RunsList from './RunsList';
import {
  EnableDisableButton,
  RunNowButton,
} from '@/pages/Tools/RAGTesting/RecentTests';
import showToast from '@/utils/toast';
import { Loader } from 'react-feather';

import ChromaLogo from '@/images/vectordbs/chroma.png';
import PineconeLogoInverted from '@/images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '@/images/vectordbs/qdrant.png';
import WeaviateLogo from '@/images/vectordbs/weaviate.png';
import truncate from 'truncate';
import { CaretDown, GearSix, Prohibit } from '@phosphor-icons/react';
import SyncConnectorModal from '@/components/Modals/SyncConnectorModal';
import UpdateConnectorModal from '@/components/Modals/UpdateConnectorModal';
import NewConnectorModal from '@/components/Modals/NewConnectorModal';

export default function RAGDriftTestRuns() {
  const { user } = useUser();
  const { slug, testId } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [test, setTest] = useState<IRagTest>();
  const [runs, setRuns] = useState<IRagTestRun[]>();
  const [connector, setConnector] = useState<object | null>(null);

  useEffect(() => {
    async function userOrgs() {
      if (!slug || !testId) return false;

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

      const { test, runs } = await Tools.ragTest(focusedOrg.slug, testId);
      setTest(test);
      setRuns(runs);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

  if (organizations.length === 0 || !organization || !test) {
    return (
      <DefaultLayout>
        <FullScreenLoader />
      </DefaultLayout>
    );
  }

  return (
    <AppLayout
      headerEntity={organization}
      headerProp="uuid"
      organizations={organizations}
      organization={organization}
      workspaces={[]}
      headerExtendedItems={
        <RecentRunsHeader organization={organization} connector={connector} />
      }
    >
      {/* <div className="flex-1 rounded-sm bg-white px-6 pb-6">
        <a
          href={paths.tools.ragTests(organization)}
          className="my-2 text-sm text-blue-500 underline"
        >
          &larr; back to tests
        </a>
        <div className="flex items-start justify-between">
          <div className="mb-6 w-3/4">
            <div className="flex w-full items-center justify-between">
              <h4 className="text-3xl font-semibold text-black">
                Context Drift test #{test.id} recent runs
              </h4>
              <div className="flex items-center gap-x-6">
                <RunNowButton test={test} />
                <EnableDisableButton test={test} onChange={setTest} />
                <DeleteTestButton test={test} />
              </div>
            </div>
            <p className="mt-2 w-full text-gray-600">
              These are all of the recent runs of this specific test.
            </p>
          </div>
        </div>
        <div className="flex w-3/4 flex-col gap-y-2">
          {loading ? <PreLoader /> : <RunsList test={test} runs={runs} />}
        </div>
      </div> */}

      <div className="col-span-12 mt-4 h-screen flex-1 rounded-sm bg-main pb-6 xl:col-span-4">
        <div className="-mt-10 flex items-center gap-x-4">
          <a
            href={paths.tools.ragTests(organization)}
            className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
          >
            <CaretDown weight="bold" size={18} />
          </a>
          <div className="text-lg font-medium text-white">
            Context Drift test #{test.id} recent runs
          </div>
        </div>

        <div className="ml-13 pr-6">
          <div className="flex items-start justify-between">
            <div className="mb-6 w-3/4">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-x-6">
                  <RunNowButton test={test} />
                  <EnableDisableButton test={test} onChange={setTest} />
                  <DeleteTestButton test={test} />
                </div>
              </div>
              <p className="mt-2 w-full text-white">
                These are all of the recent runs of this specific test.
              </p>
            </div>
          </div>
          <div className="flex w-3/4 flex-col gap-y-2 py-8">
            {loading ? <PreLoader /> : <RunsList test={test} runs={runs} />}
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
      </div>
    </AppLayout>
  );
}

function DeleteTestButton({ test }: { test: IRagTest }) {
  const [loading, setLoading] = useState(false);
  const confirmDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove this test and it's associated data?\n\nThis cannot be undone."
      )
    )
      return false;

    setLoading(true);
    const success = await Tools.deleteRagTest(test);
    if (success) {
      window.location.replace(paths.tools.ragTests(test.organization));
    } else {
      showToast(`Could test could not be deleted.`, 'info');
    }
    setLoading(false);
  };

  return (
    <>
      <i className="hidden text-green-400 text-red-400 hover:bg-green-600 hover:bg-red-600 disabled:bg-green-600 disabled:bg-red-600" />
      <button
        type="button"
        disabled={loading}
        onClick={confirmDelete}
        className={`flex items-center gap-x-2 rounded-lg px-2 py-1 text-red-400 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:bg-red-600 disabled:text-white`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={14} />
            <p>Deleting...</p>
          </>
        ) : (
          <>Delete Test</>
        )}
      </button>
    </>
  );
}

function RecentRunsHeader({ organization, connector }: any) {
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
