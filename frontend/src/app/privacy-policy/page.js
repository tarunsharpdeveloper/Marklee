'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './styles.module.css';

export default function PrivacyPolicy() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      // If not authenticated, stay on privacy policy page
      return;
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.title}>Privacy Policy</h1>
          
          <div className={styles.meta}>
            <div className={styles.meta_item}>
              <span className={styles.meta_label}>Effective Date:</span>
              <span className={styles.meta_value}>December 2024</span>
            </div>
            <div className={styles.meta_item}>
              <span className={styles.meta_label}>Last Updated:</span>
              <span className={styles.meta_value}>December 2024</span>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.intro}>
              Welcome to Marklee, a digital marketing platform designed to help users generate AI-powered marketing content and manage their business branding efforts. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.section}
        >
          <h2>1. Information We Collect</h2>
          
          <h3>a. Account & Authentication Data</h3>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Password (hashed using bcrypt)</li>
            <li>Google account info (for OAuth sign-in)</li>
            <li>OTP verification codes (temporary)</li>
          </ul>

          <h3>b. Business & Project Data</h3>
          <ul>
            <li>Company name, industry, and business type</li>
            <li>Marketing briefs and project descriptions</li>
            <li>AI-generated content and user-edited drafts</li>
          </ul>

          <h3>c. Technical & Usage Data</h3>
          <ul>
            <li>IP address and browser details</li>
            <li>Login timestamps and authentication tokens (JWT)</li>
            <li>App usage logs and interaction metrics</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.section}
        >
          <h2>2. How We Use Your Data</h2>
          <p>We use your personal information to:</p>
          <ul>
            <li>Register and authenticate users (email/password or Google OAuth)</li>
            <li>Verify your identity with OTP via email</li>
            <li>Generate AI-powered content using OpenAI and LangChain</li>
            <li>Store and manage your marketing projects and briefs</li>
            <li>Personalize your experience (e.g., dark mode preferences)</li>
            <li>Improve the platform&apos;s performance and security</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={styles.section}
        >
          <h2>3. AI & Third-Party Integrations</h2>
          
          <h3>a. AI Services</h3>
          <p>We use LangChain and OpenAI APIs to generate content based on the business information and briefs you provide. No personal identifiers are sent to these services.</p>

          <h3>b. Google OAuth</h3>
          <p>If you sign in via Google, we access only your basic profile information (name and email). We do not access or store your Google account credentials.</p>

          <h3>c. Email Service</h3>
          <p>We use Nodemailer to send OTP verification emails and other important communication.</p>
        </motion.div>

        <div className={styles.section}>
          <h2>4. How We Protect Your Data</h2>
          <ul>
            <li>Passwords are encrypted using bcrypt</li>
            <li>Authentication is handled via secure JWT tokens</li>
            <li>Sensitive data is transmitted over HTTPS</li>
            <li>Database access is role-restricted (admin/user)</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>5. User Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access or update your personal information</li>
            <li>Request deletion of your account and data</li>
            <li>Withdraw consent for AI-based content generation</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@marklee.com.</p>
        </div>

        <div className={styles.section}>
          <h2>6. Data Retention</h2>
          <p>We retain your information as long as your account is active or as required to provide you services. You can request deletion at any time.</p>
        </div>

        <div className={styles.section}>
          <h2>7. Cookies & Tracking</h2>
          <p>We use minimal cookies to store session tokens and UI preferences (e.g., dark mode). No tracking cookies are used for marketing.</p>
        </div>

        <div className={styles.section}>
          <h2>8. Data Deletion Request</h2>
          <p>To request data deletion, email us at: <strong>privacy@marklee.com</strong> with the subject line &quot;Data Deletion Request&quot;. We will confirm and process your request within 7 days.</p>
        </div>

        <div className={styles.section}>
          <h2>9. Changes to this Policy</h2>
          <p>We may update this Privacy Policy from time to time. Users will be notified via email or in-app notification.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={styles.section}
        >
          <h2>10. Contact Us</h2>
          <p>If you have any questions about this policy, please contact:</p>
          <div className={styles.contact}>
            <p><strong>Marklee - Digital Marketing Platform</strong></p>
            <p>Email: privacy@marklee.com</p>
            <p>Website: https://marklee.com</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className={styles.back_section}
        >
          <motion.button
            onClick={() => router.push('/')}
            className={styles.back_button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Previous Page
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 