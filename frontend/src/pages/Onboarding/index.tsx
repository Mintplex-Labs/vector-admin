import { Link } from 'react-router-dom';
import LogoDark from '../../images/logo/logo-dark.png';
import Logo from '../../images/logo/logo-light.png';
import DefaultLayout from '../../layout/DefaultLayout';
import ManageSvg from '../../images/undraws/manage.svg';
import PreLoader, { FullScreenLoader } from '../../components/Preloader';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'react-feather';
import Organization from '../../models/organization';
import paths from '../../utils/paths';
import User from '../../models/user';

type IStages = 'preflight' | 'loading' | 'failed' | 'success' | 'ready';
type FormTypes = {
  target: {
    name: {
      value: string;
    };
  };
};

type IOrganization = {
  uid: string;
  name: string;
  slug: string;
};

type IResult = {
  organization: IOrganization | null;
  error?: string | null;
};

const SignIn = () => {
  const [stage, setStage] = useState<IStages>('preflight');
  const [results, setResults] = useState<IResult>({
    organization: null,
    error: null,
  });
  const resetStage = () => {
    setResults({ organization: null, error: null });
    setStage('ready');
  };
  const handleSubmit = async (e: React.FormEvent & FormTypes) => {
    e.preventDefault();
    const { organization, error } = await Organization.create(
      e.target.name.value
    );
    if (!organization) setStage('failed');
    if (!!organization) {
      setStage('success');
      setResults({ organization, error });
      window.location.replace(paths.onboarding.security(organization));
    }
  };

  useEffect(() => {
    async function checkOnboardingStage() {
      const orgs = await User.organizations();
      if (orgs.length > 0) {
        window.location.replace(paths.organization(orgs[0]));
        return;
      }
      // Redirect to onboarding if no orgs exist
      window.location.replace(paths.onboardingSetup());
    }
    checkOnboardingStage();
  }, []);

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
};

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
        <p className="text-gray-500">creating new organization...</p>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <XCircle className="h-20 w-20 text-red-400" />
        <p className="text-red-500">
          There was an issue creating that organization.
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
          Organization {results?.organization?.name || ''} created! <br />
          Bringing you to connectors next.
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
        First, you need to create an Organization.
      </span>
      <p className="text-base text-gray-600">
        Organizations are where all your documents are stored.
        <br />
        You can have multiple organizations, but you need at least one.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="my-4">
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Organization Name
          </label>
          <div className="relative">
            <input
              required={true}
              type="text"
              name="name"
              placeholder="Mintplex Labs Inc"
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

export default SignIn;
