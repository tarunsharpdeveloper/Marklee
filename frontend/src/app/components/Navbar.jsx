'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Navbar.module.css';
import { Login } from './Login';
import GetStarted from './GetStarted';
import DarkModeToggle from './DarkModeToggle';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <Image
              src="/Bold.png"
              alt="Marklee Logo"
              width={110}
              height={96}
              priority
            />
          </div>

          {/* Hamburger Menu Button */}
          <button 
            className={`${styles.hamburger} ${isMobileMenuOpen ? styles.active : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Desktop Navigation */}
          <div className={`${styles.nav_links} ${isMobileMenuOpen ? styles.show : ''}`}>
            <motion.a
              className={styles.nav_link}
              href="#About"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </motion.a>
            <motion.a
              className={styles.nav_link}
              href="#pricing"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </motion.a>
            <motion.a
              className={styles.nav_link}
              href="#features"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </motion.a>
            <motion.a
              className={styles.nav_link}
              href="#faq"
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </motion.a>
            
            <DarkModeToggle />
            
            {user ? (
              <>
                <div className={styles.user_info}>
                  <div className={styles.user_profile}>
                    <svg className={styles.user_icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.user_name}>Welcome, {user.name}</span>
                  </div>
                  <motion.button
                    className={styles.logout_button}
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <motion.button
                  className={styles.login_button}
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
                <motion.button
                  className={styles.action_button}
                  onClick={() => {
                   setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </>
            )}
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