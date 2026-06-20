import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Search, Filter, Bookmark, GraduationCap, MapPin, Calendar, DollarSign, Target, Zap, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { getTable, saveToTable, deleteFromTable, createNotification, listenToTable } from '@/lib/api';
import { auth } from '@/lib/firebase';

interface Scholarship {
  id: number;
  name: string;
  university: string;
  type: string;
  amount: string;
  deadline: string;
  country: string;
  degreeLevel: string;
  match: number;
  eligible?: boolean;
  isNew?: boolean;
}

export function Scholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [matchQuality, setMatchQuality] = useState('All Matches');
  const [fundingTypes, setFundingTypes] = useState<string[]>([]);
  const [deadlines, setDeadlines] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [degreeLevels, setDegreeLevels] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [coverages, setCoverages] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    
    async function load() {
      setLoading(true);
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      const saved = await getTable('scholarships_saved');
      
      setSavedDocs(saved.filter((s:any) => String(s.userId) === String(uid)));
      setLoading(false);
      
      unsubscribe = listenToTable('scholarships', (data) => {
         setScholarships(data);
      });
    }
    load();

    const handleSavedChange = async () => {
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      const saved = await getTable('scholarships_saved');
      setSavedDocs(saved.filter((s:any) => String(s.userId) === String(uid)));
    };
    window.addEventListener('saved_items_changed', handleSavedChange);
    return () => {
      unsubscribe();
      window.removeEventListener('saved_items_changed', handleSavedChange);
    }
  }, []);

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const schol = scholarships.find(s => s.id === id);
    const existing = savedDocs.find(s => s.scholarshipId === id);
    if (existing) {
      await deleteFromTable('scholarships_saved', existing.id);
      setSavedDocs(prev => prev.filter(s => s.id !== existing.id));
      window.dispatchEvent(new Event('saved_items_changed'));
      if (schol) window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed ${schol.name} from saved items` } }));
    } else {
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      const newSaved = await saveToTable('scholarships_saved', { userId: uid, scholarshipId: id });
      setSavedDocs(prev => [...prev, newSaved]);
      window.dispatchEvent(new Event('saved_items_changed'));
      if (schol) {
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Saved ${schol.name} to scholarships` } }));
         await createNotification('Scholarship Saved', `You saved ${schol.name}. Check your saved items to track it.`, 'scholarship', false);
      }
    }
  };

  const toggleFilter = (setFn: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setFn(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]);
  };

  const toggleCompare = (scholarship: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compareList.some(s => s.id === scholarship.id)) {
      setCompareList(prev => prev.filter(s => s.id !== scholarship.id));
    } else {
      if (compareList.length < 4) {
        setCompareList(prev => [...prev, scholarship]);
      }
    }
  };

  const filteredScholarships = scholarships.filter(item => {
    if (searchQuery) {
      const q = searchQuery?.toLowerCase() || '';
      if (!item.name?.toLowerCase().includes(q) && 
          !(item.university || (item as any).universityName)?.toLowerCase().includes(q) &&
          !item.country?.toLowerCase().includes(q) &&
          !(item.type || (item as any).fundingType)?.toLowerCase().includes(q) &&
          !(item.degreeLevel || ((item as any).degreeLevels && (item as any).degreeLevels.join(', ')))?.toLowerCase().includes(q)) {
        return false;
      }
    }

    const matchVal = item.match || 85;

    if (matchQuality === '95%+ Match' && matchVal < 95) return false;
    if (matchQuality === '90%+ Match' && matchVal < 90) return false;
    if (matchQuality === '80%+ Match' && matchVal < 80) return false;

    if (fundingTypes.length > 0 && !fundingTypes.includes(item.type || (item as any).fundingType)) return false;
    if (destinations.length > 0 && !destinations.includes(item.country)) return false;
    if (degreeLevels.length > 0 && !degreeLevels.some(d => (item.degreeLevel || ((item as any).degreeLevels && (item as any).degreeLevels.join(', ')))?.toLowerCase().includes(d.toLowerCase()))) return false;
    
    if (fields.length > 0 && !fields.some(f => item.name?.toLowerCase().includes(f.toLowerCase()) || 
        (item.university || (item as any).universityName)?.toLowerCase().includes(f.toLowerCase()))) return false;

    const amt = (item.amount || (item as any).coverage || '');
    const typ = (item.type || (item as any).fundingType || '');

    if (coverages.length > 0) {
      if (coverages.includes('100%') && !typ.includes('Full')) return false;
      if (coverages.includes('50%+')) {
        // Just keeping it simple for mock data
        if (!typ.includes('Full') && !amt.includes('50%') && !amt.includes('40,000')) return false;
      }
    }

    return true;
  });

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-1/2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider mb-3">
             <Zap className="w-3.5 h-3.5" /> AI Matching Active
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Receipt className="w-8 h-8 text-rose-500" />
            Scholarship Matcher
          </h1>
          <p className="text-slate-500 mt-2 font-medium">We've scanned 12,000+ scholarships. These are the top matches for your academic profile.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-slate-50 border-transparent focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 transition-all font-medium border border-slate-200" 
              placeholder="Search funds..." 
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 w-11 shrink-0 rounded-xl transition-colors shadow-sm ${showFilters ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 bg-white'}`}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-8">
        
        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
              />
              
              {/* Drawer */}
              <motion.div 
                initial={{ x: '100%', opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0.5 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                   <div>
                     <h3 className="font-display font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                       <Filter className="w-6 h-6 text-rose-600" /> Filters
                     </h3>
                     <p className="text-sm font-medium text-slate-500 mt-1">Refine your scholarship search</p>
                   </div>
                   <button 
                     onClick={() => setShowFilters(false)}
                     className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-slate-50/50">
                  <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Target className="w-4 h-4 text-rose-500" /> Match Quality</h4>
                   <div className="space-y-3">
                     {['95%+ Match', '90%+ Match', '80%+ Match', 'All Matches'].map((c) => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="radio" 
                           name="match_scholarship" 
                           checked={matchQuality === c}
                           onChange={() => setMatchQuality(c)}
                           className="w-4 h-4 rounded-full border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
                 
                 <div className="h-px bg-slate-200/60"></div>
  
                 <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><DollarSign className="w-4 h-4 text-rose-500" /> Funding Type</h4>
                   <div className="space-y-3">
                     {['Full Tuition', 'Partial Tuition', 'Living Stipend', 'Research Grant', 'Travel Grant', 'Merit Based', 'Need Based'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="checkbox" 
                           checked={fundingTypes.includes(c)}
                           onChange={() => toggleFilter(setFundingTypes, c)}
                           className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
  
                 <div className="h-px bg-slate-200/60"></div>
  
                 <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /> Country</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Singapore'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group border border-slate-200 rounded-xl p-3 bg-white hover:border-rose-200 transition-colors">
                         <input 
                           type="checkbox" 
                           checked={destinations.includes(c)}
                           onChange={() => toggleFilter(setDestinations, c)}
                           className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors shrink-0" 
                         />
                         <span className="truncate">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
                 
                 <div className="h-px bg-slate-200/60"></div>
  
                 <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><GraduationCap className="w-4 h-4 text-rose-500" /> Degree Level</h4>
                   <div className="space-y-3">
                     {['Bachelor', 'Masters', 'MBA', 'PhD', 'Postdoc'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="checkbox" 
                           checked={degreeLevels.includes(c)}
                           onChange={() => toggleFilter(setDegreeLevels, c)}
                           className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
  
                 <div className="h-px bg-slate-200/60"></div>
  
                 <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Target className="w-4 h-4 text-rose-500" /> Field</h4>
                   <div className="space-y-3">
                     {['Engineering', 'Computer Science', 'Business', 'Medicine', 'Arts', 'Law'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="checkbox" 
                           checked={fields.includes(c)}
                           onChange={() => toggleFilter(setFields, c)}
                           className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
  
                 <div className="h-px bg-slate-200/60"></div>
  
                 <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Clock className="w-4 h-4 text-rose-500" /> Deadlines</h4>
                   <div className="space-y-3">
                     {['Next 30 Days', 'Next 3 Months', 'Next 6 Months', 'Open Applications'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="checkbox" 
                           checked={deadlines.includes(c)}
                           onChange={() => toggleFilter(setDeadlines, c)}
                           className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
  
                 <div className="h-px bg-slate-200/60"></div>
  
                 <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Target className="w-4 h-4 text-rose-500" /> Coverage</h4>
                   <div className="space-y-3">
                     {['100%', '75%+', '50%+'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="checkbox" 
                           checked={coverages.includes(c)}
                           onChange={() => toggleFilter(setCoverages, c)}
                           className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                 </div>
                 <div className="pb-8"></div>
                </div>

                {/* Sticky Action Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                   <Button 
                     variant="outline" 
                     className="flex-1 font-bold h-12"
                     onClick={() => {
                       setMatchQuality('All Matches');
                       setFundingTypes([]);
                       setDestinations([]);
                       setDegreeLevels([]);
                       setFields([]);
                       setDeadlines([]);
                       setCoverages([]);
                     }}
                   >
                     Reset
                   </Button>
                   <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 shadow-lg shadow-rose-600/20" onClick={() => setShowFilters(false)}>
                     Apply Filters
                   </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Scholarships Grid */}
        <div className="flex-1">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="h-[300px] bg-slate-100 rounded-3xl animate-pulse"></div>
               ))}
             </div>
          ) : filteredScholarships.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
               <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <Receipt className="w-10 h-10 text-slate-400" />
               </div>
               <h3 className="text-2xl font-display font-black text-slate-900 mb-3 tracking-tight">No funds found</h3>
               <p className="text-lg mb-6">Try adjusting your filters or search terms.</p>
               <Button onClick={() => { setSearchQuery(''); setMatchQuality('All Matches'); setFundingTypes([]); setDeadlines([]); setDestinations([]); setDegreeLevels([]); setFields([]); setCoverages([]); }} variant="outline" className="border-slate-200">
                 Reset Filters
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredScholarships.map((item, i) => {
                const isSaved = savedDocs.some(s => s.scholarshipId === item.id);
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    key={item.id}
                  >
                    <Card className={`h-full hover:shadow-xl hover:-translate-y-1 hover:border-rose-300 transition-all duration-300 group flex flex-col cursor-pointer border rounded-3xl bg-white overflow-hidden relative ${isSaved ? 'border-rose-200 shadow-sm' : 'border-slate-200'}`}>
                      
                      {item.isNew && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                           <span className="bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">New Match</span>
                        </div>
                      )}

                      {/* Top Stats Banner */}
                      <div className={`p-4 border-b flex justify-between items-center shrink-0 transition-colors ${isSaved ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100 group-hover:bg-rose-50/30'}`}>
                         <div className="flex items-center gap-3 relative z-10 w-full justify-between">
                           <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90 absolute inset-0 drop-shadow-sm" viewBox="0 0 36 36">
                                   <path strokeDasharray="100, 100" className={`${isSaved ? 'text-rose-100' : 'text-slate-200'} stroke-current transition-colors`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4"></path>
                                   <path strokeDasharray={`${item.match || 85}, 100`} className={`${(item.match || 85) > 80 ? 'text-emerald-500' : 'text-amber-500'} stroke-current transition-colors`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round"></path>
                                </svg>
                                <span className="text-xs font-black text-slate-900 absolute">{item.match || 85}%</span>
                             </div>
                             <div>
                               <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Score</p>
                               <p className={`text-sm font-bold ${(item.match || 85) > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{(item.match || 85) > 80 ? 'High Probability' : 'Medium Probability'}</p>
                             </div>
                           </div>
                           <button 
                             onClick={(e) => toggleSave(item.id, e)}
                             className={`px-4 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border text-sm font-bold ${isSaved ? 'text-white border-rose-500 bg-rose-500 shadow-rose-500/20' : 'text-slate-600 border-slate-200 bg-white hover:text-rose-600 hover:border-rose-200'}`}
                           >
                              {isSaved ? (
                                <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> Saved</span>
                              ) : (
                                <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Save</span>
                              )}
                           </button>
                         </div>
                      </div>

                      <CardContent className="p-6 flex-1 flex flex-col pt-8">
                        <div className="flex gap-2 mb-4 absolute top-20">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                            {item.type || (item as any).fundingType}
                          </span>
                          {!item.eligible && (item.match || 85) < 70 && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              Missing Requirements
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-display font-black text-slate-900 mb-2 leading-tight tracking-tight group-hover:text-rose-600 transition-colors mt-2">{item.name}</h3>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mb-6"><GraduationCap className="w-4 h-4" /> {item.university || (item as any).universityName}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-auto border-t border-slate-100 pt-6">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Location</p>
                            <p className="font-bold text-slate-900">{item.country || 'Global'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1"><GraduationCap className="w-3 h-3" /> Level</p>
                            <p className="font-bold text-slate-900">{item.degreeLevel || ((item as any).degreeLevels && (item as any).degreeLevels.join(', '))}</p>
                          </div>
                          <div className={`col-span-2 p-3 rounded-xl border mt-2 flex justify-between items-center transition-colors ${isSaved ? 'bg-white border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Funding Amt</p>
                               <p className="font-black text-slate-900 text-base">{item.amount || (item as any).coverage}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5 flex items-center justify-end gap-1"><Calendar className="w-3 h-3" /> Deadline</p>
                               <p className="font-bold text-rose-600 bg-rose-50 px-2 rounded-md">{item.deadline || 'Varies'}</p>
                             </div>
                          </div>
                          
                          <div className="col-span-2 flex gap-2 mt-4 pt-4 border-t border-slate-100">
                             <Button 
                               variant="outline" 
                               className={`flex-1 font-bold shadow-sm whitespace-nowrap ${compareList.some(c => c.id === item.id) ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700' : ''}`} 
                               onClick={(e) => toggleCompare(item, e)}
                               disabled={compareList.length >= 4 && !compareList.some(c => c.id === item.id)}
                             >
                                {compareList.some(c => c.id === item.id) ? 'Comparing' : 'Compare'}
                             </Button>
                             <Button asChild className="flex-1 bg-slate-900 border-0 shadow-sm text-white font-bold whitespace-nowrap px-2">
                               <Link to={`/app/scholarships/${item.id}`} onClick={(e) => e.stopPropagation()}>View Details</Link>
                             </Button>
                             <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/20 whitespace-nowrap px-2 border-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open('https://example.com/apply', '_blank'); }}>
                                Apply Link
                             </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Compare Action Bar for Scholarships */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-white shadow-2xl shadow-rose-500/20 rounded-2xl border border-rose-200 p-4 flex flex-col md:flex-row items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {compareList.map(s => (
                <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 shrink-0">
                   <span className="font-bold text-slate-700 text-sm max-w-[120px] truncate">{s.name}</span>
                   <button onClick={(e) => toggleCompare(s, e)} className="text-slate-400 hover:text-rose-500 rounded-full p-0.5 hover:bg-slate-200 transition shrink-0">
                     <X className="w-3.5 h-3.5" />
                   </button>
                </div>
              ))}
              {compareList.length < 4 && (
                <div className="px-4 py-2 text-sm font-bold text-slate-400 border border-dashed border-slate-300 rounded-xl shrink-0">
                  Select {4 - compareList.length} more
                </div>
              )}
            </div>
            
            <Button asChild className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 border-0 shadow-md shrink-0 w-full md:w-auto" disabled={compareList.length < 2}>
              <Link to={`/app/compare-scholarships?ids=${compareList.map(s => s.id).join(',')}`}>
                Compare Analytics
              </Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
