import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect } from 'react';

function CountUp({ end, suffix = "", prefix = "", duration = 2 }: { end: number, suffix?: string, prefix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // ease out quartile
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        }
      };
      requestAnimationFrame(animateCount);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const stats = [
  { value: 1500, suffix: "+", label: 'Universities Tracked' },
  { value: 12000, suffix: "+", label: 'Scholarships Indexed' },
  { value: 35, suffix: "+", label: 'Countries Supported' },
  { value: 50, suffix: "K+", label: 'Students Planned' },
];

export function Stats() {
  return (
    <section className="py-24 bg-white border-y border-slate-100 relative overflow-hidden">
      <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              className="text-center group relative p-6 rounded-3xl hover:bg-slate-50 transition-colors duration-500"
            >
              <div className="absolute inset-0 bg-indigo-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              
              <div className="relative z-10 text-4xl md:text-5xl lg:text-6xl font-display font-black text-slate-900 mb-3 tracking-tighter group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-teal-500 transition-all duration-500 transform group-hover:scale-110">
                 <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="relative z-10 text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
