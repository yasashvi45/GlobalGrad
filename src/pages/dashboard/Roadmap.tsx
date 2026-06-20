import React, { useState, useEffect } from 'react';
import { Map, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTable } from '@/lib/api';

export function Roadmap() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profileComplete: false,
    docsUploaded: false,
    uniSaved: false,
    appCreated: false,
    interviewReceived: false,
    visaStarted: false
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [profiles, docs, savedUnis, apps] = await Promise.all([
          getTable('profiles').catch(() => []),
          getTable('documents').catch(() => []),
          getTable('universities_saved').catch(() => []),
          getTable('applications').catch(() => [])
        ]);

        const uid = Number(localStorage.getItem('userId')) || 1;
        const profile = profiles.find((p:any) => p.userId === uid);
        const userDocs = docs.filter((d:any) => d.userId === uid);
        const userSavedUnis = savedUnis.filter((u:any) => u.userId === uid);
        const userApps = apps.filter((a:any) => a.userId === uid);

        const profileComplete = profile?.completionPercentage > 50 ? true : false;
        const docsUploaded = userDocs.length >= 3;
        const uniSaved = userSavedUnis.length >= 1;
        const appCreated = userApps.length >= 1;
        const interviewReceived = userApps.some((a:any) => ['Interview', 'Offer Received', 'Accepted', 'Visa Processing', 'Completed'].includes(a.status));
        const visaStarted = userApps.some((a:any) => ['Visa Processing', 'Completed'].includes(a.status));

        setData({ profileComplete, docsUploaded, uniSaved, appCreated, interviewReceived, visaStarted });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.addEventListener('saved_items_changed', loadData);
    window.addEventListener('profileUpdated', loadData);
    return () => {
      window.removeEventListener('saved_items_changed', loadData);
      window.removeEventListener('profileUpdated', loadData);
    };
  }, []);

  const getStatus = (prevCompleted: boolean, thisCompleted: boolean) => {
    if (thisCompleted) return 'completed';
    if (prevCompleted && !thisCompleted) return 'current';
    return 'upcoming';
  };

  const stages = [
    { id: 1, title: 'Profile Setup', desc: 'Complete your personal and academic information.', status: getStatus(true, data.profileComplete), link: '/app/profile' },
    { id: 2, title: 'Document Vault', desc: 'Upload required documents like SOP, Resume, and Transcripts.', status: getStatus(data.profileComplete, data.docsUploaded), link: '/app/documents' },
    { id: 3, title: 'University Shortlisting', desc: 'Find and save universities that match your profile.', status: getStatus(data.docsUploaded, data.uniSaved), link: '/app/universities' },
    { id: 4, title: 'Applications', desc: 'Start applying to your shortlisted universities.', status: getStatus(data.uniSaved, data.appCreated), link: '/app/applications' },
    { id: 5, title: 'Interviews & Offers', desc: 'Prepare for interviews and track received offers.', status: getStatus(data.appCreated, data.interviewReceived), link: '/app/applications' },
    { id: 6, title: 'Visa & Departure', desc: 'Apply for visa, book tickets, and arrange accommodation.', status: getStatus(data.interviewReceived, data.visaStarted), link: '/app/applications' },
  ];

  const completedCount = stages.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  if (loading) return <div className="p-8 text-center animate-pulse flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
         <div className="relative z-10">
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
               <Map className="w-8 h-8 text-indigo-600" /> Study Abroad Roadmap
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Your personalized journey to studying abroad.</p>
         </div>
         <div className="relative z-10 bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <div className="flex-1">
               <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Progress</p>
               <h3 className="text-2xl font-black text-indigo-700">{progressPercent}%</h3>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 flex items-center justify-center shrink-0">
               <span className="font-bold text-indigo-600 text-sm">{completedCount}/6</span>
            </div>
         </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
         <div className="absolute top-12 bottom-12 left-[31px] sm:left-[39px] w-1 bg-slate-100 rounded-full"></div>
         
         <div className="space-y-8">
            {stages.map((stage) => (
               <div key={stage.id} className="relative z-10 flex gap-6 sm:gap-8 items-start group">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full shrink-0 flex items-center justify-center border-4 border-white shadow-sm transition-colors ${stage.status === 'completed' ? 'bg-emerald-500 text-white' : stage.status === 'current' ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' : 'bg-slate-200 text-slate-400'}`}>
                     {stage.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">{stage.id}</span>}
                  </div>
                  <div className={`flex-1 p-6 rounded-2xl border transition-all ${stage.status === 'current' ? 'bg-indigo-50 border-indigo-200 shadow-md transform hover:-translate-y-1' : stage.status === 'completed' ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                     <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-xl font-bold ${stage.status === 'current' ? 'text-indigo-900' : 'text-slate-900'}`}>{stage.title}</h3>
                        {stage.status === 'current' && <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider bg-white px-2 py-1 rounded border border-indigo-100 shadow-sm">In Progress</span>}
                     </div>
                     <p className={`font-medium ${stage.status === 'current' ? 'text-indigo-700/80' : 'text-slate-500'}`}>{stage.desc}</p>
                     
                     {stage.status === 'current' && (
                        <Link to={stage.link} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 bg-white border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-colors shadow-sm">
                           Continue Task <ArrowRight className="w-4 h-4" />
                        </Link>
                     )}
                     {stage.status === 'completed' && (
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-max">
                           Task Verified
                        </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
