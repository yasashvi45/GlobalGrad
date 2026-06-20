import { LifeBuoy, Mail, MessageCircle, FileQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Support() {
  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto mt-4 sm:mt-8">
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
           <LifeBuoy className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight mb-4">
          How can we help?
        </h1>
        <p className="text-slate-500 text-lg font-medium">Get in touch with our admissions experts or browse the help center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-8 text-center flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                 <MessageCircle className="w-6 h-6 text-slate-600" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">Live Chat</h3>
               <p className="text-slate-500 text-sm font-medium mb-6">Chat with an expert in real time.</p>
               <Button className="w-full bg-slate-900 hover:bg-slate-800 font-bold mt-auto">Start Chat</Button>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-8 text-center flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                 <Mail className="w-6 h-6 text-slate-600" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">Email Support</h3>
               <p className="text-slate-500 text-sm font-medium mb-6">We'll respond within 24 hours.</p>
               <Button variant="outline" className="w-full font-bold mt-auto border-slate-200">Send Email</Button>
            </CardContent>
         </Card>
         <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-8 text-center flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                 <FileQuestion className="w-6 h-6 text-slate-600" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">Documentation</h3>
               <p className="text-slate-500 text-sm font-medium mb-6">Browse knowledge base articles.</p>
               <Button variant="outline" className="w-full font-bold mt-auto border-slate-200">Browse FAQs</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
