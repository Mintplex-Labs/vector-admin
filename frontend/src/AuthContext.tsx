import { useState, createContext } from 'react';
import { STORE_TOKEN, STORE_USER } from './utils/constants';

export const AuthContext = createContext(null);
export function ContextWrapper(props: any) {
  const localUser = localStorage.getItem(STORE_USER);
  const localAuthToken = localStorage.getItem(STORE_TOKEN);
  const [store, setStore] = useState({
    user: localUser ? JSON.parse(localUser) : null,
    authToken: localAuthToken ? localAuthToken : null,
  });

  const [actions] = useState({
    updateUser: (user: object, authToken = '') => {
      localStorage.setItem(STORE_USER, JSON.stringify(user));
      localStorage.setItem(STORE_TOKEN, authToken);
      setStore({ user, authToken });
    },
    unsetUser: () => {
      localStorage.removeItem(STORE_USER);
      localStorage.removeItem(STORE_TOKEN);
      setStore({ user: null, authToken: null });
    },
  });

  return (
    <AuthContext.Provider value={{ store, actions }}>
      {props.children}
    </AuthContext.Provider>
  );
}
