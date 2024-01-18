import { Link } from 'react-router-dom';
import SignInImg from '../../images/undraws/sign-in.png';
import DefaultLayout from '../../layout/DefaultLayout';
import { useState } from 'react';
import PreLoader from '../../components/Preloader';
import { CheckCircle, XCircle } from 'react-feather';
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
      <div className="">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div>
              <img src={SignInImg} alt="Sign In" />
            </div>
          </div>

          <div className="w-full border-stroke xl:w-1/2">
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
      {/* <div className="bg-white">
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
      </div> */}
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
      <div
        style={{
          background: `
  radial-gradient(circle at center, transparent 40%, black 100%),
  linear-gradient(180deg, #85F8FF 0%, #65A6F2 100%)
`,
          width: '575px',
          filter: 'blur(150px)',
          opacity: '0.5',
        }}
        className="absolute right-0 top-0 z-0 h-full w-full"
      />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-3 flex justify-center gap-x-2 text-center">
          <span className="text-2xl font-bold text-white">Sign Up for</span>
          <span className="text-2xl font-bold text-sky-300">{APP_NAME}</span>
        </div>
        <form onSubmit={handleSubmit} className="z-10">
          <div className="mb-3.5">
            <div className="">
              <input
                required={true}
                type="email"
                name="email"
                placeholder="Enter your email"
                className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-white shadow-lg transition-all duration-300 focus:scale-105"
              />
            </div>
          </div>

          <div className="mb-9">
            <div className="">
              <input
                required={true}
                type="password"
                name="password"
                min={8}
                placeholder={`Your ${APP_NAME} password`}
                className="h-11 w-[300px] rounded-lg bg-neutral-800/60 p-2.5 text-white shadow-lg transition-all duration-300 focus:scale-105"
              />
            </div>
          </div>

          <div className="mb-5">
            <button
              type="submit"
              className="h-11
             w-[300px] items-center rounded-lg bg-white p-2 text-center text-sm font-bold leading-tight text-neutral-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-opacity-90"
            >
              Create account
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-white/90">
            <p>
              Already have an account?{' '}
              <Link
                to={paths.signIn()}
                className="font-semibold transition-all duration-300 hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

export default SignUp;
