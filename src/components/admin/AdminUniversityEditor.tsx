import React, { useState, useEffect } from 'react';
import { Save, X, Copy, Archive, CheckCircle, UploadCloud, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { createUniversity, updateUniversity } from '@/services/universityService';
import { getCountries } from '@/services/countryService';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function AdminUniversityEditor({ uni, onClose, onRefresh }: { uni: any, onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState<any>(uni || {});
  const [activeTab, setActiveTab] = useState('overview');
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadProgressLogo, setUploadProgressLogo] = useState(0);
  const [fallbackLogoMode, setFallbackLogoMode] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [uploadProgressHero, setUploadProgressHero] = useState(0);
  const [fallbackHeroMode, setFallbackHeroMode] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    setLoadingCountries(true);
    getCountries().then(data => {
      console.log("Countries fetched:", data);
      console.log("Countries count:", data?.length || 0);
      console.log("Country names:", data?.map((c: any) => c.name || c.countryName || c.title).join(', '));
      setCountries(data || []);
      setLoadingCountries(false);
    }).catch(err => {
      console.error("Error fetching countries:", err);
      setLoadingCountries(false);
    });
  }, []);

  const handleImageUpload = (file: File | null, type: 'logo' | 'hero') => {
    if (!file) return;
    console.log(`[${type}] File selected:`, file.name, 'Size:', file.size);
    if (!storage) {
       console.error("Firebase Storage is not initialized.");
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Firebase Storage not initialized', type: 'error' } }));
       return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image must be under 5MB', type: 'error' } }));
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Only JPG, PNG, WEBP are allowed', type: 'error' } }));
       return;
    }

    let itemId = formData.id;
    if (!itemId) {
      itemId = Date.now().toString();
      setFormData((prev: any) => ({ ...prev, id: itemId }));
    }

    const storagePath = `universities/${itemId}/${type}`;
    console.log(`[${type}] Upload started for path: ${storagePath}`);
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    if (type === 'logo') {
      setUploadProgressLogo(0);
      setIsUploadingLogo(true);
    } else {
      setUploadProgressHero(0);
      setIsUploadingHero(true);
    }

    let timeout = setTimeout(() => {
       console.error(`[${type}] Upload timeout (10s elapsed with no completion).`);
       if (type === 'logo') { setIsUploadingLogo(false); setFallbackLogoMode(true); }
       else { setIsUploadingHero(false); setFallbackHeroMode(true); }
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploads unavailable in preview mode. Please use a URL.', type: 'error' } }));
       uploadTask.cancel();
    }, 10000);

    uploadTask.on('state_changed',
      (snapshot) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
           console.error(`[${type}] Upload timeout (10s elapsed with no progress).`);
           if (type === 'logo') { setIsUploadingLogo(false); setFallbackLogoMode(true); }
           else { setIsUploadingHero(false); setFallbackHeroMode(true); }
           window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploads unavailable in preview mode. Please use a URL.', type: 'error' } }));
           uploadTask.cancel();
        }, 10000);

        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`[${type}] Upload progress: ${progress}% (${snapshot.bytesTransferred} / ${snapshot.totalBytes})`);
        if (type === 'logo') setUploadProgressLogo(progress);
        else setUploadProgressHero(progress);
      },
      (error) => {
        clearTimeout(timeout);
        console.error(`[${type}] Upload errors:`, error);
        if (type === 'logo') { setIsUploadingLogo(false); setFallbackLogoMode(true); }
        else { setIsUploadingHero(false); setFallbackHeroMode(true); }
        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploads unavailable in preview mode. Please use a URL.', type: 'error' } }));
      },
      async () => {
        clearTimeout(timeout);
        console.log(`[${type}] Upload success`);
        try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[${type}] Download URL generated:`, downloadURL);
            if (type === 'logo') {
               setFormData((prev: any) => ({ ...prev, logoImage: downloadURL, logoUrl: downloadURL }));
               setIsUploadingLogo(false);
            } else {
               setFormData((prev: any) => ({ ...prev, heroImage: downloadURL, imageUrl: downloadURL }));
               setIsUploadingHero(false);
            }
            window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Image uploaded successfully' } }));
        } catch (e) {
            console.error(`[${type}] Error getting download URL:`, e);
            if (type === 'logo') setIsUploadingLogo(false);
            else setIsUploadingHero(false);
            window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to get image URL', type: 'error' } }));
        }
      }
    );
  };

  const validate = () => {
    const tempErrors: any = {};
    if (!formData.name) tempErrors.name = 'University Name is required';
    if (!formData.country) tempErrors.country = 'Country is required';
    if (!formData.logoImage && !formData.logoUrl) tempErrors.logoImage = 'University Logo is required';
    if (!formData.heroImage && !formData.imageUrl) tempErrors.heroImage = 'Campus Hero Image is required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Please fix the errors before saving', type: 'error' } }));
       // Switch to the first tab with an error if needed. Overivew or Media
       if (errors.name || errors.country) setActiveTab('overview');
       else if (errors.logoImage || errors.heroImage) setActiveTab('media');
       return;
    }
    try {
      if (uni?.id) {
        await updateUniversity(uni.id, formData);
      } else {
        await createUniversity(formData);
      }
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `University saved successfully` } }));
      onRefresh();
      onClose();
    } catch (err) { }
  };

  const handleAction = async (action: string) => {
    try {
      if (action === 'archived') {
         const newForm = { ...formData, status: 'Archived' };
         setFormData(newForm);
         if (uni?.id) await updateUniversity(uni.id, newForm);
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `University archived successfully.` } }));
      } else if (action === 'published') {
         const newForm = { ...formData, status: 'Published' };
         setFormData(newForm);
         if (uni?.id) await updateUniversity(uni.id, newForm);
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `University published successfully.` } }));
      } else if (action === 'duplicated') {
         const newUniversity = { ...formData };
         delete newUniversity.id;
         newUniversity.name = `${newUniversity.name} (Copy)`;
         newUniversity.status = 'Draft';
         await createUniversity(newUniversity);
         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `University duplicated successfully.` } }));
         onClose();
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats & Ranking' },
    { id: 'financials', label: 'Fees & Cost' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'media', label: 'Media & Gallery' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
           <div>
             <h2 className="text-2xl font-black text-slate-900">{formData.id && uni ? 'Edit University Data' : 'Create University Card'}</h2>
             <div className="text-slate-500 font-medium text-sm mt-1">Changes sync instantly to the student directory.</div>
           </div>
           <div className="flex items-center gap-2">
              {formData.id && uni && (
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
          <form id="uni-form" className="max-w-3xl space-y-6 pb-20">
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Basic Info</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-1">University Name <span className="text-rose-500">*</span></label>
                     <input value={formData.name || ''} onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''}); }} className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:bg-white focus:ring-2 text-sm font-bold`} placeholder="e.g. University of Melbourne" />
                     {errors.name && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.name}</p>}
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Country <span className="text-rose-500">*</span></label>
                     <select value={formData.country || ''} onChange={e => { 
                        console.log("Selected country:", e.target.value);
                        setFormData({...formData, country: e.target.value}); 
                        setErrors({...errors, country: ''}); 
                     }} className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.country ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl focus:bg-white focus:ring-2 text-sm font-medium`}>
                        <option value="">Select country</option>
                        {loadingCountries ? (
                          <option value="" disabled>Loading countries...</option>
                        ) : countries.length === 0 ? (
                          <option value="" disabled>No countries created yet</option>
                        ) : (
                          countries.map(c => {
                            const name = c.name || c.countryName || c.title || 'Unknown';
                            return <option key={c.id} value={name}>{name}</option>;
                          })
                        )}
                     </select>
                     {errors.country && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.country}</p>}
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                     <input value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. Melbourne" />
                   </div>
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                     <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none" placeholder="Brief overview of the university, strengths, student life, research opportunities and international reputation."></textarea>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Rankings & Statistics</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">World Ranking</label>
                     <input type="number" value={formData.rank || ''} onChange={e => setFormData({...formData, rank: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 35" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">QS Ranking</label>
                     <input type="number" value={formData.qsRanking || ''} onChange={e => setFormData({...formData, qsRanking: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 13" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Acceptance Rate (%)</label>
                     <input type="number" value={formData.acceptanceRate || ''} onChange={e => setFormData({...formData, acceptanceRate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 68" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Employability Rate (%)</label>
                     <input type="number" value={formData.employabilityRate || formData.employability || ''} onChange={e => setFormData({...formData, employabilityRate: Number(e.target.value), employability: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 94" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">THE Ranking</label>
                     <input type="number" value={formData.theRank || formData.theRanking || ''} onChange={e => setFormData({...formData, theRank: Number(e.target.value), theRanking: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 1" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Research Output Score</label>
                     <input type="number" value={formData.researchScore || ''} onChange={e => setFormData({...formData, researchScore: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 95" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Total Students</label>
                     <input value={formData.totalStudents || ''} onChange={e => setFormData({...formData, totalStudents: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 54000" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Application Deadline</label>
                     <input value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 2027-01-15" />
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Financial Information</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Average Tuition (Text Label)</label>
                     <input value={formData.tuitionRange || formData.tuitionFee || ''} onChange={e => setFormData({...formData, tuitionRange: e.target.value, tuitionFee: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 42000 USD/year" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Annual Tuition (Number USD)</label>
                     <input type="number" value={formData.tuition || formData.annualTuition || ''} onChange={e => setFormData({...formData, tuition: Number(e.target.value), annualTuition: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 42000" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Living Cost</label>
                     <input value={formData.livingCost || ''} onChange={e => setFormData({...formData, livingCost: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 18000 USD/year" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Application Fee</label>
                     <input value={formData.applicationFee || ''} onChange={e => setFormData({...formData, applicationFee: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 100 USD" />
                   </div>
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-1">Scholarship Info</label>
                     <input value={formData.scholarshipsCount || formData.scholarshipsAvailable || formData.scholarships || ''} onChange={e => setFormData({...formData, scholarshipsCount: e.target.value, scholarshipsAvailable: e.target.value, scholarships: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. Merit-based scholarships up to 50% for international students." />
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Entry Requirements</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Minimum IELTS Score</label>
                     <input type="number" step="0.5" value={formData.minIELTS || ''} onChange={e => setFormData({...formData, minIELTS: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 6.5" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Minimum TOEFL Score</label>
                     <input type="number" value={formData.minTOEFL || ''} onChange={e => setFormData({...formData, minTOEFL: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 90" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Minimum GRE Score</label>
                     <input type="number" value={formData.minGRE || ''} onChange={e => setFormData({...formData, minGRE: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. 315" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Visa Difficulty</label>
                     <input value={formData.visaDifficulty || ''} onChange={e => setFormData({...formData, visaDifficulty: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="e.g. Easy, Moderate, Competitive" />
                   </div>
                   <div className="sm:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-1">Programs Offered</label>
                     <textarea rows={3} value={formData.programsOffered || ''} onChange={e => setFormData({...formData, programsOffered: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none" placeholder="e.g. Computer Science, Data Science, MBA, Mechanical Engineering"></textarea>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Media & Gallery</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   
                   <div className="col-span-1">
                     <label className="block text-sm font-bold text-slate-700 mb-2">University Logo <span className="text-rose-500">*</span></label>
                     {fallbackLogoMode ? (
                        <div className="space-y-3">
                          <input value={formData.logoImage || formData.logoUrl || ''} onChange={e => setFormData({...formData, logoImage: e.target.value, logoUrl: e.target.value})} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium`} placeholder="https://..." />
                          {(formData.logoImage || formData.logoUrl) && (
                            <div className="relative w-full h-40 bg-white flex items-center justify-center p-4 rounded-2xl border border-slate-200">
                               <img src={formData.logoImage || formData.logoUrl} alt="Logo Preview" className="w-32 h-32 object-contain" />
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                            <span>Image upload unavailable. Paste image URL instead.</span>
                            <button type="button" onClick={() => setFallbackLogoMode(false)} className="text-indigo-600 hover:text-indigo-700">Retry Upload</button>
                          </div>
                        </div>
                     ) : (
                     <div 
                       onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                       onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files[0], 'logo'); }}
                       className={`relative w-full rounded-2xl border-2 border-dashed ${errors.logoImage ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'} overflow-hidden group hover:bg-slate-100 transition-colors`}
                     >
                        {(formData.logoImage || formData.logoUrl) && !isUploadingLogo ? (
                          <div className="relative w-full h-40 bg-white flex items-center justify-center p-4">
                            <img src={formData.logoImage || formData.logoUrl} alt="Logo" className="w-32 h-32 object-contain" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <label className="cursor-pointer px-4 py-2 bg-white/90 backdrop-blur text-slate-800 text-sm font-bold rounded-lg shadow-sm hover:bg-white transition flex items-center gap-2">
                                 <UploadCloud className="w-4 h-4" /> Change
                                 <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'logo')} />
                               </label>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                            {isUploadingLogo ? (
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 mb-3 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                                <div className="text-sm font-bold text-slate-700">Uploading... {uploadProgressLogo}%</div>
                              </div>
                            ) : (
                              <>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                                <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition">
                                  Choose Logo
                                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'logo')} />
                                </label>
                                <div className="text-xs font-medium text-slate-400 mt-2">JPG, PNG (Max 5MB)</div>
                                {errors.logoImage && <p className="text-rose-500 text-xs mt-2 font-semibold">{errors.logoImage}</p>}
                              </>
                            )}
                          </div>
                        )}
                     </div>
                     )}
                   </div>

                   <div className="col-span-1">
                     <label className="block text-sm font-bold text-slate-700 mb-2">Campus Hero Image <span className="text-rose-500">*</span></label>
                     {fallbackHeroMode ? (
                        <div className="space-y-3">
                          <input value={formData.heroImage || formData.imageUrl || ''} onChange={e => setFormData({...formData, heroImage: e.target.value, imageUrl: e.target.value})} className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium`} placeholder="https://..." />
                          {(formData.heroImage || formData.imageUrl) && (
                            <div className="relative w-full h-40 bg-slate-200 flex items-center justify-center rounded-2xl border border-slate-200 overflow-hidden">
                               <img src={formData.heroImage || formData.imageUrl} alt="Hero Preview" className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                            <span>Image upload unavailable. Paste image URL instead.</span>
                            <button type="button" onClick={() => setFallbackHeroMode(false)} className="text-indigo-600 hover:text-indigo-700">Retry Upload</button>
                          </div>
                        </div>
                     ) : (
                     <div 
                       onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                       onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files[0], 'hero'); }}
                       className={`relative w-full rounded-2xl border-2 border-dashed ${errors.heroImage ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'} overflow-hidden group hover:bg-slate-100 transition-colors`}
                     >
                        {(formData.heroImage || formData.imageUrl) && !isUploadingHero ? (
                          <div className="relative w-full h-40 bg-slate-200 flex items-center justify-center">
                            <img src={formData.heroImage || formData.imageUrl} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <label className="cursor-pointer px-4 py-2 bg-white/90 backdrop-blur text-slate-800 text-sm font-bold rounded-lg shadow-sm hover:bg-white transition flex items-center gap-2">
                                 <UploadCloud className="w-4 h-4" /> Change
                                 <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'hero')} />
                               </label>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                            {isUploadingHero ? (
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-10 h-10 mb-3 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                                <div className="text-sm font-bold text-slate-700">Uploading... {uploadProgressHero}%</div>
                              </div>
                            ) : (
                              <>
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                                  <UploadCloud className="w-6 h-6" />
                                </div>
                                <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition">
                                  Choose Campus Image
                                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleImageUpload(e.target.files?.[0] || null, 'hero')} />
                                </label>
                                <div className="text-xs font-medium text-slate-400 mt-2">JPG, WEBP, PNG (Max 5MB)</div>
                                {errors.heroImage && <p className="text-rose-500 text-xs mt-2 font-semibold">{errors.heroImage}</p>}
                              </>
                            )}
                          </div>
                        )}
                     </div>
                     )}
                   </div>

                 </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
            <button onClick={onClose} type="button" className="px-6 py-3 font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-2">
               Cancel
            </button>
            <button onClick={handleSave} type="button" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20">
               <Save className="w-4 h-4" /> Save University Card
            </button>
        </div>
      </motion.div>
    </div>
  );
}
