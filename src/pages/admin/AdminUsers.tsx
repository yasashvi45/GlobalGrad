import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Edit2, Trash2, ShieldBan, CheckCircle, Eye, X, ChevronLeft, ChevronRight, ArrowUpDown, MessageSquare, Users as UsersIcon, Download } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { getTable, deleteFromTable } from '@/lib/api';
import { getUsers, updateUser, deleteUser } from '@/services/userService';
import AdminUserWorkspace from '@/components/admin/AdminUserWorkspace';
import { EmptyState } from '@/components/ui/EmptyState';
import { exportToCSV } from '@/lib/exportUtils';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('student');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'createdAt', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals / Drawers
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getUsers() || [];
      const profiles = await getTable('profiles') || [];
      const apps = await getTable('applications') || [];
      const savedUnis = await getTable('universities_saved') || [];
      const docs = await getTable('documents') || [];
      
      const enriched = data.map((u: any) => {
        const uProfile = profiles.find((p: any) => String(p.id) === String(u.id) || String(p.userId) === String(u.id)) || {};
        const uApps = apps.filter((a: any) => String(a.userId) === String(u.id));
        const uSaved = savedUnis.filter((s: any) => String(s.userId) === String(u.id));
        const uDocs = docs.filter((d: any) => String(d.userId) === String(u.id));

        return {
          ...u,
          ...uProfile,
          id: u.id,
          name: uProfile.personal?.fullName || u.name || u.fullName || 'No Name',
          country: uProfile.personal?.currentCountry || 'Unknown',
          program: uProfile.academic?.targetDegree || 'Unknown',
          appsCount: uApps.length,
          savedCount: uSaved.length,
          docsCount: uDocs.length,
          recentApps: uApps,
          recentDocs: uDocs,
          accountStatus: u.status || u.accountStatus || 'active',
          role: u.role || 'student',
          createdAt: u.createdAt || new Date().toISOString(),
          // Attach full profile internally for AdminUserWorkspace (redundant but safe)
          profile: uProfile
        };
      });

      setUsers(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Derived state
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole === 'all' || u.role.toLowerCase() === filterRole.toLowerCase();
      const matchStatus = filterStatus === 'all' || u.accountStatus.toLowerCase() === filterStatus.toLowerCase();
      return matchSearch && matchRole && matchStatus;
    });

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, filterRole, filterStatus, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const currentItems = filteredAndSortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handlers
  const handleEditClick = (user: any) => {
    setEditingUserId(user.id);
    setEditFormData(user);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormData({ ...editFormData, [field]: value });
  };

  const handleSaveUser = async () => {
    try {
      if (!editingUserId) return;
      await updateUser(editingUserId, editFormData);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'User updated successfully' } }));
      setEditingUserId(null);
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to completely delete this user? This action cannot be undone.')) return;
    try {
      // Fetch and delete related records
      const profiles = await getTable('profiles');
      const apps = await getTable('applications');
      const savedUnis = await getTable('universities_saved');
      const docs = await getTable('documents');
      
      const userProfile = profiles.find((p:any) => p.userId === id);
      if (userProfile) await deleteFromTable('profiles', userProfile.id);

      for (const app of apps.filter((a:any) => a.userId === id)) {
        await deleteFromTable('applications', app.id);
      }

      for (const s of savedUnis.filter((a:any) => a.userId === id)) {
        await deleteFromTable('universities_saved', s.id);
      }

      for (const d of docs.filter((a:any) => a.userId === id)) {
        await deleteFromTable('documents', d.id);
      }

      await deleteUser(id);
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'User deleted permanently' } }));
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (user: any, forceStatus?: string) => {
    try {
      const newStatus = forceStatus || (user.accountStatus === 'Suspended' ? 'Active' : 'Suspended');
      await updateUser(user.id, { ...user, accountStatus: newStatus });
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: `User account ${newStatus.toLowerCase()}` } }));
      loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    exportToCSV(users, "Users_Export");
  };

  if (viewingUser) {
    return (
      <AdminUserWorkspace 
        user={viewingUser} 
        onBack={() => setViewingUser(null)} 
        onRefresh={loadUsers} 
      />
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Users</h1>
          <p className="text-slate-500 font-medium">Manage and monitor platform users in detail.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative border border-slate-200 rounded-xl bg-white overflow-hidden flex">
            <span className="pl-3 py-2 text-slate-400 bg-slate-50 border-r border-slate-200"><Filter className="w-5 h-5" /></span>
             <select value={filterRole} onChange={e => {setFilterRole(e.target.value); setCurrentPage(1);}} className="bg-transparent pl-3 pr-8 py-2 text-sm font-bold text-slate-700 outline-none border-none">
               <option value="student">Student</option>
               <option value="admin">Admin</option>
             </select>
             <select value={filterStatus} onChange={e => {setFilterStatus(e.target.value); setCurrentPage(1);}} className="bg-transparent pl-3 pr-8 py-2 text-sm font-bold text-slate-700 outline-none border-l border-slate-200 focus:border-none">
               <option value="all">All Statuses</option>
               <option value="active">Active</option>
               <option value="suspended">Suspended</option>
             </select>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users by name, email..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 font-medium text-sm"
            />
          </div>
          <button onClick={handleExport} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-5 h-5" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 pl-12 text-center font-bold text-slate-400">Loading users database...</div>
          ) : currentItems.length === 0 ? (
             <EmptyState 
                title="No users found"
                description="Try adjusting your active filters or search criteria."
                icon={UsersIcon}
                action={{ label: "Reset Filters", onClick: () => { setSearchTerm(''); setFilterRole('student'); setFilterStatus('all'); } }}
             />
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-1">User <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('role')}>
                    <div className="flex items-center gap-1">Role <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('country')}>
                    <div className="flex items-center gap-1">Geolocation <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('accountStatus')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition" onClick={() => requestSort('createdAt')}>
                    <div className="flex items-center gap-1">Joined Date <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                {currentItems.map((user) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={user.id} 
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold tracking-tight shrink-0 ${user.accountStatus === 'Suspended' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          {editingUserId === user.id ? (
                             <input 
                               value={editFormData.name || ''} 
                               onChange={(e) => handleEditChange('name', e.target.value)}
                               className="border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-900 mb-1 w-full" 
                             />
                          ) : (
                             <div className="font-bold text-slate-900 truncate max-w-[150px]">{user.name}</div>
                          )}
                          <div className="text-slate-500 text-xs truncate max-w-[150px]" title={user.email}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <select 
                          value={editFormData.role || 'student'}
                          onChange={(e) => handleEditChange('role', e.target.value)}
                          className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 font-bold"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 truncate max-w-[120px]" title={user.country}>{user.country}</div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider truncate max-w-[120px]" title={user.program}>{user.program}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${
                        user.accountStatus === 'Suspended' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                         {user.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-bold">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                        <td className="px-6 py-4 text-right">
                      {editingUserId === user.id ? (
                        <button onClick={handleSaveUser} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">Save</button>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewingUser(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Profile">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => navigate('/admin/messages', { state: { userId: String(user.id) } })} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Message User">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {user.accountStatus === 'Active' && (
                               <button onClick={() => handleToggleStatus(user, 'Suspended')} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend Account">
                                 <ShieldBan className="w-4 h-4" />
                               </button>
                            )}
                            {user.accountStatus === 'Suspended' && (
                               <button onClick={() => handleToggleStatus(user, 'Active')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Activate Account">
                                 <CheckCircle className="w-4 h-4" />
                               </button>
                            )}
                            {(user.accountStatus === 'Active' || user.accountStatus === 'Suspended') && (
                               <button onClick={() => handleToggleStatus(user, 'Blocked')} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Block Account">
                                 <X className="w-4 h-4" />
                               </button>
                            )}
                            {user.accountStatus === 'Blocked' && (
                               <button onClick={() => handleToggleStatus(user, 'Active')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Unblock Account">
                                 <CheckCircle className="w-4 h-4" />
                               </button>
                            )}
                            <button onClick={() => handleEditClick(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit User">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Permanently Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && filteredAndSortedUsers.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm font-medium text-slate-500 bg-slate-50">
            <div>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} entries</div>
            <div className="flex gap-1">
               <button 
                 disabled={currentPage === 1} 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>
               {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                 <button 
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
                 >
                   {page}
                 </button>
               ))}
               <button 
                 disabled={currentPage === totalPages}
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
