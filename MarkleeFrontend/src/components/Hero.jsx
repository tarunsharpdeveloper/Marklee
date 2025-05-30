import React from 'react';
import { motion } from 'framer-motion';
import './styles/Hero.css';
import { Typewriter } from 'react-simple-typewriter';

const Hero = () => {
  return (
    <div className="hero-wrapper" id="hero">
      <section className="hero-section">
        <div className="gradient-orb top-right" />
        <div className="gradient-orb bottom-left" />
        <div className="container">
          <div className="content">
            <motion.div
              className="overline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              AI-Powered Platform
            </motion.div>

<motion.h1
  className="title"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>
  <Typewriter
    words={['Transform Your Business Strategy with AI Intelligence']}
    loop={true}
    cursor
    cursorStyle=""
    typeSpeed={70}
    deleteSpeed={50}
    delaySpeed={2000}
  />
</motion.h1>

            <motion.p
              className="description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Leverage advanced AI technology to develop comprehensive strategies, 
              gain actionable insights, and make data-driven decisions that drive 
              your business forward.
            </motion.p>
            <motion.div
              className="button-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.a
                className="primary-button"
                href="#demo"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free Trial
              </motion.a>
              <motion.a
                className="secondary-button"
                href="#learn-more"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Learn More
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero; 