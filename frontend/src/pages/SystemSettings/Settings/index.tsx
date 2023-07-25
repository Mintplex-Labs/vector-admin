import { memo, useState } from 'react';
import moment from 'moment';
import { APP_NAME } from '../../../utils/constants';
import System from '../../../models/system';

export default function Settings({ settings }: { settings: any[] }) {
  const [result, setResult] = useState<{
    show: boolean;
    success: boolean;
    error: null | string;
  }>({ show: false, success: false, error: null });
  const getSetting = (label: string) => {
    return settings.find((setting) => setting.label === label);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setResult({ show: false, success: false, error: null });
    const form = new FormData(e.target);
    const data = {
      allow_account_creation: form.get('allow_account_creation') === 'yes',
      account_creation_domain_scope:
        form.get('account_creation_domain_scope') || null,
    };
    if (!form.get('open_ai_api_key')?.includes('*'))
      data.open_ai_api_key = form.get('open_ai_api_key') || null;

    const { success, error } = await System.updateSettings(data);
    setResult({ show: true, success, error });
  };

  return (
    <div className="col-span-12 flex-1 rounded-sm bg-white pb-6 xl:col-span-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="mb-6 px-7.5 text-3xl font-semibold text-black dark:text-white">
            System Settings
          </h4>
        </div>
      </div>

      <div className="px-6">
        {result.show && (
          <>
            {result.success ? (
              <p className="my-2 w-full rounded-lg border-green-800 bg-green-50 px-4 py-2 text-lg text-green-800">
                Settings updated successfully.
              </p>
            ) : (
              <p className="my-2 w-full rounded-lg border-red-800 bg-red-50 px-4 py-2 text-lg text-red-800">
                {result.error}
              </p>
            )}
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="my-4">
            <label className=" block flex items-center gap-x-1 font-medium text-black dark:text-white">
              Allow account creation
            </label>
            <p className="mb-2.5 text-sm text-slate-600">
              Allow anyone to create an account from the new account sign up
              page. If disabled only an admin can create new accounts.
            </p>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="allow_account_creation"
                value="yes"
                className="peer sr-only"
                defaultChecked={
                  getSetting('allow_account_creation')?.value === 'true'
                }
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"></span>
            </label>
          </div>

          <div className="my-4">
            <label className=" block flex items-center gap-x-1 font-medium text-black dark:text-white">
              Account domain restriction
            </label>
            <p className="mb-2.5 text-sm text-slate-600">
              force all accounts created to have emails ending in
              @yourdomain.com
            </p>
            <div className="relative">
              <input
                type="text"
                name="account_creation_domain_scope"
                placeholder="yourdomain.xyz"
                defaultValue={
                  getSetting('account_creation_domain_scope')?.value
                }
                className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="my-4">
            <label className=" block flex items-center gap-x-1 font-medium text-black dark:text-white">
              OpenAI API Key
            </label>
            <p className="mb-2.5 text-sm text-slate-600">
              Required only if you will be updating or uploading new documents
              or embeddings via {APP_NAME}.
            </p>
            <div className="relative">
              <input
                type="password"
                name="open_ai_api_key"
                placeholder="sk-xxxxxxxx"
                defaultValue={getSetting('open_ai_api_key')?.value}
                className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-5">
            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
