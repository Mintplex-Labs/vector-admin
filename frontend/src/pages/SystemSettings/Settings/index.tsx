import { useState } from 'react';
import { APP_NAME } from '../../../utils/constants';
import System from '../../../models/system';
import paths from '../../../utils/paths';
import {
  CaretDown,
  EyeSlash,
  Eye,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import showToast from '../../../utils/toast';

export default function Settings({ settings }: { settings: any[] }) {
  const [hasChanges, setHasChanges] = useState(false);

  const getSetting = (label: string) => {
    return settings.find((setting) => setting.label === label);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      allow_account_creation: form.get('allow_account_creation') === 'yes',
      account_creation_domain_scope:
        form.get('account_creation_domain_scope') || null,
    };
    if (!form.get('open_ai_api_key')?.includes('*'))
      data.open_ai_api_key = form.get('open_ai_api_key') || null;

    const { success, error } = await System.updateSettings(data);

    if (success) {
      showToast('Settings updated successfully', 'success');
      setHasChanges(false);
    } else {
      showToast(`Error updating settings: ${error}`, 'error');
    }
  };

  return (
    <>
      <div className="col-span-12 -mt-18 h-screen flex-1 rounded-sm xl:col-span-4">
        <div className="flex items-start justify-between">
          <div className="mb-6 flex flex-col gap-y-1 px-7.5 ">
            <div className="flex items-center gap-x-2">
              <div className="-mt-10 flex items-center gap-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex h-[34px] w-[34px] rotate-90 items-center justify-center rounded-full border border-transparent  bg-zinc-900 text-white transition-all duration-300 hover:border-white/20 hover:bg-opacity-5 hover:text-white"
                >
                  <CaretDown weight="bold" size={18} />
                </button>
                <div className="z-10 text-lg font-medium text-white">
                  System Settings
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6">
          <form onSubmit={handleSubmit}>
            <div className="my-4 flex flex-col gap-y-2 border-b border-white/20 pb-4">
              <label className="text-sm font-medium text-white">
                Allow account creation
              </label>
              <span className="text-sm text-white/60">
                Allow anyone to create an account from the new account sign up
                page. If disabled only an admin can create new accounts.
              </span>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  onChange={() => setHasChanges(true)}
                  type="checkbox"
                  name="allow_account_creation"
                  value="yes"
                  className="peer sr-only"
                  defaultChecked={
                    getSetting('allow_account_creation')?.value === 'true'
                  }
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/10 after:bg-white/60 after:transition-all after:content-[''] peer-checked:bg-sky-400 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"></span>
              </label>
            </div>

            <div className="my-4 flex flex-col gap-y-2 border-b border-white/20 pb-4">
              <label className="text-sm font-medium text-white">
                Account domain restriction
              </label>
              <p className="text-sm text-white/60">
                Force all accounts created to have emails ending in
                @yourdomain.com
              </p>
              <div className="relative">
                <input
                  onChange={() => setHasChanges(true)}
                  type="text"
                  name="account_creation_domain_scope"
                  placeholder="yourdomain.xyz"
                  defaultValue={
                    getSetting('account_creation_domain_scope')?.value
                  }
                  className="mt-2 inline-flex h-11 w-[210px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                />
              </div>
            </div>

            <div className="my-4 flex flex-col gap-y-2 pb-4">
              <label className="text-sm font-medium text-white">
                OpenAI API Key
              </label>
              <p className="text-sm text-white/60">
                Required only if you will be updating or uploading new documents
                or embeddings via {APP_NAME}.
              </p>
              <div className="relative">
                <input
                  onChange={() => setHasChanges(true)}
                  type="password"
                  name="open_ai_api_key"
                  placeholder="sk-xxxxxxxx"
                  defaultValue={getSetting('open_ai_api_key')?.value}
                  className="max-w-1/2 mt-2 inline-flex h-11 min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
                />
              </div>
            </div>

            <div className="mb-8 flex justify-end">
              <button
                hidden={!hasChanges}
                type="submit"
                className="w-fit cursor-pointer rounded-lg border border-white/20 bg-transparent px-4 py-2 text-white transition hover:bg-sky-400 hover:bg-opacity-90"
              >
                Save Settings
              </button>
            </div>
          </form>
          <DebugCredentials settings={settings} />
        </div>
      </div>
    </>
  );
}

function DebugCredentials({ settings }: { settings: {} }) {
  const [showPwd, setShowPwd] = useState(false);
  const getSetting = (label: string) => {
    return settings.find((setting) => setting.label === label);
  };

  return (
    <>
      <div className="flex w-fit flex-col gap-y-2 rounded-lg border border-white/20 p-4">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-white">
            Database Debug Credentials
          </p>
          <p className="mt-4 text-sm text-white/60">
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

        <div className="relative">
          <input
            type="text"
            className="max-w-1/2 mt-2 inline-flex h-11 min-w-[350px] items-center justify-start gap-2.5 rounded-lg bg-white bg-opacity-10 p-2.5 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
            defaultValue={getSetting('debug_username')?.value}
            placeholder="db username"
            disabled={true}
          />
        </div>

        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            className="max-w-1/2 mt-2 h-11 min-w-[350px] rounded-lg bg-white bg-opacity-10 pl-2.5 pr-10 text-sm font-medium leading-tight text-white placeholder:text-opacity-60"
            defaultValue={getSetting('debug_pwd')?.value}
            placeholder="db password"
            disabled={true}
          />
          <button
            onClick={() => setShowPwd(!showPwd)}
            type="button"
            className="max-w-1/2 absolute inset-y-0 right-0 mr-14 mt-2 flex min-w-[350px] items-center justify-center px-2.5 text-white hover:text-white/40 focus:outline-none focus:ring-0"
          >
            {!showPwd ? (
              <EyeSlash size={18} weight="bold" />
            ) : (
              <Eye size={18} weight="bold" />
            )}
          </button>
        </div>

        <div className="justify-left flex w-full items-center gap-4">
          <a
            href={paths.debug.vdbms()}
            target="_blank"
            className="flex items-center gap-x-2 rounded-lg px-4 py-2 text-sm font-medium text-white/60 hover:bg-sky-400 hover:bg-opacity-90 hover:text-white"
          >
            Go to {APP_NAME} database manager
            <ArrowSquareOut size={18} weight="bold" />
          </a>
        </div>
      </div>
    </>
  );
}
