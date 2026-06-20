import React, { useState, useEffect } from 'react';
import { Bell, Search, CheckCircle2, AlertCircle, Clock, Trash2, Check, BellRing } from 'lucide-react';
import { getTable, saveToTable, deleteFromTable } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    load();
  }, [user?.uid]);

  async function load() {
    setLoading(true);
    const notifs = await getTable('notifications').catch(() => []);
    const userId = user?.uid || localStorage.getItem('userId') || '1';
    setNotifications(notifs.filter((n:any) => String(n.userId) === String(userId)).sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => saveToTable('notifications', { ...n, read: true })));
    setNotifications(notifications.map(n => ({...n, read: true})));
    window.dispatchEvent(new Event('notifications_changed'));
  };

  const markRead = async (id: number) => {
    const n = notifications.find(n => n.id === id);
    if (!n) return;
    const updated = { ...n, read: true };
    await saveToTable('notifications', updated);
    setNotifications(notifications.map(n => n.id === id ? updated : n));
    window.dispatchEvent(new Event('notifications_changed'));
  };

  const markUnread = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const n = notifications.find(n => n.id === id);
    if (!n) return;
    const updated = { ...n, read: false };
    await saveToTable('notifications', updated);
    setNotifications(notifications.map(n => n.id === id ? updated : n));
    window.dispatchEvent(new Event('notifications_changed'));
  };

  const deleteNotif = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFromTable('notifications', id);
    setNotifications(notifications.filter(n => n.id !== id));
    window.dispatchEvent(new Event('notifications_changed'));
  };

  const clearAll = async () => {
    await Promise.all(notifications.map(n => deleteFromTable('notifications', n.id)));
    setNotifications([]);
    window.dispatchEvent(new Event('notifications_changed'));
  };

  const filtered = notifications.filter(n => {
    if(filter === 'unread' && n.read) return false;
    if(filter === 'important' && !n.important) return false;
    if(filter === 'system' && n.type !== 'system') return false;
    if(filter === 'ai' && n.type !== 'ai') return false;
    if(search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'deadline': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'scholarship': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'document': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'ai': return <BellRing className="w-5 h-5 text-indigo-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Notifications...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-3/4">
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Bell className="w-8 h-8 text-indigo-500 fill-indigo-500" />
            Notification Center
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Stay updated on your application deadlines, match scores, and AI recommendations.</p>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <Button variant="outline" onClick={markAllRead} className="h-10 border-slate-200 hover:bg-slate-50">Mark All Read</Button>
          <Button variant="outline" onClick={() => window.print()} className="h-10 border-slate-200 hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export
          </Button>
          <Button variant="outline" onClick={clearAll} className="h-10 border-slate-200 hover:bg-rose-50 hover:text-rose-600">Clear All</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
            <p className="text-xs font-bold uppercase text-slate-500 mb-3 px-3">Filters</p>
            <button onClick={() => setFilter('all')} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>All Notifications</button>
            <button onClick={() => setFilter('unread')} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors flex justify-between items-center ${filter === 'unread' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
               Unread
               <span className="bg-indigo-100 text-indigo-600 px-2 rounded-md text-[10px]">{notifications.filter(n=>!n.read).length}</span>
            </button>
            <button onClick={() => setFilter('important')} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'important' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Important</button>
            <button onClick={() => setFilter('ai')} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'ai' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>AI Suggestions</button>
            <button onClick={() => setFilter('system')} className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${filter === 'system' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>System</button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="relative">
             <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..." className="pl-12 h-12 rounded-2xl border-slate-200 bg-white" />
          </div>

          <div className="space-y-3">
             <AnimatePresence>
               {filtered.map(notif => (
                 <motion.div 
                   key={notif.id}
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                   className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${!notif.read ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white'}`}
                   onClick={() => markRead(notif.id)}
                 >
                   <div className="flex gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!notif.read ? 'bg-indigo-50 border border-indigo-100' : 'bg-white border border-slate-200'}`}>
                       {getIcon(notif.type)}
                     </div>
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</h4>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                          {notif.important && <span className="text-[10px] bg-rose-100 text-rose-600 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Important</span>}
                       </div>
                       <p className="text-sm font-medium text-slate-500">{notif.desc}</p>
                       <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wider">{new Date(notif.date).toLocaleString()}</p>
                     </div>
                   </div>

                   <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end">
                      {notif.read ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={(e) => markUnread(notif.id, e)} title="Mark as unread">
                          <Check className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" onClick={(e) => { e.stopPropagation(); markRead(notif.id); }} title="Mark as read">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={(e) => deleteNotif(notif.id, e)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
             {filtered.length === 0 && (
               <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No notifications found</h3>
                  <p className="text-slate-500 font-medium">You're all caught up!</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
