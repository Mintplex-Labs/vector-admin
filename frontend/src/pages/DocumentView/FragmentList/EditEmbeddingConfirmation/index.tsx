import { memo, useEffect, useRef, useState } from 'react';
import Document from '../../../../models/document';
import { AlertTriangle, Loader } from 'react-feather';
import { APP_NAME } from '../../../../utils/constants';
import System from '../../../../models/system';
import debounce from 'lodash/debounce';
import { validEmbedding, MAX_TOKENS } from '../../../../utils/tokenizer';
import { numberWithCommas } from '../../../../utils/numbers';

const EditEmbeddingConfirmation = memo(
  ({
    data,
    fragment,
    canEdit,
  }: {
    data: any;
    fragment: any;
    canEdit: boolean;
  }) => {
    const inputEl = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokenLength, setTokenLength] = useState<number>(
      validEmbedding(data?.metadata?.text).length || 0
    );

    const updateSystemSetting = async (e: any) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const open_ai_api_key = form.get('open_ai_api_key');
      await System.updateSettings({ open_ai_api_key });
      window.location.reload();
    };

    const checkTokenSize = (e: any) => {
      const { length, valid } = validEmbedding(e.target.value);
      setTokenLength(length);

      if (length === 0) {
        setError('Text cannot be empty.');
        return false;
      }
      valid ? setError(null) : setError('Text is too long to embed.');
      return valid;
    };
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      setLoading(true);
      const form = new FormData(e.target);
      const newText = form.get('embeddingText');
      const { success, error } = await Document.updateFragment(
        fragment.id,
        newText
      );
      if (success)
        document?.getElementById(`${fragment.id}-edit-embedding`)?.close();
      setError(error);
      setLoading(false);
    };

    useEffect(() => {
      function updateHeight(el: HTMLInputElement) {
        el.style.height = el.value.split('\n').length * 20 + 'px';
      }
      !!inputEl?.current && updateHeight(inputEl.current);
    }, []);

    if (!canEdit) {
      return (
        <dialog
          id={`${fragment.id}-edit-embedding`}
          className="w-1/2 rounded-lg"
          onClick={(event) =>
            event.target == event.currentTarget && event.currentTarget?.close()
          }
        >
          <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
            <p className="text-lg font-semibold text-blue-600">
              Edit embedding
            </p>
            <p className="text-sm text-slate-800">
              You can edit your embedding chunk to be more inclusive of a chunk
              of text if it was split incorrectly or simply just to provide more
              context.
            </p>
          </div>
          <div className="my-2 flex w-full p-[20px]">
            <div className="flex flex w-full flex-col items-center gap-y-2 rounded-lg border border-orange-800 bg-orange-50 px-4 py-2 text-orange-800">
              <div className="flex w-full items-center gap-x-2 text-lg">
                <AlertTriangle /> You cannot edit embeddings without an OpenAI
                API key set for your instance.
              </div>
              <p>
                {APP_NAME} currently only supports editing and changes of
                embeddings using OpenAI text embedding. If you did not embed
                this data originally using OpenAI you will be unable to use this
                feature.
              </p>
              <form onSubmit={updateSystemSetting} className="w-full">
                <div className="">
                  <div className="mb-4.5">
                    <label className="mb-2.5 block">Your OpenAI API Key</label>
                    <input
                      required={true}
                      type="password"
                      name="open_ai_api_key"
                      placeholder="sk-xxxxxxxxxx"
                      autoComplete="off"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-y-2">
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded bg-orange-500 p-3 font-medium text-white"
                    >
                      Add OpenAI API Key
                    </button>
                  </div>
                </div>
                <p className="my-2 p-2 text-center text-sm text-orange-800">
                  This key will only be used for the embedding of changes or
                  additions you make via {APP_NAME}.
                </p>
              </form>
            </div>
          </div>
          <pre className="font-mono whitespace-pre-line rounded-lg bg-slate-100 p-2">
            {data.metadata.text}
          </pre>
        </dialog>
      );
    }

    const debouncedTokenLengthCheck = debounce(checkTokenSize, 500);
    return (
      <dialog
        id={`${fragment.id}-edit-embedding`}
        className="w-1/2 rounded-lg"
        onClick={(event) =>
          event.target == event.currentTarget && event.currentTarget?.close()
        }
      >
        <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
          <p className="text-lg font-semibold text-blue-600">Edit embedding</p>
          <p className="text-sm text-slate-800">
            You can edit your embedding chunk to be more inclusive of a chunk of
            text if it was split incorrectly or simply just to provide more
            context.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex h-full w-full flex-col gap-y-1"
        >
          <div className="flex w-full items-center justify-between px-4">
            <p className="font-semibold text-red-600">{error || ''}</p>
            <p
              className={`text-sm ${
                error ? 'font-semibold text-red-600' : 'text-slate-600'
              }`}
            >
              {numberWithCommas(tokenLength)}/
              {numberWithCommas(MAX_TOKENS.cl100k_base)}{' '}
            </p>
          </div>
          <div className="flex max-h-[700px] w-full flex-col overflow-y-scroll px-4">
            <textarea
              ref={inputEl}
              onChange={debouncedTokenLengthCheck}
              name="embeddingText"
              defaultValue={data.metadata.text}
              spellCheck="true"
              className="font-mono h-fit w-full overflow-y-scroll rounded-lg bg-slate-100 p-2"
            />
            <div className="mt-4 flex flex-col gap-y-2">
              <button
                type="submit"
                disabled={loading || !!error}
                className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-blue-500 hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                {loading ? (
                  <Loader className="h-6 w-6 animate-spin" />
                ) : !!error ? (
                  error
                ) : (
                  'Update embedding'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById(`${fragment.id}-edit-embedding`)
                    ?.close();
                }}
                className="flex w-full justify-center rounded bg-transparent p-3 font-medium text-slate-500 hover:bg-slate-200"
              >
                Nevermind
              </button>
            </div>
          </div>
        </form>
      </dialog>
    );
  }
);

export default EditEmbeddingConfirmation;
