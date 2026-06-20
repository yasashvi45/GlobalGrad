import { CreditCard, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Billing() {
  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto mt-4 sm:mt-8">
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <CreditCard className="w-8 h-8 text-indigo-500" />
          Billing & Subscription
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your GlobalGrad Plus subscription and billing history.</p>
      </div>

      <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Current Plan</h3>
        </div>
        <CardContent className="p-8 pt-8 flex flex-col md:flex-row gap-8 items-center justify-between">
           <div>
             <h4 className="text-2xl font-black text-indigo-700 tracking-tight mb-2">Premium Plan</h4>
             <p className="text-slate-500 font-medium">Your subscription renews automatically on Dec 1, 2026.</p>
             <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Document Reviews</p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Priority Support</p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Applications Tracking</p>
             </div>
           </div>
           
           <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 min-w-[200px]">
              <p className="text-3xl font-black text-slate-900">$29<span className="text-base font-bold text-slate-400">/mo</span></p>
              <Button variant="outline" className="w-full mt-4 bg-white font-bold border-slate-200 text-slate-700 hover:text-slate-900">Cancel Plan</Button>
           </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Payment Method</h3>
        </div>
        <CardContent className="p-8 pt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-16 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold italic tracking-widest text-sm shadow-sm">
                 VISA
               </div>
               <div>
                  <p className="font-bold text-slate-900">Visa ending in 4242</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">Expires 12/28</p>
               </div>
            </div>
            <Button variant="outline" className="font-bold shrink-0">Update</Button>
        </CardContent>
      </Card>
    </div>
  );
}
