'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';
import PreHomeNavbar from '../components/PreHomeNavbar';
import WelcomePopup from './components/WelcomePopup';

const STORAGE_KEY = 'marketingAnswers';

export default function MarketingPage() {
  const router = useRouter();
  const [formFields, setFormFields] = useState(null);
  const [formAnswers, setFormAnswers] = useState({});
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  // Load saved answers from localStorage on component mount
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        setFormAnswers(parsedAnswers);
        console.log('Loaded saved answers:', parsedAnswers); // Debug log
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  }, []);

  // Fetch form fields on component mount
  useEffect(() => {
    const fetchFormFields = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setIsInitialLoading(false);
          return;
        }

        const response = await fetch('http://localhost:4000/api/marketing/form', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch form fields');
        }

        const data = await response.json();
        setFormFields(data.data);

        // Initialize form answers with empty values or saved values
        const savedAnswers = localStorage.getItem(STORAGE_KEY);
        const parsedAnswers = savedAnswers ? JSON.parse(savedAnswers) : {};
        
        const initialAnswers = {};
        data.data.fields.forEach(field => {
          initialAnswers[field.nameKey] = parsedAnswers[field.nameKey] || '';
        });
        
        setFormAnswers(initialAnswers);
        // Save initial answers to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAnswers));
        console.log('Initialized answers:', initialAnswers); // Debug log
      } catch (error) {
        console.error('Error fetching form fields:', error);
        setError(error.message);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchFormFields();
  }, []);

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newAnswers = {
      ...formAnswers,
      [name]: value
    };
    setFormAnswers(newAnswers);
    
    // Save answers to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAnswers));
      console.log('Saved answers:', newAnswers); // Debug log
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/marketing/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formAnswers)
      });

      if (!response.ok) {
        throw new Error('Failed to generate marketing content');
      }

      const data = await response.json();
      setGeneratedContent(data.data);
      
      // Store the core message in localStorage
      if (data.data && data.data.coreMessage) {
        console.log('Storing core message:', data.data.coreMessage); // Debug log
        localStorage.setItem('marketingCoreMessage', data.data.coreMessage);
      } else {
        console.log('No core message found in response:', data.data); // Debug log
      }
      
      // Navigate to pre-homepage
      router.push('/pre-homepage');
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className={styles.container}>
        <PreHomeNavbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PreHomeNavbar />
      {showWelcome && formFields ? (
        <WelcomePopup 
          welcomeMessage={formFields.welcomeMessage} 
          onGetStarted={handleGetStarted} 
        />
      ) : (
        <div className={styles.content}>
          <div className={styles.formContainer}>
            <h2>Create Your Marketing Strategy</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              {formFields?.fields.map((field, index) => (
                <div key={index} className={styles.inputGroup}>
                  <label 
                    htmlFor={field.nameKey}
                    data-required={!field.placeholder.includes('optional')}
                  >
                    {field.title}
                  </label>
                  {field.nameKey === 'description' || 
                   field.nameKey === 'targetMarket' || 
                   field.nameKey === 'coreAudience' || 
                   field.nameKey === 'problemSolved' || 
                   field.nameKey === 'competitors' || 
                   field.nameKey === 'differentiators' || 
                   field.nameKey === 'keyFeatures' || 
                   field.nameKey === 'additionalInfo' ? (
                    <textarea
                      id={field.nameKey}
                      name={field.nameKey}
                      value={formAnswers[field.nameKey]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required={!field.placeholder.includes('optional')}
                      disabled={loading}
                    />
                  ) : (
                    <input
                      type="text"
                      id={field.nameKey}
                      name={field.nameKey}
                      value={formAnswers[field.nameKey]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required={!field.placeholder.includes('optional')}
                      disabled={loading}
                    />
                  )}
                  {field.guidance && (
                    <small className={styles.guidance}>{field.guidance}</small>
                  )}
                </div>
              ))}

              <div className={styles.buttonContainer}>
                <button 
                  type="submit" 
                  className={styles.continueButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.loadingSpinner} />
                      <span>Generating...</span>
                    </>
                  ) : (
                    'Generate Marketing Content'
                  )}
                </button>
              </div>

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 