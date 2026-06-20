import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Plane, Briefcase, Award, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const countries = [
  {
    name: 'USA',
    flag: '🇺🇸',
    image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'usa',
    tuition: '$35k - $70k',
    salary: '$95k Avg',
    prScore: '4.5/10',
    visa: 'OPT 1-3 Yrs',
    cities: 'NYC, Boston',
    id: 'usa'
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'uk',
    tuition: '£15k - £35k',
    salary: '£35k Avg',
    prScore: '6.5/10',
    visa: 'PSW 2 Yrs',
    cities: 'London, Edinburgh',
    id: 'uk'
  },
  {
    name: 'Canada',
    flag: '🇨🇦',
    image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'canada',
    tuition: '$20k - $40k CAD',
    salary: '$65k CAD Avg',
    prScore: '9.5/10',
    visa: 'PGWP 3 Yrs',
    cities: 'Toronto, Vancouver',
    id: 'canada'
  },
  {
    name: 'Australia',
    flag: '🇦🇺',
    image: 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f1?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'australia',
    tuition: '$30k - $50k AUD',
    salary: '$75k AUD Avg',
    prScore: '8.5/10',
    visa: 'PSW 2-4 Yrs',
    cities: 'Sydney, Melbourne',
    id: 'australia'
  },
  {
    name: 'Germany',
    flag: '🇩🇪',
    image: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'germany',
    tuition: '€0 - €3k',
    salary: '€55k Avg',
    prScore: '8.0/10',
    visa: 'Job Seeker 1.5 Yrs',
    cities: 'Berlin, Munich',
    id: 'germany'
  },
  {
    name: 'Ireland',
    flag: '🇮🇪',
    image: 'https://images.unsplash.com/photo-1564959130747-897fb406b9af?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'ireland',
    tuition: '€12k - €25k',
    salary: '€45k Avg',
    prScore: '7.5/10',
    visa: 'PSW 2 Yrs',
    cities: 'Dublin, Cork',
    id: 'ireland'
  },
  {
    name: 'New Zealand',
    flag: '🇳🇿',
    image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'new-zealand',
    tuition: '$25k - $40k NZD',
    salary: '$60k NZD Avg',
    prScore: '8.5/10',
    visa: 'PSW 3 Yrs',
    cities: 'Auckland',
    id: 'new-zealand'
  },
  {
    name: 'France',
    flag: '🇫🇷',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'france',
    tuition: '€3k - €15k',
    salary: '€40k Avg',
    prScore: '7.0/10',
    visa: 'APS 1-2 Yrs',
    cities: 'Paris, Lyon',
    id: 'france'
  },
  {
    name: 'Netherlands',
    flag: '🇳🇱',
    image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&q=80&w=1200',
    fallbackId: 'netherlands',
    tuition: '€10k - €20k',
    salary: '€45k Avg',
    prScore: '7.5/10',
    visa: 'Search Year',
    cities: 'Amsterdam',
    id: 'netherlands'
  }
];

function DestinationImage({ src, alt, fallbackId }: { src: string, alt: string, fallbackId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fallback URLs if the primary Unsplash image fails
  const fallbacks: Record<string, string> = {
    'usa': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800',
    'uk': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
    'canada': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    'australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&q=80&w=800',
    'germany': 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&q=80&w=800',
    'ireland': 'https://images.unsplash.com/photo-1590089415225-401cf6ec9a74?auto=format&fit=crop&q=80&w=800',
    'new-zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&q=80&w=800',
    'france': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    'netherlands': 'https://images.unsplash.com/photo-1616091216791-a675f4d1e292?auto=format&fit=crop&q=80&w=800',
  };

  const currentSrc = hasError ? (fallbacks[fallbackId] || fallbacks['usa']) : src;

  return (
    <div className="absolute inset-0 bg-slate-900 overflow-hidden">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center z-0"
          >
            <ImageIcon className="w-12 h-12 text-slate-700 opacity-50" />
          </motion.div>
        )}
      </AnimatePresence>
      <img 
        src={currentSrc} 
        alt={alt} 
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (!hasError) setHasError(true);
          setIsLoading(false);
        }}
        className={`w-full h-full object-cover transition-all duration-700 ease-out z-10 relative 
          ${isLoading ? 'opacity-0 scale-105' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} 
      />
    </div>
  );
}

export function Countries() {
  const navigate = useNavigate();
  return (
    <section id="countries" className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight">Top Destinations</h2>
            <p className="text-xl text-slate-600 font-medium leading-relaxed">Discover where ambitious students are building their futures. Compare key metrics instantly.</p>
          </div>
          <Link 
            to="/signup" 
            className="group flex flex-shrink-0 items-center gap-3 font-bold text-white bg-slate-900 px-6 py-4 rounded-full shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-indigo-500/20 hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 uppercase tracking-widest text-sm">View all 35+ countries</span> 
            <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {countries.map((country, i) => (
            <motion.div 
              key={country.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              onClick={() => navigate(`/app/countries/${country.id}`)}
              className="group cursor-pointer rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 relative aspect-[4/5] transform hover:-translate-y-2 border border-slate-200/50 hover:border-indigo-500/30"
            >
              <DestinationImage src={country.image} alt={country.name} fallbackId={country.fallbackId} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent transition-opacity duration-300 z-10 pointer-events-none"></div>
              
              <div className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-500 z-20">
                {country.flag}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end pointer-events-none z-20">
                <h3 className="text-4xl font-display font-black text-white mb-6 group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-md">{country.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 h-0 opacity-0 invisible group-hover:h-auto group-hover:opacity-100 group-hover:visible transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase mb-1"><Award className="w-3.5 h-3.5" /> Avg Tuition</div>
                    <div className="text-white font-bold text-sm">{country.tuition}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase mb-1"><Briefcase className="w-3.5 h-3.5" /> Grad Salary</div>
                    <div className="text-white font-bold text-sm">{country.salary}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase mb-1"><ShieldCheck className="w-3.5 h-3.5" /> PR Score</div>
                    <div className="text-white font-bold text-sm">{country.prScore}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg">
                    <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold uppercase mb-1"><Plane className="w-3.5 h-3.5" /> Visa Route</div>
                    <div className="text-white font-bold text-sm">{country.visa}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
