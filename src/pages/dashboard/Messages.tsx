import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Paperclip, File, Trash2, MoreVertical, CheckCheck, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createOrGetChat, listenToMessages, sendMessage, markMessagesRead, uploadChatFile, softDeleteMessage, hideChatForStudent, deleteMessageForMe } from '@/services/chatService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function Messages() {
  const { user } = useAuth();
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    
    let unsubscribeMessages: any;

    async function initChat() {
       const chatDoc = await createOrGetChat(user!.uid, 'admin');
       setChat(chatDoc);
       
       unsubscribeMessages = listenToMessages(chatDoc.id, (msgs) => {
          setMessages(msgs);
       });
       
       await markMessagesRead(chatDoc.id, 'student');
    }
    
    initChat();
    
    return () => {
        if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [user]);

  useEffect(() => {
    if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!inputText.trim() || !chat || !user?.uid) return;
     
     const text = inputText.trim();
     setInputText('');
     await sendMessage(chat.id, user.uid, text, 'admin');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files || !e.target.files.length || !chat) return;
     const file = e.target.files[0];
     
     const isImage = file.type.startsWith('image/');
     const isVideo = file.type.startsWith('video/');
     const attachmentType = isImage ? 'image' : (isVideo ? 'video' : 'document');
     
     setUploading(true);
     try {
        const url = await uploadChatFile(file, 'attachments');
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        await sendMessage(chat.id, user!.uid, `Shared a file: ${file.name}`, 'admin', url, attachmentType, file.name, sizeMb);
     } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload file");
     } finally {
        setUploading(false);
     }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 shadow-sm z-10 relative">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#5B4DFF] text-white flex items-center justify-center shrink-0 shadow-sm">
               <MessageSquare className="w-5 h-5" />
            </div>
            <div>
               <h1 className="text-[16px] font-bold text-gray-900 tracking-tight leading-snug">GlobalGrad Support</h1>
               <p className="text-xs font-medium text-gray-500 flex items-center gap-1 leading-none mt-0.5">
                  Usually replies in a few minutes
               </p>
            </div>
         </div>
         
         <div className="relative group/usermenu">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
               <MoreVertical className="w-5 h-5" />
            </button>
            
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden invisible group-hover/usermenu:visible opacity-0 group-hover/usermenu:opacity-100 transition-all z-50 origin-top-right">
               <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                     Mute Notifications
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                     Export Chat
                  </button>
                  <button onClick={async () => {
                     if(window.confirm('Clear this conversation history? This cannot be undone.')) {
                        await hideChatForStudent(chat.id);
                        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Chat cleared' } }));
                     }
                  }} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                     Clear Chat
                  </button>
               </div>
            </div>
         </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-16 py-6 space-y-4 bg-white">
         <div className="text-center py-2 mb-4">
            <span className="bg-gray-50 border border-gray-200 shadow-sm text-gray-500 text-[11.5px] font-medium px-4 py-1.5 rounded-full">
               Messages and calls are end-to-end encrypted. No one outside of this chat, not even GlobalGrad, can read or listen to them.
            </span>
         </div>

         {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-10">
               <div className="w-20 h-20 bg-gray-50 border border-gray-100 text-[#5B4DFF] rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <MessageSquare className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">How can we help?</h3>
               <p className="text-gray-500 text-sm font-medium max-w-sm leading-relaxed">Send us a message and one of our advisors will get back to you shortly.</p>
            </div>
         )}

         {messages.filter(msg => {
             if(chat?.hiddenByStudentAt && msg.timestamp) {
                 return msg.timestamp.toMillis() > chat.hiddenByStudentAt.toMillis();
             }
             if (msg.deletedFor?.includes(user?.uid)) {
                 return false;
             }
             return true;
         }).map((msg) => {
            const isOwn = msg.senderId === user?.uid;
            
            return (
               <div key={msg.id} className={`flex max-w-[85%] relative group hover:-translate-y-0.5 transition-transform ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                  
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-full drop-shadow-sm`}>
                     {msg.deleted ? (
                         <div className={`p-3 px-4 rounded-2xl bg-white border border-gray-200 text-gray-400 italic text-sm flex items-center gap-2 max-w-fit ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                            <Trash2 className="w-4 h-4" /> This message was deleted.
                         </div>
                     ) : (
                        <div className={`p-3 pl-4 pr-4 rounded-2xl relative flex flex-col ${isOwn ? 'bg-[#F3F4F6] text-[#111827] rounded-tr-sm' : 'bg-[#111827] text-white rounded-tl-sm'}`}>
                           {msg.attachmentUrl ? (
                              <div className="mb-2">
                                 {msg.attachmentType === 'image' ? (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                                       <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[200px] md:max-w-[280px] rounded-xl border border-black/5" />
                                    </a>
                                 ) : (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 rounded-xl max-w-[280px] transition-colors mt-1 ${isOwn ? 'bg-white hover:bg-gray-50' : 'bg-white/10 hover:bg-white/20'}`}>
                                       <div className={`p-2 rounded-full shrink-0 ${isOwn ? 'bg-[#5B4DFF] text-white' : 'bg-white/20 text-white'}`}><File className="w-5 h-5" /></div>
                                       <div className="overflow-hidden">
                                          <p className={`text-sm font-medium truncate ${isOwn ? 'text-gray-900' : 'text-white'}`}>{msg.fileName}</p>
                                          <p className={`text-xs ${isOwn ? 'text-gray-500' : 'text-white/70'}`}>{msg.fileSize} • Document</p>
                                        </div>
                                    </a>
                                 )}
                              </div>
                           ) : null}
                           
                           {!msg.attachmentUrl || msg.text !== `Shared a file: ${msg.fileName}` ? (
                               <p className="text-[15px] leading-relaxed pr-14 min-w-[120px] whitespace-pre-wrap">{msg.text}</p>
                           ) : null}

                           <div className={`absolute bottom-2 right-3 flex items-center gap-1`}>
                              <span className={`text-[10px] font-medium ${isOwn ? 'text-gray-500' : 'text-white/60'}`}>
                                 {msg.timestamp ? dayjs(msg.timestamp.toDate()).format('HH:mm') : '...'}
                              </span>
                              {isOwn && msg.timestamp && (
                                 <span className="text-[12px] flex items-center" title={msg.read ? "Read" : "Delivered"}>
                                    {msg.read ? <CheckCheck className="w-3.5 h-3.5 text-[#5B4DFF]" /> : <Check className="w-3.5 h-3.5 text-gray-400" />}
                                 </span>
                              )}
                           </div>
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
                                    <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Reply</button>
                                    <button onClick={() => navigator.clipboard.writeText(msg.text)} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Copy</button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    {isOwn ? (
                                      <>
                                        <button onClick={() => {
                                           if(window.confirm('Delete message for everyone?')) softDeleteMessage(msg.id);
                                        }} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete for Everyone</button>
                                        <button onClick={() => {
                                           if (user?.uid) deleteMessageForMe(msg.id, user.uid);
                                        }} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Delete for Me</button>
                                      </>
                                    ) : (
                                        <button onClick={() => {
                                           if (user?.uid) deleteMessageForMe(msg.id, user.uid);
                                        }} className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Delete for Me</button>
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
      
      {/* Input */}
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
    </div>
  );
}
