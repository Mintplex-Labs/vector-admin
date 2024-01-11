import { memo, useState } from 'react';
import Document from '../../../../models/document';
import { Loader } from 'react-feather';

const DeleteEmbeddingConfirmation = memo(
  ({ data, fragment }: { data: any; fragment: any }) => {
    const [loading, setLoading] = useState(false);
    if (!data || !fragment) return null;

    const deleteEmbedding = async () => {
      setLoading(true);
      const { success } = await Document.deleteFragment(fragment.id);
      if (success) {
        document
          ?.getElementById(`embedding-row-${fragment.id}`)
          ?.classList.add('hidden');
        document?.getElementById(`${fragment.id}-delete-embedding`)?.close();
      }
      setLoading(false);
    };

    return (
      <dialog
        id={`${fragment.id}-delete-embedding`}
        className="w-1/3 rounded-xl border-2 border-white/20 bg-main shadow"
        onClick={(event) =>
          event.target === event.currentTarget && event.currentTarget?.close()
        }
      >
        {/* <div className="flex flex-col justify-center overflow-y-scroll rounded-sm bg-main p-[20px]">
          <div className="px-4 py-4">
            <h3 className="text-lg font-medium text-white">
              Delete this embedding?
            </h3>
            <p className="mt-4 text-sm text-white/60">
              Once you delete this embedding it will remove it from your
              connected Vector Database as well. This process is non-reversible
              and if you want to add it back will require you to manually insert
              it or re-embed the document.
            </p>
            <pre className="mx-4 w-full whitespace-pre-line rounded-lg bg-slate-100 font-mono">
              {data.metadata.text}
            </pre>
          </div>
          <div className="w-full px-6">
            <button
              type="button"
              disabled={loading}
              onClick={deleteEmbedding}
              className="mb-4 h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
            >
              {loading ? (
                <Loader className="animate-spin" />
              ) : (
                'Yes, delete this embedding'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById(`${fragment.id}-delete-embedding`)
                  ?.close();
              }}
              className="h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
            >
              Nevermind
            </button>
          </div>
        </div> */}

        <div className="my-4 flex w-full flex-col justify-center px-8">
          <h3 className="text-lg font-medium text-white">
            Delete this embedding?
          </h3>
          <p className="mt-4 text-sm text-white/60">
            Once you delete this embedding it will remove it from your connected
            Vector Database as well. This process is non-reversible and if you
            want to add it back will require you to manually insert it or
            re-embed the document.
          </p>
          <pre className="mt-4 whitespace-pre-line rounded-lg border-2 border-white/10 bg-main-2 p-4 font-mono text-white">
            {data.metadata.text}
          </pre>
        </div>
        <div className="w-full px-6">
          <button
            type="button"
            disabled={loading}
            onClick={deleteEmbedding}
            className="mb-4 h-11 w-full items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:bg-red-500 hover:text-white"
          >
            {loading ? (
              <Loader className="animate-spin" />
            ) : (
              'Yes, delete this embedding'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(`${fragment.id}-delete-embedding`)
                ?.close();
            }}
            className="mb-4 h-11 w-full items-center rounded-lg bg-transparent p-2 text-center text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-neutral-700"
          >
            Nevermind
          </button>
        </div>
      </dialog>
    );
  }
);

export default DeleteEmbeddingConfirmation;
