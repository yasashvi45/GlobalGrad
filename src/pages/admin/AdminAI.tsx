import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Download, Archive, 
  Settings, Loader2, CheckSquare, Sparkles, Sidebar,
  Plus, Check, X, FileText, Globe, Clock, ChevronRight, AlertCircle, Search
} from 'lucide-react';
import { getTable, saveToTable } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from "../../config";

export default function AdminAI() {
  const { userData } = useAuth();
  
  const [dataLoading, setDataLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) setHealthData(await res.json());
    } catch(e){}
  };

  const [showAuditDrawer, setShowAuditDrawer] = useState(false);

  const fetchHistory = async () => {
     try {
        const res = await fetch(`${API_BASE}/api/ai/history`);
        if (res.ok) {
           const data = await res.json();
           setConversationHistory(data.history || []);
        }
     } catch (e) {}
  };

  const fetchOperations = async () => {
     try {
        const res = await fetch(`${API_BASE}/api/ai/operations`);
        if (res.ok) {
           const data = await res.json();
           setAuditLogs(data.operations || []);
        }
     } catch (e) {}
  };

  useEffect(() => {
     fetchHistory();
     fetchOperations();
     fetchHealth();
     const interval = setInterval(() => {
        fetchHistory();
        fetchOperations();
        fetchHealth();
     }, 10000);
     return () => clearInterval(interval);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCommandSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || isTyping) return;
    
    const prompt = chatMessage.trim();
    setChatMessage('');
    setIsTyping(true);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: prompt, time }]);

    const lowerPrompt = prompt.toLowerCase();
    const isOperation = ["create", "add", "generate", "insert", "new", "audit", "update", "delete"].some(kw => lowerPrompt.includes(kw));

    if (!isOperation) {
      try {
        const [universities, countries, scholarships, applications, users] = await Promise.all([
           getTable('universities').catch(() => []),
           getTable('countries').catch(() => []),
           getTable('scholarships').catch(() => []),
           getTable('applications').catch(() => []),
           getTable('users').catch(() => [])
        ]);

        console.log(`[Admin AI Context] Found: ${universities.length} universities, ${scholarships.length} scholarships, ${countries.length} countries, ${applications.length} applications`);

        const contextData = {
           universities: universities || [],
           scholarships: scholarships || [],
           countries: countries || [],
           applications: applications || [],
           users: users || [],
           stats: {
              activeStudents: users?.filter((u: any) => u.role === 'student').length || users.length || 0
           }
        };

        const res = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: sessionId,
            messages: [...messages, { role: 'user', content: prompt }].filter(m => !m.isError && !m.isLoading).map(m => ({ role: m.role, content: m.content || JSON.stringify(m.previewData) })),
            contextData
          })
        });

        if (!res.ok) {
           const errData = await res.json().catch(() => null);
           throw new Error(errData?.error || 'Chat returned an error');
        }
        
        const chatData = await res.json();
        if (chatData.conversationId) setSessionId(chatData.conversationId);
        
        setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'assistant', content: chatData.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
      } catch (err: any) {
        console.error(err);
        const errorMsg = err.message || "";
        const displayMsg = "AI service temporarily unavailable. Please try again later.";
        setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'system', content: displayMsg, isError: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Naive action deduction
    let actionType = "create_country"; // Default mapped backend endpoint
    if (lowerPrompt.includes("university")) {
       actionType = "create_university";
    } else if (lowerPrompt.includes("scholarship")) {
       actionType = "create_scholarship";
    } else if (lowerPrompt.includes("audit") && lowerPrompt.includes("platform")) {
       actionType = "audit_platform";
    } else if (lowerPrompt.includes("audit") && lowerPrompt.includes("countr")) {
       actionType = "audit_countries";
    } else if (lowerPrompt.includes("audit") && lowerPrompt.includes("universit")) {
       actionType = "audit_universities";
    } else if (lowerPrompt.includes("audit") && lowerPrompt.includes("scholarship")) {
       actionType = "audit_scholarships";
    }

    try {
      setMessages(prev => [...prev, { id: 'loading', role: 'assistant', content: `Processing operation: ${actionType.toUpperCase().replace('_', ' ')}...`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), isLoading: true }]);

      const [universities, countries, scholarships, applications, users] = await Promise.all([
         getTable('universities').catch(() => []),
         getTable('countries').catch(() => []),
         getTable('scholarships').catch(() => []),
         getTable('applications').catch(() => []),
         getTable('users').catch(() => [])
      ]);

      console.log(`[Admin AI Context] Found: ${universities.length} universities, ${scholarships.length} scholarships, ${countries.length} countries, ${applications.length} applications`);

      const contextData = {
         universities: universities || [],
         scholarships: scholarships || [],
         countries: countries || [],
         applications: applications || [],
         users: users || [],
         stats: {
           activeStudents: users?.filter((u: any) => u.role === 'student').length || users.length || 0
         }
      };

      const res = await fetch(`${API_BASE}/api/ai/operations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: actionType,
          prompt: prompt,
          contextData
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Server returned an error');
      }

      const generatedAction = await res.json();
      
      setMessages(prev => prev.filter(m => m.id !== 'loading'));
      
      if (generatedAction.action === 'chat_reply') {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: generatedAction.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }]);
        return;
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: generatedAction.message || `Preview generated successfully. Please review the payload below.`,
        previewData: { ...generatedAction, _id: Date.now().toString() },
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }]);
      
      setAuditLogs(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), action: actionType.toUpperCase(), status: 'Pending Approval' }, ...prev]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== 'loading'));
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'system', content: "AI service temporarily unavailable. Please try again later.", isError: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApprove = async (preview: any, messageId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/operations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: preview.action,
          record: preview.record
        })
      });

      if (!res.ok) {
        throw new Error('Server returned an error while saving');
      }
      
      const { collection, id } = await res.json();
      
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, previewData: { ...m.previewData, resolved: 'approved' } };
        }
        return m;
      }));
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Record saved successfully to ${collection}.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
      
      setAuditLogs(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), action: 'SAVE_' + preview.action.split('_')[1]?.toUpperCase(), status: 'Success', recordId: id }, ...prev]);
      
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Record successfully saved to ${collection}` } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: "Failed to save record", type: "error" } }));
      setAuditLogs(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), action: 'SAVE_' + preview.action.split('_')[1]?.toUpperCase(), status: 'Failed' }, ...prev]);
    }
  };

  const handleReject = (previewId: string, messageId: string, actionType: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return { ...m, previewData: { ...m.previewData, resolved: 'rejected' } };
      }
      return m;
    }));
    setAuditLogs(prev => [{ id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), action: actionType.toUpperCase(), status: 'Rejected' }, ...prev]);
  };

  const loadSession = async (id: string) => {
     setSessionId(id);
     try {
        const res = await fetch(`/api/ai/conversation/messages?conversationId=${id}`);
        if (res.ok) {
           const data = await res.json();
           setMessages(data.messages?.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
           })) || []);
        }
     } catch (e) { console.error(e); }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white font-sans overflow-hidden">
      {/* HEADER */}
      <header className="flex-none flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-slate-200 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-600/15">
            <Bot className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-800 tracking-tight leading-none mb-1">AI Operations Copilot</h1>
            <p className="text-[10px] md:text-xs font-semibold text-slate-400 leading-none">Strict mode enabled • Field-mapping active</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button onClick={() => setShowAuditDrawer(!showAuditDrawer)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition"><Sidebar className="w-3.5 h-3.5"/> Audit</button>
          <button onClick={() => { setSessionId(null); setMessages([]); fetchHistory(); }} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition"><Plus className="w-3.5 h-3.5"/> New Session</button>
          <button onClick={() => setShowHistoryDrawer(!showHistoryDrawer)} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition"><Archive className="w-3.5 h-3.5"/> History</button>
          <button disabled title="Export is coming soon" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-200 text-slate-400 rounded-lg cursor-not-allowed transition"><Download className="w-3.5 h-3.5"/> Export</button>
          <button onClick={() => setShowDiagnostics(!showDiagnostics)} className={`p-2 rounded-lg transition ${showDiagnostics ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}><Settings className="w-5 h-5"/></button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - HISTORY */}
        <aside className={`${showHistoryDrawer ? 'flex absolute inset-0 z-50 md:w-[300px] lg:w-[320px] md:static lg:flex' : 'hidden'} bg-slate-50 border-r border-slate-200 flex-col flex-none shadow-[10px_0_30px_rgba(0,0,0,0.05)] overflow-hidden transition-all h-full`}>
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-indigo-500" />
              <h3 className="font-extrabold text-slate-800 text-[11px] tracking-widest uppercase">Session History</h3>
            </div>
            <button onClick={() => setShowHistoryDrawer(false)} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
            {conversationHistory.map((sess) => (
               <div key={sess.id} onClick={() => loadSession(sess.id!)} className={`p-3 rounded-lg border cursor-pointer hover:border-indigo-300 transition ${sess.id === sessionId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                 <h4 className="text-xs font-bold text-slate-800 truncate mb-1">{sess.title}</h4>
                 <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{sess.messagesCount || 0} messages</span>
                 </div>
               </div>
            ))}
          </div>
        </aside>

        {/* CENTER AREA */}
        <main className="flex-1 flex flex-col h-full bg-slate-50 relative min-w-0">
          
          {/* DIAGNOSTICS OVERLAY */}
          {showDiagnostics && (
            <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white border border-slate-200 shadow-xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-800">AI Diagnostics</h3>
                     </div>
                     <button onClick={() => setShowDiagnostics(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="p-5 space-y-4">
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Gemini Setup</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded tracking-wide uppercase ${healthData?.system?.gemini === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                           {healthData?.system?.gemini || 'Checking...'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Database Engine</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded tracking-wide uppercase ${healthData?.system?.database === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                           {healthData?.system?.database || 'Checking...'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Storage Service</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded tracking-wide uppercase ${healthData?.system?.storage === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                           {healthData?.system?.storage || 'Checking...'}
                        </span>
                     </div>
                     
                     <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                        <span className="font-semibold text-slate-700 mb-2 block">Last Error</span>
                        <div className="font-mono text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 break-words max-h-24 overflow-y-auto">
                           {auditLogs.find(o => o.error)?.error || "No recent errors"}
                        </div>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                        <span className="font-semibold text-slate-700 mb-2 block">Last API Call</span>
                        <div className="font-mono text-[10px] text-slate-600 bg-slate-100 p-2 rounded border border-slate-200">
                           {auditLogs[0] ? `${auditLogs[0].action} @ ${new Date(auditLogs[0].createdAt || auditLogs[0].time).toLocaleTimeString()}` : "No recent calls"}
                        </div>
                     </div>

                     <hr className="border-slate-100" />
                     <button onClick={fetchHealth} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg text-sm transition">
                        Run Diagnostics
                     </button>
                  </div>
               </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center w-full max-w-2xl mx-auto px-4">
                <Bot className="w-16 h-16 text-indigo-200 mb-5" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Awaiting Instructions</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                  Provide a command to generate database records. Example: <strong className="text-slate-700">"Create United States country profile"</strong>. I will securely format the official data mapping to your exact schema and await your approval.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                   <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm flex-1 max-w-xs">
                      <Globe className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 uppercase block mb-1">Countries</span>
                        <span className="text-xs text-slate-500 block leading-tight">Create, Profile Updates, Stats</span>
                      </div>
                   </div>
                   <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm flex-1 max-w-xs">
                      <FileText className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 uppercase block mb-1">Applications</span>
                        <span className="text-xs text-slate-500 block leading-tight">Generate Reports, Check Missing</span>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.isError ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {msg.isError ? <AlertCircle className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                )}
                
                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className="flex items-center gap-2 px-1">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{msg.role === 'user' ? 'Admin' : 'Copilot'}</span>
                     <span className="text-[10px] font-semibold text-slate-400">{msg.time}</span>
                   </div>
                   
                   <div className={`p-4 rounded-2xl ${
                     msg.role === 'user' 
                       ? 'bg-slate-800 text-white rounded-tr-sm' 
                       : msg.isError 
                         ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-sm'
                         : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm'
                   }`}>
                     {msg.isLoading ? (
                       <div className="flex items-center gap-2">
                         <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                         <span className="text-sm font-medium">{msg.content}</span>
                       </div>
                     ) : (
                       <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{typeof msg.content === 'object' ? JSON.stringify(msg.content) : msg.content}</p>
                     )}
                   </div>
                   
                   {/* INLINE PREVIEW */}
                   {msg.previewData && (
                     <div className="mt-2 w-full bg-white border-2 border-indigo-100 shadow-sm rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1.5 p-1 h-full bg-indigo-500"></div>
                       <div className="flex justify-between items-start mb-5 pl-2">
                         <div className="flex items-center gap-2.5">
                           <Sparkles className="w-5 h-5 text-indigo-500" />
                           <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
                             {msg.previewData.status === 'audit' ? 'SYSTEM AUDIT REPORT' : 'STRUCTURED OPERATIONAL PAYLOAD'} ({msg.previewData.action})
                           </h3>
                         </div>
                         <div className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg tracking-widest border ${
                           msg.previewData.status === 'audit' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                         }`}>
                           {msg.previewData.status || 'PREVIEW'}
                         </div>
                       </div>

                       {msg.previewData.status === 'audit' ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 ml-2">
                             <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-cyan-600" />
                                  <h4 className="text-xs font-black text-slate-700 tracking-wider">PLATFORM HEALTH DIAGNOSIS</h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] uppercase font-black text-slate-400">Health Score</span>
                                  <div className="text-lg font-black text-slate-800">{msg.previewData.record?.score || 100}%</div>
                                </div>
                             </div>
                             <p className="text-sm font-medium text-slate-600 mb-5 leading-relaxed">{msg.previewData.record?.summary}</p>
                             
                             {msg.previewData.record?.items && msg.previewData.record.items.length > 0 && (
                               <div className="space-y-3">
                                  {msg.previewData.record.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">{item.entityName}</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider w-full truncate max-w-sm mt-0.5" title={item.storedValue}>
                                          Stored: <span className="text-slate-400 font-medium">{String(item.storedValue).substring(0, 40)}</span>
                                        </span>
                                      </div>
                                      <div className="flex flex-col md:items-end text-left md:text-right shrink-0">
                                        <div className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1 ${
                                          item.status === 'Valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                           {item.status}
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-bold max-w-[200px] truncate" title={item.recommendation}>{item.recommendation}</span>
                                      </div>
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                       ) : msg.previewData.status === 'bulk_preview' ? (
                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 ml-2">
                           <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-xs font-black text-slate-700 tracking-wider">BULK SCHEMA GENERATION ({msg.previewData.record?.items?.length || 0} ITEMS)</h4>
                           </div>
                           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                             {msg.previewData.record?.items?.map((record: any, idx: number) => (
                               <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                                 <h5 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{record.name || `Item ${idx+1}`}</h5>
                                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                   {Object.entries(record).map(([key, value]) => (
                                     <div key={key}>
                                       <span className="text-[10px] font-black text-slate-400 border-b border-slate-200/50 pb-0.5 mb-1.5 block uppercase tracking-widest">{key}</span>
                                       <p className="text-[13px] text-slate-800 font-semibold truncate bg-slate-50 border border-slate-100 px-2 py-1 rounded" title={typeof value === 'object' ? JSON.stringify(value) : String(value)}>
                                          {(typeof value === 'object' ? JSON.stringify(value) : String(value)) || <span className="italic text-slate-400 font-medium">Data unavailable</span>}
                                       </p>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ) : (
                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 ml-2">
                           <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-xs font-black text-slate-700 tracking-wider">MAPPED SCHEMA FIELDS</h4>
                           </div>
                           
                           <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                             {Object.entries(msg.previewData.record || {}).map(([key, value]) => (
                               <div key={key}>
                                 <span className="text-[10px] font-black text-slate-400 border-b border-slate-200/50 pb-0.5 mb-1.5 block uppercase tracking-widest">{key}</span>
                                 <p className="text-[13px] text-slate-800 font-semibold truncate bg-white border border-slate-100 px-2 py-1 rounded" title={typeof value === 'object' ? JSON.stringify(value) : String(value)}>
                                    {(typeof value === 'object' ? JSON.stringify(value) : String(value)) || <span className="italic text-slate-400 font-medium">Data unavailable</span>}
                                 </p>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {!msg.previewData.resolved ? (
                         <div className="flex items-center justify-end gap-3 mt-4">
                           <button onClick={() => handleReject(msg.previewData._id, msg.id, msg.previewData.action)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition flex items-center gap-1.5" disabled={isTyping}>
                             <X className="w-3.5 h-3.5" />
                             {msg.previewData.status === 'audit' ? 'Reject Updates' : 'Reject & Discard'}
                           </button>
                           {msg.previewData.status === 'audit' ? (
                             <>
                               <button onClick={() => {}} className="px-6 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5" disabled={isTyping}>
                                 <Search className="w-4 h-4 flex-shrink-0" />
                                 Review Individually
                               </button>
                               <button onClick={() => handleApprove(msg.previewData, msg.id)} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-600/20 rounded-xl transition flex items-center gap-1.5" disabled={isTyping}>
                                 <CheckSquare className="w-4 h-4 flex-shrink-0" />
                                 Approve All Updates
                               </button>
                             </>
                           ) : msg.previewData.status === 'bulk_preview' ? (
                             <button onClick={() => handleApprove(msg.previewData, msg.id)} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-600/20 rounded-xl transition flex items-center gap-1.5" disabled={isTyping}>
                               <CheckSquare className="w-4 h-4 flex-shrink-0" />
                               Approve & Save
                             </button>
                           ) : (
                             <button onClick={() => handleApprove(msg.previewData, msg.id)} className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow shadow-indigo-600/20 rounded-xl transition flex items-center gap-1.5" disabled={isTyping}>
                               <CheckSquare className="w-4 h-4 flex-shrink-0" />
                               Approve Database Write
                             </button>
                           )}
                         </div>
                       ) : (
                         <div className="mt-4 flex justify-end">
                           <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.previewData.resolved === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                             {msg.previewData.resolved === 'approved' ? <><CheckSquare className="w-4 h-4" /> APPROVED</> : <><X className="w-4 h-4" /> REJECTED</>}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                </div>
                
                {msg.role === 'user' && (
                  <div className="mt-1 flex-shrink-0 h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
                    <span className="text-xs font-bold">{userData?.name?.charAt(0) || 'A'}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM COMMAND COMPOSER */}
          <div className="bg-white border-t border-slate-200 p-4 md:p-5 shrink-0 z-10 w-full shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleCommandSubmit} className="w-full flex items-end gap-3 bg-slate-50 border border-slate-300 p-2 rounded-2xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition relative shadow-sm">
              <textarea
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Instruct Copilot (e.g., 'Create Canada country profile')..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-[14px] text-slate-800 font-medium max-h-32 min-h-[46px] p-2.5 leading-relaxed"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommandSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={!chatMessage.trim() || isTyping}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:bg-slate-400 transition shrink-0 shadow-md mb-0.5 mr-0.5"
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
            <div className="w-full flex gap-5 mt-3 px-3 text-[10px] uppercase font-black text-slate-400 tracking-wider">
               <span className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition"><FileText className="w-3.5 h-3.5"/> Attach Schema</span>
               <span className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition">🎙️ Voice Input</span>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR - ACTIVITY LOGS */}
        <aside className={`${showAuditDrawer ? 'flex absolute inset-0 z-50 md:w-[320px] xl:w-[380px] md:static lg:flex' : 'hidden'} lg:flex w-[320px] xl:w-[380px] w-full bg-slate-50 border-l border-slate-200 flex-col flex-none shadow-[-10px_0_30px_rgba(0,0,0,0.05)] lg:shadow-inner overflow-hidden transition-all shrink-0`}>
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sidebar className="w-4 h-4 text-indigo-500" />
              <h3 className="font-extrabold text-slate-800 text-[11px] tracking-widest uppercase">Operations Audit Log</h3>
            </div>
            <button onClick={() => setShowAuditDrawer(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {auditLogs.length === 0 ? (
               <div className="text-center text-[11px] text-slate-400 mt-8 font-medium">Environment initialized.<br/>No pending operations.</div>
            ) : (
               auditLogs.map((log) => (
                  <div key={log.id} className="text-xs bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : log.time}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase ${
                        log.status === 'SUCCESS' || log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' :
                        log.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                        log.status === 'Rejected' ? 'bg-slate-100 text-slate-600' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 block text-[11px] break-words">{log.action?.toUpperCase() || 'UNKNOWN OPERATION'}</span>
                    {(log.result || log.recordId) && <span className="font-medium text-slate-500 block text-[10px] mt-1 break-all">RESULT: {log.result || log.recordId}</span>}
                    {log.error && <span className="font-medium text-rose-500 block text-[10px] mt-1 break-all">ERROR: {log.error}</span>}
                  </div>
               ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
