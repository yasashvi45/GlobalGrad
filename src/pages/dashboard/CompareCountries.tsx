import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getCountries } from '@/services/countryService';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CompareCountries() {
  const [searchParams] = useSearchParams();
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = searchParams.get('ids')?.split(',') || [];
      const allCountries = await getCountries();
      const selected = allCountries.filter((c: any) => ids.includes(c.id));
      setCountries(selected);
      setLoading(false);
    }
    load();
  }, [searchParams]);

  if (loading) return <div className="p-8 text-center animate-pulse">Loading comparison...</div>;
  if (!countries || countries.length === 0) return <div className="p-8 text-center">No countries selected.</div>;

  const attributes = [
    { key: 'avgTuition', label: 'Average Tuition / yr', type: 'currency' },
    { key: 'costOfLiving', label: 'Living Cost / mo', type: 'currency' },
    { key: 'gradSalary', label: 'Avg Grad Salary', type: 'currency' },
    { key: 'postStudyVisa', label: 'Post-Study Visa', type: 'text' },
    { key: 'prDifficulty', label: 'PR Difficulty', type: 'text' },
    { key: 'partTimeWork', label: 'Part-Time Work', type: 'text' },
    { key: 'safetyScore', label: 'Safety Index', type: 'number' },
    { key: 'visaDifficulty', label: 'Visa Difficulty', type: 'text' },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in pb-24 max-w-7xl mx-auto flex flex-col min-h-screen">
      <Link to="/app/countries" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2 w-max">
         <ArrowLeft className="w-4 h-4 mr-1" /> Back to Destinations
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Compare Destinations</h1>
          <p className="text-slate-500 mt-1 font-medium">Head-to-head comparison of your top choices.</p>
        </div>
        <div className="flex items-center gap-2">
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
                 <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Features</span>
              </th>
              {countries.map(c => (
                <th key={c.id} className="p-6 border-b border-slate-100 bg-white min-w-[250px]">
                   <div className="flex flex-col gap-3">
                     <span className="text-4xl">{c.flag}</span>
                     <div>
                       <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                       <p className="text-xs font-semibold text-indigo-600">{c.match}% Match</p>
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
                {countries.map(c => {
                   let displayVal = '';
                   let isBest = false;
                   
                   const rawVal = c[attr.key];
                   if (rawVal === undefined || rawVal === null || rawVal === '') {
                     displayVal = 'Not Available';
                   } else {
                     const val = (attr.type === 'currency' || attr.key === 'safetyScore') ? 
                        (typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.]/g, ''))) : rawVal;
                        
                     if (typeof val === 'number' && isNaN(val)) {
                       displayVal = 'Not Available';
                     } else {
                       if (attr.type === 'currency' && attr.key !== 'gradSalary') {
                         const validVals = countries.map(x => x[attr.key]).filter(v => v !== undefined && v !== null && v !== '');
                         const parsedVals = validVals.map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''))).filter(v => !isNaN(v));
                         if (parsedVals.length > 0) isBest = val === Math.min(...parsedVals);
                         displayVal = `$${val.toLocaleString()}`;
                       } else if (attr.key === 'gradSalary') {
                         const validVals = countries.map(x => x[attr.key]).filter(v => v !== undefined && v !== null && v !== '');
                         const parsedVals = validVals.map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''))).filter(v => !isNaN(v));
                         if (parsedVals.length > 0) isBest = val === Math.max(...parsedVals);
                         displayVal = `$${val.toLocaleString()}`;
                       } else if (attr.key === 'safetyScore') {
                         const validVals = countries.map(x => x[attr.key]).filter(v => v !== undefined && v !== null && v !== '');
                         const parsedVals = validVals.map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''))).filter(v => !isNaN(v));
                         if (parsedVals.length > 0) isBest = val === Math.max(...parsedVals);
                         displayVal = `${val}/100`;
                       } else if (attr.key === 'prDifficulty' || attr.key === 'visaDifficulty') {
                         displayVal = rawVal;
                         isBest = displayVal === 'Easy';
                       } else {
                         displayVal = String(rawVal);
                       }
                     }
                   }

                   return (
                     <td key={c.id} className="p-4 px-6 text-sm font-medium border-slate-100 relative group">
                       <span className={isBest ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md' : 'text-slate-600'}>
                         {displayVal}
                       </span>
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
