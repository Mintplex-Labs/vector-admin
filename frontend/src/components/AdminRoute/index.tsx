import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FullScreenLoader } from '@/components/Preloader';
import validateSessionTokenForUser from '@/utils/session';
import { STORE_TOKEN, STORE_USER } from '@/utils/constants';
import paths from '@/utils/paths';

function useIsAuthenticated() {
  const [isAuthd, setIsAuthed] = useState<Boolean | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      const localUser = localStorage.getItem(STORE_USER);
      const localAuthToken = localStorage.getItem(STORE_TOKEN);
      if (!localUser || !localAuthToken) {
        setIsAuthed(false);
        return;
      }

      const isValid = await validateSessionTokenForUser();
      if (!isValid) {
        localStorage.removeItem(STORE_USER);
        localStorage.removeItem(STORE_TOKEN);
        setIsAuthed(false);
        return;
      }

      const user = JSON.parse(localUser);
      user.role !== 'admin' ? setIsAuthed(false) : setIsAuthed(true);
    };
    validateSession();
  }, []);

  return isAuthd;
}

const AdminRoute = ({ Component }: { Component: React.FunctionComponent }) => {
  const authed = useIsAuthenticated();
  if (authed === null) return <FullScreenLoader />;

  return authed ? <Component /> : <Navigate to={paths.dashboard()} />;
};

export default AdminRoute;
