import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Globe, Award, Users, BookOpen, Building, DollarSign, Calendar, Search, ArrowLeftRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTable, saveToTable, deleteFromTable } from '@/lib/api';
import { getUniversities } from '@/services/universityService';
import { useAuth } from '@/contexts/AuthContext';

export function UniversityProfile() {
  const { userData } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [university, setUniversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedRecords, setSavedRecords] = useState<any[]>([]);

  // Compare Modal State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [allUniversities, setAllUniversities] = useState<any[]>([]);
  const [compareQuery, setCompareQuery] = useState('');
  const [compareList, setCompareList] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allUnis, saved] = await Promise.all([
        getUniversities(),
        getTable('universities_saved')
      ]);
      const uni = allUnis.find((u: any) => String(u.id) === String(id));
      setUniversity(uni);
      setAllUniversities(allUnis);
      
      const userSaved = saved.filter((s:any) => String(s.userId) === String(userData?.id));
      setSavedRecords(userSaved);
      setIsSaved(userSaved.some((s:any) => String(s.universityId) === String(id)));
      
      if (uni) {
         setCompareList([uni]);
      }
      setLoading(false);
    }
    loadData();

    const handleSavedChange = async () => {
      if (!userData?.id) return;
      const saved = await getTable('universities_saved');
      const userSaved = saved.filter((s:any) => String(s.userId) === String(userData?.id));
      setSavedRecords(userSaved);
      if (id) {
         setIsSaved(userSaved.some((s:any) => String(s.universityId) === String(id)));
      }
    };
    if (userData?.id) {
       loadData();
    }
    window.addEventListener('saved_items_changed', handleSavedChange);
    return () => {
      window.removeEventListener('saved_items_changed', handleSavedChange);
    }
  }, [id, userData?.id]);

  const toggleSave = async () => {
    if (!university) return;
    if (isSaved) {
      const existing = savedRecords.find(s => String(s.universityId) === String(university.id));
      if (existing) {
         await deleteFromTable('universities_saved', existing.id);
         setSavedRecords(prev => prev.filter(s => s.id !== existing.id));
      }
      setIsSaved(false);
      window.dispatchEvent(new Event('saved_items_changed'));
    } else {
      const newlySaved = await saveToTable('universities_saved', { userId: userData?.id, universityId: university.id });
      setSavedRecords(prev => [...prev, newlySaved]);
      setIsSaved(true);
      window.dispatchEvent(new Event('saved_items_changed'));
    }
  };

  const toggleCompare = (u: any) => {
    if (compareList.find(c => c.id === u.id)) {
      setCompareList(prev => prev.filter(c => c.id !== u.id));
    } else {
      if (compareList.length < 4) {
        setCompareList(prev => [...prev, u]);
      }
    }
  };

  const executeCompare = () => {
    navigate(`/app/compare-universities?ids=${compareList.map(c => c.id).join(',')}`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'programs', label: 'Programs' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'scholarships', label: 'Scholarships' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'campus', label: 'Campus Life' },
    { id: 'career', label: 'Career Outcomes' },
  ];

  if (loading) return <div className="p-8 text-center animate-pulse">Loading University Profile...</div>;
  if (!university) return <div className="p-8 text-center text-rose-500 font-bold">University not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <Link to="/app/universities" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2">
         <ArrowLeft className="w-4 h-4 mr-1" /> Back to Universities
      </Link>
      
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="min-h-[18rem] bg-slate-200 relative pb-4">
           <img src={university.heroImage || university.image || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&h=400'} alt={university.name} className="absolute inset-0 w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
           
           <div className="relative pt-24 px-4 sm:px-8 pb-4 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-lg border border-slate-100 shrink-0 overflow-hidden">
                   {university.logoImage ? (
                      <img src={university.logoImage} alt={`${university.name} Logo`} className="w-full h-full object-contain" />
                   ) : (
                      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                      </div>
                   )}
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight mb-2 drop-shadow-md">{university.name}</h1>
                  <p className="text-slate-200 font-medium flex items-center gap-2 drop-shadow-md"><MapPin className="w-4 h-4" /> {university.location}, {university.country}</p>
                </div>
              </div>
              <div className="flex flex-col flex-wrap sm:flex-row gap-3 w-full md:w-auto shrink-0">
                 <Button onClick={toggleSave} className={`w-full sm:w-auto font-bold shadow-lg ${isSaved ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-indigo-900 hover:bg-slate-50'}`}>
                    {isSaved ? 'Saved' : 'Save University'}
                 </Button>
                 <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/20">Apply Now</Button>
              </div>
           </div>
        </div>
        
        <div className="border-b border-slate-100 overflow-x-auto scrollbar-hide">
           <div className="flex px-8">
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
        
        <div className="p-4 sm:p-8">
           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2 space-y-8">
                   <section>
                     <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">About {university.name}</h2>
                     <p className="text-slate-600 leading-relaxed font-medium">This is a leading public research university recognized globally for its academic excellence, cutting-edge research facilities, and diverse campus community. Situated in the heart of {university.location}, it offers unparalleled opportunities for networking and industry collaborations.</p>
                   </section>
                   
                   <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Key Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <Award className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                            <p className="text-2xl font-black text-slate-900">{university.ranking || university.qsRanking || university.rank ? `#${university.ranking || university.qsRanking || university.rank}` : 'Data unavailable'}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">QS World Rank</p>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                            <p className="text-2xl font-black text-slate-900">{university.acceptanceRate ? `${university.acceptanceRate}%` : 'Data unavailable'}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Acceptance</p>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <Globe className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                            <p className="text-2xl font-black text-slate-900">{university.employability || university.employabilityRate ? `${university.employability || university.employabilityRate}%` : 'Data unavailable'}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Employability</p>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <BookOpen className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                            <p className="text-2xl font-black text-slate-900">{university.researchScore || university.researchOutputScore ? `${university.researchScore || university.researchOutputScore}/100` : 'Data unavailable'}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Research Score</p>
                         </div>
                      </div>
                   </section>
                </div>
                
                <div className="space-y-6">
                   <Card className="shadow-sm border-slate-200 bg-slate-50">
                      <CardContent className="p-6 space-y-6">
                         <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Tuition (Annual)</p>
                            <p className="text-xl font-black text-slate-900">${(university.tuition || university.tuitionFee || university.tuitionUndergrad) ? parseFloat(String(university.tuition || university.tuitionFee || university.tuitionUndergrad)).toLocaleString() : 'Data unavailable'}</p>
                         </div>
                         <div className="h-px bg-slate-200"></div>
                         <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Next Intake</p>
                            <p className="text-xl font-black text-slate-900">Fall 2026</p>
                         </div>
                         <Button onClick={() => setShowCompareModal(true)} variant="outline" className="w-full font-bold bg-white text-slate-900">
                           <ArrowLeftRight className="w-4 h-4 mr-2" /> Compare University
                         </Button>
                      </CardContent>
                   </Card>
                </div>
             </div>
           )}

           {activeTab === 'programs' && (
              <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Available Programs</h3>
                    <Input className="max-w-xs" placeholder="Search programs..." />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['Computer Science BSc', 'Data Science MSc', 'Business Administration MBA', 'Mechanical Engineering BEng', 'Artificial Intelligence MSc', 'Economics Course'].map((prog, i) => (
                      <div key={i} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-40 hover:border-indigo-300 transition-colors">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">Full Time</span>
                          <h4 className="font-bold text-slate-900 leading-tight">{prog}</h4>
                        </div>
                        <Button variant="ghost" className="w-full justify-center mt-2 text-indigo-600 hover:text-indigo-700 bg-slate-50 font-bold text-sm h-9">View Details</Button>
                      </div>
                    ))}
                 </div>
              </div>
           )}

           {activeTab === 'scholarships' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Scholarships & Financial Aid</h3>
                {(university as any).scholarshipInfo ? (
                  <div className="space-y-4">
                     <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-emerald-900 text-lg">Financial Aid Information</h4>
                        </div>
                        <p className="text-sm font-medium text-emerald-700">{(university as any).scholarshipInfo}</p>
                     </div>
                  </div>
                ) : university.scholarships ? (
                  <div className="space-y-4">
                     <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-emerald-900 text-lg">International Merit Scholarship</h4>
                           <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-1 rounded-md">Up to 50%</span>
                        </div>
                        <p className="text-sm font-medium text-emerald-700">Awarded automatically based on academic excellence and test scores during the admission process. No separate application required.</p>
                     </div>
                     <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-blue-900 text-lg">Global Leaders Fellowship</h4>
                           <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">Full Ride</span>
                        </div>
                        <p className="text-sm font-medium text-blue-700">Highly competitive fellowship for students showing exceptional leadership potential and community impact.</p>
                        <Button className="mt-4 bg-white text-blue-700 font-bold hover:bg-blue-100 shadow-sm">Apply Separately</Button>
                     </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                     <p className="text-slate-600 font-medium">No major scholarships currently listed for international students directly from the university. Check external funding sources.</p>
                  </div>
                )}
              </div>
           )}

           {activeTab === 'career' && (
              <div className="space-y-8 animate-in fade-in">
                 <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">ROI & Career Outcomes</h3>
                      <p className="text-slate-600 font-medium mt-1">Analyze return on investment based on tuition costs and projected salaries for specific majors.</p>
                    </div>
                    <div className="w-full md:w-64 shrink-0">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Target Major</label>
                       <select 
                         className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                         onChange={(e) => {
                             // This is a simplified dynamic state adjustment for the UI
                             // We'll calculate salary dynamically based on this
                             const val = e.target.value;
                             const el = document.getElementById('dynamic-salary');
                             const roiEl = document.getElementById('dynamic-roi');
                             if (el && roiEl) {
                                let base = 75000 + (university.employability * 500);
                                if (val === 'Computer Science') base += 25000;
                                if (val === 'Engineering') base += 15000;
                                if (val === 'Business/MBA') base += 20000;
                                if (val === 'Data Science') base += 22000;
                                if (val === 'Arts & Humanities') base -= 15000;
                                
                                // Region adjusting
                                if (university.country === 'USA') base *= 1.2;
                                if (university.country === 'UK') base *= 0.85;
                                if (university.country === 'Canada') base *= 0.9;

                                const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(base);
                                el.innerText = formatted;
                                
                                const cost = (university.tuition + 20000) * 4;
                                const breakeven = Math.round(cost / (base * 0.4) * 10) / 10;
                                roiEl.innerText = '~' + breakeven;
                             }
                         }}
                       >
                         <option value="General">General Average</option>
                         <option value="Computer Science">Computer Science</option>
                         <option value="Data Science">Data Science</option>
                         <option value="Engineering">Engineering</option>
                         <option value="Business/MBA">Business / MBA</option>
                         <option value="Finance">Finance</option>
                         <option value="Healthcare">Healthcare / Medicine</option>
                         <option value="Arts & Humanities">Arts & Humanities</option>
                       </select>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden">
                       <DollarSign className="w-8 h-8 text-rose-500 mb-4 relative z-10" />
                       <h4 className="font-bold text-slate-900 text-lg mb-1 relative z-10">Total Estimated Cost</h4>
                       <p className="text-slate-500 font-medium mb-2 relative z-10">4 years tuition + living</p>
                       <p className="text-3xl font-black text-slate-900 relative z-10">
                          ${(() => {
                             const t = typeof university.tuition === 'number' ? university.tuition : parseFloat(String(university.tuition || '').replace(/[^0-9.]/g, '')) || 0;
                             return ((t + 20000) * 4).toLocaleString();
                          })()}
                       </p>
                       <div className="absolute right-0 bottom-0 text-[120px] text-rose-100 opacity-20 -mr-4 -mb-10 pointer-events-none"><DollarSign /></div>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden">
                       <Award className="w-8 h-8 text-emerald-500 mb-4 relative z-10" />
                       <h4 className="font-bold text-slate-900 text-lg mb-1 relative z-10">Avg Starting Salary</h4>
                       <p className="text-slate-500 font-medium mb-2 relative z-10">Projected for {university.location}</p>
                       <p id="dynamic-salary" className="text-3xl font-black text-slate-900 relative z-10">${(75000 + (university.employability * 500) * (university.country==='USA'?1.2:university.country==='UK'?0.85:university.country==='Canada'?0.9:1)).toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                       <div className="absolute right-4 bottom-0 text-[100px] text-emerald-100 opacity-20 -mr-4 -mb-10 pointer-events-none"><Award /></div>
                    </div>
                    <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                       <h4 className="font-bold text-indigo-900 text-lg mb-1 relative z-10">Estimated ROI Break-even</h4>
                       <p className="text-5xl font-black text-indigo-600 my-2 relative z-10">
                          <span id="dynamic-roi">
                             ~{(() => {
                                const t = typeof university.tuition === 'number' ? university.tuition : parseFloat(String(university.tuition || '').replace(/[^0-9.]/g, '')) || 0;
                                const salary = (75000 + (university.employability * 500) * (university.country === 'USA' ? 1.2 : university.country === 'UK' ? 0.85 : university.country === 'Canada' ? 0.9 : 1));
                                return Math.round(((t + 20000) * 4) / (salary * 0.4) * 10) / 10;
                             })()}
                          </span> <span className="text-xl">years</span>
                       </p>
                       <p className="text-indigo-700 font-medium text-sm relative z-10">Based on dedicating 40% of salary to repayment</p>
                    </div>
                 </div>

                 <Card className="shadow-sm border-slate-200 overflow-hidden mt-8">
                    <CardContent className="p-0">
                       <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-lg">Top Hiring Companies</h4>
                            <p className="text-slate-400 text-sm">Where alumni typically land roles</p>
                          </div>
                       </div>
                       <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {['Google', 'Microsoft', 'Amazon', 'McKinsey', 'Goldman Sachs', 'Apple', 'Meta', 'Tesla'].map((company) => (
                             <div key={company} className="flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700 text-center">
                                {company}
                             </div>
                          ))}
                       </div>
                    </CardContent>
                 </Card>
              </div>
           )}

           {['admissions', 'rankings', 'campus'].includes(activeTab) && (
             <div className="py-12 text-center text-slate-500 font-medium">
               <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-slate-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Detailed Statistics</h3>
               <p>We are currently gathering the latest verified data for {tabs.find(t => t.id === activeTab)?.label}.</p>
             </div>
           )}
        </div>
      </div>

      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                   <ArrowLeftRight className="w-6 h-6 text-indigo-500" /> Compare Universities
                 </h2>
                 <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="bg-slate-50 p-6 shrink-0 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Selected to compare ({compareList.length}/4)</p>
                <div className="flex flex-wrap gap-2">
                   {compareList.map(c => (
                     <div key={c.id} className="bg-white border border-indigo-200 shadow-sm rounded-xl px-3 py-1.5 flex items-center gap-2 text-sm font-bold text-indigo-900">
                        {c.name}
                        {c.id !== university.id && (
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
                      placeholder="Search to add universities..." 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                      value={compareQuery}
                      onChange={e => setCompareQuery(e.target.value)}
                    />
                 </div>
                 
                 <div className="space-y-2">
                    {allUniversities
                      .filter(u => u.id !== university.id)
                      .filter(u => compareQuery === '' || u.name?.toLowerCase().includes(compareQuery.toLowerCase()))
                      .slice(0, 10).map(u => {
                         const isSelected = compareList.some(c => c.id === u.id);
                         return (
                           <div key={u.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                   <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="text-left font-bold text-slate-900 text-sm">
                                   {u.name}
                                 </div>
                              </div>
                              <Button 
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleCompare(u)}
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
