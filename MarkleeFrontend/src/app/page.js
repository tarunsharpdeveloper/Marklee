'use client'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Solutions from '../components/Solutions'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'
import About from '../components/About'
import FAQ from '../components/FAQ'

export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <Navbar />
      <Hero />
      {/* <About/>
      <Features />
      <FAQ/>
      <Solutions />
      <Pricing />
      <Footer /> */}
    </main>
  )
} 