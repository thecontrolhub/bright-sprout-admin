import React from 'react';
import { User } from 'firebase/auth';
import { fetchIdTokenResult, loginWithEmail, logout, watchAuth } from '../firebase/auth';

export type AdminAuthState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  error?: string;
};

type AdminAuthContextValue = AdminAuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null);

export const useAdminAuth = () => {
  const ctx = React.useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<AdminAuthState>({
    user: null,
    loading: true,
    isAdmin: false,
  });

  const clearError = React.useCallback(() => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  const checkAdmin = React.useCallback(async (user: User | null) => {
    if (!user) {
      setState({ user: null, loading: false, isAdmin: false });
      return false;
    }
    const token = await fetchIdTokenResult(user);
    const isAdmin = token.claims.admin === true;
    if (!isAdmin) {
      await logout();
      setState({ user: null, loading: false, isAdmin: false, error: 'Admin access required.' });
      return false;
    }
    setState({ user, loading: false, isAdmin: true });
    return true;
  }, []);

  React.useEffect(() => {
    const unsub = watchAuth((user) => {
      setState((prev) => ({ ...prev, loading: true }));
      checkAdmin(user).catch((err) => {
        setState({ user: null, loading: false, isAdmin: false, error: err?.message || 'Auth error' });
      });
    });
    return () => unsub();
  }, [checkAdmin]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    clearError();
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const user = await loginWithEmail(email, password);
      const ok = await checkAdmin(user);
      if (!ok) {
        throw new Error('Admin access required.');
      }
    } catch (err: any) {
      setState({ user: null, loading: false, isAdmin: false, error: err?.message || 'Login failed.' });
      throw err;
    }
  }, [checkAdmin, clearError]);

  const signOutUser = React.useCallback(async () => {
    await logout();
    setState({ user: null, loading: false, isAdmin: false });
  }, []);

  const value: AdminAuthContextValue = {
    ...state,
    signIn,
    signOutUser,
    clearError,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
