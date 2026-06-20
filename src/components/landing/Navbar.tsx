import { motion, useScroll, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Globe2, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkSection, setIsDarkSection] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['countries', 'universities', 'scholarships', 'journey'];
      let currentSection = '';
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);

      const elAtCenter = document.elementFromPoint(window.innerWidth / 2, 40);
      if (elAtCenter) {
        const closestDark = elAtCenter.closest('.dark-section, .bg-slate-900, .bg-slate-950');
        setIsDarkSection(!!closestDark);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      if (isMobileMenuOpen) {
        closeMobileMenu();
      }
    } else {
      if (isMobileMenuOpen) closeMobileMenu();
    }
  };

  const navLinks = [
    { href: '#countries', label: 'Destinations' },
    { href: '/app/universities', label: 'Universities' },
    { href: '#journey', label: 'Platform Tour' }
  ];

  const mobileNavLinks = [
    { href: '/', label: 'Home' },
    { href: '#countries', label: 'Destinations' },
    { href: '/app/universities', label: 'Universities' },
    { href: '/app/scholarships', label: 'Scholarships' },
    { href: '#journey', label: 'Platform Tour' }
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
          isScrolled 
            ? isDarkSection && !isMobileMenuOpen
              ? "bg-slate-900/80 backdrop-blur-xl border-slate-800" 
              : "bg-white/75 backdrop-blur-xl border-slate-200"
            : isMobileMenuOpen 
              ? "bg-white border-slate-200"
              : "bg-transparent border-transparent pt-4"
        )}
      >
        <div 
          className={cn(
            "max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 px-6",
            isScrolled || isMobileMenuOpen ? "py-4" : "py-2"
          )}
        >
        <Link to="/" className="flex items-center gap-2 group shrink-0" onClick={closeMobileMenu}>
          <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <span className={cn(
            "font-display font-bold text-xl leading-none tracking-tight transition-colors duration-300 whitespace-nowrap mt-0 pb-0 pt-0 relative -top-[1px]",
             (isDarkSection && !isMobileMenuOpen) ? "text-white" : "text-slate-900",
             !(isDarkSection && !isMobileMenuOpen) && "group-hover:text-indigo-600"
          )}>
            GlobalGrad
          </span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
             const isActive = activeSection === link.href.substring(1);
             const isHash = link.href.startsWith('#');
             const content = (
               <>
                 {link.label}
                 {isActive && (
                   <motion.div 
                     layoutId="activeSection"
                     className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-500 rounded-full"
                   />
                 )}
               </>
             );
             
             if (isHash) {
               return (
                 <a 
                   key={link.href}
                   href={link.href}
                   onClick={(e) => handleNavClick(e, link.href)}
                   className={cn(
                     "text-sm font-semibold transition-colors duration-300 relative py-1",
                     isDarkSection 
                        ? (isActive ? "text-white" : "text-slate-400 hover:text-white") 
                        : (isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600")
                   )}
                 >
                   {content}
                 </a>
               );
             } else {
               return (
                 <Link 
                   key={link.href}
                   to={link.href}
                   onClick={closeMobileMenu}
                   className={cn(
                     "text-sm font-semibold transition-colors duration-300 relative py-1",
                     isDarkSection 
                        ? (isActive ? "text-white" : "text-slate-400 hover:text-white") 
                        : (isActive ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600")
                   )}
                 >
                   {content}
                 </Link>
               );
             }
          })}
        </nav>
          
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" asChild className={cn(
               "transition-colors",
               isDarkSection ? "text-slate-300 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            )}>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className={cn(
               "transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group",
               isDarkSection ? "bg-white text-slate-900 hover:bg-slate-100 shadow-white/10" : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 hover:shadow-lg"
            )}>
              <Link to="/signup">
                 <span className="relative z-10">Start Free</span>
                 <div className="absolute inset-0 bg-white/20 -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-out]"></div>
              </Link>
            </Button>
          </div>

          <button 
            className="lg:hidden p-2 -mr-2 text-slate-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen 
              ? <X className="w-6 h-6" /> 
              : <Menu className={cn("w-6 h-6", (isDarkSection && !isMobileMenuOpen) ? "text-white" : "text-slate-900")} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[73px] bg-white border-b border-slate-200 shadow-2xl z-40 lg:hidden overflow-hidden flex flex-col max-h-[calc(100vh-73px)]"
          >
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <nav className="flex flex-col gap-4">
                {mobileNavLinks.map((link) => {
                  const isHash = link.href.startsWith('#');
                  if (isHash) {
                    return (
                      <a 
                        key={link.href}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className="text-lg font-bold text-slate-800 hover:text-indigo-600 py-2 border-b border-slate-100 last:border-0"
                      >
                        {link.label}
                      </a>
                    );
                  } else {
                    return (
                      <Link 
                        key={link.href}
                        to={link.href}
                        onClick={closeMobileMenu}
                        className="text-lg font-bold text-slate-800 hover:text-indigo-600 py-2 border-b border-slate-100 last:border-0"
                      >
                        {link.label}
                      </Link>
                    );
                  }
                })}
              </nav>
              <div className="flex flex-col gap-3 mt-4">
                <Button variant="outline" asChild className="w-full h-12 text-base justify-center">
                  <Link to="/login" onClick={closeMobileMenu}>Sign In</Link>
                </Button>
                <Button asChild className="w-full h-12 text-base justify-center bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link to="/signup" onClick={closeMobileMenu}>Start Free</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
