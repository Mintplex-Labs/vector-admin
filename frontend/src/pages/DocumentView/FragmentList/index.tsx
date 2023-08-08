import { lazy, memo, useEffect, useState } from 'react';
import PreLoader from '../../../components/Preloader';
import Document from '../../../models/document';
import truncate from 'truncate';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import paths from '../../../utils/paths';
const DeleteEmbeddingConfirmation = lazy(
  () => import('./DeleteEmbeddingConfirmation')
);
const EditEmbeddingConfirmation = lazy(
  () => import('./EditEmbeddingConfirmation')
);

export default function FragmentList({
  document,
  canEdit,
}: {
  document: any;
  canEdit: boolean;
}) {
  const { slug, workspaceSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [fragments, setFragments] = useState([]);
  const [sourceDoc, setSourceDoc] = useState(null);
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

  useEffect(() => {
    async function getFragments() {
      if (!document?.id) return;
      const _fragments = await Document.fragments(document.id);
      const _src = await Document.source(document.id);
      setFragments(_fragments);
      setSourceDoc(_src);
      setLoading(false);
    }
    getFragments();
  }, [document]);

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

        <div className="px-6">
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
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

const Fragment = ({
  fragment,
  sourceDoc,
  canEdit,
}: {
  fragment: any;
  sourceDoc: any;
  canEdit: boolean;
}) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    async function fetchData() {
      if (!fragment || !sourceDoc) return;
      const _data = sourceDoc[fragment.vectorId];
      setData(_data);
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
          {truncate(data?.metadata?.text, 40)}
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
            <div className="h-[20px] w-[80px] animate-pulse rounded-md bg-slate-200" />
          )}
        </td>
        <td className="px-6 py-4">
          {moment.unix(fragment.lastUpdatedAt).fromNow()}
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
