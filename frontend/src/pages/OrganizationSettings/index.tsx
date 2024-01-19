import { FullScreenLoader } from '@/components/Preloader';
import useUser from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import User from '@/models/user';
import paths from '@/utils/paths';
import AppLayout from '@/layout/AppLayout';
import OrgSettings from './Settings';
import { useParams } from 'react-router-dom';

import ChromaLogo from '@/images/vectordbs/chroma.png';
import PineconeLogoInverted from '@/images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '@/images/vectordbs/qdrant.png';
import WeaviateLogo from '@/images/vectordbs/weaviate.png';
import { GearSix, Prohibit } from '@phosphor-icons/react';
import Organization from '@/models/organization';
import truncate from 'truncate';
import SyncConnectorModal from '@/components/Modals/SyncConnectorModal';
import UpdateConnectorModal from '@/components/Modals/UpdateConnectorModal';
import NewConnectorModal from '@/components/Modals/NewConnectorModal';

export default function OrganizationSettingsView() {
  const { user } = useUser();
  const { slug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [connector, setConnector] = useState<object | null | boolean>(false);

  useEffect(() => {
    async function fetchInfo() {
      const orgs = await User.organizations();
      if (orgs.length === 0) {
        window.location.replace(paths.onboarding.orgName());
        return false;
      }
      const focusedOrg = orgs?.find((org) => org.slug === slug) || orgs?.[0];
      const _connector = await Organization.connector(focusedOrg.slug);
      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setLoading(false);
      setConnector(_connector);
    }
    fetchInfo();
  }, [user.uid]);

  if (loading) {
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
        <OrganizationHeader organization={organization} connector={connector} />
      }
    >
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <OrgSettings organization={organization} />
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
      </div>
    </AppLayout>
  );
}

function OrganizationHeader({ organization, connector }: any) {
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

        <button
          onClick={() => window.history.back()}
          className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-white border-opacity-20 bg-zinc-900 text-white transition-all duration-300 hover:bg-opacity-5"
        >
          <GearSix size={28} />
        </button>
      </div>
    </>
  );
}
