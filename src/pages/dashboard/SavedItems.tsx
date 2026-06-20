import React, { useState, useEffect } from 'react';
import { Bookmark, School, Globe, Receipt, MapPin, DollarSign, Send, Search, AlertCircle, Download, Heart, ChevronRight, Trash2 } from 'lucide-react';
import { getTable, deleteFromTable } from '@/lib/api';
import { getUniversities } from '@/services/universityService';
import { getCountries } from '@/services/countryService';
import { getScholarships } from '@/services/scholarshipService';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function SavedItems() {
  const { userData } = useAuth();
  const [unis, setUnis] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'universities' | 'countries' | 'scholarships' | 'applications' | 'searches'>('all');
  
  // Modal State
  const [itemToRemove, setItemToRemove] = useState<{type: 'university'|'country'|'scholarship'|'application', id: number | string, savedId: number | string} | null>(null);

  useEffect(() => {
    if (userData?.id) {
      loadData();
    }
    window.addEventListener('saved_items_changed', loadData);
    return () => window.removeEventListener('saved_items_changed', loadData);
  }, [userData?.id]);

  async function loadData() {
    if (!userData?.id) return;
    setLoading(true);
    const [allUnis, allCountries, allScholars, savedU, savedC, savedS, apps] = await Promise.all([
      getUniversities(),
      getCountries(),
      getScholarships(),
      getTable('universities_saved'),
      getTable('countries_saved'),
      getTable('scholarships_saved'),
      getTable('applications')
    ]);

    const myUniIds = savedU.filter((s:any) => String(s.userId) === String(userData?.id)).map((s:any) => s.universityId);
    const myCIds = savedC.filter((s:any) => String(s.userId) === String(userData?.id)).map((s:any) => s.countryId);
    const mySIds = savedS.filter((s:any) => String(s.userId) === String(userData?.id)).map((s:any) => s.scholarshipId);

    setUnis(allUnis.filter((u:any) => myUniIds.includes(u.id)).map((u:any) => ({...u, savedId: savedU.find((s:any) => String(s.userId) === String(userData?.id) && s.universityId === u.id)?.id})));
    setCountries(allCountries.filter((c:any) => myCIds.includes(c.id)).map((c:any) => ({...c, savedId: savedC.find((s:any) => String(s.userId) === String(userData?.id) && s.countryId === c.id)?.id})));
    setScholarships(allScholars.filter((s:any) => mySIds.includes(s.id)).map((s:any) => ({...s, savedId: savedS.find((sv:any) => String(sv.userId) === String(userData?.id) && sv.scholarshipId === s.id)?.id})));
    setApplications(apps.filter((a:any) => String(a.studentId) === String(userData?.id)));
    setLoading(false);
  }

  const confirmRemove = async () => {
    if (!itemToRemove) return;
    
    if (itemToRemove.type === 'university') {
      await deleteFromTable('universities_saved', itemToRemove.savedId);
      setUnis(prev => prev.filter(u => u.savedId !== itemToRemove.savedId));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed university from saved items` } }));
    } else if (itemToRemove.type === 'country') {
      await deleteFromTable('countries_saved', itemToRemove.savedId);
      setCountries(prev => prev.filter(c => c.savedId !== itemToRemove.savedId));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed destination from saved items` } }));
    } else if (itemToRemove.type === 'scholarship') {
      await deleteFromTable('scholarships_saved', itemToRemove.savedId);
      setScholarships(prev => prev.filter(s => s.savedId !== itemToRemove.savedId));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed scholarship from saved items` } }));
    } else if (itemToRemove.type === 'application') {
      await deleteFromTable('applications', itemToRemove.savedId);
      setApplications(prev => prev.filter(a => a.id !== itemToRemove.savedId));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed application from saved items` } }));
    }
    
    window.dispatchEvent(new Event('saved_items_changed'));
    setItemToRemove(null);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica");
    doc.setFontSize(22);
    doc.text("GlobalGrad - Saved Items", 14, 20);
    
    doc.setFontSize(14);
    doc.text(`Universities (${unis.length})`, 14, 35);
    autoTable(doc, {
      startY: 40,
      head: [['Name', 'Location', 'Est. Tuition', 'Acceptance Rate', 'Match Score']],
      body: unis.map(u => [u.name, u.location, `$${u.tuition}`, `${u.acceptanceRate}%`, `${u.match}%`]),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFontSize(14);
    doc.text(`Destinations (${countries.length})`, 14, finalY + 15);
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Country', 'Region', 'Avg Tuition', 'Post-Study Visa', 'Match Score']],
      body: countries.map(c => [c.name, c.region, `$${c.avgTuition}`, c.postStudyVisa, `${c.match}%`]),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 20;

    doc.setFontSize(14);
    doc.text(`Scholarships (${scholarships.length})`, 14, finalY2 + 15);
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Scholarship Name', 'Provider', 'Amount', 'Deadline']],
      body: scholarships.map(s => [s.name, s.provider || s.university, s.amount, s.deadline]),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save("GlobalGrad_Saved_Items.pdf");
  };

  const renderUniCard = (uni: any, i: number) => (
    <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={uni.id}>
      <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-white relative h-full flex flex-col md:flex-row">
         <div className="h-48 md:h-auto md:w-64 overflow-hidden relative shrink-0">
           <img src={uni.image} alt={uni.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
         </div>
         <CardContent className="p-6 flex-1 flex flex-col justify-between">
           <div>
             <div className="flex justify-between items-start gap-4 mb-2">
               <h3 className="font-display font-black text-xl text-slate-900 leading-tight group-hover:text-purple-700 transition-colors">{uni.name}</h3>
               <button onClick={() => setItemToRemove({type: 'university', id: uni.id, savedId: uni.savedId})} className="w-10 h-10 shrink-0 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors border border-slate-100 hover:border-rose-200">
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
             <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
               <MapPin className="w-4 h-4 text-slate-400" /> {uni.location}
             </div>
           </div>
           <div className="flex flex-wrap items-center gap-3 mt-auto">
             <Button asChild className="bg-slate-900 border-0 flex-1 whitespace-nowrap" size="sm">
               <Link to={`/app/universities/${uni.id}`}>View Analysis</Link>
             </Button>
             <Button asChild variant="outline" className="flex-1 whitespace-nowrap font-bold" size="sm">
               <Link to={`/app/compare-universities?ids=${uni.id}`}>Compare</Link>
             </Button>
           </div>
         </CardContent>
      </Card>
    </motion.div>
  );

  const renderCountryCard = (c: any, i: number) => (
    <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={c.id}>
      <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-indigo-300 transition-all duration-300 hover:shadow-xl bg-white relative h-full flex flex-col">
         <div className="h-40 overflow-hidden relative shrink-0">
           <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
           <button onClick={() => setItemToRemove({type: 'country', id: c.id, savedId: c.savedId})} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 shadow-sm transition-colors border border-white hover:border-rose-200 z-10">
             <Trash2 className="w-4 h-4" />
           </button>
           <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
           <h3 className="absolute bottom-4 left-5 font-display font-black text-2xl text-white tracking-tight drop-shadow-md">{c.name}</h3>
         </div>
         <CardContent className="p-5 flex-1 flex flex-col justify-end">
           <Button asChild className="w-full mt-4" variant="outline" size="sm">
             <Link to={`/app/countries/${c.id}`}>Explore Opportunities</Link>
           </Button>
         </CardContent>
      </Card>
    </motion.div>
  );

  const renderScholarshipCard = (s: any, i: number) => (
    <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={s.id}>
      <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-rose-300 transition-all duration-300 hover:shadow-xl bg-white relative h-full flex flex-col pt-8 p-6">
         <div className="flex justify-between gap-4 mb-4">
           <h3 className="font-display font-black text-xl text-slate-900 leading-tight group-hover:text-rose-600 transition-colors pr-10">{s.name}</h3>
           <button onClick={() => setItemToRemove({type: 'scholarship', id: s.id, savedId: s.savedId})} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-colors z-20 shrink-0">
             <Trash2 className="w-4 h-4" />
           </button>
         </div>
         <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mb-6"><School className="w-4 h-4" /> {s.university || s.provider}</p>
         <div className="grid grid-cols-2 gap-4 mt-auto border-t border-slate-100 pt-6">
            <div>
               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Location</p>
               <p className="font-bold text-slate-900">{s.country}</p>
            </div>
            <div>
               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Funding</p>
               <p className="font-black text-rose-600 bg-rose-50 px-2 rounded w-fit">{s.amount}</p>
            </div>
            <div className="col-span-2 flex gap-3 mt-4">
              <Button className="flex-1 font-bold whitespace-nowrap bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md">Apply Now</Button>
            </div>
         </div>
      </Card>
    </motion.div>
  );

  if (loading) return <div className="p-8 text-center animate-pulse font-medium text-slate-500">Retrieving saved items...</div>;

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Bookmark className="w-8 h-8 text-rose-500 fill-rose-500" />
            Wishlist & Saved Items
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">Manage your bookmarked universities, destinations, scholarships, and track your active applications.</p>
        </div>
        
        <Button onClick={handleDownloadPDF} className="bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-md relative z-10 shrink-0">
          <Download className="w-4 h-4 mr-2" /> Download as PDF
        </Button>
      </div>
      
      <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar border border-slate-100">
         <button onClick={() => setActiveTab('all')} className={`px-4 sm:px-6 flex items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-white shadow-sm text-slate-900 pointer-events-none' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}>
           <Heart className="w-4 h-4" /> All <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{unis.length + countries.length + scholarships.length}</span>
         </button>
         <button onClick={() => setActiveTab('countries')} className={`px-4 sm:px-6 flex items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'countries' ? 'bg-white shadow-sm text-indigo-700 pointer-events-none' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}>
           <Globe className="w-4 h-4" /> Countries <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{countries.length}</span>
         </button>
         <button onClick={() => setActiveTab('universities')} className={`px-4 sm:px-6 flex items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'universities' ? 'bg-white shadow-sm text-purple-700 pointer-events-none' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}>
           <School className="w-4 h-4" /> Universities <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{unis.length}</span>
         </button>
         <button onClick={() => setActiveTab('scholarships')} className={`px-4 sm:px-6 flex items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'scholarships' ? 'bg-white shadow-sm text-rose-700 pointer-events-none' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}>
           <Receipt className="w-4 h-4" /> Scholarships <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{scholarships.length}</span>
         </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {activeTab === 'all' && (
            <div className="space-y-12">
               {countries.length > 0 && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <h2 className="text-xl font-bold text-slate-900">Saved Countries</h2>
                       <Button variant="ghost" className="text-indigo-600 font-bold hover:bg-indigo-50" onClick={() => setActiveTab('countries')}>View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
                     </div>
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                       {countries.slice(0, 4).map(renderCountryCard)}
                     </div>
                  </div>
               )}
               {unis.length > 0 && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <h2 className="text-xl font-bold text-slate-900">Saved Universities</h2>
                       <Button variant="ghost" className="text-purple-600 font-bold hover:bg-purple-50" onClick={() => setActiveTab('universities')}>View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {unis.slice(0, 3).map(renderUniCard)}
                     </div>
                  </div>
               )}
               {scholarships.length > 0 && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                       <h2 className="text-xl font-bold text-slate-900">Saved Scholarships</h2>
                       <Button variant="ghost" className="text-rose-600 font-bold hover:bg-rose-50" onClick={() => setActiveTab('scholarships')}>View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {scholarships.slice(0, 3).map(renderScholarshipCard)}
                     </div>
                  </div>
               )}
               {countries.length === 0 && unis.length === 0 && scholarships.length === 0 && (
                 <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                   <Heart className="w-16 h-16 mb-4 text-slate-300" />
                   <p className="text-lg text-slate-900 font-bold mb-2">No saved items yet</p>
                   <p>Start exploring and heart your favorites.</p>
                 </div>
               )}
            </div>
          )}
          {activeTab === 'universities' && (
            <div className="space-y-6">
              {unis.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 rounded-[3rem] bg-purple-50 border border-purple-100 flex items-center justify-center mb-6 shadow-sm">
                    <School className="w-10 h-10 text-purple-500" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-slate-900 mb-3 tracking-tight">No universities saved</h3>
                  <p className="mb-8 max-w-md text-lg text-slate-500">Your wishlist is empty. Start exploring world-class institutions and bookmark your favorites to compare them later.</p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 h-12 shadow-md shadow-purple-500/20"><Link to="/app/universities">Explore Universities</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   <AnimatePresence>
                   {unis.map((uni, i) => (
                      <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={uni.id}>
                        <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-white relative h-full flex flex-col md:flex-row">
                           <div className="h-48 md:h-auto md:w-64 overflow-hidden relative shrink-0">
                             <img src={uni.image} alt={uni.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                           </div>
                           <CardContent className="p-6 flex-1 flex flex-col justify-between">
                             <div>
                               <div className="flex justify-between items-start gap-4 mb-2">
                                 <h3 className="font-display font-black text-xl text-slate-900 leading-tight group-hover:text-purple-700 transition-colors">{uni.name}</h3>
                                 <button onClick={() => setItemToRemove({type: 'university', id: uni.id, savedId: uni.savedId})} className="w-10 h-10 shrink-0 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors border border-slate-100 hover:border-rose-200">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                               <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
                                 <MapPin className="w-4 h-4 text-slate-400" /> {uni.location}
                               </div>
                             </div>

                             <div className="flex flex-wrap items-center gap-3 mt-auto">
                               <Button asChild className="bg-slate-900 border-0 flex-1 whitespace-nowrap" size="sm">
                                 <Link to={`/app/universities/${uni.id}`}>View Analysis</Link>
                               </Button>
                               <Button asChild variant="outline" className="flex-1 whitespace-nowrap font-bold" size="sm">
                                 <Link to={`/app/compare-universities?ids=${uni.id}`}>Compare</Link>
                               </Button>
                             </div>
                           </CardContent>
                        </Card>
                      </motion.div>
                   ))}
                   </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'countries' && (
            <div className="space-y-6">
              {countries.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 rounded-[3rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
                    <Globe className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-slate-900 mb-3 tracking-tight">No saved destinations</h3>
                  <p className="mb-8 max-w-md text-lg text-slate-500">Explore global study destinations and save the ones that match your career goals.</p>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 shadow-md shadow-indigo-500/20"><Link to="/app/countries">Explore Countries</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   <AnimatePresence>
                   {countries.map((c, i) => (
                      <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={c.id}>
                        <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-indigo-300 transition-all duration-300 hover:shadow-xl bg-white relative h-full flex flex-col">
                           <div className="h-40 overflow-hidden relative shrink-0">
                             <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                             <button onClick={() => setItemToRemove({type: 'country', id: c.id, savedId: c.savedId})} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 shadow-sm transition-colors border border-white hover:border-rose-200 z-10">
                               <Trash2 className="w-4 h-4" />
                             </button>
                             <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                             <h3 className="absolute bottom-4 left-5 font-display font-black text-2xl text-white tracking-tight drop-shadow-md">{c.name}</h3>
                           </div>
                           <CardContent className="p-5 flex-1 flex flex-col justify-end">
                             <Button asChild className="w-full mt-4" variant="outline" size="sm">
                               <Link to={`/app/countries/${c.id}`}>Explore Opportunities</Link>
                             </Button>
                           </CardContent>
                        </Card>
                      </motion.div>
                   ))}
                   </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scholarships' && (
            <div className="space-y-6">
              {scholarships.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 rounded-[3rem] bg-rose-50 border border-rose-100 flex items-center justify-center mb-6 shadow-sm">
                    <Receipt className="w-10 h-10 text-rose-500" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-slate-900 mb-3 tracking-tight">No saved scholarships</h3>
                  <p className="mb-8 max-w-md text-lg text-slate-500">Discover and save funding opportunities tailored to your academic background.</p>
                  <Button asChild className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 h-12 shadow-md shadow-rose-500/20"><Link to="/app/scholarships">Find Scholarships</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <AnimatePresence>
                   {scholarships.map((s, i) => (
                      <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={s.id}>
                        <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-rose-300 transition-all duration-300 hover:shadow-xl bg-white relative h-full flex flex-col pt-8 p-6">
                           <div className="flex justify-between gap-4 mb-4">
                             <h3 className="font-display font-black text-xl text-slate-900 leading-tight group-hover:text-rose-600 transition-colors pr-10">{s.name}</h3>
                             <button onClick={() => setItemToRemove({type: 'scholarship', id: s.id, savedId: s.savedId})} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-colors z-20 shrink-0">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                           <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mb-6"><School className="w-4 h-4" /> {s.university || s.provider}</p>
                           <div className="grid grid-cols-2 gap-4 mt-auto border-t border-slate-100 pt-6">
                              <div>
                                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Location</p>
                                 <p className="font-bold text-slate-900">{s.country}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Funding</p>
                                 <p className="font-black text-rose-600 bg-rose-50 px-2 rounded w-fit">{s.amount}</p>
                              </div>
                              <div className="col-span-2 flex gap-3 mt-4">
                                <Button className="flex-1 font-bold whitespace-nowrap bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md">Apply Now</Button>
                              </div>
                           </div>
                        </Card>
                      </motion.div>
                   ))}
                   </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              {applications.length === 0 ? (
                <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 rounded-[3rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 shadow-sm">
                    <Send className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-slate-900 mb-3 tracking-tight">No active applications</h3>
                  <p className="mb-8 max-w-md text-lg text-slate-500">You haven't started any applications yet. When you apply to a university, track your progress here.</p>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 shadow-md shadow-emerald-500/20"><Link to="/app/applications">Go to Tracker</Link></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   <AnimatePresence>
                   {applications.map((app, i) => (
                      <motion.div initial={{ opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{ opacity: 0, scale: 0.9}} transition={{delay: i*0.05}} key={app.id}>
                        <Card className="rounded-3xl border border-slate-200 overflow-hidden group hover:border-emerald-300 transition-all duration-300 hover:shadow-xl bg-white relative h-full flex flex-col p-6">
                           <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                 <School className="w-5 h-5 text-emerald-600" />
                               </div>
                               <div>
                                 <h3 className="font-display font-black text-lg text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">{app.name}</h3>
                                 <p className="text-xs font-bold text-slate-500">{app.program}</p>
                               </div>
                             </div>
                             <button onClick={() => setItemToRemove({type: 'application', id: app.id, savedId: app.id})} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-colors shrink-0">
                               <TrashIcon className="w-3.5 h-3.5" />
                             </button>
                           </div>
                           
                           <div className="space-y-2 mb-6 flex-1">
                             {app.location && (
                               <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                 <MapPin className="w-4 h-4 text-slate-400" /> {app.location}
                               </div>
                             )}
                             <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                               <span className="w-4 h-4 flex items-center justify-center rounded bg-slate-100 text-slate-500 font-bold shrink-0">S</span> Status: <span className="font-bold text-slate-900">{app.status}</span>
                             </div>
                             {app.deadline && (
                               <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                 <span className="w-4 h-4 flex items-center justify-center rounded bg-rose-100 text-rose-500 shrink-0"><AlertCircle className="w-3 h-3" /></span> Deadline: {app.deadline}
                               </div>
                             )}
                           </div>
                           
                           <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-10">
                             <Link to="/app/applications">Update Tracker</Link>
                           </Button>
                        </Card>
                      </motion.div>
                   ))}
                   </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'searches' && (
            <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 rounded-[3rem] bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
                <Search className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-3xl font-display font-black text-slate-900 mb-3 tracking-tight">No saved searches</h3>
              <p className="mb-8 max-w-md text-lg text-slate-500">Save specific filter combinations to quickly return to your custom shortlists later.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {itemToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center overflow-hidden relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-rose-400"></div>
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                 <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-display font-black text-slate-900 mb-2">Remove from Saved Items?</h3>
              <p className="text-slate-500 font-medium mb-8">This action will remove the item from your wishlist. This cannot be undone.</p>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 font-bold h-12 border-slate-200" onClick={() => setItemToRemove(null)}>Cancel</Button>
                <Button className="flex-1 font-bold h-12 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md shadow-rose-500/20" onClick={confirmRemove}>Remove</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrashIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
  );
}
