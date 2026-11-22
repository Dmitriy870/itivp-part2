import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { login, logout, restoreSession } from './api';
import type { User } from './api';
import { SessionContext } from './sessionContext';

export default function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    restoreSession().then(
      (currentUser) => { if (active) setUser(currentUser); },
      () => undefined,
    ).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function signIn(email: string, password: string) {
    const { data } = await login(email, password);
    setUser(data.user);
    return data.user;
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  }

  return <SessionContext.Provider value={{ user, checking, signIn, signOut }}>{children}</SessionContext.Provider>;
}
