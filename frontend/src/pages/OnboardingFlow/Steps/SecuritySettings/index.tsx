import { useState } from 'react';

export default function SecuritySettings({ setCurrentStep }) {
  const [allowAccountCreation, setAllowAccountCreation] = useState(true);

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
      <form onSubmit={() => setCurrentStep('create_organization')}>
        <div className="mt-7 w-[300px] text-sm font-medium text-white">
          Allow account creation
        </div>
        {/* TODO: make button work */}
        <div className="mb-4 mt-2 inline-flex h-5 w-9 items-center justify-start rounded-xl bg-white bg-opacity-20 p-0.5">
          <div className="h-4 w-4 rounded-full bg-white shadow" />
        </div>
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
            required={true}
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
