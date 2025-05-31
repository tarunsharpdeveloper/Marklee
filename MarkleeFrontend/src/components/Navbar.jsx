'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './styles/Navbar.module.css';
import GetStarted from './GetStarted';

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            {/* <motion.a
              className="nav-link"
              href="#solutions"
              whileHover={{ scale: 1.05 }}
            >
              Solutions
            </motion.a> */}
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
              className={styles.action_button}
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
          </div>
        </div>
      </nav>

      <GetStarted 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default Navbar; 