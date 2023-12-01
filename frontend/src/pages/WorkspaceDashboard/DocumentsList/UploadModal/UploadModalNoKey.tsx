import { AlertTriangle } from 'react-feather';
import { APP_NAME } from '../../../../utils/constants';
import System from '../../../../models/system';

export default function UploadModalNoKey() {
  const updateSystemSetting = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const open_ai_api_key = form.get('open_ai_api_key');
    await System.updateSettings({ open_ai_api_key });
    window.location.reload();
  };

  return (
    <dialog
      id="upload-document-modal"
      className="w-1/2 rounded-lg"
      onClick={(event) =>
        event.target == event.currentTarget && event.currentTarget?.close()
      }
    >
      <div className="my-4 flex w-full flex-col gap-y-1 p-[20px]">
        <p className="text-lg font-semibold text-blue-600">
          Upload new document
        </p>
      </div>
      <div className="w-ful p-[20px]l my-2 flex">
        <div className="flex flex w-full flex-col items-center gap-y-2 rounded-lg border border-orange-800 bg-orange-50 px-4 py-2 text-orange-800">
          <div className="flex w-full items-center gap-x-2 text-lg">
            <AlertTriangle /> You cannot upload and embed documents without an
            OpenAI API Key.
          </div>
          <p>
            {APP_NAME} will automatically upload and embed your documents for
            you, but for this to happen we must have an OpenAI key set.
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
              This key will only be used for the embedding of documents you
              upload via {APP_NAME}.
            </p>
          </form>
        </div>
      </div>
    </dialog>
  );
}
