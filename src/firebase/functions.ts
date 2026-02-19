import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from './config';

export const functions = getFunctions(firebaseApp);

export const createAdminAccount = httpsCallable(functions, 'createAdminAccount');
