import React from 'react';
import { Global, css } from '@emotion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Solutions from './components/Solutions';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import About from './components/About';
import FAQ from './components/FAQ';

const globalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    overflow-x: hidden;
  }

  #root {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  html {
    scroll-behavior: smooth;
  }

  ::selection {
    background: #007AFF;
    color: white;
  }
`;

function App() {
  return (
    <div className="app">
      <Global styles={globalStyles} />
      <Navbar />
      <Hero />
      {/* <About/>
      <Features />
      <FAQ/> */}
      {/* <Solutions /> */}
      {/* <Pricing />
      <Footer /> */}
    </div>
  );
}

export default App;
