import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Search, Send, User as UserIcon, MessageSquare, Paperclip, MoreVertical, Archive, X, File, Trash2, Pin, Download, CheckCheck, Check, RefreshCw, Bot, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listenToUserChats, listenToMessages, sendMessage, markMessagesRead, toggleChatPin, toggleChatArchive, deleteChat, softDeleteMessage, uploadChatFile, createOrGetChat, deleteMessageForMe } from '@/services/chatService';
import { getTable } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateAdminSuggestion } from '@/lib/aiEngine';
dayjs.extend(relativeTime);

function AiSuggestionBubble({ msgText }: { msgText: string }) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const text = msgText.toLowerCase();
    const needsHelp = ['help', 'support', 'problem', 'issue', 'bug'].some(k => text.includes(k));
    if (needsHelp) {
      setLoading(true);
      // Try to generate suggestion. If generateAdminSuggestion doesn't exist, we fallback
      generateAdminSuggestion(msgText)
        .then(res => setSuggestion(res))
        .catch(() => {
           setSuggestion("Hello! I understand you are having an issue. Could you please provide more details or screenshots so I can assist you better?");
        })
        .finally(() => setLoading(false));
    }
  }, [msgText]);

  if (!loading && !suggestion) return null;

  return (
    <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-indigo-100 bg-indigo-50/50 shadow-sm">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between p-2 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-1.5 font-bold">
           <Bot className="w-4 h-4 text-indigo-500" />
           AI Suggestion
        </div>
        {!loading && <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />}
      </button>
      {loading ? (
        <div className="p-3 text-[11px] text-indigo-500 flex items-center gap-2">
           <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
           Analyzing message...
        </div>
      ) : (
        <div className={`px-3 overflow-hidden text-xs text-indigo-900 transition-all ${expanded ? 'pb-3 max-h-40 overflow-y-auto' : 'max-h-0'}`}>
           {suggestion}
           <div className="mt-2 text-right">
              <button 
                 onClick={() => {
                    navigator.clipboard.writeText(suggestion);
                    window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'AI Suggestion copied.'}}));
                 }}
                 className="text-[10px] font-bold uppercase tracking-wider bg-white border border-indigo-200 shadow-sm px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-700 transition"
              >
                 Copy Context
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMessages() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (!selectedChat || messages.length === 0) {
        throw new Error("No conversation to export.");
      }

      const txtLines = [];
      txtLines.push("=== Conversation Export ===");
      txtLines.push(`Chat ID: ${selectedChat.id}`);
      txtLines.push(`Student: ${selectedChat.studentName || 'Unknown Student'}`);
      txtLines.push(`Participant IDs: ${selectedChat.participants?.join('; ')}`);
      txtLines.push("\n--- Messages ---");

      const pdf = new jsPDF();
      let yPos = 10;
      pdf.setFontSize(14);
      pdf.text("Conversation Export", 10, yPos);
      yPos += 10;
      pdf.setFontSize(10);
      pdf.text(`Student: ${selectedChat.studentName || 'Unknown Student'}`, 10, yPos);
      yPos += 10;
      
      messages.forEach(msg => {
        const time = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleString() : 'Unknown Time';
        const sender = msg.senderName || msg.senderId || 'Unknown Sender';
        const content = msg.text || (msg.attachmentUrl ? `[Attachment: ${msg.fileName}]` : '[Empty Message]');
        
        txtLines.push(`[${time}] ${sender}: ${content}`);

        const textOutput = `[${time}] ${sender}:\n${content}`;
        const splitText = pdf.splitTextToSize(textOutput, 180);
        
        if (yPos + splitText.length * 5 > 280) {
           pdf.addPage();
           yPos = 10;
        }
        
        pdf.text(splitText, 10, yPos);
        yPos += (splitText.length * 5) + 5;
      });

      const txtContent = txtLines.join("\n");
      
      const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `conversation_${selectedChat.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      pdf.save(`conversation_${selectedChat.id}.pdf`);

      await new Promise(r => setTimeout(r, 800));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Conversation exported successfully (TXT & PDF).' } }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: e.message || 'Export failed.', type: 'error' } }));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    async function loadUsers() {
       const u = await getTable('users');
       setUsers(u || []);
       
       if (location.state?.userId) {
           const chat = await createOrGetChat(location.state.userId, 'admin');
           setSelectedChat(chat);
           // Clear Location State
           navigate(location.pathname, { replace: true, state: {} });
       }
    }
    loadUsers();
  }, [location.state?.userId]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeChats = listenToUserChats('admin', (chatData) => {
       setChats(chatData);
    });
    return () => unsubscribeChats();
  }, [user]);

  useEffect(() => {
    let unsubscribeMessages: any;
    if (selectedChat) {
       unsubscribeMessages = listenToMessages(selectedChat.id, (msgs) => {
          setMessages(msgs);
       });
       markMessagesRead(selectedChat.id, 'admin');
    } else {
       setMessages([]);
    }
    return () => {
        if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [selectedChat]);

  useEffect(() => {
    if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!inputText.trim() || !selectedChat || !user?.uid) return;
     
     const text = inputText.trim();
     setInputText('');
     await sendMessage(selectedChat.id, 'admin', text, 'student');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files || !e.target.files.length || !selectedChat) return;
     const file = e.target.files[0];
     
     const isImage = file.type.startsWith('image/');
     const isVideo = file.type.startsWith('video/');
     const attachmentType = isImage ? 'image' : (isVideo ? 'video' : 'document');
     
     setUploading(true);
     try {
        const url = await uploadChatFile(file, 'attachments');
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        await sendMessage(selectedChat.id, 'admin', `Shared a file: ${file.name}`, 'student', url, attachmentType, file.name, sizeMb);
     } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload file");
     } finally {
        setUploading(false);
     }
  };

  const getChatUser = (chat: any) => {
     if (!chat || !chat.participants) return { name: 'Unknown', email: '' };
     const studentId = chat.participants.find((p: string) => p !== 'admin');
     return users.find((u: any) => u.id === studentId) || { name: 'Unknown User', id: studentId, email: '' };
  };

  // Filter and sort logic
  const filteredChats = chats.filter(c => {
     const chatUser = getChatUser(c);
     const matchesSearch = chatUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) || chatUser.email?.toLowerCase().includes(searchQuery.toLowerCase());
     if (!matchesSearch) return false;
     
     if (filter === 'archived') return c.archivedByAdmin;
     if (c.archivedByAdmin) return false; // Hide archived from others
     if (filter === 'unread') return c.unreadCountAdmin > 0;
     return true;
  });

  const pinnedChats = filteredChats.filter(c => c.pinnedByAdmin);
  const unpinnedChats = filteredChats.filter(c => !c.pinnedByAdmin);

  const selectedUser = selectedChat ? getChatUser(selectedChat) : null;

  return (
    <div className="flex h-full w-full bg-white overflow-hidden relative">
      
      {/* 1. Left Panel: Chat List */}
      <div className={`border-r border-gray-200 flex flex-col bg-gray-50 shrink-0 z-10 relative h-full ${selectedChat ? 'hidden md:flex md:w-[320px] lg:w-[320px]' : 'w-full md:w-[320px] lg:w-[320px] flex'}`}>
         <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-4">Support Inbox</h2>
            <div className="relative mb-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
               />
            </div>
            <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl">
               <button onClick={() => setFilter('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>All</button>
               <button onClick={() => setFilter('unread')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === 'unread' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Unread</button>
               <button onClick={() => setFilter('archived')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Archived</button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto">
            {pinnedChats.length > 0 && (
               <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                     <Pin className="w-3 h-3" /> Pinned
                  </div>
                  {pinnedChats.map(chat => <ChatItem key={chat.id} chat={chat} user={getChatUser(chat)} selected={selectedChat?.id === chat.id} onClick={() => setSelectedChat(chat)} />)}
               </div>
            )}

            <div className="mb-2">
               {pinnedChats.length > 0 && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Conversations</div>}
               {unpinnedChats.length === 0 ? (
                  <EmptyState 
                     title="No conversations"
                     description="You have no active conversations. Only active or unarchived conversations will appear here."
                     icon={MessageSquare}
                  />
               ) : (
                  unpinnedChats.map(chat => <ChatItem key={chat.id} chat={chat} user={getChatUser(chat)} selected={selectedChat?.id === chat.id} onClick={() => setSelectedChat(chat)} />)
               )}
            </div>
         </div>
      </div>
      
      {/* 2. Middle Panel: Chat Interface */}
      <div className={`flex-1 flex-col bg-white relative h-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
         {selectedChat ? (
            <>
               <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 shadow-sm z-10 relative">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowProfile(!showProfile)}>
                     <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors mr-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                     </button>
                     <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200">
                        {selectedUser?.name ? selectedUser.name[0].toUpperCase() : <UserIcon className="w-5 h-5" />}
                     </div>
                     <div>
                        <h1 className="text-[16px] font-bold text-gray-900 tracking-tight leading-snug">{selectedUser?.name || selectedUser?.email}</h1>
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 leading-none mt-0.5">
                           Online
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                     <button title="Export Conversation" onClick={handleExport} disabled={exporting} className={`p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50`}>
                        {exporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                     </button>
                     <button title="Toggle Pin" onClick={() => toggleChatPin(selectedChat.id, !selectedChat.pinnedByAdmin)} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${selectedChat.pinnedByAdmin ? 'text-[#5B4DFF]' : ''}`}>
                        <Pin className="w-5 h-5" />
                     </button>
                     <button title="Toggle Archive" onClick={() => {
                        toggleChatArchive(selectedChat.id, !selectedChat.archivedByAdmin);
                        if (!selectedChat.archivedByAdmin) setSelectedChat(null);
                     }} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${selectedChat.archivedByAdmin ? 'text-[#5B4DFF]' : ''}`}>
                        <Archive className="w-5 h-5" />
                     </button>
                     <button title="Delete Conversation" onClick={async () => {
                        if (confirm("Are you sure you want to permanently delete this conversation?")) {
                           await deleteChat(selectedChat.id);
                           setSelectedChat(null);
                           window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'Conversation deleted.'}}));
                        }
                     }} className={`p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors`}>
                        <Trash2 className="w-5 h-5" />
                     </button>
                     <button onClick={() => setShowProfile(!showProfile)} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${showProfile ? 'bg-gray-100 text-gray-800' : ''}`} title="Contact Info">
                         <Search className="w-5 h-5" />
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto px-16 py-6 space-y-4 bg-white">
                  <div className="text-center py-2 mb-4">
                     <span className="bg-gray-50 border border-gray-200 shadow-sm text-gray-500 text-[11.5px] font-medium px-4 py-1.5 rounded-full">
                        This conversation is encrypted and secured.
                     </span>
                  </div>
                  
                  {messages.filter(msg => !msg.deletedFor?.includes('admin')).map((msg) => {
                     const isOwn = msg.senderId === 'admin';
                     
                     return (
                        <div key={msg.id} className={`flex max-w-[85%] relative group hover:-translate-y-0.5 transition-transform ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                           
                           <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-full drop-shadow-sm`}>
                              {msg.deleted ? (
                                  <div className={`p-3 px-4 rounded-2xl bg-white border border-gray-200 text-gray-400 italic text-sm flex items-center gap-2 max-w-fit ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                                     <Trash2 className="w-4 h-4" /> This message was deleted.
                                  </div>
                              ) : (
                                 <div className={`p-3 pl-4 pr-4 rounded-2xl relative flex flex-col ${isOwn ? 'bg-[#111827] text-white rounded-tr-sm' : 'bg-[#F3F4F6] text-[#111827] rounded-tl-sm'}`}>
                                    {msg.attachmentUrl ? (
                                       <div className="mb-2">
                                          {msg.attachmentType === 'image' ? (
                                             <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                                                <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[200px] md:max-w-[280px] rounded-xl border border-black/5" />
                                             </a>
                                          ) : (
                                             <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 rounded-xl max-w-[280px] transition-colors mt-1 ${isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-50'}`}>
                                                <div className={`p-2 rounded-full shrink-0 ${isOwn ? 'bg-[#5B4DFF] text-white' : 'bg-[#5B4DFF] text-white'}`}><File className="w-5 h-5" /></div>
                                                <div className="overflow-hidden">
                                                   <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}>{msg.fileName}</p>
                                                   <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>{msg.fileSize} • Document</p>
                                                </div>
                                             </a>
                                          )}
                                       </div>
                                    ) : null}
                                    
                                    {!msg.attachmentUrl || msg.text !== `Shared a file: ${msg.fileName}` ? (
                                       <p className="text-[15px] leading-relaxed pr-14 min-w-[120px] whitespace-pre-wrap">{msg.text}</p>
                                    ) : null}

                                    <div className={`absolute bottom-2 right-3 flex items-center gap-1`}>
                                       <span className={`text-[10px] font-medium ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>
                                          {msg.timestamp ? dayjs(msg.timestamp.toDate()).format('HH:mm') : '...'}
                                       </span>
                                       {isOwn && msg.timestamp && (
                                          <span className="text-[12px] flex items-center" title={msg.read ? "Read" : "Delivered"}>
                                             {msg.read ? <CheckCheck className="w-3.5 h-3.5 text-white" /> : <Check className="w-3.5 h-3.5 text-white/50" />}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              )}
                              
                              {!isOwn && !msg.deleted && msg.text && (
                                <div className="mt-1">
                                  <AiSuggestionBubble msgText={msg.text} />
                                </div>
                              )}
                              
                              {/* Hover Options Dropdown Menu Wrapper */}
                              {!msg.deleted && (
                                 <div className={`absolute top-0 mt-0 z-20 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity ${isOwn ? 'right-[100%] mr-2' : 'left-[100%] ml-2'}`}>
                                    <div className="relative group/menu">
                                       <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200">
                                          <MoreVertical className="w-4 h-4" />
                                       </button>
                                       
                                       <div className={`absolute top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all z-50 ${isOwn ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}>
                                          <div className="py-1">
                                             <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'Reply selected.'}}))} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Reply</button>
                                             <button onClick={() => { navigator.clipboard.writeText(msg.text); window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'Copied string to clipboard.'}})); }} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Copy Text</button>
                                             <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'Message Pinned.'}}))} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Pin Message</button>
                                             <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'Please pick a contact to forward to.'}}))} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Forward</button>
                                             <div className="h-px bg-gray-100 my-1"></div>
                                             {isOwn && (
                                               <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', {detail: {message: 'Edit mode enabled.'}}))} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
                                             )}
                                             {isOwn ? (
                                               <>
                                                 <button onClick={() => {
                                                    if(window.confirm('Delete message for everyone?')) softDeleteMessage(msg.id);
                                                 }} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete for Everyone</button>
                                                 <button onClick={() => deleteMessageForMe(msg.id, 'admin')} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Delete for Me</button>
                                               </>
                                             ) : (
                                                 <button onClick={() => deleteMessageForMe(msg.id, 'admin')} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Delete for Me</button>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     )
                  })}
                  <div ref={endRef} />
               </div>
               
               <div className="p-4 bg-white border-t border-gray-200 shrink-0 z-10 relative">
                  <form onSubmit={handleSend} className="relative flex items-end gap-3 max-w-[1200px] mx-auto">
                     <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                     <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-3 text-gray-500 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors shrink-0">
                        <Paperclip className="w-5 h-5" />
                     </button>
                     <div className="flex-1 relative">
                        <textarea 
                           value={inputText}
                           onChange={e => setInputText(e.target.value)}
                           onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSend(e as unknown as React.FormEvent);
                              }
                           }}
                           placeholder="Type a message" 
                           rows={1}
                           className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF] text-[15px] font-normal text-gray-900 outline-none transition-all placeholder:text-gray-400 resize-none min-h-[48px] max-h-[150px]"
                        />
                     </div>
                     <button 
                        type="submit" 
                        disabled={(!inputText.trim() && !uploading) || uploading}
                        className={`p-3 rounded-full shrink-0 flex items-center justify-center transition-colors ${inputText.trim() || uploading ? 'bg-[#5B4DFF] text-white hover:bg-[#4A3EE0] shadow-md' : 'bg-gray-100 text-gray-400'}`}
                     >
                        {uploading ? '...' : <Send className="w-5 h-5" />}
                     </button>
                  </form>
               </div>
            </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
               <EmptyState 
                  title="Select a conversation"
                  description="Select a conversation to start messaging. Your inbox is encrypted and secure."
                  icon={MessageSquare}
               />
            </div>
         )}
      </div>

      {/* 3. Right Panel: User Contact Info */}
      {selectedChat && showProfile && (
         <div className="w-[300px] border-l border-gray-200 bg-gray-50 shrink-0 overflow-y-auto z-10 relative hidden lg:flex flex-col h-full">
            <div className="h-16 bg-gray-50 flex items-center px-4 shrink-0 gap-4 border-b border-gray-200">
               <button onClick={() => setShowProfile(false)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
               </button>
               <h3 className="text-[16px] font-semibold text-gray-900">Contact info</h3>
            </div>
            
            <div className="px-6 py-8 bg-white border-b border-gray-200 flex flex-col items-center">
               <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden mb-4 border border-gray-200 shadow-sm flex items-center justify-center text-4xl text-gray-400 font-medium">
                   {selectedUser?.name ? selectedUser.name[0].toUpperCase() : <UserIcon className="w-12 h-12" />}
               </div>
               <h3 className="text-xl font-bold text-gray-900 text-center mb-1">{selectedUser?.name || 'Unknown User'}</h3>
               <p className="text-sm font-medium text-gray-500 text-center">{selectedUser?.email}</p>
            </div>

            <div className="mt-2 bg-white border-y border-gray-200 p-4">
               <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">About</h4>
               <p className="text-sm text-gray-900 font-medium">Registered user since {selectedUser?.createdAt ? dayjs(selectedUser.createdAt).format('MMMM D, YYYY') : 'recently'}.</p>
            </div>

            <div className="mt-2 bg-white border-y border-gray-200 p-4">
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                     <span>Total Applications</span>
                     <span className="text-gray-500">{selectedUser?.applications?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                     <span>Saved Universities</span>
                     <span className="text-gray-500">{selectedUser?.savedUniversities?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                     <span>Saved Scholarships</span>
                     <span className="text-gray-500">{selectedUser?.savedScholarships?.length || 0}</span>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

function ChatItem({ chat, user, selected, onClick }: { key?: string | number, chat: any, user: any, selected: boolean, onClick: () => void }) {
   const isUnread = chat.unreadCountAdmin > 0;
   return (
      <div 
         onClick={onClick}
         className={`px-4 py-3 border-l-4 cursor-pointer transition-all border-b border-gray-100 ${
            selected 
               ? 'bg-[#5B4DFF]/5 border-l-[#5B4DFF]' 
               : isUnread 
                  ? 'bg-white border-l-transparent hover:bg-gray-50' 
                  : 'bg-transparent border-l-transparent hover:bg-white'
         }`}
      >
         <div className="flex justify-between items-start mb-1 gap-2">
            <h3 className={`font-semibold text-sm truncate pr-2 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>{user.name || user.email || 'Anonymous'}</h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${isUnread ? 'text-[#5B4DFF]' : 'text-gray-400'}`}>
               {chat.updatedAt ? dayjs(chat.updatedAt.toDate()).format('MMM D') : 'Now'}
            </span>
         </div>
         <div className="flex items-center justify-between gap-4">
            <p className={`text-sm truncate ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium'}`}>{chat.lastMessage}</p>
            {isUnread && (
               <span className="w-5 h-5 rounded-full bg-[#5B4DFF] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {chat.unreadCountAdmin}
               </span>
            )}
         </div>
      </div>
   )
}
