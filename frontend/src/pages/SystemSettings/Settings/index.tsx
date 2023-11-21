import { useState } from 'react';
import { APP_NAME } from '../../../utils/constants';
import System from '../../../models/system';
import { ExternalLink, Eye, EyeOff } from 'react-feather';
import paths from '../../../utils/paths';

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
        <DebugCredentials settings={settings} />
      </div>
    </div>
  );
}

function DebugCredentials({ settings }: { settings: {} }) {
  const [showPwd, setShowPwd] = useState(false);
  const getSetting = (label: string) => {
    return settings.find((setting) => setting.label === label);
  };

  return (
    <>
      <div className="my-4 h-[1px] w-full bg-gray-400" />
      <div className="flex w-full flex-col gap-y-2 rounded-lg border border-gray-500 bg-gray-100 p-4">
        <div className="flex flex-col">
          <p className="font-semibold text-gray-600">
            Database Debug Credentials
          </p>
          <p className="text-sm text-gray-600">
            Use these credentials to for direct application database access.
            <br />
            Changes done via the database admin UI will <b>not</b> impact
            connected vector databases.
            <br />
            These credentials will change over time. Do not store them.
            <br />
            Use with caution.
          </p>
        </div>

        <div className="relative w-1/3">
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            defaultValue={getSetting('debug_username')?.value}
            placeholder="db username"
            disabled={true}
          />
        </div>

        <div className="relative w-1/3">
          <input
            type={showPwd ? 'text' : 'password'}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            defaultValue={getSetting('debug_pwd')?.value}
            placeholder="db password"
            disabled={true}
          />
          <button
            onClick={() => {
              const newType = showPwd ? 'password' : 'text';
              setShowPwd(newType === 'text');
            }}
            type="button"
            className="absolute bottom-2.5 right-2.5 rounded-lg p-2 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-0"
          >
            {!showPwd ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="justify-left flex w-full items-center gap-4">
          <a
            href={paths.debug.vdbms()}
            target="_blank"
            className="flex items-center gap-x-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            Go to {APP_NAME} database manager
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </>
  );
}
