import PreLoader, { FullScreenLoader } from '@/components/Preloader';
import useUser from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import User from '@/models/user';
import paths from '@/utils/paths';
import AppLayout from '@/layout/AppLayout';
import { NavLink, useParams } from 'react-router-dom';
import Organization, { IOrganization } from '@/models/organization';
import Tools, { IRagTest } from '@/models/tools';
import NewTestForm, { NewTestFormModal } from './NewTestForm';
import RecentTestRuns from './RecentTests';

import ChromaLogo from '@/images/vectordbs/chroma.png';
import PineconeLogoInverted from '@/images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '@/images/vectordbs/qdrant.png';
import WeaviateLogo from '@/images/vectordbs/weaviate.png';
import truncate from 'truncate';
import { CaretDown, GearSix, Prohibit } from '@phosphor-icons/react';
import SyncConnectorModal from '@/components/Modals/SyncConnectorModal';
import UpdateConnectorModal from '@/components/Modals/UpdateConnectorModal';
import NewConnectorModal from '@/components/Modals/NewConnectorModal';

export default function RAGDriftTesting() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [ragTests, setRagTests] = useState<IRagTest[]>([]);
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

      const { ragTests: _ragTests } = await Tools.ragTests(focusedOrg.slug);
      setRagTests(_ragTests);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

  if (organizations.length === 0 || !organization) {
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
        <RagTestHeader organization={organization} connector={connector} />
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
            RAG Context drift testing
          </div>
        </div>

        <div className="ml-13 pr-6">
          <div className="mt-1 w-full text-sm text-white text-opacity-60">
            <b>What is "Context drift"?</b>
            <br />
            <i>"Context Drift"</i> is what happens when your vector database
            changes over time and what was a good LLM response suddenly changes
            and gives vastly different answers.
            <br />
            <br />
            Often, you depend on high quality and current context snippets to
            answer user prompts in LLM chatbot applications. As your
            workspace/namespace/collection changes over time the "similar"
            documents being referenced will change. This can often lead to
            vastly different LLM responses for a fixed prompt. This tool will
            proactively alert you that deviations have occurred for a fixed
            prompt so you can catch them quickly.
            <br />
          </div>
        </div>
        <div className="ml-13 mt-4 flex w-3/4 flex-col gap-y-2 pb-8">
          {loading ? (
            <PreLoader />
          ) : (
            <>
              {ragTests.length > 0 ? (
                <>
                  <RecentTestRuns tests={ragTests} setTests={setRagTests} />
                  <NewTestFormModal
                    organization={organization}
                    postCreate={(test: IRagTest) => {
                      setRagTests([test, ...ragTests]);
                      document.getElementById('new-rag-test-modal')?.close();
                    }}
                  />
                </>
              ) : (
                <NewTestForm
                  organization={organization}
                  postCreate={(test: IRagTest) =>
                    setRagTests([test, ...ragTests])
                  }
                />
              )}
            </>
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

function RagTestHeader({ organization, connector }: any) {
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
