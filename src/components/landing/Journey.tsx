import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Globe2, BookOpen, LayoutDashboard, Rocket } from 'lucide-react';

const steps = [
  { 
    step: 1, 
    title: 'University Match', 
    desc: 'AI-driven engine that aligns your academic profile with global universities.', 
    icon: BookOpen, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    mockup: 'match',
    glowColor: 'rgba(168, 85, 247, 0.4)'
  },
  { 
    step: 2, 
    title: 'Application Pipeline', 
    desc: 'Drag-and-drop kanban board to visually manage documents, deadlines, and portals.', 
    icon: LayoutDashboard, 
    color: 'text-orange-600', 
    bg: 'bg-orange-100',
    mockup: 'kanban',
    glowColor: 'rgba(249, 115, 22, 0.4)'
  },
  { 
    step: 3, 
    title: 'Launch Preparation', 
    desc: 'Automated visa checklists and pre-departure tasks tailored to your destination.', 
    icon: Rocket, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
    mockup: 'launch',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
];

function TiltCard({ children, bgClass, glowColor }: { children: React.ReactNode, bgClass: string, glowColor: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-slate-50 border border-slate-200/60 shadow-2xl shadow-slate-300/40 relative group flex transform-gpu transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 overflow-hidden rounded-[2.5rem] p-4 md:p-8"
      style={{ perspective: "2000px" }}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      {/* Decorative center glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] blur-[80px] rounded-full opacity-10 transition-opacity duration-700 group-hover:opacity-30 pointer-events-none ${bgClass}`}></div>
      {children}
    </div>
  );
}

export function Journey() {
  return (
    <section id="journey" className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight">The Modern OS for Study Abroad</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">A beautifully designed workspace that replaces scattered spreadsheets and endless portal logins.</p>
        </div>
        
        <div className="space-y-32">
          {steps.map((item, i) => (
            <div key={i} className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
              <motion.div 
                initial={{ opacity: 0, x: i % 2 !== 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex-1"
              >
                <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-6 shadow-inner`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <div className={`text-sm font-black ${item.color} tracking-widest uppercase mb-4`}>Phase 0{item.step}</div>
                <h3 className="text-4xl font-display font-black text-slate-900 mb-6 tracking-tight">{item.title}</h3>
                <p className="text-xl text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="flex-1 w-full relative"
              >
                <TiltCard bgClass={item.mockup === 'match' ? 'bg-purple-500' : item.mockup === 'kanban' ? 'bg-orange-500' : 'bg-emerald-500'} glowColor={item.glowColor}>
                  {/* Mockups */}
                  {item.mockup === 'match' && <MatchMockup />}
                  {item.mockup === 'kanban' && <KanbanMockup />}
                  {item.mockup === 'launch' && <LaunchMockup />}
                </TiltCard>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MatchMockup() {
  return (
    <div className="relative z-10 w-full bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden transition-transform duration-500 transform">
      <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm">
        <div className="text-sm font-bold text-slate-800">University Matches</div>
        <div className="flex gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div></div>
      </div>
      <div className="p-4 space-y-3">
        {[
          { name: 'Stanford University', score: 94, status: 'High Probability', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { name: 'MIT', score: 88, status: 'Target Match', color: 'text-teal-600', bg: 'bg-teal-50' },
          { name: 'Harvard Univ.', score: 65, status: 'Reach', color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((u, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 group hover:border-indigo-200 hover:bg-slate-50 transition-all duration-300 cursor-default">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${u.bg} flex items-center justify-center font-bold ${u.color}`}>{u.score}</div>
                <div>
                  <div className="font-bold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">Computer Science MS</div>
                </div>
             </div>
             <div className={`text-xs font-bold px-2 py-1 rounded-md ${u.bg} ${u.color}`}>
               {u.status}
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KanbanMockup() {
  return (
    <div className="relative z-10 w-full bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col h-[380px] transition-transform duration-500">
      <div className="border-b border-slate-100 p-4 bg-slate-50/80 backdrop-blur-sm flex items-center">
         <div className="text-sm font-bold text-slate-800">Application Pipeline</div>
      </div>
      <div className="flex-1 overflow-hidden p-4 grid grid-cols-3 gap-3">
        {/* Column 1 */}
        <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase">Drafting (2)</div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all">
             <div className="text-sm font-bold text-slate-800 mb-1">Stanford MS CS</div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-indigo-500"></div></div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
             <div className="text-sm font-bold text-slate-800 mb-1">MIT MEng</div>
          </div>
        </div>
        {/* Column 2 */}
        <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase">Submitted (1)</div>
          <motion.div 
            animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white p-3 rounded-lg border-2 border-orange-200 shadow-md relative group cursor-pointer"
          >
             <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
             <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"></div>
             <div className="text-sm font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">Berkeley EECS</div>
             <div className="text-xs text-slate-500 font-medium">Under Review</div>
          </motion.div>
        </div>
        {/* Column 3 */}
        <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase">Accepted (1)</div>
          <div className="bg-emerald-500 p-3 rounded-lg border border-emerald-600 shadow-lg text-white hover:scale-105 transition-transform cursor-pointer">
             <div className="text-sm font-bold mb-1">CMU MS AI ✨</div>
             <div className="text-xs text-emerald-100 font-medium font-mono">Offer Valid: 14d</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LaunchMockup() {
  return (
    <div className="relative z-10 w-full bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden transition-transform duration-500">
      <div className="bg-indigo-600 p-6 flex items-center justify-between text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Next Milestone</div>
          <div className="text-xl font-bold">F-1 Visa Interview</div>
        </div>
        <div className="text-right relative z-10">
          <div className="text-4xl font-black">12</div>
          <div className="text-indigo-200 text-xs font-bold uppercase">Days Left</div>
        </div>
      </div>
      <div className="p-4 space-y-3">
         <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
           <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center shadow-inner"><svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg></div>
           <div className="text-sm font-bold text-slate-500 line-through">Pay I-901 SEVIS Fee</div>
         </div>
         <div className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-indigo-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
           <div className="w-6 h-6 rounded-md border-2 border-indigo-500 flex items-center justify-center"></div>
           <div className="text-sm font-bold text-slate-900">Book Flight Tickets</div>
           <div className="ml-auto text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded-md animate-pulse">Action Required</div>
         </div>
         <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
           <div className="w-6 h-6 rounded-md border-2 border-slate-300"></div>
           <div className="text-sm font-bold text-slate-700">Find Accommodation</div>
         </div>
      </div>
    </div>
  )
}
