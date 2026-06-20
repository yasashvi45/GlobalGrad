import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Plus, CheckCircle2, MoreHorizontal, GraduationCap, MapPin, Calendar, Clock, Sparkles, X, AlignLeft, Paperclip, CheckSquare, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveToTable, deleteFromTable, createNotification, logActivity, listenToTable } from '@/lib/api';
import { auth } from '@/lib/firebase';

interface Application {
  id: number;
  userId: number;
  universityId: number; // We'll just display a random uni name for now or use program
  program: string;
  universityName: string;
  country: string;
  term: string;
  status: string;
  deadline: string;
  fee: string;
  priority: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'Researching', title: 'Researching', color: 'slate' },
  { id: 'Preparing Docs', title: 'Preparing Docs', color: 'orange' },
  { id: 'Applied', title: 'Applied', color: 'blue' },
  { id: 'Interview', title: 'Interview', color: 'purple' },
  { id: 'Offer Received', title: 'Offer Received', color: 'indigo' },
  { id: 'Visa Process', title: 'Visa Process', color: 'teal' },
  { id: 'Accepted', title: 'Accepted', color: 'emerald' },
  { id: 'Rejected', title: 'Rejected', color: 'rose' },
  { id: 'Deferred', title: 'Deferred', color: 'amber' },
  { id: 'Completed', title: 'Completed', color: 'slate' },
];

export function Tracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [dbUniversities, setDbUniversities] = useState<any[]>([]);
  const [dbCountries, setDbCountries] = useState<any[]>([]);
  const [draggedApp, setDraggedApp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Application | null>(null);

  // New app form state
  const [newApp, setNewApp] = useState({
     universityName: '', program: '', country: '', term: 'Fall 2026', deadline: '', fee: '0', currency: 'USD', priority: 'Medium', status: 'Researching', targetDegree: 'Master'
  });

  useEffect(() => {
    let unsubscribeApp = () => {};
    let unsubscribeDocs = () => {};
    let unsubscribeTasks = () => {};
    let unsubscribeUnis = () => {};
    let unsubscribeCountries = () => {};
    
    const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';

    async function load() {
      try {
        setLoading(true);
        unsubscribeApp = listenToTable('applications', (data) => {
          setApplications(data.filter((a:any) => String(a.userId) === String(uid)));
        });
        unsubscribeTasks = listenToTable('tasks', (data) => {
          setTasks(data.filter((t:any) => String(t.userId) === String(uid)));
        });
        unsubscribeDocs = listenToTable('documents', (data) => {
          setDocuments(data.filter((d:any) => String(d.userId) === String(uid)));
        });
        unsubscribeUnis = listenToTable('universities', setDbUniversities);
        unsubscribeCountries = listenToTable('countries', setDbCountries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      unsubscribeApp();
      unsubscribeDocs();
      unsubscribeTasks();
      unsubscribeUnis();
      unsubscribeCountries();
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, appId: number) => {
    setDraggedApp(appId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = e.target as HTMLElement;
      el.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.target as HTMLElement;
    el.style.opacity = '1';
    setDraggedApp(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedApp) return;

    const app = applications.find(a => a.id === draggedApp);
    if (!app || app.status === targetStatus) return;

    const updatedApp = { ...app, status: targetStatus, userId: (Number(localStorage.getItem('userId')) || 1) };
    
    // Optimistic UI update
    setApplications(prev => prev.map(a => a.id === draggedApp ? updatedApp : a));
    
    // DB persist
    await saveToTable('applications', updatedApp);
    await logActivity('Application Updated', `Moved ${app.name} to ${targetStatus}`, 'app', 'text-amber-600', 'bg-amber-100', 'Target');
    
    if (targetStatus === 'Accepted') {
       await createNotification('Application Accepted! 🎉', `Congratulations on your acceptance to ${app.name} - ${app.program}!`, 'system', true);
    }
  };

  const saveNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.universityName || !newApp.program) return;
    
    const obj = { 
       name: newApp.universityName, 
       location: newApp.country, 
       program: newApp.program,
       term: newApp.term,
       deadline: newApp.deadline,
       priority: newApp.priority,
       status: newApp.status,
       fee: newApp.fee,
       userId: (Number(localStorage.getItem('userId')) || 1), 
       universityId: Math.floor(Math.random() * 1000) 
    };
    const saved = await saveToTable('applications', obj);
    setApplications(prev => [...prev, saved]);
    setShowNewModal(false);
    setNewApp({ universityName: '', program: '', country: '', term: 'Fall 2026', deadline: '', fee: '0', currency: 'USD', priority: 'Medium', status: 'Researching', targetDegree: 'Master' });
    await createNotification('Application Tracked', `Started tracking your application to ${obj.name} - ${obj.program}.`, 'system', false);
    await logActivity('Created Application', `Created application for ${obj.name} (${obj.program}).`, 'app', 'text-amber-600', 'bg-amber-100', 'Target');
  };

  const removeApplication = async (id: number) => {
    await deleteFromTable('applications', id);
    setApplications(prev => prev.filter(a => a.id !== id));
    setShowDetailModal(null);
  }

  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const handleToggleTask = async (taskId: number) => {
     const task = tasks.find(t => t.id === taskId);
     if(!task) return;
     const updated = {...task, completed: !task.completed};
     setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
     await saveToTable('tasks', updated);
  };

  const handleAddTask = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!newTaskTitle.trim() || !showDetailModal) return;
     const created = await saveToTable('tasks', {
        title: newTaskTitle,
        applicationId: showDetailModal.id,
        userId: (Number(localStorage.getItem('userId')) || 1),
        completed: false
     });
     setTasks([...tasks, created]);
     setNewTaskTitle('');
  };
  
  const handleDeleteTask = async (taskId: number, e: React.MouseEvent) => {
     e.stopPropagation();
     await deleteFromTable('tasks', taskId);
     setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Tracker...</div>;

  // Analytics
  const total = applications.length;
  const appliedOrLater = applications.filter(a => !['Researching', 'Preparing Docs'].includes(a.status)).length;
  const offers = applications.filter(a => ['Offer Received', 'Visa Process', 'Accepted', 'Completed'].includes(a.status)).length;
  const accRate = appliedOrLater > 0 ? Math.round((offers / appliedOrLater) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12 flex flex-col h-full min-h-[calc(100vh-140px)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-3/4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase tracking-wider mb-3">
             <Sparkles className="w-3.5 h-3.5" /> Auto-Sync Active
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Target className="w-8 h-8 text-orange-500" />
            Application Tracker
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your university applications across all stages. Drag and drop to update statuses.</p>
          
          <div className="flex gap-6 mt-6">
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total</p>
                <p className="text-2xl font-black text-slate-900">{total}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Submitted</p>
                <p className="text-2xl font-black text-blue-600">{appliedOrLater}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Offers</p>
                <p className="text-2xl font-black text-emerald-600">{offers}</p>
             </div>
             <div className="pl-6 border-l border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Accept Rate</p>
                <p className="text-2xl font-black text-slate-900">{accRate}%</p>
             </div>
          </div>
        </div>
        <div className="relative z-10 shrink-0">
           <Button onClick={() => setShowNewModal(true)} className="bg-slate-900 text-white font-bold h-11 px-6 rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Application</Button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200">
           <div className="w-24 h-24 rounded-[3rem] bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 shadow-sm">
             <Target className="w-10 h-10 text-orange-500" />
           </div>
           <h3 className="text-3xl font-display font-black text-slate-900 mb-3 tracking-tight">No Applications Yet</h3>
           <p className="mb-8 max-w-md text-lg text-slate-500">You haven't added any university applications to track. Start tracking your journey now.</p>
           <Button onClick={() => setShowNewModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 h-12 shadow-md shadow-orange-500/20">
             <Plus className="w-4 h-4 mr-2" />
             Create Application
           </Button>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex-1 min-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {COLUMNS.map(col => {
          const colApps = applications.filter(a => a.status === col.id);
          
          return (
            <div 
              key={col.id} 
              className={`flex flex-col w-[320px] shrink-0 rounded-3xl bg-slate-50 border border-slate-200/60 p-4 transition-colors ${draggedApp ? 'border-dashed border-slate-300 bg-slate-100/50' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full bg-${col.color}-500 shadow-sm`}></span>
                  <h3 className="font-bold text-slate-900 tracking-tight">{col.title}</h3>
                  <span className="bg-slate-200/70 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{colApps.length}</span>
                </div>
                <button onClick={() => { setNewApp(prev => ({...prev, status: col.id})); setShowNewModal(true); }} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-200/50">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pb-2">
                {colApps.map((app) => (
                  <div 
                    key={app.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setShowDetailModal(app)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group relative"
                  >
                    <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 transition-all p-1 rounded-md hover:bg-slate-50">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <div className="flex justify-between items-start mb-3 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight hover:text-indigo-600 truncate">{app.name || `Univ #${app.universityId}`}</h4>
                      </div>
                    </div>
                    
                    <p className="text-xs font-bold text-slate-500 mb-3 line-clamp-1">{app.program}</p>
                    
                    <div className="space-y-2 mb-4">
                      {app.location && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {app.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Term: {app.term}
                      </div>
                      {app.deadline && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-1 rounded w-fit border border-rose-100">
                          <Calendar className="w-3.5 h-3.5" /> Due: {new Date(app.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center mt-3">
                      {col.id === 'Accepted' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wider font-bold rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3 break-keep" /> WON</span>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${app.priority === 'High' ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-400'}`}>
                           <Clock className="w-3 h-3" /> Priority: {app.priority || 'Med'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {colApps.length === 0 && (
                  <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      )}

      {showNewModal && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
               <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">New Application</h3>
                  <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border rounded-full p-2"><X className="w-4 h-4" /></button>
               </div>
               <form onSubmit={saveNewApplication} className="p-6 space-y-4 overflow-y-auto">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">University Name</label>
                     <div className="relative">
                        <Input required value={newApp.universityName} onChange={e => setNewApp({...newApp, universityName: e.target.value})} placeholder="Start typing to search universities..." className="bg-slate-50 font-bold text-slate-900" />
                        {newApp.universityName.length > 0 && dbUniversities.filter(u => u.name.toLowerCase().includes(newApp.universityName.toLowerCase()) && u.name !== newApp.universityName).length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {dbUniversities.filter(u => u.name.toLowerCase().includes(newApp.universityName.toLowerCase()) && u.name !== newApp.universityName).slice(0, 5).map(u => (
                              <button key={u.id} type="button" onClick={() => setNewApp({...newApp, universityName: u.name, country: u.location || newApp.country})} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700">
                                {u.name}
                              </button>
                            ))}
                          </div>
                        )}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target Degree</label>
                        <select required value={newApp.targetDegree || 'Master'} onChange={e => setNewApp({...newApp, targetDegree: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="Bachelor">Bachelor</option>
                           <option value="Master">Master</option>
                           <option value="MBA">MBA</option>
                           <option value="PhD">PhD</option>
                           <option value="Diploma">Diploma</option>
                           <option value="Certificate">Certificate</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Degree & Program</label>
                        <div className="relative">
                           <Input required value={newApp.program} onChange={e => setNewApp({...newApp, program: e.target.value})} placeholder="Search or custom..." className="bg-slate-50" />
                           {newApp.program.length > 0 && ['MS Computer Science', 'MS Data Science', 'MS AI', 'MBA', 'MEng Mechanical', 'MEng Civil', 'MSc Cybersecurity'].filter(p => p.toLowerCase().includes(newApp.program.toLowerCase()) && p !== newApp.program).length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {['MS Computer Science', 'MS Data Science', 'MS AI', 'MBA', 'MEng Mechanical', 'MEng Civil', 'MSc Cybersecurity'].filter(p => p.toLowerCase().includes(newApp.program.toLowerCase()) && p !== newApp.program).map(p => (
                                  <button key={p} type="button" onClick={() => setNewApp({...newApp, program: p})} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700">{p}</button>
                                ))}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Country</label>
                        <div className="relative">
                           <Input required value={newApp.country} onChange={e => setNewApp({...newApp, country: e.target.value})} placeholder="Search country..." className="bg-slate-50" />
                           {newApp.country.length > 0 && dbCountries.filter(c => c.name.toLowerCase().includes(newApp.country.toLowerCase()) && c.name !== newApp.country).length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {dbCountries.filter(c => c.name.toLowerCase().includes(newApp.country.toLowerCase()) && c.name !== newApp.country).slice(0, 5).map(c => (
                                  <button key={c.id} type="button" onClick={() => setNewApp({...newApp, country: c.name})} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <span className="text-lg leading-none">{c.flag || '🏳️'}</span> {c.name}
                                  </button>
                                ))}
                              </div>
                           )}
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Intake Term</label>
                        <select required value={newApp.term} onChange={e => setNewApp({...newApp, term: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="Spring 2026">Spring 2026</option>
                           <option value="Summer 2026">Summer 2026</option>
                           <option value="Fall 2026">Fall 2026</option>
                           <option value="Winter 2026">Winter 2026</option>
                           <option value="Spring 2027">Spring 2027</option>
                           <option value="Summer 2027">Summer 2027</option>
                           <option value="Fall 2027">Fall 2027</option>
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Application Status</label>
                        <select required value={newApp.status} onChange={e => setNewApp({...newApp, status: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="Researching">Researching</option>
                           <option value="Preparing Docs">Preparing Documents</option>
                           <option value="Applied">Applied</option>
                           <option value="Interview">Interview</option>
                           <option value="Offer Received">Offer Received</option>
                           <option value="Rejected">Rejected</option>
                           <option value="Accepted">Accepted</option>
                           <option value="Visa Processing">Visa Processing</option>
                           <option value="Completed">Completed</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Deadline</label>
                        <Input type="date" value={newApp.deadline} onChange={e => setNewApp({...newApp, deadline: e.target.value})} className="bg-slate-50" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                        <select value={newApp.priority} onChange={e => setNewApp({...newApp, priority: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Application Fee</label>
                     <div className="flex gap-2">
                        <select value={newApp.currency || 'USD'} onChange={e => setNewApp({...newApp, currency: e.target.value})} className="w-24 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="USD">USD</option>
                           <option value="GBP">GBP</option>
                           <option value="EUR">EUR</option>
                           <option value="AUD">AUD</option>
                           <option value="CAD">CAD</option>
                           <option value="INR">INR</option>
                        </select>
                        <Input type="number" required min="0" value={newApp.fee} onChange={e => setNewApp({...newApp, fee: e.target.value})} placeholder="0" className="bg-slate-50 flex-1" />
                     </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                     <Button type="button" variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
                     <Button type="submit" className="bg-slate-900 text-white font-bold h-11 px-6 rounded-xl">Save Application</Button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showDetailModal && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
               <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <GraduationCap className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{showDetailModal.name || `University #${showDetailModal.universityId}`}</h3>
                        <p className="text-sm font-bold text-slate-500">{showDetailModal.program}</p>
                     </div>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm border rounded-full p-2"><X className="w-4 h-4" /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                     
                     {/* Premium Health Score Card */}
                     <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex items-center justify-between mb-4">
                           <h4 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5" /> Application Health</h4>
                           <span className="text-2xl font-black bg-white/20 px-3 py-1 rounded-xl">
                              {Math.floor(Math.random() * 20) + 75}%
                           </span>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between text-xs font-medium bg-white/10 p-2 rounded-lg">
                              <span>Profile Match Strength</span>
                              <span className="font-bold">High</span>
                           </div>
                           <div className="flex justify-between text-xs font-medium bg-white/10 p-2 rounded-lg">
                              <span>Missing Documents</span>
                              <span className="font-bold text-amber-200">{Math.max(0, 4 - documents.length)} Required</span>
                           </div>
                           <div className="flex justify-between text-xs font-medium bg-white/10 p-2 rounded-lg">
                              <span>Interview Readiness</span>
                              <span className="font-bold text-emerald-200">Prepared</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                           <p className="font-black text-slate-900">{showDetailModal.status}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                           <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider mb-1">Priority</p>
                           <p className="font-black text-amber-700">{showDetailModal.priority || 'Medium'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Term</p>
                           <p className="font-black text-slate-900">{showDetailModal.term}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deadline</p>
                           <p className="font-black text-rose-600">{showDetailModal.deadline ? new Date(showDetailModal.deadline).toLocaleDateString() : 'Not Set'}</p>
                        </div>
                     </div>

                     {/* AI Recommendations */}
                     <div className="border border-purple-200 bg-purple-50 rounded-2xl p-4 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 text-purple-700">
                           <Sparkles className="w-4 h-4" />
                           <h4 className="font-bold text-sm">AI Recommendations</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-purple-900/80 font-medium list-disc list-inside">
                           <li>Focus your SOP on undergraduate research projects.</li>
                           <li>Request recommendation from Prof. Smith by next week.</li>
                           <li>Highlight leadership experience in student clubs.</li>
                        </ul>
                     </div>

                     {/* Status Timeline */}
                     <div>
                        <h4 className="font-bold text-slate-900 mb-3 tracking-tight">Timeline</h4>
                        <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                           {COLUMNS.map((col, idx) => {
                              const isActive = showDetailModal.status === col.id;
                              const isPast = COLUMNS.findIndex(c => c.id === showDetailModal.status) > idx;
                              return (
                                 <div key={col.id} className={`flex items-center gap-4 relative z-10 ${isActive ? 'opacity-100' : (isPast ? 'opacity-70' : 'opacity-40 grayscale')}`}>
                                    <div className={`w-3 h-3 rounded-full shrink-0 border-2 bg-white ${isActive ? 'border-indigo-600 ring-4 ring-indigo-50' : (isPast ? 'border-slate-800' : 'border-slate-300')}`} />
                                    <p className={`text-xs font-bold ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>{col.title}</p>
                                 </div>
                              )
                           })}
                        </div>
                     </div>

                     <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 tracking-tight"><AlignLeft className="w-4 h-4 text-slate-400" /> Notes</h4>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                           <textarea className="w-full bg-transparent resize-none outline-none text-slate-700 min-h-[100px]" placeholder="Add your notes here..."></textarea>
                        </div>
                     </div>

                     <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 tracking-tight"><CheckSquare className="w-4 h-4 text-slate-400" /> Application Tasks</h4>
                        <div className="space-y-2">
                           {tasks.filter(t => t.applicationId === showDetailModal.id).map(task => (
                              <label key={task.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors group">
                                 <div className="flex items-center gap-3 line-clamp-1">
                                   <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-600" />
                                   <span className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                                 </div>
                                 <button onClick={(e) => handleDeleteTask(task.id, e)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <X className="w-4 h-4" />
                                 </button>
                              </label>
                           ))}
                           <form onSubmit={handleAddTask} className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                             <Input 
                               value={newTaskTitle}
                               onChange={(e) => setNewTaskTitle(e.target.value)}
                               placeholder="New task..."
                               className="flex-1 bg-slate-50 border-transparent focus:bg-white"
                             />
                             <Button type="submit" disabled={!newTaskTitle.trim()} className="bg-indigo-600 text-white font-bold"><Plus className="w-4 h-4" /></Button>
                           </form>
                        </div>
                     </div>
                  </div>

                  <div className="w-full md:w-64 space-y-6">
                     <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 tracking-tight"><Paperclip className="w-4 h-4 text-slate-400" /> Required Documents</h4>
                        <div className="space-y-3">
                           {documents.length === 0 ? (
                              <p className="text-xs text-slate-500 font-medium p-4 bg-slate-50 rounded-xl text-center">No documents uploaded</p>
                           ) : (
                              documents.map((doc) => (
                                 <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group cursor-pointer hover:bg-slate-100">
                                    <div className="flex items-center gap-2 truncate">
                                       <div className={`w-2 h-2 rounded-full shrink-0 ${doc.status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                       <span className="text-xs font-bold text-slate-700 truncate">{doc.title || doc.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{doc.status || 'Pending'}</span>
                                 </div>
                              ))
                           )}
                           <Button asChild variant="outline" className="w-full mt-2 h-8 text-xs font-bold border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300">
                             <Link to="/app/documents">Manage Documents</Link>
                           </Button>
                        </div>
                     </div>

                     <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wider mb-2">Application Fee</p>
                        <p className="font-black text-rose-700 text-2xl">${showDetailModal.fee || '0'}</p>
                     </div>

                     <Button onClick={() => removeApplication(showDetailModal.id)} variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 font-bold mt-4">
                        Delete Application
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
