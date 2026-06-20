import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, X, ArrowUpDown, FileText, CheckCircle, Clock, Eye, Download, Upload, ShieldCheck, FileWarning, SearchX, RefreshCw, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveToTable, deleteFromTable, listenToTable } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { downloadCSV } from '@/lib/exportUtils';
import dayjs from 'dayjs';

const DOC_TYPES = [
   'Passport', 'SOP', 'LOR', 'IELTS', 'TOEFL', 'PTE', 
   'Transcript', 'Degree Certificate', 'Resume', 
   'Financial Documents', 'Visa Documents', 'Other'
];

const STATUSES = ['Pending Review', 'Verified', 'Rejected', 'Reupload Requested'];

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterUniversity, setFilterUniversity] = useState('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'createdAt', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Modals
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (filteredAndSorted.length === 0) {
        throw new Error("No documents to export.");
      }
      
      const headers = ['ID', 'Student Name', 'Email', 'Document Type', 'File Name', 'Status', 'Uploaded At'];
      const csvContent = [
        headers.join(','),
        ...filteredAndSorted.map(doc => [
          doc.id,
          `"${doc.userName || ''}"`,
          `"${doc.userEmail || ''}"`,
          `"${doc.type || ''}"`,
          `"${doc.fileName || ''}"`,
          `"${doc.status || ''}"`,
          `"${doc.uploadedAt || ''}"`
        ].join(','))
      ].join('\n');

      downloadCSV('documents_export.csv', csvContent);

      await new Promise(r => setTimeout(r, 800)); // UX delay
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Documents exported successfully.' } }));
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: e.message || 'Export failed.', type: 'error' } }));
    } finally {
      setExporting(false);
    }
  };

  const loadRealtimeData = async () => {
    setLoading(true);
    let unsubscribeDocs = listenToTable('documents', (data) => {
       setDocuments(data || []);
       setLoading(false);
    });
    let unsubscribeUsers = listenToTable('users', (data) => {
       setUsers(data || []);
    });
    let unsubscribeApps = listenToTable('applications', (data) => {
       setApplications(data || []);
    });
    let unsubscribeAuditLogs = listenToTable('audit_logs', (data) => {
       setAuditLogs(data || []);
    });

    return () => {
      unsubscribeDocs();
      unsubscribeUsers();
      unsubscribeApps();
      unsubscribeAuditLogs();
    };
  };

  useEffect(() => {
    let unsubs: any;
    loadRealtimeData().then(fn => { unsubs = fn; });
    return () => { if (unsubs) unsubs(); };
  }, []);

  const enrichedDocs = useMemo(() => {
     return documents.map(d => {
        const u = users.find(user => user.id === d.userId) || {};
        const app = applications.find(app => String(app.userId) === String(d.userId)) || {};
        
        return {
           ...d,
           userName: u.name || 'Unknown User',
           userEmail: u.email || '',
           createdAt: d.createdAt || new Date().toISOString(),
           updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
           status: d.status || 'Pending Review',
           type: d.type || 'Other',
           verifiedBy: d.verifiedBy || '-',
           university: app.university || 'Not Specified',
           country: app.country || 'Not Specified',
           counselor: app.counselor || 'Unassigned'
        };
     });
  }, [documents, users, applications]);

  const students = useMemo(() => Array.from(new Set(enrichedDocs.map(d => d.userName).filter(n => n && n !== 'Unknown User'))).sort(), [enrichedDocs]);
  const countries = useMemo(() => Array.from(new Set(enrichedDocs.map(d => d.country).filter(c => c && c !== 'Not Specified'))).sort(), [enrichedDocs]);
  const universities = useMemo(() => Array.from(new Set(enrichedDocs.map(d => d.university).filter(u => u && u !== 'Not Specified'))).sort(), [enrichedDocs]);

  const filteredAndSorted = useMemo(() => {
    let result = enrichedDocs.filter(d => {
      const matchSearch = (d.title || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' || d.type === filterType;
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      const matchStudent = filterStudent === 'all' || d.userName === filterStudent;
      const matchCountry = filterCountry === 'all' || d.country === filterCountry;
      const matchUniversity = filterUniversity === 'all' || d.university === filterUniversity;

      return matchSearch && matchType && matchStatus && matchStudent && matchCountry && matchUniversity;
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
  }, [enrichedDocs, searchTerm, filterType, filterStatus, filterStudent, filterCountry, filterUniversity, sortConfig]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const currentItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleSelection = (id: string) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedDocs.length === currentItems.length) {
       setSelectedDocs([]);
    } else {
       setSelectedDocs(currentItems.map(a => a.id));
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

  const handleStatusChange = async (doc: any, newStatus: string) => {
    try {
      const coreData = documents.find(x => x.id === doc.id) || doc;
      if (coreData.status === newStatus) return;

      const adminName = "System Admin";
      const updatedDoc = { 
         ...coreData, 
         status: newStatus, 
         updatedAt: new Date().toISOString(),
         verifiedBy: newStatus === 'Verified' || newStatus === 'Rejected' ? adminName : coreData.verifiedBy
      };
      
      await saveToTable('documents', updatedDoc);
      
      await logAudit('Document Verification', doc.id, `Document marked as ${newStatus}. Note: ${reviewNote || 'None'}`);

      // Update User Notification
      let notificationBody = `Your document "${doc.title || doc.name}" has been ${newStatus.toLowerCase()}.`;
      if(reviewNote) notificationBody += `\\nAdmin Note: ${reviewNote}`;

      await saveToTable('notifications', {
         userId: doc.userId,
         title: `Document ${newStatus}`,
         body: notificationBody,
         createdAt: new Date().toISOString(),
         read: false
      });

      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Document marked as ${newStatus}` } }));
      
      setReviewNote('');
      if (viewingDoc && viewingDoc.id === doc.id) {
         setViewingDoc({ ...updatedDoc, userName: doc.userName, userEmail: doc.userEmail, university: doc.university, country: doc.country }); 
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Failed to update document status', type: 'error' } }));
    }
  };

  const handleBulkVerify = async () => {
    setLoading(true);
    let verifiedCount = 0;
    try {
      for (const id of selectedDocs) {
         const doc = documents.find(d => d.id === id);
         if (doc && doc.status !== 'Verified') {
           await saveToTable('documents', { ...doc, status: 'Verified', updatedAt: new Date().toISOString(), verifiedBy: 'System Admin' });
           await logAudit('Bulk Verify', id, `Document verified`);
           verifiedCount++;
         }
      }
      setSelectedDocs([]);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Verified ${verifiedCount} documents.` } }));
    } catch(err) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Bulk verify failed.`, type: 'error' } }));
    }
    setLoading(false);
  };

  const handleBulkReupload = async () => {
    const note = window.prompt("Reason for reupload request:");
    if (note === null) return;
    setLoading(true);
    let count = 0;
    try {
      for (const id of selectedDocs) {
         const doc = documents.find(d => d.id === id);
         if (doc && doc.status !== 'Reupload Requested') {
           await saveToTable('documents', { ...doc, status: 'Reupload Requested', updatedAt: new Date().toISOString(), verifiedBy: 'System Admin' });
           await saveToTable('notifications', {
             userId: doc.userId,
             title: `Document Reupload Requested`,
             body: `Please reupload your ${doc.type}. Reason: ${note || 'Standard review requirement'}`,
             createdAt: new Date().toISOString(),
             read: false
           });
           await logAudit('Bulk Reupload Request', id, `Reupload requested: ${note}`);
           count++;
         }
      }
      setSelectedDocs([]);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Requested reupload for ${count} documents.` } }));
    } catch(err) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Bulk request failed.`, type: 'error' } }));
    }
    setLoading(false);
  };

  const handleRequestDocument = async () => {
     const studentEmail = window.prompt("Enter student's email to request document:");
     if (!studentEmail) return;
     const docType = window.prompt(`Enter document type to request:\nOptions: ${DOC_TYPES.join(', ')}`);
     if (!docType) return;

     const user = users.find(u => u.email === studentEmail);
     if (!user) {
        alert("Student not found.");
        return;
     }

     setLoading(true);
     try {
       await saveToTable('notifications', {
             userId: user.id,
             title: `Document Request: ${docType}`,
             body: `The administration has requested that you upload your ${docType}. Please upload it in your document center.`,
             createdAt: new Date().toISOString(),
             read: false
       });
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Document request sent to ${studentEmail}.` } }));
     } catch(e) {
       window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Failed to request document.`, type: 'error' } }));
     }
     setLoading(false);
  };

  const handleUploadForStudent = () => {
     const studentEmail = window.prompt("Enter student's email to upload document for:");
     if (!studentEmail) return;
     const user = users.find(u => u.email === studentEmail);
     if (!user) {
        alert("Student not found.");
        return;
     }
     const docType = window.prompt(`Enter document type:\nOptions: ${DOC_TYPES.join(', ')}`);
     if (!docType) return;

     const input = document.createElement('input');
     input.type = 'file';
     input.accept = 'application/pdf,image/*';
     input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if(!file) return;

        setLoading(true);
        try {
           const newDoc = {
               userId: user.id,
               type: docType,
               name: file.name,
               title: docType,
               size: file.size,
               status: 'Verified',
               url: URL.createObjectURL(file),
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               verifiedBy: 'System Admin'
           };
           await saveToTable('documents', newDoc);
           window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Document uploaded for ${studentEmail}.` } }));
        } catch(err) {
           window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `Failed to upload document.`, type: 'error' } }));
        }
        setLoading(false);
     };
     input.click();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this document?')) {
          await deleteFromTable('documents', id);
          await logAudit('Delete Document', id, `Document deleted completely`);
          window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Document deleted' } }));
          if (viewingDoc?.id === id) setViewingDoc(null);
      }
  };

  const getStatusColor = (status: string) => {
     switch(status) {
        case 'Verified': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'Rejected': return 'bg-rose-100 text-rose-800 border-rose-300';
        case 'Reupload Requested': return 'bg-amber-100 text-amber-800 border-amber-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
     }
  };

  const stats = {
     total: enrichedDocs.length,
     pending: enrichedDocs.filter(d => d.status === 'Pending Review').length,
     verified: enrichedDocs.filter(d => d.status === 'Verified').length,
     rejected: enrichedDocs.filter(d => d.status === 'Rejected').length,
     reupload: enrichedDocs.filter(d => d.status === 'Reupload Requested').length,
     expiringSoon: enrichedDocs.filter(d => d.type === 'Passport' && d.status === 'Verified').length // mock metric for passports
  };

  const docLogs = viewingDoc ? auditLogs.filter(l => l.entityId === viewingDoc.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Document Center</h1>
          <p className="text-gray-500 text-sm mt-1">Manage, verify, and review student documents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => loadRealtimeData()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
             <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
             {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button onClick={handleRequestDocument} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
             <FileWarning className="w-4 h-4" /> Request Document
          </button>
          <button onClick={handleBulkVerify} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
             <ShieldCheck className="w-4 h-4 outline" /> Bulk Verify
          </button>
          <button onClick={handleUploadForStudent} className="flex items-center gap-2 px-4 py-2 bg-[#5B4DFF] text-white rounded-lg text-sm font-semibold hover:bg-[#4A3EE0] transition-colors shadow-sm shadow-[#5B4DFF]/20">
             <Upload className="w-4 h-4" /> Upload For Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-4 overflow-x-auto shrink-0 pb-2 snap-x">
          {[
            { label: 'Total Documents', count: stats.total, color: 'text-gray-900' },
            { label: 'Pending Verification', count: stats.pending, color: 'text-amber-600' },
            { label: 'Verified', count: stats.verified, color: 'text-emerald-700' },
            { label: 'Rejected', count: stats.rejected, color: 'text-rose-600' },
            { label: 'Reupload Requested', count: stats.reupload, color: 'text-orange-600' },
            { label: 'Expiring Soon', count: stats.expiringSoon, color: 'text-gray-600' },
          ].map((stat, i) => (
             <div key={i} className="min-w-[150px] bg-white p-4 rounded-xl border border-gray-200 shadow-sm snap-start shrink-0 flex-1">
               <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">{stat.label}</div>
               <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
             </div>
          ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Filters Wrapper */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 shrink-0 space-y-3">
           <div className="flex flex-col md:flex-row justify-between gap-4">
               <div className="flex flex-wrap items-center gap-2 flex-1 relative z-10 w-full overflow-visible">
                  <div className="relative">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="Search filename..." 
                       value={searchTerm}
                       onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                       className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF] w-full sm:w-[220px] text-sm"
                     />
                  </div>
                  <select value={filterStatus} onChange={e => {setFilterStatus(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">Verification Status</option>
                    {STATUSES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <select value={filterType} onChange={e => {setFilterType(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">Document Type</option>
                    {DOC_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <select value={filterStudent} onChange={e => {setFilterStudent(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20">
                    <option value="all">Student Name</option>
                    {students.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <select value={filterCountry} onChange={e => {setFilterCountry(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20 w-[150px] truncate pr-8">
                    <option value="all">Country</option>
                    {countries.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <select value={filterUniversity} onChange={e => {setFilterUniversity(e.target.value); setCurrentPage(1);}} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/20 w-[150px] truncate pr-8">
                    <option value="all">University</option>
                    {universities.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
               </div>
               <div className="flex items-center gap-2 shrink-0">
                  {(searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterStudent !== 'all' || filterCountry !== 'all' || filterUniversity !== 'all') && (
                      <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterType('all'); setFilterStudent('all'); setFilterCountry('all'); setFilterUniversity('all'); }} className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 bg-white border border-gray-200 px-3 py-2 rounded-lg">
                          <X className="w-3.5 h-3.5" /> Reset Filters
                      </button>
                  )}
               </div>
           </div>
           
           {selectedDocs.length > 0 && (
             <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                 <span className="font-semibold text-indigo-800 text-sm px-2">{selectedDocs.length} selected</span>
                 <button onClick={handleBulkVerify} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">Bulk Verify</button>
                 <button onClick={handleBulkReupload} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">Request Reupload</button>
                 <button onClick={handleExport} disabled={exporting} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition disabled:opacity-50">{exporting ? 'Exporting...' : 'Export'}</button>
                 <button onClick={() => setSelectedDocs([])} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 shadow-sm transition ml-auto">Clear Selection</button>
             </div>
           )}
        </div>

        <div className="overflow-x-auto flex-1 bg-white">
           {loading ? (
              <div className="p-12 text-center text-sm font-medium text-gray-500">Loading documents...</div>
           ) : currentItems.length === 0 ? (
              <EmptyState 
                 title="No documents found"
                 description="No documents correspond to your active filters. Try adjusting your search criteria or upload new documents."
                 icon={SearchX}
              />
           ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase sticky top-0 z-10">
                   <tr>
                      <th className="px-6 py-4">
                          <input type="checkbox" checked={selectedDocs.length === currentItems.length && currentItems.length > 0} onChange={toggleAll} className="rounded border-gray-300 text-[#5B4DFF] focus:ring-[#5B4DFF]" />
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('title')}>
                        <div className="flex items-center gap-1">Document Name <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('userName')}>
                        <div className="flex items-center gap-1">Student <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('type')}>
                        <div className="flex items-center gap-1">Document Type <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('university')}>
                        <div className="flex items-center gap-1">University <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('status')}>
                        <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('createdAt')}>
                        <div className="flex items-center gap-1">Uploaded Date <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('verifiedBy')}>
                        <div className="flex items-center gap-1">Verified By <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-gray-900 transition" onClick={() => requestSort('updatedAt')}>
                        <div className="flex items-center gap-1">Last Updated <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {currentItems.map((d) => (
                     <tr 
                       key={d.id} 
                       className="hover:bg-gray-50 transition-colors group cursor-pointer"
                       onClick={(e) => {
                           if((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
                           setViewingDoc(d);
                       }}
                     >
                        <td className="px-6 py-4">
                           <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={() => toggleSelection(d.id)} className="rounded border-gray-300 text-[#5B4DFF] focus:ring-[#5B4DFF]" />
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                                <FileText className="w-4 h-4" />
                             </div>
                             <div className="min-w-0">
                               <div className="font-bold text-gray-900 truncate max-w-[200px]" title={d.title || d.name}>{d.title || d.name || 'Untitled Document'}</div>
                               {d.size && <div className="text-xs text-gray-500 font-medium">{(d.size / 1024 / 1024).toFixed(2)} MB</div>}
                             </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold text-gray-900 truncate max-w-[150px]">{d.userName}</div>
                           <div className="text-xs text-gray-500 truncate max-w-[150px] font-medium">{d.userEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-[11px] font-bold border block w-max shadow-sm">
                             {d.type || 'Other'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold text-gray-900 truncate max-w-[150px]">{d.university}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 ${getStatusColor(d.status)} rounded-md text-[11px] font-bold tracking-wide border block w-max shadow-sm`}>
                             {d.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs font-semibold">
                           {dayjs(d.createdAt).format('MMM D, YYYY')}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs font-semibold">
                           {d.verifiedBy}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs font-semibold">
                           {dayjs(d.updatedAt).fromNow(true)} ago
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setViewingDoc(d)} className="p-1.5 text-gray-400 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10 rounded-md transition-colors" title="Preview Document">
                               <Eye className="w-4 h-4" />
                             </button>
                             <a href={d.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10 rounded-md transition-colors inline-block" title="Download">
                               <Download className="w-4 h-4" />
                             </a>
                             <button onClick={() => handleStatusChange(d, 'Verified')} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Verify">
                               <CheckCircle className="w-4 h-4" />
                             </button>
                             <button onClick={() => handleStatusChange(d, 'Rejected')} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Reject">
                               <FileWarning className="w-4 h-4" />
                             </button>
                             <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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
      </div>

      <AnimatePresence>
        {viewingDoc && (
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
                    <button onClick={() => setViewingDoc(null)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">Document Verification</h2>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => handleDelete(viewingDoc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Document">
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
                  
                  {/* Header */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-start gap-4 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4">
                       <span className={`px-3 py-1.5 ${getStatusColor(viewingDoc.status)} rounded-lg text-xs font-bold tracking-wide border block shadow-sm`}>
                          {viewingDoc.status}
                       </span>
                     </div>
                     <div className="w-14 h-14 rounded-full bg-[#5B4DFF]/10 text-[#5B4DFF] flex items-center justify-center border border-[#5B4DFF]/20 shrink-0 shadow-inner">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div className="min-w-0 flex-1 mt-1 pr-24">
                       <h3 className="text-xl font-bold text-gray-900 truncate mb-1">{viewingDoc.title || viewingDoc.name || 'Untitled Document'}</h3>
                       <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-700 shadow-sm">{viewingDoc.type}</span>
                       </div>
                       <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-2 font-medium">
                           <span>Uploaded: <strong className="text-gray-700">{dayjs(viewingDoc.createdAt).format('MMM D, YYYY h:mm A')}</strong></span>
                           {viewingDoc.size && <span>Size: <strong className="text-gray-700">{(viewingDoc.size / 1024 / 1024).toFixed(2)} MB</strong></span>}
                       </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Document Details */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                         <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Student & Metadata</h4>
                         <div className="space-y-4">
                            <div className="flex items-start gap-3">
                               <div>
                                 <div className="text-xs font-semibold text-gray-500 mb-0.5">Student</div>
                                 <div className="text-sm font-bold text-gray-900">{viewingDoc.userName}</div>
                                 <div className="text-xs text-gray-500">{viewingDoc.userEmail}</div>
                               </div>
                            </div>
                            <div className="flex items-start gap-3">
                               <div>
                                 <div className="text-xs font-semibold text-gray-500 mb-0.5">Application Context</div>
                                 <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{viewingDoc.university}</div>
                                 <div className="text-xs text-gray-500">{viewingDoc.country}</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Verification Workflow */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Verification Workflow</h4>
                         
                         <div className="space-y-3">
                             <div>
                               <label className="block text-xs font-bold text-gray-700 mb-1.5">Admin Comments (visible to student)</label>
                               <textarea 
                                  rows={2} 
                                  value={reviewNote}
                                  onChange={(e) => setReviewNote(e.target.value)}
                                  placeholder="Add approval notes, rejection reasons, or reupload instructions..."
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF] text-sm shadow-sm"
                               ></textarea>
                             </div>

                             <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                                <button 
                                  onClick={() => handleStatusChange(viewingDoc, 'Verified')}
                                  className="px-3 py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm"
                                >
                                  <CheckCircle className="w-4 h-4 mb-0.5" /> 
                                  <span className="text-[10px]">Approve</span>
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(viewingDoc, 'Reupload Requested')}
                                  className="px-3 py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm"
                                >
                                  <FileWarning className="w-4 h-4 mb-0.5" /> 
                                  <span className="text-[10px]">Reupload</span>
                                </button>
                                <button 
                                  onClick={() => handleStatusChange(viewingDoc, 'Rejected')}
                                  className="px-3 py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors border bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-sm col-span-2 lg:col-span-1"
                                >
                                  <X className="w-4 h-4 mb-0.5" /> 
                                  <span className="text-[10px]">Reject</span>
                                </button>
                             </div>
                         </div>
                      </div>
                  </div>

                  {/* Preview Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
                          <h4 className="text-sm font-bold text-gray-900">Live Preview</h4>
                          <a href={viewingDoc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#5B4DFF] hover:underline flex items-center gap-1 bg-[#5B4DFF]/10 px-2.5 py-1 rounded-md">
                              Open Full Screen <Eye className="w-3 h-3" />
                          </a>
                      </div>
                      
                      {viewingDoc.url ? (
                          <div className="h-96 border border-gray-200 rounded-lg overflow-hidden bg-gray-100 relative group flex items-center justify-center p-2">
                             {viewingDoc.type.includes('png') || viewingDoc.type.includes('jpg') || viewingDoc.type.includes('jpeg') || (viewingDoc.url.match(/\\.(jpeg|jpg|gif|png)$/) != null) ? (
                                <img src={viewingDoc.url} alt="Preview" className="w-full h-full object-contain rounded" />
                             ) : viewingDoc.url.match(/\\.pdf(?:\\?.*)?$/i) ? (
                                <object data={viewingDoc.url} type="application/pdf" className="w-full h-full rounded">
                                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                         <FileText className="w-6 h-6 text-gray-400" />
                                      </div>
                                      <div className="text-center text-sm font-bold text-gray-500">Preview not available for this browser.</div>
                                      <a href={viewingDoc.url} target="_blank" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm">Download PDF</a>
                                    </div>
                                </object>
                             ) : (
                                <div className="text-center">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <div className="text-sm font-medium text-gray-500 mb-3">Rich preview not supported for this format.</div>
                                    <a href={viewingDoc.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm inline-flex items-center gap-2">
                                        <Download className="w-4 h-4" /> Download File
                                    </a>
                                </div>
                             )}
                          </div>
                      ) : (
                          <div className="h-64 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 text-sm font-bold text-gray-400 border-dashed">
                             No file content available.
                          </div>
                      )}
                  </div>

                  {/* History Section */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                       <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <h4 className="text-sm font-bold text-gray-900">Verification History</h4>
                          <History className="w-4 h-4 text-gray-400" />
                       </div>
                       
                       <div className="relative pl-4 space-y-5 border-l-2 border-gray-100 ml-2 mt-4">
                           {/* Upload Event */}
                           <div className="relative">
                               <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></div>
                               <div className="text-xs font-bold text-gray-900">Document Uploaded</div>
                               <div className="text-[10px] font-medium text-gray-500 mt-0.5">{dayjs(viewingDoc.createdAt).format('MMM D, YYYY h:mm A')}</div>
                           </div>
                           
                           {docLogs.map((log, i) => (
                              <div key={i} className="relative">
                                  <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${log.action.includes('Delete') ? 'bg-rose-500' : 'bg-[#5B4DFF]'}`}></div>
                                  <div className="text-xs font-bold text-gray-900">{log.action}</div>
                                  <div className="text-[11px] text-gray-600 mt-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium">{log.details}</div>
                                  <div className="text-[10px] font-medium text-gray-500 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {dayjs(log.createdAt).format('MMM D, h:mm A')} • {log.role}</div>
                              </div>
                           ))}
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
