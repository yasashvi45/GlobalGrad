import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createAdminNotification } from '@/lib/notificationUtils';

export async function getScholarships() {
  const q = collection(db, 'scholarships');
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export function listenToScholarships(callback: (data: any[]) => void) {
  const q = collection(db, 'scholarships');
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
}

export async function createScholarship(data: any) {
  let docRef = doc(db, 'scholarships', String(data.id || Date.now()));
  await setDoc(docRef, data);

  try {
    await createAdminNotification({
      title: 'Scholarship Created',
      message: `A new scholarship "${data.title || data.name}" was added.`,
      type: 'Scholarship',
      eventType: 'scholarship_created',
      entityId: docRef.id
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { ...data, id: String(docRef.id) };
}

export async function updateScholarship(id: string | number, data: any) {
  const docRef = doc(db, 'scholarships', String(id));
  await setDoc(docRef, data, { merge: true });
  
  try {
    await createAdminNotification({
      title: 'Scholarship Updated',
      message: `Scholarship "${data.title || data.name || 'Unknown'}" was updated.`,
      type: 'Scholarship',
      eventType: 'scholarship_updated',
      entityId: String(id) + '_' + Date.now()
    });
  } catch (e) {}

  return { ...data, id: String(id) };
}

export async function deleteScholarship(id: string | number) {
  let scholarshipTitle = 'Unknown Scholarship';
  try {
     const docRef = doc(db, 'scholarships', String(id));
     const snap = await getDoc(docRef);
     if (snap.exists()) {
        scholarshipTitle = snap.data().title || snap.data().name || scholarshipTitle;
     }
  } catch (e) {}

  await deleteDoc(doc(db, 'scholarships', String(id)));

  try {
    await createAdminNotification({
      title: 'Scholarship Deleted',
      message: `Scholarship "${scholarshipTitle}" was deleted.`,
      type: 'Scholarship',
      eventType: 'scholarship_deleted',
      entityId: String(id)
    });
  } catch (e) {
    console.error('Failed to create notification', e);
  }

  return { success: true };
}

import { SEED_SCHOLARSHIPS } from '../data/seedingScholarships';

export async function syncRealScholarships() {
  const currentSchols = await getScholarships();
  let createdCount = 0;
  let updatedCount = 0;

  for (const seed of SEED_SCHOLARSHIPS) {
    // Check if scholarship with same name exists
    const existing = currentSchols.find((s: any) => s.name?.toLowerCase().trim() === seed.name?.toLowerCase().trim()) as any;
    
    if (existing) {
      // Update missing fields ONLY
      const updatedData: any = { ...existing };
      let updatedAny = false;
      
      for (const [key, val] of Object.entries(seed)) {
        if (existing[key] === undefined || existing[key] === null || existing[key] === '') {
          updatedData[key] = val;
          updatedAny = true;
        }
      }
      
      if (updatedAny) {
        await updateScholarship(existing.id, updatedData);
        updatedCount++;
      }
    } else {
      // Create complete new card, set friendly slug as ID
      const cleanId = seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const dataToSave = { ...seed, id: cleanId, createdAt: new Date().toISOString() };
      await createScholarship(dataToSave);
      createdCount++;
    }
  }

  return { createdCount, updatedCount };
}
