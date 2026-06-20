import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, BookOpen, Bookmark, MapPin, Building2, GraduationCap, Briefcase, Trophy, CheckCircle2, Zap, LayoutGrid, List, ArrowLeftRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTable, saveToTable, deleteFromTable, createNotification, logActivity, listenToTable } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateMatchScore } from '@/lib/matchScore';

interface University {
  id: number;
  name: string;
  country: string;
  location: string;
  ranking: number;
  tuition: number;
  acceptanceRate: number;
  employability: number;
  researchScore: number;
  scholarships: string;
  type: string;
  matchScore?: number;
  match?: number;
  image: string;
}

export function Universities() {
  const { userData } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedUnis, setSavedUnis] = useState<any[]>([]);
  const [compareList, setCompareList] = useState<University[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [matchQuality, setMatchQuality] = useState('All Matches');
  const [destinations, setDestinations] = useState<string[]>([]);
  const [rankingFilter, setRankingFilter] = useState('Any');
  const [acceptanceFilter, setAcceptanceFilter] = useState('Any');
  const [tuitionFilter, setTuitionFilter] = useState('Any');
  const [employabilityFilter, setEmployabilityFilter] = useState('Any');
  const [needsScholarship, setNeedsScholarship] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    
    async function load() {
      setLoading(true);
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      const saved = await getTable('universities_saved');
      
      setSavedUnis(saved.filter((s:any) => String(s.userId) === String(uid)));
      setLoading(false);
      
      unsubscribe = listenToTable('universities', (data) => {
         setUniversities(data);
      });
    }
    load();

    const handleSavedChange = async () => {
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      const saved = await getTable('universities_saved');
      setSavedUnis(saved.filter((s:any) => String(s.userId) === String(uid)));
    };
    window.addEventListener('saved_items_changed', handleSavedChange);
    return () => {
      unsubscribe();
      window.removeEventListener('saved_items_changed', handleSavedChange);
    }
  }, []);

  const toggleDestination = (dest: string) => {
    setDestinations(prev => prev.includes(dest) ? prev.filter(d => d !== dest) : [...prev, dest]);
  };

  const unisWithScores = universities.map(uni => ({
    ...uni,
    matchScore: calculateMatchScore(uni, userData) ?? 0,
    hasRealScore: calculateMatchScore(uni, userData) !== null
  }));

  const filteredUniversities = unisWithScores.filter(uni => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        uni.name?.toLowerCase().includes(q) ||
        uni.location?.toLowerCase().includes(q) ||
        uni.country?.toLowerCase().includes(q) ||
        uni.ranking?.toString() === q ||
        uni.type?.toLowerCase().includes(q) ||
        (uni.scholarships === 'Yes' && 'scholarships funding'.includes(q));
        
      if (!matchSearch) return false;
    }
    
    if (matchQuality === '95%+ Match' && (uni.matchScore || uni.match || 0) < 95) return false;
    if (matchQuality === '90%+ Match' && (uni.matchScore || uni.match || 0) < 90) return false;
    if (matchQuality === '80%+ Match' && (uni.matchScore || uni.match || 0) < 80) return false;
    
    if (destinations.length > 0 && !destinations.includes(uni.location)) return false;
    
    if (rankingFilter === 'Top 10' && (parseInt(uni.ranking as any) || parseInt(uni.rank as any) || parseInt(uni.qsRanking as any) || 999) > 10) return false;
    if (rankingFilter === 'Top 25' && (parseInt(uni.ranking as any) || parseInt(uni.rank as any) || parseInt(uni.qsRanking as any) || 999) > 25) return false;
    if (rankingFilter === 'Top 50' && (parseInt(uni.ranking as any) || parseInt(uni.rank as any) || parseInt(uni.qsRanking as any) || 999) > 50) return false;
    if (rankingFilter === 'Top 100' && (parseInt(uni.ranking as any) || parseInt(uni.rank as any) || parseInt(uni.qsRanking as any) || 999) > 100) return false;
    if (rankingFilter === 'Top 200' && (parseInt(uni.ranking as any) || parseInt(uni.rank as any) || parseInt(uni.qsRanking as any) || 999) > 200) return false;

    if (acceptanceFilter === 'Under 5%' && (parseInt(uni.acceptanceRate as any) || 100) >= 5) return false;
    if (acceptanceFilter === 'Under 10%' && (parseInt(uni.acceptanceRate as any) || 100) >= 10) return false;
    if (acceptanceFilter === 'Under 20%' && (parseInt(uni.acceptanceRate as any) || 100) >= 20) return false;
    if (acceptanceFilter === 'Under 40%' && (parseInt(uni.acceptanceRate as any) || 100) >= 40) return false;

    const tFee = parseInt(uni.tuition as any) || parseInt((uni as any).tuitionFee) || parseInt((uni as any).tuitionUndergrad) || 0;
    if (tuitionFilter === 'Under $20k' && tFee >= 20000) return false;
    if (tuitionFilter === '$20k-$40k' && (tFee < 20000 || tFee > 40000)) return false;
    if (tuitionFilter === '$40k-$60k' && (tFee < 40000 || tFee > 60000)) return false;
    if (tuitionFilter === 'Above $60k' && tFee <= 60000) return false;

    const emp = parseInt(uni.employability as any) || parseInt((uni as any).employabilityRate) || 0;
    if (employabilityFilter === '80+' && emp < 80) return false;
    if (employabilityFilter === '90+' && emp < 90) return false;
    if (employabilityFilter === '95+' && emp < 95) return false;

    const hasSchol = uni.scholarships === "Yes" || !!((uni as any).scholarshipsAvailable) || !!((uni as any).scholarshipsCount);
    if (needsScholarship && !hasSchol) return false;

    return true;
  });

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
    const uni = universities.find(u => u.id === id);
    const existing = savedUnis.find(s => s.universityId === id);
    if (existing) {
      await deleteFromTable('universities_saved', existing.id);
      setSavedUnis(prev => prev.filter(s => s.id !== existing.id));
      window.dispatchEvent(new Event('saved_items_changed'));
      if (uni) {
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed ${uni.name} from saved items` } }));
         await logActivity('Removed University', `Removed ${uni.name} from wishlist.`, 'save', 'text-slate-600', 'bg-slate-100', 'Bookmark');
      }
    } else {
      const newSaved = await saveToTable('universities_saved', { userId: uid, universityId: id });
      setSavedUnis(prev => [...prev, newSaved]);
      window.dispatchEvent(new Event('saved_items_changed'));
      if (uni) {
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Saved ${uni.name} to wishlist` } }));
         await createNotification('University Saved', `You saved ${uni.name} to your wishlist. Let's start preparing your application.`, 'system', false);
         await logActivity('Saved University', `You saved ${uni.name} to your wishlist.`, 'save', 'text-indigo-600', 'bg-indigo-100', 'Bookmark');
      }
    }
  };

  const toggleCompare = (uni: University, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareList.some(u => u.id === uni.id)) {
      setCompareList(prev => prev.filter(u => u.id !== uni.id));
    } else {
      if (compareList.length < 4) {
        setCompareList(prev => [...prev, uni]);
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-1/2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-wider mb-3">
             <Zap className="w-3.5 h-3.5" /> AI Profile Matching
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <BookOpen className="w-8 h-8 text-purple-600" />
            University Explorer
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Find and compare top-ranked target institutions scored against your profile.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl hidden md:flex items-center">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-900'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-900'}`}><List className="w-4 h-4" /></button>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-slate-50 border-transparent focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium border border-slate-200" 
              placeholder="Search by name, program..." 
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 w-11 shrink-0 rounded-xl transition-colors shadow-sm ${showFilters ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 bg-white'}`}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
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
                       <Filter className="w-6 h-6 text-purple-600" /> Filters
                     </h3>
                     <p className="text-sm font-medium text-slate-500 mt-1">Refine your university search</p>
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
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" /> Match Quality</h4>
                   <div className="space-y-3">
                     {['95%+ Match', '90%+ Match', '80%+ Match', 'All Matches'].map((c) => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="radio" 
                           name="match" 
                           checked={matchQuality === c} 
                           onChange={() => setMatchQuality(c)}
                           className="w-4 h-4 rounded-full border-slate-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                  </div>
                 
                  <div className="h-px bg-slate-200/60"></div>
  
                  <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-500" /> Destinations</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Singapore', 'Ireland', 'New Zealand'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group border border-slate-200 rounded-xl p-3 bg-white hover:border-purple-200 transition-colors">
                         <input 
                           type="checkbox" 
                           checked={destinations.includes(c)}
                           onChange={() => toggleDestination(c)}
                           className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0 transition-colors shrink-0" 
                         />
                         <span className="truncate">{c}</span>
                       </label>
                     ))}
                   </div>
                  </div>
                 
                  <div className="h-px bg-slate-200/60"></div>
  
                  <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Trophy className="w-4 h-4 text-purple-500" /> World Ranking</h4>
                   <div className="space-y-3">
                     {['Top 10', 'Top 25', 'Top 50', 'Top 100', 'Top 200', 'Any'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="radio" 
                           name="ranking" 
                           checked={rankingFilter === c}
                           onChange={() => setRankingFilter(c)}
                           className="w-4 h-4 rounded-full border-slate-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                  </div>
                 
                  <div className="h-px bg-slate-200/60"></div>
  
                  <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Acceptance Rate</h4>
                   <div className="space-y-3">
                     {['Under 5%', 'Under 10%', 'Under 20%', 'Under 40%', 'Any'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="radio" 
                           name="acceptance" 
                           checked={acceptanceFilter === c}
                           onChange={() => setAcceptanceFilter(c)}
                           className="w-4 h-4 rounded-full border-slate-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                  </div>
                  
                  <div className="h-px bg-slate-200/60"></div>
                  
                  <div>
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-500" /> Tuition</h4>
                   <div className="space-y-3">
                     {['Under $20k', '$20k-$40k', '$40k-$60k', 'Above $60k', 'Any'].map(c => (
                       <label key={c} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer font-medium group">
                         <input 
                           type="radio" 
                           name="tuition" 
                           checked={tuitionFilter === c}
                           onChange={() => setTuitionFilter(c)}
                           className="w-4 h-4 rounded-full border-slate-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0 transition-colors" 
                         />
                         <span className="group-hover:translate-x-1 transition-transform">{c}</span>
                       </label>
                     ))}
                   </div>
                  </div>
                  
                  <div className="h-px bg-slate-200/60"></div>
                  
                  <label className="flex flex-col gap-2 p-4 bg-purple-50 border border-purple-100 rounded-2xl cursor-pointer hover:border-purple-300 transition-colors">
                     <div className="flex items-center justify-between">
                       <span className="font-bold tracking-tight text-slate-900">Require Scholarships</span>
                       <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${needsScholarship ? 'bg-purple-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${needsScholarship ? 'translate-x-4' : 'translate-x-0'}`}></div>
                       </div>
                     </div>
                     <p className="text-xs font-medium text-slate-500">Only show universities offering international funding</p>
                     <input type="checkbox" className="sr-only" checked={needsScholarship} onChange={() => setNeedsScholarship(!needsScholarship)} />
                  </label>
                  <div className="pb-8"></div>
                </div>
                
                {/* Sticky Action Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                   <Button 
                     variant="outline" 
                     className="flex-1 font-bold h-12"
                     onClick={() => {
                       setMatchQuality('All Matches');
                       setDestinations([]);
                       setRankingFilter('Any');
                       setAcceptanceFilter('Any');
                       setTuitionFilter('Any');
                       setEmployabilityFilter('Any');
                       setNeedsScholarship(false);
                     }}
                   >
                     Reset
                   </Button>
                   <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 shadow-lg shadow-purple-600/20" onClick={() => setShowFilters(false)}>
                     Apply Filters
                   </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="flex-1">
          {loading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`bg-slate-100 rounded-3xl animate-pulse ${viewMode === 'grid' ? 'h-[480px]' : 'h-48'}`}></div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              {filteredUniversities.length === 0 && (
                <div className="xl:col-span-2 p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 mt-4 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 rounded-[3rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                     <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight mb-2">No universities found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-8">We couldn't find any institutions matching your exact criteria. Try adjusting your filters or searching with different terms.</p>
                  <Button 
                    onClick={() => {
                        setSearchQuery('');
                        setMatchQuality('All Matches');
                        setDestinations([]);
                        setRankingFilter('Any');
                        setAcceptanceFilter('Any');
                        setTuitionFilter('Any');
                        setEmployabilityFilter('Any');
                        setNeedsScholarship(false);
                    }}
                    variant="outline" 
                    className="font-bold border-slate-200 hover:bg-slate-50 px-8"
                  >
                     Clear all filters
                  </Button>
                </div>
              )}
              {filteredUniversities.map((uni, i) => {
                const isSaved = savedUnis.some(s => s.universityId === uni.id);
                const isComparing = compareList.some(u => u.id === uni.id);
                
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    key={uni.id}
                  >
                    <Card 
                      className={`overflow-hidden group hover:shadow-xl hover:border-purple-300 transition-all duration-500 rounded-3xl border bg-white ${isSaved ? 'border-purple-200' : 'border-slate-200'} ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-col md:flex-row'}`}
                      onMouseEnter={() => setHoveredId(uni.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Image Banner */}
                      <div className={`relative overflow-hidden shrink-0 w-full ${viewMode === 'grid' ? 'h-48' : 'md:w-72 h-48 md:h-auto self-stretch'}`}>
                        <img src={uni.image || (uni as any).imageUrl || (uni as any).heroImage || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&h=300'} alt={uni.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${viewMode === 'list' && 'md:absolute inset-0'}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                        
                        <div className="absolute top-4 left-4 flex gap-2 flex-wrap pr-16 text-slate-100">
                           {(uni.scholarships || (uni as any).scholarshipsAvailable) && (
                             <div className="bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm flex items-center gap-1 uppercase tracking-wider shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> Funding
                             </div>
                           )}
                           <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-black text-slate-900 shadow-sm flex items-center gap-1.5 shrink-0">
                             <Trophy className="w-4 h-4 text-amber-500" /> #{uni.ranking || (uni as any).rank || 'NR'}
                           </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between gap-2 text-white/90 text-sm font-medium drop-shadow-md">
                            <span className="truncate flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {uni.location || (uni as any).city || uni.country}</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className={`p-6 flex-1 flex flex-col relative z-20 bg-white transition-all duration-300 ${viewMode==='grid' && hoveredId === uni.id ? '-translate-y-1' : ''}`}>
                         {/* Match Badge Floating Overlap */}
                         {(uni as any).hasRealScore ? (
                           <>
                             <div className={`absolute -top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm shadow-purple-500/20 text-white font-black text-sm z-30 transition-transform duration-500 group-hover:rotate-12 ${(uni.matchScore || uni.match || 0) > 90 ? 'bg-emerald-500' : 'bg-purple-500'}`}>
                                {(uni.matchScore || uni.match || 0)}%
                             </div>
                             <div className="absolute top-8 right-6">
                                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-right leading-none">AI Match</p>
                             </div>
                           </>
                         ) : (
                           <div className="absolute top-4 right-6 items-center flex">
                             <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide">Complete Profile for AI Match</span>
                           </div>
                         )}

                        <div className="flex justify-between items-start gap-4 mb-3 pr-16 mt-1 shrink-0">
                          <h3 className="text-xl font-display font-black text-slate-900 group-hover:text-purple-700 transition-colors tracking-tight leading-tight">{uni.name}</h3>
                        </div>
                        
                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'} gap-3 mb-5 shrink-0 w-full`}>
                           <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 group-hover:bg-purple-50/30 group-hover:border-purple-100 transition-colors shrink-0">
                              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Emp. Score</span>
                              </div>
                              <p className="font-bold text-slate-900 text-sm">{uni.employability || parseInt((uni as any).employabilityRate) || 'N/A'} {uni.employability && '/ 100'}</p>
                           </div>
                           <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 group-hover:bg-purple-50/30 group-hover:border-purple-100 transition-colors shrink-0">
                              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Accept</span>
                              </div>
                              <p className="font-bold text-slate-900 text-sm">{(uni.acceptanceRate || parseInt((uni as any).acceptanceRate) || 'N/A')}{uni.acceptanceRate && '%'}</p>
                           </div>
                           <div className={`bg-slate-50/50 rounded-xl p-3 border border-slate-100 group-hover:bg-purple-50/30 group-hover:border-purple-100 transition-colors shrink-0 ${viewMode === 'grid' ? 'col-span-2 sm:col-span-1' : ''} ${viewMode === 'list' ? 'col-span-2 md:col-span-1' : ''}`}>
                              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Research</span>
                              </div>
                              <p className="font-bold text-slate-900 text-sm">{uni.researchScore || 90} / 100</p>
                           </div>
                        </div>
                        
                        <div className="mt-auto space-y-4 shrink-0">
                          <div className="flex flex-wrap items-center justify-between text-sm border-t border-slate-100 pt-4 px-1 gap-2">
                            <span className="text-slate-500 font-medium whitespace-nowrap">Est. Tuition Breakdown</span>
                            {parseInt(uni.tuition as any) || parseInt((uni as any).tuitionUndergrad) || parseInt((uni as any).tuitionFee) ? (
                              <span className="font-black text-slate-900 text-lg whitespace-nowrap">${((parseInt(uni.tuition as any) || parseInt((uni as any).tuitionUndergrad) || parseInt((uni as any).tuitionFee) || 0) / 1000).toFixed(1)}k<span className="text-sm font-medium text-slate-500">/yr</span></span>
                            ) : (
                              <span className="font-bold text-slate-400 text-sm whitespace-nowrap">Data unavailable</span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              variant="outline" 
                              onClick={(e) => toggleCompare(uni, e)}
                               disabled={compareList.length >= 4 && !isComparing}
                              className={`flex-1 sm:flex-none w-full sm:w-auto shadow-sm font-bold whitespace-nowrap border ${isComparing ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50'}`}
                            >
                              <ArrowLeftRight className="w-4 h-4 mr-2" /> {isComparing ? 'Comparing' : 'Compare'}
                            </Button>
                            <Button asChild className="flex-1 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 whitespace-nowrap px-4 border-0">
                              <Link to={`/app/universities/${uni.id}`}>Analysis</Link>
                            </Button>
                            <button 
                              onClick={(e) => toggleSave(uni.id, e)}
                              className={`shrink-0 w-full sm:w-auto sm:px-3 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm border text-sm font-bold ${isSaved ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20' : 'bg-white text-slate-600 hover:text-purple-600 border-slate-200 hover:border-purple-200 hover:bg-purple-50'}`}
                            >
                              {isSaved ? (
                                 <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                              ) : (
                                 <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Save</span>
                              )}
                            </button>
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

      {/* Floating Compare Action Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 w-[90%] md:w-[700px]"
          >
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {compareList.map(u => (
                <div key={u.id} className="bg-slate-800 rounded-xl px-4 py-2 flex items-center gap-2 border border-slate-700 shrink-0">
                   <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                     <img src={u.image} alt="" className="w-full h-full object-cover" />
                   </div>
                   <span className="font-bold text-white text-sm max-w-[100px] truncate">{u.name}</span>
                   <button onClick={(e) => toggleCompare(u, e)} className="text-slate-400 hover:text-white rounded-full p-0.5 hover:bg-slate-700 transition shrink-0">
                     <X className="w-3.5 h-3.5" />
                   </button>
                </div>
              ))}
              {compareList.length < 4 && (
                <div className="px-4 py-2 text-sm font-bold text-slate-500 border border-dashed border-slate-700 rounded-xl shrink-0">
                  Select {4 - compareList.length} more
                </div>
              )}
            </div>
            
            <Button asChild className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 border-0 shadow-lg shrink-0 w-full md:w-auto" disabled={compareList.length < 2}>
              <Link to={`/app/compare-universities?ids=${compareList.map(u => u.id).join(',')}`}>
                Compare Analytics
              </Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
