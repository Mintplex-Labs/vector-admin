import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect, memo } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import paths from '../../utils/paths';
import AppLayout from '../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import Organization from '../../models/organization';
import ApiKeyCard from './ApiKey';
import Statistics from './Statistics';
import DocumentsList from './DocumentsList';
import Workspace from '../../models/workspace';
import { APP_NAME } from '../../utils/constants';
import { titleCase } from 'title-case';
import { CaretDown } from '@phosphor-icons/react';
import truncate from 'truncate';

import ChromaLogo from '../../images/vectordbs/chroma.png';
import PineconeLogo from '../../images/vectordbs/pinecone-inverted.png';
import qDrantLogo from '../../images/vectordbs/qdrant.png';
import WeaviateLogo from '../../images/vectordbs/weaviate.png';

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

const UpdateConnectorModal = ({
  organization,
  connector,
  onUpdate,
}: {
  organization: any;
  connector: any;
  onUpdate: (newConnector: any) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(connector?.type);
  const [error, setError] = useState<null | string>(null);
  const [success, setSuccess] = useState<null | boolean>(false);
  const settings = JSON.parse(connector?.settings);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = { type };
    const form = new FormData(e.target);
    for (var [_k, value] of form.entries()) {
      if (_k.includes('::')) {
        const [_key, __key] = _k.split('::');
        if (!data.hasOwnProperty(_key)) data[_key] = {};
        data[_key][__key] = value;
      } else {
        data[_k] = value;
      }
    }

    const { connector, error } = await Organization.updateConnector(
      organization.slug,
      data
    );
    if (!connector) {
      setLoading(false);
      setError(error);
      return false;
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      onUpdate(connector);
      setSuccess(false);
    }, 1500);
  };

  return (
    <dialog
      id="edit-connector-modal"
      className="w-1/2 rounded-lg"
      onClick={(event) =>
        event.target == event.currentTarget && event.currentTarget?.close()
      }
    >
      <div className="rounded-sm bg-white p-[20px]">
        <div className="px-6.5 py-4">
          <h3 className="font-medium text-black dark:text-white">
            Update Vector Database Connection
          </h3>
          <p className="text-sm text-gray-500">
            {APP_NAME} is currently connected to a {connector?.type} vector
            database instance. You can update your configuration settings here
            if they have changed.
          </p>
        </div>
        {loading ? (
          <div className="px-6.5">
            <div className="mb-4.5 flex w-full justify-center">
              <PreLoader />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <ul className="mx-6 flex w-full flex-wrap gap-6">
              <li onClick={() => setType('chroma')} className="w-[250px]">
                <input
                  name="type"
                  type="checkbox"
                  value="chroma"
                  className="peer hidden"
                  checked={type === 'chroma'}
                  formNoValidate={true}
                />
                <label className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-5 text-gray-500 hover:bg-gray-50 hover:text-gray-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:peer-checked:text-gray-300">
                  <div className="block">
                    <img
                      src={ChromaLogo}
                      className="mb-2 h-10 w-10 rounded-full"
                    />
                    <div className="w-full text-lg font-semibold">Chroma</div>
                    <div className="flex w-full flex-col gap-y-1 text-sm">
                      <p className="text-xs text-slate-400">trychroma.com</p>
                      Open source vector database you can host yourself.
                    </div>
                  </div>
                </label>
              </li>
              <li onClick={() => setType('pinecone')} className="w-[250px]">
                <input
                  name="type"
                  type="checkbox"
                  value="pinecone"
                  className="peer hidden"
                  checked={type === 'pinecone'}
                  formNoValidate={true}
                />
                <label className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-5 text-gray-500 hover:bg-gray-50 hover:text-gray-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:peer-checked:text-gray-300">
                  <div className="block">
                    <img
                      src={PineconeLogo}
                      className="mb-2 h-10 w-10 rounded-full"
                    />
                    <div className="w-full text-lg font-semibold">Pinecone</div>
                    <div className="flex w-full flex-col gap-y-1 text-sm">
                      <p className="text-xs text-slate-400">pinecone.io</p>
                      Cloud-hosted vector database.
                    </div>
                  </div>
                </label>
              </li>
              <li onClick={() => setType('qdrant')} className="w-[250px]">
                <input
                  name="type"
                  type="checkbox"
                  value="qdrant"
                  className="peer hidden"
                  checked={type === 'qdrant'}
                  formNoValidate={true}
                />
                <label className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-5 text-gray-500 hover:bg-gray-50 hover:text-gray-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:peer-checked:text-gray-300">
                  <div className="block">
                    <img
                      src={qDrantLogo}
                      className="mb-2 h-10 w-10 rounded-full"
                    />
                    <div className="w-full text-lg font-semibold">qDrant</div>
                    <div className="flex w-full flex-col gap-y-1 text-sm">
                      <p className="text-xs text-slate-400">qdrant.tech</p>
                      Open-source & hosted vector database.
                    </div>
                  </div>
                </label>
              </li>
              <li onClick={() => setType('weaviate')} className="w-[250px]">
                <input
                  name="type"
                  type="checkbox"
                  value="weaviate"
                  className="peer hidden"
                  checked={type === 'weaviate'}
                  formNoValidate={true}
                />
                <label className="inline-flex h-full w-full cursor-pointer items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-5 text-gray-500 hover:bg-gray-50 hover:text-gray-600 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:peer-checked:text-gray-300">
                  <div className="block">
                    <img
                      src={WeaviateLogo}
                      className="mb-2 h-10 w-10 rounded-full"
                    />
                    <div className="w-full text-lg font-semibold">Weaviate</div>
                    <div className="flex w-full flex-col gap-y-1 text-sm">
                      <p className="text-xs text-slate-400">weaviate.io</p>
                      Open-source & hosted vector database.
                    </div>
                  </div>
                </label>
              </li>
            </ul>

            {type === 'chroma' && (
              <div className="mx-6 my-4 flex flex-col gap-y-6">
                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::instanceURL"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Instance URL
                    </label>
                    <p className="text-xs text-gray-500">
                      This is the URL your chroma instance is reachable at.
                    </p>
                  </div>
                  <input
                    name="settings::instanceURL"
                    autoComplete="off"
                    type="url"
                    defaultValue={settings.instanceURL}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="https://my-domain.com:8000"
                    required={true}
                  />
                </div>
                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::authToken"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      API Header & Key
                    </label>
                    <p className="text-xs text-gray-500">
                      If your hosted Chroma instance is protected by an API key
                      - enter the header and api key here.
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-x-4">
                    <input
                      name="settings::authTokenHeader"
                      autoComplete="off"
                      type="text"
                      defaultValue={settings.authTokenHeader}
                      className="block w-[20%] rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      placeholder="X-Api-Key"
                    />
                    <input
                      name="settings::authToken"
                      autoComplete="off"
                      type="password"
                      defaultValue={settings.authToken}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      placeholder="sk-myApiKeyToAccessMyChromaInstance"
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'pinecone' && (
              <div className="mx-6 my-4 flex flex-col gap-y-6">
                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::environment"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Pinecone Environment
                    </label>
                    <p className="text-xs text-gray-500">
                      You can find this on your Pinecone index.
                    </p>
                  </div>
                  <input
                    name="settings::environment"
                    autoComplete="off"
                    type="text"
                    defaultValue={settings.environment}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="us-west4-gcp-free"
                    required={true}
                  />
                </div>

                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::index"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Pinecone Index
                    </label>
                    <p className="text-xs text-gray-500">
                      You can find this on your Pinecone index.
                    </p>
                  </div>
                  <input
                    name="settings::index"
                    autoComplete="off"
                    type="text"
                    defaultValue={settings.index}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="my-index"
                    required={true}
                  />
                </div>

                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::apiKey"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      API Key
                    </label>
                    <p className="text-xs text-gray-500">
                      If your hosted Chroma instance is protected by an API key
                      - enter it here.
                    </p>
                  </div>
                  <input
                    name="settings::apiKey"
                    autoComplete="off"
                    type="password"
                    defaultValue={settings.apiKey}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="ee1051-xxxx-xxxx-xxxx"
                  />
                </div>
              </div>
            )}

            {type === 'qdrant' && (
              <div className="mx-6 my-4 flex flex-col gap-y-6">
                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::clusterUrl"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      qDrant Cluster URL
                    </label>
                    <p className="text-xs text-gray-500">
                      You can find this in your cloud hosted qDrant cluster or
                      just using the URL to your local docker container.
                    </p>
                  </div>
                  <input
                    name="settings::clusterUrl"
                    autoComplete="off"
                    type="url"
                    defaultValue={settings.clusterUrl}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="https://6b3a2d01-3b3f-4339-84e9-ead94f28a844.us-east-1-0.aws.cloud.qdrant.io"
                    required={true}
                  />
                </div>

                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::apiKey"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      API Key
                    </label>
                    <p className="text-xs text-gray-500">
                      (optional) If you are using qDrant cloud you will need an
                      API key.
                    </p>
                  </div>
                  <input
                    name="settings::apiKey"
                    autoComplete="off"
                    type="password"
                    defaultValue={settings.apiKey}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="ee1051-xxxx-xxxx-xxxx"
                  />
                </div>
              </div>
            )}

            {type === 'weaviate' && (
              <div className="mx-6 my-4 flex flex-col gap-y-6">
                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::clusterUrl"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Weaviate Cluster URL
                    </label>
                    <p className="text-xs text-gray-500">
                      You can find this in your cloud hosted Weaviate cluster or
                      just using the URL to your local docker container.
                    </p>
                  </div>
                  <input
                    name="settings::clusterUrl"
                    autoComplete="off"
                    type="url"
                    defaultValue={settings.clusterUrl}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="https://my-sandbox-b5vipdmw.weaviate.network"
                    required={true}
                  />
                </div>

                <div className="">
                  <div className="mb-2 flex flex-col gap-y-1">
                    <label
                      htmlFor="settings::apiKey"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      API Key
                    </label>
                    <p className="text-xs text-gray-500">
                      (optional) If you are using Weaviate cloud you will need
                      an API key.
                    </p>
                  </div>
                  <input
                    name="settings::apiKey"
                    autoComplete="off"
                    type="password"
                    defaultValue={settings.apiKey}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    placeholder="ee1051-xxxx-xxxx-xxxx"
                  />
                </div>
              </div>
            )}

            <div className="w-full px-6">
              {error && (
                <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-red-800">
                  {error}
                </p>
              )}
              {success && (
                <p className="my-2 w-full rounded-lg border-green-800 bg-green-50 px-4 py-2 text-green-800">
                  Connector changes saved
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg border border-blue-600 py-2 text-center text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                Connect to Vector Database
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};

const SyncConnectorModal = ({
  organization,
  connector,
}: {
  organization: any;
  connector: any;
}) => {
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const sync = async () => {
    setError(null);
    setLoading(true);
    const { job, error } = await Organization.syncConnector(
      organization.slug,
      connector.id
    );

    if (!job) {
      setError(error);
      setLoading(false);
      setSynced(false);
      return;
    }

    setLoading(false);
    setSynced(true);
  };

  return (
    <dialog
      id="sync-connector-modal"
      className="w-1/3 rounded-lg"
      onClick={(event) =>
        event.target == event.currentTarget && event.currentTarget?.close()
      }
    >
      <div className="overflow-y-scroll rounded-sm bg-white p-[20px]">
        <div className="px-6.5 py-4">
          <h3 className="font-medium text-black dark:text-white">
            Sync Vector Database Connection
          </h3>
          <p className="text-sm text-gray-500">
            {APP_NAME} can automatically sync existing information in your{' '}
            {titleCase(connector.type)}{' '}
            {connector?.type === 'chroma' ? 'collections' : 'namespaces'} so you
            can manage it more easily. This process can take a long time to
            complete depending on how much data you have embedded already.
            <br />
            <br />
            Once you start this process you can check on its progress in the{' '}
            <a
              href={paths.jobs(organization)}
              className="font-semibold text-blue-500"
            >
              job queue.
            </a>
          </p>
        </div>
        <div className="w-full px-6">
          {error && (
            <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-red-800">
              {error}
            </p>
          )}
          {synced ? (
            <button
              type="button"
              onClick={() => window.location.replace(paths.jobs(organization))}
              className="w-full rounded-lg py-2 text-center text-gray-600 hover:bg-gray-400 hover:text-white"
            >
              Check progress
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={sync}
              className="w-full rounded-lg bg-blue-600 py-2 text-center text-white"
            >
              {loading ? 'Synchronizing...' : 'Synchronize embeddings'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};

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
      logo = PineconeLogo;
  }

  return (
    <>
      <div className=" mr-10 w-full rounded-xl border-2 border-white/20 px-5 py-2 text-sky-400">
        <div className="flex items-center gap-x-2">
          <a
            href={paths.organization(organization)}
            className="text-sky-400 hover:cursor-pointer hover:underline"
          >
            {truncate(organization?.name, 20)}
          </a>
          <div className="text-sky-400" style={{ transform: 'rotate(270deg)' }}>
            <CaretDown weight="bold" />
          </div>
          <span className="text-white">{truncate(workspace?.name, 20)}</span>
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
