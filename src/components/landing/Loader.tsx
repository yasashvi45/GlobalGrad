import { motion, AnimatePresence } from 'motion/react';
import { Globe2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const LOADING_TEXTS = [
  'Loading Countries...',
  'Loading Universities...',
  'Loading Scholarships...',
  'Preparing Dashboard...',
  'Welcome to GlobalGrad'
];

interface LoaderProps {
  onComplete: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => {
        if (prev === LOADING_TEXTS.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "circInOut" } }}
      className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          className="mb-8"
        >
          <div className="relative w-24 h-24 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-900/50 backdrop-blur-sm shadow-[0_0_40px_rgba(79,70,229,0.3)]">
             <Globe2 className="w-10 h-10 text-indigo-400" />
             <div className="absolute inset-0 rounded-full border-t border-indigo-400 animate-[spin_2s_linear_infinite]"></div>
          </div>
        </motion.div>

        <div className="h-8 relative w-64 overflow-hidden mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-indigo-200 font-medium text-center absolute inset-0 tracking-wide font-display text-lg"
            >
              {LOADING_TEXTS[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-indigo-500"
            animate={{ width: `${((textIndex + 1) / LOADING_TEXTS.length) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          ></motion.div>
        </div>
      </div>
    </motion.div>
  );
}
