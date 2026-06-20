import { createPortal } from 'react-dom';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Landmark, 
  BookOpen, 
  FileText, 
  Folders, 
  Bell, 
  Bot, 
  PieChart, 
  Settings, 
  LogOut,
  GraduationCap,
  Check,
  Search,
  MessageSquare,
  User,
  CheckCheck,
  X,
  Menu
} from 'lucide-react';
import { getTable, listenToTable, saveToTable } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { getUniversities } from '@/services/universityService';
import { getCountries } from '@/services/countryService';
import { getScholarships } from '@/services/scholarshipService';
import { getUsers } from '@/services/userService';

import { logout } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

function AdminProfileDropdown({ 
  show, 
  setShow, 
  userData, 
  handleLogout, 
  navigate
}: any) {
  const { refs, floatingStyles } = useFloating({
    open: show,
    onOpenChange: setShow,
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 16 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (refs.floating.current && !refs.floating.current.contains(event.target as Node) &&
          refs.reference.current && !refs.reference.current.contains(event.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refs.floating, refs.reference, setShow]);

  return (
    <>
      <button 
        ref={refs.setReference}
        onClick={() => setShow(!show)}
        className="flex items-center gap-3 focus:outline-none"
      >
        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-slate-900 leading-none mb-0.5">{userData?.name || userData?.fullName || 'System Admin'}</div>
          <div className="text-xs font-medium text-indigo-600 uppercase leading-none">{userData?.role?.replace('_', ' ') || 'Admin'}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20 shrink-0">
          {userData?.name?.charAt(0) || userData?.fullName?.charAt(0) || 'A'}
        </div>
      </button>

      {show && createPortal(
        <div
          id="admin-profile-portal"
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 999999, position: 'fixed' }}
          className="w-56"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden outline-none flex flex-col font-sans"
          >
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="text-sm font-black text-slate-900 truncate">{userData?.name || userData?.fullName || 'System Admin'}</div>
                <div className="text-xs font-medium text-slate-500 truncate mt-0.5">{userData?.email || 'admin@example.com'}</div>
             </div>
             <div className="p-1 space-y-1">
               <button onClick={() => { setShow(false); navigate('/admin/settings'); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" /> Platform Settings
               </button>
               <button onClick={() => { setShow(false); handleLogout(); }} className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
               </button>
             </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}

function AdminNotifDropdown({ 
  show, 
  setShow, 
  notifs, 
  unreadNotifs, 
  navigate,
  handleMarkAllRead
}: any) {
  const { refs, floatingStyles } = useFloating({
    open: show,
    onOpenChange: setShow,
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 16 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (refs.floating.current && !refs.floating.current.contains(event.target as Node) &&
          refs.reference.current && !refs.reference.current.contains(event.target as Node)) {
        setShow(false);
      }
    }
    if (show) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, refs.floating, refs.reference, setShow]);

  const recentNotifs = notifs.slice(0, 5);

  return (
    <>
      <button 
        ref={refs.setReference}
        onClick={() => setShow(!show)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
        title="Notifications"
      >
         <Bell className="w-5 h-5" />
         {unreadNotifs > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-50 shadow-sm shadow-rose-500/50"></span>}
      </button>

      {show && createPortal(
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 999999 }}
          className="w-[calc(100vw-2rem)] max-w-[380px] sm:max-w-[420px]"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 overflow-hidden outline-none flex flex-col font-sans"
          >
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <h3 className="font-bold text-slate-900 tracking-tight">Notifications</h3>
                   {unreadNotifs > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wide">
                         {unreadNotifs} New
                      </span>
                   )}
                </div>
                {unreadNotifs > 0 && (
                   <button 
                     onClick={() => handleMarkAllRead()}
                     className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                   >
                     Mark All Read
                   </button>
                )}
             </div>

             <div className="flex-1 max-h-[360px] overflow-y-auto w-full scrollbar-hide">
                {recentNotifs.length === 0 ? (
                   <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                     <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3 shadow-sm">
                       <Bell className="w-5 h-5 text-slate-300" />
                     </div>
                     <div className="text-sm font-bold text-slate-700 mb-1">No notifications yet</div>
                     <div className="text-xs text-slate-500">We'll let you know when something happens!</div>
                   </div>
                ) : (
                   <div className="divide-y divide-slate-50">
                     {recentNotifs.map((n:any) => (
                       <div 
                         key={n.id} 
                         onClick={async () => {
                            if (!n.read && n.status !== 'Read') {
                               await saveToTable('admin_notifications', { id: n.id, read: true, status: 'Read' });
                            }
                            setShow(false);
                            if (n.targetRoute) {
                               navigate(n.targetRoute);
                            }
                         }}
                         className={`p-4 transition-colors relative cursor-pointer group flex items-start gap-4 ${(!n.read && n.status !== 'Read') ? 'bg-[#FCFCFC]' : 'bg-white hover:bg-slate-50'}`}
                       >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgb(0,0,0,0.04)] ${n.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' : n.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' : 'bg-[#F9FAFB] text-slate-600 border border-slate-200/50'}`}>
                             {(!n.read && n.status !== 'Read') && <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                             <Bell className="w-4 h-4 relative z-10" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                             <div className="flex justify-between items-start mb-0.5 gap-2">
                               <h4 className={`text-sm leading-snug truncate ${(!n.read && n.status !== 'Read') ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                               <span className="text-[10px] font-medium text-slate-400 shrink-0 mt-0.5">{dayjs(n.createdAt?.toDate?.() || new Date()).fromNow()}</span>
                             </div>
                             <p className="text-xs text-slate-500 line-clamp-1">{n.description || n.message}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                )}
             </div>

             <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={() => { setShow(false); navigate('/admin/notifications'); }} 
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                   View All Notifications
                </button>
             </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const [toast, setToast] = useState<{message: string, type?: 'success' | 'error'} | null>(null);

  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast({ message: e.detail.message, type: e.detail.type || 'success' });
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('app_toast', handleToast);

    const unsubscribe = listenToTable('admin_notifications', (data) => {
       const sorted = (data || []).sort((a: any, b: any) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
       setNotifs(sorted);
       const unreads = sorted.filter((x: any) => !x.read && x.status !== 'Read');
       setUnreadNotifs(unreads.length);
    });

    return () => {
      window.removeEventListener('app_toast', handleToast);
      unsubscribe();
    }
  }, []);

  const handleMarkAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.read && n.status !== 'Read').map(n => n.id);
    for (const id of unreadIds) {
      await saveToTable('admin_notifications', { id, read: true, status: 'Read' });
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.clear();
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Logged out successfully' } }));
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const [users, uvis, schols, apps, docs, cnts] = await Promise.all([
          getUsers().catch(()=>[]),
          getUniversities().catch(()=>[]),
          getScholarships().catch(()=>[]),
          getTable('applications').catch(()=>[]),
          getTable('documents').catch(()=>[]),
          getCountries().catch(()=>[])
        ]);
        
        const q = searchQuery.toLowerCase();
        
        let usersList: any[] = [];
        let uvisList: any[] = [];
        let scholsList: any[] = [];
        let appsList: any[] = [];
        let docsList: any[] = [];
        let cntsList: any[] = [];
        
        users?.slice(0, 50).forEach((u:any) => {
          if (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) {
            usersList.push({ type: 'Users', title: u.name, subtitle: u.email, link: '/admin/users' });
          }
        });
        uvis?.slice(0, 50).forEach((u:any) => {
          if (u.name?.toLowerCase().includes(q)) {
            uvisList.push({ type: 'Universities', title: u.name, subtitle: u.country, link: '/admin/universities' });
          }
        });
        schols?.slice(0, 50).forEach((s:any) => {
          if (s.name?.toLowerCase().includes(q)) {
            scholsList.push({ type: 'Scholarships', title: s.name, subtitle: s.amount, link: '/admin/scholarships' });
          }
        });
        apps?.slice(0, 50).forEach((a:any) => {
          if (a.program?.toLowerCase().includes(q) || a.university?.toLowerCase().includes(q) || a.userName?.toLowerCase().includes(q)) {
            appsList.push({ type: 'Applications', title: a.program || 'Application', subtitle: a.university || a.userName, link: '/admin/applications' });
          }
        });
        docs?.slice(0, 50).forEach((d:any) => {
          if (d.title?.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q) || d.userName?.toLowerCase().includes(q)) {
            docsList.push({ type: 'Documents', title: d.title || d.name || 'Doc', subtitle: d.type || d.userName, link: '/admin/documents' });
          }
        });
        cnts?.slice(0, 50).forEach((c:any) => {
          if (c.name?.toLowerCase().includes(q)) {
            cntsList.push({ type: 'Countries', title: c.name, subtitle: c.region, link: '/admin/countries' });
          }
        });
        
        let groupedResults = [];
        if (usersList.length) groupedResults.push({ category: 'Users', items: usersList.slice(0, 3) });
        if (uvisList.length) groupedResults.push({ category: 'Universities', items: uvisList.slice(0, 3) });
        if (scholsList.length) groupedResults.push({ category: 'Scholarships', items: scholsList.slice(0, 3) });
        if (appsList.length) groupedResults.push({ category: 'Applications', items: appsList.slice(0, 3) });
        if (docsList.length) groupedResults.push({ category: 'Documents', items: docsList.slice(0, 3) });
        if (cntsList.length) groupedResults.push({ category: 'Countries', items: cntsList.slice(0, 3) });
        
        setSearchResults(groupedResults);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Countries', path: '/admin/countries', icon: MapPin },
    { name: 'Universities', path: '/admin/universities', icon: Landmark },
    { name: 'Scholarships', path: '/admin/scholarships', icon: BookOpen },
    { name: 'Applications', path: '/admin/applications', icon: FileText },
    { name: 'Documents', path: '/admin/documents', icon: Folders },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
    { name: 'AI Assistant', path: '/admin/ai', icon: Bot },
    { name: 'Analytics', path: '/admin/analytics', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-white flex flex-col shrink-0 fixed lg:static inset-y-0 left-0 z-50 transform lg:translate-x-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-800 justify-between">
          <div className="flex items-center shrink-0">
            <GraduationCap className="w-8 h-8 text-indigo-400 mr-3 shrink-0" />
            <span className="font-black text-xl leading-none tracking-tight whitespace-nowrap mt-0 pb-0 pt-0 relative -top-[1px]">GlobalGrad<span className="text-indigo-400">Admin</span></span>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 flex items-center justify-between px-4 sm:px-8 z-10 relative gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 text-slate-900" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">{navItems.find(n => location.pathname.startsWith(n.path))?.name || 'Admin Portal'}</h1>
          </div>
          
          <div className="flex-1 max-w-lg relative">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                 type="text"
                 placeholder="Search Admin..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
              {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                   <X className="w-4 h-4" />
                 </button>
              )}
            </div>

            {/* Search Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                     <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                     <div className="text-slate-500 font-medium text-sm">Searching global data...</div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                     <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                        <Search className="w-6 h-6" />
                     </div>
                     <div className="text-slate-900 font-bold mb-1">No results found</div>
                     <div className="text-slate-500 text-sm max-w-[200px]">We couldn't find anything matching "{searchQuery}"</div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((group, groupIdx) => (
                      <div key={groupIdx} className="border-b border-slate-50 last:border-0">
                         <div className="px-4 py-2 bg-slate-50/90 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-b border-slate-100/50">
                           {group.category}
                         </div>
                         {group.items.map((item: any, idx: number) => (
                           <button 
                             key={`${groupIdx}-${idx}`}
                             onClick={() => {
                               navigate(item.link);
                               setSearchQuery('');
                             }}
                             className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group/item"
                           >
                              <div>
                                <div className="font-bold text-sm text-slate-900 group-hover/item:text-indigo-600 transition-colors">{item.title}</div>
                                <div className="text-xs font-medium text-slate-500">{item.subtitle}</div>
                              </div>
                              <div className="px-2 py-1 rounded-md bg-white border border-slate-200 group-hover/item:bg-indigo-50 group-hover/item:border-indigo-100 group-hover/item:text-indigo-600 text-slate-400 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">
                                {item.type}
                              </div>
                           </button>
                         ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="flex items-center gap-4 relative">
              <AdminNotifDropdown
                 show={isNotifDropdownOpen}
                 setShow={setIsNotifDropdownOpen}
                 notifs={notifs}
                 unreadNotifs={unreadNotifs}
                 navigate={navigate}
                 handleMarkAllRead={handleMarkAllRead}
              />
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            
            <AdminProfileDropdown 
               show={isProfileDropdownOpen} 
               setShow={setIsProfileDropdownOpen} 
               userData={userData} 
               handleLogout={handleLogout} 
               navigate={navigate} 
            />
          </div>
        </div>
        
        <div className={`flex-1 relative ${(location.pathname.startsWith('/admin/messages') || location.pathname.startsWith('/admin/ai')) ? 'flex flex-col overflow-hidden' : 'p-8 overflow-y-auto'}`}>
          <Outlet />
        </div>

        {/* Global Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 text-white rounded-2xl shadow-xl font-medium tracking-tight ${toast.type === 'error' ? 'bg-rose-600 shadow-rose-900/20' : 'bg-slate-900 shadow-slate-900/20'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-white/20' : 'bg-emerald-500/20'}`}>
                {toast.type === 'error' ? <X className="w-5 h-5 text-white" /> : <Check className="w-5 h-5 text-emerald-400" />}
              </div>
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
