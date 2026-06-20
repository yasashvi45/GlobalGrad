import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, GraduationCap, DollarSign, Calendar, CheckCircle2, Bookmark, Target, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getScholarships } from '@/services/scholarshipService';
import { getTable, saveToTable, deleteFromTable } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function ScholarshipDetails() {
  const { userData } = useAuth();
  const { id } = useParams();
  const [scholarship, setScholarship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedRecords, setSavedRecords] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!userData?.id) return;
      setLoading(true);
      const [allScholars, saved] = await Promise.all([
        getScholarships(),
        getTable('scholarships_saved')
      ]);
      const schol = allScholars.find((s: any) => String(s.id) === String(id));
      setScholarship(schol);
      
      const userSaved = saved.filter((s:any) => String(s.userId) === String(userData?.id));
      setSavedRecords(userSaved);
      setIsSaved(userSaved.some((s:any) => String(s.scholarshipId) === String(id)));
      
      setLoading(false);
    }
    loadData();
  }, [id, userData?.id]);

  const toggleSave = async () => {
    if (!scholarship) return;
    if (isSaved) {
      const existing = savedRecords.find(s => String(s.scholarshipId) === String(scholarship.id));
      if (existing) {
         await deleteFromTable('scholarships_saved', existing.id);
         setSavedRecords(prev => prev.filter(s => s.id !== existing.id));
      }
      setIsSaved(false);
      window.dispatchEvent(new Event('saved_items_changed'));
    } else {
      const newlySaved = await saveToTable('scholarships_saved', { userId: userData?.id, scholarshipId: scholarship.id });
      setSavedRecords(prev => [...prev, newlySaved]);
      setIsSaved(true);
      window.dispatchEvent(new Event('saved_items_changed'));
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Scholarship Details...</div>;
  if (!scholarship) return <div className="p-8 text-center text-rose-500 font-bold">Scholarship not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 p-4 sm:p-8">
      <Link to="/app/scholarships" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2">
         <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scholarships
      </Link>
      
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
         <div className="p-8 md:p-12 bg-gradient-to-br from-rose-50 to-indigo-50 border-b border-slate-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Target className="w-64 h-64" />
             </div>
             
             <div className="relative z-10">
                 <div className="flex flex-wrap gap-2 mb-4">
                     <span className="bg-white text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">{scholarship.type}</span>
                     <span className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">{scholarship.degreeLevel}</span>
                 </div>
                 
                 <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-4 tracking-tight">{scholarship.name}</h1>
                 
                 <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-slate-600 font-medium mb-8">
                     <div className="flex items-center gap-2">
                         <GraduationCap className="w-5 h-5 text-indigo-600" />
                         <span>{scholarship.university}</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <MapPin className="w-5 h-5 text-indigo-600" />
                         <span>{scholarship.country}</span>
                     </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                     <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 px-8 shadow-lg shadow-rose-600/20" onClick={() => window.open('https://example.com', '_blank')}>
                        Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                     </Button>
                     <Button onClick={toggleSave} variant="outline" className={`h-12 px-8 font-bold ${isSaved ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white'}`}>
                        {isSaved ? 'Saved' : 'Save Scholarship'} <Bookmark className={`w-4 h-4 ml-2 ${isSaved ? 'fill-current' : ''}`} />
                     </Button>
                 </div>
             </div>
         </div>
         
         <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 space-y-8">
                 <section>
                     <h3 className="text-xl font-bold text-slate-900 mb-4">Overview</h3>
                     <p className="text-slate-600 font-medium leading-relaxed">
                         The {scholarship.name} is designed to support outstanding international students demonstrating academic excellence and leadership potential. It aims to foster diverse perspectives within the {scholarship.university} community.
                     </p>
                 </section>
                 
                 <section>
                     <h3 className="text-xl font-bold text-slate-900 mb-4">Eligibility Criteria</h3>
                     <ul className="space-y-3">
                         <li className="flex items-start gap-3">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                             <span className="text-slate-600 font-medium">Must be an international applicant applying for a {scholarship.degreeLevel} program.</span>
                         </li>
                         <li className="flex items-start gap-3">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                             <span className="text-slate-600 font-medium">Minimum GPA of 3.5 or equivalent in previous academic studies.</span>
                         </li>
                         <li className="flex items-start gap-3">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                             <span className="text-slate-600 font-medium">Demonstrated leadership and community involvement.</span>
                         </li>
                     </ul>
                 </section>
                 
                 <section>
                     <h3 className="text-xl font-bold text-slate-900 mb-4">Application Process</h3>
                     <ol className="list-decimal pl-5 space-y-2 text-slate-600 font-medium">
                        <li>Submit your main admission application to {scholarship.university}.</li>
                        <li>Complete the separate scholarship application form via the financial aid portal.</li>
                        <li>Upload all required documents including SOP and financial statements.</li>
                        <li>Shortlisted candidates may be invited for an online interview.</li>
                     </ol>
                 </section>
             </div>
             
             <div className="space-y-6">
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                     <h3 className="font-bold text-slate-900 mb-4">Key Details</h3>
                     
                     <div className="space-y-4">
                         <div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Funding Amount</p>
                             <p className="text-lg font-black text-rose-600 flex items-center gap-1.5"><DollarSign className="w-5 h-5" /> {scholarship.amount}</p>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deadline</p>
                             <p className="text-lg font-black text-slate-900 flex items-center gap-1.5"><Calendar className="w-5 h-5" /> {scholarship.deadline}</p>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Match Score</p>
                             <p className={`text-lg font-black ${scholarship.match > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {scholarship.match}% Probability
                             </p>
                         </div>
                     </div>
                 </div>
                 
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                     <h3 className="font-bold text-slate-900 mb-3">Required Documents</h3>
                     <ul className="space-y-2 text-sm font-medium text-slate-600 list-disc pl-4">
                        <li>Academic Transcripts</li>
                        <li>Statement of Purpose</li>
                        <li>2 Letters of Recommendation</li>
                        <li>Proof of English Proficiency</li>
                     </ul>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
