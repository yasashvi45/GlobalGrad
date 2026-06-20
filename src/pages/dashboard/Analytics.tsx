import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { getTable } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [docs, setDocs] = useState<any[]>([]);
  const [tests, setTests] = useState<any>({});
  
  useEffect(() => {
    async function loadData() {
      const [allApps, profiles, _, docsres, __, t] = await Promise.all([
         getTable('applications').catch(()=>[]),
         getTable('profiles').catch(()=>[]),
         getTable('universities_saved').catch(()=>[]),
         getTable('documents').catch(()=>[]),
         getTable('study_preferences').catch(()=>[]),
         getTable('test_scores').catch(()=>[])
      ]);
      const uid = Number(localStorage.getItem('userId')) || 1;
      setApps(allApps.filter((a:any) => a.userId === uid));
      setProfile(profiles.find((p:any) => p.userId === uid) || {});
      setDocs(docsres.filter((d:any) => d.userId === uid));
      setTests(t.find((x:any)=>x.userId===uid) || {});
      setLoading(false);
    }
    loadData();
    window.addEventListener('saved_items_changed', loadData);
    window.addEventListener('profileUpdated', loadData);
    return () => {
      window.removeEventListener('saved_items_changed', loadData);
      window.removeEventListener('profileUpdated', loadData);
    };
  }, []);

  // Compute stats
  const totalApps = apps.length;
  const accepted = apps.filter(a => a.status === 'Accepted').length;
  const interviewing = apps.filter(a => a.status === 'Interview').length;
  const submitted = apps.filter(a => !['Researching', 'Preparing Documents'].includes(a.status)).length;
  const acceptedRate = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0;
  
  // Funnel Data
  const funnelData = [
    { name: 'Researching', count: apps.filter(a => a.status === 'Researching').length },
    { name: 'Preparing', count: apps.filter(a => a.status === 'Preparing Documents').length },
    { name: 'Applied', count: apps.filter(a => a.status === 'Applied').length },
    { name: 'Interview', count: apps.filter(a => a.status === 'Interview').length },
    { name: 'Offered', count: apps.filter(a => ['Offer Received', 'Accepted', 'Visa Processing', 'Completed'].includes(a.status)).length }
  ].filter(d => d.count > 0);

  // Country dist
  const countryCounts = apps.reduce((acc: any, curr: any) => {
    acc[curr.location] = (acc[curr.location] || 0) + 1;
    return acc;
  }, {});
  const countryData = Object.keys(countryCounts).map(k => ({ name: k || 'Unknown', value: countryCounts[k] }));

  // Profile
  let profileScore = profile.completionPercentage || 0;
  if (!profile.completionPercentage) {
    profileScore = 20;
    if (profile.firstName) profileScore += 20;
    if (profile.email) profileScore += 20;
    if (docs.length > 0) profileScore += docs.length * 10;
    profileScore = Math.min(100, profileScore);
  }

  const missingDocs = [];
  if (!docs.find(d => d.type?.includes("SOP"))) missingDocs.push("SOP");
  if (!docs.find(d => d.type?.includes("Resume"))) missingDocs.push("Resume");
  if (!docs.find(d => d.type?.includes("Passport"))) missingDocs.push("Passport");

  const missingScores = [];
  if (!tests.ielts && !tests.toefl && !tests.pte) missingScores.push("English Test");
  if (!tests.gre && !tests.gmat) missingScores.push("Standardized Test");

  // Financial Estimation (Fee total + Budget)
  const totalFees = apps.reduce((sum, curr) => sum + (parseFloat(curr.fee) || 0), 0);
  const tuitionCost = totalFees * 0.8;
  const livingCost = totalFees * 0.2;

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl pointer-events-none"></div>
         <div className="relative z-10 w-full md:w-1/2">
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
               <TrendingUp className="w-8 h-8 text-indigo-600" /> Performance Analytics
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Data-driven insights to improve your admission chances.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
               <div className="mb-4 flex justify-between items-start">
                  <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600"><Target className="w-6 h-6" /></div>
               </div>
               <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Total Tracked</p>
               <h3 className="text-3xl font-black text-slate-900">{totalApps}</h3>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
               <div className="mb-4 flex justify-between items-start">
                  <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600"><BookOpen className="w-6 h-6" /></div>
               </div>
               <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Accepted Rate</p>
               <h3 className="text-3xl font-black text-slate-900">{acceptedRate}%</h3>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
               <div className="mb-4 flex justify-between items-start">
                  <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div>
               </div>
               <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Active Interviews</p>
               <h3 className="text-3xl font-black text-slate-900">{interviewing}</h3>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6">
               <div className="mb-4 flex justify-between items-start">
                  <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600"><TrendingUp className="w-6 h-6" /></div>
               </div>
               <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Fee Investment</p>
               <h3 className="text-3xl font-black text-slate-900">${totalFees.toLocaleString()}</h3>
            </CardContent>
         </Card>
      </div>

      {totalApps === 0 && !loading && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 text-center">
           <BarChart3 className="w-16 h-16 text-slate-200 mb-6" />
           <h4 className="text-xl font-black text-slate-900 mb-2">Insufficient Data</h4>
           <p className="font-medium max-w-md">Your analytics dashboard will light up once you add applications to your tracker and save universities to your roadmap.</p>
        </div>
      )}

      {totalApps > 0 && !loading && (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="font-black text-slate-900 mb-6 text-lg">Application Funnel</h4>
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={funnelData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dx={-10} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                   <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="font-black text-slate-900 mb-6 text-lg">Country Distribution</h4>
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                   <Pie data={countryData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                     {countryData.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontWeight: 700, fontSize: 12}} />
                 </RePieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <h4 className="font-black text-slate-900 mb-2 text-lg">Profile Readiness</h4>
            <div className="relative w-40 h-40 flex items-center justify-center my-4">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                 <circle cx="80" cy="80" r="70" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray={`${(profileScore/100) * 440} 440`} className="transition-all duration-1000 ease-out" />
               </svg>
               <span className="absolute font-black text-3xl text-slate-900">{profileScore}%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-[200px]">Completion based on resume, SOP, and profile data.</p>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:col-span-2">
            <h4 className="font-black text-slate-900 mb-6 text-lg">Estimated First Year Costs</h4>
            <div className="flex-1 min-h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart layout="vertical" data={[{name: 'Costs', Tuition: tuitionCost, Living: livingCost, Scholarship: 0}]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                   <YAxis type="category" dataKey="name" hide />
                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                   <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontWeight: 700, fontSize: 12}} />
                   <Bar dataKey="Tuition" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="Living" stackId="a" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
            {(missingDocs.length > 0 || missingScores.length > 0) && (
              <div className="mt-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-semibold border border-rose-100 flex items-center gap-2">
                 ⚠️ Profile Missing: {[...missingDocs, ...missingScores].join(', ')}
              </div>
            )}
         </div>
      </div>
      </>
      )}
    </div>
  );
}
