import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, onSnapshot, query, where, documentId } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  LISTEN = 'listen',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function getQuery(table: string) {
  let q = collection(db, table) as any;
  // If it's a student resource table and we are not explicitly in admin dashboard mode (which runs at /admin path)
  // we restrict the query to the current user to satisfy Firestore rules.
  const studentTables = ['profiles', 'documents', 'universities_saved', 'countries_saved', 'scholarships_saved', 'applications', 'tasks', 'study_preferences', 'test_scores', 'activities', 'events', 'notifications', 'chats', 'messages', 'academic_profiles', 'work_experience'];
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  
  if (studentTables.includes(table) && !isAdminPath && auth.currentUser) {
     if (table === 'messages') {
       // Messages filtering handled manually via custom functions
     } else if (table === 'chats') {
       q = query(q, where('participants', 'array-contains', auth.currentUser.uid));
     } else {
       q = query(q, where('userId', '==', auth.currentUser.uid));
     }
  }
  return q;
}

export async function getTable(table: string) {
  try {
    const studentTables = ['profiles', 'documents', 'universities_saved', 'countries_saved', 'scholarships_saved', 'applications', 'tasks', 'study_preferences', 'test_scores', 'activities', 'events', 'notifications', 'chats', 'messages', 'academic_profiles', 'work_experience'];
    const adminTables = ['users', 'ai_settings', 'settings', 'admin_notes'];
    
    if ((studentTables.includes(table) || adminTables.includes(table)) && !auth.currentUser) {
       return [];
    }

    const q = getQuery(table);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, table);
    return [];
  }
}

export function listenToTable(table: string, callback: (data: any[]) => void) {
  try {
    const studentTables = ['profiles', 'documents', 'universities_saved', 'countries_saved', 'scholarships_saved', 'applications', 'tasks', 'study_preferences', 'test_scores', 'activities', 'events', 'notifications', 'chats', 'messages', 'academic_profiles', 'work_experience'];
    const adminTables = ['users', 'ai_settings', 'settings', 'admin_notes'];
    
    if ((studentTables.includes(table) || adminTables.includes(table)) && !auth.currentUser) {
       callback([]);
       return () => {};
    }

    const q = getQuery(table);
    return onSnapshot(q, (snap: any) => {
      callback(snap.docs.map(d => ({ ...(d.data() as any), id: d.id })));
    }, () => {
      // Intentionally omitting console.error for test environments
    });
  } catch(e) {
    console.error(e);
    return () => {};
  }
}

export async function saveToTable(table: string, data: any) {
  try {
    const studentTables = ['profiles', 'documents', 'universities_saved', 'countries_saved', 'scholarships_saved', 'applications', 'tasks', 'study_preferences', 'test_scores', 'activities', 'events', 'notifications', 'chats', 'messages', 'academic_profiles', 'work_experience'];
    const adminTables = ['users', 'ai_settings', 'settings', 'admin_notes'];
    if ((studentTables.includes(table) || adminTables.includes(table)) && !auth.currentUser) {
       throw new Error("Unauthenticated");
    }

    let docRef;
    if (data.id) {
      docRef = doc(db, table, String(data.id));
      await setDoc(docRef, data);
    } else {
      docRef = await addDoc(collection(db, table), data);
      data.id = docRef.id;
    }
    
    if (table.endsWith('_saved') || table === 'applications') window.dispatchEvent(new Event('saved_items_changed'));
    return { ...data, id: String(data.id || docRef?.id) };
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthenticated") return;
    handleFirestoreError(e, OperationType.WRITE, table);
  }
}

export async function deleteFromTable(table: string, id: any) {
  try {
    const studentTables = ['profiles', 'documents', 'universities_saved', 'countries_saved', 'scholarships_saved', 'applications', 'tasks', 'study_preferences', 'test_scores', 'activities', 'events', 'notifications', 'chats', 'messages', 'academic_profiles', 'work_experience'];
    const adminTables = ['users', 'ai_settings', 'settings', 'admin_notes'];
    if ((studentTables.includes(table) || adminTables.includes(table)) && !auth.currentUser) {
       throw new Error("Unauthenticated");
    }

    await deleteDoc(doc(db, table, String(id)));
    if (table.endsWith('_saved') || table === 'applications') window.dispatchEvent(new Event('saved_items_changed'));
    return { success: true };
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthenticated") return { success: false };
    handleFirestoreError(e, OperationType.DELETE, `${table}/${id}`);
  }
}
