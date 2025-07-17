'use client';

import React, { useState, useEffect } from 'react';
import styles from '../styles/Signup.module.css';
import { OtpVerification } from './OtpVerification';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const Signup = ({ isOpen, onClose, onBack }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Show OTP verification immediately after successful signup
      setShowOtpVerification(true);
      
    } catch (error) {
      console.error('Signup failed:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showOtpVerification) {
    return (
      <OtpVerification 
        isOpen={true}
        email={formData.email}
        onVerificationSuccess={() => {
          onClose();
          // Remove router.push here as it's now handled in OtpVerification component
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.signup_overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        <motion.div 
          className={styles.signup_modal}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onMouseDown={e => e.stopPropagation()}
        >
          
          <div className={styles.signup_modal_content}>
            <button className={styles.close_button} onClick={onClose}></button>
            
            <button className={styles.back_button} onClick={onBack}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
            </button>
            
            <div className={styles.signup_header}>
              <h2>Create Account</h2>
              <p>Join us and start your journey</p>
            </div>

            {error && <div className={styles.error_message}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.signup_form}>
              <div className={styles.form_group}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className={styles.form_group}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className={styles.form_group}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className={styles.form_group}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <motion.button 
                type="submit" 
                className={`${styles.signup_button} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className={styles.loading_spinner}>
                    <div className={styles.spinner}></div>
                  </div>
                ) : 'Create Account'}
              </motion.button>
            </form>

            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 
