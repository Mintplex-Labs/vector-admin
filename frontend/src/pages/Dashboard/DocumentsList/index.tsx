import { Link } from 'react-router-dom';
import paths from '../../../utils/paths';
import moment from 'moment';
import { AlertOctagon, FileText } from 'react-feather';
// import { CodeBlock, vs2015 } from 'react-code-blocks';
import { useEffect, useState } from 'react';
import Organization from '../../../models/organization';
import truncate from 'truncate';
import System from '../../../models/system';
import UploadDocumentModal from './UploadModal';
import UploadModalNoKey from './UploadModal/UploadModalNoKey';
import DocumentListPagination from '../../../components/DocumentPaginator';
import useQuery from '../../../hooks/useQuery';

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

  useEffect(() => {
    async function getDocs(slug?: string) {
      if (!slug) return false;
      const response = await Organization.documents(slug, currentPage);
      const { exists: hasOpenAIKey } = await System.hasSetting(
        'open_ai_api_key'
      );

      console.log('response count', response.totalDocuments);
      console.log('response documents', response.documents);

      setTotalDocuments(response.totalDocuments);
      setDocuments(response.documents);
      setCanUpload(hasOpenAIKey);
      setLoading(false);
    }
    console.log('organization.slug', organization.slug);
    getDocs(organization.slug);
  }, [organization.slug, currentPage]);

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
              Documents {totalDocuments! > 0 ? `(${totalDocuments})` : ''}
            </h4>
          </div>
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
                        <a
                          href={paths.workspace(
                            organization.slug,
                            document.workspace.slug
                          )}
                          className="hover:text-blue-500 hover:underline"
                        >
                          <span className="font-medium">
                            {document.workspace.name || ''}
                          </span>
                        </a>
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
      </div>
      <DocumentListPagination
        pageCount={Math.ceil(totalDocuments! / Organization.documentPageSize)}
        currentPage={currentPage}
        gotoPage={updatePage}
      />
      {canUpload ? (
        <UploadDocumentModal workspaces={workspaces} />
      ) : (
        <UploadModalNoKey />
      )}
    </>
  );
}

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
