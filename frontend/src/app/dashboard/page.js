'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typewriter } from 'react-simple-typewriter';
import styles from './styles.module.css';

const MessageSkeleton = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState({
    marketing: false,
    content: false,
    social: false
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: '', initials: '' });
  const [activeSection, setActiveSection] = useState('greeting');
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coreMessage, setCoreMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editInputValue, setEditInputValue] = useState('');

  const [folderStructure, setFolderStructure] = useState({
  
  });

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isBriefFormOpen, setIsBriefFormOpen] = useState(false);
  const [briefData, setBriefData] = useState({
    purpose: '',
    main_message: '',
    special_features: '',
    beneficiaries: '',
    benefits: '',
    call_to_action: '',
    importance: '',
    additional_info: ''
  });

  const [audiences, setAudiences] = useState([]);

  const qaPairs = [
    {
      question: "What type of content are you looking to create?",
      options: ["Blog Post", "Social Media", "Email", "Ad Copy"]
    },
    {
      question: "What's your content goal?",
      options: ["Engagement", "Lead Generation", "Brand Awareness", "Sales"]
    }
  ];

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingMessages = [
    'Thinking about the best approach...',
    'Analyzing your request in detail...',
    'Consulting my AI colleagues...',
    'Working on a personalized solution...',
    'Generating some creative ideas...',
    'Putting the finishing touches on your response...',
    'Almost ready with something great...',
    'Just a few more calculations...',
    'Cross-checking for accuracy...',
    'Preparing your tailored answer...'
  ];
  
  useEffect(() => {
    let messageIndex = 0;
    let intervalId;

    if (isLoading) {
      intervalId = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
      }, 2000); // Change message every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  const [isEditingCoreMessage, setIsEditingCoreMessage] = useState(false);
  const [editedCoreMessage, setEditedCoreMessage] = useState('');

  const adjustTextareaHeight = (element) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  const handleEditCoreMessage = async () => {
    try {
      if (!isEditingCoreMessage) {
        setEditedCoreMessage(coreMessage);
        setIsEditingCoreMessage(true);
      } else {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ coreMessage: editedCoreMessage })
        });

        if (!response.ok) {
          throw new Error('Failed to update core message');
        }

        setCoreMessage(editedCoreMessage);
        setIsEditingCoreMessage(false);
        setShowTypewriter(true);
      }
    } catch (error) {
      console.error('Error updating core message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoreMessage = async (shouldRefresh = false) => {
    try {
      setIsRefreshing(true);
      setShowTypewriter(false);
      const token = localStorage.getItem('token');
      if (!token) return;

      const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!onboardingResponse.ok) {
        throw new Error('Failed to fetch onboarding data');
      }

      const { data } = await onboardingResponse.json();
      
      if (shouldRefresh && data) {
        const formData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;

        const marketingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate?refresh=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (!marketingResponse.ok) {
          throw new Error('Failed to generate new marketing content');
        }

        const marketingData = await marketingResponse.json();
        
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ coreMessage: marketingData.data.coreMessage })
        });

        setCoreMessage(marketingData.data.coreMessage);
        setShowTypewriter(true);
      } else if (data && data.core_message) {
        setCoreMessage(data.core_message);
      }
    } catch (error) {
      console.error('Error fetching core message:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoreMessage();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        // Set user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          setUser({
            name: userData.name,
            initials: userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const initials = parsedUser.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
      setUser({ ...parsedUser, initials });
      
      // Fetch projects when user data is available
      fetchProjects();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log('Fetched projects:', data);
        
        // Convert to folder structure without filtering
        const newFolderStructure = data.reduce((acc, project) => {
          const projectKey = project.name.toLowerCase().replace(/\s+/g, '_');
          acc[projectKey] = {
            id: project.id,
            name: project.name,
            status: project.status
          };
          return acc;
        }, {});

        setFolderStructure(newFolderStructure);
        setProjects(data);
      } else {
        console.error('Failed to fetch projects:', response.status);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleFolder = (folderKey) => {
    setExpandedFolders(prev => {
      // Create a new object with all folders closed
      const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      
      // Toggle only the clicked folder
      return {
        ...allClosed,
        [folderKey]: !prev[folderKey]
      };
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userData.id,
          projectName: projectName.trim()
        })
      });

      if (response.ok) {
        setProjectName('');
        setIsProjectPopupOpen(false);
        // Navigate to library after successful project creation
        router.push('/library');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBriefSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      const briefPayload = {
        projectId: selectedFolder.id,
        projectName: selectedFolder.name,
        purpose: briefData.purpose,
        mainMessage: briefData.main_message,
        specialFeatures: briefData.special_features,
        beneficiaries: briefData.beneficiaries,
        benefits: briefData.benefits,
        callToAction: briefData.call_to_action,
        importance: briefData.importance,
        additionalInfo: briefData.additional_info
      };

      console.log('Creating brief with payload:', briefPayload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/create-brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(briefPayload)
      });

      const responseData = await response.json();

      if (response.ok) {
        // Parse and store audiences
        const newAudiences = responseData.data.audiences.map(audience => {
          const segmentData = JSON.parse(audience.segment);
          return {
            id: audience.id,
            name: segmentData.name,
            description: segmentData.description
          };
        });
        setAudiences(newAudiences);

        setBriefData({
          purpose: '',
          main_message: '',
          special_features: '',
          beneficiaries: '',
          benefits: '',
          call_to_action: '',
          importance: '',
          additional_info: ''
        });
        setIsBriefFormOpen(false);
        setError('');
      } else {
        const errorMessage = responseData.message || 'Failed to create brief';
        console.error('Server error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating brief:', error);
      setError(error.message || 'Failed to create brief. Please try again.');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, {
        content: inputMessage,
        type: 'user'
    }]);
    setInputMessage('');
    setIsSending(true);
    setIsRefreshing(true);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        // First get the onboarding data
        const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!onboardingResponse.ok) {
            throw new Error('Failed to fetch onboarding data');
        }

        const { data } = await onboardingResponse.json();
        const formData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;

        // Now make the generate request with the form data
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                formData,
                currentMessage: coreMessage,
                userPrompt: inputMessage
            })
        });

        const marketingData = await response.json();
        
        if (marketingData.success) {
            // Update core message silently
            setCoreMessage(marketingData.data.coreMessage);
            
            // Save the new core message to the database
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ coreMessage: marketingData.data.coreMessage })
            });

            // Add AI response with questions to chat
            setMessages(prev => [...prev, {
                content: marketingData.data.chatResponse,
                type: 'ai'
            }]);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Show error message in chat
        setMessages(prev => [...prev, {
            content: 'Sorry, I encountered an error. Please try again.',
            type: 'ai'
        }]);
    } finally {
        setIsSending(false);
        setIsRefreshing(false);
    }
  };

  // Add effect to handle message updates
  useEffect(() => {
    if (coreMessage && !isRefreshing) {
      setNewMessage(coreMessage);
      setShowTypewriter(true);
    }
  }, [coreMessage, isRefreshing]);

  const handleOptionClick = async (optionType) => {
    try {
      setIsRefreshing(true);
      setShowTypewriter(false);
      const token = localStorage.getItem('token');
      if (!token) return;

      const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!onboardingResponse.ok) {
        throw new Error('Failed to fetch onboarding data');
      }

      const { data } = await onboardingResponse.json();
      
      if (data) {
        const formData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;

        let modificationPrompt = '';
        switch(optionType) {
          case 'shorter':
            modificationPrompt = 'Make this message shorter and punchier while keeping the main point';
            break;
          case 'tone':
            modificationPrompt = 'Make this message more friendly and confident';
            break;
          case 'emphasis':
            modificationPrompt = 'Emphasize the benefits and value more';
            break;
          case 'alternative':
            modificationPrompt = 'Give me an alternative version with a different angle';
            break;
          case 'fresh':
            modificationPrompt = 'Rewrite this with a fresh perspective';
            break;
          default:
            break;
        }

        // Add the current core message and modification request to the form data
        formData.currentMessage = coreMessage;
        formData.modificationRequest = modificationPrompt;
        formData.additionalInfo = `Please modify this core message: "${coreMessage}". ${modificationPrompt}`;

        const marketingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate?refresh=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (!marketingResponse.ok) {
          throw new Error('Failed to generate new marketing content');
        }

        const marketingData = await marketingResponse.json();
        
        if (marketingData.success && marketingData.data) {
          setCoreMessage(marketingData.data.coreMessage);
          setShowTypewriter(true);
          
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ coreMessage: marketingData.data.coreMessage })
          });
        }
      }
    } catch (error) {
      console.error('Error modifying message:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add new function to handle edit submission
  const handleEditSubmit = async (index) => {
    if (!editInputValue.trim()) return;
    
    const originalMessage = messages[index];
    
    // Update the message immediately for better UX
    const updatedMessages = [...messages];
    updatedMessages[index] = {
      ...originalMessage,
      content: editInputValue
    };
    setMessages(updatedMessages);
    
    // Reset edit state
    setEditingMessageIndex(null);
    setEditInputValue('');
    setIsRefreshing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      // Get the onboarding data
      const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!onboardingResponse.ok) {
        throw new Error('Failed to fetch onboarding data');
      }

      const { data } = await onboardingResponse.json();
      const formData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;

      // Make the generate request with the edited message
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formData,
          currentMessage: coreMessage,
          userPrompt: editInputValue
        })
      });

      const marketingData = await response.json();
      
      if (marketingData.success) {
        // Update core message silently
        setCoreMessage(marketingData.data.coreMessage);
        
        // Save the new core message to the database
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ coreMessage: marketingData.data.coreMessage })
        });

        // Add AI response to chat
        setMessages(prev => [...prev, {
          content: marketingData.data.chatResponse,
          type: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      // Revert the message on error
      setMessages(messages);
      setMessages(prev => [...prev, {
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'ai'
      }]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderProjectPopup = () => {
    if (!isProjectPopupOpen) return null;

    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <div className={styles.popupHeader}>
            <h2>Create New Project</h2>
            <button 
              className={styles.closeButton}
              onClick={() => {
                setIsProjectPopupOpen(false);
                setProjectName('');
                setError('');
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleCreateProject}>
            <div className={styles.formGroup}>
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                className={styles.input}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className={styles.popupActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => {
                  setIsProjectPopupOpen(false);
                  setProjectName('');
                  setError('');
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className={styles.submitButton}
                disabled={loading || !projectName.trim()}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderFolderContent = (folder) => {
    return (
      <div className={styles.folderContent}>
        <button 
          className={styles.createBriefButton}
          onClick={() => {
            setSelectedFolder(folder);
            setIsBriefFormOpen(true);
          }}
        >
          
          Create Brief
          <div className={styles.createBriefButtonIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          </div>
        </button>
      </div>
    );
  };

  const renderFolderSection = () => {
    return (
      <div className={styles.folderSection}>
        <div className={styles.folderList}>
          {Object.entries(folderStructure).map(([key, folder]) => (
            <div key={key} className={styles.folderItem}>
              <div 
                className={styles.folderHeader} 
                onClick={() => toggleFolder(key)}
              >
                <div className={styles.folderIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <span>{folder.name}</span>
                <svg 
                  className={`${styles.arrowIcon} ${expandedFolders[key] ? styles.expanded : ''}`} 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
              {expandedFolders[key] && renderFolderContent(folder)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQASection = () => {
    return (
      <div className={styles.qaSection}>
        {isBriefFormOpen && selectedFolder && !audiences.length && (
          <div className={styles.briefForm}>
            <h2>Create Brief for {selectedFolder.name}</h2>
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleBriefSubmit}>
              <div className={styles.formGroup}>
                <label>Purpose</label>
                <textarea
                  value={briefData.purpose}
                  onChange={(e) => setBriefData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="What is the purpose of this brief?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Main Message</label>
                <textarea
                  value={briefData.main_message}
                  onChange={(e) => setBriefData(prev => ({ ...prev, main_message: e.target.value }))}
                  placeholder="What is the main message you want to convey?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Special Features (Optional)</label>
                <textarea
                  value={briefData.special_features}
                  onChange={(e) => setBriefData(prev => ({ ...prev, special_features: e.target.value }))}
                  placeholder="Any special features or unique aspects?"
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Beneficiaries</label>
                <textarea
                  value={briefData.beneficiaries}
                  onChange={(e) => setBriefData(prev => ({ ...prev, beneficiaries: e.target.value }))}
                  placeholder="Who will benefit from this?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Benefits</label>
                <textarea
                  value={briefData.benefits}
                  onChange={(e) => setBriefData(prev => ({ ...prev, benefits: e.target.value }))}
                  placeholder="What are the key benefits?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Call to Action</label>
                <textarea
                  value={briefData.call_to_action}
                  onChange={(e) => setBriefData(prev => ({ ...prev, call_to_action: e.target.value }))}
                  placeholder="What action do you want people to take?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Importance</label>
                <textarea
                  value={briefData.importance}
                  onChange={(e) => setBriefData(prev => ({ ...prev, importance: e.target.value }))}
                  placeholder="Why is this important?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Additional Information (Optional)</label>
                <textarea
                  value={briefData.additional_info}
                  onChange={(e) => setBriefData(prev => ({ ...prev, additional_info: e.target.value }))}
                  placeholder="Any other relevant information?"
                  className={styles.textarea}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsBriefFormOpen(false);
                    setBriefData({
                      purpose: '',
                      main_message: '',
                      special_features: '',
                      beneficiaries: '',
                      benefits: '',
                      call_to_action: '',
                      importance: '',
                      additional_info: ''
                    });
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? 'Creating...' : 'Create Brief'}
                </button>
              </div>
            </form>
          </div>
        )}

        {audiences.length === 0 && isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p className={styles.loadingMessage}>{loadingMessage}</p>
            </div>
          </div>
        )}

        {audiences.length > 0 && (
          <div className={styles.audienceSegments}>
            <div className={styles.audienceHeader}>
              <h3>Target Audience Segments</h3>
              <button 
                onClick={() => {
                  setAudiences([]);
                  setIsBriefFormOpen(true);
                }}
                className={styles.newBriefButton}
              >
                Create New Brief
              </button>
            </div>
            <div className={styles.segmentsList}>
              {audiences.map(audience => (
                <div key={audience.id} className={styles.segmentCard}>
                  <h4>{audience.name}</h4>
                  <p>{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderProjectPopup()}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <img src="/Bold.png" alt="Logo" width={100} height={95} className={styles.logoImage} />
            </div>
          </div>
          <nav className={styles.nav}>
            <ul>
              <li className={activeSection === 'greeting' ? styles.active : ''} onClick={() => setActiveSection('greeting')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Home</span>
              </li>
              <li onClick={() => router.push('/library')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg>
                <span>Library</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Settings</span>
              </li>
            </ul>
          </nav>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.collapsedMain : ''}`}>
        <header className={`${styles.header} ${isSidebarCollapsed ? styles.collapsedHeader : ''}`}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent:"start"}}>
        <button onClick={toggleSidebar} className={styles.toggleButton}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="#1A1A1A" viewBox="0 0 30 30" width="30px" height="30px">
                <path d="M 3 7 A 1.0001 1.0001 0 1 0 3 9 L 27 9 A 1.0001 1.0001 0 1 0 27 7 L 3 7 z M 3 14 A 1.0001 1.0001 0 1 0 3 16 L 27 16 A 1.0001 1.0001 0 1 0 27 14 L 3 14 z M 3 21 A 1.0001 1.0001 0 1 0 3 23 L 27 23 A 1.0001 1.0001 0 1 0 27 21 L 3 21 z"/>
              </svg>
          </button>
          </div>
          <div className={styles.userProfile}>
            <span className={styles.userName}>{user.name || 'Guest'}</span>
            <div className={styles.avatar}>{user.initials || 'G'}</div>
          </div>
        </header>
        <div className={styles.sections}>
        <div className={styles.greetingContainer}>
              <button 
                className={styles.createProjectButton}
                onClick={() => setIsProjectPopupOpen(true)}
              >
                Create New Project
              </button>
            </div>
          <section className={`${styles.section} ${styles.greetingSection}`}>
            
          {coreMessage && (
            <div className={styles.coreMessageSection}>
              <div className={styles.coreMessageContainer}>
                <div className={styles.coreMessageHeader}>
                  <h3>Your Core Marketing Message</h3>
                  
                  <button 
                    onClick={() => fetchCoreMessage(true)}
                    className={styles.refreshButton}
                    disabled={isRefreshing}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className={isRefreshing ? styles.spinning : ''}
                    >
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-4.4 3.6-8 8-8 3.4 0 6.3 2.1 7.4 5M22 12c0 4.4-3.6 8-8 8-3.4 0-6.3-2.1-7.4-5"/>
                    </svg>
                  </button>
                </div>
                  <div className={styles.messageContainer}>
                    {isRefreshing ? (
                      <MessageSkeleton />
                    ) : isEditingCoreMessage ? (
                      <div className={styles.editCoreMessageContainer}>
                        <textarea
                          className={styles.editCoreMessageInput}
                          value={editedCoreMessage}
                          onChange={(e) => setEditedCoreMessage(e.target.value)}
                        />
                        <div className={styles.editCoreMessageActions}>
                          <button
                            className={styles.cancelButton}
                            onClick={() => {
                              setIsEditingCoreMessage(false);
                              setEditedCoreMessage('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className={styles.saveButton}
                            onClick={handleEditCoreMessage}
                            disabled={!editedCoreMessage.trim() || editedCoreMessage === coreMessage}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : showTypewriter ? (
                      <div className={styles.typewriterContainer}>
                        <Typewriter
                          words={[coreMessage]}
                          loop={1}
                          cursor
                          cursorStyle=""
                          typeSpeed={15}
                          delaySpeed={500}
                          onLoopDone={() => {
                            setTimeout(() => setShowTypewriter(false), 500);
                          }}
                        />
                        <button
                          className={styles.editButtonCore}
                          onClick={() => {
                            setIsEditingCoreMessage(true);
                            setEditedCoreMessage(coreMessage);
                            
                          }}
                          aria-label="Edit core message"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className={styles.fadeIn}>
                        <p>{coreMessage}</p>
                        <button
                          className={styles.editButtonCore}
                          onClick={() => {
                            setIsEditingCoreMessage(true);
                            setEditedCoreMessage(coreMessage);
                          }}
                          aria-label="Edit core message"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.messageOptions}>
                    <button 
                      className={styles.optionButton} 
                      onClick={() => handleOptionClick('shorter')}
                      disabled={isRefreshing}
                    >
                      Make it Shorter
                    </button>
                    <button 
                      className={styles.optionButton} 
                      onClick={() => handleOptionClick('tone')}
                      disabled={isRefreshing}
                    >
                      Adjust Tone
                    </button>
                    <button 
                      className={styles.optionButton} 
                      onClick={() => handleOptionClick('emphasis')}
                      disabled={isRefreshing}
                    >
                      Add Emphasis
                    </button>
                    <button 
                      className={styles.optionButton} 
                      onClick={() => handleOptionClick('alternative')}
                      disabled={isRefreshing}
                    >
                      Try Alternative
                    </button>
                    <button 
                      className={styles.optionButton} 
                      onClick={() => handleOptionClick('fresh')}
                      disabled={isRefreshing}
                    >
                      Fresh Perspective
                    </button>
                  </div>

                <div className={styles.chatInterface}>
                <div className={styles.chatMessages}>
                  {messages.map((message, index) => (
                    <div key={index} className={`${styles.messageContent} ${message.type === 'user' ? styles.userMessage : styles.aiMessage}`}>
                      {message.type === 'user' && editingMessageIndex !== index ? (
                        <>
                          <button
                            className={styles.editButton}
                            onClick={() => {
                              setEditingMessageIndex(index);
                              setEditInputValue(message.content);
                            }}
                            aria-label="Edit message"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <p>{message.content}</p>
                        </>
                      ) : editingMessageIndex === index ? (
                        <div className={styles.editInputContainer}>
                          <input
                            type="text"
                            className={styles.editInput}
                            value={editInputValue}
                            onChange={(e) => setEditInputValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleEditSubmit(index);
                              }
                            }}
                            onBlur={() => {
                              // Small delay to allow button click to register before blur
                              setTimeout(() => {
                                setEditingMessageIndex(null);
                                setEditInputValue('');
                              }, 200);
                            }}
                            autoFocus
                          />
                          <button
                            className={styles.editSendButton}
                            onClick={() => handleEditSubmit(index)}
                            disabled={!editInputValue.trim()}
                            aria-label="Send edited message"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 2L11 13" />
                              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    className={styles.messageInput}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isRefreshing}
                  />
                  <button
                    className={styles.sendButton}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isRefreshing}
                  >
                    Send
                  </button>
                </div>
              </div>
              </div>
            </div>
          )}
          </section>
        </div>
      </main>
    </div>
  );
}
