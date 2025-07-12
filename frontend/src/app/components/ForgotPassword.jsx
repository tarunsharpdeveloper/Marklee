'use client';

import React, { useState } from 'react';
import styles from '../styles/Login.module.css';

export const ForgotPassword = ({ isOpen, onClose, onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request');
      }

      setSuccessMessage('If an account exists with this email, you will receive password reset instructions.');
      
      // Clear form
      setEmail('');
      
      // Close modal after success message
      setTimeout(() => {
        onClose();
      }, 5000);

    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.login_overlay} onMouseDown={onClose}>
      <div className={styles.login_modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.login_modal_content}>
          <button className={styles.close_button} onClick={onClose}></button>
          <button className={styles.back_button} onClick={onBack}><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg></button>
          
          <div className={styles.login_header}>
            <h2>Forgot Password</h2>
            <p>Enter your email to receive password reset instructions</p>
          </div>

          {error && (
            <div className={styles.error_message}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className={styles.success_message}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.login_form}>
            <div className={styles.form_group}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
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
              ) : 'Send Reset Instructions'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}; 