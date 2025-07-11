'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Login.module.css';
import { motion } from 'framer-motion';

export const OtpVerification = ({ isOpen, email, onVerificationSuccess, onClose }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Store the token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        // Ensure we're not storing role information that might affect routing
        const userWithoutRole = {
          ...data.user,
          role: 'user' // Force role to be user
        };
        localStorage.setItem('user', JSON.stringify(userWithoutRole));
      }

      // Close the verification modal
      onClose();
      
      // Force navigation to marketing route
      window.location.href = '/marketing';

    } catch (error) {
      console.error('OTP verification failed:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setError('New OTP has been sent to your email');
    } catch (error) {
      console.error('Resend OTP failed:', error);
      setError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.login_overlay}>
      <motion.div 
        className={styles.login_modal}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.login_modal_content}>
          <button className={styles.back_button} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
          </button>

          <div className={styles.login_header}>
            <h2>Email Verification</h2>
            <p>Please enter the verification code sent to</p>
            <p className={styles.email}>{email}</p>
          </div>

          {error && <div className={styles.error_message}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.login_form}>
            <div className={styles.form_group}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                required
                className={styles.otp_input}
              />
            </div>

            <button 
              type="submit" 
              className={`${styles.login_button} ${isLoading ? styles.loading : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.loading_spinner}>
                  <div className={styles.spinner}></div>
                </div>
              ) : 'Verify Email'}
            </button>
          </form>

          <div className={styles.signup_prompt}>
            <p>Didn't receive the code?</p>
            <button 
              onClick={handleResendOTP}
              className={styles.resend_button}
              disabled={isLoading}
            >
              Resend OTP
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 