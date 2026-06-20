import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

console.log('Firebase Configuration Object:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
});

export const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app.name);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth(app);
console.log('Firebase Auth initialized:', auth.app.name, auth.config);
export const storage = getStorage(app);
