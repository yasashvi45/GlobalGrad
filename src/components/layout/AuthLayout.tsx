import { ReactNode } from 'react';
import { Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:flex-none lg:w-[600px] xl:w-[700px] bg-white border-r border-slate-200">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-12 shrink-0">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl leading-none tracking-tight text-slate-900 whitespace-nowrap mt-0 pb-0 pt-0 relative -top-[1px]">GlobalGrad</span>
          </Link>
          
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-600">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>
      
      <div className="hidden lg:flex flex-1 relative bg-indigo-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 max-w-lg text-center px-12">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl mx-auto mb-8 border border-white/20 flex items-center justify-center">
             <Globe2 className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-4xl font-display font-bold text-white mb-6 leading-tight">Your gateway to global education.</h3>
          <p className="text-lg text-indigo-200">Join a community of ambitious students planning their futures across the world's top universities.</p>
        </div>
      </div>
    </div>
  );
}
