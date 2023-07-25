import { Link } from 'react-router-dom';
import LogoDark from '../../images/logo/logo-dark.png';
import Logo from '../../images/logo/logo.png';
import DefaultLayout from '../../layout/DefaultLayout';
import ManageSvg from '../../images/undraws/manage.svg';
import PreLoader from '../../components/Preloader';
import { useEffect, useState } from 'react';
import { CheckCircle, Key, Mail, XCircle } from 'react-feather';
import User from '../../models/user';
import { APP_NAME, STORE_TOKEN, STORE_USER } from '../../utils/constants';
import paths from '../../utils/paths';
import validateSessionTokenForUser from '../../utils/session';

type IStages = 'loading' | 'failed' | 'success' | 'ready';
type FormTypes = {
  target: {
    email: {
      value: string;
    };
    password: {
      value: string;
    };
  };
};

type IResult = {
  user: any;
  token: string | null;
  error?: string | null;
};

const SignIn = () => {
  const [stage, setStage] = useState<IStages>('ready');
  const [results, setResults] = useState<IResult>({
    user: null,
    token: null,
    error: null,
  });
  const resetStage = () => {
    setResults({ user: null, token: null, error: null });
    setStage('ready');
  };
  const handleSubmit = async (e: React.FormEvent & FormTypes) => {
    e.preventDefault();
    setStage('loading');
    const { user, token, error } = await User.login(
      e.target.email.value,
      e.target.password.value
    );
    if (!token) setStage('failed');
    if (!!token) setStage('success');
    setResults({ user, token, error });

    if (!!token) {
      window.localStorage.setItem(STORE_USER, JSON.stringify(user));
      window.localStorage.setItem(STORE_TOKEN, token);
      window.location.replace(
        user?.role === 'root' ? paths.systemSetup() : paths.dashboard()
      );
    }
  };

  useEffect(() => {
    async function checkAuth() {
      const currentToken = window.localStorage.getItem(STORE_TOKEN);
      if (!currentToken) return false;
      const success = await validateSessionTokenForUser();
      if (!success) {
        window.localStorage.removeItem(STORE_USER);
        window.localStorage.removeItem(STORE_TOKEN);
        return false;
      }
      window.location.replace(paths.dashboard());
    }
    checkAuth();
  });

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

              <p className="2xl:px-20">
                Did you know using {APP_NAME} can save you 75% on embedding
                costs?
              </p>

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
                <LoginForm handleSubmit={handleSubmit} />
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
  if (stage === 'loading') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <PreLoader />
        <p className="text-gray-500">logging you in...</p>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <XCircle className="h-20 w-20 text-red-400" />
        <p className="text-red-500">
          We could not log you in - contact an admin.
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
        <p className="text-center text-green-500">Login was successful!</p>
        <p className="text-center text-xs text-gray-400">
          Redirecting you to the right place.
        </p>
      </div>
    );
  }

  return null;
}

function LoginForm({ handleSubmit }: { handleSubmit: any }) {
  return (
    <>
      <span className="mb-1.5 block text-2xl font-medium">Sign back in</span>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Email
          </label>
          <div className="relative">
            <input
              required={true}
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />

            <span className="absolute right-4 top-4">
              <Mail className="h-[22px] w-[22px] text-gray-500" />
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Password
          </label>
          <div className="relative">
            <input
              required={true}
              type="password"
              name="password"
              min={8}
              placeholder={`Your ${APP_NAME} account password`}
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />

            <span className="absolute right-4 top-4">
              <Key className="h-[22px] w-[22px] text-gray-500" />
            </span>
          </div>
        </div>

        <div className="mb-5">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
          >
            Sign In
          </button>
        </div>

        <div className="mt-6 text-center">
          <p>
            Don't have a {APP_NAME} account?{' '}
            <Link to={paths.signUp()} className="text-primary">
              Sign Up
            </Link>
          </p>
        </div>
      </form>
    </>
  );
}

export default SignIn;
