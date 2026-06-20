import { collection, query, where, getDocs, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { saveToTable } from '@/lib/api';

export type NotificationPriority = 'Low' | 'Medium' | 'High';
export type NotificationType = string | 'support_message' | 'application' | 'document' | 'user_issue' | 'system_alert';

interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  eventType: string;
  entityId: string;
  userId?: string;
  targetRoute?: string;
  priority?: NotificationPriority;
  metadata?: any;
}

export const createAdminNotification = async ({
  title,
  message,
  type,
  eventType,
  entityId,
  userId = '',
  targetRoute = '',
  priority = 'Medium',
  metadata = {}
}: CreateNotificationParams) => {
  try {
    const q = query(
      collection(db, 'admin_notifications'),
      where('eventType', '==', eventType),
      where('entityId', '==', String(entityId))
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      return; // Prevent duplicate events
    }
    
    await saveToTable('admin_notifications', {
      title,
      message,
      type,
      eventType,
      entityId: String(entityId),
      userId,
      targetRoute,
      priority,
      read: false,
      status: 'Unread',
      metadata,
      createdAt: Timestamp.now()
    });

    // Cleanup old notifications (older than 30 days)
    try {
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const oldQ = query(
        collection(db, 'admin_notifications'),
        where('createdAt', '<', thirtyDaysAgo)
      );
      const oldSnap = await getDocs(oldQ);
      const batch = oldSnap.docs.map(d => deleteDoc(doc(db, 'admin_notifications', d.id)));
      await Promise.all(batch);
    } catch (e) {
      console.warn("Cleanup old notifications failed", e);
    }
  } catch (error) {
    console.error('Failed to create admin notification:', error);
  }
};


