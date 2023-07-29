import { memo } from 'react';
import paths from '../../../utils/paths';
import moment from 'moment';
import { AlertOctagon, FileText } from 'react-feather';
// import { CodeBlock, vs2015 } from 'react-code-blocks';
import { useEffect, useState } from 'react';
import truncate from 'truncate';
import Workspace from '../../../models/workspace';
import System from '../../../models/system';
import UploadDocumentModal from './UploadModal';
import UploadModalNoKey from './UploadModal/UploadModalNoKey';
import Document from '../../../models/document';
import useQuery from '../../../hooks/useQuery';
import { APP_NAME } from '../../../utils/constants';
import { useParams } from 'react-router-dom';
import DocumentListPagination from '../../../components/DocumentPaginator';

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
  }, [organization.slug, workspace.slug]);

  if (loading) {
    return (
      <div className="col-span-12 flex-1 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
        <div className="flex items-start justify-between px-4">
          <div>
            <h4 className="mb-6 px-4 text-xl font-semibold text-black dark:text-white">
              Documents {documents.length > 0 ? `(${documents.length})` : ''}
            </h4>
          </div>
        </div>
        <div className="flex h-60 w-full items-center justify-center px-7.5">
          <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="col-span-12 flex-1 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
        <div className="flex items-start justify-between px-4">
          <div>
            <h4 className="mb-6 px-4 text-xl font-semibold text-black dark:text-white">
              Documents {documents.length > 0 ? `(${documents.length})` : ''}
            </h4>
          </div>
          {!!knownConnector ? (
            <button
              onClick={() => {
                document.getElementById('upload-document-modal')?.showModal();
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
                  <span className="font-medium">Created</span>
                </div>
                <div className="w-5/12 2xsm:w-4/12 md:w-3/12 xl:w-2/12">
                  <span className="font-medium">Status</span>
                </div>
                <div className="hidden w-2/12 text-center 2xsm:block md:w-1/12">
                  <span className="font-medium"></span>
                </div>
              </div>
            </div>
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
                        <span className="font-medium">
                          {document.workspace.name || ''}
                        </span>
                      </div>
                      <div className="hidden w-3/12 overflow-x-scroll md:block xl:w-3/12">
                        <span className="font-medium">
                          {moment.unix(document.createdAt).format('lll')}
                        </span>
                      </div>
                      <div className="w-5/12 2xsm:w-4/12 md:w-3/12 xl:w-2/12">
                        <span className="inline-block rounded bg-green-500 bg-opacity-25 px-2.5 py-0.5 text-sm font-medium text-green-500">
                          Cached
                        </span>
                      </div>

                      <div className=" flex items-center gap-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            window.document
                              .getElementById(
                                `copy-document-${document.id}-modal`
                              )
                              ?.showModal()
                          }
                          className="rounded-lg px-2 py-1 text-gray-400 transition-all duration-300 hover:bg-gray-50 hover:text-gray-600"
                        >
                          Clone
                        </button>
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
                        <button
                          type="button"
                          onClick={() => deleteDocument(document.id)}
                          className="rounded-lg px-2 py-1 text-red-400 transition-all duration-300 hover:bg-red-50 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <CopyDocToModal
                      key={`copy-document-${document.id}`}
                      document={document}
                      workspace={workspace}
                      workspaces={workspaces}
                    />
                  </div>
                );
              })}
            </>
          </div>
        ) : (
          <>
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
            {/* <CodeExampleModal organization={organization} /> */}
          </>
        )}
      </div>
      <DocumentListPagination
        pageCount={Math.ceil(totalDocuments! / Workspace.documentPageSize)}
        currentPage={currentPage}
        gotoPage={updatePage}
      />
      {canUpload ? (
        <UploadDocumentModal workspace={workspace} />
      ) : (
        <UploadModalNoKey />
      )}
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

// const CodeExampleModal = ({ organization }: { organization: any }) => {
//   // Rework this to be an upload modal.
//   return (
//     <dialog id="document-code-modal" className="w-1/2 rounded-lg">
//       <div className="rounded-sm bg-white dark:border-strokedark dark:bg-boxdark">
//         <div className="px-6.5 py-4 dark:border-strokedark">
//           <h3 className="font-medium text-black dark:text-white">
//             Adding documents to Conifer
//           </h3>
//           <p className="text-sm text-gray-500">
//             You can begin managing documents with the code you have already
//             written. Our library currently only supports NodeJS environments.
//           </p>
//         </div>

//         <p className="my-2 rounded-lg border border-orange-800 bg-orange-100 p-2 text-center text-sm text-orange-800">
//           During the Pinecone Hackathon the library is a standalone fork of
//           langchainJS, but ideally it would eventually be live in the main
//           LangchainJS repo :)
//           <br />
//           We werent able to add uploading or deleting docs via the UI but how
//           cool would that be. It can be done via the library though.
//         </p>

//         <div className="max-h-[50vh] w-full overflow-y-scroll bg-slate-50">
//           <CodeBlock
//             theme={vs2015}
//             text={`/* How to sync documents to Pinecone and Conifer with LangchainJS
// Be sure you have the correct packages installed!
// example: package.json
// {
//   "dependencies": {
//     "@mintplex-labs/langchain": "https://gitpkg.now.sh/Mintplex-Labs/langchainjs/langchain?conifer",
//     ...other deps
// }
// */

// // Now write code as you usually would!
// import { PineconeClient } from "@pinecone-database/pinecone";
// import { PineconeStore } from "@mintplex-labs/langchain/dist/vectorstores/pinecone.js"
// import { ConiferVDBMS } from "@mintplex-labs/langchain/dist/vdbms/conifer.js"
// import { OpenAIEmbeddings } from "langchain/embeddings/openai";

// const client = new PineconeClient();
// await client.init({
//   apiKey: 'my-pinecone-api-key',
//   environment: 'us-central-gcp',
// });

// const pineconeIndex = client.Index('hackathon');
// const coniferInstance = new ConiferVDBMS({
//   orgId: '${organization.orgId}',
//   workspaceId: 'workspace-xxxx', // Get from workspace page.
//   apiKey: 'ck-xxx' // Get from the api key at the top of the page.
// })

// // Split documents with LangChain text splitter as you normally would

// await PineconeStore.fromDocumentsVerbose(
//   documents,
//   new OpenAIEmbeddings({ openAIApiKey: 'sk-xxxxxxxx' }),
//   {
//     pineconeIndex,
//     namespace:' testing-collection',
//   },
//   coniferInstance
// )

// // Documents will now exist in Conifer!
// // More CRUD methods available at ${window.location.origin}/api-docs
// `}
//             language="javascript"
//             showLineNumbers={false}
//           />
//         </div>

//         <div className="mt-4 flex flex-col gap-y-2">
//           <button
//             type="button"
//             onClick={() => {
//               document.getElementById('document-code-modal')?.close();
//             }}
//             className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
//           >
//             Close Preview
//           </button>
//         </div>
//       </div>
//     </dialog>
//   );
// };
