import { Link } from 'react-router-dom';
import LogoDark from '../../images/logo/logo-dark.png';
import Logo from '../../images/logo/logo.png';
import ManageSvg from '../../images/undraws/manage.svg';
import DefaultLayout from '../../layout/DefaultLayout';
import { useState } from 'react';
import PreLoader from '../../components/Preloader';
import { CheckCircle, Key, Mail, XCircle } from 'react-feather';
import User from '../../models/user';
import { APP_NAME, STORE_TOKEN, STORE_USER } from '../../utils/constants';
import paths from '../../utils/paths';

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

const SignUp = () => {
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
    const { user, token, error } = await User.createAccount(
      e.target.email.value,
      e.target.password.value
    );
    if (!token) setStage('failed');
    if (!!token) setStage('success');
    setResults({ user, token, error });

    if (!!token) {
      window.localStorage.setItem(STORE_USER, JSON.stringify(user));
      window.localStorage.setItem(STORE_TOKEN, token);
      window.location.replace(paths.dashboard());
    }
  };

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
                You are almost ready to use the most powerful vector data
                management system ever.
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
        <p className="text-gray-500">creating account...</p>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className="flex h-auto w-full flex-col items-center justify-center gap-y-2">
        <XCircle className="h-20 w-20 text-red-400" />
        <p className="text-red-500">We could not create an account.</p>
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
        <p className="text-center text-green-500">Your account was created!</p>
        <p className="text-center text-xs text-gray-400">
          Redirecting you to your dashboard
        </p>
      </div>
    );
  }

  return null;
}

function LoginForm({ handleSubmit }: { handleSubmit: any }) {
  return (
    <>
      <span className="mb-1.5 block font-medium">New account</span>
      <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
        Sign Up for {APP_NAME}
      </h2>

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

        <div className="mb-5 flex flex-col gap-y-1">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
          >
            Create account
          </button>
        </div>

        <div className="mt-6 text-center">
          <p>
            Already have an account?{' '}
            <Link to={paths.signIn()} className="text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </>
  );
}

export default SignUp;
