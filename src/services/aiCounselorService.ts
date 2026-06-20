import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, orderBy, deleteDoc, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'ai';
  content?: string;
  type?: 'default' | 'welcome' | 'recommendation' | 'country' | 'scholarship' | 'roadmap';
  data?: any;
  timestamp?: any;
}

export interface AIChatSession {
  sessionId: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: any;
  updatedAt: any;
  lastMessage: string;
  category: string;
}

export async function getUserAIChats(userId: string): Promise<AIChatSession[]> {
  if (!userId) return [];
  const chatsRef = collection(db, 'users', userId, 'aiChats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const validChats: AIChatSession[] = [];
  
  for (const item of snap.docs) {
    const data = item.data() as AIChatSession;
    const updatedAtTime = data.updatedAt?.toDate ? data.updatedAt.toDate().getTime() : data.updatedAt;
    if (updatedAtTime < thirtyDaysAgo) {
      await deleteDoc(item.ref);
    } else {
      validChats.push(data);
    }
  }
  return validChats;
}

export async function saveAIChatSession(userId: string, session: AIChatSession) {
  if (!userId) return;
  const chatRef = doc(db, 'users', userId, 'aiChats', session.sessionId);
  await setDoc(chatRef, {
    ...session,
    updatedAt: Timestamp.now(),
    createdAt: session.createdAt || Timestamp.now(),
  }, { merge: true });
}

export async function deleteAIChatSession(userId: string, sessionId: string) {
  if (!userId) return;
  const chatRef = doc(db, 'users', userId, 'aiChats', sessionId);
  await deleteDoc(chatRef);
}
