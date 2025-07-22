'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Navbar = dynamic(() => import('./components/Navbar'), {
  ssr: false
});

const Hero = dynamic(() => import('./components/Hero'), {
  ssr: false
});

const Footer = dynamic(() => import('./components/Footer'), {
  ssr: false
});

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <Navbar />
        <Hero />
        <Footer />
      </Suspense>
    </main>
  );
}
