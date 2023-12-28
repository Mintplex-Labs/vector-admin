import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import paths from '../../utils/paths';
import AppLayout from '../../layout/AppLayout';
import { NavLink, useParams } from 'react-router-dom';
import Statistics from './Statistics';
import DocumentsList from './DocumentsList';
import Organization from '../../models/organization';
import truncate from 'truncate';

import ChromaLogo from '../../images/vectordbs/chroma.png';
import PineconeLogoInverted from '../../images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../images/vectordbs/weaviate.png';
import { GearSix, Prohibit } from '@phosphor-icons/react';
import QuickActionsSidebar from './QuickActionSidebar';
import { SyncConnectorModal } from '../../components/Modals/SyncConnectorModal';
import { UpdateConnectorModal } from '../../components/Modals/UpdateConnectorModal';
import NewConnectorModal from '../../components/Modals/NewConnectorModal';

export default function Dashboard() {
  const { slug } = useParams();
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<{ slug: string } | null>(
    null
  );
  const [connector, setConnector] = useState<object | null | boolean>(false);
  const [workspaces, setWorkspaces] = useState<object[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreWorkspaces, setHasMoreWorkspaces] = useState<boolean>(true);

  async function fetchWorkspaces(focusedOrg?: { slug: string }) {
    const org = focusedOrg || organization;
    if (!org) return false;

    const { workspaces: _workspaces, totalWorkspaces = 0 } =
      await Organization.workspaces(org.slug, currentPage);

    if (workspaces.length !== 0) {
      const _combinedWorkspaces = [...workspaces, ..._workspaces];
      const uniques = _combinedWorkspaces.filter(
        (obj, index) =>
          _combinedWorkspaces.findIndex((item) => item.slug === obj.slug) ===
          index
      );

      setWorkspaces(uniques);
      setHasMoreWorkspaces(uniques.length < totalWorkspaces);
    } else {
      setWorkspaces(_workspaces);
      setHasMoreWorkspaces(totalWorkspaces > Organization.workspacePageSize);
    }
    setCurrentPage(currentPage + 1);
    return true;
  }

  useEffect(() => {
    async function userOrgs() {
      const orgs = await User.organizations();
      if (orgs.length === 0) {
        window.location.replace(paths.onboarding.orgName());
        return false;
      }

      if (!slug) {
        window.location.replace(paths.organization(orgs?.[0]));
        return false;
      }

      const focusedOrg =
        orgs?.find((org: any) => org.slug === slug) || orgs?.[0];
      const _connector = await Organization.connector(focusedOrg.slug);

      fetchWorkspaces(focusedOrg);
      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setConnector(_connector);
      setLoading(false);
    }
    userOrgs();
  }, [user.uid, window.location.pathname]);

  if (loading || organizations.length === 0 || !organization) {
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
      workspaces={workspaces}
      hasMoreWorkspaces={hasMoreWorkspaces}
      loadMoreWorkspaces={fetchWorkspaces}
      headerExtendedItems={
        <OrganizationHeader
          organization={organization}
          workspace={workspaces?.[0]}
          connector={connector}
          deleteWorkspace={() => {}}
        />
      }
      hasQuickActions={true}
    >
      {!!organization && !!connector && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <UpdateConnectorModal
            organization={organization}
            connector={connector}
            onUpdate={(newConnector: any) => setConnector(newConnector)}
          />
          <SyncConnectorModal
            organization={organization}
            connector={connector}
          />
        </div>
      )}
      {!connector && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <NewConnectorModal
            organization={organization}
            onNew={() => window.location.reload()}
          />
        </div>
      )}
      <Statistics organization={organization} workspaces={workspaces} />
      <div className="mt-4 flex w-full">
        <div className="mr-6.5 w-full">
          <DocumentsList
            knownConnector={connector}
            organization={organization}
            workspaces={workspaces}
          />
        </div>
        <QuickActionsSidebar organization={organization} />
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
          <div className="font-satoshi h-[25.53px] w-11 text-center text-base font-bold text-white">
            Sync
          </div>
        </button>

        <NavLink
          className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-white border-opacity-20 text-white transition-all duration-300 hover:bg-opacity-5"
          to={paths.organizationSettings(organization)}
        >
          <GearSix size={28} />
        </NavLink>
      </div>
    </>
  );
}
