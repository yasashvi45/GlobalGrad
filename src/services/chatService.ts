import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, increment, getDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { createAdminNotification } from '../lib/notificationUtils';

export async function createOrGetChat(studentId: string, adminId: string = 'admin') {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', studentId)
  );
  
  const snap = await getDocs(q);
  const existingChats = snap.docs.filter(d => {
      const parts = d.data().participants || [];
      return parts.includes(adminId);
  });
  
  if (existingChats.length > 0) {
    // Sort by latest updated if possible to keep the most active one
    existingChats.sort((a, b) => {
        const da = a.data().updatedAt?.toMillis?.() || 0;
        const dbTime = b.data().updatedAt?.toMillis?.() || 0;
        return dbTime - da;
    });

    const [primaryChat, ...duplicateChats] = existingChats;
    
    // Clean up duplicates if found in background
    if (duplicateChats.length > 0) {
        duplicateChats.forEach(async (duplicate) => {
            await deleteDoc(doc(db, 'chats', duplicate.id));
            const messagesSnap = await getDocs(query(collection(db, 'messages'), where('chatId', '==', duplicate.id)));
            messagesSnap.forEach(async (m) => await deleteDoc(doc(db, 'messages', m.id)));
        });
    }
    
    return { id: primaryChat.id, ...primaryChat.data() };
  }
  
  const docRef = await addDoc(collection(db, 'chats'), {
    participants: [studentId, adminId],
    updatedAt: serverTimestamp(),
    lastMessage: 'Chat started',
    unreadCountAdmin: 0,
    unreadCountStudent: 0,
    pinnedByAdmin: false,
    archivedByAdmin: false,
    blocked: false,
  });
  
  return { id: docRef.id, participants: [studentId, adminId] };
}

export function listenToUserChats(userId: string, callback: (chats: any[]) => void) {
   const q = query(
       collection(db, 'chats'),
       where('participants', 'array-contains', userId),
       orderBy('updatedAt', 'desc')
   );
   
   return onSnapshot(q, (snap) => {
      const chats = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      // Deduplicate by the other participant
      const uniqueChats = new Map();
      chats.forEach((chat: any) => {
          const otherParticipant = chat.participants?.find((p: string) => p !== userId) || 'unknown';
          if (!uniqueChats.has(otherParticipant)) {
              uniqueChats.set(otherParticipant, chat);
          }
      });
      callback(Array.from(uniqueChats.values()));
   }, (err) => {
       console.error("listenToUserChats error", err);
   });
}

export function listenToMessages(chatId: string, callback: (messages: any[]) => void) {
   if (!chatId) return () => {};
   const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
   );
   
   return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
   }, (err) => console.error("listenToMessages error", err));
}

export async function sendMessage(
  chatId: string, 
  senderId: string, 
  text: string, 
  receiverRole: 'admin' | 'student',
  attachmentUrl: string | null = null,
  attachmentType: 'image' | 'document' | 'voice' | 'video' | null = null,
  fileName: string | null = null,
  fileSize: string | null = null,
) {
   await addDoc(collection(db, 'messages'), {
      chatId,
      senderId,
      text,
      attachmentUrl,
      attachmentType,
      fileName,
      fileSize,
      timestamp: serverTimestamp(),
      read: false,
      delivered: true,
      deleted: false,
   });
   
   const chatRef = doc(db, 'chats', chatId);
   const unreadField = receiverRole === 'admin' ? 'unreadCountAdmin' : 'unreadCountStudent';
   
   let lastMsgDisplay = text;
   if (attachmentType === 'image') lastMsgDisplay = '📷 Image';
   if (attachmentType === 'document') lastMsgDisplay = '📄 Document';
   if (attachmentType === 'voice') lastMsgDisplay = '🎤 Voice Note';

   await updateDoc(chatRef, {
      lastMessage: lastMsgDisplay,
      updatedAt: serverTimestamp(),
      hiddenForStudent: false,
      [unreadField]: increment(1)
   });

   // Add to notifications
   const chatSnap = await getDoc(chatRef);
   if (chatSnap.exists()) {
      const parts = chatSnap.data()?.participants;
      const targetUserId = parts?.find((p: string) => p !== senderId);
      const senderNameDisplay = 'A user';

      if (targetUserId) {
         if (receiverRole === 'admin') {
            await createAdminNotification({
                title: 'New Support Message',
                message: `New support message from ${senderNameDisplay}: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`,
                type: 'support_message',
                eventType: 'NEW_CHAT_MESSAGE',
                entityId: chatId,
                userId: senderId,
                targetRoute: `/admin/messages?chat=${chatId}`
            });
         } else {
            await addDoc(collection(db, 'notifications'), {
               userId: targetUserId,
               title: 'New Message from Support',
               desc: text.length > 50 ? text.substring(0, 50) + '...' : text,
               read: false,
               date: new Date().toISOString()
            });
         }
      }
   }
}

export async function uploadChatFile(file: File, path: string) {
   const ext = file.name.split('.').pop();
   const fileRef = ref(storage, `chats/${path}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`);
   await uploadBytes(fileRef, file);
   const url = await getDownloadURL(fileRef);
   return url;
}

export async function markMessagesRead(chatId: string, userRole: 'admin' | 'student') {
   const chatRef = doc(db, 'chats', chatId);
   const unreadField = userRole === 'admin' ? 'unreadCountAdmin' : 'unreadCountStudent';
   await updateDoc(chatRef, {
      [unreadField]: 0
   });
   
   // Mark individual messages as read too
   const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('read', '==', false)
   );
   const snap = await getDocs(q);
   snap.forEach(async (d) => {
      // If we are admin, mark student's messages read.
      if (userRole === 'admin' && d.data().senderId !== 'admin') {
          await updateDoc(doc(db, 'messages', d.id), { read: true });
      }
      // If we are student, mark admin's messages read
      if (userRole === 'student' && d.data().senderId === 'admin') {
          await updateDoc(doc(db, 'messages', d.id), { read: true });
      }
   });
}

export async function toggleChatPin(chatId: string, pinned: boolean) {
   await updateDoc(doc(db, 'chats', chatId), { pinnedByAdmin: pinned });
}

export async function toggleChatArchive(chatId: string, archived: boolean) {
   await updateDoc(doc(db, 'chats', chatId), { archivedByAdmin: archived });
}

export async function softDeleteMessage(messageId: string) {
   await updateDoc(doc(db, 'messages', messageId), { deleted: true, text: 'This message was deleted' });
}

export async function deleteMessageForMe(messageId: string, userId: string) {
   await updateDoc(doc(db, 'messages', messageId), {
      deletedFor: arrayUnion(userId)
   });
}

export async function deleteChat(chatId: string) {
   await deleteDoc(doc(db, 'chats', chatId));
   const messagesSnap = await getDocs(query(collection(db, 'messages'), where('chatId', '==', chatId)));
   messagesSnap.forEach(async (m) => {
      await deleteDoc(doc(db, 'messages', m.id));
   });
}

export async function hideChatForStudent(chatId: string) {
   await updateDoc(doc(db, 'chats', chatId), { hiddenByStudentAt: serverTimestamp() });
}

export async function setUserTypingState(chatId: string, userId: string, isTyping: boolean) {
   // Assuming a field or separate table, simpler to put standard chat logic:
   await updateDoc(doc(db, 'chats', chatId), {
      [`typing_${userId}`]: isTyping
   });
}
