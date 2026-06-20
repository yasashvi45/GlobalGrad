import React, { useState } from 'react';
import { Save, X, Globe, DollarSign, Cloud, Copy, Archive, CheckCircle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { createCountry, updateCountry } from '@/services/countryService';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function AdminCountryEditor({ country, onClose, onRefresh }: { country: any, onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState<any>(country || {});
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image must be under 5MB', type: 'error' } }));
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Only JPG, PNG, WEBP are allowed', type: 'error' } }));
       return;
    }

    let countryId = formData.id;
    if (!countryId) {
      countryId = Date.now().toString();
      setFormData((prev: any) => ({ ...prev, id: countryId }));
    }

    const storageRef = ref(storage, `countries/${countryId}/hero-image`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadProgress(0);
    setIsUploading(true);
    setFallbackMode(false);

    let timeout = setTimeout(() => {
       console.error(`Upload timeout (10s elapsed with no completion).`);
       setIsUploading(false);
       setFallbackMode(true);
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploads unavailable in preview mode. Please use a URL.', type: 'error' } }));
       uploadTask.cancel();
    }, 10000);

    uploadTask.on('state_changed',
      (snapshot) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
           console.error(`Upload timeout (10s elapsed with no progress).`);
           setIsUploading(false);
           setFallbackMode(true);
           window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploads unavailable in preview mode. Please use a URL.', type: 'error' } }));
           uploadTask.cancel();
        }, 10000);
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        clearTimeout(timeout);
        setIsUploading(false);
        setFallbackMode(true);
        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploads unavailable in preview mode. Please use a URL.', type: 'error' } }));
        console.error(error);
      },
      async () => {
        clearTimeout(timeout);
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev: any) => ({ ...prev, heroImage: downloadURL, image: downloadURL }));
        setIsUploading(false);
        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploaded successfully' } }));
      }
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name) {
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Country Name is required', type: 'error' } }));
       return;
    }
    try {
      if (country?.id) {
        await updateCountry(country.id, formData);
      } else {
        await createCountry(formData);
      }
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Country saved successfully` } }));
      onRefresh();
      onClose();
    } catch (err) { }
  };

  const handleAction = async (action: string) => {
    try {
      if (action === 'archived') {
          const newForm = { ...formData, isActive: false };
          setFormData(newForm);
          if (country?.id) await updateCountry(country.id, newForm);
          window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Country archived successfully.` } }));
      } else if (action === 'published') {
          const newForm = { ...formData, isActive: true };
          setFormData(newForm);
          if (country?.id) await updateCountry(country.id, newForm);
          window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Country published successfully.` } }));
      } else if (action === 'duplicated') {
          const newCountry = { ...formData };
          delete newCountry.id;
          newCountry.name = `${newCountry.name} (Copy)`;
          newCountry.isActive = false;
          await createCountry(newCountry);
          window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Country duplicated successfully.` } }));
          onClose();
      }
      onRefresh();
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Action failed.`, type: 'error' } }));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & General' },
    { id: 'economics', label: 'Economics & Cost' },
    { id: 'visas', label: 'Visas & Work' },
    { id: 'education', label: 'Education & Stats' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
           <div>
             <h2 className="text-2xl font-black text-slate-900">{formData.id ? 'Edit Country Profile' : 'Create Country Profile'}</h2>
             <div className="text-slate-500 font-medium text-sm mt-1">Changes sync instantly to the student country explorer.</div>
           </div>
           <div className="flex items-center gap-2">
              {formData.id && (
                 <>
                   <button onClick={() => handleAction('duplicated')} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition tooltip" title="Duplicate"><Copy className="w-5 h-5"/></button>
                   <button onClick={() => handleAction('archived')} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition tooltip" title="Archive"><Archive className="w-5 h-5"/></button>
                   <button onClick={() => handleAction('published')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition tooltip" title="Publish"><CheckCircle className="w-5 h-5"/></button>
                 </>
              )}
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
           </div>
        </div>

        <div className="flex border-b border-slate-200 px-6 bg-slate-50 overflow-x-auto shrink-0">
          {tabs.map(t => (
            <button 
              key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${activeTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <form id="country-form" onSubmit={handleSave} className="max-w-3xl space-y-6 pb-20">
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Basic Information</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Country Name <span className="text-rose-500">*</span></label>
                     <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Capital City</label>
                     <input value={formData.capital || ''} onChange={e => setFormData({...formData, capital: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                     <select value={formData.status || 'Published'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold">
                       <option value="Published">Published</option>
                       <option value="Draft">Draft</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Region</label>
                     <input value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Language</label>
                     <input value={formData.language || ''} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Flag URL / Emoji</label>
                     <input value={formData.flagUrl || formData.flag || ''} onChange={e => {
                       const val = e.target.value;
                       setFormData({...formData, flagUrl: val, flag: val, flagEmoji: val});
                     }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="URL or 🇨🇦" />
                   </div>
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-2">Hero Image</label>
                     {fallbackMode ? (
                        <div className="space-y-3">
                          <input value={formData.heroImage || formData.image || ''} onChange={e => setFormData({...formData, heroImage: e.target.value, image: e.target.value})} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium`} placeholder="https://..." />
                          {(formData.heroImage || formData.image) && (
                            <div className="relative w-full h-40 bg-slate-200 flex items-center justify-center rounded-2xl border border-slate-200 overflow-hidden">
                               <img src={formData.heroImage || formData.image} alt="Hero Preview" className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                            <span>Image upload unavailable. Paste image URL instead.</span>
                            <button type="button" onClick={() => setFallbackMode(false)} className="text-indigo-600 hover:text-indigo-700">Retry Upload</button>
                          </div>
                        </div>
                     ) : (
                     <div 
                       onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                       onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files[0]); }}
                       className="relative w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden group hover:bg-slate-100 hover:border-indigo-300 transition-colors"
                     >
                        {(formData.heroImage || formData.image) && !isUploading ? (
                          <div className="relative w-full h-56 bg-slate-200 flex items-center justify-center">
                            <img src={formData.heroImage || formData.image} alt="Hero Preview" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <label className="cursor-pointer px-4 py-2 bg-white/90 backdrop-blur text-slate-800 text-sm font-bold rounded-lg shadow-sm hover:bg-white transition flex items-center gap-2">
                                 <UploadCloud className="w-4 h-4" /> Change Image
                                 <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} />
                               </label>
                            </div>
                          </div>
                        ) : (
                          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                            {isUploading ? (
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-12 h-12 mb-3 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                                <div className="text-sm font-bold text-slate-700">Uploading... {uploadProgress}%</div>
                                <div className="w-48 h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                                  <UploadCloud className="w-7 h-7" />
                                </div>
                                <div className="text-sm font-black text-slate-800 mb-1">Drag & drop your image here</div>
                                <div className="text-xs font-semibold text-slate-500 mb-4">Accepts JPG, PNG, WEBP (Max 5MB)</div>
                                <label className="cursor-pointer px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition focus-within:ring-2 focus-within:ring-indigo-500">
                                  Choose Image
                                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e.target.files?.[0] || null)} />
                                </label>
                              </>
                            )}
                          </div>
                        )}
                     </div>
                     )}
                   </div>
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-1">Description (Overview)</label>
                     <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none"></textarea>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Weather / Climate</label>
                     <input value={formData.weather || ''} onChange={e => setFormData({...formData, weather: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Safety Score (0-100)</label>
                     <input type="number" value={formData.safetyScore || ''} onChange={e => setFormData({...formData, safetyScore: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'economics' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Financials & Costs</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                     <input value={formData.currency || ''} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Average Tuition Range (Display String)</label>
                     <input value={formData.averageTuition || ''} onChange={e => setFormData({...formData, averageTuition: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. $20,000 - $50,000 AUD/year" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Average Living Cost (Display String)</label>
                     <input value={formData.livingCost || ''} onChange={e => setFormData({...formData, livingCost: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. $21,000 - $30,000 AUD/year" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Average Tuition / Year ($ USD - Numeric)</label>
                     <input type="number" value={formData.avgTuition || ''} onChange={e => setFormData({...formData, avgTuition: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Living Cost / Year ($ USD - Numeric)</label>
                     <input type="number" value={formData.costOfLiving || ''} onChange={e => setFormData({...formData, costOfLiving: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Graduation Base Salary ($ USD)</label>
                     <input type="number" value={formData.gradSalary || ''} onChange={e => setFormData({...formData, gradSalary: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                   </div>
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-1">Scholarships Available</label>
                     <input value={formData.scholarshipAvail || ''} onChange={e => setFormData({...formData, scholarshipAvail: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. Government & University level" />
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'visas' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Visas & Work Opportunities</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Visa Process / Difficulty</label>
                     <input value={formData.visaDifficulty || formData.visaType || ''} onChange={e => setFormData({...formData, visaDifficulty: e.target.value, visaType: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. Strict, Point-based, Easy" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">PR Opportunities</label>
                     <input value={formData.prOpportunities || formData.prDifficulty || ''} onChange={e => setFormData({...formData, prOpportunities: e.target.value, prDifficulty: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. High, Route exists" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Part-Time Work Limits</label>
                     <input value={formData.workPermit || formData.partTimeWork || ''} onChange={e => setFormData({...formData, workPermit: e.target.value, partTimeWork: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. 20 hrs/week" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Post-Study Visa</label>
                     <input value={formData.postStudyVisa || ''} onChange={e => setFormData({...formData, postStudyVisa: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. up to 2 years" />
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Education & Stats</h3>
                 <div className="grid grid-cols-1 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Popular Student Cities (Comma separated)</label>
                     <input value={formData.popularCities || ''} onChange={e => setFormData({...formData, popularCities: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. Sydney, Melbourne, Brisbane" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Popular Intake Months</label>
                     <input value={formData.popularIntakes || ''} onChange={e => setFormData({...formData, popularIntakes: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. February, July" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">IELTS Requirement</label>
                     <input value={formData.ieltsRequirement || ''} onChange={e => setFormData({...formData, ieltsRequirement: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. 6.0 - 6.5" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Study Level Support</label>
                     <input value={formData.studyLevels || ''} onChange={e => setFormData({...formData, studyLevels: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. UG, PG, PhD" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Top Universities (Comma separated)</label>
                     <textarea rows={3} value={formData.topUniversities || ''} onChange={e => setFormData({...formData, topUniversities: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none"></textarea>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Popular Programs / Courses</label>
                     <textarea rows={2} value={formData.popularPrograms || ''} onChange={e => setFormData({...formData, popularPrograms: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none"></textarea>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Employment Rate (%)</label>
                       <input type="number" value={formData.employmentRate || ''} onChange={e => setFormData({...formData, employmentRate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Student Satisfaction Score (0-100)</label>
                       <input type="number" value={formData.studentSatisfaction || ''} onChange={e => setFormData({...formData, studentSatisfaction: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-2">
               Cancel
            </button>
            <button onClick={() => handleSave()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20">
               <Save className="w-4 h-4" /> Save Country Card
            </button>
        </div>
      </motion.div>
    </div>
  );
}
