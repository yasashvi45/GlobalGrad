import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getUniversities } from '@/services/universityService';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { calculateMatchScore } from '@/lib/matchScore';
import { useAuth } from '@/contexts/AuthContext';

export function CompareUniversities() {
  const { userData } = useAuth();
  const [searchParams] = useSearchParams();
  const [universities, setUniversities] = useState<any[]>([]);
  const [allUniversities, setAllUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const ids = searchParams.get('ids')?.split(',') || [];
      const allU = await getUniversities().catch(()=>[]);
      setAllUniversities(allU);
      const selected = allU.filter((u: any) => ids.includes(String(u.id)));
      setUniversities(selected);
      setLoading(false);
    }
    load();
  }, [searchParams]);

  const addUni = (u: any) => {
    if (universities.length >= 4) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Maximum 4 universities can be compared' } }));
      return;
    }
    setUniversities([...universities, u]);
    setSearch('');
  };

  const removeUni = (id: number) => {
    setUniversities(universities.filter(u => u.id !== id));
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-medium">Loading comparison...</div>;

  const availableUnis = allUniversities.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) && !universities.find(s => s.id === u.id));

  const attributes = [
    { key: 'ranking', label: 'World Ranking', type: 'number', inverted: true },
    { key: 'qsRanking', label: 'QS Ranking', type: 'number', inverted: true },
    { key: 'acceptanceRate', label: 'Acceptance Rate', type: 'percentage' },
    { key: 'employability', label: 'Employability Score', type: 'percentage' },
    { key: 'researchScore', label: 'Research Output', type: 'percentage' },
    { key: 'tuition', label: 'Annual Tuition', type: 'currency', inverted: true },
    { key: 'livingCost', label: 'Living Cost', type: 'currency', inverted: true },
    { key: 'minIELTS', label: 'IELTS Requirement', type: 'number', inverted: true },
    { key: 'minTOEFL', label: 'TOEFL Requirement', type: 'number', inverted: true },
    { key: 'scholarships', label: 'Scholarships', type: 'boolean' },
    { key: 'match', label: 'AI Match Score', type: 'percentage' }
  ];

  const getUniVal = (u: any, key: string) => {
    if (key === 'match') {
      const realScore = calculateMatchScore(u, userData);
      return realScore !== null ? realScore : null;
    }
    if (key === 'employability') return u.employability ?? u.employabilityRate ?? u.employabilityScore;
    if (key === 'researchScore') return u.researchScore ?? u.researchOutput ?? u.researchOutputScore;
    if (key === 'tuition') return u.tuition ?? u.tuitionFee ?? u.tuitionUndergrad;
    if (key === 'livingCost') return u.livingCost ?? u.avgLivingCost;
    if (key === 'minIELTS') return u.minIELTS ?? u.ieltsRequirement ?? u.ieltsMin;
    if (key === 'minTOEFL') return u.minTOEFL ?? u.toeflRequirement ?? u.toeflMin;
    if (key === 'scholarships') return u.scholarships ?? (u as any).scholarshipsAvailable;
    if (key === 'ranking') return u.ranking ?? u.rank ?? u.theRank;
    if (key === 'qsRanking') return u.qsRanking ?? u.qsRank ?? u.ranking ?? u.rank;
    return u[key];
  };

  if (!universities || universities.length === 0) return (
     <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in pb-24 max-w-7xl mx-auto flex flex-col min-h-screen">
       <Link to="/app/universities" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-2 w-max">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to University Explorer
       </Link>
       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
         <div>
           <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">University Analytics Comparison</h1>
           <p className="text-slate-500 mt-1 font-medium">Head-to-head comparison of your target institutions.</p>
         </div>
       </div>
       <div className="bg-white p-16 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-500 text-center mt-8">
           <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M16 3h5v5"/><path d="M21 3 9 15"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/></svg></div>
           <h4 className="text-xl font-black text-slate-900 mb-4">Select Universities to Compare</h4>
           <div className="relative w-full max-w-md mx-auto text-left">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
             <input placeholder="Search and add your first university..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 rounded-xl text-base font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" />
             {search && availableUnis.length > 0 && (
               <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto text-left z-50">
                  {availableUnis.map(u => (
                     <button key={u.id} onClick={() => addUni(u)} className="w-full text-left p-4 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors">
                        <div>
                           <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                           <div className="text-xs font-medium text-slate-500">{u.country}</div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     </button>
                  ))}
               </div>
             )}
           </div>
        </div>
     </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in pb-24 max-w-7xl mx-auto flex flex-col min-h-screen">
      <Link to="/app/universities" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors mb-2 w-max">
         <ArrowLeft className="w-4 h-4 mr-1" /> Back to University Explorer
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">University Analytics Comparison</h1>
          <p className="text-slate-500 mt-1 font-medium">Head-to-head comparison of your target institutions.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative z-50 mr-4">
             {universities.length < 4 && (
               <div className="relative w-64">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input placeholder="Search university to add..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 h-10 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
                  
                  {search && availableUnis.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
                       {availableUnis.map(u => (
                          <button key={u.id} onClick={() => addUni(u)} className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors">
                             <div>
                                <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                                <div className="text-xs font-medium text-slate-500">{u.country}</div>
                             </div>
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </button>
                       ))}
                    </div>
                  )}
               </div>
             )}
           </div>
           <Button variant="outline" className="font-bold border-slate-200" onClick={() => window.print()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              PDF / Print
           </Button>
           <Button variant="outline" className="font-bold border-slate-200" onClick={() => {
               navigator.clipboard.writeText(window.location.href);
               alert('Link copied to clipboard!');
           }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Share Link
           </Button>
        </div>
      </div>

      <div className="bg-white border md:rounded-3xl border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-6 border-b border-r border-slate-100 bg-slate-50 w-64 align-bottom">
                 <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Metrics</span>
              </th>
              {universities.map(u => (
                <th key={u.id} className="p-6 border-b border-r border-slate-100 last:border-r-0 bg-white min-w-[250px] relative group h-full">
                   <button onClick={() => removeUni(u.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                   <div className="flex flex-col items-start gap-2 h-full justify-between">
                     <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-indigo-50 flex items-center justify-center">
                        <img 
                          src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e0e7ff&color=4f46e5&bold=true&size=128`} 
                          alt={u.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e0e7ff&color=4f46e5&bold=true&size=128`;
                          }}
                        />
                     </div>
                     <div>
                       <h3 className="text-base font-bold text-slate-900 leading-tight">{u.name}</h3>
                       <p className="text-xs font-semibold text-purple-600 mt-1">{u.location}, {u.country}</p>
                     </div>
                   </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr, idx) => (
              <tr key={attr.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="p-4 px-6 border-r border-slate-100 font-bold text-slate-700 text-sm">
                  {attr.label}
                </td>
                {universities.map(u => {
                   let displayVal = '';
                   let isBest = false;
                   let val = getUniVal(u, attr.key);

                   if (val === undefined || val === null || val === '' || (typeof val === 'number' && isNaN(val))) {
                     if (attr.key === 'ranking') displayVal = 'Not Ranked';
                     else if (attr.key === 'scholarships') displayVal = 'No Data';
                     else if (attr.key === 'match') displayVal = 'Complete Profile';
                     else displayVal = 'Not Available';
                   } else {
                     if (attr.type === 'currency') {
                       const getNum = (v: any) => typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, '').match(/\d+(\.\d+)?/)?.[0] || 'NaN');
                       const validVals = universities.map(x => getUniVal(x, attr.key)).filter(v => v !== undefined && v !== null && v !== '');
                       const parsedVals = validVals.map(getNum).filter(v => !isNaN(v));
                       const parsedVal = getNum(val);
                       
                       if (parsedVals.length > 0 && !isNaN(parsedVal)) isBest = parsedVal === Math.min(...parsedVals);
                       
                       if (typeof val === 'string' && (val.includes('-') || val.includes('–'))) {
                         displayVal = val.startsWith('$') ? val : `$${val}`;
                       } else {
                         displayVal = `$${!isNaN(parsedVal) ? parsedVal.toLocaleString() : val}`;
                       }
                       if (!displayVal.includes('/')) displayVal += '/year';
                     } else if (attr.type === 'number') {
                       const validVals = universities.map(x => getUniVal(x, attr.key)).filter(v => v !== undefined && v !== null && v !== '');
                       const parsedVals = validVals.map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''))).filter(v => !isNaN(v));
                       const parsedVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
                       
                       if (parsedVals.length > 0 && !isNaN(parsedVal)) {
                         if (attr.inverted) isBest = parsedVal === Math.min(...parsedVals);
                         else isBest = parsedVal === Math.max(...parsedVals);
                       }
                       displayVal = attr.key === 'ranking' || attr.key === 'qsRanking' ? `#${val}` : String(val);
                     } else if (attr.type === 'percentage') {
                       const validVals = universities.map(x => getUniVal(x, attr.key)).filter(v => v !== undefined && v !== null && v !== '');
                       const parsedVals = validVals.map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''))).filter(v => !isNaN(v));
                       const parsedVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
                       if (parsedVals.length > 0 && !isNaN(parsedVal)) isBest = parsedVal === Math.max(...parsedVals);
                       displayVal = `${val}${attr.key === 'researchScore' ? ' / 100' : '%'}`;
                     } else if (attr.type === 'boolean') {
                       displayVal = val ? 'Yes' : 'No';
                       isBest = val === true;
                     } else {
                       displayVal = String(val);
                     }
                   }

                   return (
                     <td key={u.id} className="p-4 px-6 text-sm font-medium border-slate-100 relative group">
                       {attr.type === 'boolean' ? (
                          <span className={isBest ? 'text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md' : 'text-slate-500'}>
                            {displayVal}
                          </span>
                       ) : (
                          <span className={isBest ? 'text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-md' : 'text-slate-600'}>
                            {displayVal}
                          </span>
                       )}
                     </td>
                   )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
