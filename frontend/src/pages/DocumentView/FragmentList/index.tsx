import { lazy, memo, useEffect, useState } from 'react';
import PreLoader from '../../../components/Preloader';
import Document from '../../../models/document';
import truncate from 'truncate';
import moment from 'moment';
import pluralize from 'pluralize';
import { useParams } from 'react-router-dom';
import paths from '../../../utils/paths';
import DocumentListPagination from '../../../components/DocumentPaginator';
import SearchView from './SearchView';
import MetadataEditor from './MetadataEditor';
const DeleteEmbeddingConfirmation = lazy(
  () => import('./DeleteEmbeddingConfirmation')
);
const EditEmbeddingConfirmation = lazy(
  () => import('./EditEmbeddingConfirmation')
);
const PAGE_SIZE = 10;

export default function FragmentList({
  connector,
  document,
  canEdit,
}: {
  connector: any;
  document: any;
  canEdit: boolean;
}) {
  const { slug, workspaceSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [fragments, setFragments] = useState([]);
  const [sourceDoc, setSourceDoc] = useState(null);
  const [totalFragments, setTotalFragments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalFragments / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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

  const getFragments = async (page = 1) => {
    if (!document?.id) return;
    setLoading(true);
    const { fragments: _fragments, totalFragments } = await Document.fragments(
      document.id,
      page,
      PAGE_SIZE
    );
    const vectorIds = _fragments.map((fragment) => fragment.vectorId);
    const metadataForIds = await Document.metadatas(document.id, vectorIds);

    setFragments(_fragments);
    setTotalFragments(totalFragments);
    setSourceDoc(metadataForIds);
    setLoading(false);
  };

  useEffect(() => {
    getFragments(currentPage);
  }, [document, currentPage]);

  return (
    <>
      <div className="col-span-12 flex-1 rounded-sm dark:border-strokedark dark:bg-boxdark xl:col-span-4">
        <div className="flex items-start justify-between">
          <div className="mb-6 flex flex-col gap-y-1 px-7.5 ">
            <div className="flex items-center gap-x-2">
              <h4 className="text-3xl font-semibold text-black dark:text-white">
                Embeddings Overview for Document #{document.id}
              </h4>
              <button
                type="button"
                onClick={() =>
                  window.document
                    .getElementById(`copy-document-${document.id}-modal`)
                    ?.showModal()
                }
                className="rounded-lg px-4 py-2 text-sm text-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                Clone Document
              </button>
              <button
                onClick={deleteDocument}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                Delete Document
              </button>
            </div>

            <p className="text-sm text-slate-500">{document?.name}</p>
          </div>
        </div>

        <SearchView
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          document={document}
          FragmentItem={Fragment}
          canEdit={canEdit}
        />
        <div hidden={searchMode} className="px-6">
          {loading ? (
            <div>
              <PreLoader />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Vector DB Id
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Text Chunk
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Metadata
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fragments.map((fragment) => {
                  return (
                    <Fragment
                      key={fragment.id}
                      fragment={fragment}
                      sourceDoc={sourceDoc}
                      canEdit={canEdit}
                      connector={connector}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!searchMode && (
          <DocumentListPagination
            pageCount={totalPages}
            currentPage={currentPage}
            gotoPage={handlePageChange}
          />
        )}
      </div>
    </>
  );
}

const Fragment = ({
  fragment,
  sourceDoc,
  canEdit,
  connector,
}: {
  fragment: any;
  sourceDoc: any;
  canEdit: boolean;
  connector: any;
}) => {
  const [data, setData] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!fragment || !sourceDoc) return;
      const _data = sourceDoc[fragment.vectorId];
      setData(_data);
      const _metadata = _data?.metadata || {};
      const { text: _, vectorId: __, ...validMetadata } = _metadata;
      setMetadata(validMetadata);
      setLoading(false);
    }
    fetchData();
  }, [fragment]);

  return (
    <>
      <tr
        id={`embedding-row-${fragment.id}`}
        className="border-b bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800"
      >
        <th
          scope="row"
          className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
        >
          {fragment.id}
        </th>
        <td className="px-6 py-4">{fragment.vectorId}</td>
        <td className="px-6 py-4">
          {data?.metadata?.text ? truncate(data?.metadata?.text, 40) : 'no text found.'}
          {!!data?.metadata?.text ? (
            <button
              className="text-blue-400"
              onClick={() => {
                document.getElementById(`${fragment.id}-text`)?.showModal();
              }}
            >
              See All
            </button>
          ) : (
            <>
              {loading ? (
                <div className="h-[20px] w-[80px] animate-pulse rounded-md bg-slate-200" />
              ) : (
                <p>no text found.</p>
              )}
            </>
          )}
        </td>
        <td className="px-6 py-4">
          {Object.keys(metadata).length > 0 ? (
            <button
              onClick={() => {
                document
                  .getElementById(`${fragment.id}-metadata-editor`)
                  ?.showModal();
              }}
              className="rounded-full bg-blue-200 px-2 py-[1px] text-center text-blue-700 hover:bg-blue-300"
            >
              +{Object.keys(metadata).length} metadata{' '}
              {pluralize('item', Object.keys(metadata).length)}
            </button>
          ) : (
            <>
              {loading ? (
                <div className="h-[20px] w-[80px] animate-pulse rounded-md bg-slate-200" />
              ) : (
                <button
                  onClick={() => {
                    document
                      .getElementById(`${fragment.id}-metadata-editor`)
                      ?.showModal();
                  }}
                  className="rounded-full bg-blue-200 px-2 py-[1px] text-center text-blue-700 hover:bg-blue-300"
                >
                  <p>none</p>
                </button>
              )}
            </>
          )}
        </td>
        <td className="px-6 py-4">
          {moment(fragment.lastUpdatedAt).fromNow()}
        </td>
        <td className="flex items-center gap-x-4 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(`${fragment.id}-edit-embedding`)
                ?.showModal();
            }}
            className="rounded-lg px-2 py-1 text-blue-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(`${fragment.id}-delete-embedding`)
                ?.showModal();
            }}
            className="rounded-lg px-2 py-1 text-red-400 transition-all duration-300 hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        </td>
      </tr>
      {!!data && !!fragment && (
        <FullTextWindow data={data} fragment={fragment} />
      )}
      {!!data && !!fragment && (
        <MetadataEditor
          data={data}
          fragment={fragment}
          connector={connector}
          canEdit={canEdit}
        />
      )}
      {!!data && !!fragment && (
        <DeleteEmbeddingConfirmation data={data} fragment={fragment} />
      )}
      {!!data && !!fragment && (
        <EditEmbeddingConfirmation
          data={data}
          fragment={fragment}
          canEdit={canEdit}
        />
      )}
    </>
  );
};

const FullTextWindow = memo(
  ({ data, fragment }: { data: any; fragment: any }) => {
    return (
      <dialog id={`${fragment.id}-text`} className="w-1/2 rounded-lg">
        <div className="flex flex-col overflow-y-scroll p-[20px]">
          <pre className="font-mono whitespace-pre-line rounded-lg bg-slate-100 p-2">
            {data?.metadata?.text ||
              '[ERROR] Could not parse text key from embedding'}
          </pre>
          <div className="mt-4 flex flex-col gap-y-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById(`${fragment.id}-text`)?.close();
              }}
              className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
            >
              Close Preview
            </button>
          </div>
        </div>
      </dialog>
    );
  }
);
