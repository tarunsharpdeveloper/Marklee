'use client';

import React, { useState } from 'react';
import styles from '../styles/Login.module.css';
import { Signup } from './Signup';

export const Login = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement login logic here
      console.log('Login attempt with:', { email, password });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showSignup) {
    return <Signup isOpen={true} onClose={onClose} onBack={() => setShowSignup(false)} />;
  }

  return (
    <div className={styles.login_overlay} onClick={onClose}>
      <div className={styles.login_modal} onClick={e => e.stopPropagation()}>
        <div className={styles.login_modal_content}>
          <button className={styles.close_button} onClick={onClose}>×</button>
          
          <div className={styles.login_header}>
            <h2>Welcome Back</h2>
            <p>Enter your details to access your account</p>
          </div>

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
              <a href="#" className={styles.forgot_password}>Forgot Password?</a>
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
              <button className={`${styles.social_button} ${styles.github}`}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                GitHub
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