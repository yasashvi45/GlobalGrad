import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, X, ArrowUpDown, FileText, Download, LayoutGrid, List as ListIcon, Calendar, MessageSquare, Briefcase, Clock, RefreshCw, Settings, History, SaveAll } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveToTable, deleteFromTable, listenToTable } from '@/lib/api';
import { createAdminNotification } from '@/lib/notificationUtils';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const ALL_STATUSES = [
  'Draft', 'Documents Pending', 'Under Review', 
  'Applied', 'Offer Received', 'Accepted', 'Visa Processing', 
  'Completed', 'Rejected'
];

import { EmptyState } from '@/components/ui/EmptyState';
import { downloadCSV } from '@/lib/exportUtils';

export default function AdminApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Views
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCounselor, setFilterCounselor] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterIntake, setFilterIntake] = useState('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'createdAt', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  // Modals
  const [viewingApp, setViewingApp] = useState<any>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  const [exporting, setExporting] = useState(false);

  const handleExport = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setExporting(true);
    try {
      if (filteredAndSorted.length === 0) {
        throw new Error("No applications to export.");
      }
      
      const headers = ['ID', 'Student Name', 'Email', 'University', 'Country', 'Program', 'Term', 'Type', 'Status', 'Counselor', 'Submitted at'];
      const csvContent = [
        headers.join(','),
        ...filteredAndSorted.map(app => [
          app.id,
          `"${app.userName || ''}"`,
          `"${app.userEmail || ''}"`,
          `"${app.university || ''}"`,
          `"${app.country || ''}"`,
          `"${app.program || ''}"`,
          `"${app.term || ''}"`,
          `"${app.type || ''}"`,
          `"${app.status || ''}"`,
          `"${app.counselorName || ''}"`,
          `"${app.createdAt || ''}"`
        ].join(','))
      ].join('\n');

      downloadCSV('applications_export.csv', csvContent);

      await new Promise(r => setTimeout(r, 800)); // slight UX delay
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Applications exported successfully.' } }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: e.message || 'Export failed.', type: 'error' } }));
    } finally {
      setExporting(false);
    }
  };

  const loadRealtimeData = async () => {
    setLoading(true);
    let unsubscribeApps = listenToTable('applications', (appsData) => {
      setApplications(appsData || []);
      setLoading(false);
    });
    let unsubscribeUsers = listenToTable('users', (usersData) => {
      setUsers(usersData || []);
    });
    let unsubscribeDocs = listenToTable('documents', (docsData) => {
      setDocuments(docsData || []);
    });
    let unsubscribeAuditLogs = listenToTable('audit_logs', (logsData) => {
      setAuditLogs(logsData || []);
    });
    return () => {
      unsubscribeApps();
      unsubscribeUsers();
      unsubscribeDocs();
      unsubscribeAuditLogs();
    };
  };

  useEffect(() => {
    let unsubs: any;
    loadRealtimeData().then(fn => { unsubs = fn; });
    return () => { if (unsubs) unsubs(); };
  }, []);

  const enrichedApps = useMemo(() => {
     return applications.map(a => {
        const u = users.find(user => user.id === a.userId) || {};
        return {
           ...a,
           userName: u.name || 'Unknown',
           userEmail: u.email || 'N/A',
           createdAt: a.createdAt || new Date().toISOString(),
           updatedAt: a.updatedAt || a.createdAt || new Date().toISOString(),
           status: a.status || 'Draft',
           counselor: a.counselor || 'Unassigned',
           intake: a.intake || 'Not Specified',
           country: a.country || 'Not Specified',
           id: a.id || Math.random().toString()
        };
     });
  }, [applications, users]);

  const counselors = useMemo(() => Array.from(new Set(enrichedApps.map(a => a.counselor).filter(c => c && c !== 'Unassigned'))), [enrichedApps]);
  const countries = useMemo(() => Array.from(new Set(enrichedApps.map(a => a.country).filter(c => c && c !== 'Not Specified'))), [enrichedApps]);
  const intakes = useMemo(() => Array.from(new Set(enrichedApps.map(a => a.intake).filter(i => i && i !== 'Not Specified'))), [enrichedApps]);

  const filteredAndSorted = useMemo(() => {
    let result = enrichedApps.filter(a => {
      const matchSearch = (a.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.university || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.program || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (a.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchCounselor = filterCounselor === 'all' || a.counselor === filterCounselor;
      const matchCountry = filterCountry === 'all' || a.country === filterCountry;
      const matchIntake = filterIntake === 'all' || a.intake === filterIntake;

      return matchSearch && matchStatus && matchCounselor && matchCountry && matchIntake;
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
  }, [enrichedApps, searchTerm, filterStatus, filterCounselor, filterCountry, filterIntake, sortConfig]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const currentItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleSelection = (id: string) => {
    setSelectedApps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedApps.length === currentItems.length) {
       setSelectedApps([]);
    } else {
       setSelectedApps(currentItems.map(a => a.id));
    }
  };

  const logAudit = async (action: string, entityId: string, details: string) => {
     await saveToTable('audit_logs', {
        userId: 'admin',
        role: 'Admin',
        action,
        entityId,
        details,
        createdAt: new Date().toISOString()
     });
  };

  const handleStatusChange = async (app: any, newStatus: string) => {
    try {
      const coreData = applications.find(x => x.id === app.id) || app;
      if (coreData.status === newStatus) return;
      const updatedApp = { ...coreData, status: newStatus, updatedAt: new Date().toISOString() };
      await saveToTable('applications', updatedApp);
      
      await logAudit('Status Change', app.id, `Status updated from ${coreData.status} to ${newStatus}`);

      await saveToTable('notifications', {
         userId: app.userId,
         title: `Application Status Updated`,
         body: `Your application to ${app.university} is now ${newStatus}. ${statusUpdateNote ? '\\nNote: ' + statusUpdateNote : ''}`,
         read: false,
         createdAt: new Date().toISOString()
      });

      // Notify other admins or system
      await createAdminNotification({
         title: `Application ${newStatus}`,
         message: `Application for ${app.userName || 'Student'} at ${app.university} is now ${newStatus}.`,
         type: 'Application',
         eventType: `application_status_updated_${newStatus}`,
         entityId: String(app.id),
         priority: newStatus === 'Rejected' ? 'High' : (newStatus === 'Accepted' ? 'Medium' : 'Low')
      });

      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Application moved to ${newStatus}` } }));
      setStatusUpdateNote('');
      if (viewingApp && viewingApp.id === app.id) {
         setViewingApp({ ...updatedApp, userName: app.userName, userEmail: app.userEmail }); 
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to update status', type: 'error' } }));
    }
  };

  const handleCounselorChange = async (app: any, newCounselor: string) => {
    try {
      const coreData = applications.find(x => x.id === app.id) || app;
      const updatedApp = { ...coreData, counselor: newCounselor, updatedAt: new Date().toISOString() };
      await saveToTable('applications', updatedApp);
      await logAudit('Assign Counselor', app.id, `Counselor re-assigned to ${newCounselor}`);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Counselor assigned: ${newCounselor}` } }));
      if (viewingApp && viewingApp.id === app.id) {
         setViewingApp({ ...updatedApp, userName: app.userName, userEmail: app.userEmail }); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteApplication = async (appId: string) => {
     if(window.confirm('Are you sure you want to delete this application?')) {
        await deleteFromTable('applications', appId);
        await logAudit('Delete Application', appId, `Application deleted completely`);
        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Application deleted' } }));
        if(viewingApp?.id === appId) setViewingApp(null);
     }
  };

  const handleBulkStatusChange = async () => {
    const status = window.prompt(`Enter new status for ${selectedApps.length} applications:\n\nOptions:\n${ALL_STATUSES.join(', ')}`);
    if (!status || (!ALL_STATUSES.includes(status))) {
       if (status) alert('Invalid status');
       return;
    }
    setLoading(true);
    try {
      for (const id of selectedApps) {
         const app = applications.find(a => a.id === id);
         if (app && app.status !== status) {
           await saveToTable('applications', { ...app, status, updatedAt: new Date().toISOString() });
           await logAudit('Bulk Status Change', id, `Status updated to ${status}`);
         }
      }
      setSelectedApps([]);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Updated status for selected applications.` } }));
    } catch(err) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Bulk update failed.`, type: 'error' } }));
    }
    setLoading(false);
  };

  const handleBulkAssignCounselor = async () => {
    const counselor = window.prompt(`Enter counselor name to assign to ${selectedApps.length} applications:`);
    if (!counselor) return;
    setLoading(true);
    try {
      for (const id of selectedApps) {
         const app = applications.find(a => a.id === id);
         if (app && app.counselor !== counselor) {
           await saveToTable('applications', { ...app, counselor, updatedAt: new Date().toISOString() });
           await logAudit('Bulk Assign', id, `Counselor assigned to ${counselor}`);
         }
      }
      setSelectedApps([]);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Assigned counselor.` } }));
    } catch(err) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Bulk assign failed.`, type: 'error' } }));
    }
    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if(!window.confirm(`Are you sure you want to delete ${selectedApps.length} applications?`)) return;
    setLoading(true);
    try {
      for (const id of selectedApps) {
         await deleteFromTable('applications', id);
         await logAudit('Bulk Delete', id, `Application deleted`);
      }
      setSelectedApps([]);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Deleted selected applications.` } }));
    } catch(err) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Bulk delete failed.`, type: 'error' } }));
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
        case 'Draft': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'Documents Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Under Review': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'Applied': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'Offer Received': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
        case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'Visa Processing': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
        case 'Completed': return 'bg-green-100 text-green-800 border-green-300 font-bold';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
     }
  };

  const stats = {
     total: enrichedApps.length,
     draft: enrichedApps.filter(a => a.status === 'Draft').length,
     docsPending: enrichedApps.filter(a => a.status === 'Documents Pending').length,
     underReview: enrichedApps.filter(a => a.status === 'Under Review').length,
     applied: enrichedApps.filter(a => a.status === 'Applied').length,
     offerRec: enrichedApps.filter(a => a.status === 'Offer Received').length,
     accepted: enrichedApps.filter(a => a.status === 'Accepted').length,
     rejected: enrichedApps.filter(a => a.status === 'Rejected').length,
     visaProcess: enrichedApps.filter(a => a.status === 'Visa Processing').length,
     completed: enrichedApps.filter(a => a.status === 'Completed').length,
  };

  const appDocuments = viewingApp ? documents.filter(d => d.userId === viewingApp.userId) : [];
  const appLogs = viewingApp ? auditLogs.filter(l => l.entityId === viewingApp.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track student application workflows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => loadRealtimeData()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
             <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
             {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button onClick={() => {
              if (selectedApps.length === 0) {
                 toggleAll();
              } else {
                 setSelectedApps([]);
              }
          }} className="flex items-center gap-2 px-4 py-2 bg-[#5B4DFF] text-white rounded-lg text-sm font-semibold hover:bg-[#4A3EE0] transition-colors shadow-sm shadow-[#5B4DFF]/20">
             <Settings className="w-4 h-4" /> {selectedApps.length > 0 ? 'Close Management' : 'Bulk Management'}
          </button>
        </div>
      </div>

      {/* Advanced Stats Cards */}
      <div className="flex gap-4 overflow-x-auto shrink-0 pb-2 snap-x">
          {[
            { label: 'Total', count: stats.total, color: 'text-gray-900' },
            { label: 'Draft', count: stats.draft, color: 'text-gray-600' },
            { label: 'Docs Pending', count: stats.docsPending, color: 'text-amber-600' },
            { label: 'Under Review', count: stats.underReview, color: 'text-purple-600' },
            { label: 'Applied', count: stats.applied, color: 'text-indigo-600' },
            { label: 'Offer', count: stats.offerRec, color: 'text-emerald-500' },
            { label: 'Accepted', count: stats.accepted, color: 'text-emerald-700' },
            { label: 'Rejected', count: stats.rejected, color: 'text-rose-600' },
            { label: 'Visa', count: stats.visaProcess, color: 'text-cyan-600' },
            { label: 'Completed', count: stats.completed, color: 'text-green-600' },
          ].map((stat, i) => (
             <div key={i} className="min-w-[120px] bg-white p-3 rounded-xl border border-gray-200 shadow-sm snap-start shrink-0">
               <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">{stat.label}</div>
               <div className={`text-xl font-bold ${stat.color}`}>{stat.count}</div>
             </div>
          ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Advanced Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 shrink-0 space-y-3">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search ID, Student, University..." 
                      value={searchTerm}
                      onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF] w-full sm:w-[250px] text-sm"
                    />
                  </div>
                  <select value={filterStatus} onChange={e => {setFilterStatus(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">All Statuses</option>
                    {ALL_STATUSES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <select value={filterCountry} onChange={e => {setFilterCountry(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">All Countries</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterIntake} onChange={e => {setFilterIntake(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">All Intakes</option>
                    {intakes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterCounselor} onChange={e => {setFilterCounselor(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">Counselor</option>
                    <option value="Unassigned">Unassigned</option>
                    {counselors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
               </div>
               
               <div className="flex items-center gap-2">
                  {(searchTerm || filterStatus !== 'all' || filterCounselor !== 'all' || filterCountry !== 'all' || filterIntake !== 'all') && (
                      <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterCounselor('all'); setFilterCountry('all'); setFilterIntake('all'); }} className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:flex items-center gap-1 bg-white border border-gray-200 px-3 py-2 rounded-lg">
                          <X className="w-3.5 h-3.5" /> Reset Filters
                      </button>
                  )}
                  <button onClick={() => {
                        const preset = { filterStatus, filterCountry, filterIntake, filterCounselor };
                        localStorage.setItem('appFiltersPreset', JSON.stringify(preset));
                        window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Filter preset saved locally.', type: 'success' } }));
                  }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm hidden sm:flex items-center gap-2">
                     <SaveAll className="w-4 h-4" /> Save Preset
                  </button>
                  <button onClick={() => {
                        try {
                           const preset = JSON.parse(localStorage.getItem('appFiltersPreset') || '{}');
                           if(preset.filterStatus) setFilterStatus(preset.filterStatus);
                           if(preset.filterCountry) setFilterCountry(preset.filterCountry);
                           if(preset.filterIntake) setFilterIntake(preset.filterIntake);
                           if(preset.filterCounselor) setFilterCounselor(preset.filterCounselor);
                           window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Preset applied.' } }));
                        } catch(e) {}
                  }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm hidden sm:flex items-center gap-2">
                     <History className="w-4 h-4" /> Load Preset
                  </button>
                  <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                     <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`} title="Table View">
                        <ListIcon className="w-4 h-4" />
                     </button>
                     <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`} title="Kanban View">
                        <LayoutGrid className="w-4 h-4" />
                     </button>
                  </div>
               </div>
           </div>
           
           {selectedApps.length > 0 && (
             <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                 <span className="font-semibold text-indigo-800 text-sm px-2">{selectedApps.length} selected</span>
                 <button onClick={handleBulkAssignCounselor} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">Assign Counselor</button>
                 <button onClick={handleBulkStatusChange} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">Change Status</button>
                 <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Requested documents for ${selectedApps.length} applications.` } }))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">Request Documents</button>
                 <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Sent message to ${selectedApps.length} student(s).` } }))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">Send Message</button>
                 <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50 shadow-sm transition ml-auto">Delete</button>
                 <button onClick={() => setSelectedApps([])} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition ml-2">Clear</button>
             </div>
           )}
        </div>

        {viewMode === 'table' ? (
            <>
                <div className="overflow-x-auto flex-1 bg-white relative">
                   {loading ? (
                      <div className="p-12 text-center text-sm font-medium text-gray-500">Loading applications...</div>
                   ) : currentItems.length === 0 ? (
                      <EmptyState 
                         title="No applications found"
                         description={applications.length > 0 ? "No applications match your active filters. Try adjusting your search criteria or clearing filters." : "Your platform currently has no applications to track. Once a student submits an application, it will appear here."}
                         icon={Briefcase}
                         action={applications.length > 0 ? { label: "Clear Filters", onClick: () => { setSearchTerm(''); setFilterStatus('all'); setFilterCountry('all'); setFilterIntake('all'); setFilterCounselor('all'); } } : undefined}
                      />
                   ) : (
                      <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase sticky top-0 z-10">
                           <tr>
                              <th className="px-6 py-4">
                                  <input type="checkbox" checked={selectedApps.length === currentItems.length && currentItems.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-[#5B4DFF] focus:ring-[#5B4DFF]" />
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('id')}>
                                <div className="flex items-center gap-1">App ID <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('userName')}>
                                <div className="flex items-center gap-1">Student <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('university')}>
                                <div className="flex items-center gap-1">University / Country <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('program')}>
                                <div className="flex items-center gap-1">Program / Intake <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('status')}>
                                <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('counselor')}>
                                <div className="flex items-center gap-1">Counselor <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('updatedAt')}>
                                <div className="flex items-center gap-1">Last Updated <ArrowUpDown className="w-3 h-3" /></div>
                              </th>
                              <th className="px-6 py-4 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                           {currentItems.map((a) => (
                             <tr 
                               key={a.id} 
                               className="hover:bg-gray-50 transition-colors group cursor-pointer"
                               onClick={(e) => {
                                   if((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                   setViewingApp(a);
                               }}
                             >
                                <td className="px-6 py-4">
                                   <input type="checkbox" checked={selectedApps.includes(a.id)} onChange={() => toggleSelection(a.id)} className="rounded border-gray-300 text-[#5B4DFF] focus:ring-[#5B4DFF]" />
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-gray-500 font-medium">
                                   APP-{a.id.substring(0, 6).toUpperCase()}
                                </td>
                                <td className="px-6 py-4">
                                   <div className="font-semibold text-gray-900 truncate max-w-[150px]">{a.userName}</div>
                                   <div className="text-xs text-gray-500 truncate max-w-[150px]">{a.userEmail}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="font-semibold text-gray-900 truncate max-w-[200px]" title={a.university}>{a.university || '-'}</div>
                                   <div className="text-xs text-gray-500 truncate max-w-[200px]" title={a.country}>{a.country || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="font-medium text-gray-900 truncate max-w-[200px]" title={a.program}>{a.program || '-'}</div>
                                   <div className="text-xs text-gray-500 mt-0.5">{a.intake}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1 ${getStatusColor(a.status)} rounded-md text-[11px] font-semibold tracking-wide border block w-max`}>
                                     {a.status || 'Draft'}
                                   </span>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                        {a.counselor !== 'Unassigned' ? a.counselor.charAt(0) : '?'}
                                     </div>
                                     <span className="text-gray-700 text-xs font-semibold">{a.counselor}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs text-right md:text-left">
                                   <div title={`Created: ${dayjs(a.createdAt).format('MMM D, YYYY')}`}>
                                      {dayjs(a.updatedAt).fromNow()}
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setViewingApp(a)} className="p-1.5 text-gray-400 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10 rounded-md transition-colors" title="View Details">
                                        <FileText className="w-4 h-4" /> 
                                      </button>
                                      <button onClick={() => navigate('/admin/messages', { state: { userId: String(a.userId) } })} className="p-1.5 text-gray-400 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10 rounded-md transition-colors" title="Message Student">
                                        <MessageSquare className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => deleteApplication(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                   )}
                </div>
                {!loading && filteredAndSorted.length > 0 && (
                  <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-sm font-medium text-gray-500 bg-white shrink-0 gap-4">
                    <div>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length}</div>
                    <div className="flex gap-1 inline-flex rounded-lg shadow-sm">
                       <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-l-lg disabled:opacity-50">
                         Previous
                       </button>
                       <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 rounded-r-lg disabled:opacity-50 -ml-px">
                         Next
                       </button>
                    </div>
                  </div>
                )}
            </>
        ) : (
            <div className="flex-1 overflow-x-auto p-6 bg-gray-50/50 flex gap-4 items-start min-h-[500px]">
               {ALL_STATUSES.map((colStatus) => {
                  const colApps = filteredAndSorted.filter(a => a.status === colStatus);
                  if (['Draft', 'Rejected', 'Completed'].includes(colStatus) && colApps.length === 0) return null; // Hide empty terminal states in kanban
                  return (
                     <div key={colStatus} className="bg-gray-100 flex-shrink-0 w-80 rounded-xl flex flex-col max-h-[calc(100vh-250px)] border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-200 shrink-0 flex items-center justify-between sticky top-0 bg-gray-100 rounded-t-xl z-10">
                           <h3 className="font-semibold text-gray-900">{colStatus}</h3>
                           <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-gray-200">{colApps.length}</span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-1 space-y-3">
                           {colApps.map(a => (
                              <div key={a.id} onClick={() => setViewingApp(a)} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                 <div className="flex items-start justify-between mb-2">
                                    <span className="text-[10px] font-mono text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">APP-{a.id.substring(0,6).toUpperCase()}</span>
                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600 border border-gray-200" title={a.counselor}>
                                       {a.counselor !== 'Unassigned' ? a.counselor.charAt(0) : '?'}
                                    </div>
                                 </div>
                                 <h4 className="font-bold text-gray-900 text-sm mb-1">{a.userName}</h4>
                                 <p className="text-xs text-gray-600 font-medium truncate mb-0.5" title={a.university}>{a.university}</p>
                                 <p className="text-xs text-gray-400 truncate mb-3" title={a.program}>{a.program}</p>
                                 <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-[10px] font-medium text-gray-400">
                                     <span>{dayjs(a.updatedAt).fromNow()}</span>
                                     <span>{a.country}</span>
                                 </div>
                              </div>
                           ))}
                           {colApps.length === 0 && (
                               <div className="text-center p-4 text-xs font-medium text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                  Drop applications here
                               </div>
                           )}
                        </div>
                     </div>
                  )
               })}
            </div>
        )}
      </div>

      <AnimatePresence>
        {viewingApp && (
          <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden border-l border-gray-200"
            >
               <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <button onClick={() => setViewingApp(null)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">Application Overview</h2>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Document request sent to student.' } }))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition">
                        Request Docs
                    </button>
                    <button onClick={() => deleteApplication(viewingApp.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
                  {/* Header Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                       <span className={`px-3 py-1.5 ${getStatusColor(viewingApp.status)} rounded-lg text-xs font-bold tracking-wide border block shadow-sm`}>
                          {viewingApp.status}
                       </span>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-16 h-16 rounded-full bg-[#5B4DFF]/10 text-[#5B4DFF] flex items-center justify-center font-bold text-2xl shrink-0 border border-[#5B4DFF]/20 shadow-inner">
                          {viewingApp.userName.charAt(0)}
                       </div>
                       <div className="flex-1 mt-1">
                          <div className="flex items-center justify-between mb-1">
                             <h3 className="text-xl font-bold text-gray-900 tracking-tight">{viewingApp.userName}</h3>
                          </div>
                          <div className="text-gray-500 text-sm mb-4 font-medium">{viewingApp.userEmail} • <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">APP-{viewingApp.id.substring(0,8).toUpperCase()}</span></div>
                          <div className="flex gap-2">
                             <button onClick={() => navigate('/admin/messages', { state: { userId: String(viewingApp.userId) } })} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                                <MessageSquare className="w-3.5 h-3.5" /> Message Student
                             </button>
                             <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                                <FileText className="w-3.5 h-3.5" /> View Full Profile
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Program Info */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                         <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Program Details</h4>
                         <div className="space-y-4">
                            <div className="flex items-start gap-3">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                   <Briefcase className="w-4 h-4" />
                               </div>
                               <div>
                                 <div className="text-xs font-semibold text-gray-500 mb-0.5">University</div>
                                 <div className="text-sm font-bold text-gray-900">{viewingApp.university || 'Not specified'}</div>
                                 <div className="text-xs text-gray-500 mt-0.5">{viewingApp.country || 'Country Not specified'}</div>
                               </div>
                            </div>
                            <div className="flex items-start gap-3">
                               <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                   <FileText className="w-4 h-4" />
                               </div>
                               <div>
                                 <div className="text-xs font-semibold text-gray-500 mb-0.5">Program</div>
                                 <div className="text-sm font-bold text-gray-900">{viewingApp.program || 'Not specified'}</div>
                                 <div className="text-xs text-gray-500 mt-0.5">{viewingApp.intake || 'Intake Not specified'}</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Action Center */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Workflow Actions</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Change Status</label>
                            <select 
                               value={viewingApp.status} 
                               onChange={(e) => handleStatusChange(viewingApp, e.target.value)}
                               className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B4DFF]/20 text-sm shadow-sm font-medium"
                            >
                               {ALL_STATUSES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Assign Counselor</label>
                            <select 
                               value={viewingApp.counselor}
                               onChange={(e) => handleCounselorChange(viewingApp, e.target.value)}
                               className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B4DFF]/20 text-sm shadow-sm font-medium"
                            >
                               <option value="Unassigned">Unassigned</option>
                               <option value="Sarah Jenkins">Sarah Jenkins</option>
                               <option value="Michael Chang">Michael Chang</option>
                               <option value="Emily Roberts">Emily Roberts</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Add Internal Note or Status Message</label>
                            <div className="flex gap-2">
                               <input 
                                  type="text" 
                                  value={statusUpdateNote}
                                  onChange={(e) => setStatusUpdateNote(e.target.value)}
                                  placeholder="Type a note here..."
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B4DFF]/20 text-sm shadow-sm"
                               />
                               <button onClick={async () => {
                                   if (!statusUpdateNote) return;
                                   await logAudit('Note Added', viewingApp.id, statusUpdateNote);
                                   window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Note added successfully' } }));
                                   setStatusUpdateNote('');
                               }} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm shrink-0">
                                   Save Note
                               </button>
                            </div>
                        </div>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Related Documents Mini-list */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                             <h4 className="text-sm font-bold text-gray-900">Related Documents</h4>
                             <button onClick={() => navigate('/admin/documents')} className="text-xs font-bold text-[#5B4DFF] hover:underline">View All</button>
                          </div>
                          
                          {appDocuments.length > 0 ? (
                             <div className="space-y-3">
                                {appDocuments.slice(0,4).map(doc => (
                                   <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                         </div>
                                         <div>
                                            <div className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{doc.title || doc.name}</div>
                                            <div className="text-xs font-semibold text-gray-500">{doc.type} • <span className={doc.status === 'Verified' ? 'text-emerald-600' : 'text-amber-600'}>{doc.status || 'Pending'}</span></div>
                                         </div>
                                      </div>
                                      <button onClick={() => window.open(doc.url, '_blank')} className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm hover:bg-gray-50 transition-colors">View</button>
                                   </div>
                                ))}
                                {appDocuments.length > 4 && <div className="text-center text-xs font-bold text-gray-500 pt-2">+{appDocuments.length - 4} more documents</div>}
                             </div>
                          ) : (
                             <div className="text-sm font-medium text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">No documents uploaded yet.</div>
                          )}
                      </div>

                      {/* Timeline / Activity */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                             <h4 className="text-sm font-bold text-gray-900">Activity Timeline</h4>
                             <Calendar className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="relative pl-4 space-y-5 border-l-2 border-gray-100 ml-2 mt-4 max-h-[300px] overflow-y-auto">
                              {/* Create Event */}
                              <div className="relative">
                                  <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></div>
                                  <div className="text-xs font-bold text-gray-900">Application Created</div>
                                  <div className="text-[10px] font-medium text-gray-500 mt-0.5">{dayjs(viewingApp.createdAt).format('MMM D, YYYY h:mm A')}</div>
                              </div>
                              {appLogs.map((log, i) => (
                                 <div key={i} className="relative">
                                     <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#5B4DFF] border-2 border-white shadow-sm shadow-[#5B4DFF]/30"></div>
                                     <div className="text-xs font-bold text-gray-900">{log.action}</div>
                                     <div className="text-[11px] text-gray-600 mt-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium leading-relaxed">{log.details}</div>
                                     <div className="text-[10px] font-medium text-gray-500 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {dayjs(log.createdAt).format('MMM D, h:mm A')} • {log.role}</div>
                                 </div>
                              ))}
                          </div>
                      </div>
                  </div>

               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
