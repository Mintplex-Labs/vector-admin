import { useContext } from 'react';
import { AuthContext } from '@/AuthContext';

interface IContext {
  store: {
    user: {
      uid: string;
      name: string | null;
      email: string;
      stytchUserId: string | null;
      stytchEmailId: string | null;
    };
  };
}

export default function useUser() {
  const context = useContext<IContext>(AuthContext as any);

  return { ...context.store };
}
