import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, PlaneTakeoff } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useRef, useState } from 'react';

export function CTA() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <section className="py-32 bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 max-w-[100vw] overflow-hidden">
        <motion.div 
           animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 blur-3xl opacity-50"
        ></motion.div>
        <div className="absolute right-0 bottom-0 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 w-full">
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden group"
        >
          {/* Spotlight mouse effect */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.08), transparent 40%)`
            }}
          />

          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-8 relative">
            <PlaneTakeoff className="w-10 h-10 text-white" />
            <div className="absolute inset-0 border-[3px] border-indigo-400 rounded-2xl animate-ping opacity-30"></div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-6 tracking-tight drop-shadow-lg relative z-10">
            Ready to change your coordinates?
          </h2>
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium relative z-10">
            Join the premium platform built for ambitious students. One workspace for your entire global journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
            <div className="relative group">
              {/* Outer button pulse glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
              <Button size="lg" asChild className="relative h-16 px-10 text-lg bg-white text-slate-900 hover:bg-slate-50 transition-all hover:scale-105 rounded-2xl">
                <Link to="/signup">
                  Start Building Free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-slate-500 mt-6 font-medium relative z-10">No credit card required. Cancel anytime.</p>
        </div>
      </div>
    </section>
  );
}
