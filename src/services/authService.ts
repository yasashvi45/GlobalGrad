import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged as firebaseOnAuthStateChanged, updateProfile as firebaseUpdateProfile, sendPasswordResetEmail, GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';

export async function login(email: string, password: string) {
  console.log('authService.ts: auth instance check =', auth ? 'exists' : 'missing', auth.app.name);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signup(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signInWithMicrosoft() {
  const provider = new OAuthProvider('microsoft.com');
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function onAuthStateChanged(cb: (user: any) => void) {
  return firebaseOnAuthStateChanged(auth, cb);
}

export async function updateProfile(user: any, profile: { displayName?: string, photoURL?: string }) {
  await firebaseUpdateProfile(user, profile);
}
