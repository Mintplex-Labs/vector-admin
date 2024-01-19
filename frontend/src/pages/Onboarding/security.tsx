import { Link, useParams } from 'react-router-dom';
import LogoDark from '@/images/logo/logo-dark.png';
import Logo from '@/images/logo/logo-light.png';
import DefaultLayout from '@/layout/DefaultLayout';
import ManageSvg from '@/images/undraws/manage.svg';
import PreLoader, { FullScreenLoader } from '@/components/Preloader';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'react-feather';
import Organization from '@/models/organization';
import paths from '@/utils/paths';
import { APP_NAME } from '@/utils/constants';
import System from '@/models/system';

type IStages = 'preflight' | 'loading' | 'failed' | 'success' | 'ready';
type IResult = {
  success: boolean;
  error?: string | null;
};

export default function OnboardingSecuritySetup() {
  const { slug } = useParams();
  const [stage, setStage] = useState<IStages>('preflight');
  const [results, setResults] = useState<IResult>({
    success: false,
    error: null,
  });
  const resetStage = () => {
    setResults({ success: false, error: null });
    setStage('ready');
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      allow_account_creation: form.get('allow_account_creation') === 'yes',
      account_creation_domain_scope:
        form.get('account_creation_domain_scope') ?? null,
    };
    const { success, error } = await System.updateSettings(data);
    if (!success) setStage('failed');
    if (success) {
      setStage('success');
      setResults({ success, error });
      window.location.replace(paths.organization({ slug }));
    }
  };

  useEffect(() => {
    async function fetchOrg() {
      if (!slug) return;
      const organization = await Organization.bySlug(slug);
      if (!organization) {
        window.location.replace(paths.onboarding.orgName());
        return;
      }

      setStage('ready');
    }
    fetchOrg();
  }, [slug]);

  return (
    <DefaultLayout>
      <div className="bg-white">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="px-26 py-17.5 text-center">
              <Link className="mb-5.5 inline-block" to="/">
                <img
                  className="hidden h-[50px] dark:block"
                  src={Logo}
                  alt="Logo"
                />
                <img
                  className="h-[50px] dark:hidden"
                  src={LogoDark}
                  alt="Logo"
                />
              </Link>

              <span className="mt-15 inline-block">
                <img src={ManageSvg} />
              </span>
            </div>
          </div>

          <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              {stage !== 'ready' ? (
                <ShowStatus
                  stage={stage}
                  results={results}
                  resetForm={resetStage}
                />
              ) : (
                <InputForm handleSubmit={handleSubmit} />
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}

function ShowStatus({
  stage,
  results,
  resetForm,
}: {
  stage: IStages;
  results: IResult;
  resetForm: any;
}) {
  if (stage === 'preflight') {
    return <FullScreenLoader />;
  }

  if (stage === 'loading') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <PreLoader />
        <p className="text-gray-500">updating security settings...</p>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <XCircle className="h-20 w-20 text-red-400" />
        <p className="text-red-500">
          There was an issue updating that organization.
        </p>
        <p className="text-xs text-red-500">{results?.error}</p>
        <button className="text-blue-400" onClick={resetForm}>
          Try Again &rarr;
        </button>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <CheckCircle className="h-20 w-20 text-green-400" />
        <p className="text-center text-green-500">
          Security settings saved!
          <br />
          You can update these at any time via the dashboard.
        </p>
      </div>
    );
  }

  return null;
}

function InputForm({ handleSubmit }: { handleSubmit: any }) {
  return (
    <>
      <span className="mb-1.5 block text-2xl font-medium">
        Next, let's review your security settings.
      </span>
      <p className="text-base text-gray-600">
        You can limit your {APP_NAME} installation to only allow sign ups from
        specific domains, or disable them totally and users must first be
        created by an admin user.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="my-4">
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Allow account creation
          </label>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="allow_account_creation"
              value="yes"
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"></span>
          </label>
        </div>

        <div className="my-4">
          <label className=" block flex items-center gap-x-1 font-medium text-black dark:text-white">
            Account domain restriction{' '}
            <p className="text-sm font-light text-slate-500">optional</p>
          </label>
          <p className="mb-2.5 text-sm text-slate-600">
            force all accounts created to have emails ending in @yourdomain.com
          </p>
          <div className="relative">
            <input
              type="text"
              name="account_creation_domain_scope"
              placeholder="yourdomain.xyz"
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-5">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
          >
            Continue onboarding
          </button>
        </div>
      </form>
    </>
  );
}
