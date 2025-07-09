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

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    const updated = { ...formAnswers, [name]: value };
    setFormAnswers(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // If this is the company name field and it has a value
      if (name === 'description' && value.trim()) {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          // Try to create a project with the company name
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              projectName: value.trim()
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Created project:', data);
            // Store the project ID for later use
            localStorage.setItem('currentProjectId', data.data.id);
          } else {
            // If project creation fails, we'll try again during form submission
            console.log('Project will be created during form submission');
          }
        } catch (error) {
          // If project creation fails, we'll try again during form submission
          console.log('Project will be created during form submission:', error);
        }
      }
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

      // Get or create project ID
      let projectId = localStorage.getItem('currentProjectId');
      
      if (!projectId) {
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
        projectId = projectData.data.id;
        localStorage.setItem('currentProjectId', projectId);
      }

      // Generate marketing content first to get the core message
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formAnswers,
          projectId,
          projectName: formAnswers.description // Use the company name as project name
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
        localStorage.setItem('marketingCoreMessage', data.data.coreMessage);
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
