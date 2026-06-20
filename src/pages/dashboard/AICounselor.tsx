import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, MessageSquare, Briefcase, FileText, Send, Bookmark, Clock,
  Search, BookOpen, Globe2, FileCheck, Landmark, GraduationCap, PenTool,
  Target, GraduationCap as Cap, Award, CheckCircle, ChevronDown, Check, Zap, Plus, Trash2,
  Calculator, CheckCircle2, XCircle, ListTodo, Activity
} from 'lucide-react';
import { generateInsights, handleUserQuery } from '@/lib/aiEngine';
import { AIChatSession, getUserAIChats, saveAIChatSession, deleteAIChatSession } from '@/services/aiCounselorService';
import { listenToTable } from '@/lib/api';

const quickActions = [
  { name: 'University Match', icon: GraduationCap, preset: 'Find universities matching my profile.' },
  { name: 'Scholarship Search', icon: Award, preset: 'Find scholarships matching my profile.' },
  { name: 'Country Comparison', icon: Globe2, preset: 'Compare the best countries for my profile.' },
  { name: 'Visa Guidance', icon: FileCheck, preset: 'Generate visa guidance for my preferred destination.' },
  { name: 'SOP Assistant', icon: PenTool, preset: 'Help me prepare a strong Statement of Purpose.' },
  { name: 'Application Review', icon: FileText, preset: 'Review my application readiness.' },
  { name: 'Career Planner', icon: Briefcase, preset: 'Suggest career paths after graduation.' },
];

const aiShortcuts = [
  'Find universities for me',
  'Find scholarships for me',
  'Compare Australia vs Canada',
  'Create study plan',
  'Estimate study budget',
  'Create application timeline',
  'Generate SOP outline'
];

export function AICounselor() {
  const { userData } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle'|'typing'>('idle');
  
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  // Right Panel specific states
  const [calcTab, setCalcTab] = useState<string | null>(null);
  const [tuitionForm, setTuitionForm] = useState({ country: '', university: '', program: '' });
  const [livingForm, setLivingForm] = useState({ country: '', city: '' });
  const [budgetForm, setBudgetForm] = useState({ budget: '', duration: '' });
  const [loanForm, setLoanForm] = useState({ amount: '', rate: '', duration: '' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [prefs, setPrefs] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [academic, setAcademic] = useState<any[]>([]);
  const [testScores, setTestScores] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [savedUnis, setSavedUnis] = useState<any[]>([]);
  const [savedCountries, setSavedCountries] = useState<any[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<any[]>([]);

  useEffect(() => {
    if (!userData?.id) return;
    
    const unsubs = [
      listenToTable('study_preferences', setPrefs),
      listenToTable('documents', setDocs),
      listenToTable('profiles', setProfiles),
      listenToTable('academic_profiles', setAcademic),
      listenToTable('test_scores', setTestScores),
      listenToTable('applications', setApps),
      listenToTable('universities_saved', setSavedUnis),
      listenToTable('countries_saved', setSavedCountries),
      listenToTable('scholarships_saved', setSavedScholarships),
    ];
    
    setDataLoaded(true);
    
    return () => unsubs.forEach(u => u());
  }, [userData?.id]);

  useEffect(() => {
    async function loadChats() {
      if (!userData?.id) return;
      const loadedChats = await getUserAIChats(userData?.id || '');
      setSessions(loadedChats);
      
      if (loadedChats.length > 0) {
        setCurrentSessionId(loadedChats[0].sessionId);
      } else {
        startNewSession();
      }
    }
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id]);

  const currentSession = sessions.find(s => s.sessionId === currentSessionId);
  const chatHistory = currentSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, status]);

  const startNewSession = () => {
    // Check if the current top session is already empty (only welcome message)
    if (sessions.length > 0 && sessions[0].messages.length <= 1) {
       setCurrentSessionId(sessions[0].sessionId);
       return;
    }

    const newId = Date.now().toString();
    const newSession: AIChatSession = {
      sessionId: newId,
      title: 'New Conversation',
      messages: [{ id: 'welcome', role: 'ai', type: 'welcome', timestamp: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: '',
      category: 'General'
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
  };

  const handleSend = async (userQ: string) => {
    if (!userQ.trim() || status === 'typing') return;
    
    console.log('[AI_COUNSELOR] MESSAGE_SEND_START');
    let sessionIdToUpdate = currentSessionId;
    let activeSession = sessions.find(s => s.sessionId === sessionIdToUpdate);
    
    setQuery('');
    setStatus('typing');
    
    // Auto-create session if none exists
    let currentSessions = [...sessions];
    if (!activeSession) {
       console.log('[AI_COUNSELOR] No active session found. Creating a new one automatically.');
       sessionIdToUpdate = Date.now().toString();
       activeSession = {
          sessionId: sessionIdToUpdate,
          title: 'New Conversation',
          messages: [{ id: 'welcome', role: 'ai', type: 'welcome', timestamp: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: '',
          category: 'General'
       };
       currentSessions = [activeSession, ...currentSessions];
       setCurrentSessionId(sessionIdToUpdate);
       setSessions(currentSessions);
    }

    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: userQ, timestamp: new Date() };
    const newHistory = [...(activeSession.messages || []), userMsg];
    
    let title = activeSession.title || 'New Conversation';
    if (activeSession.messages.length <= 1 || title === 'New Conversation') {
       title = userQ.substring(0, 30) + (userQ.length > 30 ? '...' : '');
    }

    const sessionWithUserMsg = {
       ...activeSession,
       title,
       messages: newHistory,
       lastMessage: userQ,
       updatedAt: new Date()
    };

    // 1. Instantly render user message
    setSessions(prev => {
        const exists = prev.find(s => s.sessionId === sessionIdToUpdate);
        if (!exists) return [sessionWithUserMsg, ...prev];
        return prev.map(s => s.sessionId === sessionIdToUpdate ? sessionWithUserMsg : s);
    });
    
    console.log('[AI_COUNSELOR] MESSAGE_SEND_SUCCESS');
    
    // 2. Save implicitly in background
    if (userData?.id) {
       saveAIChatSession(userData.id, sessionWithUserMsg)
          .then(() => console.log('[AI_COUNSELOR] FIREBASE_SAVE_SUCCESS'))
          .catch(e => console.error('[AI_COUNSELOR] Context save failed:', e));
    }

    try {
      console.log(`[AI_COUNSELOR] AI_REQUEST_START for query: ${userQ}`);
      const responseText = await handleUserQuery(userQ);
      console.log(`[AI_COUNSELOR] AI_RESPONSE_RECEIVED`);
      let parsed = null;
      try {
         parsed = JSON.parse(responseText);
      } catch (e) {
         parsed = { summary: responseText };
      }
      
      const aiMsg = { 
         id: Date.now().toString() + 'ai', 
         role: 'ai' as const, 
         type: 'default' as const, 
         content: responseText,
         data: parsed,
         timestamp: new Date()
      };
      
      const sessionWithAiMsg = {
         ...sessionWithUserMsg,
         messages: [...newHistory, aiMsg],
         lastMessage: parsed?.summary || responseText,
         updatedAt: new Date()
      };

      setSessions(prev => prev.map(s => s.sessionId === sessionIdToUpdate ? sessionWithAiMsg : s));
      if (userData?.id) {
         saveAIChatSession(userData.id, sessionWithAiMsg)
            .then(() => console.log('[AI_COUNSELOR] FIREBASE_SAVE_SUCCESS'))
            .catch(e => console.error(e));
      }

    } catch (error) {
      console.error(`[AI_COUNSELOR] Gemini request failed:`, error);
      const errorMsg = { 
         id: Date.now().toString() + 'ai', 
         role: 'ai' as const, 
         type: 'default' as const, 
         content: '{"summary": "Unable to generate a response. Please try again."}',
         data: { summary: "Unable to generate a response. Please try again." },
         timestamp: new Date()
      };
      
      const sessionWithError = {
         ...sessionWithUserMsg,
         messages: [...newHistory, errorMsg],
         lastMessage: "Unable to generate a response. Please try again.",
         updatedAt: new Date()
      };

      setSessions(prev => prev.map(s => s.sessionId === sessionIdToUpdate ? sessionWithError : s));
      if (userData?.id) {
         saveAIChatSession(userData.id, sessionWithError)
            .then(() => console.log('[AI_COUNSELOR] FIREBASE_SAVE_SUCCESS'))
            .catch(e => console.error(e));
      }
    }
    setStatus('idle');
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    if (!userData?.id) return;
    
    // Instantly filter out from UI
    setSessions(prev => {
      const remaining = prev.filter(s => s.sessionId !== id);
      
      if (currentSessionId === id || remaining.length === 0) {
        // Active session is being deleted, select the first remaining one
        if (remaining.length > 0) {
          // Defer selecting to avoid state updater warning
          setTimeout(() => setCurrentSessionId(remaining[0].sessionId), 0);
        } else {
          // If no sessions remain, trigger new empty session creation
          const newId = Date.now().toString();
          const newSession: AIChatSession = {
            sessionId: newId,
            title: 'New Conversation',
            messages: [{ id: 'welcome', role: 'ai', type: 'welcome', timestamp: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMessage: '',
            category: 'General'
          };
          setTimeout(() => setCurrentSessionId(newId), 0);
          return [newSession];
        }
      }
      return remaining;
    });

    try {
      await deleteAIChatSession(userData.id, id);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Chat deleted' } }));
    } catch (err: any) {
      console.error("Firestore error deleting AI chat session:", err);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: err?.message || 'Failed to delete chat', type: 'error' } }));
    }
  };
  
  const handleCalcSubmit = (type: string, e: React.FormEvent) => {
     e.preventDefault();
     setCalcTab(null);
     
     let prompt = '';
     if (type === 'tuition') {
        prompt = `Calculate the estimated tuition for a ${tuitionForm.program} program at ${tuitionForm.university}, ${tuitionForm.country}.`;
     } else if (type === 'living') {
        prompt = `What is the estimated monthly and annual living cost for a student in ${livingForm.city}, ${livingForm.country}?`;
     } else if (type === 'budget') {
        prompt = `Help me plan a study abroad budget of $${budgetForm.budget} over ${budgetForm.duration} years. Provide tuition allocation, living expenses, and emergency fund details.`;
     } else if (type === 'loan') {
        prompt = `Calculate the EMI and total repayment for a study loan of $${loanForm.amount} at ${loanForm.rate}% interest for ${loanForm.duration} years.`;
     }
     
     if (prompt) {
       if (chatHistory.length > 1) {
          startNewSession();
          setTimeout(() => handleSend(prompt), 100);
       } else {
          handleSend(prompt);
       }
     }
  };

  const userDocs = docs.filter((d:any) => String(d.userId) === String(userData?.id));
  const userProfile = profiles.find((p:any) => String(p.userId) === String(userData?.id)) || profiles[0] || {};
  const userAcad = academic.find((p:any) => String(p.userId) === String(userData?.id)) || academic[0] || {};
  const userPref = prefs.find((p:any) => String(p.userId) === String(userData?.id)) || prefs[0] || {};
  const userTests = testScores.filter((p:any) => String(p.userId) === String(userData?.id));
  const userApps = apps.filter((a:any) => String(a.studentId) === String(userData?.id));
  const userSavedUnis = savedUnis.filter((u:any) => String(u.userId) === String(userData?.id));
  const userSavedCountries = savedCountries.filter((c:any) => String(c.userId) === String(userData?.id));
  const userSavedScholarships = savedScholarships.filter((s:any) => String(s.userId) === String(userData?.id));

  const hasPersonalInfo = Object.keys(userProfile).length > 2;
  const hasAcademicInfo = !!userAcad?.cgpa;
  const hasPreferences = userPref?.countries?.length > 0 || !!userPref?.budget;
  const hasDocuments = userDocs.length > 0;
  const hasTestScores = userTests.length > 0;

  const profileSections = [
    { name: 'Personal Info', completed: hasPersonalInfo },
    { name: 'Academic Info', completed: hasAcademicInfo },
    { name: 'Preferences', completed: hasPreferences },
    { name: 'Documents', completed: hasDocuments },
    { name: 'Test Scores', completed: hasTestScores },
  ];
  
  const completedCount = profileSections.filter(s => s.completed).length;
  const profileCompletion = Math.round((completedCount / profileSections.length) * 100) || 0;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#FCFCFD]">
      {/* LEFT SIDEBAR - 280px */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex relative z-10 overflow-hidden">
         <div className="p-4 border-b border-slate-100 bg-white sticky top-0">
             <button 
                onClick={startNewSession}
                className="w-full h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-indigo-600 transition-colors shadow-sm"
             >
                <Plus className="w-4 h-4" /> New Chat
             </button>
         </div>

         <div className="flex-1 overflow-y-auto w-full py-4 px-3 space-y-6 scrollbar-hide">
            <div>
               <div className="flex items-center justify-between px-3 mb-2">
                 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Chats</span>
               </div>
               <div className="space-y-0.5">
                  {sessions.filter(s => s.messages.length > 1).map((chat) => (
                     <div key={chat.sessionId} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left group cursor-pointer ${chat.sessionId === currentSessionId ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`} onClick={() => setCurrentSessionId(chat.sessionId)}>
                        <div className="flex items-center gap-3 truncate">
                           <MessageSquare className="w-4 h-4 shrink-0" />
                           <span className="truncate">{chat.title}</span>
                        </div>
                        <button onClick={(e) => handleDeleteSession(chat.sessionId, e)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5"/></button>
                     </div>
                  ))}
                  {sessions.filter(s => s.messages.length > 1).length === 0 && (
                     <div className="px-3 py-4 text-xs text-slate-400 text-center font-medium">No recent chats.</div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* CENTER PANEL - Workspace */}
      <div className="flex-1 flex flex-col relative z-0 h-full overflow-hidden bg-white/50">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay pointer-events-none"></div>
           
         <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 xl:px-16 scrollbar-hide">
            <div className="max-w-3xl mx-auto space-y-8 pb-10">
               {chatHistory.map((msg, idx) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.type === 'welcome' && (
                         <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="text-center mb-8 mt-10">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 mb-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                    <Sparkles className="w-8 h-8 text-white relative z-10" />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {userData?.name?.split(' ')[0] || 'Student'}</h1>
                                <p className="text-slate-500 font-medium mt-2">I'm your AI Counselor. How can we advance your journey today?</p>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl font-black text-indigo-600">{profileCompletion}%</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Profile Strength</div>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl font-black text-slate-800">{userPref?.intendedIntake || 'Not set'}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Target Intake</div>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl font-black text-slate-800">{userPref?.budget ? (userPref.budget.startsWith('$') ? userPref.budget : '$' + userPref.budget) : 'Not set'}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Budget Setup</div>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl font-black text-emerald-600">{Math.max(0, 4 - userDocs.length)}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Missing Tasks</div>
                                </div>
                             </div>
                         </div>
                      )}

                      {msg.role === 'user' && (
                         <div className="max-w-[80%] bg-indigo-600 text-white p-4 rounded-3xl rounded-tr-sm shadow-md animate-in slide-in-from-right-4 fade-in font-medium">
                            {msg.content}
                            <div className="text-[10px] opacity-70 mt-1 text-right">{msg.timestamp && new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([],{hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                      )}

                      {msg.role === 'ai' && msg.type !== 'welcome' && (
                         <div className="flex gap-4 max-w-[95%] w-full animate-in slide-in-from-left-4 fade-in">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 flex items-center justify-center shadow-lg text-white relative overflow-hidden mt-1">
                               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20"></div>
                               <Sparkles className="w-4 h-4 relative z-10" />
                            </div>
                            <div className="flex-1 w-full space-y-4">
                               {msg.data?.summary && (
                                 <div className="text-slate-700 bg-white border border-slate-200 p-5 rounded-3xl rounded-tl-sm shadow-sm font-medium">
                                    {msg.data.summary}
                                 </div>
                               )}
                               
                               {msg.data?.recommendations?.length > 0 && (
                                  <div className="space-y-4">
                                     <h3 className="font-black text-slate-900 tracking-tight pl-1">Recommendations</h3>
                                     <div className="grid gap-4">
                                       {msg.data.recommendations.map((item: any, i: number) => (
                                          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                             <div className="flex justify-between items-start mb-4">
                                                <div>
                                                   <h4 className="text-lg font-bold text-indigo-700">{item.title}</h4>
                                                   {item.cost && <p className="text-sm text-slate-500 font-medium">Estimated Cost: {item.cost}</p>}
                                                </div>
                                                {item.score && (
                                                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 font-black rounded-full text-xs">
                                                     {item.score}% Match
                                                  </div>
                                                )}
                                             </div>
                                             <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-sm font-medium text-slate-700">{item.description}</p>
                                             </div>
                                          </div>
                                       ))}
                                     </div>
                                  </div>
                               )}

                               {msg.data?.estimatedCosts?.length > 0 && (
                                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                     <h3 className="font-black text-slate-900 tracking-tight mb-4">Estimated Costs</h3>
                                     <div className="space-y-3">
                                       {msg.data.estimatedCosts.map((cost: any, i: number) => (
                                          <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-sm" key={i}>
                                             <span className="font-bold text-slate-700">{cost.item}</span>
                                             <span className="font-black text-indigo-600">{cost.amount}</span>
                                          </div>
                                       ))}
                                     </div>
                                  </div>
                               )}

                               {msg.data?.actionItems?.length > 0 && (
                                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                                     <h3 className="font-black text-indigo-900 tracking-tight mb-4">Action Items</h3>
                                     <ul className="space-y-2">
                                       {msg.data.actionItems.map((action: any, i: number) => (
                                          <li key={i} className="flex items-start gap-2 text-sm text-indigo-800 font-medium">
                                             <CheckCircle className="w-5 h-5 shrink-0 text-indigo-500" />
                                             <span className="mt-0.5">{action.task}</span>
                                          </li>
                                       ))}
                                     </ul>
                                  </div>
                               )}
                               
                               {msg.data?.nextStep && (
                                  <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                                     <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">Next Step</p>
                                        <p className="font-medium">{msg.data.nextStep}</p>
                                     </div>
                                     <button onClick={() => setQuery(msg.data.nextStep)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-colors">Start</button>
                                  </div>
                               )}
                               
                               {!msg.data?.summary && msg.content && (
                                  <div className="text-slate-700 bg-white border border-slate-200 p-5 rounded-3xl rounded-tl-sm shadow-sm font-medium whitespace-pre-wrap">
                                     {msg.content}
                                  </div>
                               )}
                               <div className="text-[10px] opacity-70 mt-1 pl-1 text-slate-400">
                                  {msg.timestamp && new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([],{hour: '2-digit', minute:'2-digit'})}
                               </div>
                            </div>
                         </div>
                      )}
                  </div>
               ))}
               
               {status === 'typing' && (
                  <div className="flex gap-4 max-w-[90%] w-full animate-in fade-in">
                     <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 flex items-center justify-center shadow-lg text-white relative overflow-hidden mt-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20"></div>
                        <Sparkles className="w-4 h-4 relative z-10" />
                     </div>
                     <div className="bg-white border border-slate-200 px-4 py-3.5 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-1.5 w-fit h-11">
                         <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                     </div>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>
         </div>

         {/* Chat Input */}
         <div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shrink-0">
             <div className="max-w-3xl mx-auto relative">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(query); setQuery(''); }} className="relative flex items-center shadow-sm">
                   <div className="absolute left-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                   </div>
                   <input 
                     type="text" 
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                     disabled={status === 'typing'}
                     placeholder="Ask your AI Counselor anything..."
                     className="w-full bg-white border border-slate-300 rounded-2xl h-14 pl-14 pr-14 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                   />
                   <button type="submit" disabled={!query.trim() || status === 'typing'} className="absolute right-2 w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors">
                     <Send className="w-4 h-4 ml-0.5" />
                   </button>
                </form>
             </div>
         </div>
      </div>

      {/* RIGHT PANEL - Tools & Utilities */}
      <div className="w-[300px] xl:w-[360px] 2xl:w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 hidden lg:flex overflow-y-auto">
         <div className="p-6 space-y-8">
            <div>
               <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-indigo-600" /> AI Tools
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (chatHistory.length > 1) startNewSession();
                        setTimeout(() => handleSend(action.preset), 100);
                      }}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-xl transition-colors text-left"
                    >
                       <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                         <action.icon className="w-4 h-4 text-slate-700" />
                       </div>
                       <span className="text-xs font-bold text-slate-700 leading-tight">{action.name}</span>
                    </button>
                 ))}
               </div>
            </div>

            <div>
               <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Calculator className="w-4 h-4 text-slate-400" /> Calculators
               </h3>
               <div className="space-y-2">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                     <button onClick={() => setCalcTab(calcTab === 'tuition' ? null : 'tuition')} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-bold text-sm text-slate-800">
                        Tuition Estimator <ChevronDown className={`w-4 h-4 transition-transform ${calcTab === 'tuition' ? 'rotate-180' : ''}`} />
                     </button>
                     {calcTab === 'tuition' && (
                        <form onSubmit={(e) => handleCalcSubmit('tuition', e)} className="p-3 bg-white space-y-3">
                           <input placeholder="Country" required value={tuitionForm.country} onChange={e=>setTuitionForm({...tuitionForm, country: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <input placeholder="University" required value={tuitionForm.university} onChange={e=>setTuitionForm({...tuitionForm, university: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <input placeholder="Program" required value={tuitionForm.program} onChange={e=>setTuitionForm({...tuitionForm, program: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-700">Calculate</button>
                        </form>
                     )}
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                     <button onClick={() => setCalcTab(calcTab === 'living' ? null : 'living')} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-bold text-sm text-slate-800">
                        Living Cost Calculator <ChevronDown className={`w-4 h-4 transition-transform ${calcTab === 'living' ? 'rotate-180' : ''}`} />
                     </button>
                     {calcTab === 'living' && (
                        <form onSubmit={(e) => handleCalcSubmit('living', e)} className="p-3 bg-white space-y-3">
                           <input placeholder="Country" required value={livingForm.country} onChange={e=>setLivingForm({...livingForm, country: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <input placeholder="City" required value={livingForm.city} onChange={e=>setLivingForm({...livingForm, city: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-700">Calculate</button>
                        </form>
                     )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                     <button onClick={() => setCalcTab(calcTab === 'budget' ? null : 'budget')} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-bold text-sm text-slate-800">
                        Budget Planner <ChevronDown className={`w-4 h-4 transition-transform ${calcTab === 'budget' ? 'rotate-180' : ''}`} />
                     </button>
                     {calcTab === 'budget' && (
                        <form onSubmit={(e) => handleCalcSubmit('budget', e)} className="p-3 bg-white space-y-3">
                           <input placeholder="Total Budget (e.g. 50000)" required type="number" value={budgetForm.budget} onChange={e=>setBudgetForm({...budgetForm, budget: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <input placeholder="Duration in Years" required type="number" step="0.5" value={budgetForm.duration} onChange={e=>setBudgetForm({...budgetForm, duration: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-700">Plan Budget</button>
                        </form>
                     )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                     <button onClick={() => setCalcTab(calcTab === 'loan' ? null : 'loan')} className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 font-bold text-sm text-slate-800">
                        Loan Calculator <ChevronDown className={`w-4 h-4 transition-transform ${calcTab === 'loan' ? 'rotate-180' : ''}`} />
                     </button>
                     {calcTab === 'loan' && (
                        <form onSubmit={(e) => handleCalcSubmit('loan', e)} className="p-3 bg-white space-y-3">
                           <input placeholder="Loan Amount" type="number" required value={loanForm.amount} onChange={e=>setLoanForm({...loanForm, amount: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <input placeholder="Interest Rate %" type="number" step="0.1" required value={loanForm.rate} onChange={e=>setLoanForm({...loanForm, rate: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <input placeholder="Duration in Years" type="number" required value={loanForm.duration} onChange={e=>setLoanForm({...loanForm, duration: e.target.value})} className="w-full text-sm p-2 border rounded-lg focus:outline-indigo-600" />
                           <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-700">Calculate EMI</button>
                        </form>
                     )}
                  </div>
               </div>
            </div>

            <div>
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                   <Target className="w-4 h-4 text-emerald-500" /> Profile Progress
                 </h3>
                 <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{profileCompletion}%</span>
               </div>
               
               <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${profileCompletion}%` }} />
               </div>
               <div className="grid grid-cols-2 gap-2">
                  {profileSections.map((sec, i) => (
                     <div key={i} className="flex items-center gap-2 text-xs">
                        {sec.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                        <span className={sec.completed ? 'text-slate-800 font-medium' : 'text-slate-500'}>{sec.name}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div>
               <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-amber-500" /> AI Shortcuts
               </h3>
               <div className="flex flex-wrap gap-2">
                  {aiShortcuts.map((sc, i) => (
                     <button
                        key={i}
                        onClick={() => {
                           if (chatHistory.length > 1) startNewSession();
                           setTimeout(() => handleSend(sc), 100);
                        }}
                        className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                     >
                        {sc}
                     </button>
                  ))}
               </div>
            </div>

            <div>
               <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
               </h3>
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-sm font-bold text-slate-700">Saved Universities</span>
                     <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">{userSavedUnis.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-sm font-bold text-slate-700">Saved Scholarships</span>
                     <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">{userSavedScholarships.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-sm font-bold text-slate-700">Saved Countries</span>
                     <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">{userSavedCountries.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-sm font-bold text-slate-700">Applications</span>
                     <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">{userApps.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-sm font-bold text-slate-700">Documents</span>
                     <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded-full">{userDocs.length}</span>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
