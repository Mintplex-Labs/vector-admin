import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect, memo } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import paths from '../../utils/paths';
import AppLayout from '../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import Organization from '../../models/organization';
import Statistics from './Statistics';
import DocumentsList from './DocumentsList';
import Workspace from '../../models/workspace';
import { APP_NAME } from '../../utils/constants';
import { titleCase } from 'title-case';
import { CaretDown } from '@phosphor-icons/react';
import truncate from 'truncate';

import ChromaLogo from '../../images/vectordbs/chroma.png';
import PineconeLogoInverted from '../../images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../images/vectordbs/weaviate.png';
import SyncConnectorModal from '../../components/Modals/SyncConnectorModal';
import { UpdateConnectorModal } from '../../components/Modals/UpdateConnectorModal';

export default function WorkspaceDashboard() {
  const { user } = useUser();
  const { slug, workspaceSlug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<{ slug: string } | null>(
    null
  );
  const [connector, setConnector] = useState<object | null | boolean>(false);
  const [workspaces, setWorkspaces] = useState<object[]>([]);
  const [workspace, setWorkspace] = useState<object[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreWorkspaces, setHasMoreWorkspaces] = useState<boolean>(true);

  async function fetchWorkspaces(focusedOrg?: { slug: string }) {
    const org = focusedOrg || organization;
    if (!org || !workspaceSlug) return false;

    const { workspaces: _workspaces, totalWorkspaces = 0 } =
      await Organization.workspaces(org.slug, currentPage, undefined, [
        workspaceSlug,
      ]);

    if (workspaces.length !== 0) {
      const _combinedWorkspaces = [...workspaces, ..._workspaces];
      const uniques = _combinedWorkspaces.filter(
        (obj, index) =>
          _combinedWorkspaces.findIndex((item) => item.slug === obj.slug) ===
          index
      );
      const _workspace =
        uniques?.find((ws: any) => ws.slug === workspaceSlug) || null;

      setWorkspace(_workspace);
      setWorkspaces(uniques);
      setHasMoreWorkspaces(uniques.length < totalWorkspaces);
    } else {
      const _workspace =
        _workspaces?.find((ws: any) => ws.slug === workspaceSlug) || null;

      setWorkspace(_workspace);
      setWorkspaces(_workspaces);
      setHasMoreWorkspaces(totalWorkspaces > Organization.workspacePageSize);
    }
    setCurrentPage(currentPage + 1);
    return true;
  }

  const deleteWorkspace = async () => {
    if (!workspace || !slug || !workspaceSlug) return false;
    if (
      !confirm(
        'Are you sure you want to delete this workspace? It will also delete the associated collection or namespace in the connected vector store as well as the vectors themselves. This process cannot be undone.'
      )
    )
      return false;
    await Workspace.delete(slug, workspaceSlug);
    window.location.replace(paths.organization({ slug }));
  };

  useEffect(() => {
    async function userOrgs() {
      if (!slug || !workspaceSlug) return false;

      const orgs = await User.organizations();
      if (orgs.length === 0) {
        window.location.replace(paths.onboarding.orgName());
        return false;
      }

      const focusedOrg =
        orgs?.find((org: any) => org.slug === slug) || orgs?.[0];
      const _connector = await Organization.connector(focusedOrg.slug);

      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setConnector(_connector);
      await fetchWorkspaces(focusedOrg);
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

  return (
    <AppLayout
      headerEntity={workspace}
      headerProp="uuid"
      organizations={organizations}
      organization={organization}
      workspaces={workspaces}
      hasMoreWorkspaces={hasMoreWorkspaces}
      loadMoreWorkspaces={fetchWorkspaces}
      headerExtendedItems={
        <WorkspaceViewHeader
          organization={organization}
          workspace={workspace}
          connector={connector}
          deleteWorkspace={deleteWorkspace}
        />
      }
    >
      <Statistics organization={organization} workspace={workspace} />
      {!!organization && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <SyncConnectorModal
            organization={organization}
            connector={connector}
          />
          <UpdateConnectorModal
            organization={organization}
            connector={connector}
            onUpdate={setConnector}
          />
        </div>
      )}

      <DocumentsList
        knownConnector={connector}
        organization={organization}
        workspace={workspace}
        workspaces={workspaces}
      />
      <CloneWorkspaceModal workspace={workspace} />
    </AppLayout>
  );
}

const CloneWorkspaceModal = memo(({ workspace }: { workspace: any }) => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    show: boolean;
    success: boolean;
    error: null | string;
  }>({
    show: false,
    success: false,
    error: null,
  });

  const cloneWorkspace = async (e: any) => {
    e.preventDefault();
    setResult({ show: false, success: false, error: null });
    setLoading(true);
    const form = new FormData(e.target);
    const newWsName = (form.get('name') as string) || null;
    if (!newWsName) {
      setLoading(false);
      setResult({
        show: true,
        success: false,
        error: 'New Workspace name is not valid.',
      });
      return;
    }

    const { success, error } = await Workspace.clone(
      slug as string,
      workspace.slug,
      newWsName
    );
    setResult({ show: true, success, error });
    setLoading(false);
  };

  return (
    <dialog
      id={`clone-workspace-${workspace.id}-modal`}
      className="w-1/2 rounded-xl border-2 border-white/20 bg-main shadow"
      onClick={(event) => {
        event.target == event.currentTarget && event.currentTarget?.close();
      }}
    >
      <div className="flex w-full flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-medium text-white">Clone workspace</p>
        <p className="text-sm text-white/60">
          This action will copy your entire workspace and current embeddings
          into a new workspace. This will automatically sync with your connected
          vector database. This action will not incur any OpenAI embedding
          charges as {APP_NAME} has already cached your embeddings.
        </p>
      </div>
      {result.show && (
        <>
          {result.success ? (
            <a
              href={paths.jobs({ slug })}
              className="mx-2 my-2 w-full rounded-lg bg-green-600/10 px-4 py-2 text-lg text-green-600"
            >
              Workspace clone job created. View progress &rarr;
            </a>
          ) : (
            <p className="my-2 w-full rounded-lg border-red-800 bg-red-600/10 px-4 py-2 text-lg text-red-600">
              {result.error}
            </p>
          )}
        </>
      )}
      <div className="my-2 flex w-full justify-center p-[20px]">
        {!result.show || result.success === false ? (
          <form onSubmit={cloneWorkspace} className="flex flex-col gap-y-1">
            <p className="my-2 text-sm text-white/60">
              Clone {workspace.name} and its embeddings to...
            </p>
            <div className="mb-4.5">
              <input
                required={true}
                type="text"
                name="name"
                placeholder="Cloned workspace"
                autoComplete="off"
                defaultValue={`${titleCase(workspace.name)} Copy`}
                className="placeholder-text-white/60 w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="my-2 w-full rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
            >
              {loading ? 'Cloning workspace...' : <>Clone Workspace &rarr;</>}
            </button>
          </form>
        ) : null}
      </div>
    </dialog>
  );
});

function WorkspaceViewHeader({
  organization,
  workspace,
  connector,
  deleteWorkspace,
}: any) {
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
    default:
      logo = PineconeLogoInverted;
  }

  return (
    <>
      <div className=" mr-10 w-full rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
        <div className="flex items-center gap-x-2 text-lg">
          <a
            href={paths.organization(organization)}
            className="text-sky-400 hover:cursor-pointer hover:underline"
          >
            {truncate(organization?.name, 20)}
          </a>
          <div className="text-sky-400" style={{ transform: 'rotate(270deg)' }}>
            <CaretDown weight="bold" />
          </div>
          <span className="text-lg font-medium text-white">
            {truncate(workspace?.name, 20)}
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
          <img src={logo} alt="Connector logo" className="h-full p-1" />
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
        <button
          onClick={() =>
            window.document
              ?.getElementById(`clone-workspace-${workspace.id}-modal`)
              ?.showModal()
          }
          className="inline-flex h-11 w-[74px] flex-col items-center justify-center gap-2.5 rounded-lg bg-white bg-opacity-10 px-5 py-2.5 transition-all duration-300 hover:bg-opacity-5"
        >
          <div className="font-satoshi h-[25.53px] w-11 text-center text-base font-bold text-white">
            Clone
          </div>
        </button>
        <button
          onClick={deleteWorkspace}
          className="inline-flex h-11 w-[74px] flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-white border-opacity-20 px-3.5 py-2.5 transition-all duration-300 hover:bg-red-500"
        >
          <div className="font-satoshi h-[25.53px] w-[59px] text-center text-base font-bold text-white">
            Delete
          </div>
        </button>
      </div>
    </>
  );
}
