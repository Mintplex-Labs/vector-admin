import { Link } from 'react-router-dom';
import DefaultLayout from '../../layout/DefaultLayout';
import SignInImg from '../../images/undraws/sign-in.png';
import PreLoader from '../../components/Preloader';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'react-feather';
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
    if (!token || !user) setStage('failed');
    if (!!token && !!user) setStage('success');
    setResults({ user, token, error });

    if (!!token && !!user) {
      window.localStorage.setItem(STORE_USER, JSON.stringify(user));
      window.localStorage.setItem(STORE_TOKEN, token);
      window.location.replace(
        user.role === 'root' ? paths.systemSetup() : paths.dashboard()
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
  }, []);

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
          <span className="text-2xl font-bold text-white">Login to</span>
          <span className="text-2xl font-bold text-sky-300"> VectorAdmin</span>
        </div>
        <div className="mb-11 w-[308.65px] text-center">
          <span className="mt-3 text-sm text-white text-opacity-90">
            Welcome back, please login to your account.
          </span>
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
              Sign In
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-white/90">
            <p>
              Don't have a {APP_NAME} account?{' '}
              <Link
                to={paths.signUp()}
                className="font-semibold transition-all duration-300 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

export default SignIn;
