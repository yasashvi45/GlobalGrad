import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { createAdminNotification } from '@/lib/notificationUtils';

export async function getUniversities() {
  const q = collection(db, 'universities');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export function listenToUniversities(callback: (data: any[]) => void) {
  const q = collection(db, 'universities');
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
}

export async function createUniversity(data: any) {
  let docRef = doc(db, 'universities', String(data.id || Date.now()));
  await setDoc(docRef, data);

  try {
    await createAdminNotification({
      title: 'University Created',
      message: `A new university profile for ${data.name} was added.`,
      type: 'University',
      eventType: 'university_created',
      entityId: docRef.id
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { ...data, id: String(docRef.id) };
}

export async function updateUniversity(id: string | number, data: any) {
  const docRef = doc(db, 'universities', String(id));
  await setDoc(docRef, data, { merge: true });
  
  try {
    await createAdminNotification({
      title: 'University Updated',
      message: `University profile for ${data.name || 'Unknown'} was updated.`,
      type: 'University',
      eventType: 'university_updated',
      entityId: String(id) + '_' + Date.now() // Note: allowing multiple updates, so adding timestamp or just appending _updated
    });
  } catch (e) {}

  return { ...data, id: String(id) };
}

export async function deleteUniversity(id: string | number) {
  let universityName = 'Unknown University';
  try {
     const docRef = doc(db, 'universities', String(id));
     const snap = await getDoc(docRef);
     if (snap.exists()) {
        universityName = snap.data().name || universityName;
     }
  } catch (e) {}

  try {
    const logoRef = ref(storage, `universities/${id}/logo`);
    await deleteObject(logoRef);
  } catch (e) {
    console.log("No logo found to delete or error deleting.", e);
  }
  try {
    const heroRef = ref(storage, `universities/${id}/hero`);
    await deleteObject(heroRef);
  } catch (e) {
    console.log("No hero image found to delete or error deleting.", e);
  }
  await deleteDoc(doc(db, 'universities', String(id)));

  try {
    await createAdminNotification({
      title: 'University Deleted',
      message: `University profile for ${universityName} was deleted.`,
      type: 'University',
      eventType: 'university_deleted',
      entityId: String(id)
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { success: true };
}
