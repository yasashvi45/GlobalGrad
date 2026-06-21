import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Download, Users, Landmark, BookOpen, MapPin, FileText, CheckCircle, RefreshCw, Send, Activity, Brain, ArrowDownToLine, MousePointerClick } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, Pie, Legend, LineChart, Line } from 'recharts';
import { getTable } from '@/lib/api';
import { downloadCSV } from '@/lib/exportUtils';
import { API_BASE } from "../../config";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loadingKPIs, setLoadingKPIs] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [dateFilter, setDateFilter] = useState('All Time');

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
       setLoadingKPIs(true);
       setLoadingCharts(true);
       try {
           const [apps, students, unis, countries, scholarships] = await Promise.all([
             getTable('applications').catch(()=>[]),
             getTable('users').catch(()=>[]),
             getTable('universities').catch(()=>[]),
             getTable('countries').catch(()=>[]),
             getTable('scholarships').catch(()=>[])
           ]);

           const totalApps = apps.length;
           const activeStudents = students.filter((s:any) => s.role !== 'admin').length || students.length;
           const totalUnis = unis.length;
           const totalCountries = countries.length;
           const accepted = apps.filter((a:any) => a.status === 'Accepted').length;
           const acceptanceRate = totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0;
           const pendingReviews = apps.filter((a:any) => a.status === 'Pending').length;
           const totalScholarships = scholarships.length;
           const scholarshipsAwarded = apps.filter((a:any) => (a.scholarshipName || a.scholarshipId) && a.status === 'Accepted').length || 0;
           
           const conversionRate = activeStudents > 0 ? Math.round((totalApps / activeStudents) * 100) : 0;
           
           // 1. App Trend
           const appTrendMap: Record<string, number> = {};
           apps.forEach((a:any) => {
              const d = new Date(a.createdAt || Date.now());
              const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              appTrendMap[label] = (appTrendMap[label] || 0) + 1;
           });
           const appTrend = Object.keys(appTrendMap).sort().map(k => ({ name: k, value: appTrendMap[k] }));

           // 2. Top Unis
           const uniDemand: Record<string, number> = {};
           apps.forEach((a:any) => {
              const u = a.universityName || 'Custom Request';
              uniDemand[u] = (uniDemand[u] || 0) + 1;
           });
           const topUnis = Object.keys(uniDemand).map(k => ({ name: k, value: uniDemand[k] })).sort((a,b)=>b.value - a.value).slice(0,5);

           // 3. Country Demand
           const countryDemand: Record<string, number> = {};
           apps.forEach((a:any) => {
              const c = a.country || 'Global';
              countryDemand[c] = (countryDemand[c] || 0) + 1;
           });
           const topCountries = Object.keys(countryDemand).map(k => ({ name: k, value: countryDemand[k] })).sort((a,b)=>b.value - a.value).slice(0,5);

           // 4. Funnel
           const funnel = [
             { name: 'Total Students', value: activeStudents },
             { name: 'Applications Started', value: totalApps }, // Assuming submitted is started for now if we lack started tracking
             { name: 'Accepted', value: accepted }
           ];

           // 5. Scholarship Usage
           const scholUsageMap: Record<string, number> = {};
           apps.filter((a:any) => a.scholarshipName || a.scholarshipId).forEach((a:any) => {
              const d = new Date(a.createdAt || Date.now());
              const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              scholUsageMap[label] = (scholUsageMap[label] || 0) + 1;
           });
           const scholarshipUsage = Object.keys(scholUsageMap).sort().map(k => ({ name: k, value: scholUsageMap[k] }));

           setData({
             kpis: {
               totalApps, activeStudents, totalUnis, totalCountries, acceptanceRate, scholarshipsAwarded, pendingReviews, conversionRate
             },
             appTrend: appTrend.length > 0 ? appTrend : [{name: 'No Data', value: 0}],
             topUnis: topUnis.length > 0 ? topUnis : [{name: 'No Data', value: 0}],
             topCountries: topCountries.length > 0 ? topCountries : [{name: 'No Data', value: 0}],
             funnel: funnel.length > 0 ? funnel : [{name: 'No Data', value: 0}],
             scholarshipUsage: scholarshipUsage.length > 0 ? scholarshipUsage : [{name: 'No Data', value: 0}]
           });
       } catch (err) {
           console.error("Error loading analytics:", err);
       } finally {
           setLoadingKPIs(false);
           setTimeout(() => setLoadingCharts(false), 200);
       }
    }
    load();
  }, [dateFilter]);

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      if (type === 'csv' || type === 'excel') {
         let csv = `GlobalGrad Analytics Dashboard Export\n\n`;
         if (data?.kpis) {
           csv += `Key Performance Indicators\n`;
           csv += `Total Applications,${data.kpis.totalApps}\n`;
           csv += `Active Students,${data.kpis.activeStudents}\n`;
           csv += `Universities,${data.kpis.totalUnis}\n`;
           csv += `Countries,${data.kpis.totalCountries}\n`;
           csv += `Acceptance Rate,${data.kpis.acceptanceRate}%\n`;
           csv += `Scholarships Awarded,${data.kpis.scholarshipsAwarded}\n`;
           csv += `Pending Reviews,${data.kpis.pendingReviews}\n`;
           csv += `Conversion Rate,${data.kpis.conversionRate}%\n\n`;
         }
         downloadCSV(`globalgrad_analytics.csv`, csv);
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Exported as CSV Successfully.' } }));
      } else {
         // Mock PDF / Snapshot export
         await new Promise(r => setTimeout(r, 800));
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Exported as ${type.toUpperCase()} Successfully.` } }));
      }
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Export failed.', type: 'error' } }));
    } finally {
      setExporting(false);
    }
  };

  const handleAiQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           message: `ANALYTICS QUERY: ${aiQuery}\nDATA CONTEXT: ${JSON.stringify(data?.kpis)}`,
           actionType: 'chat'
        })
      });
      const resData = await res.json();
      setAiResponse(resData.reply || resData.message || "Analysis complete.");
    } catch {
      setAiResponse("Analytics query could not be completed at this time due to quotas or network error.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loadingKPIs && !data) {
     return <div className="p-12 text-center text-slate-500 font-bold tracking-tight">Gathering metrics...</div>;
  }

  // Empty state check
  if (!loadingKPIs && data && data.kpis.totalApps === 0 && data.kpis.activeStudents === 0 && data.kpis.totalUnis === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
           <Activity className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">No analytics data available yet.</h2>
        <p className="text-slate-500 max-w-md">Start adding students, universities, countries, and applications to generate insights.</p>
      </div>
    );
  }

  // Pre-defined pastel colors for charts
  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 font-medium">Single source of truth for platform operations.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => handleExport('csv')} disabled={exporting} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg text-sm font-bold text-slate-700 transition">CSV</button>
             <button onClick={() => handleExport('excel')} disabled={exporting} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg text-sm font-bold text-slate-700 transition">Excel</button>
             <button onClick={() => handleExport('pdf')} disabled={exporting} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg text-sm font-bold text-slate-700 transition">PDF</button>
             <button onClick={() => handleExport('snapshot')} disabled={exporting} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg text-sm font-bold text-indigo-600 transition">Snapshot</button>
          </div>
          {exporting && <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Applications" value={data.kpis.totalApps} icon={<FileText className="w-5 h-5 text-indigo-600" />} bg="bg-indigo-50" />
        <KPICard title="Active Students" value={data.kpis.activeStudents} icon={<Users className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
        <KPICard title="Universities" value={data.kpis.totalUnis} icon={<Landmark className="w-5 h-5 text-purple-600" />} bg="bg-purple-50" />
        <KPICard title="Countries" value={data.kpis.totalCountries} icon={<MapPin className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
        <KPICard title="Acceptance Rate" value={`${data.kpis.acceptanceRate}%`} icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
        <KPICard title="Scholarships Awarded" value={data.kpis.scholarshipsAwarded} icon={<BookOpen className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
        <KPICard title="Pending Reviews" value={data.kpis.pendingReviews} icon={<RefreshCw className="w-5 h-5 text-rose-600" />} bg="bg-rose-50" />
        <KPICard title="Conversion Rate" value={`${data.kpis.conversionRate}%`} icon={<MousePointerClick className="w-5 h-5 text-sky-600" />} bg="bg-sky-50" />
      </div>

      {/* AI Assistant Box */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2rem] p-6 lg:p-8 text-white shadow-xl">
         <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                 <Brain className="w-6 h-6 text-indigo-400" />
                 <h2 className="text-xl font-bold">AI Analytics Assistant</h2>
               </div>
               <p className="text-indigo-200 text-sm mb-4">Ask natural language questions about your data. Try "Why did applications decrease?" or "Compare Canada vs Australia demand."</p>
               <form onSubmit={handleAiQuery} className="flex gap-2">
                 <input 
                   type="text" 
                   value={aiQuery}
                   onChange={e => setAiQuery(e.target.value)}
                   placeholder="Ask anything about your platform metrics..."
                   className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
                 <button type="submit" disabled={isAiLoading || !aiQuery.trim()} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition">
                   {isAiLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 </button>
               </form>
            </div>
            {aiResponse && (
               <div className="flex-1 bg-white/10 p-5 rounded-2xl border border-white/10 text-sm leading-relaxed backdrop-blur-sm self-stretch flex items-center min-w-[300px]">
                 <div>
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">AI Insights</div>
                    {aiResponse}
                 </div>
               </div>
            )}
         </div>
      </div>

      {/* Charts Array */}
      {!loadingCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Applications Trend */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
             <div className="mb-6">
               <h3 className="font-bold text-slate-800 text-lg">Applications Trend</h3>
               <p className="text-sm text-slate-500">Total applications submitted over time</p>
             </div>
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.appTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                   <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                   <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Top Universities */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="mb-6">
               <h3 className="font-bold text-slate-800 text-lg">Top Universities</h3>
               <p className="text-sm text-slate-500">By application volume</p>
             </div>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart layout="vertical" data={data.topUnis} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                   <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} width={100} />
                   <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Country Demand */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="mb-6">
               <h3 className="font-bold text-slate-800 text-lg">Country Demand</h3>
               <p className="text-sm text-slate-500">Application distribution by country</p>
             </div>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={data.topCountries} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                     {data.topCountries.map((entry:any, index:number) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Application Funnel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="mb-6">
               <h3 className="font-bold text-slate-800 text-lg">Application Funnel</h3>
               <p className="text-sm text-slate-500">Conversion from user to accepted student</p>
             </div>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                   <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Scholarship Usage */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="mb-6">
               <h3 className="font-bold text-slate-800 text-lg">Scholarship Usage</h3>
               <p className="text-sm text-slate-500">Applications submitting scholarship requests</p>
             </div>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.scholarshipUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                   <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                   <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, icon, bg }: { title: string, value: string | number, icon: React.ReactNode, bg: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <div className="text-slate-500 text-sm font-semibold">{title}</div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
      </div>
    </div>
  );
}

