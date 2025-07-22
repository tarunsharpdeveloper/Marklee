'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';
import PreHomeNavbar from '../components/PreHomeNavbar';
import WelcomePopup from './components/WelcomePopup';

const getStorageKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return `marketingAnswers_${user.id || 'anonymous'}`;
};

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
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/';
          return;
        }

        // Check user role
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          window.location.href = '/';
          return;
        }

        // If admin, redirect to admin panel
        if (userData.role === 'admin') {
          window.location.href = '/usermanagement';
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '/';
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Clear any old marketing answers data that might be from a different user
    const clearOldData = () => {
      const oldKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('marketingAnswers') && !key.includes('_')
      );
      oldKeys.forEach(key => localStorage.removeItem(key));
    };
    
    clearOldData();
    
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

        const storageKey = getStorageKey();
        const savedAnswers = localStorage.getItem(storageKey);
        const parsedAnswers = savedAnswers ? JSON.parse(savedAnswers) : {};

        const initialAnswers = {};
        data.data.fields.forEach(field => {
          initialAnswers[field.nameKey] = parsedAnswers[field.nameKey] || '';
        });

        setFormAnswers(initialAnswers);
        localStorage.setItem(storageKey, JSON.stringify(initialAnswers));
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

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    const updated = { ...formAnswers, [name]: value };
    setFormAnswers(updated);
    
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updated));
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

    // Validate required fields
    const requiredFields = ['description', 'productSummary', 'coreAudience', 'outcome'];
    const missingFields = requiredFields.filter(field => !formAnswers[field]?.trim());

    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const loadingInterval = startLoadingSequence();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Create a project with the company name
      const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: formAnswers.description.trim()
        })
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const projectData = await projectResponse.json();
      const projectId = projectData.data.id;
      localStorage.setItem('currentProjectId', projectId);

      // Generate marketing content
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formAnswers,
          projectId,
          projectName: formAnswers.description
        })
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
          coreMessage: data.data?.coreMessage,
          projectId
        })
      });

      if (data.data?.coreMessage) {
        const storedData = {
          message: data.data.coreMessage,
          timestamp: Date.now(),
          context: 'core-message'
        };
        localStorage.setItem('marketingCoreMessage', JSON.stringify(storedData));
      }

      // Clear the stored project ID since we're done with it
      localStorage.removeItem('currentProjectId');

      router.push('/dashboard');
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
      clearInterval(loadingInterval);
    }
  };

  if (isInitialLoading) {
    return (
      <div className={styles.container}>
        <PreHomeNavbar />
        <div className={styles.loadingOverlay}>
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p className={styles.loadingMessage}>Loading your workspace...</p>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PreHomeNavbar />

      {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p className={styles.loadingMessage}>{loadingMessage}</p>
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
              {formFields?.fields.map((field, index) => {
                // Check if field is one of the required ones
                const isRequired = field.nameKey === 'description' || 
                                 field.nameKey === 'productSummary' ||
                                 field.nameKey === 'coreAudience' ||
                                 field.nameKey === 'outcome';
                
                return (
                  <div key={index} className={styles.inputGroup}>
                    <label htmlFor={field.nameKey}>
                      {field.title}
                      {isRequired && <span className={styles.requiredIndicator}>*</span>}
                    </label>
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
                        required={isRequired}
                        disabled={loading}
                      />
                    ) : (
                      <textarea
                        id={field.nameKey}
                        name={field.nameKey}
                        value={formAnswers[field.nameKey]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        required={isRequired}
                        disabled={loading}
                      />
                    )}
                    {field.guidance && (
                      <small className={styles.guidance}>{field.guidance}</small>
                    )}
                  </div>
                );
              })}
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
