import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Globe2, BookOpen, KanbanSquare, Receipt, 
  FileText, UserCircle, CreditCard, LifeBuoy, Bell, Search, 
  MessageSquare, Zap, LogOut, ChevronLeft, ChevronRight, Check, Menu, X,
  Map, Activity, ArrowLeftRight, Calendar, TrendingUp, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTable, saveToTable, deleteFromTable, listenToTable } from '@/lib/api';
import { getUniversities } from '@/services/universityService';
import { getCountries } from '@/services/countryService';
import { getScholarships } from '@/services/scholarshipService';
import { logout } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { createPortal } from 'react-dom';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
      { name: 'AI Counselor', href: '/app/ai-counselor', icon: Zap },
      { name: 'Roadmap', href: '/app/roadmap', icon: Map },
      { name: 'Activity', href: '/app/activity', icon: Activity },
    ]
  },
  {
    title: 'Planning',
    items: [
      { name: 'Countries', href: '/app/countries', icon: Globe2 },
      { name: 'Universities', href: '/app/universities', icon: BookOpen },
      { name: 'Scholarships', href: '/app/scholarships', icon: Receipt },
      { name: 'Compare', href: '/app/compare-universities', icon: ArrowLeftRight },
    ]
  },
  {
    title: 'Applications',
    items: [
      { name: 'Tracker', href: '/app/applications', icon: KanbanSquare },
      { name: 'Documents', href: '/app/documents', icon: FileText },
      { name: 'Calendar', href: '/app/calendar', icon: Calendar },
      { name: 'Analytics', href: '/app/analytics', icon: TrendingUp },
    ]
  }
];

function ProfileDropdown({ 
  show, 
  setShow, 
  userData, 
  authUser, 
  profile, 
  navigate,
  location
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
        className="flex items-center gap-2 hover:bg-slate-100 p-1 sm:p-1.5 rounded-full pr-1 sm:pr-3 transition-colors border border-transparent hover:border-slate-200 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
           <img src={profile?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent((userData?.name || 'O') + ' ' + 'U')}&background=4F46E5&color=fff`} alt="User" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-bold text-slate-900 leading-none">{userData?.name ? userData.name : 'Loading'}</p>
        </div>
      </button>

      {show && createPortal(
        <motion.div 
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 999999, position: 'fixed' }}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden outline-none text-sm"
        >
          <div className="p-4 border-b border-slate-100">
            <p className="font-bold text-slate-900 truncate">{userData?.name ? userData.name : 'Loading...'}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{authUser?.email || 'Loading...'}</p>
          </div>
          <div className="p-2 space-y-0.5 border-b border-slate-100">
            <Link onClick={() => setShow(false)} to="/app/profile" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>My Profile</Link>
          </div>
          <div className="p-2 space-y-0.5 border-b border-slate-100">
            <Link onClick={() => setShow(false)} to="/app/premium" className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/premium' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
              <span className="font-bold">Premium Plan</span>
              <Check className={`w-4 h-4 ${location.pathname === '/app/premium' ? 'text-indigo-600' : 'text-transparent'}`} />
            </Link>
            <Link onClick={() => setShow(false)} to="/app/billing" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/billing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Billing</Link>
          </div>
          <div className="p-2 space-y-0.5 border-b border-slate-100">
            <Link onClick={() => setShow(false)} to="/app/settings" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Settings</Link>
            <Link onClick={() => setShow(false)} to="/app/support" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/support' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Support</Link>
          </div>
          <div className="p-2">
             <button onClick={async () => {
                await logout();
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach((c) => {
                  document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Logged out successfully' } }));
                navigate('/login', { replace: true });
             }} className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold transition-colors">Logout</button>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, userData } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const loadNotifications = async () => {
     const data = await getTable('notifications').catch(() => []);
     setNotifs(data.filter((n:any) => n.userId === (authUser?.uid || localStorage.getItem('userId') || '1')).sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
  };

  const markAllRead = async () => {
     const unread = notifs.filter(n => !n.read);
     await Promise.all(unread.map(n => saveToTable('notifications', { ...n, read: true })));
     setNotifs(notifs.map(n => ({...n, read: true})));
     window.dispatchEvent(new Event('notifications_changed'));
  };

  const markRead = async (id: any) => {
     const n = notifs.find(n => String(n.id) === String(id));
     if (n && !n.read) {
       await saveToTable('notifications', { ...n, read: true });
       setNotifs(notifs.map(x => String(x.id) === String(id) ? {...x, read: true} : x));
       window.dispatchEvent(new Event('notifications_changed'));
     }
  };
  
  const deleteNotif = async (id: any, e: React.MouseEvent) => {
     e.stopPropagation();
     await deleteFromTable('notifications', id);
     setNotifs(notifs.filter(n => String(n.id) !== String(id)));
     window.dispatchEvent(new Event('notifications_changed'));
  };
  
  const clearAllNotifs = async () => {
     await Promise.all(notifs.map(n => deleteFromTable('notifications', n.id)));
     setNotifs([]);
     window.dispatchEvent(new Event('notifications_changed'));
  };
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showProfileM, setShowProfileM] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [toast, setToast] = useState<{message: string} | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ universities: any[], countries: any[], scholarships: any[] }>({ universities: [], countries: [], scholarships: [] });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function performSearch() {
      if (globalSearchQuery.trim() === '') {
        setSearchResults({ universities: [], countries: [], scholarships: [] });
        return;
      }
      const [u, c, s] = await Promise.all([getUniversities(), getCountries(), getScholarships()]);
      const q = globalSearchQuery.toLowerCase();
      setSearchResults({
        universities: u.filter((x:any) => x.name.toLowerCase().includes(q) || x.location?.toLowerCase().includes(q)),
        countries: c.filter((x:any) => x.name.toLowerCase().includes(q)),
        scholarships: s.filter((x:any) => x.name.toLowerCase().includes(q))
      });
    }
    performSearch();
  }, [globalSearchQuery]);

  useEffect(() => {
    async function loadUser() {
      if (!authUser) return;
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      try {
         const snap = await getDoc(doc(db, 'profiles', authUser.uid));
         if (snap.exists()) {
             setProfile({ id: snap.id, ...snap.data() });
         } else {
             setProfile(null);
         }
      } catch (e) {
         console.error(e);
         setProfile(null);
      }
    }

    const handleToast = (e: any) => {
      setToast({ message: e.detail.message });
      setTimeout(() => setToast(null), 3000);
    };

    loadUser();

    window.addEventListener('profileUpdated', loadUser);
    window.addEventListener('app_toast', handleToast);

    // Setup active listeners for saved counts & notifications
    let unsubNotifs = () => {};
    let unsubUnis = () => {};
    let unsubCountries = () => {};
    let unsubScholarships = () => {};

    if (authUser) {
      unsubNotifs = listenToTable('notifications', (data) => {
        setNotifs(data.sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
      });

      let uCount = 0;
      let cCount = 0;
      let sCount = 0;

      unsubUnis = listenToTable('universities_saved', (unis) => {
        uCount = unis.length;
        setSavedCount(uCount + cCount + sCount);
      });

      unsubCountries = listenToTable('countries_saved', (countries) => {
        cCount = countries.length;
        setSavedCount(uCount + cCount + sCount);
      });

      unsubScholarships = listenToTable('scholarships_saved', (scholars) => {
        sCount = scholars.length;
        setSavedCount(uCount + cCount + sCount);
      });
    }

    return () => {
      window.removeEventListener('profileUpdated', loadUser);
      window.removeEventListener('app_toast', handleToast);
      unsubNotifs();
      unsubUnis();
      unsubCountries();
      unsubScholarships();
    };
  }, [authUser?.uid]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileM(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen flex bg-[#FAFAFA] font-sans overflow-hidden text-slate-900">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 260
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={`bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm fixed md:relative inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0 justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <motion.span 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="ml-3 font-display font-black text-xl leading-none tracking-tight text-slate-900 whitespace-nowrap mt-0 pb-0 pt-0 relative -top-[1px]"
              >
                GlobalGrad
              </motion.span>
            )}
          </div>
          {/* Mobile close button */}
          <button 
            className="md:hidden text-slate-500 hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-24 w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors z-30"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        
        <nav className="flex-1 overflow-y-auto w-full py-6 px-4 space-y-8 scrollbar-hide">
          {navGroups.map((group, i) => (
            <div key={i}>
              {(!isCollapsed || isMobileMenuOpen) && (
                <div className="px-3 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {group.title}
                </div>
              )}
              {(isCollapsed && !isMobileMenuOpen) && <div className="h-4 border-b border-slate-100 mb-4 mx-4"></div>}
              <div className="space-y-1 w-full">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group w-full ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                      <>
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
                        {(!isCollapsed || isMobileMenuOpen) && <span>{item.name}</span>}
                        {isActive && (!isCollapsed || isMobileMenuOpen) && (
                          <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-md top-1/2 -translate-y-1/2" />
                        )}
                        {/* Tooltip for collapsed state */}
                        {(isCollapsed && !isMobileMenuOpen) && (
                          <div className="absolute left-14 invisible group-hover:visible bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-xl z-50">
                            {item.name}
                            <div className="absolute top-1/2 -translate-y-1/2 -left-1 border-4 border-transparent border-r-slate-900" />
                          </div>
                        )}
                      </>
                  </Link>
                )})}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 w-full">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          {mobileSearchOpen ? (
            <div className="flex items-center gap-3 w-full animate-in fade-in duration-200">
              <button 
                onClick={() => {
                  setMobileSearchOpen(false);
                  setGlobalSearchQuery('');
                }}
                className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  autoFocus
                  className="pl-10 pr-4 h-10 rounded-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 w-full" 
                  placeholder="Search countries, universities, scholarships..." 
                />
                
                <AnimatePresence>
                  {globalSearchQuery.trim() !== '' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 p-2 max-h-[60vh] overflow-y-auto"
                    >
                      {searchResults.universities?.length > 0 && (
                         <div className="mb-2">
                           <div className="px-3 py-1 font-bold text-xs text-indigo-500">Universities</div>
                           {searchResults.universities.slice(0,3).map(u => (
                             <NavLink key={u.id} to={`/app/universities/${u.id}`} onClick={() => { setMobileSearchOpen(false); setGlobalSearchQuery(''); }} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                               <img src={u.image} alt={u.name} className="w-8 h-8 rounded object-cover" />
                               <span className="text-sm font-bold text-slate-900 truncate">{u.name}</span>
                             </NavLink>
                           ))}
                         </div>
                      )}
                      {searchResults.countries?.length > 0 && (
                         <div className="mb-2">
                           <div className="px-3 py-1 font-bold text-xs text-indigo-500">Countries</div>
                           {searchResults.countries.slice(0,3).map(c => (
                             <NavLink key={c.id} to={`/app/countries/${c.id}`} onClick={() => { setMobileSearchOpen(false); setGlobalSearchQuery(''); }} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                               <img src={c.image} alt={c.name} className="w-8 h-8 rounded object-cover" />
                               <span className="text-sm font-bold text-slate-900 truncate">{c.name}</span>
                             </NavLink>
                           ))}
                         </div>
                      )}
                      {searchResults.scholarships?.length > 0 && (
                         <div className="mb-2">
                           <div className="px-3 py-1 font-bold text-xs text-indigo-500">Scholarships</div>
                           {searchResults.scholarships.slice(0,3).map(s => (
                             <NavLink key={s.id} to={`/app/scholarships/${s.id}`} onClick={() => { setMobileSearchOpen(false); setGlobalSearchQuery(''); }} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                               <Receipt className="w-6 h-6 text-emerald-500 p-1 bg-emerald-50 rounded" />
                               <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-slate-900 leading-tight truncate">{s.name}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{s.university || s.provider}</div>
                               </div>
                             </NavLink>
                           ))}
                         </div>
                      )}
                      {Object.values(searchResults).every((arr: any) => arr?.length === 0) && (
                         <div className="px-3 py-6 text-center text-slate-500 text-sm font-medium">No results found for "{globalSearchQuery}"</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center shrink-0"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="w-full max-w-[200px] sm:max-w-xs lg:w-96 relative hidden sm:block group">
                  <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <Input 
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    className="pl-10 h-10 rounded-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800 w-full" 
                    placeholder="Search..." 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex gap-1">
                    <kbd className="hidden sm:inline-block border border-slate-300 rounded bg-white px-1.5 text-[10px] font-medium text-slate-500 shadow-sm">⌘</kbd>
                    <kbd className="hidden sm:inline-block border border-slate-300 rounded bg-white px-1.5 text-[10px] font-medium text-slate-500 shadow-sm">K</kbd>
                  </div>

                  <AnimatePresence>
                    {searchFocused && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-14 left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 p-2 max-h-[70vh] overflow-y-auto"
                      >
                        {globalSearchQuery.trim() === '' ? (
                          <>
                            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Quick Actions</div>
                            <NavLink to="/app/universities" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                               <BookOpen className="w-4 h-4 text-indigo-500" />
                               <span className="text-sm font-bold text-slate-900">Explore Universities</span>
                            </NavLink>
                            <NavLink to="/app/scholarships" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                               <Receipt className="w-4 h-4 text-emerald-500" />
                               <span className="text-sm font-bold text-slate-900">Find Scholarships</span>
                            </NavLink>
                            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Recent Searches</div>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left" onClick={() => setGlobalSearchQuery('Stanford')}>
                               <Search className="w-4 h-4 text-slate-400" />
                               <span className="text-sm font-medium text-slate-600">Stanford MS CS...</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left" onClick={() => setGlobalSearchQuery('UK')}>
                               <Search className="w-4 h-4 text-slate-400" />
                               <span className="text-sm font-medium text-slate-600">UK Post-Study...</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Search Results</div>
                            {searchResults.universities?.length > 0 && (
                               <div className="mb-2">
                                 <div className="px-3 py-1 font-bold text-xs text-indigo-500">Universities</div>
                                 {searchResults.universities.slice(0,3).map(u => (
                                   <NavLink key={u.id} to={`/app/universities/${u.id}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                                     <img src={u.image} alt={u.name} className="w-8 h-8 rounded object-cover" />
                                     <span className="text-sm font-bold text-slate-900">{u.name}</span>
                                   </NavLink>
                                 ))}
                               </div>
                            )}
                            {searchResults.countries?.length > 0 && (
                               <div className="mb-2">
                                 <div className="px-3 py-1 font-bold text-xs text-indigo-500">Countries</div>
                                 {searchResults.countries.slice(0,3).map(c => (
                                   <NavLink key={c.id} to={`/app/countries/${c.id}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                                     <img src={c.image} alt={c.name} className="w-8 h-8 rounded object-cover" />
                                     <span className="text-sm font-bold text-slate-900">{c.name}</span>
                                   </NavLink>
                                 ))}
                               </div>
                            )}
                            {searchResults.scholarships?.length > 0 && (
                               <div className="mb-2">
                                 <div className="px-3 py-1 font-bold text-xs text-indigo-500">Scholarships</div>
                                 {searchResults.scholarships.slice(0,3).map(s => (
                                   <NavLink key={s.id} to={`/app/scholarships/${s.id}`} onClick={() => setSearchFocused(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                                     <Receipt className="w-6 h-6 text-emerald-500 p-1 bg-emerald-50 rounded" />
                                     <div>
                                        <div className="text-sm font-bold text-slate-900 leading-tight">{s.name}</div>
                                        <div className="text-[10px] text-slate-500">{s.university || s.provider}</div>
                                     </div>
                                   </NavLink>
                                 ))}
                               </div>
                            )}
                            {Object.values(searchResults).every((arr: any) => arr?.length === 0) && (
                               <div className="px-3 py-6 text-center text-slate-500 text-sm font-medium">No results found for "{globalSearchQuery}"</div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto shrink-0 select-none">
                <button 
                  onClick={() => setMobileSearchOpen(true)}
                  className="sm:hidden w-10 h-10 rounded-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors shrink-0"
                >
                  <Search className="w-5 h-5" />
                </button>

                <Link 
                  to="/app/saved" 
                  className="relative w-10 h-10 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  {savedCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] items-center justify-center rounded-full flex font-bold border border-white">
                      {savedCount}
                    </span>
                  )}
                </Link>

                <Link to="/app/messages" className="hidden sm:flex relative w-10 h-10 rounded-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </Link>
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border relative ${showNotifications ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                {unreadCount > 0 && (
                   <div className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-50 animate-pulse"></div>
                )}
                <Bell className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop cover for mobile bottom-sheet only */}
                    <div 
                      className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    <motion.div 
                      key="notif-box"
                      initial={window.innerWidth < 640 ? { y: "100%" } : { opacity: 0, y: 10, scale: 0.95 }}
                      animate={window.innerWidth < 640 ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={window.innerWidth < 640 ? { y: "100%" } : { opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                      className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-white rounded-t-3xl shadow-2xl z-50 sm:absolute sm:bottom-auto sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-80 sm:max-h-[420px] sm:rounded-2xl sm:border sm:border-slate-200 flex flex-col overflow-hidden outline-none"
                    >
                      {/* Drag handle line visual on mobile */}
                      <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 shrink-0 sm:hidden" />

                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Notifications</h3>
                          <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                               <button onClick={markAllRead} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Mark all read</button>
                            )}
                            {notifs.length > 0 && (
                               <button onClick={clearAllNotifs} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Clear all</button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-y-auto flex-1 min-h-0 sm:max-h-80">
                        {notifs.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm font-medium">You have no notifications.</div>
                        ) : (
                          notifs.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => {
                                markRead(notif.id);
                                if (window.innerWidth < 640) {
                                  setShowNotifications(false);
                                }
                              }} 
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                            >
                              <div className="flex gap-3 items-start">
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-sm font-semibold text-slate-900 mb-0.5 leading-snug">{notif.title}</p>
                                   <p className="text-xs text-slate-500 mb-1 leading-normal">{notif.desc}</p>
                                   <p className="text-[10px] font-semibold uppercase text-slate-400">{notif.time || new Date(notif.date).toLocaleDateString()}</p>
                                </div>
                                <button 
                                  onClick={(e) => deleteNotif(notif.id, e)} 
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center px-4 shrink-0">
                         <Link to="/app/settings?tab=notifications" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Settings</Link>
                         <Link to="/app/notifications" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">View All Notifications</Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileM(!showProfileM)}
                className="flex items-center gap-2 hover:bg-slate-100 p-1 sm:p-1.5 rounded-full pr-1 sm:pr-3 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                   <img src={profile?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent((userData?.name || 'Student') + ' ' + 'User')}&background=4F46E5&color=fff`} alt="User" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-900 leading-none">{userData?.name ? userData.name : 'Student'}</p>
                </div>
              </button>

              <AnimatePresence>
                {showProfileM && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden outline-none text-sm z-[9999]"
                  >
                    <div className="p-4 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{userData?.name ? userData.name : 'Student'}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{authUser?.email || 'Loading...'}</p>
                    </div>
                    <div className="p-2 space-y-0.5 border-b border-slate-100">
                      <Link onClick={() => setShowProfileM(false)} to="/app/profile" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>My Profile</Link>
                    </div>
                    <div className="p-2 space-y-0.5 border-b border-slate-100">
                      <Link onClick={() => setShowProfileM(false)} to="/app/premium" className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/premium' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                        <span className="font-bold">Premium Plan</span>
                        <Check className={`w-4 h-4 ${location.pathname === '/app/premium' ? 'text-indigo-600' : 'text-transparent'}`} />
                      </Link>
                      <Link onClick={() => setShowProfileM(false)} to="/app/billing" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/billing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Billing</Link>
                    </div>
                    <div className="p-2 space-y-0.5 border-b border-slate-100">
                      <Link onClick={() => setShowProfileM(false)} to="/app/settings" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Settings</Link>
                      <Link onClick={() => setShowProfileM(false)} to="/app/support" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${location.pathname === '/app/support' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Support</Link>
                    </div>
                    <div className="p-2">
                       <button onClick={async () => {
                          setShowProfileM(false);
                          await logout();
                          localStorage.clear();
                          sessionStorage.clear();
                          document.cookie.split(";").forEach((c) => {
                            document.cookie = c
                              .replace(/^ +/, "")
                              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                          });
                          window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: 'Logged out successfully' } }));
                          navigate('/login', { replace: true });
                       }} className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold transition-colors">Logout</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col">
          <Outlet />
        </div>

        {/* Global Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 font-medium tracking-tight"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


