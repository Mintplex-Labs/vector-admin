import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FullScreenLoader } from '@/components/Preloader';
import validateSessionTokenForUser from '@/utils/session';
import paths from '@/utils/paths';
import { STORE_TOKEN, STORE_USER } from '@/utils/constants';

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
      user.role === 'root' ? setIsAuthed(false) : setIsAuthed(true);
    };
    validateSession();
  }, []);

  return isAuthd;
}

const PrivateRoute = ({
  Component,
}: {
  Component: React.FunctionComponent;
}) => {
  const authed = useIsAuthenticated();
  if (authed === null) return <FullScreenLoader />;

  return authed ? <Component /> : <Navigate to={paths.signIn()} />;
};

export default PrivateRoute;
