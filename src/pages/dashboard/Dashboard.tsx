import { BookOpen, MapPin, Target, Wallet, ArrowUpRight, GraduationCap, Clock, FileText, CheckCircle2, ChevronRight, Plus, Upload, Sparkles, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { listenToTable } from '@/services/dbService';
import { useAuth } from '@/contexts/AuthContext';
import dayjs from 'dayjs';

function AnimatedCounter({ end, prefix = "", suffix = "" }: { end: number, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    if(end === 0) {
      setCount(0);
      return;
    }
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count}{suffix}</span>;
}

export function Dashboard() {
  const { user, userData } = useAuth();
  const [data, setData] = useState<any>({
    savedUnis: 0,
    activeApps: 0,
    countries: 0,
    readinessScore: 68,
    recentDocs: [],
    recentApps: [],
    monthlyProgress: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    
    let unis: any[] = [];
    let apps: any[] = [];
    let countries: any[] = [];
    let docs: any[] = [];
    let profiles: any[] = [];
    let prefs: any[] = [];

    const updateState = () => {
      const myUnis = unis.filter((u:any) => String(u.userId) === String(uid));
      const myApps = apps.filter((a:any) => String(a.studentId) === String(uid));
      const myCountries = countries.filter((c:any) => String(c.userId) === String(uid));
      const myDocs = docs.filter((d:any) => String(d.userId) === String(uid));
      const myProfile = profiles.find((p:any) => String(p.userId) === String(uid) || String(p.id) === String(uid)) || {};
      const myPrefs = prefs.find((p:any) => String(p.userId) === String(uid) || String(p.id) === String(uid)) || {};

      // Compute simple monthly progress
      const last4Months = [];
      for (let i = 3; i >= 0; i--) {
         const m = dayjs().subtract(i, 'month').format('MMM');
         last4Months.push({ name: m, tasks: 0, docs: 0 });
      }

      myDocs.forEach((d:any) => {
         const m = dayjs(d.createdAt).format('MMM');
         const item = last4Months.find(x => x.name === m);
         if (item) item.docs++;
      });
      myApps.forEach((a:any) => {
         const m = dayjs(a.createdAt).format('MMM');
         const item = last4Months.find(x => x.name === m);
         if (item) item.tasks++;
      });

      setData({
        savedUnis: myUnis.length,
        activeApps: myApps.length,
        countries: myCountries.length,
        readinessScore: (myProfile as any).completionPercentage || Math.min(100, 20 + (myDocs.length * 10) + (myApps.length * 10) + ((myProfile as any).firstName ? 20 : 0) + ((myPrefs as any).budget ? 10 : 0)),
        recentDocs: myDocs.slice(0, 3) || [],
        recentApps: myApps.slice(0, 4) || [],
        profile: myProfile,
        prefs: myPrefs,
        myUnis,
        monthlyProgress: last4Months
      });
      setLoading(false);
    };

    let unsubs: any[] = [];

    unsubs.push(listenToTable('universities_saved', (d) => { unis = d; updateState(); }));
    unsubs.push(listenToTable('applications', (d) => { apps = d; updateState(); }));
    unsubs.push(listenToTable('countries_saved', (d) => { countries = d; updateState(); }));
    unsubs.push(listenToTable('documents', (d) => { docs = d; updateState(); }));
    unsubs.push(listenToTable('profiles', (d) => { profiles = d; updateState(); }));
    unsubs.push(listenToTable('study_preferences', (d) => { prefs = d; updateState(); }));

    return () => {
      unsubs.forEach(u => u && u());
    };
  }, [user?.uid]);

  // Source of truth for budget data includes profiles and study_preferences
  const myProfile = data.profile;
  const myPrefs = data.prefs;
  const uid = user?.uid;

  const budgetMin = myProfile?.preferences?.budgetMin ?? myProfile?.budgetMin ?? myPrefs?.budgetMin;
  const budgetMax = myProfile?.preferences?.budgetMax ?? myProfile?.budgetMax ?? myPrefs?.budgetMax;
  const singleBudget = myProfile?.preferences?.budget ?? myProfile?.budget ?? myPrefs?.budget;

  // Add precise debugging requested
  console.log("Loaded Budget:", {
    budgetMin: budgetMin !== undefined ? budgetMin : null,
    budgetMax: budgetMax !== undefined ? budgetMax : null,
    userId: uid
  });

  let budgetDisplayVal = "Complete Profile";

  if (budgetMin !== undefined && budgetMin !== null && budgetMin !== "" && budgetMax !== undefined && budgetMax !== null && budgetMax !== "") {
    const formattedMin = typeof budgetMin === 'number' ? `$${Number(budgetMin).toLocaleString()}` : String(budgetMin);
    const formattedMax = typeof budgetMax === 'number' ? `$${Number(budgetMax).toLocaleString()}` : String(budgetMax);
    budgetDisplayVal = `${formattedMin} - ${formattedMax}`;
  } else if (budgetMin !== undefined && budgetMin !== null && budgetMin !== "") {
    budgetDisplayVal = typeof budgetMin === 'number' ? `$${Number(budgetMin).toLocaleString()}` : String(budgetMin);
  } else if (budgetMax !== undefined && budgetMax !== null && budgetMax !== "") {
    budgetDisplayVal = typeof budgetMax === 'number' ? `$${Number(budgetMax).toLocaleString()}` : String(budgetMax);
  } else if (singleBudget) {
    const cleanS = String(singleBudget).trim();
    if (cleanS && cleanS !== "Not Set") {
      if (!isNaN(Number(cleanS)) && cleanS !== '') {
        budgetDisplayVal = `$${Number(cleanS).toLocaleString()}`;
      } else {
        budgetDisplayVal = cleanS;
      }
    }
  }

  if (budgetDisplayVal === "Complete Profile" || !budgetDisplayVal || budgetDisplayVal === "Not Set") {
    console.warn("Budget data missing for user", uid);
    budgetDisplayVal = "Complete Profile";
  }

  const stats = [
    { title: 'Saved Universities', value: data.savedUnis, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/app/saved' },
    { title: 'Active Applications', value: data.activeApps, icon: Target, color: 'text-orange-600', bg: 'bg-orange-100', link: '/app/applications' },
    { title: 'Target Countries', value: data.countries, icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-100', link: '/app/countries' },
    { title: 'Est. Annual Budget', value: budgetDisplayVal, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100', link: '/app/profile' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const firstName = data.profile?.personal?.firstName || userData?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'User';

  if (loading) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 sm:gap-6">
           <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg shrink-0">
              <img src={data.profile?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=4F46E5&color=fff&size=150`} alt="User" />
           </div>
           <div className="flex flex-col items-center md:items-start">
             <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">{greeting}, {firstName}</h1>
             <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 font-medium text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-emerald-500" /> Profile Completion: {data.readinessScore}%</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-rose-500" /> {data.activeApps} Active Applications</span>
             </div>
           </div>
        </div>
        <div className="grid grid-cols-2 lg:flex gap-3 relative z-10 w-full md:w-auto">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-12 md:h-10 text-sm">
            <Link to="/app/applications" className="justify-center"><Plus className="w-4 h-4 mr-2" /> Add Application</Link>
          </Button>
          <Button variant="outline" asChild className="bg-white h-12 md:h-10 text-sm">
            <Link to="/app/documents" className="justify-center"><Upload className="w-4 h-4 mr-2" /> Upload Doc</Link>
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-full"
          >
            <Link to={stat.link} className="block group h-full">
              <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-slate-200/60 hover:border-indigo-500/30 h-full">
                <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-50 flex items-center justify-center border border-transparent group-hover:border-slate-200">
                       <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">{stat.title}</p>
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight leading-tight truncate">
                      {typeof stat.value === 'number' ? <AnimatedCounter end={stat.value} /> : stat.value}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Readiness Score & Application Progress */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-indigo-100 shadow-sm">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 flex flex-col md:flex-row items-center gap-8 relative">
               <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay pointer-events-none"></div>
               <div className="relative w-40 h-40 shrink-0 z-10">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-white/20 stroke-[8] fill-none" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 251 }}
                      animate={{ strokeDashoffset: 251 - (251 * data.readinessScore) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      cx="50" cy="50" r="40" 
                      className="stroke-white stroke-[8] fill-none" 
                      strokeDasharray="251" 
                      strokeLinecap="round" 
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-3xl font-black">{data.readinessScore}%</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Ready</span>
                 </div>
               </div>
               <div className="text-white text-center md:text-left z-10">
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">Study Abroad Readiness</h3>
                  <p className="text-indigo-100 mb-6 max-w-md font-medium leading-relaxed">
                     {data.readinessScore < 40 ? 'Your profile is just getting started. Add your academic history and upload some initial documents.' : 
                      data.readinessScore < 80 ? 'You are steadily building a strong profile. Completing your SOP and securing recommendation letters will significantly boost your score.' :
                      'Fantastic! Your profile is highly competitive. Focus on submitting remaining applications.'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 ${data.profile?.firstName ? 'bg-white/20 border border-white/30 text-white' : 'bg-white/10 opacity-60'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Details</span>
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 ${data.recentDocs?.length > 0 ? 'bg-white/20 border border-white/30 text-white' : 'bg-white/10 opacity-60'}`}><Clock className="w-3.5 h-3.5" /> Documents</span>
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 ${data.activeApps > 0 ? 'bg-white/20 border border-white/30 text-white' : 'bg-white/10 opacity-60'}`}><Clock className="w-3.5 h-3.5" /> Applications</span>
                  </div>
               </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Application Pipeline</CardTitle>
                <CardDescription>Track your active university applications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto mt-2 sm:mt-0">
                <Link to="/app/applications" className="text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50 justify-center">View Board <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentApps.map((app: any, i: number) => {
                  let progress = 25;
                  let color = 'bg-slate-400';
                  let iconColor = 'text-slate-600';
                  let iconBg = 'bg-slate-100';

                  if (app.status === 'Applied' || app.status === 'Submitted') { progress = 50; color = 'bg-indigo-500'; iconColor = 'text-indigo-600'; iconBg = 'bg-indigo-100'; }
                  if (app.status === 'Under Review' || app.status === 'Interview') { progress = 75; color = 'bg-orange-500'; iconColor = 'text-orange-600'; iconBg = 'bg-orange-100'; }
                  if (app.status === 'Accepted') { progress = 100; color = 'bg-emerald-500'; iconColor = 'text-emerald-600'; iconBg = 'bg-emerald-100'; }
                  if (app.status === 'Rejected') { progress = 100; color = 'bg-red-500'; iconColor = 'text-red-600'; iconBg = 'bg-red-100'; }

                  return (
                    <div key={i} className="group p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                          <GraduationCap className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-slate-900 text-base truncate pr-2 group-hover:text-indigo-600 transition-colors">{app.universityName || app.name || 'University'}</p>
                            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shrink-0 shadow-sm">{app.status}</span>
                          </div>
                          <p className="text-sm text-slate-500 font-medium truncate">{app.program}</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className={`h-full ${color} transition-all`} 
                        />
                      </div>
                    </div>
                  );
                })}
                {data.recentApps.length === 0 && (
                  <p className="text-slate-500 font-medium text-center py-4">No active applications. Add one in the tracker.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar widgets */}
        <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentApps.length > 0 ? (
                  data.recentApps.slice(0, 2).map((app: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border transition-colors cursor-pointer hover:shadow-sm border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center shrink-0 text-indigo-600 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider">NOV</span>
                        <span className="text-lg font-black leading-none">{15 + i*5}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{app.universityName || app.name || `Univ #${app.universityId}`} App</p>
                        <div className="flex items-center gap-1.5">
                           <Clock className="w-3.5 h-3.5 text-slate-400" />
                           <p className="text-xs font-medium text-slate-500">{12 + i*5} days left</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 font-medium text-center py-4 text-sm">No upcoming deadlines.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentDocs.map((doc: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0`}>
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{doc.title}</p>
                      <p className="text-sm text-slate-500 font-medium">{doc.status}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{doc.type}</p>
                    </div>
                  </div>
                ))}
                {data.recentDocs.length === 0 && (
                   <p className="text-slate-500 font-medium text-center py-4">No documents uploaded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-800 text-white overflow-hidden relative shadow-xl group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-400/30 transition-colors pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <CardContent className="p-6 relative z-10">
               <div className="flex items-center gap-3 mb-5">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Sparkles className="w-6 h-6 text-indigo-300" />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg tracking-tight leading-tight">GlobalGrad AI</h3>
                    <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-bold">Smart Counselor</p>
                 </div>
               </div>
               
               <p className="text-indigo-100 text-sm mb-6 leading-relaxed font-medium">
                 {data.activeApps > 0 
                   ? `You have ${data.activeApps} active applications. Your health score is looking good, but make sure to check upcoming deadlines.` 
                   : `Your budget target of ${data.prefs?.budget || 'Not Set'} matches top programs in ${data.prefs?.countries?.[0] || 'the USA'}. I can help you find specific universities!`}
               </p>
               
               <div className="grid grid-cols-2 gap-2 mb-6">
                 <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                       <Target className="w-4 h-4 text-emerald-400" />
                       <span className="text-xs font-bold text-indigo-200">Health</span>
                    </div>
                    <p className="text-lg font-black text-white">{data.readinessScore}/100</p>
                 </div>
                 <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                       <Clock className="w-4 h-4 text-rose-400" />
                       <span className="text-xs font-bold text-indigo-200">Pending</span>
                    </div>
                    <p className="text-lg font-black text-white">{data.recentDocs?.length === 0 ? 'Docs' : 'Tasks'}</p>
                 </div>
               </div>

               <Button onClick={() => window.dispatchEvent(new Event('open_ai_assistant'))} className="w-full bg-white text-indigo-900 hover:bg-slate-50 font-bold shadow-md hover:shadow-lg transition-all group-hover:scale-[1.02]">
                 <MessageSquare className="w-4 h-4 mr-2" /> Chat with AI
               </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Analytics Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Your progress completing tasks and uploading documents over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600, color: '#475569' }} />
                <Bar dataKey="tasks" name="Tasks Completed" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="docs" name="Documents Uploaded" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Universities */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
           <div>
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recommended strictly for You</h3>
             <p className="text-slate-500 font-medium mt-1">Based on your budget ({data.prefs?.budget || 'Not Set'}), and preferred locations: {data.prefs?.countries?.join(', ') || 'Any'}</p>
           </div>
           <Button variant="ghost" asChild className="text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto justify-center">
             <Link to="/app/universities">View Matches <ChevronRight className="w-4 h-4 ml-1" /></Link>
           </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {data.prefs?.countries?.length > 0 ? (
             data.prefs.countries.slice(0, 3).map((country: string, i: number) => (
                <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl border-slate-200">
                  <CardContent className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                           <GraduationCap className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100">{95 - (i * 3)}% Match</span>
                     </div>
                     <h4 className="font-bold text-lg text-slate-900 mb-1">Top University in {country}</h4>
                     <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mb-4"><MapPin className="w-4 h-4" /> {country}</p>
                     <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg">Top 100 Global</span>
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg text-slate-400">{i === 0 ? '$$$' : '$$'}</span>
                     </div>
                  </CardContent>
                </Card>
             ))
           ) : (
             <div className="col-span-3 text-center py-8 text-slate-500 font-medium">Add target countries in your profile to see specific university recommendations.</div>
           )}
        </div>
      </div>
      
    </div>
  );
}
