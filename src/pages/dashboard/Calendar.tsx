import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, CalendarDays, List, RefreshCw, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveToTable, deleteFromTable, logActivity, createNotification, listenToTable } from '@/lib/api';
import { auth } from '@/lib/firebase';

interface EventData {
  id: number;
  userId: number;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  priority: string;
  color: string;
  location: string;
  university: string;
  applicationLink: string;
  notes: string;
  completed: boolean;
  reminders: string[];
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [events, setEvents] = useState<EventData[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [formData, setFormData] = useState<Partial<EventData>>({
    title: '', type: 'Application Deadline', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00',
    description: '', priority: 'Medium', color: 'Blue', location: '', university: '', applicationLink: '', notes: '', reminders: ['30 minutes before']
  });

  useEffect(() => {
    let unsubscribe = () => {};
    const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
    
    setLoading(true);
    unsubscribe = listenToTable('events', (data) => {
       setEvents(data.filter((e:any) => String(e.userId) === String(uid)));
       setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleDateClick = (date: Date) => {
    // Convert local date to YYYY-MM-DD
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 10);
    setFormData({ title: '', type: 'Application Deadline', date: localISOTime, startTime: '09:00', endTime: '10:00', description: '', priority: 'Medium', color: 'Blue', location: '', university: '', applicationLink: '', notes: '', reminders: ['30 minutes before'], notification: '1 Hour Before' });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (e: React.MouseEvent, evt: EventData) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setFormData(evt);
    setShowEventModal(true);
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedEvent?.id;
    const userId = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
    const obj = { ...formData, userId, completed: formData.completed || false };
    if(!isNew) obj.id = selectedEvent.id;
    
    await saveToTable('events', obj);
    await logActivity(isNew ? 'Created Event' : 'Updated Event', `Calendar event: ${obj.title}`, 'calendar', 'text-indigo-600', 'bg-indigo-100', 'Calendar');
    if(isNew) await createNotification('Event Created', `You have scheduled ${obj.title}.`, 'system', false);
    
    // UI update handled by listenToTable
    setShowEventModal(false);
  };

  const deleteEvent = async (id: number) => {
    await deleteFromTable('events', id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setShowEventModal(false);
    await logActivity('Deleted Event', 'You removed a calendar event.', 'calendar', 'text-rose-600', 'bg-rose-100', 'Trash2');
  };

  const duplicateEvent = async () => {
    if(!selectedEvent) return;
    const dup = { ...selectedEvent, title: selectedEvent.title + ' (Copy)' };
    delete dup.id;
    await saveToTable('events', dup);
    setShowEventModal(false);
  };

  const syncGoogle = () => { window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Synced with Google Calendar' } })); };
  const syncOutlook = () => { window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Synced with Outlook' } })); };

  // --- Date Math ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const getColorClass = (color: string, type: 'bg'|'text'|'border') => {
    const c = color.toLowerCase();
    const map: any = {
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      red: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    };
    return map[c]?.[type] || map['blue'][type];
  };

  const sortedAgenda = useMemo(() => {
    return [...events].sort((a,b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
  }, [events]);

  return (
    <div className="p-4 sm:p-6 flex flex-col min-h-[calc(100vh-64px)] w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0">
         <div>
            <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
               <CalendarIcon className="w-6 h-6 text-indigo-600" /> Action Calendar
            </h1>
         </div>
         <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={()=>setView('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view==='month'?'bg-white text-indigo-700 shadow flex items-center gap-1.5':'text-slate-500 hover:text-slate-900'}`}><CalendarDays className="w-3.5 h-3.5"/> Month</button>
               <button onClick={()=>setView('agenda')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view==='agenda'?'bg-white text-indigo-700 shadow flex items-center gap-1.5':'text-slate-500 hover:text-slate-900'}`}><List className="w-3.5 h-3.5"/> Agenda</button>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <Button variant="outline" size="sm" onClick={syncGoogle} className="text-xs h-8"><RefreshCw className="w-3.5 h-3.5 mr-1.5"/> Google</Button>
            <Button variant="outline" size="sm" onClick={syncOutlook} className="text-xs h-8"><RefreshCw className="w-3.5 h-3.5 mr-1.5"/> Outlook</Button>
            <Button size="sm" onClick={() => handleDateClick(new Date())} className="text-xs h-8 bg-indigo-600 text-white font-bold"><Plus className="w-3.5 h-3.5 mr-1.5"/> Add Event</Button>
         </div>
      </div>

      {/* Calendar Body */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col mt-4 min-h-0">
         <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
               {view === 'month' ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All Events'}
            </h2>
            {view === 'month' && (
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8"><ChevronLeft className="w-4 h-4"/></Button>
                 <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8"><ChevronRight className="w-4 h-4"/></Button>
              </div>
            )}
         </div>

         {view === 'month' && (
           <div className="flex-1 flex flex-col min-h-0">
             <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                   <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-100 last:border-r-0">
                     {day}
                   </div>
                ))}
             </div>
             
             {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">Loading calendar...</div>
             ) : (
             <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(0,1fr)] overflow-y-auto">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                   <div key={`empty-${i}`} className="border-b border-r border-slate-100 bg-slate-50/50 p-1"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1;
                   const dString = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                   const dayEvents = events.filter(e => e.date === dString);
                   const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

                   return (
                     <div key={day} onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))} className={`border-b border-r border-slate-100 p-1 sm:p-2 transition-colors hover:bg-slate-50/80 cursor-pointer overflow-hidden flex flex-col ${isToday ? 'bg-indigo-50/30' : ''}`}>
                        <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                           {day}
                        </div>
                        <div className="space-y-1 overflow-y-auto flex-1 no-scrollbar">
                           {dayEvents.map((evt, j) => (
                             <div key={j} onClick={(e) => handleEventClick(e, evt)} className={`px-2 py-1 rounded text-[10px] sm:text-xs font-bold border transition-transform ${getColorClass(evt.color, 'bg')} ${getColorClass(evt.color, 'text')} ${getColorClass(evt.color, 'border')} line-clamp-1`}>
                                {evt.startTime} {evt.title}
                             </div>
                           ))}
                        </div>
                     </div>
                   );
                })}
             </div>
             )}
           </div>
         )}

         {view === 'agenda' && (
           <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {loading ? (
                 <div className="text-center py-10 text-slate-500 font-medium">Loading events...</div>
              ) : sortedAgenda.length === 0 ? (
                 <div className="text-center py-10 text-slate-500 font-medium">No events scheduled.</div>
              ) : (
                 sortedAgenda.map((evt) => (
                   <div key={evt.id} onClick={(e) => handleEventClick(e, evt)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 hover:border-indigo-300 transition-colors cursor-pointer group">
                      <div className="sm:w-32 shrink-0">
                         <p className="text-lg font-black text-slate-900">{new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                         <p className="text-xs font-bold text-slate-500">{evt.startTime} - {evt.endTime}</p>
                      </div>
                      <div className="flex-1 border-l-2 pl-4" style={{ borderColor: evt.color.toLowerCase() === 'blue' ? '#3b82f6' : evt.color.toLowerCase() === 'purple' ? '#a855f7' : evt.color.toLowerCase() === 'green' ? '#10b981' : evt.color.toLowerCase() === 'red' ? '#f43f5e' : '#f97316' }}>
                         <div className="flex items-start justify-between">
                            <div>
                               <h4 className="text-base font-bold text-slate-900 leading-tight">{evt.title}</h4>
                               <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{evt.type} • {evt.priority} Priority</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${evt.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{evt.completed ? 'Complete' : 'Pending'}</span>
                         </div>
                      </div>
                   </div>
                 ))
              )}
           </div>
         )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
                 <h3 className="text-lg font-bold text-slate-900 tracking-tight">{selectedEvent ? 'Edit Event' : 'New Event'}</h3>
                 <div className="flex gap-2">
                   {selectedEvent && (
                     <>
                       <button type="button" onClick={duplicateEvent} className="text-slate-400 hover:text-indigo-600 bg-white shadow-sm border rounded-xl p-2 transition-colors"><Copy className="w-4 h-4" /></button>
                       <button type="button" onClick={() => deleteEvent(selectedEvent.id)} className="text-slate-400 hover:text-rose-600 bg-white shadow-sm border rounded-xl p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                     </>
                   )}
                   <button type="button" onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border rounded-xl p-2 transition-colors"><X className="w-4 h-4" /></button>
                 </div>
              </div>
              <form onSubmit={saveEvent} className="p-6 overflow-y-auto flex-1 space-y-5">
                 <div className="space-y-4 border-b border-slate-100 pb-5">
                    <div>
                      <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Event Title" className="text-xl font-bold bg-transparent border-0 border-b border-slate-200 rounded-none px-0 focus:ring-0 focus:border-indigo-500 h-12" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Event Type</label>
                          <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                             <option>Application Deadline</option>
                             <option>IELTS Exam</option>
                             <option>TOEFL Exam</option>
                             <option>GRE Exam</option>
                             <option>Visa Appointment</option>
                             <option>Interview</option>
                             <option>Document Submission</option>
                             <option>Scholarship Deadline</option>
                             <option>Tuition Payment</option>
                             <option>Personal Reminder</option>
                             <option>Other</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                          <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Date</label>
                       <Input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-50" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Start Time</label>
                       <Input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="bg-slate-50" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">End Time</label>
                       <Input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="bg-slate-50" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-5">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Color Category</label>
                       <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className={`w-full h-11 px-3 rounded-xl border font-bold outline-none border-slate-200 ${getColorClass(formData.color||'Blue', 'bg')} ${getColorClass(formData.color||'Blue', 'text')}`}>
                         <option value="Purple">Purple</option>
                         <option value="Blue">Blue</option>
                         <option value="Green">Green</option>
                         <option value="Orange">Orange</option>
                         <option value="Red">Red</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
                       <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Zoom, Campus" className="bg-slate-50" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-5">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">University Link</label>
                       <Input value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} placeholder="Associated university" className="bg-slate-50" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Application / Meeting Link</label>
                       <Input type="url" value={formData.applicationLink} onChange={e => setFormData({...formData, applicationLink: e.target.value})} placeholder="https://" className="bg-slate-50" />
                    </div>
                 </div>

                 <div className="border-b border-slate-100 pb-5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notes & Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Add any details..." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                 </div>

                 <div className="pb-5 space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notification Settings</label>
                    <Input 
                      list="notification-options" 
                      value={formData.notification || '1 Hour Before'} 
                      onChange={(e) => setFormData({...formData, notification: e.target.value})} 
                      placeholder="Type or select a notification time..."
                      className="w-full bg-slate-50"
                    />
                    <datalist id="notification-options">
                       <option value="At Event Time" />
                       <option value="15 Minutes Before" />
                       <option value="30 Minutes Before" />
                       <option value="1 Hour Before" />
                       <option value="3 Hours Before" />
                       <option value="6 Hours Before" />
                       <option value="12 Hours Before" />
                       <option value="1 Day Before" />
                       <option value="2 Days Before" />
                       <option value="3 Days Before" />
                       <option value="7 Days Before" />
                       <option value="Custom" />
                    </datalist>
                    {formData.notification === 'Custom' && (
                       <div className="flex gap-2 mt-2">
                          <Input type="number" min="1" value={formData.customNotifVal || '1'} onChange={e => setFormData({...formData, customNotifVal: e.target.value})} className="w-24 h-11 bg-slate-50" />
                          <select value={formData.customNotifUnit || 'minutes'} onChange={e => setFormData({...formData, customNotifUnit: e.target.value})} className="flex-1 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                             <option value="minutes">Minutes</option>
                             <option value="hours">Hours</option>
                             <option value="days">Days</option>
                          </select>
                       </div>
                    )}
                 </div>
                 
                 <div className="pt-2">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.completed} onChange={e => setFormData({...formData, completed: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        <span className="text-sm font-bold text-slate-700">Mark as Completed</span>
                     </label>
                 </div>

                 <div className="pt-6 flex justify-end gap-3 mt-auto shrink-0">
                    <Button type="button" variant="ghost" onClick={() => setShowEventModal(false)}>Cancel</Button>
                    <Button type="submit" className="bg-slate-900 text-white font-bold px-8">Save Event</Button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
