import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, Trash2, Check, Inbox, CheckCheck, Eye, AlertCircle, TrendingUp, HelpCircle, ShieldAlert, RefreshCw, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { deleteFromTable, listenToTable, saveToTable } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'High Priority' | 'AI Alerts' | 'Applications' | 'Students' | 'Universities' | 'Scholarships' | 'Countries' | 'System' | 'Support'>('All');
  const [inbox, setInbox] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [universities, setUniversities] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);

  useEffect(() => {
    let unsubs: any[] = [];
    unsubs.push(listenToTable('universities', setUniversities));
    unsubs.push(listenToTable('countries', setCountries));
    unsubs.push(listenToTable('scholarships', setScholarships));
    return () => unsubs.forEach(u => u && u());
  }, []);

  const dataHealth = useMemo(() => {
     let countriesNeedingReview = 0;
     const thirtyDaysAgo = dayjs().subtract(30, 'day');
     countries.forEach(c => {
        if (!c.updatedAt && !c.createdAt) countriesNeedingReview++;
        else {
           const d = dayjs(c.updatedAt || c.createdAt);
           if (d.isBefore(thirtyDaysAgo)) countriesNeedingReview++;
        }
     });

     let universitiesMissingData = 0;
     universities.forEach(u => {
        if (!u.acceptanceRate || !u.rank || !u.students) universitiesMissingData++;
     });

     return { countriesNeedingReview, universitiesMissingData };
  }, [countries, universities]);

  const recommendedActions = useMemo(() => {
      let actions = [];
      if (dataHealth.countriesNeedingReview > 0) actions.push(`Review ${dataHealth.countriesNeedingReview} country profiles older than 30 days.`);
      if (dataHealth.universitiesMissingData > 0) actions.push(`Update ${dataHealth.universitiesMissingData} universities missing data.`);
      
      const expiringScholarships = scholarships.filter(s => s.deadline && dayjs(s.deadline).isBefore(dayjs().add(30, 'day')));
      if (expiringScholarships.length > 0) actions.push(`Verify ${expiringScholarships.length} scholarship deadlines expiring this month.`);

      return actions;
  }, [dataHealth, scholarships]);

  // Daily Summary data
  const [dailyStats, setDailyStats] = useState({
     newStudents: 0,
     appsSubmitted: 0,
     appsApproved: 0,
     scholExpiring: 0,
     unisUpdated: 0,
     aiAlerts: 0
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToTable('admin_notifications', (data) => {
      const sorted = (data || []).sort((a: any, b: any) => {
         const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
         const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
         return timeB - timeA;
      });
      setInbox(sorted);
      setLoading(false);
      
      // Calculate daily stats from real data for briefing
      const today = new Date();
      today.setHours(0,0,0,0);
      const isToday = (d: any) => {
         if (!d) return false;
         const date = d.toDate?.() || new Date(d);
         return date >= today;
      };

      setDailyStats({
         newStudents: sorted.filter((s:any) => s.type === 'Student' && s.title.toLowerCase().includes('registered') && isToday(s.createdAt)).length,
         appsSubmitted: sorted.filter((s:any) => s.type === 'application' && s.title.toLowerCase().includes('submitted') && isToday(s.createdAt)).length,
         appsApproved: sorted.filter((s:any) => s.type === 'application' && s.title.toLowerCase().includes('approved') && isToday(s.createdAt)).length,
         scholExpiring: sorted.filter((s:any) => s.type === 'Scholarship' && s.title.toLowerCase().includes('expire') && !s.read && s.status !== 'Read').length,
         unisUpdated: sorted.filter((s:any) => s.type === 'University' && s.title.toLowerCase().includes('update') && isToday(s.createdAt)).length,
         aiAlerts: sorted.filter((s:any) => s.type === 'system_alert' && !s.read && s.status !== 'Read').length
      });
    });

    return () => unsubscribe();
  }, []);

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
     e.stopPropagation();
     try {
       await saveToTable('admin_notifications', { id, read: true, status: 'Read' });
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Marked as read' } }));
     } catch(e) {
       console.error(e);
     }
  };

  const handleMarkAllRead = async () => {
     try {
       const unreads = filteredInbox.filter(x => !x.read && x.status !== 'Read');
       for (const item of unreads) {
          await saveToTable('admin_notifications', { id: item.id, read: true, status: 'Read' });
       }
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'All marked as read' } }));
     } catch(e) {
       console.error(e);
     }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
     e.stopPropagation();
     try {
        await deleteFromTable('admin_notifications', id);
        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Notification deleted' } }));
     } catch(e) {
       console.error(e);
     }
  };

  const handleRowClick = async (item: any) => {
    if (!item.read && item.status !== 'Read') {
       await saveToTable('admin_notifications', { id: item.id, read: true, status: 'Read' });
    }
    if (item.targetRoute) {
       navigate(item.targetRoute);
    }
  };

  const [isScanning, setIsScanning] = useState(false);

  const runManualScan = async () => {
    setIsScanning(true);
    try {
      let anomalies = 0;
      let anomalyDetails = [];

      if (dataHealth.countriesNeedingReview > 0) {
         anomalies += dataHealth.countriesNeedingReview;
         anomalyDetails.push(`${dataHealth.countriesNeedingReview} country profiles outdated`);
      }
      if (dataHealth.universitiesMissingData > 0) {
         anomalies += dataHealth.universitiesMissingData;
         anomalyDetails.push(`${dataHealth.universitiesMissingData} universities missing data`);
      }

      const totalRecords = countries.length + universities.length + scholarships.length;
      let msg = `Completed scanning ${totalRecords} records. `;

      if (anomalies > 0) {
         msg += `${anomalies} anomalies detected: ` + anomalyDetails.join(', ') + '.';
      } else {
         msg += 'No anomalies detected. Data health is perfect.';
      }

      await saveToTable('admin_notifications', {
        title: 'Smart Data Health Scan Complete',
        message: msg,
        description: msg,
        type: 'system_alert',
        priority: anomalies > 0 ? 'High' : 'Low',
        read: false,
        status: 'Unread',
        createdAt: new Date().toISOString()
      });
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Database scan completed successfully.' } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to run full scan.', type: 'error' } }));
    } finally {
      setIsScanning(false);
    }
  };

  const filteredInbox = useMemo(() => {
    let result = inbox;
    
    if (activeTab === 'Unread') result = result.filter(item => !item.read && item.status !== 'Read');
    else if (activeTab === 'High Priority') result = result.filter(item => item.priority === 'High');
    else if (activeTab === 'AI Alerts') result = result.filter(item => item.type === 'system_alert');
    else if (activeTab === 'Applications') result = result.filter(item => item.type === 'application');
    else if (activeTab === 'Students') result = result.filter(item => item.type === 'Student' || item.type === 'user_issue');
    else if (activeTab === 'Universities') result = result.filter(item => item.type === 'University');
    else if (activeTab === 'Scholarships') result = result.filter(item => item.type === 'Scholarship');
    else if (activeTab === 'Countries') result = result.filter(item => item.type === 'Country');
    else if (activeTab === 'System') result = result.filter(item => item.type === 'System' || item.type === 'system_alert');
    else if (activeTab === 'Support') result = result.filter(item => item.type === 'support_message');

    if (searchQuery.trim()) {
       const q = searchQuery.toLowerCase();
       result = result.filter(item => 
         item.title?.toLowerCase().includes(q) || 
         item.description?.toLowerCase().includes(q) ||
         item.message?.toLowerCase().includes(q) ||
         item.type?.toLowerCase().includes(q)
       );
    }
    
    return result;
  }, [inbox, activeTab, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Notification Center</h1>
          <p className="text-slate-500 font-medium">Enterprise-grade alert and activity management.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                 <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={handleMarkAllRead} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
             <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        </div>
      </div>

      {/* AI Daily Briefing & Data Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Daily Briefing */}
         <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm"><TrendingUp className="w-6 h-6 text-indigo-300" /></div>
              <div>
                <h2 className="text-xl font-black">GlobalGrad Daily Summary</h2>
                <div className="text-sm font-medium text-indigo-200">{dayjs().format('dddd, MMMM D, YYYY')}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 relative z-10">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">New Students</div>
                  <div className="text-3xl font-black">{dailyStats.newStudents}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Apps Submitted</div>
                  <div className="text-3xl font-black">{dailyStats.appsSubmitted}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Apps Approved</div>
                  <div className="text-3xl font-black">{dailyStats.appsApproved}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-rose-200 text-xs font-bold uppercase tracking-wider mb-1">Schol. Expiring</div>
                  <div className="text-3xl font-black text-rose-100">{dailyStats.scholExpiring}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-amber-200 text-xs font-bold uppercase tracking-wider mb-1">Unis Updated</div>
                  <div className="text-3xl font-black text-amber-100">{dailyStats.unisUpdated}</div>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="text-sky-200 text-xs font-bold uppercase tracking-wider mb-1">AI Alerts</div>
                  <div className="text-3xl font-black text-sky-100">{dailyStats.aiAlerts}</div>
               </div>
            </div>

            <div className="bg-indigo-900/50 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-sm relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Recommended Actions</div>
                <ol className="list-decimal list-inside text-sm font-medium text-indigo-50 space-y-1">
                  {recommendedActions.length > 0 ? recommendedActions.map((action, i) => (
                      <li key={i}>{action}</li>
                  )) : (
                      <li className="list-none text-indigo-200">No recommended actions at this time.</li>
                  )}
                </ol>
              </div>
              <button onClick={() => setActiveTab('AI Alerts')} className="shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-colors">
                 View AI Alerts
              </button>
            </div>
         </div>

         {/* Smart Data Health */}
         <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
               <ShieldAlert className="w-5 h-5 text-rose-500" />
               <h3 className="font-bold text-slate-900">Smart Data Health</h3>
            </div>
            <div className="flex-1 space-y-4">
               {dataHealth.countriesNeedingReview > 0 && (
                 <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl text-rose-800">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold">{dataHealth.countriesNeedingReview} country profiles need review</div>
                      <div className="text-xs opacity-80 font-medium">Older than 30 days</div>
                    </div>
                 </div>
               )}
               {dataHealth.universitiesMissingData > 0 && (
                 <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl text-amber-800">
                    <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold">{dataHealth.universitiesMissingData} universities missing data</div>
                      <div className="text-xs opacity-80 font-medium">Incomplete fields detected</div>
                    </div>
                 </div>
               )}
               <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl text-indigo-800">
                  <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold">Duplicate scan complete</div>
                    <div className="text-xs opacity-80 font-medium">No strict duplicates found</div>
                  </div>
               </div>
               {dataHealth.countriesNeedingReview === 0 && dataHealth.universitiesMissingData === 0 && (
                 <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl text-emerald-800">
                    <CheckCheck className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold">Data health is perfect</div>
                      <div className="text-xs opacity-80 font-medium">No missing data or old records</div>
                    </div>
                 </div>
               )}
            </div>
            <button onClick={runManualScan} disabled={isScanning} className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} 
              {isScanning ? 'Scanning database...' : 'Run Manual Scan'}
            </button>
         </div>
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
         {['All', 'Unread', 'High Priority', 'AI Alerts', 'Applications', 'Students', 'Universities', 'Scholarships', 'Countries', 'System'].map(tab => (
           <button 
             key={tab} 
             onClick={() => setActiveTab(tab as any)} 
             className={`px-4 py-3 font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
           >
             {tab} 
             {tab === 'Unread' && inbox.filter(x => !x.read && x.status !== 'Read').length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{inbox.filter(x => !x.read && x.status !== 'Read').length}</span>}
             {tab === 'AI Alerts' && inbox.filter(x => x.type === 'AI Alert' && !x.read).length > 0 && <span className="ml-2 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{inbox.filter(x => x.type === 'AI Alert' && !x.read).length}</span>}
           </button>
         ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        {loading ? (
           <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <div className="font-bold">Loading inbox...</div>
           </div>
        ) : filteredInbox.length === 0 ? (
           <EmptyState 
              title="No notifications available"
              description="You're all caught up. New alerts and system notifications will appear here based on your filters."
              icon={Inbox}
           />
        ) : (
           <div className="divide-y divide-slate-100">
              <AnimatePresence>
              {filteredInbox.map(item => {
                 const isRead = item.read || item.status === 'Read';
                 const priority = item.priority || 'Low';
                 
                 let priorityColor = "bg-slate-50 text-slate-500 border-slate-200";
                 if (priority === 'High') priorityColor = "bg-rose-50 text-rose-600 border-rose-200";
                 else if (priority === 'Medium') priorityColor = "bg-amber-50 text-amber-600 border-amber-200";
                 
                 let iconBg = "bg-slate-100 text-slate-400";
                 if (!isRead) {
                    if (priority === 'High') iconBg = "bg-rose-100 text-rose-600";
                    else if (priority === 'Medium') iconBg = "bg-amber-100 text-amber-600";
                    else iconBg = "bg-indigo-100 text-indigo-600";
                 }

                 return (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                   key={item.id}
                   onClick={() => handleRowClick(item)}
                   className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors group relative cursor-pointer ${isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-indigo-50/20'}`}
                 >
                   {!isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                   <div className="flex items-start gap-5">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                        {item.type === 'system_alert' ? <Bot className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                     </div>
                     <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h4 className={`text-base truncate ${isRead ? 'font-bold text-slate-700' : 'font-black text-slate-900'}`}>{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${priorityColor}`}>{priority}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">{item.type || 'System'}</span>
                        </div>
                        <p className={`text-sm max-w-2xl mb-3 ${isRead ? 'text-slate-500' : 'text-slate-600 font-medium'} leading-relaxed`}>{item.description || item.message}</p>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                           <span>{dayjs(item.createdAt?.toDate?.() || new Date()).format('MMM D, YYYY h:mm A')}</span>
                           <span className={isRead ? '' : 'text-indigo-600'}>• {isRead ? 'Read' : (item.createdAt ? dayjs(item.createdAt?.toDate?.() || new Date()).fromNow() : 'Unread')}</span>
                        </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleRowClick(item); }} className="px-3 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Details
                      </button>
                      {!isRead && (
                         <button onClick={(e) => handleMarkRead(e, item.id)} className="px-3 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-2" title="Mark Read">
                           <Check className="w-4 h-4" /> Mark Read
                         </button>
                      )}
                      <button onClick={(e) => handleDeleteItem(e, item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Delete">
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                 </motion.div>
                 );
              })}
              </AnimatePresence>
           </div>
        )}
      </div>
    </div>
  );
}
