import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Premium() {
  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in pb-24 max-w-7xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col items-center justify-center text-center mt-12 mb-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight mb-4">Upgrade to Premium</h1>
        <p className="text-lg text-slate-500 max-w-2xl">Unlock advanced AI guidance, priority application processing, and exclusive scholarships.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Basic</h3>
          <p className="text-slate-500 mb-6">Essential features for your study abroad journey.</p>
          <div className="text-4xl font-black text-slate-900 mb-8">Free</div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-slate-600 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              University search
            </li>
            <li className="flex items-center gap-3 text-slate-600 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Basic profile tracking
            </li>
            <li className="flex items-center gap-3 text-slate-600 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Standard scholarship access
            </li>
          </ul>
          <Button variant="outline" className="w-full text-lg h-12" disabled>Current Plan</Button>
        </div>
        
        <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl flex flex-col text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-50"></div>
          <h3 className="text-2xl font-bold mb-2 relative z-10">Premium</h3>
          <p className="text-indigo-200 mb-6 relative z-10">The ultimate edge in global admissions.</p>
          <div className="text-4xl font-black mb-8 relative z-10">$19<span className="text-lg font-medium text-indigo-300">/mo</span></div>
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            <li className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              Unlimited AI Matchmaking
            </li>
            <li className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              Priority expert counseling
            </li>
            <li className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              1-on-1 Visa interview prep
            </li>
            <li className="flex items-center gap-3 font-medium">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              Premium scholarship matches
            </li>
          </ul>
          <Button className="w-full text-lg h-12 bg-white text-indigo-900 border-white hover:bg-slate-100 relative z-10">Upgrade Now</Button>
        </div>
      </div>
    </div>
  );
}
