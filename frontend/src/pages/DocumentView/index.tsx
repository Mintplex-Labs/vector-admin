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
import InfiniteScroll from 'react-infinite-scroll-component';

export default function DocumentView() {
  const { user } = useUser();
  const { slug, workspaceSlug, documentId } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<object[]>([]);
  const [organization, setOrganization] = useState<object | null>(null);
  const [workspaces, setWorkspaces] = useState<object[]>([]);
  const [workspace, setWorkspace] = useState<object>([]);
  const [document, setDocument] = useState<object | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  async function userOrgs(loadMore = false) {
    if (!slug || !workspaceSlug || !documentId) return false;

    const orgs = await User.organizations();
    if (orgs.length === 0) {
      window.location.replace(paths.onboarding.orgName());
      return false;
    }

    const focusedOrg = orgs?.find((org: any) => org.slug === slug) || orgs?.[0];
    const _workspaces = loadMore
      ? [
          ...workspaces,
          ...(await Organization.workspaces(focusedOrg.slug, currentPage)),
        ]
      : await Organization.workspaces(focusedOrg.slug, currentPage);
    const _workspace =
      _workspaces?.find((ws: any) => ws.slug === workspaceSlug) || null;
    const document = await Document.get(documentId);
    const { exists: hasOpenAIKey } = await System.hasSetting('open_ai_api_key');

    setOrganizations(orgs);
    setOrganization(focusedOrg);
    setWorkspace(_workspace);
    setWorkspaces(_workspaces);
    setDocument(document);
    setCanEdit(hasOpenAIKey);
    setLoading(false);
    // increment page number
    setCurrentPage(currentPage + 1);
    // Check if we have less workspaces than page size, then no more workspaces to load
    if (_workspaces.length < Organization.workspacePageSize) {
      setHasMore(false);
    }
  }

  useEffect(() => {
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
      headerNameProp="name"
      organizations={organizations}
      organization={organization}
      workspaces={workspaces}
      hasMore={hasMore}
      userOrgs={() => userOrgs}
    >
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-12">
          <FragmentList document={document} canEdit={canEdit} />
        </div>
      </div>
      <CopyDocToModal
        document={document}
        workspace={workspace}
        workspaces={workspaces}
      />
    </AppLayout>
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
        id={`copy-document-${document.id}-modal`}
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
              Clone {document.name} and it's embeddings to...
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
