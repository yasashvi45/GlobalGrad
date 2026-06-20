import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ChevronDown, MessageSquare, Briefcase, FileText, Send, Bookmark, Minimize2, Maximize2, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getApplicationHealth, generateInsights, getRecommendations, handleUserQuery } from '@/lib/aiEngine';
import { Link, useNavigate } from 'react-router-dom';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat'|'insights'|'roadmap'>('chat');
  const [healthScore, setHealthScore] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: "Hi! I'm your GlobalGrad AI counselor. How can I help you with your applications today?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open_ai_assistant', handleOpen);
    return () => window.removeEventListener('open_ai_assistant', handleOpen);
  }, []);

  useEffect(() => {
    async function load() {
      const hScore = await getApplicationHealth();
      const ins = await generateInsights();
      const recommended = await getRecommendations();
      
      setHealthScore(hScore);
      setInsights(ins);
      setRecs(recommended);
    }
    if (isOpen) {
       load();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, activeTab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQ = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userQ }]);

    // Simulated delay for thinking
    setTimeout(async () => {
        const response = await handleUserQuery(userQ);
        setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
    }, 600);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
       case 'Check Health':
          setActiveTab('insights');
          break;
       case 'Open Tracker':
          navigate('/app/applications');
          setIsOpen(false);
          break;
       case 'Find Scholarships':
          navigate('/app/scholarships');
          setIsOpen(false);
          break;
       case 'Next Steps':
          setQuery('What should I do next?');
          handleSend({ preventDefault: () => {} } as any);
          break;
    }
  };

  if (!isOpen) {
    return (
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/30 z-[9999] overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className={`fixed ${isMinimized ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-64 sm:w-72 h-14 rounded-2xl' : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[600px] sm:max-h-[85vh] sm:rounded-3xl'} bg-white/95 sm:bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl z-[9999] flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 text-white shadow-inner">
               <Sparkles className="w-4 h-4" />
            </div>
            <div>
               <h3 className="font-bold text-sm leading-tight">GlobalGrad AI</h3>
               {!isMinimized && <p className="text-[10px] text-indigo-100 font-medium">Smart Counselor</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-1 relative z-10">
            <button onClick={() => setIsMinimized(!isMinimized)} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
               {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
               <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
           <>
              {/* Nav Tabs */}
              <div className="flex px-2 pt-2 gap-1 border-b border-white/50 shrink-0 bg-white/30 backdrop-blur-md">
                <button 
                  onClick={() => setActiveTab('chat')} 
                   className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'chat' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button 
                  onClick={() => setActiveTab('insights')} 
                   className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'insights' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
                >
                  <Zap className="w-3.5 h-3.5" /> Insights
                </button>
                <button 
                  onClick={() => setActiveTab('roadmap')} 
                   className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'roadmap' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/50'}`}
                >
                  <Target className="w-3.5 h-3.5" /> Roadmap
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-slate-50/50">
                 {activeTab === 'chat' && (
                    <div className="space-y-4">
                       <div className="flex flex-wrap gap-2 mb-4">
                          {['Check Health', 'Open Tracker', 'Next Steps', 'Find Scholarships'].map((action) => (
                             <button key={action} onClick={() => handleQuickAction(action)} className="px-3 py-1.5 bg-white border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                                {action}
                             </button>
                          ))}
                       </div>
                       
                       <div className="space-y-3">
                          {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                                  {msg.content}
                               </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                       </div>
                    </div>
                 )}

                 {activeTab === 'insights' && (
                    <div className="space-y-4">
                       <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                           <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-indigo-50 shrink-0">
                               <svg className="absolute inset-0 w-full h-full -rotate-90">
                                 <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                 <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={188.5} strokeDashoffset={188.5 - (188.5 * healthScore) / 100} className="text-indigo-600 transition-all duration-1000 ease-out" />
                               </svg>
                               <span className="font-black text-lg text-indigo-700">{healthScore}</span>
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-900 text-sm">Application Health</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Based on your activity, documents, and tasks.</p>
                           </div>
                       </div>

                       <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Smart Insights</h4>
                          {insights.map((ins, i) => (
                             <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl text-sm text-slate-600 flex items-start gap-3 shadow-sm">
                                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>{ins}</span>
                             </div>
                          ))}
                       </div>
                       
                       {recs.length > 0 && (
                       <div className="space-y-2 mt-4">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Top Recommended Universities</h4>
                          {recs.map((u, i) => (
                             <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm group">
                                <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                      <Briefcase className="w-4 h-4 text-indigo-500" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{u.name}</p>
                                      <p className="text-[10px] text-slate-500 font-medium">{u.location}</p>
                                   </div>
                                </div>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{(u.matchScore || u.match || 0)}% Match</span>
                             </div>
                          ))}
                       </div>
                       )}
                    </div>
                 )}

                 {activeTab === 'roadmap' && (
                    <div className="space-y-4">
                       <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                          {/* Stage 1 */}
                          <div className="relative">
                             <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             </div>
                             <h4 className="font-bold text-sm text-slate-900">Profile & Research</h4>
                             <p className="text-xs text-slate-500 mt-1">Complete your profile and save initial universities.</p>
                             <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-max">Complete</div>
                          </div>
                          
                          {/* Stage 2 */}
                          <div className="relative">
                             <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center z-10 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                             </div>
                             <h4 className="font-bold text-sm text-slate-900">Documents & Eligibility</h4>
                             <p className="text-xs text-slate-500 mt-1">Upload Passport, IELTS, and transcript.</p>
                             <div className="mt-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded w-max">In Progress</div>
                          </div>

                          {/* Stage 3 */}
                          <div className="relative">
                             <div className="absolute -left-[29px] w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10"></div>
                             <h4 className="font-bold text-sm text-slate-400">Applications</h4>
                             <p className="text-xs text-slate-400 mt-1">Submit applications to shortlisted universities.</p>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              {/* Chat Input */}
              {activeTab === 'chat' && (
              <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0">
                 <div className="relative">
                   <input 
                     type="text" 
                     value={query}
                     onChange={e => setQuery(e.target.value)}
                     placeholder="Ask me anything..."
                     className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-xl h-10 pl-4 pr-10 text-sm"
                   />
                   <button type="submit" disabled={!query.trim()} className="absolute right-1 top-1 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                     <Send className="w-4 h-4" />
                   </button>
                 </div>
              </form>
              )}
           </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
