import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createAdminNotification } from '../lib/notificationUtils';

export interface Application {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  universityId: string;
  universityName: string;
  countryId?: string;
  countryName: string;
  programName: string;
  intake: string;
  status: string; // Draft, Documents Pending, Under Review, Applied, Offer Received, Accepted, Visa Processing, Completed, Rejected
  counselorId?: string;
  counselorName?: string;
  notes?: string;
  timeline?: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEvent {
  id: string;
  status: string;
  description: string;
  date: string;
}

const COLLECTION_NAME = 'applications';

export async function getApplications(): Promise<Application[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
  } catch (error) {
    console.error("Error getting applications: ", error);
    return [];
  }
}

export function listenToApplications(callback: (applications: Application[]) => void) {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    callback(apps);
  });
}

export async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newApp = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        id: crypto.randomUUID(),
        status: data.status,
        description: `Application created with status: ${data.status}`,
        date: new Date().toISOString(),
      }
    ]
  };
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), newApp);
  
  if (data.status !== 'Draft') {
     await createAdminNotification({
       title: 'New Application Submitted',
       message: `New application submitted by ${data.studentName || 'Student'} for ${data.universityName}`,
       type: 'application',
       eventType: 'APPLICATION_SUBMITTED',
       entityId: docRef.id,
       userId: data.studentId,
       targetRoute: `/admin/applications/${docRef.id}`
     });
  }

  return docRef.id;
}

export async function updateApplication(id: string, data: Partial<Application>, statusChangeReason?: string): Promise<void> {
  const appRef = doc(db, COLLECTION_NAME, id);
  const updateData: any = { ...data, updatedAt: new Date().toISOString() };
  
  if (data.status) {
    const existingSnap = await getDoc(appRef);
    if (existingSnap.exists()) {
       const existingApp = existingSnap.data() as Application;
       if (existingApp.status !== data.status) {
           const newEvent: ApplicationEvent = {
             id: crypto.randomUUID(),
             status: data.status,
             description: statusChangeReason || `Status updated to ${data.status}`,
             date: new Date().toISOString()
           };
           updateData.timeline = [...(existingApp.timeline || []), newEvent];
           
           await createAdminNotification({
             title: 'Application Status Updated',
             message: `Application for ${existingApp.studentName || 'Student'} at ${existingApp.universityName} changed to ${data.status}`,
             type: 'application',
             eventType: `APPLICATION_STATUS_CHANGED_${data.status.replace(/\s+/g,'_').toUpperCase()}`,
             entityId: id,
             userId: existingApp.studentId,
             targetRoute: `/admin/applications/${id}`
           });
       }
    }
  }

  await updateDoc(appRef, updateData);
}

export async function deleteApplication(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
