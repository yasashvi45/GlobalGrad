import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Loader } from '@/components/landing/Loader';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Journey } from '@/components/landing/Journey';
import { Countries } from '@/components/landing/Countries';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export function Landing() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
      <AnimatePresence>
         {isLoading && <Loader onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>
      
      {!isLoading && (
        <>
          <Navbar />
          <Hero />
          <Journey />
          <Countries />
          <Testimonials />
          <CTA />
          <Footer />
        </>
      )}
    </div>
  );
}
