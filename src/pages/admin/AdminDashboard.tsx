import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MapPin, Landmark, FileText, Activity,  
  ChevronRight, Plus, Search, BookOpen, GraduationCap,
  ArrowRight, Bell, Calendar,
  AlertCircle, X
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { listenToTable } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

dayjs.extend(relativeTime);

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [students, setStudents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let unsubs: any[] = [];
    unsubs.push(listenToTable('users', (data) => setStudents(data.filter((u:any) => u.role !== 'admin'))));
    unsubs.push(listenToTable('applications', (data) => setApplications(data)));
    unsubs.push(listenToTable('universities', (data) => setUniversities(data)));
    unsubs.push(listenToTable('countries', (data) => setCountries(data)));
    unsubs.push(listenToTable('scholarships', (data) => setScholarships(data)));
    unsubs.push(listenToTable('documents', (data) => setDocuments(data)));
    return () => unsubs.forEach(u => u && u());
  }, []);

  const hasAnyData = students.length > 0 || applications.length > 0 || universities.length > 0 || countries.length > 0;

  const getPercentageString = (list: any[]) => {
      if (list.length === 0) return "0%";
      const thirtyDaysAgo = dayjs().subtract(30, 'day');
      const recent = list.filter(item => dayjs(item.createdAt || new Date()).isAfter(thirtyDaysAgo)).length;
      if (recent === 0) return "0%";
      const percentage = Math.round((recent / list.length) * 100);
      return `+${percentage}%`;
  };

  // Application Pipeline
  const pipelineStats = useMemo(() => {
    const defaultStats = { 'Draft': 0, 'Submitted': 0, 'Under Review': 0, 'Offer': 0, 'Accepted': 0, 'Visa Approved': 0 };
    applications.forEach(app => {
      if (defaultStats[app.status as keyof typeof defaultStats] !== undefined) {
         defaultStats[app.status as keyof typeof defaultStats]++;
      }
    });
    return defaultStats;
  }, [applications]);

  // Action Center Stats
  const awaitingReview = applications.filter(a => a.status === 'Submitted').length;
  // Others simulated or basic checks
  const expiringScholarships = scholarships.filter(s => s.deadline && dayjs(s.deadline).isBefore(dayjs().add(30, 'day'))).length;

  const topCountriesChart = useMemo(() => {
     // count applications per country
     const counts: Record<string, number> = {};
     applications.forEach(a => {
        let sc = a.country || 'Global';
        counts[sc] = (counts[sc] || 0) + 1;
     });
     return Object.entries(counts).map(([name, Apps]) => ({ name, Apps })).sort((a,b) => b.Apps - a.Apps).slice(0, 5);
  }, [applications]);

  const topUniversities = useMemo(() => {
     const counts: Record<string, number> = {};
     applications.forEach(a => {
        if(a.universityId) counts[a.universityId] = (counts[a.universityId] || 0) + 1;
     });
     return universities.map(u => ({
         ...u,
         appCount: counts[u.id] || 0
     })).sort((a,b) => b.appCount - a.appCount).slice(0, 5);
  }, [applications, universities]);

  const recentActivity = useMemo(() => {
    const acts: any[] = [];
    students.forEach(s => acts.push({ type: 'Student Registered', title: `${s.firstName || 'New Student' } ${s.lastName || ''}`.trim(), time: s.createdAt, id: s.id, icon: Users }));
    applications.forEach(a => acts.push({ type: 'Application Updated', title: `${a.universityName || 'University'} - ${a.status}`, time: a.updatedAt || a.createdAt, id: a.id, icon: FileText }));
    scholarships.forEach(s => acts.push({ type: 'Scholarship Created', title: s.name, time: s.createdAt, id: s.id, icon: BookOpen }));
    return acts.filter(a => a.time).sort((a,b) => (new Date(b.time).getTime() - new Date(a.time).getTime())).slice(0, 6);
  }, [students, scholarships, applications]);

  // Quick Search Logic
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
  };

  const searchResults = useMemo(() => {
     if(!searchQuery || searchQuery.trim().length === 0) return { universities: [], countries: [], scholarships: [] };
     const q = searchQuery.toLowerCase();
     return {
         universities: universities.filter(u => u.name?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q) || u.country?.toLowerCase().includes(q)).slice(0, 3),
         countries: countries.filter(c => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)).slice(0, 3),
         scholarships: scholarships.filter(s => s.name?.toLowerCase().includes(q) || s.universityName?.toLowerCase().includes(q)).slice(0, 3),
     };
  }, [searchQuery, universities, countries, scholarships]);

  const handleGenerateReport = () => {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Generating comprehensive report...' } }));
  };

  if (!hasAnyData) {
      return (
        <div className="-m-8 p-4 md:p-8 bg-white min-h-[calc(100vh-5rem)] font-sans text-[#111827] flex items-center justify-center">
            <div className="max-w-xl w-full text-center">
                <div className="w-20 h-20 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Activity className="w-10 h-10 text-[#6D5DF6]" />
                </div>
                <h1 className="text-3xl font-black text-[#111827] mb-4 tracking-tight">Platform is Empty</h1>
                <p className="text-lg text-[#6B7280] mb-8">Start bringing your CRM to life by adding global destinations, institutions, and opportunities.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <RouterLink to="/admin/countries" className="flex flex-col items-center p-6 bg-white border border-[#E5E7EB] hover:border-[#6D5DF6] rounded-xl transition-colors shadow-sm">
                        <MapPin className="w-8 h-8 text-[#6D5DF6] mb-3" />
                        <span className="font-semibold text-[#111827]">Add Country</span>
                     </RouterLink>
                     <RouterLink to="/admin/universities" className="flex flex-col items-center p-6 bg-white border border-[#E5E7EB] hover:border-[#6D5DF6] rounded-xl transition-colors shadow-sm">
                        <Landmark className="w-8 h-8 text-[#6D5DF6] mb-3" />
                        <span className="font-semibold text-[#111827]">Add University</span>
                     </RouterLink>
                     <RouterLink to="/admin/scholarships" className="flex flex-col items-center p-6 bg-white border border-[#E5E7EB] hover:border-[#6D5DF6] rounded-xl transition-colors shadow-sm">
                        <BookOpen className="w-8 h-8 text-[#6D5DF6] mb-3" />
                        <span className="font-semibold text-[#111827]">Add Scholarship</span>
                     </RouterLink>
                </div>
                <button onClick={handleGenerateReport} className="mt-8 text-sm font-semibold text-[#6D5DF6] hover:text-[#5a4cdb]">Or run automated seed script</button>
            </div>
        </div>
      );
  }

  const kpis = [
      { title: 'Total Students', value: students.length, icon: Users, link: '/admin/users', dataList: students },
      { title: 'Total Applications', value: applications.length, icon: FileText, link: '/admin/applications', dataList: applications },
      { title: 'Universities', value: universities.length, icon: Landmark, link: '/admin/universities', dataList: universities },
      { title: 'Countries', value: countries.length, icon: MapPin, link: '/admin/countries', dataList: countries },
      { title: 'Scholarships', value: scholarships.length, icon: BookOpen, link: '/admin/scholarships', dataList: scholarships },
      { title: 'Unread Messages', value: 0, icon: Bell, link: '#', dataList: [] }
  ];

  const MiniTrend = () => (
      <svg className="w-10 h-6 text-emerald-500 opacity-60" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M 0 20 L 10 10 L 20 15 L 30 5 L 40 10" />
      </svg>
  );

  return (
    <div className="-m-8 p-4 md:p-10 bg-[#FCFDFE] min-h-[calc(100vh-5rem)] font-sans text-[#111827] selection:bg-[#6D5DF6]/20 overflow-x-hidden relative">
      
      {/* 1. TOP HERO SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div> All Systems Operational
             </div>
             <div className="text-sm font-medium text-[#6B7280] flex items-center gap-1">
                 <Calendar className="w-4 h-4" /> {dayjs(currentTime).format('MMMM D, YYYY')} • {dayjs(currentTime).format('h:mm A')}
             </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">Welcome back, Admin</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-20">
            <div className="relative">
               <form onSubmit={handleSearch}>
                  <button type="button" onClick={() => setIsSearchOpen(true)} className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#6D5DF6]/50 flex items-center justify-center text-[#6B7280] shadow-sm transition-colors">
                     <Search className="w-5 h-5"/>
                  </button>
               </form>
               <AnimatePresence>
                 {isSearchOpen && (
                    <motion.div initial={{ opacity:0, y: -10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-2 flex flex-col z-50">
                        <form onSubmit={handleSearch} className="relative mb-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                            <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} type="text" placeholder="Search universally..." className="w-full pl-9 pr-8 py-2.5 bg-[#F8FAFC] border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#6D5DF6]" />
                            <button type="button" onClick={()=>{setIsSearchOpen(false); setSearchQuery('');}} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-[#6B7280] hover:text-[#111827]" /></button>
                        </form>
                        {searchQuery.trim().length > 0 && (
                           <div className="max-h-80 overflow-y-auto px-1 pb-1">
                               {Object.keys(searchResults).every(k => searchResults[k as keyof typeof searchResults].length === 0) ? (
                                   <div className="text-center py-4 text-sm font-medium text-[#6B7280]">No results found.</div>
                               ) : (
                                  <>
                                     {searchResults.universities.length > 0 && (
                                        <div className="mb-3">
                                           <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 px-2">Universities</div>
                                           {searchResults.universities.map((u:any) => (
                                               <RouterLink key={u.id} to="/admin/universities" className="flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded-lg group transition-colors">
                                                   <Landmark className="w-4 h-4 text-[#6B7280]" />
                                                   <div>
                                                       <div className="text-sm font-bold text-[#111827] leading-tight">{u.name}</div>
                                                       <div className="text-xs text-[#6B7280]">{u.country}</div>
                                                   </div>
                                               </RouterLink>
                                           ))}
                                        </div>
                                     )}
                                     {searchResults.countries.length > 0 && (
                                        <div className="mb-3">
                                           <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 px-2">Countries</div>
                                           {searchResults.countries.map((c:any) => (
                                               <RouterLink key={c.id} to="/admin/countries" className="flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded-lg group transition-colors">
                                                   <MapPin className="w-4 h-4 text-[#6B7280]" />
                                                   <div className="text-sm font-bold text-[#111827]">{c.name}</div>
                                               </RouterLink>
                                           ))}
                                        </div>
                                     )}
                                     {searchResults.scholarships.length > 0 && (
                                        <div className="mb-3">
                                           <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1 px-2">Scholarships</div>
                                           {searchResults.scholarships.map((s:any) => (
                                               <RouterLink key={s.id} to="/admin/scholarships" className="flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded-lg group transition-colors">
                                                   <BookOpen className="w-4 h-4 text-[#6B7280]" />
                                                   <div>
                                                       <div className="text-sm font-bold text-[#111827] leading-tight truncate w-full">{s.name}</div>
                                                       <div className="text-xs text-[#6B7280] truncate w-full">{s.universityName}</div>
                                                   </div>
                                               </RouterLink>
                                           ))}
                                        </div>
                                     )}
                                  </>
                               )}
                           </div>
                        )}
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>
            <button onClick={handleGenerateReport} className="px-5 py-2.5 hover:bg-gray-50 text-[#111827] border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold transition-all shadow-sm">
                Generate Report
            </button>
            <div className="h-6 w-px bg-[#E5E7EB] mx-1"></div>
            <RouterLink to="/admin/countries" className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4"/> Country
            </RouterLink>
            <RouterLink to="/admin/scholarships" className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4"/> Scholarship
            </RouterLink>
            <RouterLink to="/admin/universities" className="px-5 py-2.5 bg-[#6D5DF6] hover:bg-[#5a4cdb] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-[#6D5DF6]/20 flex items-center gap-2">
                <Plus className="w-4 h-4"/> University
            </RouterLink>
        </div>
      </div>

      {/* 2. PRIMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
         {kpis.map((m) => (
            <RouterLink 
               to={m.link}
               key={m.title}
               className="bg-white border border-[#E5E7EB] hover:border-[#6D5DF6]/50 rounded-2xl p-5 relative group transition-all duration-300 shadow-sm flex flex-col"
            >
               <div className="flex items-start justify-between mb-3 w-full">
                  <span className="p-2.5 rounded-xl bg-[#F8FAFC] group-hover:bg-[#6D5DF6]/10 text-[#6B7280] group-hover:text-[#6D5DF6] border border-[#E5E7EB] group-hover:border-[#6D5DF6]/20 transition-colors">
                     <m.icon className="w-4 h-4" />
                  </span>
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">{getPercentageString(m.dataList)}</div>
               </div>
               <div className="mt-auto">
                   <div className="text-2xl font-black text-[#111827] tracking-tight">{m.value}</div>
                   <div className="text-xs font-semibold text-[#6B7280]">{m.title}</div>
               </div>
               <div className="absolute bottom-4 right-4 pointer-events-none">
                  <MiniTrend />
               </div>
            </RouterLink>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
          <div className="xl:col-span-8 space-y-8">
              {/* 3. APPLICATION PIPELINE */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-[#E5E7EB] flex sm:items-center justify-between flex-col sm:flex-row gap-4 mb-2">
                    <div>
                       <h2 className="text-lg font-black text-[#111827]">Application Pipeline</h2>
                       <p className="text-sm font-medium text-[#6B7280]">Real-time applicant distribution.</p>
                    </div>
                    <RouterLink to="/admin/applications" className="text-sm font-bold text-[#6D5DF6] hover:text-[#5a4cdb] flex items-center gap-1">View Full Pipeline <ChevronRight className="w-4 h-4" /></RouterLink>
                 </div>
                 <div className="p-6 flex flex-wrap lg:flex-nowrap justify-between gap-4">
                     {Object.entries(pipelineStats).map(([stage, count], i, arr) => (
                         <div key={stage} className="flex-1 min-w-[120px] flex items-center relative">
                             <div className="flex flex-col space-y-1 z-10 bg-white pr-4">
                               <span className="text-sm font-bold text-[#6B7280]">{stage}</span>
                               <span className="text-2xl font-black text-[#111827]">{count as number}</span>
                             </div>
                             {i < arr.length - 1 && <div className="absolute w-full top-1/2 left-0 h-px bg-[#E5E7EB] -translate-y-1/2 hidden lg:block z-0"></div>}
                             {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-[#E5E7EB] absolute right-0 top-1/2 -translate-y-1/2 bg-white hidden lg:block z-10" />}
                         </div>
                     ))}
                 </div>
              </div>

              {/* 4. CHARTS & TABLES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Top Countries */}
                 <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden p-6">
                    <h2 className="text-base font-black text-[#111827] mb-6">Top Destination Countries</h2>
                    {topCountriesChart.length > 0 ? (
                       <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCountriesChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12, fontWeight: 600}} axisLine={{stroke: '#E5E7EB'}} tickLine={false} />
                                <YAxis tick={{fill: '#6B7280', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '8px', border: '1px solid #E5E7EB', fontWeight: 600, color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="Apps" fill="#6D5DF6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                         </ResponsiveContainer>
                       </div>
                    ) : (
                       <div className="h-64 flex items-center justify-center text-sm font-bold text-[#6B7280]">Not enough application data.</div>
                    )}
                 </div>
                 
                 {/* Top Universities Table */}
                 <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-black text-[#111827]">Top Universities</h2>
                        <RouterLink to="/admin/universities" className="p-1 text-[#6B7280] hover:text-[#6D5DF6] rounded"><ArrowRight className="w-5 h-5"/></RouterLink>
                    </div>
                    {topUniversities.length > 0 ? (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                           {topUniversities.map((uni, i) => (
                               <RouterLink to={`/admin/universities`} key={uni.id || i} className="flex items-center justify-between p-3 border border-[#E5E7EB] hover:border-[#6D5DF6]/40 rounded-xl transition-colors group">
                                  <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                         {uni.logoImage || uni.imageUrl ? <img src={uni.logoImage || uni.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : <GraduationCap className="w-5 h-5 text-[#6B7280]"/>}
                                      </div>
                                      <div className="min-w-0">
                                         <div className="text-sm font-bold text-[#111827] truncate w-[140px]">{uni.name}</div>
                                         <div className="text-xs font-semibold text-[#6B7280]">{uni.country}</div>
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <div className="text-sm font-black text-[#111827]">{uni.appCount || 0} Apps</div>
                                      <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{uni.acceptanceRate || 'N/A'}% Acc</div>
                                  </div>
                               </RouterLink>
                           ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm font-bold text-[#6B7280]">No universities added yet.</div>
                    )}
                 </div>
              </div>

          </div>

          <div className="xl:col-span-4 space-y-8 flex flex-col">
               {/* 5. ACTION CENTER */}
               <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 relative overflow-hidden group hover:border-[#6D5DF6]/50 transition-colors">
                  <div className="absolute top-0 right-0 p-32 bg-[#6D5DF6]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#6D5DF6]/10 transition-colors"></div>
                  <h2 className="text-base font-black text-[#111827] mb-1 flex items-center gap-2 relative z-10 mt-1">
                     <AlertCircle className="w-5 h-5 text-amber-500" /> Admin Action Center
                  </h2>
                  <p className="text-sm font-medium text-[#6B7280] mb-5 relative z-10">Items requiring immediate attention.</p>
                  
                  <div className="space-y-3 relative z-10">
                      <ActionCard title="Applications awaiting review" count={awaitingReview} status={awaitingReview > 0 ? "warning" : "good"} link="/admin/applications" />
                      <ActionCard title="Documents pending verification" count={documents.filter(d => d.status === 'Pending').length} status={documents.filter(d => d.status === 'Pending').length > 0 ? "warning" : "good"} link="/admin/applications" />
                      <ActionCard title="Scholarships expiring soon" count={expiringScholarships} status={expiringScholarships > 0 ? "warning" : "good"} link="/admin/scholarships" />
                      <ActionCard title="Universities missing info" count={universities.filter(u => !u.acceptanceRate || !u.rank || !u.students).length} status={universities.filter(u => !u.acceptanceRate || !u.rank || !u.students).length > 0 ? "warning" : "good"} link="/admin/universities" />
                  </div>
               </div>

               {/* 6. RECENT ACTIVITY FEED */}
               <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex flex-col flex-1 min-h-[300px]">
                  <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
                     <h2 className="text-base font-black text-[#111827]">Recent Activity</h2>
                  </div>
                  <div className="p-0 overflow-y-auto flex-1">
                      {recentActivity.length > 0 ? (
                          <div className="divide-y divide-[#E5E7EB]">
                              {recentActivity.map((act, i) => (
                                 <div key={i} className="p-5 flex items-start gap-4 hover:bg-[#F8FAFC] transition-colors">
                                     <div className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                                         <act.icon className="w-4 h-4 text-[#6B7280]" />
                                     </div>
                                     <div className="min-w-0">
                                         <div className="text-[13px] font-bold text-[#6B7280] mb-0.5">{act.type}</div>
                                         <div className="text-sm font-black text-[#111827] leading-tight truncate">{act.title}</div>
                                         <div className="text-[11px] font-bold text-[#9CA3AF] mt-1 uppercase tracking-widest">{dayjs(act.time).fromNow()}</div>
                                     </div>
                                 </div>
                              ))}
                          </div>
                      ) : (
                          <div className="h-full flex items-center justify-center text-sm font-bold text-[#6B7280]">No recent activity</div>
                      )}
                  </div>
               </div>
          </div>
      </div>

    </div>
  );
}

function ActionCard({ title, count, status, link }: { title: string, count: number, status: 'warning' | 'good', link: string }) {
   return (
      <RouterLink to={link || '#'} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${status === 'warning' && count > 0 ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : 'bg-white border-[#E5E7EB] hover:border-[#6D5DF6]/40'}`}>
          <div className={`text-sm font-bold ${status === 'warning' && count > 0 ? 'text-amber-800' : 'text-[#4B5563]'}`}>{title}</div>
          <div className={`px-2.5 py-0.5 rounded text-xs font-black ${status === 'warning' && count > 0 ? 'bg-amber-200 text-amber-900' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{count}</div>
      </RouterLink>
   );
}
