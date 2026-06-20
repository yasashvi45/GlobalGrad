import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Bookmark, Upload, Sparkles, LogIn, Search, Filter, Calendar as CalIcon, Settings, User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getTable } from '@/lib/api';

const ICONS: Record<string, any> = {
  ActivityIcon, Bookmark, Upload, Sparkles, LogIn, CalIcon, Settings, User
};

export function Activity() {
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const acts = await getTable('activities').catch(() => []);
      setActivities(acts.filter((a:any) => a.userId === (Number(localStorage.getItem('userId')) || 1)).sort((a:any, b:any) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      setLoading(false);
    }
    load();
    window.addEventListener('activities_changed', load);
    return () => window.removeEventListener('activities_changed', load);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl pointer-events-none"></div>
         <div className="relative z-10 w-full md:w-1/2">
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
               <ActivityIcon className="w-8 h-8 text-indigo-600" /> Activity Timeline
            </h1>
            <p className="text-slate-500 mt-2 font-medium">A chronological history of your interactions on GlobalGrad.</p>
         </div>
         <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
            <div className="relative w-full md:w-64">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <Input 
                 placeholder="Search activity..." 
                 className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
            </div>
            <Button variant="outline" className="h-11 shrink-0"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
         {loading ? (
             <div className="text-center text-slate-500 font-medium py-10">Loading activity...</div>
         ) : activities.length === 0 ? (
             <div className="text-center text-slate-500 font-medium py-10">No activity logged yet.</div>
         ) : (
             <div className="relative border-l-2 border-slate-100 ml-4 space-y-10">
                {activities.filter(a => search === '' || a.title.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase())).map((act) => {
                   const Icon = ICONS[act.iconStr] || ActivityIcon;
                   return (
                     <div key={act.id} className="relative pl-8">
                        <div className={`absolute -left-[17px] top-0.5 w-8 h-8 rounded-full border-4 border-white ${act.bg} ${act.color} flex items-center justify-center`}>
                           <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                           <h4 className="text-lg font-bold text-slate-900 mb-1">{act.title}</h4>
                           <p className="text-slate-600 font-medium mb-1">{act.desc}</p>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{formatDate(act.time)}</p>
                        </div>
                     </div>
                   );
                })}
             </div>
         )}
      </div>
    </div>
  );
}
