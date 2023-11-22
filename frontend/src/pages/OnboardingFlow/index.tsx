import { Link } from 'react-router-dom';
import DefaultLayout from '../../layout/DefaultLayout';
import Onboarding from '../../images/undraws/onboarding.png';
import PreLoader from '../../components/Preloader';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'react-feather';
import User from '../../models/user';
import { APP_NAME, STORE_TOKEN, STORE_USER } from '../../utils/constants';
import paths from '../../utils/paths';
import validateSessionTokenForUser from '../../utils/session';

import CustomLogin from './Steps/CustomLogin';
import SecuritySettings from './Steps/SecuritySettings';
import CreateOrganization from './Steps/CreateOrganization';
import ConnectVectorDB from './Steps/ConnectVectorDB';
import SyncVectorDB from './Steps/SyncVectorDB';

const STEPS = {
  custom_login: {
    title: 'Create your custom login',
    description:
      'This will be your account login information moving forward. The previous default login will become obsolete.',
    component: CustomLogin,
  },
  security_settings: {
    title: 'Security Settings',
    description:
      'You can limit your VectorAdmin installation to only allow sign ups from specific domains, or disable them totally and users must first be created by an admin user.',
    component: SecuritySettings,
  },
  create_organization: {
    title: 'Create an organization',
    description:
      'Organizations are where all your documents are stored. You can have multiple organizations, but you need at least one.',
    component: CreateOrganization,
  },
  connect_vector_db: {
    title: 'Connect your vector database',
    description: '',
    component: ConnectVectorDB,
  },
  sync_vector_db: {
    title: 'Sync your vector database',
    description:
      'VDMS can automatically sync existing information in your Pinecone namespaces so you can manage it easily. This process can take a long time to complete depending on how much data you already have embedded.',
    component: SyncVectorDB,
  },
};

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState('custom_login');
  const [userDetails, setUserDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const CurrentStep = STEPS[currentStep].component;

  return (
    <DefaultLayout>
      <div className="">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div>
              <img src={Onboarding} alt="Illustration" />
            </div>
          </div>

          <div className="w-full border-stroke xl:w-1/2">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              <>
                <div
                  style={{
                    background: `
                                radial-gradient(circle at center, transparent 40%, black 100%),
                                linear-gradient(180deg, #85F8FF 0%, #65A6F2 100%)`,
                    width: '575px',
                    filter: 'blur(150px)',
                    opacity: '0.5',
                  }}
                  className="absolute right-0 top-0 z-0 h-full w-full"
                />
                <div className="relative z-10 flex items-center justify-center">
                  <CurrentStep
                    setCurrentStep={setCurrentStep}
                    userDetails={userDetails}
                    setUserDetails={setUserDetails}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                  />
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

function StepComponent({ handleSubmit }: { handleSubmit: any }) {
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
      {/* Render each step dynamically here */}
      {/* <div className="relative z-10 flex flex-col items-center">
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
      </div> */}
      <div className="flex items-center justify-center">
        <CustomLogin />
      </div>
    </>
  );
}

export default OnboardingFlow;
