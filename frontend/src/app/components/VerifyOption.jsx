'use client';

import React from 'react';
import styles from '../styles/Login.module.css';
import { motion } from 'framer-motion';

export const VerifyOption = ({ isOpen, onClose, email, onVerifyNow, onVerifyLater }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.login_overlay} onClick={onClose}>
      <motion.div 
        className={styles.login_modal}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.login_modal_content}>
          <button className={styles.close_button} onClick={onClose}>×</button>
          
          <div className={styles.login_header}>
            <h2>Account Created!</h2>
            <p>Would you like to verify your email now?</p>
            <p className={styles.email}>{email}</p>
          </div>

          <div className={styles.verify_options}>
            <button 
              className={styles.login_button}
              onClick={onVerifyNow}
            >
              Verify Now
            </button>
            <button 
              className={`${styles.login_button} ${styles.secondary_button}`}
              onClick={onVerifyLater}
            >
              Verify Later
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 