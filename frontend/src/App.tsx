import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ContextWrapper } from './AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';

const UserManagementView = lazy(() => import('./pages/UsersView'));
const OnboardingHome = lazy(() => import('./pages/Onboarding'));
const OrganizationSettingsView = lazy(
  () => import('./pages/OrganizationSettings')
);
const OrganizationDashboard = lazy(() => import('./pages/Dashboard'));
const WorkspaceDashboard = lazy(() => import('./pages/WorkspaceDashboard'));
const DocumentView = lazy(() => import('./pages/DocumentView'));
const SystemSetup = lazy(() => import('./pages/Authentication/SystemSetup'));
const OnboardingSecuritySetup = lazy(
  () => import('./pages/Onboarding/security')
);
const OrganizationJobsView = lazy(() => import('./pages/Jobs'));
const OrganizationToolsView = lazy(() => import('./pages/Tools'));
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
            path="/dashboard/:slug/all-tools"
            element={<PrivateRoute Component={OrganizationToolsView} />}
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
            path="/dashboard/:slug/settings"
            element={<AdminRoute Component={OrganizationSettingsView} />}
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

          <Route
            path="/dashboard/:slug/tools/db-migration"
            element={<PrivateRoute Component={OrganizationToolsView} />}
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
      <ToastContainer />
    </ContextWrapper>
  );
}

export default App;
