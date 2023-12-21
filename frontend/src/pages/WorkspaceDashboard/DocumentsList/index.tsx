import { memo, useRef } from 'react';
import paths from '../../../utils/paths';
import moment from 'moment';
// import { CodeBlock, vs2015 } from 'react-code-blocks';
import { useEffect, useState } from 'react';
import truncate from 'truncate';
import Workspace from '../../../models/workspace';
import System from '../../../models/system';
import UploadDocumentModal from './UploadModal';
import UploadModalNoKey from './UploadModal/UploadModalNoKey';
import Document from '../../../models/document';
import useQuery from '../../../hooks/useQuery';
import { APP_NAME, ISearchTypes, SEARCH_MODES } from '../../../utils/constants';
import { useParams } from 'react-router-dom';
import DocumentListPagination from '../../../components/DocumentPaginator';
import SearchView from './SearchView';
import { File, Trash } from '@phosphor-icons/react';
import PreLoader from '../../../components/Preloader';

export default function DocumentsList({
  knownConnector,
  organization,
  workspace,
  workspaces,
}: {
  knownConnector: any;
  organization: any;
  workspace: any;
  workspaces: any[];
}) {
  const query = useQuery();
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [canUpload, setCanUpload] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(
    Number(query.get('docPage')) || 1
  );

  function updatePage(pgNum: number) {
    const setTo = pgNum <= 0 ? 1 : pgNum;
    query.set('docPage', setTo.toString());
    window.history.replaceState(
      {},
      '',
      `${location.pathname}?${query.toString()}`
    );
    setCurrentPage(setTo);
  }

  const deleteDocument = async (documentId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this document? This will remove the document from your vector database and remove it from the cache. This process cannot be undone.'
      )
    )
      return false;
    const success = await Document.delete(documentId);
    if (!success) return false;
    document.getElementById(`document-row-${documentId}`)?.remove();
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setSearchMode(true);
  };

  useEffect(() => {
    async function getDocs(orgSlug: string, wsSlug?: string) {
      if (!orgSlug || !wsSlug) return false;
      const response = await Workspace.documents(orgSlug, wsSlug, currentPage);
      const { exists: hasOpenAIKey } = await System.hasSetting(
        'open_ai_api_key'
      );

      setTotalDocuments(response.totalDocuments);
      setDocuments(response.documents);
      setCanUpload(hasOpenAIKey);
      setLoading(false);
    }
    getDocs(organization.slug, workspace.slug);
  }, [organization.slug, workspace.slug, currentPage]);

  if (loading) {
    return (
      <>
        <div
          className="flex h-screen flex-col overflow-hidden bg-main py-6 transition-all duration-300"
          style={{ height: `calc(100vh - ${searchMode ? '130px' : '130px'})` }}
        >
          <div className="flex items-start justify-between px-4">
            <div className="mb-6 flex items-center gap-x-6">
              <div className="flex items-center gap-x-1">
                <span className="font-['Plus Jakarta Sans'] text-sm font-bold uppercase leading-[18px] tracking-wide text-white">
                  Documents
                </span>
                <span className="font-['JetBrains Mono'] text-sm font-bold uppercase leading-[18px] tracking-wide text-white">
                  {' '}
                </span>
                <span className="font-['JetBrains Mono'] text-sm font-extrabold uppercase leading-[18px] tracking-wide text-white">
                  ({workspace?.documentCount})
                </span>
              </div>
              <SearchView
                searchMode={searchMode}
                organization={organization}
                workspace={workspace}
                workspaces={workspaces}
                stopSearching={() => setSearchMode(false)}
                deleteDocument={deleteDocument}
                setSearchMode={setSearchMode}
                handleSearchResults={handleSearchResults}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto rounded-xl border-2 border-white/20 bg-main">
            <table className="w-full rounded-xl text-left text-xs font-medium text-white text-opacity-80">
              <thead className="sticky top-0 w-full border-b-2 border-white/20 bg-main ">
                <tr className="mt-10">
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    Vectors
                  </th>
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    {' '}
                  </th>
                </tr>
              </thead>
            </table>

            <div className="-mt-10 flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-y-4 text-center">
                <PreLoader />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="mb-9 flex h-screen flex-col overflow-hidden bg-main py-6 transition-all duration-300"
        style={{ height: `calc(100vh - ${searchMode ? '210px' : '210px'})` }}
      >
        <div className="flex items-start items-center justify-between px-4">
          <div className="mb-6 flex items-center gap-x-6">
            <div className="flex items-center gap-x-1">
              <span className="font-['Plus Jakarta Sans'] text-sm font-bold uppercase leading-[18px] tracking-wide text-white">
                Documents
              </span>
              <span className="font-['JetBrains Mono'] text-sm font-bold uppercase leading-[18px] tracking-wide text-white">
                {' '}
              </span>
              <span className="font-['JetBrains Mono'] text-sm font-extrabold uppercase leading-[18px] tracking-wide text-white">
                ({workspace?.documentCount})
              </span>
            </div>
          </div>
          <SearchView
            searchMode={searchMode}
            organization={organization}
            workspace={workspace}
            stopSearching={() => setSearchMode(false)}
            setSearchMode={setSearchMode}
            handleSearchResults={handleSearchResults}
            setLoading={setLoading}
          />
        </div>

        <div className="flex-grow overflow-y-auto rounded-xl border-2 border-white/20 bg-main">
          <table className="w-full rounded-xl text-left text-xs font-medium text-white text-opacity-80">
            <thead className="sticky top-0 w-full border-b-2 border-white/20 bg-main ">
              <tr className="mt-10">
                <th
                  scope="col"
                  className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                >
                  Vectors
                </th>
                <th
                  scope="col"
                  className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                >
                  {' '}
                </th>
              </tr>
            </thead>
            {!searchMode && documents?.length > 0 && (
              <tbody className="bg-main">
                {documents.map((document, index) => (
                  <Fragment
                    key={document?.id}
                    document={document}
                    index={index}
                    deleteDocument={deleteDocument}
                    organization={organization}
                    workspace={workspace}
                    workspaces={workspaces}
                  />
                ))}
              </tbody>
            )}
            {searchMode && searchResults?.length > 0 && (
              <tbody className="bg-main">
                {searchResults.map((document, index) => (
                  <Fragment
                    key={document?.id}
                    document={document}
                    index={index}
                    deleteDocument={deleteDocument}
                    organization={organization}
                    workspace={workspace}
                    workspaces={workspaces}
                  />
                ))}
              </tbody>
            )}
          </table>

          {searchMode && searchResults?.length === 0 && (
            <div className="-mt-10 flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-y-4 text-center">
                <div className="text-center font-medium text-white text-opacity-40">
                  No documents found
                </div>
              </div>
            </div>
          )}

          {documents?.length === 0 && (
            <div className="-mt-10 flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-y-4 text-center">
                <div className="text-center font-medium text-white text-opacity-40">
                  0 Documents
                </div>
                <div className="text-center text-sm font-light text-white text-opacity-80">
                  Upload documents to your workspace
                </div>
                <button
                  onClick={() => {
                    window.document
                      ?.getElementById('upload-document-modal')
                      ?.showModal();
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2.5 rounded-lg bg-white p-2.5 px-36 shadow"
                >
                  <div className="text-center text-sm font-bold leading-tight text-zinc-900">
                    Upload Documents
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="pb-4">
        <DocumentListPagination
          pageCount={Math.ceil(totalDocuments! / Workspace.documentPageSize)}
          currentPage={currentPage}
          gotoPage={updatePage}
        />
      </div>
      {canUpload ? (
        <UploadDocumentModal workspace={workspace} />
      ) : (
        <UploadModalNoKey />
      )}
    </>
  );
}

const Fragment = ({
  document,
  index,
  deleteDocument,
  organization,
  workspace,
  workspaces,
}: {
  document: any;
  index: number;
  deleteDocument: any;
  organization: any;
  workspace: any;
  workspaces: any[];
}) => {
  return (
    <>
      <tr
        key={document?.id}
        id={`document-row-${document?.id}`}
        className={`h-9 hover:bg-white/10 ${
          index % 2 === 0 ? 'bg-main-2' : 'bg-main'
        }`}
      >
        <td className="flex items-center gap-x-1 px-6 py-2 text-sm font-light text-white">
          <File size={16} weight="fill" />
          <p>{truncate(document?.name, 35)}</p>
        </td>
        <td className="px-6 ">{moment(document?.createdAt).format('lll')}</td>
        <td className="px-6 ">Cached</td>
        <td className="px-6">
          <div className="flex items-center gap-x-4">
            <div className=" flex items-center gap-x-6">
              <button
                type="button"
                onClick={() =>
                  window.document
                    .getElementById(`copy-document-${document?.id}-modal`)
                    ?.showModal()
                }
                className="rounded-lg px-2 py-1 text-gray-400 transition-all duration-300 hover:bg-gray-50 hover:text-gray-600"
              >
                Clone
              </button>
              <a
                href={paths.document(
                  organization.slug,
                  workspace?.slug,
                  document?.id
                )}
                className="rounded-lg px-2 py-1 text-sky-400 transition-all duration-300 hover:bg-blue-50"
              >
                Details
              </a>
              <button
                type="button"
                onClick={() => deleteDocument(document?.id)}
                className="rounded-lg px-2 py-1 text-white transition-all duration-300 hover:bg-red-50 hover:text-red-600"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        </td>
      </tr>
      <CopyDocToModal
        key={`copy-document-${document?.id}`}
        document={document}
        workspace={workspace}
        workspaces={workspaces}
      />
    </>
  );
};

export const CopyDocToModal = memo(
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
