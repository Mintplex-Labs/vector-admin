import { FormEvent } from 'react';
import System from '../../../../models/system';
import showToast from '../../../../utils/toast';

type SecuritySettingsProps = {
  setCurrentStep: (step: string) => void;
  setLoading: (loading: boolean) => void;
};

export default function SecuritySettings({
  setCurrentStep,
  setLoading,
}: SecuritySettingsProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      allow_account_creation: form.get('allow-account-creation') === 'yes',
      account_creation_domain_scope: form.get('domain-restriction') || null,
    };

    const { success, error } = await System.updateSettings(data);

    if (success) {
      showToast('Security settings saved successfully', 'success');
      setCurrentStep('create_organization');
    } else {
      showToast(`Error setting security settings: ${error}`, 'error');
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8 font-semibold uppercase text-white">
        Step 02/
        <span className="text-white text-opacity-40">05</span>
      </div>
      <div className="mb-3 text-2xl font-medium text-white">
        Security Settings
      </div>
      <div className="w-[300px] text-sm font-light text-white text-opacity-90">
        You can limit your VectorAdmin installation to only allow sign ups from
        specific domains, or disable them totally and users must first be
        created by an admin user.
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mt-7 w-[300px] text-sm font-medium text-white">
          Allow account creation
        </div>
        <label className="relative mb-4 mt-2 inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="allow-account-creation"
            value="yes"
            className="peer sr-only"
            defaultChecked={false}
          />
          <div className="peer h-5 w-9 rounded-full bg-white/20 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-400 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
          <span className="ml-3 text-sm font-medium text-gray-300"></span>
        </label>
        <div className="w-[300px]">
          <span className="text-sm font-medium text-white">
            Account domain restriction{' '}
          </span>
          <span className="text-sm font-medium italic text-white text-opacity-60">
            (optional)
          </span>
        </div>
        <div className="mb-4.5 mt-1.5 w-[300px] text-xs font-medium text-white text-opacity-80">
          Force all accounts created to have emails ending in @yourdomain.com
        </div>
        <div className="mb-6">
          <input
            required={false}
            type="text"
            name="domain-restriction"
            title="Please enter a valid domain (e.g., yourdomain.xyz)"
            placeholder="yourdomain.xyz"
            className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-sm text-white shadow-lg transition-all duration-300 focus:scale-105"
          />
        </div>
        <button
          type="submit"
          className="h-11
                 w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
