import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, GraduationCap, BookOpen, PenTool, X, Camera, Trash2, MapPin, Target, ArrowRight, Save, FileText, CheckCircle2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getTable, saveToTable, deleteFromTable, logActivity } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { getProfile, updateProfileDoc } from '@/services/userService';
import { getCurrentUser } from '@/services/authService';
import { NATIONALITIES, COUNTRY_STATES } from '@/lib/countries';
import { getCountries } from '@/services/countryService';

const DEGREES = ['High School', 'Diploma', 'Bachelor of Technology', 'Bachelor of Engineering', 'Bachelor of Science', 'Bachelor of Commerce', 'Bachelor of Arts', 'BCA', 'BBA', 'B.Pharmacy', 'MBBS', 'LLB', 'Master of Technology', 'Master of Science', 'Master of Business Administration', 'Master of Commerce', 'Master of Arts', 'PhD', 'Other'];

const MAJORS_TECH = ['Computer Science', 'AI & ML', 'Data Science', 'Cyber Security', 'Information Technology', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Other'];
const MAJORS_BIZ = ['Finance', 'Marketing', 'Operations', 'HR', 'Business Analytics', 'International Business', 'Other'];
const MAJORS_GENERAL = ['Physics', 'Chemistry', 'Mathematics', 'Economics', 'Psychology', 'English', 'History', 'Other'];

const INTAKES = ['Spring 2026', 'Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028', 'Fall 2028'];
const BUDGETS = ['Under $10k', '$10k–20k', '$20k–30k', '$30k–50k', '$50k–75k', '$75k–100k', 'Above $100k'];

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>({});
  const [academic, setAcademic] = useState<any>({});
  const [prefs, setPrefs] = useState<any>({});
  const [tests, setTests] = useState<any>({});
  const [workEx, setWorkEx] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState('');
  const [dbCountries, setDbCountries] = useState<any[]>([]);

  // UI state for dropdown options
  const [degreeOther, setDegreeOther] = useState('');
  const [customMajor, setCustomMajor] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const cList = await getCountries();
      setDbCountries(cList.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')));
    } catch(e) {
      console.error(e);
    }

    let uDoc: any = {};
    const user = getCurrentUser();
    if (user) {
      const snap = await getProfile(user.uid);
      if (snap) uDoc = snap;
    } else {
       // fallback, though unlikely in a protected route
       setLoading(false);
       return;
    }
    
    // Map Firestore schema back to local state schema for the UI
    const pData = uDoc.personal || {};
    setProfile({
      firstName: pData.firstName || '',
      lastName: pData.lastName || '',
      email: uDoc.email || '',
      mobile: pData.mobile || '',
      nationality: pData.nationality || '',
      nationalityOther: '',
      locationCountry: pData.currentCountry || '',
      locationState: pData.currentState || '',
      locationCity: pData.currentCity || '',
      dob: pData.dob || '',
      gender: pData.gender || '',
      image: uDoc.photoURL || ''
    });

    const acData = uDoc.academic || {};
    setAcademic({
      currentDegree: acData.currentDegree || '',
      university: acData.currentUniversity || '',
      major: acData.targetField || '',
      gpa: acData.gpa || '',
      gpaScale: '10'
    });

    const prefData = uDoc.preferences || {};
    setPrefs({
      intake: acData.preferredIntake || '',
      budget: prefData.budget || '',
      countries: prefData.targetCountries || [],
      studyType: prefData.studyMode || '',
      postGoal: uDoc.aiProfile?.careerGoals || ''
    });

    const tData = uDoc.tests || {};
    setTests({
      ielts: tData.ielts?.status || '',
      toefl: tData.toefl?.status || '',
      pte: tData.pte?.status || '',
      gre: tData.gre || '',
      gmat: tData.gmat || ''
    });

    const wxData = uDoc.workExperience || {};
    if (wxData.years) {
      setWorkEx([{
        id: Date.now(),
        userId: user.uid,
        title: wxData.currentRole || '',
        company: wxData.currentCompany || '',
        current: true,
        startDate: '',
        endDate: ''
      }]);
    } else {
      setWorkEx([]);
    }
    
    setDocs([]);
    setLoading(false);
  }

  const handleSave = async (isDraft = false) => {
    setSaveIndicator('Saving...');
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('No user');

      const completion = calculateCompletion();
      
      const payload: any = {
        personal: {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          dob: profile.dob || '',
          gender: profile.gender || '',
          nationality: profile.nationality || '',
          currentCountry: profile.locationCountry || '',
          currentState: profile.locationState || '',
          currentCity: profile.locationCity || '',
          mobile: profile.mobile || ''
        },
        academic: {
          currentDegree: academic.currentDegree || '',
          currentUniversity: academic.university || '',
          targetField: academic.major || '',
          gpa: academic.gpa || '',
          preferredIntake: prefs.intake || ''
        },
        preferences: {
          budget: prefs.budget || '',
          targetCountries: prefs.countries || [],
          studyMode: prefs.studyType || ''
        },
        tests: {
          ielts: { status: tests.ielts, score: '' },
          toefl: { status: tests.toefl, score: '' },
          pte: { status: tests.pte, score: '' },
          gre: tests.gre || '',
          gmat: tests.gmat || ''
        },
        profileCompleted: true,
        completionPercentage: completion
      };

      if (workEx.length > 0) {
        payload.workExperience = {
          years: '1+', // approx since we are picking first item
          currentCompany: workEx[0].company || '',
          currentRole: workEx[0].title || ''
        };
      }

      await updateProfileDoc(user.uid, payload);
      
      await logActivity('Profile Updated', 'You updated your personal and academic profile.', 'app', 'text-indigo-600', 'bg-indigo-100', 'User');
      setSaveIndicator('Saved');
      setTimeout(() => setSaveIndicator(''), 2000);
      window.dispatchEvent(new Event('profileUpdated'));
      window.dispatchEvent(new Event('saved_items_changed'));
      
      if(!isDraft) {
        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Profile updated successfully!', type: 'success' } }));
        setIsEditing(false);
        setStep(1);
      }
    } catch(err) {
      setSaveIndicator('Error saving');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateCompletion = () => {
    let filled = 0;
    let total = 14; 
    if(profile.firstName) filled++;
    if(profile.nationality) filled++;
    if(profile.locationCountry) filled++;
    if(academic.currentDegree) filled++;
    if(academic.university) filled++;
    if(academic.gpa) filled++;
    if(prefs.intake) filled++;
    if(prefs.budget) filled++;
    if(prefs.countries?.length > 0) filled++;
    if(tests.ielts || tests.toefl || tests.pte) filled++;
    if(workEx.length > 0) filled++;
    if(docs.length > 0) filled++;
    if(prefs.studyType) filled++;
    if(prefs.postGoal) filled++;
    return Math.round((filled / total) * 100);
  };

  const removeTargetCountry = (c: string) => {
    setPrefs({ ...prefs, countries: prefs.countries.filter((x:string) => x !== c) });
  };

  const addWorkEx = () => {
    const id = Date.now();
    setWorkEx([...workEx, { id, userId: (Number(localStorage.getItem('userId')) || 1), title: '', company: '', startDate: '', endDate: '', current: false }]);
  };

  const updateWorkEx = (index: number, field: string, value: any) => {
    const newW = [...workEx];
    newW[index] = { ...newW[index], [field]: value };
    if(field === 'current' && value) newW[index].endDate = '';
    setWorkEx(newW);
  };

  const saveWorkExToDb = async () => {
    const existing = await getTable('work_experience');
    const myExisting = existing.filter((x:any) => x.userId === (Number(localStorage.getItem('userId')) || 1));
    for(const wx of myExisting) {
      await deleteFromTable('work_experience', wx.id);
    }
    for(const w of workEx) {
      await saveToTable('work_experience', w);
    }
  };

  const getMajorOptions = () => {
    const deg = academic.currentDegree || '';
    if(deg.includes('Technology') || deg.includes('Engineering') || deg.includes('BCA') || deg.includes('Science')) return MAJORS_TECH;
    if(deg.includes('Business') || deg.includes('Commerce') || deg.includes('BBA')) return MAJORS_BIZ;
    return MAJORS_GENERAL;
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Profile...</div>;

  const completion = calculateCompletion();

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          <div className="relative group shrink-0 animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden shrink-0">
              <img src={profile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent((profile.firstName || 'User') + ' ' + (profile.lastName || ''))}&background=4F46E5&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {(isEditing || !profile.firstName) && (
              <button title="Upload photo" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60 transition-colors cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 leading-tight">
              {profile.firstName || 'New'} {profile.lastName || 'User'}
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 mt-2 font-medium text-sm text-slate-500">
              <span className="flex items-center gap-1.5 justify-center">
                <MapPin className="w-4 h-4 text-slate-400"/>
                {profile.locationCity ? `${profile.locationCity}, ` : ''}{profile.locationCountry || 'Add Location'}
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className={`font-bold bg-slate-50 border px-2.5 py-0.5 rounded-full text-xs ${completion > 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                Profile {completion}% Complete
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {saveIndicator && <span className="text-xs font-bold text-slate-500 animate-pulse">{saveIndicator}</span>}
          {isEditing ? (
             <div className="flex gap-2 w-full justify-center md:justify-end">
               <Button variant="outline" className="flex-1 md:flex-initial" onClick={() => setIsEditing(false)}>Cancel</Button>
               <Button onClick={() => { saveWorkExToDb(); handleSave(true); }} className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6"><Save className="w-4 h-4 mr-2" /> Save Draft</Button>
             </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full md:w-auto bg-slate-900 text-white font-bold h-11 px-6 justify-center"><PenTool className="w-4 h-4 mr-2" /> Edit Master Profile</Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
           <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
               <h3 className="font-bold text-xl text-slate-900 tracking-tight">Profile Setup</h3>
               <p className="text-sm font-medium text-slate-500 mt-1">Step {step} of 8 — All changes sync across your dashboard.</p>
             </div>
             <div className="w-full md:w-48">
               <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{width: `${(step/8)*100}%`}}></div>
               </div>
             </div>
           </div>
           
           <CardContent className="p-6 md:p-10 min-h-[400px]">
             <AnimatePresence mode="wait">
               <motion.div
                 key={step}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
               >
                 {step === 1 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
                       <h4 className="font-bold text-2xl text-slate-900">Personal Information</h4>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">First Name</label>
                         <Input className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={profile.firstName || ''} onChange={(e) => setProfile({...profile, firstName: e.target.value})} placeholder="Alex" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Last Name</label>
                         <Input className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={profile.lastName || ''} onChange={(e) => setProfile({...profile, lastName: e.target.value})} placeholder="Johnson" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Email Address</label>
                         <Input type="email" className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={profile.email || ''} onChange={(e) => setProfile({...profile, email: e.target.value})} placeholder="alex@example.com" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Mobile Number</label>
                         <Input type="tel" className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={profile.mobile || ''} onChange={(e) => setProfile({...profile, mobile: e.target.value})} placeholder="+1 234 567 8900" />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Nationality</label>
                         <input list="nationality-list" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={profile.nationality || ''} onChange={(e) => setProfile({...profile, nationality: e.target.value})} placeholder="Search or select..." />
                         <datalist id="nationality-list">
                           {NATIONALITIES.map(n => <option key={`nat-${n}`} value={n} />)}
                         </datalist>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Current Country</label>
                         <input list="country-list" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={profile.locationCountry || ''} onChange={(e) => setProfile({...profile, locationCountry: e.target.value, locationState: ''})} placeholder="Search or select..." />
                         <datalist id="country-list">
                           {dbCountries.map(c => <option key={`loc-${c.name}`} value={c.name} />)}
                         </datalist>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">State / Province</label>
                         <input list="state-list" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={profile.locationState || ''} onChange={(e) => setProfile({...profile, locationState: e.target.value})} placeholder="e.g. California" />
                          {COUNTRY_STATES[profile.locationCountry] && (
                            <datalist id="state-list">
                              {COUNTRY_STATES[profile.locationCountry].map(s => <option key={`state-${s}`} value={s} />)}
                            </datalist>
                          )}
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">City</label>
                         <Input className="h-12 rounded-xl bg-slate-50 focus:bg-white" value={profile.locationCity || ''} onChange={(e) => setProfile({...profile, locationCity: e.target.value})} placeholder="e.g. San Francisco" />
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Date of Birth</label>
                         <Input type="date" className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white block w-full" value={profile.dob || ''} onChange={(e) => setProfile({...profile, dob: e.target.value})} />
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Gender</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={profile.gender || ''} onChange={(e) => setProfile({...profile, gender: e.target.value})}>
                           <option value="">Prefer not to say</option>
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Non-binary">Non-binary</option>
                         </select>
                       </div>
                     </div>
                   </div>
                 )}

                 {step === 2 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">2</div>
                       <h4 className="font-bold text-2xl text-slate-900">Academic Details</h4>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Current / Most Recent Degree</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={academic.currentDegree === 'Other' ? 'Other' : (academic.currentDegree || '')} onChange={(e) => {
                             if(e.target.value === 'Other') { setDegreeOther(''); setAcademic({...academic, currentDegree: 'Other'}); }
                             else setAcademic({...academic, currentDegree: e.target.value});
                           }}>
                           <option value="">Select Degree</option>
                           {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                         {academic.currentDegree === 'Other' && (
                           <Input className="mt-2 h-12 rounded-xl" placeholder="Specify your degree" value={degreeOther} onChange={e => {setDegreeOther(e.target.value); setAcademic({...academic, currentDegree: e.target.value});}} />
                         )}
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">College / University</label>
                         <Input className="h-12 rounded-xl bg-slate-50 focus:bg-white" value={academic.university || ''} onChange={(e) => setAcademic({...academic, university: e.target.value})} placeholder="e.g. Stanford University" />
                       </div>
                       
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Major / Specialization</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={academic.major === 'Other' ? 'Other' : (academic.major || '')} onChange={(e) => {
                             if(e.target.value === 'Other') setAcademic({...academic, major: 'Other'});
                             else setAcademic({...academic, major: e.target.value});
                           }}>
                           <option value="">Select Specialization</option>
                           {getMajorOptions().map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                         {academic.major === 'Other' && (
                           <Input className="mt-2 h-12 rounded-xl" placeholder="Specify your major" value={customMajor} onChange={e => {setCustomMajor(e.target.value); setAcademic({...academic, major: e.target.value});}} />
                         )}
                       </div>

                       <div className="flex gap-4">
                         <div className="flex-1">
                           <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">CGPA / GPA</label>
                           <Input className="h-12 rounded-xl bg-slate-50 focus:bg-white" value={academic.gpa || ''} onChange={(e) => setAcademic({...academic, gpa: e.target.value})} placeholder="e.g. 3.8 or 8.5" />
                         </div>
                         <div className="w-32">
                           <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Scale</label>
                           <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={academic.gpaScale || '10'} onChange={(e) => setAcademic({...academic, gpaScale: e.target.value})}>
                             <option value="10">Out of 10</option>
                             <option value="4">Out of 4.0</option>
                             <option value="100">Percentage</option>
                           </select>
                         </div>
                       </div>

                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Graduation Year</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={academic.gradYear || ''} onChange={(e) => setAcademic({...academic, gradYear: e.target.value})}>
                           <option value="">Select Year</option>
                           {Array.from({length: 15}).map((_, i) => <option key={i} value={2020 + i}>{2020 + i}</option>)}
                         </select>
                       </div>
                     </div>
                   </div>
                 )}

                 {step === 3 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">3</div>
                       <h4 className="font-bold text-2xl text-slate-900">Study Abroad Goals</h4>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Target Intake</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={prefs.intake || ''} onChange={(e) => setPrefs({...prefs, intake: e.target.value})}>
                           <option value="">Select Intake</option>
                           {INTAKES.map(i => <option key={i} value={i}>{i}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Annual Budget Range</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500" value={prefs.budget || ''} onChange={(e) => setPrefs({...prefs, budget: e.target.value})}>
                           <option value="">Select Budget</option>
                           {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                         </select>
                       </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100">
                       <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Target Countries (Select Multiple)</label>
                       <input 
                         list="target-countries-list" 
                         className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 mb-4" 
                         placeholder="Search and hit enter to add..."
                         onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             const val = e.currentTarget.value;
                             if(val && !prefs.countries?.includes(val)) {
                               setPrefs({ ...prefs, countries: [...(prefs.countries || []), val] });
                             }
                             e.currentTarget.value = '';
                           }
                         }}
                         onChange={(e) => {
                             const val = e.target.value;
                             // Auto add if it matches exactly a country in the list
                             if (dbCountries.some(x => x.name === val) && !prefs.countries?.includes(val)) {
                                setPrefs({ ...prefs, countries: [...(prefs.countries || []), val] });
                                e.target.value = '';
                             }
                         }}
                       />
                       <datalist id="target-countries-list">
                         {dbCountries.map(c => <option key={`tgt-${c.name}`} value={c.name} />)}
                       </datalist>
                       
                       <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                          {prefs.countries?.length > 0 ? prefs.countries.map((c: string, index: number) => (
                            <span key={`${c}-${index}`} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-indigo-200">
                              {c}
                              <button onClick={() => removeTargetCountry(c)} className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                            </span>
                          )) : (
                            <span className="text-sm font-medium text-slate-400">No countries selected yet.</span>
                          )}
                       </div>
                     </div>
                   </div>
                 )}

                 {step === 4 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">4</div>
                       <h4 className="font-bold text-2xl text-slate-900">Language Tests</h4>
                     </div>
                     <p className="text-slate-500 font-medium mb-6">Enter scores for tests you have taken or are planning to take.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">IELTS Score</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={tests.ielts || ''} onChange={(e) => setTests({...tests, ielts: e.target.value})}>
                           <option value="">Not Taken</option>
                           <option value="Planning">Planning to take</option>
                           {['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">TOEFL iBT Score</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={tests.toefl || ''} onChange={(e) => setTests({...tests, toefl: e.target.value})}>
                           <option value="">Not Taken</option>
                           <option value="Planning">Planning to take</option>
                           <option value="Below 80">Below 80</option>
                           <option value="80-90">80 - 90</option>
                           <option value="90-100">90 - 100</option>
                           <option value="100-110">100 - 110</option>
                           <option value="110+">110+</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">PTE Score</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={tests.pte || ''} onChange={(e) => setTests({...tests, pte: e.target.value})}>
                           <option value="">Not Taken</option>
                           <option value="Planning">Planning to take</option>
                           <option value="Below 50">Below 50</option>
                           <option value="50-60">50 - 60</option>
                           <option value="60-70">60 - 70</option>
                           <option value="70-80">70 - 80</option>
                           <option value="80+">80+</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Duolingo Score</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={tests.duolingo || ''} onChange={(e) => setTests({...tests, duolingo: e.target.value})}>
                           <option value="">Not Taken</option>
                           <option value="Planning">Planning to take</option>
                           <option value="100 or below">100 or below</option>
                           <option value="105-115">105 - 115</option>
                           <option value="120-130">120 - 130</option>
                           <option value="135+">135+</option>
                         </select>
                       </div>
                     </div>
                   </div>
                 )}

                 {step === 5 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">5</div>
                       <h4 className="font-bold text-2xl text-slate-900">Graduate Exams</h4>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">GRE Score</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={tests.gre || ''} onChange={(e) => setTests({...tests, gre: e.target.value})}>
                           <option value="">Not Taken</option>
                           <option value="Planning">Planning to take</option>
                           <option value="Below 290">Below 290</option>
                           <option value="290-300">290 - 300</option>
                           <option value="300-310">300 - 310</option>
                           <option value="310-320">310 - 320</option>
                           <option value="320-330">320 - 330</option>
                           <option value="330+">330+</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">GMAT Score</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={tests.gmat || ''} onChange={(e) => setTests({...tests, gmat: e.target.value})}>
                           <option value="">Not Taken</option>
                           <option value="Planning">Planning to take</option>
                           <option value="Below 600">Below 600</option>
                           <option value="600-650">600 - 650</option>
                           <option value="650-700">650 - 700</option>
                           <option value="700-750">700 - 750</option>
                           <option value="750+">750+</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">GATE Score (If applicable)</label>
                         <Input className="h-12 rounded-xl bg-slate-50 focus:bg-white" value={tests.gate || ''} onChange={(e) => setTests({...tests, gate: e.target.value})} placeholder="e.g. 750" />
                       </div>
                     </div>
                   </div>
                 )}

                 {step === 6 && (
                   <div className="space-y-6 max-w-4xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">6</div>
                       <h4 className="font-bold text-2xl text-slate-900">Work Experience</h4>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Current Status</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={profile.currentStatus || ''} onChange={(e) => setProfile({...profile, currentStatus: e.target.value})}>
                           <option value="">Select Status</option>
                           <option value="Student">Student</option>
                           <option value="Working Professional">Working Professional</option>
                           <option value="Freelancer">Freelancer</option>
                           <option value="Business Owner">Business Owner</option>
                           <option value="Researcher">Researcher</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Total Years of Experience</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={profile.yearsOfExperience || ''} onChange={(e) => setProfile({...profile, yearsOfExperience: e.target.value})}>
                           <option value="">None</option>
                           {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(y => <option key={y} value={y}>{y} Years</option>)}
                         </select>
                       </div>
                     </div>

                     <div className="space-y-4">
                       {workEx.map((w, index) => (
                         <div key={w.id || index} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 relative group">
                           <button onClick={() => setWorkEx(workEx.filter((_, i) => i !== index))} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors">
                             <Trash2 className="w-5 h-5"/>
                           </button>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Company Name</label>
                               <Input className="h-10 bg-white" value={w.company || ''} onChange={e => updateWorkEx(index, 'company', e.target.value)} />
                             </div>
                             <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role / Title</label>
                               <Input className="h-10 bg-white" value={w.title || ''} onChange={e => updateWorkEx(index, 'title', e.target.value)} />
                             </div>
                             <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                               <Input type="month" className="h-10 bg-white" value={w.startDate || ''} onChange={e => updateWorkEx(index, 'startDate', e.target.value)} />
                             </div>
                             <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex justify-between">
                                 End Date
                                 <label className="flex items-center gap-1 normal-case text-indigo-600 cursor-pointer">
                                   <input type="checkbox" checked={w.current || false} onChange={e => updateWorkEx(index, 'current', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" /> Currently Working
                                 </label>
                               </label>
                               <Input type="month" className={`h-10 bg-white ${w.current ? 'opacity-50' : ''}`} value={w.endDate || ''} disabled={w.current} onChange={e => updateWorkEx(index, 'endDate', e.target.value)} />
                             </div>
                           </div>
                         </div>
                       ))}
                       <Button variant="outline" className="w-full border-dashed border-2 py-8 text-slate-500 hover:text-slate-900 font-bold" onClick={addWorkEx}>
                         <Plus className="w-4 h-4 mr-2" /> Add Work Experience
                       </Button>
                     </div>
                   </div>
                 )}

                 {step === 7 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold">7</div>
                       <h4 className="font-bold text-2xl text-slate-900">Profile Documents</h4>
                     </div>
                     <p className="text-slate-500 font-medium mb-6">Your uploaded documents automatically sync here from your Document Vault.</p>
                     
                     <div className="grid gap-3">
                       {['Passport', 'Resume / CV', 'Statement of Purpose (SOP)', 'Letter of Recommendation (LOR)', 'Academic Transcripts', 'Degree Certificate', 'Work Experience Letter'].map(docType => {
                         const uploadedDoc = docs.find(d => d.name?.toLowerCase().includes(docType.toLowerCase().split(' ')[0]) || d.type === docType);
                         const isUploaded = !!uploadedDoc;
                         
                         return (
                           <div key={docType} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isUploaded ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                             <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                 {isUploaded ? <CheckCircle2 className="w-5 h-5"/> : <FileText className="w-5 h-5" />}
                               </div>
                               <div>
                                 <h5 className={`font-bold ${isUploaded ? 'text-slate-900' : 'text-slate-500'}`}>{docType}</h5>
                                 {isUploaded && <p className="text-xs font-medium text-slate-500">{uploadedDoc.name}</p>}
                               </div>
                             </div>
                             <div>
                               {!isUploaded ? (
                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-2.5 py-1 rounded-md border border-slate-200">Missing</span>
                               ) : (
                                 <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-white border border-emerald-200 px-2.5 py-1 rounded-md shadow-sm">{uploadedDoc.status || 'Uploaded'}</span>
                               )}
                             </div>
                           </div>
                         )
                       })}
                     </div>
                     <p className="text-xs text-slate-500 font-medium mt-4 text-center">To add new documents, visit the <span className="text-indigo-600 font-bold">Document Vault</span> in the sidebar.</p>
                   </div>
                 )}

                 {step === 8 && (
                   <div className="space-y-6 max-w-3xl">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">8</div>
                       <h4 className="font-bold text-2xl text-slate-900">Final Preferences</h4>
                     </div>
                     <p className="text-slate-500 font-medium mb-6">Fine-tune these preferences to help AI recommend the best university matches.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Preferred Study Type</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={prefs.studyType || ''} onChange={(e) => setPrefs({...prefs, studyType: e.target.value})}>
                           <option value="">Select Type</option>
                           <option value="Coursework">Coursework (Taught)</option>
                           <option value="Research">Research (Thesis)</option>
                           <option value="Hybrid">Hybrid</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Post-Study Goal</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={prefs.postGoal || ''} onChange={(e) => setPrefs({...prefs, postGoal: e.target.value})}>
                           <option value="">Select Goal</option>
                           <option value="Job">Find a Job</option>
                           <option value="PR">Permanent Residency</option>
                           <option value="Research">Further Research / PhD</option>
                           <option value="Entrepreneurship">Entrepreneurship</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Preferred Climate (Optional)</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={prefs.climate || ''} onChange={(e) => setPrefs({...prefs, climate: e.target.value})}>
                           <option value="">No Preference</option>
                           <option value="Cold">Cold / Snow</option>
                           <option value="Moderate">Moderate / Temperate</option>
                           <option value="Warm">Warm / Tropical</option>
                         </select>
                       </div>
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Preferred City Size (Optional)</label>
                         <select className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium outline-none" value={prefs.citySize || ''} onChange={(e) => setPrefs({...prefs, citySize: e.target.value})}>
                           <option value="">No Preference</option>
                           <option value="Small">Small College Town</option>
                           <option value="Medium">Mid-sized City</option>
                           <option value="Large">Large Metro / Capital</option>
                         </select>
                       </div>
                     </div>
                   </div>
                 )}
               </motion.div>
             </AnimatePresence>
             
             <div className="mt-12 pt-6 flex justify-between items-center border-t border-slate-100">
               <Button variant="ghost" disabled={step === 1} onClick={() => {saveWorkExToDb(); handleSave(true); setStep(step - 1)}} className="font-bold text-slate-500 hover:text-slate-900">
                 Prevoius Step
               </Button>
               {step < 8 ? (
                 <Button onClick={() => {saveWorkExToDb(); handleSave(true); setStep(step + 1)}} className="font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 h-12 px-8 rounded-xl shrink-0">
                   Next Step <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
               ) : (
                 <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white h-12 px-10 rounded-xl shadow-lg shadow-emerald-600/20" onClick={() => {saveWorkExToDb(); handleSave()}}>
                   <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Profile
                 </Button>
               )}
             </div>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Sidebar Info */}
           <div className="space-y-8">
             <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Personal Details</h3>
               </div>
               <CardContent className="p-6 space-y-5">
                  <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Full Name</p><p className="font-bold text-slate-900">{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '-'}</p></div>
                  <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Nationality</p><p className="font-bold text-slate-900">{profile.nationality || '-'}</p></div>
                  <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Location</p><p className="font-bold text-slate-900">{[profile.locationCity, profile.locationState, profile.locationCountry].filter(Boolean).join(', ') || '-'}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Date of Birth</p><p className="font-bold text-slate-900">{profile.dob || '-'}</p></div>
                    <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Gender</p><p className="font-bold text-slate-900">{profile.gender || '-'}</p></div>
                  </div>
               </CardContent>
             </Card>

             <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Study Preferences</h3>
               </div>
               <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Intake</p><p className="font-bold text-slate-900">{prefs.intake || '-'}</p></div>
                    <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Budget</p><p className="font-bold text-slate-900">{prefs.budget || '-'}</p></div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Target Countries</p>
                    <div className="flex flex-wrap gap-2">
                       {prefs.countries?.length > 0 ? prefs.countries.map((c: string, index: number) => (
                         <span key={`${c}-${index}`} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 text-center">{c}</span>
                       )) : <span className="font-bold text-slate-900">-</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Study Type</p><p className="font-bold text-slate-900">{prefs.studyType || '-'}</p></div>
                    <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Post Goal</p><p className="font-bold text-slate-900">{prefs.postGoal || '-'}</p></div>
                  </div>
               </CardContent>
             </Card>
           </div>

           {/* Main Content Info */}
           <div className="lg:col-span-2 space-y-8">
             <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900">Academic History</h3>
               </div>
               <CardContent className="p-6">
                 {academic.currentDegree ? (
                   <div className="flex flex-col md:flex-row gap-6 md:items-center p-6 border border-slate-100 rounded-2xl bg-slate-50/50">
                     <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                       <BookOpen className="w-8 h-8 text-slate-300" />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-xl font-bold text-slate-900 mb-1">{[academic.currentDegree, academic.major ? `in ${academic.major}` : ''].filter(Boolean).join(' ') || 'No Degree Specified'}</h4>
                       <p className="text-slate-500 font-medium mb-3">{academic.university || 'No University Specified'}</p>
                       <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700 uppercase tracking-wider">
                         <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">GPA: {academic.gpa || '-'}</span>
                         <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">Class of {academic.gradYear || '-'}</span>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                     <p className="text-slate-500 font-medium">No academic details added yet.</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900">Test Scores</h3>
               </div>
               <CardContent className="p-6">
                 {Object.keys(tests).length > 2 /* ignoring typical internal props */ || tests.ielts || tests.gre ? (
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     {[
                       { label: 'IELTS', score: tests.ielts, bg: 'bg-blue-50' },
                       { label: 'TOEFL', score: tests.toefl, bg: 'bg-indigo-50' },
                       { label: 'PTE', score: tests.pte, bg: 'bg-teal-50' },
                       { label: 'Duolingo', score: tests.duolingo, bg: 'bg-green-50' },
                       { label: 'GRE', score: tests.gre, bg: 'bg-purple-50' },
                       { label: 'GMAT', score: tests.gmat, bg: 'bg-rose-50' },
                       { label: 'GATE', score: tests.gate, bg: 'bg-amber-50' },
                     ].filter(t => t.score).map((test, i) => (
                       <div key={i} className={`p-4 rounded-xl border border-slate-100 ${test.bg} text-center`}>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{test.label}</p>
                         <p className="text-xl font-black text-slate-900">{test.score}</p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                     <p className="text-slate-500 font-medium">No test scores recorded yet.</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-sky-600" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900">Work Experience</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Exp</p>
                    <p className="font-bold text-slate-900">{profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : 'None'}</p>
                  </div>
               </div>
               <CardContent className="p-6 space-y-4">
                 {workEx.length > 0 ? (
                   workEx.map((w, index) => (
                     <div key={w.id || index} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                       <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                         <span className="text-white font-black text-lg">{w.company?.charAt(0) || 'C'}</span>
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{w.title || 'Role'}</h4>
                         <p className="text-slate-500 font-medium text-sm mb-2">{w.company || 'Company'}</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{w.startDate || 'Start'} — {w.current ? 'Present' : (w.endDate || 'End')}</p>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                     <p className="text-slate-500 font-medium">No work experience entries added.</p>
                   </div>
                 )}
               </CardContent>
             </Card>

           </div>
        </div>
      )}
    </div>
  );
}
