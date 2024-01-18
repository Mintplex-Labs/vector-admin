import DefaultLayout from '../../layout/DefaultLayout';
import Onboarding from '../../images/undraws/onboarding.png';
import PreLoader from '../../components/Preloader';
import { useState } from 'react';

import CustomLogin from './Steps/CustomLogin';
import SecuritySettings from './Steps/SecuritySettings';
import CreateOrganization from './Steps/CreateOrganization';
import ConnectVectorDB from './Steps/ConnectVectorDB';
import SyncVectorDB from './Steps/SyncVectorDB';
import OnboardingSurvey from './Steps/OnboardingSurvey';

type Step = {
  title: string;
  description: string;
  component: React.ComponentType<any>;
};

type Steps = {
  [key: string]: Step;
};

const STEPS: Steps = {
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
  survey: {
    title: 'Help us make VectorAdmin better',
    description: 'This optional survey helps us build VectorAdmin.',
    component: OnboardingSurvey,
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
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState({});
  const [connector, setConnector] = useState();

  const CurrentStep = STEPS[currentStep].component;
  const stepIdx = Object.keys(STEPS).indexOf(currentStep) + 1;

  return (
    <DefaultLayout>
      <div className="relative flex h-screen">
        <div className="fixed left-0 top-0 hidden h-full w-1/2 items-center justify-center md:flex">
          <img
            src={Onboarding}
            alt="Illustration"
            className="max-w-xs md:max-w-sm lg:max-w-lg"
          />
        </div>
        <div className="relative ml-auto h-full w-full md:w-1/2">
          <div
            style={{
              background: `
            radial-gradient(circle at center, transparent 40%, black 100%),
            linear-gradient(180deg, #85F8FF 0%, #65A6F2 100%)`,
              filter: 'blur(150px)',
              opacity: '0.5',
            }}
            className="absolute left-1/2 top-1/2 z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full"
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center px-4 md:px-8 lg:px-12">
            {loading ? (
              <PreLoader />
            ) : (
              <CurrentStep
                setCurrentStep={setCurrentStep}
                userDetails={userDetails}
                setUserDetails={setUserDetails}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                organization={organization}
                setOrganization={setOrganization}
                loading={loading}
                setLoading={setLoading}
                connector={connector}
                setConnector={setConnector}
                stepIdx={stepIdx}
                stepCount={Object.keys(STEPS).length}
              />
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OnboardingFlow;
