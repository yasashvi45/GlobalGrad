import React, { useState, useEffect } from 'react';
import { KanbanSquare, Plus, Clock, FileText, MoreHorizontal, X, LayoutDashboard, FileCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { listenToTable, saveToTable } from '@/lib/api';
import { auth } from '@/lib/firebase';

const columns = [
  { id: 'researching', title: 'Researching', color: 'bg-slate-100/50', border: 'border-slate-200' },
  { id: 'preparing', title: 'Preparing Docs', color: 'bg-indigo-50/50', border: 'border-indigo-100' },
  { id: 'applied', title: 'Applied', color: 'bg-purple-50/50', border: 'border-purple-100' },
  { id: 'interview', title: 'Interview', color: 'bg-orange-50/50', border: 'border-orange-100' },
  { id: 'accepted', title: 'Accepted', color: 'bg-emerald-50/50', border: 'border-emerald-100' },
  { id: 'rejected', title: 'Rejected', color: 'bg-rose-50/50', border: 'border-rose-100' },
];

export function Applications() {
  const [cards, setCards] = useState<any[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
    unsubscribe = listenToTable('applications', (data) => {
       setCards(data.filter((d:any) => String(d.userId) === String(uid)));
    });
    return () => unsubscribe();
  }, []);

  const handleDragStart = (e: React.DragEvent, cardId: number) => {
    e.dataTransfer.setData('cardId', cardId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId'); // could be string from firebase
    const cardToUpdate = cards.find(c => String(c.id) === cardId);
    if (!cardToUpdate) return;
    
    let status = cardToUpdate.status || 'Draft';
    if (colId === 'researching' || colId === 'preparing') status = 'Draft';
    else if (colId === 'applied') status = 'Submitted';
    else if (colId === 'interview') status = 'Interview';
    else if (colId === 'accepted') status = 'Accepted';
    else if (colId === 'rejected') status = 'Rejected';

    // optimistically update local state
    setCards(prev => prev.map(c => String(c.id) === cardId ? { ...c, col: colId, status } : c));
    
    // Update to firebase
    await saveToTable('applications', { ...cardToUpdate, col: colId, status });
  };

  const selectedData = cards.find(c => String(c.id) === String(activeCard));

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col relative w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <KanbanSquare className="w-8 h-8 text-orange-500" />
            Application Tracker
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Drag and drop to manage all your university applications in one place.</p>
        </div>
        <Button 
          className="bg-orange-500 hover:bg-orange-600 shadow-md relative z-10 font-bold"
          onClick={async () => {
             const title = prompt("Enter University Name:");
             if(!title) return;
             const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
             await saveToTable('applications', {
                userId: uid,
                title,
                subtitle: 'New Application',
                col: 'researching',
                deadline: 'TBD',
                country: '🌍',
                progress: 0,
                docsMissing: 5
             });
          }}
        >
          <Plus className="w-5 h-5 mr-2" /> Add Application
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide">
        <div className="flex gap-6 h-full min-w-max px-1">
          {columns.map(col => (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-[340px] flex flex-col rounded-[2rem] border ${col.border} ${col.color} shadow-sm bg-opacity-40 backdrop-blur-sm`}
            >
              <div className="p-6 flex items-center justify-between shrink-0 mb-2">
                <h3 className="font-bold text-slate-900 tracking-tight">{col.title}</h3>
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-600 shadow-sm border border-slate-100">
                  {cards.filter(c => c.col === col.id).length}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-hide">
                {cards.filter(c => c.col === col.id).map(card => (
                  <div 
                    key={card.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onClick={() => setActiveCard(card.id)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-2xl leading-none" title={card.country}>{card.country}</span>
                       <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                         <MoreHorizontal className="w-5 h-5" />
                       </button>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 leading-tight tracking-tight">{card.title}</h4>
                    <p className="text-sm text-slate-500 mb-5 font-medium">{card.subtitle}</p>
                    
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                      <div className={`h-full ${card.progress === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${card.progress}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <Clock className="w-3.5 h-3.5" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">{card.deadline}</span>
                      </div>
                      {card.docsMissing > 0 ? (
                        <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                          <FileText className="w-3.5 h-3.5" /> {card.docsMissing} Missing
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                           <CheckCircle2 className="w-3.5 h-3.5" /> All Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={async () => {
                     const title = prompt("Enter University Name:");
                     if(!title) return;
                     const uid = auth.currentUser?.uid || localStorage.getItem('userId') || '1';
                     await saveToTable('applications', {
                        userId: uid,
                        title,
                        subtitle: 'New Application',
                        col: col.id,
                        deadline: 'TBD',
                        country: '🌍',
                        progress: 0,
                        docsMissing: 5
                     });
                  }}
                  className="w-full py-5 border-2 border-dashed border-slate-300/60 rounded-2xl text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-white/50 transition-colors flex items-center justify-center text-sm font-bold bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Details Drawer Modal */}
      <AnimatePresence>
        {activeCard !== null && selectedData && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveCard(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 rounded-lg"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 md:p-8 flex items-start justify-between border-b border-slate-100 bg-slate-50 shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{selectedData.country}</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg uppercase tracking-wider">{columns.find(c => c.id === selectedData.col)?.title}</span>
                  </div>
                  <h2 className="text-2xl font-display font-black text-slate-900 truncate tracking-tight">{selectedData.title}</h2>
                  <p className="text-slate-500 font-medium">{selectedData.subtitle}</p>
                </div>
                <button onClick={() => setActiveCard(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="flex gap-6 px-6 md:px-8 border-b border-slate-100 shrink-0 shadow-sm relative z-10 pt-2">
                <button className="px-1 py-4 border-b-2 border-indigo-600 font-bold text-indigo-600 flex items-center gap-2 text-sm tracking-tight"><LayoutDashboard className="w-4 h-4" /> Overview</button>
                <button className="px-1 py-4 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm tracking-tight"><FileCheck className="w-4 h-4" /> Documents</button>
                <button className="px-1 py-4 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm tracking-tight"><Clock className="w-4 h-4" /> Timeline</button>
                <button className="px-1 py-4 border-b-2 border-transparent font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm tracking-tight"><MoreHorizontal className="w-4 h-4" /> Notes</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Application Deadline</p>
                     <p className="font-bold text-slate-900">{selectedData.deadline}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Application ID</p>
                     <p className="font-bold text-slate-900 font-mono">APP-2026-{selectedData.id}X</p>
                  </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Required Documents</h3>
                   <div className="space-y-3">
                     {[
                       { name: 'Passport Copy', status: 'done' },
                       { name: 'Academic Transcripts', status: 'done' },
                       { name: 'Statement of Purpose (SOP)', status: selectedData.docsMissing > 0 ? 'missing' : 'done' },
                       { name: 'Letter of Recommendation 1', status: selectedData.docsMissing > 1 ? 'missing' : 'done' },
                       { name: 'Letter of Recommendation 2', status: selectedData.docsMissing > 2 ? 'missing' : 'done' },
                       { name: 'IELTS / TOEFL Scores', status: 'done' },
                     ].map((doc, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-3">
                           {doc.status === 'done' ? (
                             <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                           ) : (
                             <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                           )}
                           <span className={`font-medium ${doc.status === 'done' ? 'text-slate-900' : 'text-slate-600'}`}>{doc.name}</span>
                         </div>
                         {doc.status === 'missing' && <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-white">Upload</Button>}
                       </div>
                     ))}
                   </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setActiveCard(null)} className="font-bold bg-white">Close</Button>
                 <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold">Save Changes</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
