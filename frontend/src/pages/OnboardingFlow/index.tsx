import DefaultLayout from '../../layout/DefaultLayout';
import Onboarding from '../../images/undraws/onboarding.png';
import PreLoader from '../../components/Preloader';
import { useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState({});
  const [connector, setConnector] = useState();

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
                    />
                  )}
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default OnboardingFlow;
