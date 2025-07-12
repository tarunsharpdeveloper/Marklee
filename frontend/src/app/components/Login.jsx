'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Login.module.css';
import { Signup } from './Signup';
import { OtpVerification } from './OtpVerification';
import { ForgotPassword } from './ForgotPassword';

export const Login = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  if (showSignup) {
    return <Signup isOpen={true} onClose={onClose} onBack={() => setShowSignup(false)} />;
  }

  if (showForgotPassword) {
    return <ForgotPassword isOpen={true} onClose={onClose} onBack={() => setShowForgotPassword(false)} />;
  }

  if (showVerification) {
    return <OtpVerification 
      isOpen={true}
      email={email}
      onVerificationSuccess={() => {
        setShowVerification(false);
        onClose();
      }}
      onBack={() => setShowVerification(false)}
      onClose={onClose}
    />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.requiresVerification) {
        setError(data.message);
        setTimeout(() => {
          setShowVerification(true);
        }, 3000);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store the token and user data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccessMessage('Logged in successfully!');
      
      // Close modal and navigate based on role
      setTimeout(() => {
        onClose();
        // Navigate based on user role
        if (data.user.role === 'admin') {
          window.location.href = '/usermanagement';
        } else {
          // For normal users, navigate based on metadata
          window.location.href = data.isUserMetaData ? '/dashboard' : '/marketing';
        }
      }, 2000);

    } catch (error) {
      setError(error.message || 'An error occurred during login');
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  return (
     <div className={styles.login_overlay} onMouseDown={onClose}>
     <div className={styles.login_modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.login_modal_content}>
          <button className={styles.close_button} onClick={onClose}></button>
          
          <div className={styles.login_header}>
            <h2>Welcome Back</h2>
            <p>Enter your details to access your account</p>
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

            <div className={styles.form_group}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className={styles.form_footer}>
              <label className={styles.remember_me}>
                <input type="checkbox" /> Remember me
              </label>
              <button 
                type="button"
                className={styles.forgot_password}
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
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
              ) : 'Log In'}
            </button>
          </form>

          <div className={styles.social_login}>
            <p>Or continue with</p>
            <div className={styles.social_buttons}>
              <button className={`${styles.social_button} ${styles.google}`}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Google
              </button>
              <button className={`${styles.social_button} ${styles.facebook}`}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12,2C6.477,2,2,6.477,2,12c0,4.991,3.657,9.128,8.438,9.879V14.89h-2.54V12h2.54V9.797c0-2.506,1.492-3.89,3.777-3.89c1.094,0,2.238,0.195,2.238,0.195v2.46h-1.26c-1.243,0-1.63,0.771-1.63,1.562V12h2.773l-0.443,2.89h-2.33v6.989C18.343,21.129,22,16.991,22,12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Facebook
              </button>
            </div>
          </div>

          <div className={styles.signup_prompt}>
            Don't have an account? <a href="#" onClick={(e) => {
              e.preventDefault();
              setShowSignup(true);
            }}>Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}; 
