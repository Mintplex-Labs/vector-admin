import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect, memo } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import paths from '../../utils/paths';
import AppLayout from '../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import Organization from '../../models/organization';
import ConnectorCard from './Connector';
import ApiKeyCard from './ApiKey';
import Statistics from './Statistics';
import DocumentsList from './DocumentsList';
import Workspace from '../../models/workspace';
import { APP_NAME } from '../../utils/constants';
import { titleCase } from 'title-case';

export default function WorkspaceDashboard() {
  const { user } = useUser();
  const { slug, workspaceSlug } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [connector, setConnector] = useState<object | null | boolean>(false);
  const [workspaces, setWorkspaces] = useState<object[]>([]);
  const [workspace, setWorkspace] = useState<object[]>([]);
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
      const _workspaces = await Organization.workspaces(focusedOrg.slug);
      const _connector = await Organization.connector(focusedOrg.slug);

      setOrganizations(orgs);
      setOrganization(focusedOrg);
      setWorkspaces(_workspaces);
      setWorkspace(
        _workspaces?.find((ws: any) => ws.slug === workspaceSlug) || null
      );
      setConnector(_connector);
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
      headerExtendedItems={
        <div className="flex items-center gap-x-4">
          <button
            type="button"
            onClick={() =>
              document
                .getElementById(`clone-workspace-${workspace.id}-modal`)
                ?.showModal()
            }
            className="rounded-lg px-4 py-2 text-sm text-blue-400 hover:bg-blue-50 hover:text-blue-600"
          >
            Clone Workspace
          </button>
          <button
            onClick={deleteWorkspace}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            Delete Workspace
          </button>
        </div>
      }
    >
      {!!organization && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <ConnectorCard
            knownConnector={connector}
            organization={organization}
            workspace={workspace}
          />
          <ApiKeyCard organization={organization} />
        </div>
      )}

      <Statistics organization={organization} workspace={workspace} />
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <DocumentsList
            knownConnector={connector}
            organization={organization}
            workspace={workspace}
            workspaces={workspaces}
          />
        </div>
      </div>
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
      className="w-1/2 rounded-lg outline-none"
      onClick={(event) => {
        event.target == event.currentTarget && event.currentTarget?.close();
      }}
    >
      <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-semibold text-blue-600">Clone workspace</p>
        <p className="text-base text-slate-800">
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
              className="my-2 w-full rounded-lg border-green-800 bg-green-50 px-4 py-2 text-lg text-green-800"
            >
              Workspace clone job created. View progress &rarr;
            </a>
          ) : (
            <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-lg text-red-800">
              {result.error}
            </p>
          )}
        </>
      )}
      <div className="my-2 flex w-full justify-center p-[20px]">
        {!result.show || result.success === false ? (
          <form onSubmit={cloneWorkspace} className="flex flex-col gap-y-1">
            <p className="my-2 text-sm text-gray-800">
              Clone {workspace.name} and it's embeddings to...
            </p>
            <div className="mb-4.5">
              <input
                required={true}
                type="text"
                name="name"
                placeholder="Cloned workspace"
                autoComplete="off"
                defaultValue={`${titleCase(workspace.name)} Copy`}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="my-2 rounded-lg px-4 py-2 text-blue-800 hover:bg-blue-50"
            >
              {loading ? 'Cloning workspace...' : <>Clone Workspace &rarr;</>}
            </button>
          </form>
        ) : null}
      </div>
    </dialog>
  );
});
