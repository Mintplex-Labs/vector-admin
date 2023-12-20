import { Link } from 'react-router-dom';
import paths from '../../../utils/paths';
import moment from 'moment';
import { AlertOctagon, FileText } from 'react-feather';
import { useEffect, useState } from 'react';
import Organization from '../../../models/organization';
import truncate from 'truncate';
import System from '../../../models/system';
import UploadDocumentModal from './UploadModal';
import UploadModalNoKey from './UploadModal/UploadModalNoKey';
import DocumentListPagination from '../../../components/DocumentPaginator';
import useQuery from '../../../hooks/useQuery';
import Document from '../../../models/document';
import { File, Trash } from '@phosphor-icons/react';

export default function DocumentsList({
  organization,
  workspaces,
  knownConnector,
}: {
  organization: any;
  workspaces: any;
  knownConnector: any;
}) {
  const query = useQuery();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [canUpload, setCanUpload] = useState(false);
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

  useEffect(() => {
    async function getDocs(slug?: string) {
      if (!slug) return false;
      const response = await Organization.documents(slug, currentPage);
      const { exists: hasOpenAIKey } = await System.hasSetting(
        'open_ai_api_key'
      );

      setTotalDocuments(response.totalDocuments);
      setDocuments(response.documents);
      setCanUpload(hasOpenAIKey);
      setLoading(false);
    }
    getDocs(organization.slug);
  }, [organization.slug, currentPage]);

  if (loading) {
    return (
      <div
        className="mb-9 flex h-screen flex-col overflow-hidden bg-main py-6 transition-all duration-300"
        style={{ height: `calc(100vh - 210px` }}
      ></div>
    );
  }

  return (
    <>
      {/* <div className="flex-grow overflow-y-auto rounded-xl border-2 border-white/20 bg-main">
        <div className="flex items-start justify-between px-4">
          {workspaces.length > 0 ? (
            <>
              {!!knownConnector ? (
                <button
                  onClick={() => {
                    document
                      .getElementById('upload-document-modal')
                      ?.showModal();
                  }}
                  className="rounded-lg px-2 py-1 text-sm text-slate-800  hover:bg-slate-200"
                >
                  Add Document
                </button>
              ) : (
                <button
                  type="button"
                  disabled={true}
                  className="flex items-center gap-x-1 rounded-lg bg-red-50 px-2 py-1 text-sm text-red-800"
                >
                  <AlertOctagon className="h4- w-4" /> Requires Vector Database
                  Connection
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              disabled={true}
              className="flex items-center gap-x-1 rounded-lg bg-red-50 px-2 py-1 text-sm text-red-800"
            >
              <AlertOctagon className="h4- w-4" /> Requires Workspace
            </button>
          )}
        </div>
        {documents.length > 0 ? (
          <div>
            <div className="border-b border-stroke px-4 pb-5 dark:border-strokedark md:px-6 xl:px-7.5">
              <div className="flex items-center gap-3">
                <div className="w-2/12 xl:w-3/12">
                  <span className="font-medium">Document Name</span>
                </div>
                <div className="w-6/12 2xsm:w-5/12 md:w-3/12">
                  <span className="font-medium">Workspace</span>
                </div>
                <div className="hidden w-4/12 md:block xl:w-3/12">
                  <span className="font-medium">Date</span>
                </div>
                <div className="w-5/12 2xsm:w-4/12 md:w-3/12 xl:w-2/12">
                  <span className="font-medium">Vectors</span>
                </div>
                <div className="hidden w-2/12 text-center 2xsm:block md:w-1/12">
                  <span className="font-medium"></span>
                </div>
              </div>
            </div>

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
            <>
              {documents.map((document) => {
                return (
                  <div
                    id={`document-row-${document.id}`}
                    key={document.id}
                    className="flex w-full items-center gap-5 px-7.5 py-3 text-gray-600 hover:bg-gray-3 dark:hover:bg-meta-4"
                  >
                    <div className="flex w-full items-center gap-3">
                      <div className="w-2/12 xl:w-3/12">
                        <div className="flex items-center gap-x-1">
                          <FileText className="h-4 w-4" />
                          <span className="hidden font-medium xl:block">
                            {truncate(document.name, 20)}
                          </span>
                        </div>
                      </div>
                      <div className="w-6/12 2xsm:w-5/12 md:w-3/12">
                        <a
                          href={paths.workspace(
                            organization.slug,
                            document.workspace.slug
                          )}
                          className="hover:text-blue-500 hover:underline"
                        >
                          <span className="font-medium">
                            {truncate(document.workspace.name, 20) || ''}
                          </span>
                        </a>
                      </div>
                      <div className="hidden w-3/12 overflow-x-scroll md:block xl:w-3/12">
                        <span className="font-medium">
                          {moment(document.createdAt).format('lll')}
                        </span>
                      </div>
                      <div className="w-5/12 2xsm:w-4/12 md:w-3/12 xl:w-2/12">
                        <span className="inline-block rounded bg-green-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-green-500">
                          Cached
                        </span>
                      </div>

                      <div className=" flex items-center gap-x-2">
                        <a
                          href={paths.document(
                            organization.slug,
                            document.workspace.slug,
                            document.id
                          )}
                          className="rounded-lg px-2 py-1 text-blue-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Details
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          </div>
        ) : (
          <div>
            <div className="flex min-h-[40vh] w-full px-8">
              <div className="flex flex h-auto w-full flex-col items-center justify-center gap-y-2 rounded-lg bg-slate-50">
                <p>You have no documents in any workspaces!</p>
                <p>
                  Get started managing documents by adding them to workspaces
                  via the UI or code.
                </p>
                <button
                  type="button"
                  className="text-xl text-blue-500 underline"
                >
                  Show code example (coming soon)
                </button>
              </div>
            </div>
          </div>
        )}
      </div> */}
      <div
        className="mb-9 flex h-screen flex-col overflow-hidden bg-main transition-all duration-300"
        style={{ height: `calc(100vh -  160px)` }}
      >
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
                  Workspace
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
                <th
                  hidden={workspaces.length === 0}
                  scope="col"
                  className="relative px-6 pb-2 pt-6"
                >
                  <button
                    onClick={() => {
                      document
                        .getElementById('upload-document-modal')
                        ?.showModal();
                    }}
                    className="inline-flex h-[26px] w-[98px] items-center justify-center gap-2.5 rounded-[100px] bg-white bg-opacity-10 px-2.5 py-1"
                  >
                    <div className="font-['Satoshi'] text-xs font-black tracking-tight text-sky-400">
                      UPLOAD
                    </div>
                  </button>
                </th>
              </tr>
            </thead>
            {documents?.length > 0 && (
              <tbody className="bg-main">
                {documents.map((document, index) => (
                  <Fragment
                    key={document?.id}
                    document={document}
                    index={index}
                    deleteDocument={deleteDocument}
                    organization={organization}
                  />
                ))}
              </tbody>
            )}
          </table>

          {!!!knownConnector && (
            <div className="-mt-10 flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-y-4 text-center">
                <div className="text-center font-medium text-white text-opacity-40">
                  Connect a Vector Database to get started
                </div>
                <div className="text-center text-sm font-light text-white text-opacity-80">
                  Begin by connecting a Vector Database to your organization
                </div>
                <button
                  onClick={() => {
                    window.document
                      ?.getElementById('new-connector-modal')
                      ?.showModal();
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2.5 rounded-lg bg-white p-2.5 px-36 shadow"
                >
                  <div className="text-center text-sm font-bold leading-tight text-zinc-900">
                    Connect Vector Database
                  </div>
                </button>
              </div>
            </div>
          )}

          {!!knownConnector && workspaces?.length === 0 && (
            <div className="-mt-10 flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-y-4 text-center">
                <div className="text-center font-medium text-white text-opacity-40">
                  Create a workspace to get started
                </div>
                <div className="text-center text-sm font-light text-white text-opacity-80">
                  Workspaces are used to organize your documents
                </div>
                <button
                  onClick={() => {
                    window.document
                      ?.getElementById('workspace-creation-modal')
                      ?.showModal();
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2.5 rounded-lg bg-white p-2.5 px-36 shadow"
                >
                  <div className="text-center text-sm font-bold leading-tight text-zinc-900">
                    Create Workspace
                  </div>
                </button>
              </div>
            </div>
          )}

          {documents?.length === 0 && workspaces?.length > 0 && (
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

        <div className="pt-20">
          <DocumentListPagination
            pageCount={Math.ceil(
              totalDocuments! / Organization.documentPageSize
            )}
            currentPage={currentPage}
            gotoPage={updatePage}
          />
        </div>
        {canUpload ? (
          <UploadDocumentModal workspaces={workspaces} />
        ) : (
          <UploadModalNoKey />
        )}
      </div>
    </>
  );
}

const Fragment = ({
  document,
  index,
  deleteDocument,
  organization,
}: {
  document: any;
  index: number;
  deleteDocument: any;
  organization: any;
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
          <File className="flex-shrink-0" size={16} weight="fill" />
          <p>{truncate(document?.name, 35)}</p>
        </td>
        <td className="px-6 ">
          <a
            href={paths.workspace(organization.slug, document.workspace.slug)}
            className="hover:text-sky-400 hover:underline"
          >
            <span className="font-medium">
              {truncate(document.workspace.name, 20) || ''}
            </span>
          </a>
        </td>
        <td className="px-6 ">{moment(document?.createdAt).format('lll')}</td>
        <td className="px-6 ">Cached</td>
        <td className="px-6 ">
          <a
            href={paths.document(
              organization.slug,
              document.workspace.slug,
              document.id
            )}
            className="rounded-lg px-2 py-1 text-sky-400 transition-all duration-300 hover:bg-blue-50"
          >
            Details
          </a>
        </td>
        <td className="px-6">
          <div className="flex items-center gap-x-4">
            <div className=" flex items-center gap-x-6">
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
    </>
  );
};
