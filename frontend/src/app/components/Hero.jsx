'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/Hero.module.css';
import { Typewriter } from 'react-simple-typewriter';

const Hero = () => {
  return (
    <div className={styles.hero_wrapper} id="hero">
      <section className={styles.hero_section}>
        <div className={`${styles.gradient_orb} ${styles.top_right}`} />
        <div className={`${styles.gradient_orb} ${styles.bottom_left}`} />
        <div className={styles.container}>
          <div className={styles.content}>
            <motion.div
              className={styles.overline}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              AI-Powered Platform
            </motion.div>

            <motion.h1
              className={styles.title}
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
              className={styles.description}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Leverage advanced AI technology to develop comprehensive strategies, 
              gain actionable insights, and make data-driven decisions that drive 
              your business forward.
            </motion.p>
            <motion.div
              className={styles.button_group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.a
                className={styles.primary_button}
                href="#demo"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Free Trial
              </motion.a>
              <motion.a
                className={styles.secondary_button}
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