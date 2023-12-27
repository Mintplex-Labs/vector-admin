import paths from '../../../utils/paths';
import moment from 'moment';
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
                    <div className="font-satoshi text-xs font-bold tracking-tight text-sky-400">
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
