import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, BookOpen, Save, X, ChevronLeft, ChevronRight, ArrowUpDown, Banknote, Download, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { listenToScholarships, createScholarship, updateScholarship, deleteScholarship, syncRealScholarships } from '@/services/scholarshipService';
import { EmptyState } from '@/components/ui/EmptyState';
import { exportToCSV } from '@/lib/exportUtils';

export default function AdminScholarships() {
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunding, setFilterFunding] = useState('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'name', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncConfirm = async () => {
    setIsSyncing(true);
    try {
      const res = await syncRealScholarships();
      window.dispatchEvent(new CustomEvent('app_toast', { 
        detail: { 
          message: `Database sync successful! Created ${res.createdCount} new scholarships and updated ${res.updatedCount} existing entries.`,
          type: 'success'
        } 
      }));
      setIsSyncModalOpen(false);
    } catch (err: any) {
      console.error("Sync failed", err);
      window.dispatchEvent(new CustomEvent('app_toast', { 
        detail: { 
          message: err.message || 'Unable to sync database', 
          type: 'error' 
        } 
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToScholarships((data) => {
       setScholarships(data);
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadData = () => {};

  const filteredAndSorted = useMemo(() => {
    let result = scholarships.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.universityName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchFunding = true;
      if (filterFunding === 'full' && !(s.amount || s.coverage || '').toLowerCase().includes('full')) matchFunding = false;
      if (filterFunding === 'partial' && (s.amount || s.coverage || '').toLowerCase().includes('full')) matchFunding = false;

      return matchSearch && matchFunding;
    });

    result.sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [scholarships, searchTerm, filterFunding, sortConfig]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const currentItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', universityName: '', amount: '', coverage: '', deadline: '', degreeLevels: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      degreeLevelsText: (item.degreeLevels || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    console.log("Delete clicked", id);
    console.log("Deleting document", "scholarships", id);
    try {
      await deleteScholarship(id);
      console.log("Delete success");
      setScholarships(prev => prev.filter(s => s.id !== id));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Scholarship deleted successfully' } }));
      setItemToDelete(null);
    } catch (err: any) {
      console.error("Delete failed", err);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: err.message || 'Unable to delete scholarship', type: 'error' } }));
    }
  };

  const handleExport = () => {
    exportToCSV(scholarships, "Scholarships_Export");
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Scholarships</h1>
          <p className="text-slate-500 font-medium">Create and manage funding opportunities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative border border-slate-200 rounded-xl bg-white overflow-hidden flex">
            <span className="pl-3 py-2 text-slate-400 bg-slate-50 border-r border-slate-200"><Filter className="w-5 h-5" /></span>
             <select value={filterFunding} onChange={e => {setFilterFunding(e.target.value); setCurrentPage(1);}} className="bg-transparent pl-3 pr-8 py-2.5 text-sm font-bold text-slate-700 outline-none border-none">
               <option value="all">All Funding</option>
               <option value="full">Full Ride / Full Tuition</option>
               <option value="partial">Partial / Specific Amount</option>
             </select>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search title, university..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 font-medium text-sm shadow-sm"
            />
          </div>
          <button onClick={handleExport} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-5 h-5" /> Export
          </button>
          <button onClick={() => setIsSyncModalOpen(true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20 whitespace-nowrap">
             <Database className="w-5 h-5" /> Sync Database
          </button>
          <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap">
             <Plus className="w-5 h-5 text-white" /> Add Scholarship
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
             {loading ? (
                <div className="p-12 text-center font-bold text-slate-400">Loading scholarships...</div>
             ) : currentItems.length === 0 ? (
                <EmptyState 
                   title="No scholarships found"
                   description="Try adjusting your active filters or search criteria."
                   icon={BookOpen}
                   action={{ label: "Reset Filters", onClick: () => { setSearchTerm(''); setFilterFunding('all'); } }}
                />
             ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                     <tr>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('name')}>
                          <div className="flex items-center gap-1">Opportunity <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('universityName')}>
                          <div className="flex items-center gap-1">Institution/Sponsor <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('amount')}>
                          <div className="flex items-center gap-1">Funding <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4">For Degree</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     <AnimatePresence>
                     {currentItems.map((s) => (
                       <motion.tr 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         key={s.id} 
                         className="hover:bg-slate-50 transition-colors group"
                       >
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner border border-emerald-100">
                                 <Banknote className="w-5 h-5" />
                               </div>
                               <div className="font-bold text-slate-900 truncate max-w-[200px]" title={s.name}>{s.name}</div>
                             </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-600 truncate max-w-[150px]" title={s.universityName}>
                             {s.universityName || '-'}
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold tracking-wider uppercase border border-emerald-200 w-max inline-block">
                               {s.amount || s.coverage || 'Funded'}
                             </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                             {(s.degreeLevels || []).join(', ') || 'Any Degree'}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => openEditModal(s)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Data">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button onClick={() => setItemToDelete(s)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove Entry">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                          </td>
                       </motion.tr>
                     ))}
                     </AnimatePresence>
                  </tbody>
                </table>
             )}
          </div>
          {!loading && filteredAndSorted.length > 0 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm font-medium text-slate-500 bg-slate-50">
              <div>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} entries</div>
              <div className="flex gap-1">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                   <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>
                     {page}
                   </button>
                 ))}
                 <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                   <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
            </div>
          )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit Scholarship' : 'New Scholarship Opportunity'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <form id="scholar-form" onSubmit={(e) => {
                     e.preventDefault();
                     const finalData = { ...formData, degreeLevels: (formData.degreeLevelsText || '').split(',').map((s:string) => s.trim()).filter(Boolean) };
                     delete finalData.degreeLevelsText;
                     if (!finalData.name || !finalData.universityName || !finalData.amount) {
                         window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Please fill in Name, Institution, and Amount', type: 'error' } }));
                         return;
                     }
                     const id = finalData.id;
                     let promise;
                     if (id) {
                       promise = updateScholarship(id, finalData);
                     } else {
                       promise = createScholarship(finalData);
                     }
                     promise.then(() => {
                        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Saved successfully` } }));
                        setIsModalOpen(false);
                        loadData();
                     });
                  }} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Scholarship Title <span className="text-rose-500">*</span></label>
                        <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. Global Excellence Award" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Institution or Sponsor</label>
                        <input type="text" value={formData.universityName || ''} onChange={e => setFormData({...formData, universityName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. Stanford University or UK Govt" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                         <input type="text" value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. United Kingdom" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Funding Type</label>
                        <select value={formData.fundingType || 'Merit-Based'} onChange={e => setFormData({...formData, fundingType: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700">
                          <option value="Merit-Based">Merit-Based</option>
                          <option value="Need-Based">Need-Based</option>
                          <option value="Government">Government</option>
                          <option value="Private">Private</option>
                          <option value="University">University Specific</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Amount / Coverage</label>
                        <input type="text" value={formData.amount || formData.coverage || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. $10,000 or Full Tuition" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Deadline Date</label>
                        <input type="date" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Eligibility Criteria</label>
                        <textarea rows={3} value={formData.eligibility || ''} onChange={e => setFormData({...formData, eligibility: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none" placeholder="Explain the eligibility requirements..."></textarea>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Degree Levels (Comma separated)</label>
                        <input type="text" value={formData.degreeLevelsText !== undefined ? formData.degreeLevelsText : (formData.degreeLevels || []).join(', ')} onChange={e => setFormData({...formData, degreeLevelsText: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. Bachelors, Masters, PhD" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 justify-end items-center">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Discard</button>
                  <button type="submit" form="scholar-form" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20">
                    <Save className="w-4 h-4" /> Publish Scholarship
                  </button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setItemToDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-slate-200">
               <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                     <Trash2 className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Scholarship?</h3>
                  <p className="text-sm text-slate-500 mb-6">This action cannot be undone. <b>{itemToDelete.name}</b> will be permanently removed.</p>
                  <div className="flex w-full gap-3">
                     <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
                     <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-rose-600/20">Delete</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync/Seed Database Confirmation Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSyncing && setIsSyncModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl p-6 shadow-xl w-full max-w-md border border-slate-200">
               <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                     <Database className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Sync Real Scholarships?</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    This action will retrieve 20 real-world international scholarships, populate all fields with no empty values, check for duplicate titles in Firestore, and update missing fields on existing matches.
                  </p>
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl font-semibold border border-amber-200 mb-6 w-full text-left">
                    Note: This database operation requires administrative approval as high-volume writes will update metrics across the dashboard.
                  </p>
                  <div className="flex w-full gap-3">
                     <button disabled={isSyncing} onClick={() => setIsSyncModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors disabled:opacity-50">Cancel</button>
                     <button disabled={isSyncing} onClick={handleSyncConfirm} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1">
                        {isSyncing ? 'Syncing...' : 'Approve & Sync'}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
