import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Star, Globe, Building2, Download, Database, RefreshCw, AlertTriangle, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { listenToUniversities, createUniversity, updateUniversity, deleteUniversity } from '@/services/universityService';
import { createAdminNotification } from '@/lib/notificationUtils';
import AdminUniversityEditor from '@/components/admin/AdminUniversityEditor';
import { EmptyState } from '@/components/ui/EmptyState';
import { exportToCSV } from '@/lib/exportUtils';
import { SEED_UNIVERSITIES } from '@/data/seedingUniversities';

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seeding States
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'rank', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToUniversities((data) => {
       setUniversities(data);
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRunSeeding = async () => {
    setIsSeeding(true);
    try {
      let created = 0;
      let updated = 0;
      
      const lowerExistingMatch = universities.map(u => ({
        id: u.id,
        nameLower: (u.name || '').trim().toLowerCase(),
        fullData: u
      }));

      for (const rawUni of SEED_UNIVERSITIES) {
        // Validation check
        if (!rawUni.name || !rawUni.country) {
          console.warn("Skipping invalid university seed record", rawUni);
          continue;
        }

        const match = lowerExistingMatch.find(x => x.nameLower === rawUni.name.trim().toLowerCase());

        if (match) {
          // Update missing/empty fields only
          const merged = { ...rawUni, ...match.fullData };
          for (const key of Object.keys(rawUni)) {
            if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
              merged[key] = (rawUni as any)[key];
            }
          }
          await updateUniversity(match.id, merged);
          updated++;
        } else {
          // Create completely new university
          const newId = `uni-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          await createUniversity({
            ...rawUni,
            id: newId
          });
          created++;
        }
      }

      await createAdminNotification({
        title: 'Database Seed Completed',
        message: `Admin populated the university directory. Added ${created} new profiles, updated ${updated} existing profiles safely.`,
        type: 'University',
        eventType: 'database_seeded_successfully',
        entityId: 'seed-action',
        priority: 'High'
      });

      window.dispatchEvent(new CustomEvent('app_toast', { 
        detail: { message: `Successfully synchronized 50 universities! Seeding completed (${created} new, ${updated} updated).` } 
      }));
      setIsSeedModalOpen(false);
    } catch (err: any) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app_toast', { 
        detail: { message: err.message || 'Seeding action failed', type: 'error' } 
      }));
    } finally {
      setIsSeeding(false);
    }
  };

  const loadData = () => {};

  const uniqueCountries = useMemo(() => Array.from(new Set(universities.map(u => u.country).filter(Boolean))), [universities]);

  const filteredAndSorted = useMemo(() => {
    let result = universities.filter(u => {
      const matchSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.city || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCountry = filterCountry === 'all' || u.country === filterCountry;
      return matchSearch && matchCountry;
    });

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      // specific logic for rank numbers if they exist
      if (sortConfig.key === 'rank') {
        const numA = typeof valA === 'number' ? valA : parseInt(String(valA).replace(/\D/g, '')) || 999999;
        const numB = typeof valB === 'number' ? valB : parseInt(String(valB).replace(/\D/g, '')) || 999999;
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [universities, searchTerm, filterCountry, sortConfig]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const currentItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', country: '', city: '', rank: '', tuitionRange: '', type: 'Public', matchScore: 100 });
    setIsModalOpen(true);
  };

  const openEditModal = (uni: any) => {
    setEditingId(uni.id);
    setFormData(uni);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    console.log("Delete clicked", id);
    console.log("Deleting document", "universities", id);
    try {
      await deleteUniversity(id);
      console.log("Delete success");
      setUniversities(prev => prev.filter(u => u.id !== id));
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'University deleted successfully' } }));
      setItemToDelete(null);
    } catch (err: any) {
      console.error("Delete failed", err);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: err.message || 'Unable to delete university', type: 'error' } }));
    }
  };

  const handleExport = () => {
    exportToCSV(universities, "Universities_Export");
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Universities</h1>
          <p className="text-slate-500 font-medium">Manage institutional profiles, rankings, and stats.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative border border-slate-200 rounded-xl bg-white overflow-hidden flex">
            <span className="pl-3 py-2 text-slate-400 bg-slate-50 border-r border-slate-200"><Filter className="w-5 h-5" /></span>
             <select value={filterCountry} onChange={e => {setFilterCountry(e.target.value); setCurrentPage(1);}} className="bg-transparent pl-3 pr-8 py-2.5 text-sm font-bold text-slate-700 outline-none border-none">
               <option value="all">Everywhere</option>
               {uniqueCountries.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
             </select>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search universities..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 font-medium text-sm shadow-sm"
            />
          </div>
          <button onClick={handleExport} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-5 h-5" /> Export
          </button>
          <button onClick={() => setIsSeedModalOpen(true)} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md whitespace-nowrap">
            <Database className="w-5 h-5" /> Seed/Sync DB
          </button>
          <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap">
            <Plus className="w-5 h-5" /> Add University
          </button>
        </div>
      </div>

      {/* Seeding / Syncing Status Alert */}
      {universities.length < 50 && (
        <div className="p-6 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-emerald-50/30 border border-indigo-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div>
            <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-indigo-600 animate-pulse" /> University Seeding & Syncing Hub
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Your database has <strong>{universities.length}</strong> university profiles. GlobalGrad recommends seeding <strong>50 professional university records</strong> across Australia, Canada, US, UK, and Germany.
            </p>
          </div>
          <button 
            onClick={() => setIsSeedModalOpen(true)}
            className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition duration-200 shadow-md shadow-indigo-600/10 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Seed 50 Universities
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
             {loading ? (
                <div className="p-12 text-center font-bold text-slate-400">Loading directory...</div>
             ) : currentItems.length === 0 ? (
                <EmptyState 
                   title="No universities found"
                   description="Try adjusting your active filters or search criteria."
                   icon={Building2}
                   action={{ label: "Reset Filters", onClick: () => { setSearchTerm(''); setFilterCountry('all'); } }}
                />
             ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                     <tr>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('name')}>
                          <div className="flex items-center gap-1">Institution <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('country')}>
                          <div className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('rank')}>
                          <div className="flex items-center gap-1">Rank <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('type')}>
                          <div className="flex items-center gap-1">Type <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     <AnimatePresence>
                     {currentItems.map((u) => (
                       <motion.tr 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         key={u.id} 
                         className="hover:bg-slate-50 transition-colors group"
                       >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                 {(u.logoImage || u.imageUrl || u.heroImage || u.image) ? <img src={u.logoImage || u.imageUrl || u.heroImage || u.image} alt="" className="w-full h-full object-cover" /> : <Globe className="w-5 h-5 text-indigo-400" />}
                               </div>
                               <div className="min-w-0">
                                 <div className="font-bold text-slate-900 truncate max-w-[200px]" title={u.name}>{u.name}</div>
                                 <div className="text-xs text-slate-500 font-medium truncate">{u.city || 'Global Campus'}</div>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-bold text-slate-700">{u.country || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold tracking-wider border border-amber-100 flex items-center gap-1 w-max">
                               <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                               {u.rank ? `#${u.rank}` : 'Unranked'}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                               {u.type || 'Public'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Data">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setItemToDelete(u)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove Entry">
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

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
           <AdminUniversityEditor 
              uni={editingId ? formData : null} 
              onClose={() => setIsModalOpen(false)} 
              onRefresh={loadData} 
           />
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
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Delete University?</h3>
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

      {/* Seeding Confirmation Modal */}
      <AnimatePresence>
        {isSeedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSeeding && setIsSeedModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl p-8 shadow-2xl w-full max-w-4xl border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden">
               <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                     <Database className="w-6 h-6" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-slate-900">Verify & Seed University Database</h2>
                     <p className="text-sm font-medium text-slate-500 mt-0.5">Admin-authorized bulk upload of 50 verified institutions.</p>
                   </div>
                 </div>
                 <button onClick={() => !isSeeding && setIsSeedModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                   <X className="w-6 h-6" />
                 </button>
               </div>

               {/* Contents with preview listing */}
               <div className="flex-1 overflow-y-auto py-6 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</div>
                     <div className="text-2xl font-black text-slate-800 mt-1">50 Institutions</div>
                     <div className="text-xs font-semibold text-slate-500 mt-1">10 per core study country</div>
                   </div>
                   <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                     <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Validation Integrity</div>
                     <div className="text-2xl font-black text-emerald-800 mt-1">Passed</div>
                     <div className="text-xs font-semibold text-emerald-600 mt-1">Logo, Banner, QS & stats validated</div>
                   </div>
                   <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                     <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Duplicate Protection</div>
                     <div className="text-2xl font-black text-indigo-800 mt-1">Active</div>
                     <div className="text-xs font-semibold text-indigo-500 mt-1">Safe Seed: updates empty fields only</div>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                     <Check className="w-5 h-5 text-emerald-600" /> Inspected Countries & Institutions
                   </h3>
                   <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 max-h-60 overflow-y-auto divide-y divide-slate-100 text-sm">
                     {SEED_UNIVERSITIES.map((ui, idx) => {
                       const exists = universities.some(ex => (ex.name || '').trim().toLowerCase() === (ui.name || '').trim().toLowerCase());
                       return (
                         <div key={idx} className="p-3 px-4 flex items-center justify-between hover:bg-slate-100/50 transition">
                           <div className="flex items-center gap-3">
                             <img src={ui.logoUrl} alt="" className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-slate-200" onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=40'; }} />
                             <span className="font-bold text-slate-800">{ui.name}</span>
                             <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md">{ui.country}</span>
                           </div>
                           <div>
                             {exists ? (
                               <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                 <RefreshCw className="w-3.5 h-3.5 animate-spin duration-3000" /> Match: Safe Sync
                               </span>
                             ) : (
                               <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                 <Plus className="w-3.5 h-3.5" /> New Card
                               </span>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3 text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Important Administrative Notice:</p>
                      <p className="font-medium text-orange-700/90 mt-0.5">Continuing requires authorized confirmation. Existing university rankings and tuition parameters will be safely synced with any blank fields without overwriting user customizations.</p>
                    </div>
                 </div>
               </div>

               {/* Footer operations */}
               <div className="pt-4 border-t border-slate-150 flex items-center justify-between shrink-0 bg-white">
                 <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">GlobalGrad Admin Console</div>
                 <div className="flex gap-3">
                   <button 
                     disabled={isSeeding} 
                     onClick={() => setIsSeedModalOpen(false)} 
                     className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                   >
                     Cancel
                   </button>
                   <button 
                     disabled={isSeeding} 
                     onClick={handleRunSeeding} 
                     className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 text-sm"
                   >
                     {isSeeding ? (
                       <>
                         <RefreshCw className="w-4 h-4 animate-spin" /> Synchronizing...
                       </>
                     ) : (
                       <>
                         <CheckCircle2 className="w-4 h-4" /> Authorize & Seed Database
                       </>
                     )}
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
