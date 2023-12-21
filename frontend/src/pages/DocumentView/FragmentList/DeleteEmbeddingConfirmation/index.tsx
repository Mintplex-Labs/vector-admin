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
        className="w-1/2 rounded-lg"
      >
        <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
          <p className="text-lg font-semibold text-red-600">
            Delete this embedding?
          </p>
          <p className="text-sm text-slate-800">
            Once you delete this embedding it will remove it from your connected
            Vector Database as well. This process is non-reversible and if you
            want to add it back will require you to manually insert it or
            re-embed the document.
          </p>
        </div>
        <div className="flex w-full flex-col overflow-y-scroll px-4">
          <pre className="w-full whitespace-pre-line rounded-lg bg-slate-100 p-2 font-mono">
            {data.metadata.text}
          </pre>
          <div className="mt-4 flex flex-col gap-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={deleteEmbedding}
              className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-red-500 hover:bg-red-200 disabled:bg-red-200"
            >
              {loading ? (
                <Loader className="h-6 w-6 animate-spin" />
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
              className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
            >
              Nevermind
            </button>
          </div>
        </div>
      </dialog>
    );
  }
);

export default DeleteEmbeddingConfirmation;
