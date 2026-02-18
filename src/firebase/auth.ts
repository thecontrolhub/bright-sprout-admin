import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult, User } from 'firebase/auth';
import { firebaseApp } from './config';

export const auth = getAuth(firebaseApp);

export const loginWithEmail = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const logout = async () => {
  await signOut(auth);
};

export const watchAuth = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);

export const fetchIdTokenResult = async (user: User) => {
  return getIdTokenResult(user, true);
};
