'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from '../styles/Navbar.module.css';
import { Login } from './Login';
import GetStarted from './GetStarted';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <Image
              src="/MarkleeLogoTP.png"
              alt="Marklee Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className={styles.nav_links}>
            <motion.a
              className={styles.nav_link}
              href="#About"
              whileHover={{ scale: 1.05 }}
            >
              About
            </motion.a>
            <motion.a
              className={styles.nav_link}
              href="#pricing"
              whileHover={{ scale: 1.05 }}
            >
              Pricing
            </motion.a>
            <motion.a
              className={styles.nav_link}
              href="#features"
              whileHover={{ scale: 1.05 }}
            >
              Features
            </motion.a>
            <motion.a
              className={styles.nav_link}
              href="#faq"
              whileHover={{ scale: 1.05 }}
            >
              FAQ
            </motion.a>
            <motion.button
              className={styles.login_button}
              onClick={() => setIsLoginModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
            <motion.button
              className={styles.action_button}
              onClick={() => setIsGetStartedModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      <Login 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <GetStarted 
        isOpen={isGetStartedModalOpen} 
        onClose={() => setIsGetStartedModalOpen(false)} 
      />
    </>
  );
};

export default Navbar; 