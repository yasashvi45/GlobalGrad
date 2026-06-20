import { getTable, listenToTable, saveToTable, deleteFromTable } from '../services/dbService';
import { auth } from './firebase';

export { getTable, listenToTable, saveToTable, deleteFromTable };

export async function createNotification(title: string, desc: string, type: 'document'|'deadline'|'scholarship'|'system'|'ai' = 'system', important: boolean = false) {
  await saveToTable('notifications', {
    userId: auth.currentUser?.uid || localStorage.getItem('userId') || '1',
    title,
    desc,
    type,
    important,
    read: false,
    date: new Date().toISOString()
  });
  window.dispatchEvent(new Event('notifications_changed'));
}

export async function logActivity(title: string, desc: string, type: 'login' | 'upload' | 'save' | 'ai' | 'calendar' | 'system' | 'app', color: string = 'text-slate-600', bg: string = 'bg-slate-100', iconStr: string = 'Activity') {
  await saveToTable('activities', {
    userId: auth.currentUser?.uid || localStorage.getItem('userId') || '1',
    title,
    desc,
    type,
    color,
    bg,
    iconStr,
    time: new Date().toISOString()
  });
  window.dispatchEvent(new Event('activities_changed'));
}
