'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';
import Navbar from '../components/Navbar';

export default function PreHomePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    organizationType: '',
    organizationName: '',
    supportType: '',
    productDescription: '',
    businessModel: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleContinue = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit form and navigate to dashboard
      router.push('/dashboard');
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <>
            <h2 className={styles.title}>Personal Information</h2>
            <p className={styles.description}>
              Tell us about yourself
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="Your role in the organization"
                className={styles.input}
              />
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h2 className={styles.title}>Organization Details</h2>
            <p className={styles.description}>
              Tell us about your organization
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization Type</label>
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Select organization type</option>
                <option value="startup">Startup</option>
                <option value="enterprise">Enterprise</option>
                <option value="nonprofit">Non-profit</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                placeholder="Enter organization name"
                className={styles.input}
              />
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className={styles.title}>Support Information</h2>
            <p className={styles.description}>
              What type of support are you looking for?
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Support Type</label>
              <select
                name="supportType"
                value={formData.supportType}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Select support type</option>
                <option value="technical">Technical Support</option>
                <option value="business">Business Development</option>
                <option value="marketing">Marketing</option>
                <option value="financial">Financial</option>
                <option value="other">Other</option>
              </select>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 className={styles.title}>Product & Business Model</h2>
            <p className={styles.description}>
              Tell us about your product and business model
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Product Description</label>
              <textarea
                name="productDescription"
                value={formData.productDescription}
                onChange={handleInputChange}
                placeholder="Describe your product or service"
                className={styles.textarea}
                rows="4"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Business/Revenue Model</label>
              <textarea
                name="businessModel"
                value={formData.businessModel}
                onChange={handleInputChange}
                placeholder="Describe your business/revenue model"
                className={styles.textarea}
                rows="4"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
    <Navbar />
    <div className={styles.container}>
      <div className={styles.formCard}>
        {/* Back Button */}
        {step > 1 && (
          <button 
            onClick={handleBack}
            className={styles.backButton}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        )}

        {/* Progress Steps */}
        <div className={styles.progressSteps}>
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`${styles.step} ${step >= num ? styles.active : ''}`}
            >
              {num}
            </div>
          ))}
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className={styles.formContent}>
          {renderStepContent()}
          <button 
            className={styles.continueButton}
            onClick={handleContinue}
          >
            {step === 4 ? 'Submit' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
} 