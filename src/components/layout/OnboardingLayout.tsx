import { ReactNode } from 'react';
import { Globe2, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onNext?: () => void;
  isNextDisabled?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
}

export function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps, 
  title, 
  subtitle,
  onBack,
  onNext,
  isNextDisabled = false,
  nextLabel = "Continue",
  isLoading = false
}: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-12 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl leading-none tracking-tight text-slate-900 hidden sm:block whitespace-nowrap mt-0 pb-0 pt-0 relative -top-[1px]">GlobalGrad</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-sm font-medium text-slate-500">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hidden sm:flex">
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link to="/">
              Exit Setup
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="sm:hidden text-slate-500">
             <Link to="/">
              <X className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 w-full overflow-hidden shrink-0">
        <motion.div 
          className="h-full bg-indigo-600 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center pt-12 pb-32 px-6 relative">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-2xl relative z-10">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="mb-10 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-3">{title}</h1>
              <p className="text-lg text-slate-600">{subtitle}</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 relative overflow-hidden">
               {/* Decorative border highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 opacity-50 relative z-0"></div>
              <div className="relative z-10 pt-2">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

       {/* Sticky Bottom Navigation */}
      {(onBack || onNext) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 sm:px-12 py-4 z-50 shadow-[0_-10px_40px_rgb(0,0,0,0.04)]">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {onBack ? (
              <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="text-slate-600 hover:text-slate-900 border-slate-200">
                Back
              </Button>
            ) : <div></div>}
            
            {onNext && (
              <Button type="button" onClick={onNext} disabled={isNextDisabled || isLoading} className="h-12 px-8 text-base shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                     Processing...
                  </span>
                ) : nextLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
