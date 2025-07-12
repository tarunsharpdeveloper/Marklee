'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './styles.module.css';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/');
    }
  }, [token, router]);

  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasValidChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};:'",.<>/?]*$/.test(password);
    return minLength && hasValidChars;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Validate password requirements
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long and contain only letters, numbers, and special characters');
      setIsLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccessMessage('Password has been reset successfully. Redirecting to login...');
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to home after success message
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.title}>
          <h2>Reset Password</h2>
          <p>Enter your new password</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter new password"
              required
              minLength={6}
            />
            {/* <p className={styles.passwordRequirements}>
              Password must be at least 6 characters long and can contain letters, numbers, and special characters (!@#$%^&*()_+-=[]&#123;&#125;;:&apos;&quot;,.&lt;&gt;/?)
            </p> */}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loading_spinner}>
                <div className={styles.spinner}></div>
              </div>
            ) : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
} 