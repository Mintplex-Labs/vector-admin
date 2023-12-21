import { FullScreenLoader } from '../../components/Preloader';
import useUser from '../../hooks/useUser';
import { useState, useEffect, memo } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import User from '../../models/user';
import paths from '../../utils/paths';
import AppLayout from '../../layout/AppLayout';
import { useParams } from 'react-router-dom';
import FragmentList from './FragmentList';
import Document from '../../models/document';
import System from '../../models/system';
import Organization from '../../models/organization';
import { APP_NAME } from '../../utils/constants';
import { CaretDown } from '@phosphor-icons/react';
import truncate from 'truncate';
import UploadDocumentModal from './UploadModal';
import UploadModalNoKey from './UploadModal/UploadModalNoKey';

export default function DocumentView() {
  const { user } = useUser();
  const { slug, workspaceSlug, documentId } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<{ slug: string }>(null);
  const [workspaces, setWorkspaces] = useState<object[]>([]);
  const [workspace, setWorkspace] = useState<object>([]);
  const [connector, setConnector] = useState<object | null | boolean>(false);

  const [document, setDocument] = useState<object | null>(null);
  const [canEdit, setCanEdit] = useState(false);
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

  useEffect(() => {
    async function fetchData() {
      if (!slug || !workspaceSlug || !documentId) return false;

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

      const document = await Document.get(documentId);
      const { exists: hasOpenAIKey } = await System.hasSetting(
        'open_ai_api_key'
      );
      fetchWorkspaces(focusedOrg);
      setDocument(document);
      setCanEdit(hasOpenAIKey);
      setLoading(false);
    }
    fetchData();
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
      headerNameProp="name"
      organizations={organizations}
      organization={organization}
      workspaces={workspaces}
      hasMoreWorkspaces={hasMoreWorkspaces}
      loadMoreWorkspaces={fetchWorkspaces}
      headerExtendedItems={
        <DocumentViewHeader
          organization={organization}
          workspace={workspace}
          document={document}
        />
      }
    >
      <div className="grid grid-cols-12">
        <div className="col-span-12 h-screen bg-main xl:col-span-12">
          <FragmentList
            connector={connector}
            document={document}
            canEdit={canEdit}
          />
        </div>
      </div>
      <CopyDocToModal
        document={document}
        workspace={workspace}
        workspaces={workspaces}
      />

      {canEdit ? (
        <UploadDocumentModal workspaces={workspaces} />
      ) : (
        <UploadModalNoKey />
      )}
    </AppLayout>
  );
}

function DocumentViewHeader({ organization, workspace, document }: any) {
  const { slug, workspaceSlug } = useParams();
  const deleteDocument = async () => {
    if (!document) return false;
    if (
      !confirm(
        'Are you sure you want to delete this document? This will remove the document from your vector database and remove it from the cache. This process cannot be undone.'
      )
    )
      return false;
    const success = await Document.delete(document.id);
    if (!success) return false;
    window.location.replace(paths.workspace(slug, workspaceSlug));
  };

  const cloneDocument = async () => {
    window.document
      .getElementById(`copy-document-${document.id}-modal`)
      ?.showModal();
  };

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
          <a
            href={paths.workspace(slug, workspaceSlug)}
            className="text-sky-400 hover:cursor-pointer hover:underline"
          >
            {truncate(workspace?.name, 20)}
          </a>
          <div className="text-sky-400" style={{ transform: 'rotate(270deg)' }}>
            <CaretDown weight="bold" />
          </div>
          <span className="text-white">{truncate(document?.name, 30)}</span>
        </div>
      </div>
      <div className="flex gap-x-3">
        <button
          onClick={cloneDocument}
          className="inline-flex h-11 w-[74px] flex-col items-center justify-center gap-2.5 rounded-lg bg-white bg-opacity-10 px-5 py-2.5 transition-all duration-300 hover:bg-opacity-5"
        >
          <div className="font-satoshi h-[25.53px] w-11 text-center text-base font-bold text-white">
            Clone
          </div>
        </button>
        <button
          onClick={deleteDocument}
          className="inline-flex h-11 w-[74px] flex-col items-center justify-center gap-2.5 rounded-lg border border-white border-opacity-20 px-3.5 py-2.5 transition-all duration-300 hover:bg-red-500"
        >
          <div className="font-satoshi h-[25.53px] w-[59px] text-center text-base font-bold text-white">
            Delete
          </div>
        </button>
      </div>
    </>
  );
}

const CopyDocToModal = memo(
  ({
    document,
    workspace,
    workspaces,
  }: {
    document: any;
    workspace: any;
    workspaces: any[];
  }) => {
    const { slug } = useParams();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState({
      show: false,
      success: false,
      error: null,
    });

    const copyToWorkspace = async (e: any) => {
      e.preventDefault();
      setResult({ show: false, success: false, error: null });
      setLoading(true);
      const form = new FormData(e.target);
      const toWorkspaceId = Number(form?.get('workspaceId')) || null;
      const { success, error } = await Document.clone(
        document.id,
        toWorkspaceId
      );
      setResult({ show: true, success, error });
      setLoading(false);
    };

    return (
      <dialog
        id={`copy-document-${document?.id}-modal`}
        className="w-1/2 rounded-lg outline-none"
        onClick={(event) => {
          event.target == event.currentTarget && event.currentTarget?.close();
        }}
      >
        <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
          <p className="text-lg font-semibold text-blue-600">
            Clone document to workspace
          </p>
          <p className="text-base text-slate-800">
            Select a target workspace and {APP_NAME} will clone it to that new
            workspace and update your vector database automatically. This will
            not incur an OpenAI embedding charge as we have already cached your
            embeddings.
          </p>
        </div>
        {result.show && (
          <>
            {result.success ? (
              <a
                href={paths.jobs({ slug })}
                className="my-2 w-full rounded-lg border-green-800 bg-green-50 px-4 py-2 text-lg text-green-800"
              >
                Document clone job created. View progress &rarr;
              </a>
            ) : (
              <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-lg text-red-800">
                {result.error}
              </p>
            )}
          </>
        )}
        <div className="my-2 flex w-full justify-center p-[20px]">
          <form onSubmit={copyToWorkspace} className="flex flex-col gap-y-1">
            <p className="my-2 text-sm text-gray-800">
              Clone {document?.name} and it's embeddings to...
            </p>
            <select
              name="workspaceId"
              className="rounded-lg bg-gray-50 px-4 py-2 text-2xl text-gray-800 outline-none"
            >
              {workspaces
                .filter((ws) => ws.id !== workspace.id)
                .map((ws: any) => {
                  return <option value={ws.id}>{ws.name}</option>;
                })}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="my-2 rounded-lg px-4 py-2 text-blue-800 hover:bg-blue-50"
            >
              {loading ? 'Cloning document...' : <>Clone &rarr;</>}
            </button>
          </form>
        </div>
      </dialog>
    );
  }
);
