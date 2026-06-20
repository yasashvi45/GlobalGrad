import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { createAdminNotification } from '@/lib/notificationUtils';

export async function getCountries() {
  const q = collection(db, 'countries');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export function listenToCountries(callback: (data: any[]) => void) {
  const q = collection(db, 'countries');
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
}

export async function createCountry(data: any) {
  let docRef = doc(db, 'countries', String(data.id || Date.now()));
  await setDoc(docRef, data);

  try {
    await createAdminNotification({
      title: 'Country Created',
      message: `A new country profile for ${data.name} was added.`,
      type: 'Country',
      eventType: 'country_created',
      entityId: docRef.id
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { ...data, id: String(docRef.id) };
}

export async function updateCountry(id: string | number, data: any) {
  const docRef = doc(db, 'countries', String(id));
  await setDoc(docRef, data, { merge: true });
  
  try {
    await createAdminNotification({
      title: 'Country Updated',
      message: `Country profile for ${data.name || 'Unknown'} was updated.`,
      type: 'Country',
      eventType: 'country_updated',
      entityId: String(id) + '_' + Date.now()
    });
  } catch (e) {}

  return { ...data, id: String(id) };
}

export async function deleteCountry(id: string | number) {
  let countryName = 'Unknown Country';
  try {
     const docRef = doc(db, 'countries', String(id));
     const snap = await getDoc(docRef);
     if (snap.exists()) {
        countryName = snap.data().name || countryName;
     }
  } catch (e) {}

  try {
    const fileRef = ref(storage, `countries/${id}/hero-image`);
    deleteObject(fileRef).catch(e => console.log("Hero image delete failed, ignoring:", e));
  } catch (e) {
    console.log("No hero image found to delete or error deleting.", e);
  }
  await deleteDoc(doc(db, 'countries', String(id)));

  try {
    await createAdminNotification({
      title: 'Country Deleted',
      message: `Country profile for ${countryName} was deleted.`,
      type: 'Country',
      eventType: 'country_deleted',
      entityId: String(id)
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { success: true };
}
