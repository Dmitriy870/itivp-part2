import { createContext, useContext } from 'react';
import type { User } from './api';

type Session = {
  user: User | null;
  checking: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

export const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is missing');
  return session;
}
