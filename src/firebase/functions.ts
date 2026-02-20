import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from './config';

export const functions = getFunctions(firebaseApp, "europe-west1");

export const createAdminAccount = httpsCallable(functions, 'createAdminAccount');
export const generateCambridgeBaseline = httpsCallable(functions, 'generateCambridgeBaseline');
export const startBaselineGeneration = httpsCallable(functions, 'startBaselineGeneration');
