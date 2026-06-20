import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Plane, BookOpen, Briefcase, GraduationCap, DollarSign, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function USAFlag() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-2xl font-bold select-none rounded-full shadow-inner">
        🇺🇸
      </div>
    );
  }

  return (
    <img
      src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.4.3/flags/4x3/us.svg"
      className="w-full h-full object-cover rounded-full shadow-inner"
      alt="USA Flag"
      referrerPolicy="no-referrer"
      onError={() => {
        console.warn("USA Flag SVG asset failed to load, falling back to emoji.");
        setHasError(true);
      }}
    />
  );
}

function DynamicScoreCards() {
  const matchDataSequence = [
    { score: 98, uni: 'Stanford MS' },
    { score: 92, uni: 'MIT MEng' },
    { score: 85, uni: 'Harvard' },
    { score: 95, uni: 'Oxford' }
  ];
  
  const visaDataSequence = [
    { status: 'F-1 Student', country: 'USA' },
    { status: 'Tier 4', country: 'UK' },
    { status: 'Study Permit', country: 'Canada' }
  ];

  const fundingDataSequence = [
    { amt: '$15k', type: 'Merit' },
    { amt: '£10k', type: 'Grant' },
    { amt: '$25k', type: 'Fellowship' }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const int = setInterval(() => {
      setActiveIndex(prev => (prev + 1));
    }, 4000);
    return () => clearInterval(int);
  }, []);

  const match = matchDataSequence[activeIndex % matchDataSequence.length];
  const visa = visaDataSequence[activeIndex % visaDataSequence.length];
  const funding = fundingDataSequence[activeIndex % fundingDataSequence.length];

  return (
    <>
      <motion.div 
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 -right-4 sm:-right-20 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-indigo-100 flex items-center gap-2 sm:gap-4 z-20"
      >
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
          <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="pr-1 sm:pr-2 min-w-[90px]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Match Score</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={match.uni}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-semibold text-slate-700 leading-tight">{match.uni}</p>
              <p className="text-sm sm:text-lg font-black text-slate-900 border-b border-indigo-500/30 inline-block pb-0.5">{match.score}% Fit</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-16 -left-4 sm:-left-20 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-teal-100 flex flex-col gap-1 sm:gap-2 z-20 min-w-[140px] sm:min-w-[180px]"
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-100 flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
          </div>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded">Approved</span>
        </div>
        <div className="min-h-[40px]">
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 sm:mt-2">Visa Status</p>
          <AnimatePresence mode="wait">
             <motion.div
                key={visa.status}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5"
             >
                <p className="text-xs sm:text-sm font-black text-slate-900">{visa.status}</p>
                <span className="text-[10px] text-slate-400 font-medium">{visa.country}</span>
             </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-6 right-0 sm:-right-10 bg-white/95 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-xl border border-amber-100 flex justify-between items-center z-20 min-w-[170px] sm:min-w-[200px]"
      >
        <div className="flex items-center gap-2 sm:gap-3 hide-overflow w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex justify-center items-center flex-shrink-0">
             <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600"/>
          </div>
          <div className="min-w-[120px]">
             <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase">Funding Awarded</p>
             <AnimatePresence mode="wait">
               <motion.div
                  key={funding.amt}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
               >
                 <p className="text-xs sm:text-sm font-black text-slate-900">{funding.amt} / Year</p>
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function AIStudyAbroadIllustration() {
  return (
    <div className="relative w-full h-full bg-[#0F172A] flex items-center justify-center overflow-hidden">
      {/* Dynamic Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-40"></div>
      
      {/* Glowing Core Radial Orbs */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-75"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-150"></div>

      {/* SVG Network Visualizer */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="indigoTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.85" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Constellation Connection Paths */}
        <motion.path
          d="M 200 200 Q 110 140 80 180"
          fill="none"
          stroke="url(#indigoTeal)"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M 200 200 Q 280 110 320 150"
          fill="none"
          stroke="url(#indigoTeal)"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, 20] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M 200 200 Q 140 280 110 320"
          fill="none"
          stroke="url(#indigoTeal)"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -30] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M 200 200 Q 290 280 300 220"
          fill="none"
          stroke="url(#indigoTeal)"
          strokeWidth="2"
          strokeDasharray="5 5"
          animate={{ strokeDashoffset: [0, 25] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbit Matching Lines */}
        <motion.circle
          cx="200"
          cy="200"
          r="80"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="1.5"
          strokeOpacity="0.35"
          style={{ transformOrigin: '200px 200px' }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="200"
          cy="200"
          r="110"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="1.2"
          strokeOpacity="0.25"
          strokeDasharray="8 6"
          style={{ transformOrigin: '200px 200px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Ambient Particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.circle
            key={`particle-${i}`}
            r={Math.random() * 1.5 + 0.5}
            fill="#fff"
            opacity={0.3}
            initial={{ cx: 200 + (Math.random() - 0.5) * 240, cy: 200 + (Math.random() - 0.5) * 240 }}
            animate={{ 
              y: [0, -40 - Math.random() * 40], 
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 4
            }}
          />
        ))}

        {/* Signal pulses along paths */}
        <motion.circle
          r="4.5"
          fill="#14b8a6"
          filter="url(#glow)"
          animate={{
            cx: [200, 110, 80],
            cy: [200, 140, 180],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          r="4.5"
          fill="#a855f7"
          filter="url(#glow)"
          animate={{
            cx: [200, 280, 320],
            cy: [200, 110, 150],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        {/* Outer Node Anchors */}
        <g transform="translate(80, 180)">
          <circle r="7" fill="#6366f1" filter="url(#glow)" />
          <circle r="14" fill="none" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.5" />
        </g>
        <g transform="translate(320, 150)">
          <circle r="7" fill="#a855f7" filter="url(#glow)" />
          <circle r="14" fill="none" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.5" />
        </g>
        <g transform="translate(300, 220)">
          <circle r="6" fill="#14b8a6" filter="url(#glow)" />
          <circle r="12" fill="none" stroke="#14b8a6" strokeWidth="1" strokeOpacity="0.5" />
        </g>
        <g transform="translate(110, 320)">
          <circle r="6" fill="#f59e0b" filter="url(#glow)" />
          <circle r="12" fill="none" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" />
        </g>
      </svg>

      {/* Floating Holographic Central Core */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-teal-400 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-white/20 relative"
        >
          <GraduationCap className="w-9 h-9 text-white" />
          <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 rounded-full p-1 shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
        </motion.div>
        
        {/* Match label visual */}
        <div className="mt-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
          <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">AI Study Abroad</span>
        </div>
        
        <p className="text-[11px] text-slate-400 mt-2.5 font-mono max-w-[160px] leading-tight">
          optimizing admissions paths...
        </p>
      </div>

      <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[8px] font-mono text-slate-500 pointer-events-none select-none">
        <span>MODEL::GGRAD_MATCH_v2</span>
        <span>LATENCY::9ms</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative pt-20 pb-20 md:pt-16 lg:pt-12 md:pb-32 overflow-hidden bg-[#FAFAFA]">
      <div className="absolute inset-0 max-w-[100vw] overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-gradient-to-l from-indigo-100/50 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 mix-blend-multiply"></div>
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-[100px]"></div>
         <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 max-w-2xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-sm font-semibold mb-6 shadow-sm backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            GlobalGrad 2.0 is now live
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
            Your admission to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500">top universities</span> starts here.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-medium">
            Streamline your global education journey. Let our AI align your profile with elite institutions, uncover hidden scholarships, and guide your visa prep step-by-step.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Button size="lg" asChild className="h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-1 transition-all duration-300">
              <Link to="/signup">
                Start Building Your Profile <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-300">
              <Link to="/app/universities">Explore Universities</Link>
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
               <div className="flex -space-x-2">
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative" style={{ zIndex: 10 - i }}>
                     <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                   </div>
                 ))}
               </div>
               <span className="ml-2">Trusted by 10,000+ students</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="hidden sm:flex items-center gap-1.5">
               <div className="flex text-amber-400">
                 {Array.from({ length: 5 }).map((_, i) => (
                   <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                 ))}
               </div>
               <span>4.9/5 Rating</span>
            </div>
          </div>
        </motion.div>
        
        {/* Right side graphical showcase */}
        <div className="flex-1 w-full max-w-lg relative lg:h-[600px] flex items-center justify-center overflow-x-visible">
          
          {/* Animated Glass Circle Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[400px] md:h-[400px] flex items-center justify-center scale-[0.83] xs:scale-[0.9] sm:scale-100 origin-center transition-all"
          >
             {/* Gradient Aura */}
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
             
             {/* Orbiting Rings */}
             <div className="absolute inset-[-20px] sm:inset-[-40px] rounded-full border-[1.5px] border-indigo-200/40 animate-[spin_40s_linear_infinite]"></div>
             <div className="absolute inset-[-40px] sm:inset-[-80px] rounded-full border border-teal-100/30 animate-[spin_60s_linear_infinite_reverse]"></div>
             
             {/* Central Premium Vector Artwork Layer */}
             <div className="relative w-full h-full rounded-full border-[6px] border-white/40 shadow-[inset_0_4px_40px_rgba(255,255,255,0.4),0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden z-10 bg-[#0F172A]">
                <AIStudyAbroadIllustration />
             </div>
 
              {/* Floating UI Elements / Cards */}
              <DynamicScoreCards />
 
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/4 left-2 sm:left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-full shadow-xl flex items-center justify-center p-2 sm:p-2.5 z-10 border border-slate-100"
              >
                <USAFlag />
              </motion.div>
              
           </motion.div>
         </div>
       </div>
     </section>
   );
 }
