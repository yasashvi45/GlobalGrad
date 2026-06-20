import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createAdminNotification } from '@/lib/notificationUtils';

export async function getUsers() {
  if (!auth.currentUser) return [];
  const q = collection(db, 'users');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function getUser(id: string) {
  if (!auth.currentUser) return null;
  const docRef = doc(db, 'users', id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export function listenToUser(id: string, callback: (data: any | null) => void) {
  if (!auth.currentUser) {
     callback(null);
     return () => {};
  }
  const docRef = doc(db, 'users', id);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback({ ...snap.data(), id: snap.id });
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("listenToUser error:", err);
    callback(null);
  });
}

export function listenToUsers(callback: (data: any[]) => void) {
  if (!auth.currentUser) {
     callback([]);
     return () => {};
  }
  const q = collection(db, 'users');
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  }, (err) => {
    console.error("listenToUsers error:", err);
    callback([]);
  });
}

export async function createUser(data: any) {
  let docRef = doc(db, 'users', String(data.id || data.email || Date.now()));
  await setDoc(docRef, data);

  try {
    await createAdminNotification({
      title: 'New Student Registered',
      message: `${data.firstName || ''} ${data.lastName || ''} has joined the platform.`,
      type: 'Student',
      eventType: 'student_registered',
      entityId: docRef.id
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { ...data, id: String(docRef.id) };
}

export async function updateUser(id: string | number, data: any) {
  const docRef = doc(db, 'users', String(id));
  await setDoc(docRef, data, { merge: true });
  return { ...data, id: String(id) };
}

export async function deleteUser(id: string | number) {
  await deleteDoc(doc(db, 'users', String(id)));

  try {
    await createAdminNotification({
      title: 'User Deleted',
      message: `A user account (ID: ${id}) was permanently deleted.`,
      type: 'System',
      eventType: 'user_deleted',
      entityId: String(id)
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { success: true };
}

export async function getProfile(id: string) {
  const docRef = doc(db, 'profiles', String(id));
  const snap = await getDoc(docRef);
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export async function updateProfileDoc(id: string | number, data: any) {
  const docRef = doc(db, 'profiles', String(id));
  await setDoc(docRef, { ...data, userId: String(id) }, { merge: true });
  return { ...data, userId: String(id) };
}
