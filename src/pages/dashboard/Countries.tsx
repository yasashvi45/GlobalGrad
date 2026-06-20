import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Compass, Bookmark, Briefcase, Shield, ArrowLeftRight, X, GraduationCap, ChevronRight, SlidersHorizontal, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTable, saveToTable, deleteFromTable } from '@/lib/api';
import { listenToCountries } from '@/services/countryService';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

interface Country {
  id: string;
  name: string;
  costOfLiving: number;
  avgTuition: number;
  prDifficulty: string;
  gradSalary: number;
  partTimeWork: string;
  postStudyVisa: string;
  englishReq: string;
  safetyScore: number;
  studentSatisfaction: number;
  weather: string;
  scholarshipAvail: string;
  topUniversities: string;
  visaDifficulty: string;
  image: string;
  flag: string;
  match?: number;
}

export function Countries() {
  const { userData } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [savedCountries, setSavedCountries] = useState<any[]>([]); 
  const [compareList, setCompareList] = useState<Country[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [prefs, setPrefs] = useState<any>({});
  const [tests, setTests] = useState<any>({});
  
  // Filters
  const [budgetFilter, setBudgetFilter] = useState('');
  const [prFilter, setPrFilter] = useState('');
  const [visaFilter, setVisaFilter] = useState('');
  const [matchScoreFilter, setMatchScoreFilter] = useState('');
  const [englishFilter, setEnglishFilter] = useState('');
  const [partTimeFilter, setPartTimeFilter] = useState('');
  const [scholarshipFilter, setScholarshipFilter] = useState('');
  const [postStudyFilter, setPostStudyFilter] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('');
  const [livingCostFilter, setLivingCostFilter] = useState('');
  const [climateFilter, setClimateFilter] = useState('');

  useEffect(() => {
    let unsubscribe = () => {};
    
    async function load() {
      setLoading(true);
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      
      const [saved, pf, pr, ts] = await Promise.all([
        getTable('countries_saved'),
        getTable('profiles'),
        getTable('study_preferences'),
        getTable('test_scores')
      ]);
      
      setSavedCountries(saved.filter((s:any) => String(s.userId) === String(uid)));
      setProfile(pf.find((x:any) => String(x.userId) === String(uid)) || {});
      setPrefs(pr.find((x:any) => String(x.userId) === String(uid)) || {});
      setTests(ts.find((x:any) => String(x.userId) === String(uid)) || {});
      setLoading(false);
      
      unsubscribe = listenToCountries((data) => {
        const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());
        console.log("Countries fetched:", uniqueData);
        console.log("Country count:", uniqueData.length);
        setCountries(uniqueData);
      });
    }
    load();

    const handleSavedChange = async () => {
      const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
      const saved = await getTable('countries_saved');
      setSavedCountries(saved.filter((s:any) => String(s.userId) === String(uid)));
    };
    window.addEventListener('saved_items_changed', handleSavedChange);
    return () => {
      unsubscribe();
      window.removeEventListener('saved_items_changed', handleSavedChange);
    }
  }, []);

  const calculateDynamicMatch = (c: Country) => {
    let score = 80;
    if(prefs.countries && prefs.countries.includes(c.name)) score += 10;
    
    // Budget checking
    const budgetStr = prefs.budget || '';
    if(budgetStr.includes('Under $10k')) {
      if(c.avgTuition < 15000) score += 5; else score -= 10;
    } else if(budgetStr.includes('$10k–20k')) {
      if(c.avgTuition <= 25000) score += 5; else score -= 5;
    } else if(budgetStr.includes('$50k') || budgetStr.includes('$75k')) {
       score += 5;
    }

    if(tests.ielts) {
       const ielts = parseFloat(tests.ielts);
       if(!isNaN(ielts)) {
         if(ielts >= 7.0) score += 5;
         else if(ielts < 6.0 && c.englishReq === 'High') score -= 10;
       }
    }
    return Math.min(Math.max(score, 50), 98);
  };

  const computedCountries = useMemo(() => {
    return countries.map(c => ({
      ...c,
      match: calculateDynamicMatch(c)
    })).sort((a, b) => (b.match || 0) - (a.match || 0));
  }, [countries, prefs, tests]);

  const filteredCountries = useMemo(() => {
    return computedCountries.filter(c => {
      if(searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.topUniversities?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      if(budgetFilter) {
         if(budgetFilter === 'Under 20k' && c.avgTuition > 20000) return false;
         if(budgetFilter === '20k-40k' && (c.avgTuition < 20000 || c.avgTuition > 40000)) return false;
         if(budgetFilter === '40k-60k' && (c.avgTuition < 40000 || c.avgTuition > 60000)) return false;
         if(budgetFilter === '60k+' && c.avgTuition < 60000) return false;
      }
      
      if(prFilter && c.prDifficulty !== prFilter) return false;
      if(visaFilter && c.visaDifficulty !== visaFilter) return false;
      
      if(matchScoreFilter) {
         if(matchScoreFilter === '90+' && (c.match || 0) < 90) return false;
         if(matchScoreFilter === '80+' && (c.match || 0) < 80) return false;
         if(matchScoreFilter === '70+' && (c.match || 0) < 70) return false;
      }

      if(englishFilter && c.englishReq !== englishFilter) return false;
      if(partTimeFilter && !c.partTimeWork.includes(partTimeFilter)) return false;
      if(scholarshipFilter && c.scholarshipAvail !== scholarshipFilter) return false;
      
      if(safetyFilter) {
         if(safetyFilter === '90+' && c.safetyScore < 90) return false;
         if(safetyFilter === '80+' && c.safetyScore < 80) return false;
      }

      if(postStudyFilter) {
         if(postStudyFilter === 'Yes' && (!c.postStudyVisa || c.postStudyVisa === 'None')) return false;
      }
      
      if(livingCostFilter) {
         if(livingCostFilter === 'Under 1000' && c.costOfLiving > 1000) return false;
         if(livingCostFilter === '1000-2000' && (c.costOfLiving < 1000 || c.costOfLiving > 2000)) return false;
         if(livingCostFilter === '2000+' && c.costOfLiving < 2000) return false;
      }
      
      if(climateFilter && !c.weather?.toLowerCase().includes(climateFilter.toLowerCase())) return false;

      return true;
    });
  }, [computedCountries, searchQuery, budgetFilter, prFilter, visaFilter, matchScoreFilter, englishFilter, partTimeFilter, scholarshipFilter, safetyFilter, postStudyFilter, livingCostFilter, climateFilter]);


  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const country = computedCountries.find(c => c.id === id);
    const existing = savedCountries.find(s => String(s.countryId) === id);
    if (existing) {
      await deleteFromTable('countries_saved', existing.id);
      setSavedCountries(prev => prev.filter(s => s.id !== existing.id));
      window.dispatchEvent(new Event('saved_items_changed'));
      if (country) window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Removed ${country.name} from saved items` } }));
    } else {
      const newSaved = await saveToTable('countries_saved', { userId: userData?.id, countryId: id });
      setSavedCountries(prev => [...prev, newSaved]);
      window.dispatchEvent(new Event('saved_items_changed'));
      if (country) window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Saved ${country.name} to destinations` } }));
    }
  };

  const toggleCompare = (country: Country, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareList.some(c => c.id === country.id)) {
      setCompareList(prev => prev.filter(c => c.id !== country.id));
    } else {
      if (compareList.length < 4) {
        setCompareList(prev => [...prev, country]);
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
            Destinations <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Discover and compare the world's best study destinations.</p>
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-80">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-base shadow-sm" 
              placeholder="Search by country, university..." 
            />
          </div>
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"} 
            size="icon" 
            className={`h-12 w-12 shrink-0 rounded-2xl shadow-sm transition-colors ${showFilters ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 transform-gpu">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tuition Budget</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}>
                    <option value="">Any Budget</option>
                    <option value="Under 20k">Under $20k</option>
                    <option value="20k-40k">$20k - $40k</option>
                    <option value="40k-60k">$40k - $60k</option>
                    <option value="60k+">$60k+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">PR Difficulty</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={prFilter} onChange={e => setPrFilter(e.target.value)}>
                    <option value="">Any Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Very Hard">Very Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Visa Difficulty</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={visaFilter} onChange={e => setVisaFilter(e.target.value)}>
                     <option value="">Any</option>
                     <option value="Easy">Easy</option>
                     <option value="Medium">Medium</option>
                     <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Match Score</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={matchScoreFilter} onChange={e => setMatchScoreFilter(e.target.value)}>
                    <option value="">Any Score</option>
                    <option value="90+">90%+</option>
                    <option value="80+">80%+</option>
                    <option value="70+">70%+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Safety Score</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={safetyFilter} onChange={e => setSafetyFilter(e.target.value)}>
                    <option value="">Any Safety</option>
                    <option value="90+">Very High (90%+)</option>
                    <option value="80+">High (80%+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">English Req</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={englishFilter} onChange={e => setEnglishFilter(e.target.value)}>
                    <option value="">Any</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Part-Time Work</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={partTimeFilter} onChange={e => setPartTimeFilter(e.target.value)}>
                    <option value="">Any</option>
                    <option value="20">20 hrs/week</option>
                    <option value="24">24 hrs/week</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Scholarships</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={scholarshipFilter} onChange={e => setScholarshipFilter(e.target.value)}>
                    <option value="">Any</option>
                    <option value="High">High Availability</option>
                    <option value="Medium">Medium Availability</option>
                    <option value="Low">Low Availability</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Post Study Work</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={postStudyFilter} onChange={e => setPostStudyFilter(e.target.value)}>
                    <option value="">Any</option>
                    <option value="Yes">Available</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Living Cost/mo</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={livingCostFilter} onChange={e => setLivingCostFilter(e.target.value)}>
                    <option value="">Any Cost</option>
                    <option value="Under 1000">Under $1000</option>
                    <option value="1000-2000">$1000 - $2000</option>
                    <option value="2000+">$2000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Climate</label>
                  <select className="w-full h-10 text-sm px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={climateFilter} onChange={e => setClimateFilter(e.target.value)}>
                    <option value="">Any Climate</option>
                    <option value="Cold">Cold</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Warm">Warm</option>
                  </select>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Recommendations */}
      {!searchQuery && !loading && computedCountries.length > 0 && (
         <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 shadow-sm">
           <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2 tracking-tight">
             <Sparkles className="w-6 h-6 text-indigo-600" /> AI Recommendations for {profile.firstName || 'You'}
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {computedCountries.slice(0, 3).map((c, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 inline-block ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                         #{idx + 1} Best Match
                       </span>
                       <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">{c.flag} {c.name}</h3>
                     </div>
                     <div className="text-right">
                       <span className="text-2xl font-black text-emerald-600">{c.match}%</span>
                     </div>
                   </div>
                   <p className="text-sm font-medium text-slate-600">Based on your target {prefs.budget || 'budget'} and background, {c.name} offers great value with an average tuition of ${(c.avgTuition/1000).toFixed(1)}k/yr.</p>
                   <Link to={`/app/countries/${c.id}`} className="mt-4 flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-1 transition-transform">
                     Explore {c.name} <ChevronRight className="w-4 h-4 ml-1" />
                   </Link>
                </div>
              ))}
           </div>
         </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
             <div key={i} className="h-[480px] bg-slate-100 rounded-[2rem] animate-pulse"></div>
           ))}
        </div>
      ) : filteredCountries.length === 0 ? (
        <div className="p-16 text-center text-slate-500 font-medium bg-white rounded-3xl border border-slate-200 mt-4 flex flex-col items-center justify-center min-h-[400px]">
           <div className="w-24 h-24 rounded-[3rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
               <Compass className="w-10 h-10 text-indigo-300" />
           </div>
           <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight mb-2">No destinations found</h3>
           <p className="text-slate-500 max-w-sm mx-auto mb-8">We couldn't find any countries matching your exact criteria. Try adjusting your filters or searching with different terms.</p>
           <Button 
             onClick={() => {
                 setSearchQuery('');
                 setBudgetFilter('');
                 setPrFilter('');
                 setVisaFilter('');
                 setMatchScoreFilter('');
                 setEnglishFilter('');
                 setPartTimeFilter('');
                 setScholarshipFilter('');
                 setSafetyFilter('');
                 setPostStudyFilter('');
             }}
             variant="outline" 
             className="font-bold border-slate-200 hover:bg-slate-50 px-8"
           >
              Clear all filters
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCountries.map((country, i) => {
            const isSaved = savedCountries.some(s => String(s.countryId) === String(country.id));
            const isComparing = compareList.some(c => c.id === country.id);

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: "easeOut" }}
                key={country.id}
              >
                <Card 
                  className="overflow-hidden group relative h-[480px] rounded-[2rem] border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform-gpu transition-all duration-700 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 bg-slate-900 cursor-default"
                  onMouseEnter={() => setHoveredId(country.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                   <img 
                    src={country.image || country.heroImage || 'https://images.unsplash.com/photo-1596720426673-e4e14290f0cc?auto=format&fit=crop&w=800&q=80'} 
                    alt={country.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-40" 
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>

                  {/* Bookmark Button */}
                  <button 
                    onClick={(e) => toggleSave(country.id, e)}
                    className={`absolute top-5 right-5 px-4 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-all z-20 shadow-lg border text-sm font-bold ${isSaved ? 'bg-indigo-600/90 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900'}`}
                  >
                     {isSaved ? (
                       <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                     ) : (
                       <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Save</span>
                     )}
                  </button>

                  <div className="absolute top-5 left-5 flex gap-2 z-20">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                      <Target className="w-4 h-4 text-emerald-400" /> {country.match}% Match
                    </div>
                  </div>

                  {/* Default Content */}
                  <div className={`absolute bottom-0 left-0 right-0 p-6 xl:p-8 z-10 transition-all duration-700 ${hoveredId === country.id ? 'translate-y-12 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                     <div className="flex items-center gap-3 mb-2">
                       <span className="text-3xl filter drop-shadow-md">{country.flag || country.flagUrl || '🌍'}</span>
                       <h3 className="text-3xl font-display font-black text-white tracking-tight drop-shadow-lg">{country.name}</h3>
                     </div>
                     <div className="flex flex-wrap gap-2 mb-6">
                       <span className={`px-2.5 py-1 rounded-md text-xs font-bold backdrop-blur-md border ${(country.prDifficulty || country.prOpportunities) === 'Easy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                            (country.prDifficulty || country.prOpportunities) === 'Medium' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 
                            'bg-rose-500/20 text-rose-300 border-rose-500/30'
                       }`}>PR: {country.prDifficulty || country.prOpportunities || 'Target'}</span>
                       <span className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-md text-xs font-bold">
                         {country.postStudyVisa || country.workPermit || 'Standard Visa'}
                       </span>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
                          <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-0.5">Living Cost</p>
                          <p className="text-white font-bold">${country.costOfLiving || country.livingCost || 'varies'}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
                          <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mb-0.5">Avg Tuition</p>
                          <p className="text-white font-bold">${((country.avgTuition || 0) / 1000).toFixed(1)}k/yr</p>
                        </div>
                     </div>
                  </div>

                  {/* Hover Content */}
                  <div className={`absolute inset-0 bg-slate-950/90 backdrop-blur-lg p-6 xl:p-8 flex flex-col justify-between z-10 transition-all duration-500 ${hoveredId === country.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
                    <div className="mt-14">
                       <h3 className="text-2xl font-display font-black text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        {country.flag || country.flagUrl || '🌍'} {country.name}
                      </h3>
                      
                      <div className="space-y-5">
                        <div className="flex gap-4 items-start text-slate-300 group/stat">
                           <Briefcase className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 group-hover/stat:scale-110 transition-transform" />
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Salary</p>
                             <p className="text-sm font-bold text-white">${(country.gradSalary || 0).toLocaleString()}/yr</p>
                           </div>
                        </div>
                        <div className="flex gap-4 items-start text-slate-300 group/stat">
                           <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 group-hover/stat:scale-110 transition-transform" />
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Universities</p>
                             <p className="text-sm font-bold text-white leading-snug line-clamp-2">{country.topUniversities || 'Leading institutions'}</p>
                           </div>
                        </div>
                        <div className="flex gap-4 items-start text-slate-300 group/stat">
                           <Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 group-hover/stat:scale-110 transition-transform" />
                           <div className="w-full">
                             <div className="flex justify-between items-center mb-1.5">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Safety Index</p>
                               <span className="text-xs font-bold text-white">{country.safetyScore || 85}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-400" style={{width: `${country.safetyScore || 85}%`}}></div>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 relative z-30">
                      <Button asChild className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold border-0 h-11 rounded-xl shadow-xl">
                         <Link to={`/app/countries/${country.id}`}>
                           Explore in Detail
                         </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={(e) => toggleCompare(country, e)}
                        disabled={compareList.length >= 4 && !isComparing}
                        className={`w-full font-bold h-11 rounded-xl transition-all border ${isComparing ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent' : 'bg-transparent text-white border-white/20 hover:bg-white hover:text-slate-900 disabled:opacity-50'}`}
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-2" /> 
                        {isComparing ? 'Remove from Compare' : 'Add to Compare'}
                      </Button>
                    </div>
                  </div>

                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Persistent Compare Tray */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 150, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 150, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-slate-200/60 p-3 md:p-4 rounded-[2rem] shadow-[0_20px_40px_rgb(0,0,0,0.12)] flex flex-col md:flex-row items-center justify-between gap-4 w-[95%] md:w-auto min-w-[300px]"
          >
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3">
              {compareList.map(c => (
                <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-colors">
                   <span className="text-xl filter drop-shadow-sm">{c.flag}</span>
                   <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                   <button onClick={(e) => toggleCompare(c, e)} className="text-slate-400 hover:text-rose-500 rounded-full p-1 hover:bg-rose-50 transition-colors ml-1">
                     <X className="w-4 h-4" />
                   </button>
                </div>
              ))}
              {compareList.length < 4 && (
                <div className="px-5 py-3 text-sm font-bold text-slate-400 border border-dashed border-slate-300 rounded-2xl hidden md:block">
                  Add up to {4 - compareList.length} more
                </div>
              )}
            </div>
            
            <div className="w-full md:w-auto mt-2 md:mt-0 flex gap-2">
               {compareList.length >= 2 ? (
                 <Button asChild className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg border border-indigo-500">
                    <Link to={`/app/compare-countries?ids=${compareList.map(c => c.id).join(',')}`}>
                       Compare {compareList.length} Countries
                    </Link>
                 </Button>
               ) : (
                 <div className="w-full md:w-auto bg-slate-100 text-slate-500 font-bold h-12 px-8 rounded-2xl flex items-center justify-center cursor-not-allowed border border-slate-200">
                    Select 2+ to Compare
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

