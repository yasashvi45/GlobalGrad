import React, { useState } from 'react';
import { Globe2, Twitter, Linkedin, Instagram, ArrowRight, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  return (
    <footer className="bg-slate-950 pt-24 pb-12 border-t border-slate-900 leading-relaxed text-sm relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-12 lg:gap-8 mb-16">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group inline-flex shrink-0">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl leading-none tracking-tight text-white group-hover:text-indigo-400 transition-colors whitespace-nowrap mt-0 pb-0 pt-0 relative -top-[1px]">GlobalGrad</span>
            </Link>
            <p className="text-slate-400 max-w-[280px] mb-8 font-medium text-base">
              The premium OS for ambitious international students. Compare, apply, and launch your global career from one unified platform.
            </p>
            
            <div className="space-y-4">
               <h4 className="text-white font-bold tracking-wide uppercase text-xs">Join our newsletter</h4>
               <form onSubmit={handleSubscribe} className="space-y-2">
                 <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 focus-within:border-indigo-500/50 transition-colors max-w-xs">
                   <input 
                     type="email" 
                     value={email}
                     onChange={(e) => {
                       setEmail(e.target.value);
                       if (status === 'error') setStatus('idle');
                     }}
                     placeholder="student@example.com" 
                     className="bg-transparent border-none text-white focus:outline-none px-4 py-2 w-full text-sm placeholder:text-slate-600" 
                     disabled={status === 'loading' || status === 'success'}
                   />
                   <button 
                     type="submit"
                     disabled={status === 'loading' || status === 'success'}
                     className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white p-2 rounded-md transition-colors"
                   >
                     <ArrowRight className="w-4 h-4" />
                   </button>
                 </div>
                 {status === 'error' && <p className="text-red-400 text-xs">Please enter a valid email.</p>}
                 {status === 'success' && <p className="text-emerald-400 text-xs">Successfully subscribed! Check your inbox.</p>}
               </form>
            </div>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-xs">Study Destinations</h4>
            <ul className="space-y-4">
              {['USA', 'UK', 'Canada', 'Australia', 'Germany'].map(country => (
                <li key={country}>
                  <Link to="/app/countries" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform truncate">Study in {country}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-xs">Universities</h4>
            <ul className="space-y-4">
              <li><Link to="/app/universities" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Top Ranked</Link></li>
              <li><Link to="/app/universities" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Ivy League</Link></li>
              <li><Link to="/app/universities" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Russell Group</Link></li>
              <li><Link to="/app/universities" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Compare</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-xs">Scholarships</h4>
            <ul className="space-y-4">
              <li><Link to="/app/scholarships" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Fully Funded</Link></li>
              <li><Link to="/app/scholarships" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Merit-Based</Link></li>
              <li><Link to="/app/scholarships" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Need-Based</Link></li>
              <li><Link to="/app/scholarships" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Government</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-xs">Resources</h4>
            <ul className="space-y-4">
              <li><Link to="/app/documents" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Admission Essays</Link></li>
              <li><Link to="/app/documents" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">LOR Templates</Link></li>
              <li><Link to="/app/budget" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Cost Calculator</Link></li>
              <li><Link to="/app/applications" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Visa Guides</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-xs">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">About Us</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Careers</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Privacy Policy</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800/60 flex flex-col-reverse md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 font-medium text-center md:text-left">© {new Date().getFullYear()} GlobalGrad Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
             <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors transform hover:scale-110"><Linkedin className="w-5 h-5" /></a>
             <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors transform hover:scale-110"><Instagram className="w-5 h-5" /></a>
             <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors transform hover:scale-110">
               <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
             </a>
             <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors transform hover:scale-110"><Youtube className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
