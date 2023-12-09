import { lazy, memo, useEffect, useState } from 'react';
import PreLoader from '../../../components/Preloader';
import Document from '../../../models/document';
import truncate from 'truncate';
import pluralize from 'pluralize';
import { useParams } from 'react-router-dom';
import paths from '../../../utils/paths';
import DocumentListPagination from '../../../components/DocumentPaginator';
import SearchView from './SearchView';
import MetadataEditor from './MetadataEditor';
import { Trash } from '@phosphor-icons/react';
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
      <div className="h-screen bg-main">
        <div className="">
          <div className="flex flex-col">
            <div className="mb-6 flex w-full items-center justify-between gap-x-12">
              <div className="ml-4 w-48 text-sm font-bold uppercase tracking-wide text-white">
                embeddings overview
              </div>
              <SearchView
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                document={document}
                FragmentItem={Fragment}
                canEdit={canEdit}
              />
            </div>
          </div>
        </div>

        <div
          hidden={searchMode}
          className="h-full flex-grow overflow-y-auto rounded-xl border-2 border-white/20 bg-main"
        >
          {loading ? (
            <div className="mt-48 flex h-full w-full justify-center">
              <PreLoader />
            </div>
          ) : (
            <table className="w-full rounded-xl text-left text-xs font-medium text-white text-opacity-80">
              <thead>
                <tr className="mt-10">
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    Vector ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    Text Chunk
                  </th>
                  <th
                    scope="col"
                    className="px-6 pb-2 pt-6 text-xs font-light text-white text-opacity-80"
                  >
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody>
                {fragments.map((fragment, index) => {
                  return (
                    <Fragment
                      key={fragment.id}
                      index={index}
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
        {/* {!searchMode && (
          <DocumentListPagination
            pageCount={totalPages}
            currentPage={currentPage}
            gotoPage={handlePageChange}
          />
        )} */}
      </div>
    </>
  );
}

const Fragment = ({
  fragment,
  sourceDoc,
  canEdit,
  connector,
  index,
}: {
  fragment: any;
  sourceDoc: any;
  canEdit: boolean;
  connector: any;
  index: number;
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
        className={`h-9 transition-all duration-300 ${
          index % 2 === 0 ? 'bg-main-2' : 'bg-main'
        }`}
      >
        <td className="px-6 text-sm font-bold text-white">
          {fragment.vectorId}
        </td>
        <td className="px-6 ">
          {truncate(data?.metadata?.text, 40)}
          {!!data?.metadata?.text ? (
            <button
              className="rounded-lg px-2 py-1 text-sky-400 transition-all duration-300 hover:text-opacity-80"
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
        <td className="px-6 ">
          {Object.keys(metadata)?.length > 0 ? (
            <button
              onClick={() =>
                document
                  .getElementById(`${fragment.id}-metadata-editor`)
                  ?.showModal()
              }
            >
              <div className="flex h-5 items-center justify-center rounded-[84px] bg-white bg-opacity-10 px-2 py-1 hover:opacity-75">
                <div className="text-[10px] text-white">
                  +{Object.keys(metadata).length}{' '}
                  {pluralize('item', Object.keys(metadata).length)}
                </div>
              </div>
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
                  className="flex h-5 items-center justify-center rounded-[84px] bg-white bg-opacity-10 px-2 py-1"
                >
                  <p className="text-[10px] text-white">none</p>
                </button>
              )}
            </>
          )}
        </td>
        <td>
          <div className="flex items-center gap-x-4 px-4">
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById(`${fragment.id}-edit-embedding`)
                  ?.showModal();
              }}
              className="rounded-lg px-2 py-1 text-sky-400 transition-all duration-300 hover:bg-blue-50"
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
              className="rounded-lg px-2 py-1 text-white transition-all duration-300 hover:bg-red-50 hover:text-red-600"
            >
              <Trash size={16} />
            </button>
          </div>
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
