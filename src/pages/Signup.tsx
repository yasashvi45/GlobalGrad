import { useState, useEffect } from 'react';
import { OnboardingLayout } from '@/components/layout/OnboardingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, X, Search, CheckCircle2, Eye, EyeOff, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const POPULAR_COUNTRIES = [
  { flag: '🇺🇸', name: 'USA' },
  { flag: '🇨🇦', name: 'Canada' },
  { flag: '🇦🇺', name: 'Australia' },
  { flag: '🇩🇪', name: 'Germany' },
  { flag: '🇬🇧', name: 'United Kingdom' },
  { flag: '🇫🇷', name: 'France' },
  { flag: '🇮🇪', name: 'Ireland' },
  { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇸🇪', name: 'Sweden' },
  { flag: '🇸🇬', name: 'Singapore' },
  { flag: '🇨🇭', name: 'Switzerland' }
];

const ALL_COUNTRIES = [
  ...POPULAR_COUNTRIES,
  { flag: '🇯🇵', name: 'Japan' },
  { flag: '🇰🇷', name: 'South Korea' },
  { flag: '🇮🇹', name: 'Italy' },
  { flag: '🇪🇸', name: 'Spain' },
  { flag: '🇳🇿', name: 'New Zealand' }
];

const INITIAL_PRIORITIES = [
  { id: 'p1', label: 'High Salary', tooltip: 'Focus on post-graduation income' },
  { id: 'p2', label: 'PR Opportunities', tooltip: 'Pathways to permanent residency' },
  { id: 'p3', label: 'Research', tooltip: 'Access to top-tier research facilities' },
  { id: 'p4', label: 'Affordable Education', tooltip: 'Low tuition and living costs' },
  { id: 'p5', label: 'Work-Life Balance', tooltip: 'Healthy student life and culture' },
  { id: 'p6', label: 'Job Market', tooltip: 'Strong local economy for graduates' },
  { id: 'p8', label: 'Safety', tooltip: 'Low crime rates and stable environment' },
];

const START_YEAR = new Date().getFullYear();
const DYNAMIC_YEARS = Array.from({length: 5}).map((_, i) => (START_YEAR + i).toString());

import { signup, updateProfile, signInWithGoogle, signInWithMicrosoft, getCurrentUser } from '@/services/authService';
import { createUser, getUser, updateUser } from '@/services/userService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function Signup() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isFinalCompleting, setIsFinalCompleting] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  // Step 1: Account
  const [account, setAccount] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isStep1Valid, setIsStep1Valid] = useState(false);

  // Step 2: Education Profile
  const [edu, setEdu] = useState({ 
    level: '', field: '', gpa: '', 
    currentUniversity: '', currentDegree: '', currentSemester: '', currentGradYear: '',
    ielts: 'Not Started', ieltsScore: '', 
    toefl: 'Not Started', toeflScore: '', 
    pte: 'Not Started', pteScore: '',
    greScore: '', gmatScore: ''
  });
  
  const [personalDetails, setPersonalDetails] = useState({
    dob: '', gender: '', nationality: '', currentCountry: '', currentCity: '', mobile: '', altContact: ''
  });

  const [work, setWork] = useState({
    years: '', currentCompany: '', currentRole: ''
  });
  
  // Step 3: Study Goals
  const [goals, setGoals] = useState({ type: '', intake: '', year: '', mode: 'On Campus', researchLevel: 'Medium' });
  
  // Step 4: Target Countries
  const [searchCountry, setSearchCountry] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<{flag?: string, name: string}[]>([]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  
  // Step 5: Budget & Priorities
  const [finances, setFinances] = useState({
    budget: '$40k-$60k',
    fundingSource: '',
    tuitionRange: '',
    partTimeWork: ''
  });
  const [priorities, setPriorities] = useState(INITIAL_PRIORITIES);
  
  // Step 6: Personalization
  const [personal, setPersonal] = useState({ 
    classSize: '', locationType: '', prImportance: '', jobImportance: '', campusSize: '' 
  });

  // Password Validation
  const pwdValidation = {
    length: account.password.length >= 8,
    uppercase: /[A-Z]/.test(account.password),
    number: /[0-9]/.test(account.password),
    special: /[^A-Za-z0-9]/.test(account.password)
  };
  const isPwdValid = pwdValidation.length && pwdValidation.uppercase && pwdValidation.number && pwdValidation.special;
  
  const passwordsMatch = account.password && account.password === account.confirmPassword;

  useEffect(() => {
    const fetchUserProgress = async () => {
      const user = getCurrentUser();
      if (user) {
        try {
          const docSnap = await getUser(user.uid);
          if (docSnap) {
            const data = docSnap as any;
            if (data.profileCompleted) {
              navigate('/app', { replace: true });
              return;
            }
            if (data.onboardingStep && data.onboardingStep > 1) {
              setStep(data.onboardingStep);
              // optionally prefill state here if needed
              if (data.personal) {
                 setAccount(prev => ({ ...prev, firstName: data.personal.firstName || '', lastName: data.personal.lastName || '' }));
                 setPersonalDetails(prev => ({ 
                   ...prev, 
                   dob: data.personal.dob || '', 
                   gender: data.personal.gender || '', 
                   nationality: data.personal.nationality || '', 
                   currentCountry: data.personal.currentCountry || '', 
                   currentCity: data.personal.currentCity || '', 
                   mobile: data.personal.mobile || '', 
                   altContact: data.personal.altContact || '' 
                 }));
              }
            }
          }
        } catch (e) {
          console.error('Error fetching progress', e);
        }
      }
    };
    fetchUserProgress();
  }, [navigate]);

  useEffect(() => {
    setIsStep1Valid(
      account.firstName.trim() !== '' && 
      account.lastName.trim() !== '' && 
      account.email.trim() !== '' && 
      isPwdValid && 
      passwordsMatch !== false
    );
  }, [account, isPwdValid, passwordsMatch]);

  const handleNext = async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      if (step === 1) {
        let user = getCurrentUser();
        if (!user) {
          user = await signup(account.email, account.password);
          await updateProfile(user, { displayName: `${account.firstName} ${account.lastName}` });
          await createUser({
            id: user.uid,
            email: account.email,
            name: `${account.firstName} ${account.lastName}`,
            fullName: `${account.firstName} ${account.lastName}`,
            role: 'student',
            status: 'active',
            profileCompleted: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
          const { updateProfileDoc } = await import('@/services/userService');
          await updateProfileDoc(user.uid, {
            userId: user.uid,
            email: account.email,
            createdAt: new Date().toISOString()
          });
        }
        const { updateProfileDoc } = await import('@/services/userService');
        await updateProfileDoc(user.uid, { 
          'personal.firstName': account.firstName,
          'personal.lastName': account.lastName,
          'personal.fullName': `${account.firstName} ${account.lastName}`,
          'personal.dob': personalDetails.dob,
          'personal.gender': personalDetails.gender,
          'personal.nationality': personalDetails.nationality,
          'personal.currentCountry': personalDetails.currentCountry,
          'personal.currentCity': personalDetails.currentCity,
          'personal.mobile': personalDetails.mobile,
          'personal.altContact': personalDetails.altContact,
          onboardingStep: 2
        });
      } else {
        const user = getCurrentUser();
        if (user) {
          const { updateProfileDoc } = await import('@/services/userService');
          if (step === 2) {
             await updateProfileDoc(user.uid, { 
               'academic.currentUniversity': edu.currentUniversity,
               'academic.currentDegree': edu.currentDegree,
               'academic.currentSemester': edu.currentSemester,
               'academic.gpa': edu.gpa,
               'academic.targetDegree': edu.level,
               'academic.targetField': edu.field,
               onboardingStep: 3
             });
          }
          if (step === 3) {
             await updateProfileDoc(user.uid, {
               'tests.ielts': { status: edu.ielts, score: edu.ieltsScore },
               'tests.toefl': { status: edu.toefl, score: edu.toeflScore },
               'tests.pte': { status: edu.pte, score: edu.pteScore },
               'tests.gre': edu.greScore,
               'tests.gmat': edu.gmatScore,
               onboardingStep: 4
             });
          }
          if (step === 4) {
             await updateProfileDoc(user.uid, {
               'workExperience.years': work.years,
               'workExperience.currentCompany': work.currentCompany,
               'workExperience.currentRole': work.currentRole,
               onboardingStep: 5
             });
          }
          if (step === 5) {
             await updateProfileDoc(user.uid, {
               'academic.preferredIntake': goals.intake + ' ' + goals.year,
               'preferences.studyMode': goals.mode,
               'preferences.researchInterest': goals.researchLevel,
               onboardingStep: 6
             });
          }
          if (step === 6) {
             await updateProfileDoc(user.uid, {
               'preferences.targetCountries': selectedCountries.map(c => c.name),
               onboardingStep: 7
             });
          }
          if (step === 7) {
             await updateProfileDoc(user.uid, {
               'preferences.budget': finances.budget,
               'preferences.fundingSource': finances.fundingSource,
               'preferences.tuitionRange': finances.tuitionRange,
               'preferences.partTimeWork': finances.partTimeWork,
               onboardingStep: 8
             });
          }
        }
      }

      if (step < 8) {
        setStep(step + 1);
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        await completeSignup();
      }
    } catch (e: any) {
      setAuthError(e.message);
      setIsLoading(false);
    }
  };

  const loadingSteps = [
    'Creating Account...',
    'Analyzing Preferences...',
    'Matching Universities...',
    'Finding Scholarships...',
    'Generating Study Plan...',
    'Preparing Dashboard...'
  ];

  const completeSignup = async () => {
    setIsFinalCompleting(true);
    let currentStepIdx = 0;
    
    try {
      let user = getCurrentUser();
      if (!user) {
         user = await signup(account.email, account.password);
         await updateProfile(user, { displayName: `${account.firstName} ${account.lastName}` });
         
         await createUser({
            id: user.uid,
            email: account.email,
            name: `${account.firstName} ${account.lastName}`,
            fullName: `${account.firstName} ${account.lastName}`,
            role: 'student',
            status: 'active',
            profileCompleted: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
         });
      }

      await updateUser(user.uid, { profileCompleted: true });

      const { updateProfileDoc } = await import('@/services/userService');
      await updateProfileDoc(user.uid, {
         userId: user.uid,
         email: account.email,
         personal: {
           fullName: `${account.firstName} ${account.lastName}`,
           firstName: account.firstName,
           lastName: account.lastName,
           dob: personalDetails.dob,
           gender: personalDetails.gender,
           nationality: personalDetails.nationality,
           currentCountry: personalDetails.currentCountry,
           currentCity: personalDetails.currentCity,
           mobile: personalDetails.mobile,
           altContact: personalDetails.altContact
         },
         academic: {
           currentUniversity: edu.currentUniversity,
           currentDegree: edu.currentDegree,
           currentSemester: edu.currentSemester,
           gpa: edu.gpa,
           targetDegree: edu.level,
           targetField: edu.field,
           preferredIntake: goals.intake + ' ' + goals.year
         },
         tests: {
           ielts: { status: edu.ielts, score: edu.ieltsScore },
           toefl: { status: edu.toefl, score: edu.toeflScore },
           pte: { status: edu.pte, score: edu.pteScore },
           gre: edu.greScore,
           gmat: edu.gmatScore
         },
         workExperience: {
           years: work.years,
           currentCompany: work.currentCompany,
           currentRole: work.currentRole
         },
         preferences: {
           targetCountries: selectedCountries.map(c => c.name),
           budget: finances.budget,
           fundingSource: finances.fundingSource,
           tuitionRange: finances.tuitionRange,
           studyMode: goals.mode,
           locationType: personal.locationType,
           classSize: personal.classSize,
           jobImportance: personal.jobImportance,
           researchInterest: goals.researchLevel,
           partTimeWork: finances.partTimeWork
         },
         aiProfile: {
           priorityRanking: priorities.map(p => p.label),
           careerGoals: '',
           prPreference: personal.prImportance,
           workLifeBalanceImportance: ''
         },
         profileCompleted: true,
         onboardingStep: 9
      });

      window.dispatchEvent(new Event('auth_changed'));

      const interval = setInterval(() => {
        currentStepIdx += 1;
        setLoadingStep(currentStepIdx);
        if (currentStepIdx >= loadingSteps.length) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/app');
          }, 500);
        }
      }, 700);

    } catch (e: any) {
      let friendlyMessage = 'Failed to create account.';
      const code = e.code;
      if (code === 'auth/email-already-in-use') friendlyMessage = 'An account already exists with this email.';
      else if (code === 'auth/invalid-email') friendlyMessage = 'Please enter a valid email address.';
      else if (code === 'auth/network-request-failed') friendlyMessage = 'Network error. Please check your internet connection.';
      else if (code === 'auth/operation-not-allowed') friendlyMessage = 'Email/Password sign up is not enabled. Please contact support.';
      else if (code === 'auth/weak-password') friendlyMessage = 'Password is too weak. Please use a stronger password.';
      else console.error(e);
      
      setAuthError(friendlyMessage || e.message);
      setIsFinalCompleting(false);
      setStep(1); // Go back to step 1 to show error
    }
  };

  const handleSocialAuth = async (provider: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      let user;
      if (provider === 'Google') {
        user = await signInWithGoogle();
      } else if (provider === 'Microsoft') {
        user = await signInWithMicrosoft();
      } else {
        throw new Error('Unsupported provider');
      }

      let docSnap = await getUser(user.uid);
      let uRole = 'student';
      
      if (docSnap) {
        uRole = (docSnap as any).role || 'student';
        const updates: any = { lastLogin: new Date().toISOString() };
        if (!(docSnap as any).role) updates.role = 'student';
        await updateUser(user.uid, updates);
      } else {
        await createUser({ 
          id: user.uid, 
          email: user.email || '', 
          role: 'student', 
          status: 'active',
          profileCompleted: false,
          fullName: user.displayName || user.email || '',
          name: user.displayName || user.email || '',
          provider: provider.toLowerCase(),
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      }

      window.dispatchEvent(new Event('auth_changed'));

      if (uRole === 'admin' || uRole === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        if (!docSnap || !(docSnap as any).profileCompleted) {
           const data = docSnap as any || {};
           const names = user.displayName?.split(' ') || [];
           setAccount({
             ...account, 
             email: user.email || '', 
             firstName: data.personal?.firstName || names[0] || '', 
             lastName: data.personal?.lastName || names.slice(1).join(' ') || ''
           });
           setStep(data.onboardingStep || 2);
        } else {
           navigate('/app', { replace: true });
        }
      }

    } catch (e: any) {
      console.error(e);
      let friendlyMessage = 'Authentication failed. Please try again.';
      const code = e.code;
      if (code === 'auth/popup-closed-by-user') friendlyMessage = 'Sign in cancelled.';
      else if (code === 'auth/account-exists-with-different-credential') friendlyMessage = 'An account already exists with the same email address but different sign-in credentials.';
      else if (code === 'auth/network-request-failed') friendlyMessage = 'Network error. Please check your internet connection.';
      
      setAuthError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(priorities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPriorities(items);
  };

  const filteredCountries = ALL_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) && 
    !selectedCountries.find(sc => sc.name === c.name)
  );

  const isStepValid = () => {
    if (step === 1) return isStep1Valid && personalDetails.dob && personalDetails.gender && personalDetails.nationality && personalDetails.currentCountry && personalDetails.currentCity && personalDetails.mobile;
    if (step === 2) return edu.currentUniversity && edu.currentDegree && edu.level && edu.field;
    if (step === 3) return true; // Tests are optional
    if (step === 4) return work.years;
    if (step === 5) return goals.type && goals.intake && goals.year;
    if (step === 6) return selectedCountries.length > 0;
    if (step === 7) return finances.fundingSource && finances.tuitionRange && finances.partTimeWork;
    if (step === 8) return personal.classSize && personal.locationType && personal.prImportance && personal.jobImportance;
    return true;
  };

  if (isFinalCompleting) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative">
            <svg className="w-16 h-16 mx-auto text-indigo-600 animate-spin" viewBox="0 0 24 24" fill="none">
               <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
               <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
            </svg>
            <h2 className="mt-8 text-2xl font-bold text-slate-900 font-display">
               {loadingSteps[Math.min(loadingStep, loadingSteps.length - 1)]}
            </h2>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
               <motion.div 
                 className="h-full bg-indigo-600 rounded-full"
                 initial={{ width: '0%' }}
                 animate={{ width: `${Math.min(((loadingStep + 1) / loadingSteps.length) * 100, 100)}%` }}
                 transition={{ duration: 0.8 }}
               />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderLabel = (text: string, required: boolean = false) => (
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {text} {required && <span className="text-rose-500">*</span>}
      {!required && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}
    </label>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Existing account info */}
            {authError && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm flex items-center gap-2 border border-rose-100 font-medium">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 {authError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderLabel('First Name', true)}
                <Input value={account.firstName} onChange={e => setAccount({...account, firstName: e.target.value})} placeholder="First name" className={cn(account.firstName && "border-emerald-500 focus:ring-emerald-500")} />
              </div>
              <div>
                {renderLabel('Last Name', true)}
                <Input value={account.lastName} onChange={e => setAccount({...account, lastName: e.target.value})} placeholder="Last name" className={cn(account.lastName && "border-emerald-500 focus:ring-emerald-500")} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderLabel('Date of Birth', true)}
                <Input type="date" value={personalDetails.dob} onChange={e => setPersonalDetails({...personalDetails, dob: e.target.value})} />
              </div>
              <div>
                {renderLabel('Gender', true)}
                <select 
                  value={personalDetails.gender}
                  onChange={e => setPersonalDetails({...personalDetails, gender: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select gender...</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderLabel('Nationality', true)}
                <select 
                  value={personalDetails.nationality}
                  onChange={e => setPersonalDetails({...personalDetails, nationality: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select nationality...</option>
                  {ALL_COUNTRIES.map(c => <option key={`nat-${c.name}`} value={c.name}>{c.name}</option>)}
                  <option>Other</option>
                </select>
              </div>
              <div>
                {renderLabel('Current Country', true)}
                <select 
                  value={personalDetails.currentCountry}
                  onChange={e => setPersonalDetails({...personalDetails, currentCountry: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select country...</option>
                  {ALL_COUNTRIES.map(c => <option key={`cc-${c.name}`} value={c.name}>{c.name}</option>)}
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <div>
                  {renderLabel('Current City', true)}
                  <Input value={personalDetails.currentCity} onChange={e => setPersonalDetails({...personalDetails, currentCity: e.target.value})} placeholder="City name" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderLabel('Mobile Number', true)}
                <Input value={personalDetails.mobile} onChange={e => setPersonalDetails({...personalDetails, mobile: e.target.value})} placeholder="+1 234 567 8900" />
              </div>
              <div>
                {renderLabel('Alternate Contact', false)}
                <Input value={personalDetails.altContact} onChange={e => setPersonalDetails({...personalDetails, altContact: e.target.value})} placeholder="+1 987 654 3210" />
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full my-6"></div>

            <div>
              {renderLabel('Email Address', true)}
              <Input type="email" value={account.email} onChange={e => setAccount({...account, email: e.target.value})} placeholder="you@example.com" />
            </div>
            
            <div>
              {renderLabel('Password', true)}
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={account.password} 
                  onChange={e => setAccount({...account, password: e.target.value})} 
                  placeholder="Create a strong password" 
                  className={cn("pr-10", account.password && isPwdValid && "border-emerald-500 focus:ring-emerald-500")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
              {account.password && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <span className={cn("flex items-center gap-1", pwdValidation.length ? "text-emerald-600 font-medium" : "text-slate-500")}>
                    {pwdValidation.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mx-1" />}
                    8+ characters
                  </span>
                  <span className={cn("flex items-center gap-1", pwdValidation.uppercase ? "text-emerald-600 font-medium" : "text-slate-500")}>
                    {pwdValidation.uppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mx-1" />}
                    Uppercase letter
                  </span>
                  <span className={cn("flex items-center gap-1", pwdValidation.number ? "text-emerald-600 font-medium" : "text-slate-500")}>
                    {pwdValidation.number ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mx-1" />}
                    Number
                  </span>
                  <span className={cn("flex items-center gap-1", pwdValidation.special ? "text-emerald-600 font-medium" : "text-slate-500")}>
                    {pwdValidation.special ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mx-1" />}
                    Special character
                  </span>
                </div>
              )}
            </div>

            <div>
              {renderLabel('Confirm Password', true)}
              <Input 
                type="password" 
                value={account.confirmPassword} 
                onChange={e => setAccount({...account, confirmPassword: e.target.value})} 
                placeholder="Confirm your password"
                className={cn(account.confirmPassword && passwordsMatch && "border-emerald-500 focus:ring-emerald-500", account.confirmPassword && !passwordsMatch && "border-rose-500 focus:ring-rose-500")}
              />
              {account.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Passwords do not match</p>
              )}
            </div>

            <div className="relative pt-4 pb-2">
              <div className="absolute inset-0 flex items-center pt-2">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 text-xs font-medium uppercase tracking-wider">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => handleSocialAuth('Google')} disabled={isLoading} className="w-full h-12 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button type="button" variant="outline" onClick={() => handleSocialAuth('Microsoft')} disabled={isLoading} className="w-full h-12 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 21 21"><path d="M0 0h10v10H0zM11 0h10v10H11zM0 11h10v10H0zM11 11h10v10H11z" fill="#00a4ef"/></svg>
                Microsoft
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderLabel('Current University', true)}
                <Input value={edu.currentUniversity} onChange={e => setEdu({...edu, currentUniversity: e.target.value})} placeholder="e.g. Stanford University" />
              </div>
              <div>
                {renderLabel('Current Degree', true)}
                <select 
                  value={edu.currentDegree}
                  onChange={e => setEdu({...edu, currentDegree: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select degree...</option>
                  <option>B.Tech</option>
                  <option>B.Sc</option>
                  <option>BBA</option>
                  <option>BE</option>
                  <option>BA</option>
                  <option>Masters</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                {renderLabel('Current Semester', false)}
                <Input type="number" min="1" max="10" value={edu.currentSemester} onChange={e => setEdu({...edu, currentSemester: e.target.value})} placeholder="e.g. 6" />
              </div>
              <div>
                {renderLabel('Current GPA/CGPA', false)}
                <Input value={edu.gpa} onChange={e => setEdu({...edu, gpa: e.target.value})} placeholder="e.g. 3.8 / 4.0" />
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full my-6"></div>

            <div>
              {renderLabel('Target Degree Level', true)}
              <div className="grid grid-cols-2 gap-3">
                {["Bachelor's", "Master's", "PhD", "Certificate"].map(lvl => (
                  <button 
                    key={lvl}
                    onClick={() => setEdu({...edu, level: lvl})}
                    className={cn(
                      "h-12 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left",
                      edu.level === lvl 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                        : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                {renderLabel('Target Field of Study', true)}
                <select 
                  value={edu.field}
                  onChange={e => setEdu({...edu, field: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select a field...</option>
                  <option>Computer Science</option>
                  <option>Engineering</option>
                  <option>Business Administration</option>
                  <option>Data Science</option>
                  <option>Medicine</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              {renderLabel('Language Test Status & Scores', false)}
              <div className="grid gap-3">
                {[
                  { name: 'IELTS', stateKey: 'ielts', scoreKey: 'ieltsScore' }, 
                  { name: 'TOEFL', stateKey: 'toefl', scoreKey: 'toeflScore' }, 
                  { name: 'PTE', stateKey: 'pte', scoreKey: 'pteScore' }
                ].map(test => (
                  <div key={test.name} className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm w-20">{test.name}</span>
                      <div className="flex gap-2">
                        {['Not Started', 'Preparing', 'Completed'].map(status => (
                          <button 
                              key={status}
                              onClick={() => setEdu({...edu, [test.stateKey]: status})}
                              className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                                (edu as any)[test.stateKey] === status 
                                  ? "bg-white border-indigo-600 text-indigo-700 shadow-sm"
                                  : "bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50"
                              )}>
                              {status}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(edu as any)[test.stateKey] === 'Completed' && (
                      <Input placeholder={`${test.name} Score`} value={(edu as any)[test.scoreKey]} onChange={(e) => setEdu({...edu, [test.scoreKey]: e.target.value})} className="h-10 bg-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderLabel('GRE Score', false)}
                <Input value={edu.greScore} onChange={e => setEdu({...edu, greScore: e.target.value})} placeholder="e.g. 320" />
              </div>
              <div>
                {renderLabel('GMAT Score', false)}
                <Input value={edu.gmatScore} onChange={e => setEdu({...edu, gmatScore: e.target.value})} placeholder="e.g. 700" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  {renderLabel('Years of Work Experience', true)}
                  <Input type="number" min="0" value={work.years} onChange={e => setWork({...work, years: e.target.value})} placeholder="0 for freshers" />
               </div>
               <div>
                  {renderLabel('Current / Last Company', false)}
                  <Input value={work.currentCompany} onChange={e => setWork({...work, currentCompany: e.target.value})} placeholder="Company name" />
               </div>
               <div>
                  {renderLabel('Current / Last Role', false)}
                  <Input value={work.currentRole} onChange={e => setWork({...work, currentRole: e.target.value})} placeholder="e.g. Software Engineer" />
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div>
              {renderLabel('Preferred Start Term', true)}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {["Spring", "Summer", "Fall"].map(item => (
                  <button 
                    key={item}
                    onClick={() => setGoals({...goals, intake: item})}
                    className={cn(
                      "w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors border-2",
                      goals.intake === item 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                        : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {DYNAMIC_YEARS.map(year => (
                  <button 
                    key={year}
                    onClick={() => setGoals({...goals, year})}
                     className={cn(
                      "px-4 h-10 rounded-lg flex items-center text-sm font-medium transition-colors border filter drop-shadow-sm",
                      goals.year === year 
                        ? "border-indigo-600 bg-indigo-600 text-white" 
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {renderLabel('Degree Type', true)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Bachelor's Degree", "Master's Degree", "MBA", "PhD", "Post-Doc / Research", "Language Course"].map(item => (
                  <button 
                    key={item}
                    onClick={() => setGoals({...goals, type: item})}
                    className={cn(
                      "h-14 px-4 rounded-xl border-2 text-sm font-medium transition-all text-left flex items-center justify-between group",
                      goals.type === item 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" 
                        : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {item}
                    {goals.type === item && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                {renderLabel('Preferred Study Mode', true)}
                <div className="flex flex-col gap-2">
                  {['On Campus', 'Hybrid', 'Online'].map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => setGoals({...goals, mode})}
                      className={cn(
                        "h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all border",
                        goals.mode === mode ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>
                       <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", goals.mode === mode ? "border-indigo-600 bg-indigo-600" : "border-slate-300")}>
                         {goals.mode === mode && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                {renderLabel('Research Interest Level', true)}
                <div className="flex flex-col gap-2">
                  {['Low', 'Medium', 'High'].map(level => (
                    <button 
                      key={level} 
                      onClick={() => setGoals({...goals, researchLevel: level})}
                      className={cn(
                        "h-12 px-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all border",
                        goals.researchLevel === level ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>
                       <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", goals.researchLevel === level ? "border-indigo-600 bg-indigo-600" : "border-slate-300")}>
                         {goals.researchLevel === level && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8">
            <div>
              {renderLabel('Target Countries', true)}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  placeholder="Search globally (e.g. Canada, Germany)..." 
                  value={searchCountry}
                  onChange={(e) => {
                    setSearchCountry(e.target.value);
                    setIsCountryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCountryDropdownOpen(true)}
                  className="pl-10 relative z-20 bg-white h-14 text-base rounded-2xl shadow-sm border-slate-200/80 focus:ring-indigo-500/20"
                />
                {(searchCountry && !filteredCountries.some(c => c.name.toLowerCase() === searchCountry.toLowerCase())) && (
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20"
                    onClick={() => {
                      if (searchCountry.trim() && !selectedCountries.find(sc => sc.name === searchCountry.trim())) {
                        setSelectedCountries([...selectedCountries, {name: searchCountry.trim()}]);
                        setSearchCountry('');
                        setIsCountryDropdownOpen(false);
                      }
                    }}
                  >
                    <span className="text-sm font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-colors shadow-sm">Add "{searchCountry}"</span>
                  </button>
                )}
                
                <AnimatePresence>
                  {isCountryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsCountryDropdownOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 z-20 max-h-72 overflow-y-auto"
                      >
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map(c => (
                            <div 
                              key={c.name} 
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer font-medium text-slate-700 border-b border-slate-100/50 last:border-0 flex items-center gap-3 transition-colors"
                              onClick={() => {
                                setSelectedCountries([...selectedCountries, c]);
                                setSearchCountry('');
                                setIsCountryDropdownOpen(false);
                              }}
                            >
                              <span className="text-xl">{c.flag}</span>
                              {c.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-5 py-4 text-slate-500 italic flex items-center gap-2">
                             No exact matches. You can add "{searchCountry}" as a custom destination.
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-3 block">Popular Destinations</p>
              <div className="flex flex-wrap gap-2.5">
                {POPULAR_COUNTRIES.map(c => {
                  const isSelected = selectedCountries.find(sc => sc.name === c.name);
                  if (isSelected) return null;
                  return (
                    <button 
                      key={c.name}
                      onClick={() => setSelectedCountries([...selectedCountries, c])}
                      className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2.5 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <span className="text-base">{c.flag}</span>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <div className="flex items-center justify-between mb-4">
                 <span className="text-sm font-semibold text-slate-900">Your Selection</span>
                 <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{selectedCountries.length} Countries Selected</span>
               </div>
              {selectedCountries.length > 0 ? (
                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex flex-wrap gap-3 relative overflow-hidden">
                  <AnimatePresence>
                    {selectedCountries.map(c => (
                      <motion.div 
                        key={c.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white border-2 border-indigo-500 text-indigo-900 pl-3 pr-2 py-2 rounded-xl text-sm font-bold flex items-center gap-3 shadow-md shadow-indigo-100"
                      >
                        {c.flag && <span className="text-lg">{c.flag}</span>}
                        {c.name}
                        <button onClick={() => setSelectedCountries(selectedCountries.filter(sc => sc.name !== c.name))} className="w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-400 hover:text-white hover:bg-rose-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                     <span className="text-xl">🌍</span>
                  </div>
                  <p className="text-slate-600 font-semibold mb-1">No destinations selected</p>
                  <p className="text-sm text-slate-500">Pick anywhere in the world you want to build your future.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div>
                {renderLabel('Funding Source', true)}
                <select 
                  value={finances.fundingSource}
                  onChange={e => setFinances({...finances, fundingSource: e.target.value})}
                  className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select primary source...</option>
                  <option>Self Funded</option>
                  <option>Education Loan</option>
                  <option>Scholarship</option>
                  <option>Family Sponsored</option>
                  <option>Combination</option>
                </select>
              </div>
              <div>
                {renderLabel('Expected Part-Time Work', true)}
                <select 
                  value={finances.partTimeWork}
                  onChange={e => setFinances({...finances, partTimeWork: e.target.value})}
                  className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                >
                  <option value="" disabled>Select importance...</option>
                  <option>Very Important</option>
                  <option>Moderately Important</option>
                  <option>Not Important</option>
                </select>
              </div>
            </div>

            <div>
               {renderLabel('Preferred Tuition Range (Per Year)', true)}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Under $20k", "$20k-$40k", "$40k-$60k", "$60k+"].map(range => (
                   <button 
                    key={range}
                    onClick={() => setFinances({...finances, tuitionRange: range})}
                    className={cn(
                      "h-14 px-2 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center",
                      finances.tuitionRange === range 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm" 
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
              <div className="mb-4 text-slate-900 flex justify-between items-end">
                <div>
                   <h3 className="font-bold text-lg">Rank Your Priorities</h3>
                   <p className="text-sm text-slate-500 mt-1">This heavily influences your AI recommendations.</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm flex items-center gap-1.5">
                  <GripVertical className="w-3.5 h-3.5" /> Drag to reorder
                </span>
              </div>
              
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="priorities-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {priorities.map((item, index) => {
                        // @ts-ignore
                        return <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 bg-white rounded-xl border transition-all",
                                snapshot.isDragging ? "shadow-xl border-indigo-400 rotate-1 scale-105 z-50" : "shadow-sm border-slate-200 hover:border-slate-300"
                              )}
                            >
                              <div {...provided.dragHandleProps} className="text-slate-400 hover:text-indigo-600 transition-colors p-1 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm", index < 3 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <span className="font-bold text-slate-800 block text-sm">{item.label}</span>
                              </div>
                              <div className="group relative">
                                <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                                  {item.tooltip}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-8">
             <div className="grid grid-cols-2 gap-6">
               <div>
                  {renderLabel('Preferred Class Size', true)}
                  <select 
                    value={personal.classSize}
                    onChange={e => setPersonal({...personal, classSize: e.target.value})}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                  >
                    <option value="" disabled>Select size...</option>
                    <option>Small (Intimate, discussion-based)</option>
                    <option>Medium</option>
                    <option>Large (Lecture halls, massive campus)</option>
                  </select>
               </div>
               <div>
                  {renderLabel('Preferred Location Type', true)}
                  <select 
                    value={personal.locationType}
                    onChange={e => setPersonal({...personal, locationType: e.target.value})}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 appearance-none"
                  >
                    <option value="" disabled>Select location...</option>
                    <option>Urban (City Center)</option>
                    <option>Suburban</option>
                    <option>Rural (College Town)</option>
                  </select>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
               <div>
                  {renderLabel('Importance of PR', true)}
                  <div className="flex flex-col gap-2">
                    {['Very Important', 'Moderately Important', 'Not Important'].map(level => (
                       <button 
                        key={level} 
                        onClick={() => setPersonal({...personal, prImportance: level})}
                        className={cn(
                          "h-11 px-4 rounded-xl flex items-center justify-between text-sm font-medium transition-all border",
                          personal.prImportance === level ? "bg-teal-50 border-teal-500 text-teal-800 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}>
                        {level}
                        {personal.prImportance === level && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </button>
                    ))}
                  </div>
               </div>
               <div>
                  {renderLabel('Importance of Job Opps', true)}
                  <div className="flex flex-col gap-2">
                    {['Very Important', 'Moderately Important', 'Not Important'].map(level => (
                       <button 
                        key={level} 
                        onClick={() => setPersonal({...personal, jobImportance: level})}
                        className={cn(
                          "h-11 px-4 rounded-xl flex items-center justify-between text-sm font-medium transition-all border",
                          personal.jobImportance === level ? "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}>
                        {level}
                        {personal.jobImportance === level && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
               </div>
             </div>

            <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border border-indigo-100 shadow-inner">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Your profile is almost complete.</h4>
                  <p className="text-sm text-slate-600 mt-1 mb-4 text-pretty">
                    We'll use these specific preferences to power the AI matching engine, evaluating over thousands of universities against your criteria.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" required />
                    <span className="text-sm font-medium text-slate-700">I confirm the provided preferences are accurate to my best knowledge. <span className="text-rose-500">*</span></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepTitles = () => {
    switch (step) {
      case 1: return { title: "Create your account & Profile", subtitle: "Tell us about yourself." };
      case 2: return { title: "Education Profile", subtitle: "Tell us about your academic background." };
      case 3: return { title: "Test Scores", subtitle: "Language and standardized tests." };
      case 4: return { title: "Professional Details", subtitle: "Work experience and resume." };
      case 5: return { title: "Study Goals", subtitle: "What and when are you planning to study?" };
      case 6: return { title: "Target Countries", subtitle: "Where do you want to build your future?" };
      case 7: return { title: "Budget & Priorities", subtitle: "Help us find the best fit for your expectations." };
      case 8: return { title: "Final Personalization", subtitle: "A few more details to perfect your recommendations." };
      default: return { title: "", subtitle: "" };
    }
  };

  const titles = getStepTitles();

  return (
    <OnboardingLayout 
      currentStep={step} 
      totalSteps={8} 
      title={titles.title} 
      subtitle={titles.subtitle}
      onBack={step > 1 ? handleBack : undefined}
      onNext={handleNext}
      isNextDisabled={!isStepValid()}
      nextLabel={step === 8 ? "Generate Profile" : "Continue"}
      isLoading={isLoading}
    >
      {renderStepContent()}
    </OnboardingLayout>
  );
}
