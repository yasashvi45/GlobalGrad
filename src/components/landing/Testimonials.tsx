import { motion } from 'motion/react';
import { Star, ShieldCheck, Award, CheckCircle2 } from 'lucide-react';

const testimonials = [
  { 
    name: 'Sarah Chen', 
    uni: 'Stanford University', 
    country: '🇺🇸', 
    role: 'MS Computer Science', 
    content: 'GlobalGrad\'s application board completely removed my stress. Seeing all deadlines in one kanban view was a game changer for my Stanford application.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    status: 'Accepted'
  },
  { 
    name: 'David Okafor', 
    uni: 'University of Toronto', 
    country: '🇨🇦', 
    role: 'MEng Data Science', 
    content: 'The PR scoring metric helped me choose Canada over the UK. The platform\'s deep analytics on post-study work visas is unmatched.',
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=150',
    status: 'Visa Approved'
  },
  { 
    name: 'Priya Sharma', 
    uni: 'Technical University Munich', 
    country: '🇩🇪', 
    role: 'Robotics Engineering', 
    content: 'Finding zero-tuition programs in Germany would have taken me months without GlobalGrad\'s intelligent matching engine.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    status: 'Enrolled'
  },
  { 
    name: 'James Wilson', 
    uni: 'University of Melbourne', 
    country: '🇦🇺', 
    role: 'MBA', 
    content: 'From comparing cost of living to tracking my visa application, this platform acted as my personal admissions consultant.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    status: 'Accepted'
  },
  { 
    name: 'Maria Garcia', 
    uni: 'NUS', 
    country: '🇸🇬', 
    role: 'Finance', 
    content: 'The scholarship matching alone saved me thousands. The UI is incredibly intuitive and practically designed for ambitious students.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    status: 'Scholarship Awarded'
  },
];

export function Testimonials() {
  return (
    <section className="py-32 bg-slate-900 border-t border-slate-800 overflow-hidden relative">
      {/* Background glowing effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 tracking-tight">Wall of Success</h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">Join the ranks of students who leveraged GlobalGrad to secure their future at top global institutions.</p>
      </div>

      <div className="relative flex overflow-x-hidden w-full pb-10">
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex w-max animate-slide hover-pause gap-6 px-6 cursor-grab active:cursor-grabbing">
          {/* Double array for seamless loop */}
          {[...testimonials, ...testimonials].map((t, i) => (
             <div key={i} className="min-w-[400px] max-w-[400px] bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/60 hover:bg-slate-800/80 transition-colors shadow-2xl flex flex-col group hover:-translate-y-1 transform-gpu duration-300 relative overflow-hidden">
               
               {/* Decorative subtle gradient top border */}
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

               <div className="flex items-center justify-between mb-6">
                 <div className="flex text-amber-400">
                   {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current drop-shadow-sm" />)}
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">{t.status}</span>
                 </div>
               </div>
               
               <p className="text-slate-300 text-lg leading-relaxed mb-8 flex-1 font-medium tracking-tight">"{t.content}"</p>
               
               <div className="flex items-center gap-4 border-t border-slate-700/60 pt-6">
                 <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-indigo-500 to-purple-500">
                    <img src={t.avatar} className="w-full h-full object-cover rounded-full border-2 border-slate-800" alt={t.name} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-slate-800 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                 </div>
                 <div>
                   <h4 className="text-white font-bold tracking-tight text-lg flex items-center gap-2">
                     {t.name} <span className="text-sm border border-slate-600 bg-slate-700 px-1 rounded shadow-sm">{t.country}</span>
                   </h4>
                   <p className="text-sm text-slate-400 font-medium">{t.role} • <span className="text-indigo-300">{t.uni}</span></p>
                 </div>
               </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
}
