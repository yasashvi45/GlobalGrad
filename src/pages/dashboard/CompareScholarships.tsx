import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getScholarships } from '@/services/scholarshipService';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CompareScholarships() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = searchParams.get('ids')?.split(',') || [];
      const allItems = await getScholarships();
      const selected = allItems.filter((u: any) => ids.includes(String(u.id)));
      setItems(selected);
      setLoading(false);
    }
    load();
  }, [searchParams]);

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-500 font-medium">Loading comparison...</div>;
  if (!items || items.length === 0) return <div className="p-8 text-center text-slate-500 font-medium">No scholarships selected.</div>;

  const attributes = [
    { key: 'amount', label: 'Funding Required', type: 'text' },
    { key: 'match', label: 'AI Match Score', type: 'percentage' },
    { key: 'deadline', label: 'Application Deadline', type: 'text' },
    { key: 'country', label: 'Country / Location', type: 'text' },
    { key: 'degreeLevel', label: 'Degree Requirements', type: 'text' },
    { key: 'eligible', label: 'Eligibility Check', type: 'boolean' }
  ];

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in pb-24 max-w-7xl mx-auto flex flex-col min-h-screen">
      <Link to="/app/scholarships" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors mb-2 w-max">
         <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scholarships
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Scholarship Analytics Comparison</h1>
          <p className="text-slate-500 mt-1 font-medium">Head-to-head comparison of your matched funding opportunities.</p>
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
                 <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Metrics</span>
              </th>
              {items.map(s => (
                <th key={s.id} className="p-6 border-b border-slate-100 bg-white min-w-[250px]">
                   <div className="flex flex-col gap-3">
                     <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-rose-50 flex items-center justify-center text-2xl">
                        🎓
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-900 leading-snug">{s.name}</h3>
                       <p className="text-xs font-semibold text-rose-600 mt-1">{s.provider || s.university}</p>
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
                {items.map(s => {
                   let displayVal = '';
                   let isBest = false;
                   
                   const rawVal = s[attr.key];
                   if (rawVal === undefined || rawVal === null || rawVal === '') {
                     displayVal = 'Not Available';
                   } else {
                     if (attr.type === 'percentage') {
                       const validVals = items.map(x => x[attr.key]).filter(v => typeof v === 'number' && !isNaN(v));
                       if (validVals.length > 0) isBest = rawVal === Math.max(...validVals);
                       displayVal = `${rawVal}%`;
                     } else if (attr.type === 'boolean') {
                       displayVal = rawVal ? 'Yes' : 'No';
                       isBest = rawVal === true;
                     } else {
                       displayVal = String(rawVal);
                     }
                   }

                   return (
                     <td key={s.id} className="p-4 px-6 border-slate-100 relative group truncate">
                       <span className={`font-medium ${isBest && attr.type !== 'text' ? 'text-rose-700 font-black flex items-center gap-1.5' : 'text-slate-600'}`}>
                         {isBest && attr.type !== 'text' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                         {attr.type === 'boolean' && !s[attr.key] && <AlertTriangle className="w-4 h-4 text-amber-500 inline mr-1.5 align-text-bottom" />}
                         {displayVal}
                       </span>
                     </td>
                   );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
