'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from '../styles/PreHomeNavbar.module.css';
import DarkModeToggle from './DarkModeToggle';

const PreHomeNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user data exists in localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className={styles.preHomeNav}>
      <div className={styles.preHomeContainer}>
        <div className={styles.preHomeLogo}>
          <Image
            src="/Bold.png"
            alt="Marklee Logo"
            width={110}
            height={95}
            priority
          />
        </div>

        <div className={styles.preHomeNavContent}>
          {/* User Icon and Name */}
          <div className={styles.preHomeUserInfo}>
            <div className={styles.preHomeUserProfile}>
              <svg className={styles.preHomeUserIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Username - visible on desktop */}
              <span className={styles.preHomeUserName}>
                {user?.name}
              </span>
              {/* Username tooltip - visible on mobile */}
              <span className={styles.preHomeUserTooltip}>
                Welcome, {user?.name}
              </span>
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <button 
            className={`${styles.preHomeHamburger} ${isMobileMenuOpen ? styles.preHomeActive : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Navigation Menu */}
          <div className={`${styles.preHomeNavLinks} ${isMobileMenuOpen ? styles.preHomeShow : ''}`}>
            <motion.a
              className={styles.preHomeNavLink}
              href="#about"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </motion.a>
            <motion.a
              className={styles.preHomeNavLink}
              href="#pricing"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </motion.a>
            <motion.a
              className={styles.preHomeNavLink}
              href="#features"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </motion.a>
            <motion.a
              className={styles.preHomeNavLink}
              href="#faq"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </motion.a>
            
            <DarkModeToggle />
            
            <motion.button
              className={styles.preHomeLogoutBtn}
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PreHomeNavbar; 