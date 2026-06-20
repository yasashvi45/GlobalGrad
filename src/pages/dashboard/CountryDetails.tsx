import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, GraduationCap, Building, Briefcase, Building2, Search, ArrowLeftRight, X, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTable, saveToTable, deleteFromTable } from '@/lib/api';
import { getCountries } from '@/services/countryService';
import { useAuth } from '@/contexts/AuthContext';

export function CountryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [country, setCountry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedRecords, setSavedRecords] = useState<any[]>([]);

  // Compare Modal State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [compareQuery, setCompareQuery] = useState('');
  const [compareList, setCompareList] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [countries, saved] = await Promise.all([
        getCountries(),
        getTable('countries_saved')
      ]);
      const found = countries.find((c: any) => String(c.id) === String(id));
      setCountry(found);
      setAllCountries(countries);
      
      const userSaved = saved.filter((s:any) => String(s.userId) === String(userData?.id));
      setSavedRecords(userSaved);
      if(found) {
         setIsSaved(userSaved.some((s:any) => String(s.countryId) === String(found.id)));
         setCompareList([found]);
      }
      setLoading(false);
    }
    if (userData?.id) {
       loadData();
    }

    const handleSavedChange = async () => {
      if (!userData?.id) return;
      const saved = await getTable('countries_saved');
      const userSaved = saved.filter((s:any) => String(s.userId) === String(userData?.id));
      setSavedRecords(userSaved);
      if (id) {
         setIsSaved(userSaved.some((s:any) => String(s.countryId) === String(id)));
      }
    };
    window.addEventListener('saved_items_changed', handleSavedChange);
    return () => {
      window.removeEventListener('saved_items_changed', handleSavedChange);
    }
  }, [id, userData?.id]);

  const toggleSave = async () => {
    if (!country) return;
    if (isSaved) {
      const existing = savedRecords.find(s => String(s.countryId) === String(country.id));
      if (existing) {
         await deleteFromTable('countries_saved', existing.id);
         setSavedRecords(prev => prev.filter(s => s.id !== existing.id));
      }
      setIsSaved(false);
      window.dispatchEvent(new Event('saved_items_changed'));
    } else {
      const newlySaved = await saveToTable('countries_saved', { userId: userData?.id, countryId: country.id });
      setSavedRecords(prev => [...prev, newlySaved]);
      setIsSaved(true);
      window.dispatchEvent(new Event('saved_items_changed'));
    }
  };

  const toggleCompare = (c: any) => {
    if (compareList.find(item => item.id === c.id)) {
      setCompareList(prev => prev.filter(item => item.id !== c.id));
    } else {
      if (compareList.length < 4) {
        setCompareList(prev => [...prev, c]);
      }
    }
  };

  const executeCompare = () => {
    navigate(`/app/compare-countries?ids=${compareList.map(c => c.id).join(',')}`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'universities', label: 'Universities' },
    { id: 'scholarships', label: 'Scholarships' },
    { id: 'costs', label: 'Cost Breakdown' },
    { id: 'visa', label: 'Visa & PR' },
    { id: 'jobs', label: 'Jobs' }
  ];

  if (loading) {
     return <div className="p-8 text-center animate-pulse">Loading destination...</div>;
  }

  if (!country) {
     return <div className="p-8 text-center">Country not found.</div>;
  }

  const avgTuition = country.avgTuition ? (typeof country.avgTuition === 'number' ? country.avgTuition : parseFloat(String(country.avgTuition).replace(/[^0-9.]/g, '')) || 0) : 0;
  const costOfLiving = country.costOfLiving ? (typeof country.costOfLiving === 'number' ? country.costOfLiving : parseFloat(String(country.costOfLiving).replace(/[^0-9.]/g, '')) || 0) : 0;
  const gradSalary = country.gradSalary ? (typeof country.gradSalary === 'number' ? country.gradSalary : parseFloat(String(country.gradSalary).replace(/[^0-9.]/g, '')) || 0) : 0;

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      <Link to="/app/countries" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2">
         <ArrowLeft className="w-4 h-4 mr-1" /> Back to Destinations
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
           {country.flag} Exploring {country.name}
        </h1>
        <div className="flex gap-3">
          <Button onClick={toggleSave} variant={isSaved ? "default" : "outline"} className={`font-bold ${isSaved ? 'bg-indigo-600' : 'bg-white text-slate-700'}`}>
             <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} /> {isSaved ? 'Saved' : 'Save Country'}
          </Button>
          <Button onClick={() => setShowCompareModal(true)} className="font-bold bg-slate-900 hover:bg-slate-800 text-white">
             <ArrowLeftRight className="w-4 h-4 mr-2" /> Compare
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-72 md:h-96 bg-slate-200 relative">
           <img src={country.image} alt={country.name} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
           <div className="absolute bottom-10 left-10">
              <div className="flex items-center gap-3 mb-4">
                 <span className="bg-indigo-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg">Top Destination</span>
                 {country.match && (
                   <span className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg">
                      {country.match}% Match
                   </span>
                 )}
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight drop-shadow-lg flex items-center gap-4">
                 {country.name}
              </h1>
           </div>
        </div>
        
        <div className="border-b border-slate-100 overflow-x-auto scrollbar-hide">
           <div className="flex px-4 md:px-8">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`whitespace-nowrap px-6 py-4 font-bold text-sm tracking-wide transition-colors border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
               >
                 {tab.label}
               </button>
             ))}
           </div>
        </div>
        
        <div className="p-6 md:p-10">
           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                   <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Why study in {country.name}?</h2>
                   <p className="text-slate-600 leading-relaxed font-medium text-lg">
                     {country.name} is one of the most highly sought-after study destinations globally. Renowned for its world-class education system, vibrant student life, and strong post-graduation opportunities.
                   </p>
                   
                   <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="p-5 border border-slate-200 bg-white rounded-2xl flex flex-col hover:border-indigo-200 transition-colors shadow-sm">
                         <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">PR Difficulty</span>
                         <span className={`text-lg font-black ${country.prDifficulty === 'Easy' ? 'text-emerald-600' : country.prDifficulty === 'Medium' ? 'text-amber-600' : 'text-rose-600'}`}>{country.prDifficulty}</span>
                      </div>
                      <div className="p-5 border border-slate-200 bg-white rounded-2xl flex flex-col hover:border-indigo-200 transition-colors shadow-sm">
                         <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Visa Difficulty</span>
                         <span className="text-lg font-black text-indigo-700">{country.visaDifficulty}</span>
                      </div>
                      <div className="p-5 border border-slate-200 bg-white rounded-2xl flex flex-col hover:border-indigo-200 transition-colors shadow-sm">
                         <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Part-Time Work</span>
                         <span className="text-lg font-black text-slate-900 line-clamp-2">{country.partTimeWork}</span>
                      </div>
                      <div className="p-5 border border-slate-200 bg-white rounded-2xl flex flex-col hover:border-indigo-200 transition-colors shadow-sm">
                         <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Weather / Climate</span>
                         <span className="text-lg font-black text-slate-900 line-clamp-2">{country.weather}</span>
                      </div>
                   </div>

                   <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-500"/> Top Universities</h4>
                      <p className="text-slate-700 font-medium leading-relaxed">{country.topUniversities}</p>
                   </div>
                </div>
                <div>
                   <Card className="shadow-lg border-slate-200 bg-slate-50/50 rounded-3xl sticky top-24">
                      <CardContent className="p-8 space-y-6">
                         <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Average Tuition</p>
                            <p className="text-2xl font-black text-slate-900">${(avgTuition/1000).toFixed(1)}k / yr</p>
                         </div>
                         <div className="h-px bg-slate-200"></div>
                         <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Living Costs</p>
                            <p className="text-2xl font-black text-slate-900">${costOfLiving} / mo</p>
                         </div>
                         <div className="h-px bg-slate-200"></div>
                         <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Intakes</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                               <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs">Fall (Sept)</span>
                               <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs">Spring (Jan)</span>
                            </div>
                         </div>
                         <Button onClick={() => setShowCompareModal(true)} className="w-full font-bold h-12 rounded-xl text-base bg-indigo-600 hover:bg-indigo-700">Add to Compare</Button>
                      </CardContent>
                   </Card>
                </div>
             </div>
           )}

           {activeTab === 'costs' && (
              <div className="space-y-8 max-w-4xl">
                 <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Detailed Cost Breakdown</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                       <Wallet className="w-8 h-8 text-indigo-500 mb-4" />
                       <h4 className="font-bold text-slate-900 text-xl mb-1">Tuition Fees</h4>
                       <p className="text-slate-500 font-medium mb-4">Estimated annual based on top universities</p>
                       <p className="text-3xl font-black text-slate-900">${avgTuition.toLocaleString()}<span className="text-sm text-slate-500 font-medium">/yr</span></p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                       <Building className="w-8 h-8 text-emerald-500 mb-4" />
                       <h4 className="font-bold text-slate-900 text-xl mb-1">Living Expenses</h4>
                       <p className="text-slate-500 font-medium mb-4">Rent, food, transport & utilities</p>
                       <p className="text-3xl font-black text-slate-900">${costOfLiving}<span className="text-sm text-slate-500 font-medium">/mo</span></p>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'jobs' && (
              <div className="space-y-8 max-w-4xl">
                 <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Career & Jobs</h2>
                 <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <h4 className="font-bold text-indigo-900 text-xl mb-2 flex items-center gap-2"><Briefcase className="w-6 h-6" /> Expected Graduate Salary</h4>
                    <p className="text-4xl font-black text-indigo-700 mt-2">${gradSalary.toLocaleString()}<span className="text-base text-indigo-500 font-bold uppercase tracking-wider ml-2">Annually</span></p>
                 </div>
                 <h3 className="font-bold text-slate-900 text-xl pt-4 border-t border-slate-100">Part-Time Work Rights</h3>
                 <p className="text-slate-600 font-medium leading-relaxed">{country.partTimeWork}</p>
                 
              </div>
           )}

           {activeTab === 'visa' && (
              <div className="space-y-8 max-w-4xl">
                 <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Visa & Immigration</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <h4 className="font-bold text-slate-900 mb-2">Student Visa Difficulty</h4>
                       <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-indigo-700">
                          Level: {country.visaDifficulty}
                       </div>
                    </div>
                    <div>
                       <h4 className="font-bold text-slate-900 mb-2">PR (Permanent Residency)</h4>
                       <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-emerald-700">
                          Difficulty: {country.prDifficulty}
                       </div>
                    </div>
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-900 mb-2">Post-Study Work Visa</h4>
                    <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                       {country.postStudyVisa}
                    </p>
                 </div>
              </div>
           )}

           {['universities', 'scholarships'].includes(activeTab) && (
             <div className="py-20 text-center text-slate-500 font-medium">
               <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-10 h-10 text-slate-400" />
               </div>
               <h3 className="text-2xl font-display font-black text-slate-900 mb-3 tracking-tight">Content coming soon</h3>
               <p className="text-lg">We are currently gathering the latest verified data for {tabs.find(t => t.id === activeTab)?.label} in {country.name}.</p>
             </div>
           )}
        </div>
      </div>

      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                   <ArrowLeftRight className="w-6 h-6 text-indigo-500" /> Compare Countries
                 </h2>
                 <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="bg-slate-50 p-6 shrink-0 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Selected to compare ({compareList.length}/4)</p>
                <div className="flex flex-wrap gap-2">
                   {compareList.map(c => (
                     <div key={c.id} className="bg-white border border-indigo-200 shadow-sm rounded-xl px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-indigo-900">
                        <span className="text-lg leading-none">{c.flag}</span> {c.name}
                        {c.id !== country.id && (
                           <button onClick={() => toggleCompare(c)} className="text-indigo-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                        )}
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                 <div className="relative mb-6">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      placeholder="Search to add countries..." 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      value={compareQuery}
                      onChange={e => setCompareQuery(e.target.value)}
                    />
                 </div>
                 
                 <div className="space-y-2">
                    {allCountries
                      .filter(c => c.id !== country.id)
                      .filter(c => compareQuery === '' || c.name?.toLowerCase().includes(compareQuery.toLowerCase()))
                      .slice(0, 10).map(c => {
                         const isSelected = compareList.some(item => item.id === c.id);
                         return (
                           <div key={c.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-3xl">
                                   {c.flag}
                                 </div>
                                 <div className="text-left font-bold text-slate-900 text-sm">
                                   {c.name}
                                 </div>
                              </div>
                              <Button 
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleCompare(c)}
                                disabled={compareList.length >= 4 && !isSelected}
                                className={isSelected ? 'bg-indigo-600 text-white' : ''}
                              >
                                {isSelected ? 'Added' : 'Add'}
                              </Button>
                           </div>
                         )
                      })}
                 </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 shrink-0 bg-white rounded-b-3xl flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowCompareModal(false)}>Cancel</Button>
                 <Button onClick={executeCompare} disabled={compareList.length < 2} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">
                   Generate Analytics
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
