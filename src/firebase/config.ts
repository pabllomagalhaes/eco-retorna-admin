/**
 * Firebase Initialization Configuration
 * Uses environment variables:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? (process.env as unknown as Record<string, string | undefined>)
    : {};

const clean = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const firebaseConfig = {
  apiKey: clean(env.VITE_FIREBASE_API_KEY),
  authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: clean(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: clean(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(env.VITE_FIREBASE_APP_ID),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.projectId.trim() !== '' &&
  firebaseConfig.apiKey !== 'your-api-key' &&
  firebaseConfig.apiKey !== 'sua-api-key' &&
  !firebaseConfig.apiKey.includes('your-api-key') &&
  !firebaseConfig.projectId.includes('MY_PROJECT') &&
  firebaseConfig.projectId !== 'seu-projeto'
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    console.info('[Firebase] EcoRetorna Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Firebase] Could not initialize Firebase SDK. Falling back to local storage engine.', err);
  }
} else {
  console.info('[Firebase] Config keys are placeholders or not provided. Operating in reactive mock/offline data mode.');
}

export { app, db, auth, firebaseConfig };
