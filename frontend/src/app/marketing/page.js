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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingMessages] = useState([
    "Analyzing your inputs...",
    "Generating your marketing content...",
    "Crafting your brand message...",
    "Shaping content to fit your audience...",
    "Finalizing your personalized copy."
  ]);

  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY);
      if (savedAnswers) {
        setFormAnswers(JSON.parse(savedAnswers));
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  }, []);

  useEffect(() => {
    const fetchFormFields = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setIsInitialLoading(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/form`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch form fields');
        }

        const data = await response.json();
        setFormFields(data.data);

        const savedAnswers = localStorage.getItem(STORAGE_KEY);
        const parsedAnswers = savedAnswers ? JSON.parse(savedAnswers) : {};

        const initialAnswers = {};
        data.data.fields.forEach(field => {
          initialAnswers[field.nameKey] = parsedAnswers[field.nameKey] || '';
        });

        setFormAnswers(initialAnswers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAnswers));
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
    const updated = { ...formAnswers, [name]: value };
    setFormAnswers(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  };

  const startLoadingSequence = () => {
    let currentIndex = 0;
    setLoadingMessage(loadingMessages[currentIndex]);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[currentIndex]);
    }, 3000);

    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const loadingInterval = startLoadingSequence();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Generate marketing content first to get the core message
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formAnswers)
      });

      if (!response.ok) {
        clearInterval(loadingInterval);
        throw new Error('Failed to generate marketing content');
      }

      const data = await response.json();
      clearInterval(loadingInterval);
      setGeneratedContent(data.data);

      // Save both form data and core message to onboarding
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          data: formAnswers,
          coreMessage: data.data?.coreMessage 
        })
      });

      if (data.data?.coreMessage) {
        localStorage.setItem('marketingCoreMessage', data.data.coreMessage);
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
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
      {loading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loaderContainer}>
            <div className={styles.loaderSpinner}></div>
            <p className={styles.loaderMessage}>{loadingMessage}</p>
          </div>
        </div>
      )}
      {showWelcome && formFields ? (
        <WelcomePopup 
          welcomeMessage={formFields.welcomeMessage} 
          onGetStarted={handleGetStarted} 
        />
      ) : (
        <div className={styles.content}>
          <div className={styles.formContainer}>
            <h2>Discovery Questionnaire</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              {formFields?.fields.map((field, index) => (
                <div key={index} className={styles.inputGroup}>
                  <label htmlFor={field.nameKey}>{field.title}</label>
                  {(field.nameKey === 'description' ||
                    field.nameKey === 'targetMarket' ||
                    field.nameKey === 'coreAudience' ||
                    field.nameKey === 'problemSolved' ||
                    field.nameKey === 'competitors' ||
                    field.nameKey === 'differentiators' ||
                    field.nameKey === 'keyFeatures' ||
                    field.nameKey === 'uniqueOffering' ||
                    field.nameKey === 'additionalInfo') ? (
                    <textarea
                      id={field.nameKey}
                      name={field.nameKey}
                      value={formAnswers[field.nameKey]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required
                      disabled={loading}
                    />
                  ) : (
                    <textarea
                      id={field.nameKey}
                      name={field.nameKey}
                      value={formAnswers[field.nameKey]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required
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
                  Generate Marketing Content
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
