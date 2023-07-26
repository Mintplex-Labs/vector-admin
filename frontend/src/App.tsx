import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ContextWrapper } from './AuthContext';
import PrivateRoute from './components/PrivateRoute';

import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import { FullScreenLoader } from './components/Preloader';
import UserManagementView from './pages/UsersView';
import AdminRoute from './components/AdminRoute';

const OnboardingHome = lazy(() => import('./pages/Onboarding'));
const OrganizationDashboard = lazy(() => import('./pages/Dashboard'));
const WorkspaceDashboard = lazy(() => import('./pages/WorkspaceDashboard'));
const DocumentView = lazy(() => import('./pages/DocumentView'));
const SystemSetup = lazy(() => import('./pages/Authentication/SystemSetup'));
const OnboardingSecuritySetup = lazy(
  () => import('./pages/Onboarding/security')
);
const OrganizationJobsView = lazy(() => import('./pages/Jobs'));
const SystemSettingsView = lazy(() => import('./pages/SystemSettings'));

function App() {
  return (
    <ContextWrapper>
      <Suspense fallback={<div />}>
        <Routes>
          <Route path="/" element={<SignIn />} />

          <Route
            path="/dashboard"
            element={<PrivateRoute Component={OrganizationDashboard} />}
          />

          <Route
            path="/dashboard/:slug"
            element={<PrivateRoute Component={OrganizationDashboard} />}
          />

          <Route
            path="/dashboard/:slug/jobs"
            element={<PrivateRoute Component={OrganizationJobsView} />}
          />

          <Route
            path="/dashboard/:slug/workspace/:workspaceSlug"
            element={<PrivateRoute Component={WorkspaceDashboard} />}
          />

          <Route
            path="/dashboard/:slug/workspace/:workspaceSlug/document/:documentId"
            element={<PrivateRoute Component={DocumentView} />}
          />

          <Route
            path="/onboarding"
            element={<PrivateRoute Component={OnboardingHome} />}
          />
          <Route
            path="/onboarding/:slug/security"
            element={<PrivateRoute Component={OnboardingSecuritySetup} />}
          />

          <Route path="/auth/sign-up" element={<SignUp />} />
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/system-setup" element={<SystemSetup />} />
          <Route
            path="/system-settings"
            element={<AdminRoute Component={SystemSettingsView} />}
          />

          <Route
            path="/users"
            element={<PrivateRoute Component={UserManagementView} />}
          />
        </Routes>
      </Suspense>
    </ContextWrapper>
  );
}

const Redirect = ({ to }: { to: any }) => {
  if (!!window?.location) window.location = to;
  return <FullScreenLoader />;
};

export default App;
