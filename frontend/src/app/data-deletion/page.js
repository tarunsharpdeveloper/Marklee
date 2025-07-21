'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

export default function DataDeletion() {
  const router = useRouter();

  useEffect(() => {
    // This page should be accessible to everyone (no auth required)
    // as Facebook needs to verify it during app review
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>User Data Deletion Request</h1>
        
        <div className={styles.meta}>
          <p><strong>Effective Date:</strong> December 2024</p>
          <p><strong>Last Updated:</strong> December 2024</p>
        </div>

        <div className={styles.section}>
          <p className={styles.intro}>
            At Marklee, we respect your privacy and provide you with full control over your personal data. This page explains how you can request the deletion of your account and associated data.
          </p>
        </div>

        <div className={styles.section}>
          <h2>What Data We Store</h2>
          <p>When you use Marklee, we may collect and store the following types of data:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and authentication details</li>
            <li><strong>Business Data:</strong> Company information, marketing briefs, and project details</li>
            <li><strong>Generated Content:</strong> AI-generated marketing materials and user-edited content</li>
            <li><strong>Usage Data:</strong> Login timestamps, app interactions, and preferences</li>
            <li><strong>Technical Data:</strong> IP addresses, browser information, and device details</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>How to Request Data Deletion</h2>
          
          <div className={styles.methods}>
            <div className={styles.method}>
              <h3>Method 1: Email Request (Recommended)</h3>
              <p>Send an email to <strong>privacy@marklee.com</strong> with the subject line:</p>
              <div className={styles.emailSubject}>
                &quot;Data Deletion Request - [Your Email Address]&quot;
              </div>
              <p>Include the following information in your email:</p>
              <ul>
                <li>Your full name</li>
                <li>Email address associated with your account</li>
                <li>Reason for deletion (optional)</li>
                <li>Confirmation that you want to permanently delete your account</li>
              </ul>
            </div>

            <div className={styles.method}>
              <h3>Method 2: In-App Deletion</h3>
              <p>If you have an active account:</p>
              <ol>
                <li>Log in to your Marklee account</li>
                <li>Go to Settings → Danger Zone</li>
                <li>Click &quot;Delete Account&quot;</li>
                <li>Confirm your decision</li>
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>What Happens After Your Request</h2>
          <div className={styles.process}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Confirmation</h4>
                <p>We will send you a confirmation email within 24 hours acknowledging your request.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Verification</h4>
                <p>We may contact you to verify your identity and confirm the deletion request.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Processing</h4>
                <p>Your data will be permanently deleted within 7 days of verification.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h4>Completion</h4>
                <p>You will receive a final confirmation email once deletion is complete.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>What Gets Deleted</h2>
          <p>When you request data deletion, we will permanently remove:</p>
          <ul>
            <li>Your user account and profile information</li>
            <li>All marketing briefs and project data</li>
            <li>AI-generated content and drafts</li>
            <li>Usage history and preferences</li>
            <li>Authentication tokens and session data</li>
          </ul>
          <p><strong>Note:</strong> Some data may be retained for legal or regulatory purposes as required by law.</p>
        </div>

        <div className={styles.section}>
          <h2>Data Retention for Legal Purposes</h2>
          <p>In certain circumstances, we may be required to retain some data for:</p>
          <ul>
            <li>Compliance with legal obligations</li>
            <li>Resolving disputes or enforcing agreements</li>
            <li>Preventing fraud or abuse</li>
            <li>Maintaining system security</li>
          </ul>
          <p>Any retained data will be kept for the minimum period required by applicable law.</p>
        </div>

        <div className={styles.section}>
          <h2>Contact Information</h2>
          <div className={styles.contact}>
            <p><strong>For Data Deletion Requests:</strong></p>
            <p>Email: <strong>privacy@marklee.com</strong></p>
            <p>Subject Line: &quot;Data Deletion Request&quot;</p>
            <p>Response Time: Within 24 hours</p>
            <p>Processing Time: 7 days maximum</p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Additional Rights</h2>
          <p>In addition to data deletion, you also have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
          </ul>
          <p>To exercise any of these rights, contact us at <strong>privacy@marklee.com</strong>.</p>
        </div>

        <div className={styles.section}>
          <h2>Updates to This Policy</h2>
          <p>We may update this data deletion policy from time to time. Any changes will be posted on this page with an updated &quot;Last Updated&quot; date.</p>
        </div>
      </div>
    </div>
  );
} 