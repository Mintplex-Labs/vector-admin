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
          className="min-w-[200px] max-w-[65%] rounded-xl border-2 border-white/20 bg-main shadow"
          onClick={(event) =>
            event.target == event.currentTarget && event.currentTarget?.close()
          }
        >
          <div className="w-full overflow-y-scroll rounded-sm p-[20px]">
            <div className="px-6.5 py-4">
              <p className="text-lg font-medium text-white">Edit embedding</p>
              <p className="text-sm text-white/60">
                You can edit your embedding chunk to be more inclusive of a
                chunk of text if it was split incorrectly or simply just to
                provide more context.
              </p>
            </div>
            <div className="flex w-full justify-center p-[20px]">
              <div className="npr flex flex-col items-center gap-y-2 rounded-lg px-4 py-2 text-white">
                <div className="my-4 flex flex-col items-center justify-center rounded-lg border border-red-500 p-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <p className="text-lg">
                    You cannot edit embeddings without an OpenAI API key set for
                    your instance.
                  </p>
                </div>
                <p>
                  {APP_NAME} currently only supports editing and changes of
                  embeddings using OpenAI text embedding. If you did not embed
                  this data originally using OpenAI you will be unable to use
                  this feature.
                </p>
                <form onSubmit={updateSystemSetting} className="w-full">
                  <div className="mb-4.5">
                    <label className="mb-2.5 block text-sm font-medium">
                      Your OpenAI API Key
                    </label>
                    <input
                      required={true}
                      type="password"
                      name="open_ai_api_key"
                      placeholder="sk-xxxxxxxxxx"
                      autoComplete="off"
                      className="w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-white p-2 font-medium text-main shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
                  >
                    Add OpenAI API Key
                  </button>
                </form>
              </div>
            </div>
          </div>
        </dialog>
      );
    }

    const debouncedTokenLengthCheck = debounce(checkTokenSize, 500);
    return (
      <dialog
        id={`${fragment.id}-edit-embedding`}
        className="min-w-[200px] max-w-[65%] rounded-xl border-2 border-white/20 bg-main shadow"
      >
        <div className="w-full overflow-y-scroll rounded-sm p-[20px]">
          <div className="px-6.5 py-4">
            <p className="text-lg font-medium text-white">Edit embedding</p>
            <p className="text-sm text-white/60">
              You can edit your embedding chunk to be more inclusive of a chunk
              of text if it was split incorrectly or simply just to provide more
              context.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="px-6.5">
            <div className="mb-4.5">
              <textarea
                ref={inputEl}
                onChange={debouncedTokenLengthCheck}
                name="embeddingText"
                defaultValue={data.metadata.text}
                spellCheck="true"
                className="w-full rounded-lg border border-white/10 bg-main-2 px-2.5 py-2 text-sm text-white"
              />
            </div>
            {loading ? (
              <div className="flex w-full justify-center">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-y-2">
                <button
                  type="submit"
                  disabled={!!error}
                  className="w-full rounded-lg bg-white p-2 font-medium text-main shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
                >
                  Update embedding
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(`${fragment.id}-edit-embedding`)
                      ?.close();
                  }}
                  className="w-full rounded-lg bg-transparent p-2 font-medium text-white transition-all duration-300 hover:bg-red-500/80 hover:bg-opacity-90 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </dialog>
    );
  }
);

export default EditEmbeddingConfirmation;
