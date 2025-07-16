'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard/styles.module.css';
import Image from 'next/image';
import { Typewriter } from 'react-simple-typewriter';

// Helper function defined at the top level
const getAllValues = (obj) => {
  let values = [];
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        values = values.concat(getAllValues(obj[key]));
      } else if (obj[key] !== null && obj[key] !== undefined) {
        values.push(String(obj[key]));
      }
    }
  }
  return values;
};

const MemoizedEditAudiencePopup = memo(({ 
    isOpen, 
    audience, 
    briefData,
    onClose, 
    onSave 
}) => {
    const [localInputMessage, setLocalInputMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localSegment, setLocalSegment] = useState(audience?.segment || "");
    const [showMobileEdit, setShowMobileEdit] = useState(false);
    const textareaRef = useRef(null);
    const chatContainerRef = useRef(null);
    const router = useRouter();
    const timeoutRef = useRef(null);

    // Add effect to show edit view when AI responds
    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].type === 'ai' && window.innerWidth <= 838) {
            setShowMobileEdit(true);
        }
    }, [messages]);

    // Modified useEffect to scroll only on user messages
    useEffect(() => {
        if (chatContainerRef.current && messages.length > 0 && messages[messages.length - 1].type === 'ai') {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]); // Will only trigger when messages array changes

    // Initialize textarea value once
    useEffect(() => {
        if (audience?.segment) {
            setLocalSegment(audience.segment);
        }
    }, []); // Empty dependency array - only run once

    const handleTextAreaChange = (e) => {
        const newValue = e.target.value;
        setLocalSegment(newValue);
    };

    const handleLocalSendMessage = async () => {
        if (!localInputMessage.trim()) return;

        setMessages(prev => [...prev, { content: localInputMessage, type: 'user' }]);
        setLocalInputMessage('');
        setIsRefreshing(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        formData: {
                            labelName: briefData.labelName,
                            whoTheyAre: briefData.whoTheyAre,
                            whatTheyWant: briefData.whatTheyWant,
                            whatTheyStruggle: briefData.whatTheyStruggle,
                            additionalInfo: briefData.additionalInfo
                        },
                        currentMessage: localSegment,
                        userPrompt: localInputMessage,
                        isAudienceEdit: true
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    content: data.data.chatResponse,
                    type: 'ai'
                }]);
                
                // Clear any pending timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                // Set new value with a small delay
                timeoutRef.current = setTimeout(() => {
                    setLocalSegment(data.data.coreMessage);
                }, 100);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                content: "Sorry, I encountered an error. Please try again.",
                type: 'ai'
            }]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!audience?.id) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/audience/${audience.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    segment: localSegment
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update audience');
            }

            // Call the parent's onSave with the updated audience
            onSave({
                ...audience,
                segment: localSegment
            });
        } catch (error) {
            console.error('Error updating audience:', error);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    if (!isOpen || !audience) return null;

    return (
        <div className={styles.editPopupOverlay}>
            <div className={styles.editPopupContent}>
                <div className={`${styles.editPopupLeft} ${showMobileEdit ? styles.hideMobile : ''}`}>
                    <div className={styles.editPopupHeader}>
                        <h2>Message Assistant</h2>
                        <button
                            className={styles.editPopupCloseButton}
                            onClick={onClose}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className={styles.chatMessages} ref={chatContainerRef}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.messageContent} ${
                                    message.type === "user"
                                        ? styles.userMessage
                                        : styles.aiMessage
                                }`}
                            >
                                <p>{message.content}</p>
                            </div>
                        ))}
                        {isRefreshing && (
                            <div className={styles.aiMessage}>
                                <div className={styles.loadingDots}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            className={styles.messageInput}
                            value={localInputMessage}
                            onChange={(e) => setLocalInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleLocalSendMessage();
                                }
                            }}
                            placeholder="Type your message..."
                        />
                        <button
                            className={styles.sendButton}
                            onClick={handleLocalSendMessage}
                            disabled={isRefreshing || !localInputMessage.trim()}
                        >Send
                        </button>
                    </div>
                </div>
                <div className={`${styles.editPopupRight} ${!showMobileEdit ? styles.hideMobile : ''}`}>
                    {window.innerWidth <= 838 && (
                        <button 
                            className={styles.backButton}
                            onClick={() => setShowMobileEdit(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Chat
                        </button>
                    )}
                    <div className={styles.editPopupHeader}>
                        <h2>Edit Audience</h2>
                    </div>
                    <div className={styles.formGroup}>
                        <textarea
                            ref={textareaRef}
                            className={styles.editCoreMessageInput}
                            value={localSegment}
                            onChange={handleTextAreaChange}
                            placeholder="Type your audience description here..."
                        />
                    </div>
                    <div className={styles.editCoreMessageActions}>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

MemoizedEditAudiencePopup.displayName = 'MemoizedEditAudiencePopup';

const Library = () => {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false); // Set to false initially
  const [error, setError] = useState('');
  const [folderStructure, setFolderStructure] = useState({});
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isBriefFormOpen, setIsBriefFormOpen] = useState(false);
  const [audiences, setAudiences] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showFolderSection, setShowFolderSection] = useState(true);
  const [showQASection, setShowQASection] = useState(true);
  const [isAssetPopupOpen, setIsAssetPopupOpen] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState('');
  const [briefData, setBriefData] = useState({
    audienceType: null,
    labelName: '',
    whoTheyAre: '',
    whatTheyWant: '',
    whatTheyStruggle: '',
    additionalInfo: '',
    description: '',
    whoItHelps: '',
    problemItSolves: ''
  });
  const [currentBriefId, setCurrentBriefId] = useState(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingQuestions] = useState([
    "Analyzing your brief requirements...",
    "Identifying key audience segments...",
    "Generating detailed audience insights...",
    "Creating personalized messaging strategies...",
    "Finalizing audience profiles..."
  ]);
  const [assetLoadingQuestions] = useState([
    "Analyzing your content requirements...",
    "Crafting engaging content...",
    "Optimizing for your target audience...",
    "Adding final touches...",
    "Preparing your content..."
  ]);
  const [briefQuestions, setBriefQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false); // Set to false initially
  const [coreMessage, setCoreMessage] = useState('');
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditAudiencePopupOpen, setIsEditAudiencePopupOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState(null);
  const [checkedAudiences, setCheckedAudiences] = useState({});
  const [isSavingAudiences, setIsSavingAudiences] = useState(false);
  const [savedAudiences, setSavedAudiences] = useState({});  // briefId -> saved audiences map

  // Define all functions before using them
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      // Don't set loading state for initial fetch
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log('Fetched projects:', data);
        
        // Convert to folder structure with briefs
        const newFolderStructure = data.reduce((acc, project) => {
          const projectKey = project.name.toLowerCase().replace(/\s+/g, '_');
          acc[projectKey] = {
            id: project.id,
            name: project.name,
            status: project.status,
            briefs: project.briefs || [] // Include briefs array from the response
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
  
  const toggleFolder = (folderKey) => {
    setExpandedFolders(prev => {
      const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      
      return {
        ...allClosed,
        [folderKey]: !prev[folderKey]
      };
    });
  };

  const handleCreateProject = () => {
    setIsProjectPopupOpen(true);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: projectName.trim()
        })
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log('Created project:', data);

        // Add new project to folder structure
        const projectKey = data.name.toLowerCase().replace(/\s+/g, '_');
        setFolderStructure(prev => ({
          ...prev,
          [projectKey]: {
            id: data.id,
            name: data.name,
            status: data.status,
            briefs: [] // Initialize empty briefs array
          }
        }));

        setProjectName('');
        setIsProjectPopupOpen(false);
        
        // Expand the new folder
        setExpandedFolders(prev => ({
          ...prev,
          [projectKey]: true
        }));

        // Refresh projects list
        fetchProjects();
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

  const renderProjectPopup = () => {
    if (!isProjectPopupOpen) return null;

    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <div className={styles.popupHeader}>
            <h2>Create New Project</h2>
            <button 
              className={styles.closeButton}
              onClick={() => setIsProjectPopupOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <form onSubmit={handleProjectSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className={styles.input}
                autoFocus
              />
              {error && <div className={styles.error}>{error}</div>}
            </div>
            <div className={styles.popupActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setIsProjectPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={!projectName.trim() || loading}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const handleCreateBrief = async (folder) => {
   
   
    setSelectedFolder(folder);
    setIsBriefFormOpen(true);
    setAudiences([]); // Clear any existing audiences
    setShowQASection(true);
    
    if (isMobileView) {
      setShowFolderSection(false);
    }
  };

  const handleBackToFolders = () => {
    setIsBriefFormOpen(false);
    setSelectedFolder(null);
    setShowFolderSection(true);
    setShowQASection(false);
    // Reset briefData to empty values for all fields
    const resetBriefData = {};
    briefQuestions.forEach(question => {
      resetBriefData[question.input_field_name] = '';
    });
    setBriefData(resetBriefData);
  };

  const handleBackFromAudience = () => {
    setAudiences([]);
    // Reset briefData to empty values for all fields
    const resetBriefData = {};
    briefQuestions.forEach(question => {
      resetBriefData[question.input_field_name] = '';
    });
    setBriefData(resetBriefData);
    // Always show folder section when going back from audience
    setShowFolderSection(true);
    setIsBriefFormOpen(false);
    setShowQASection(false);
  };

  const renderFolderContent = (folder) => {
    return (
      <div className={styles.folderContent}>
        {/* <button 
          className={styles.createBriefButton}
          onClick={() => handleCreateBrief(folder)}
        >
          Create Brief
          <div className={styles.createBriefButtonIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </button> */}

        {/* Display Briefs */}
        {folder.briefs && folder.briefs.length > 0 && (
          <div className={styles.briefsList}>
            {folder.briefs.map((brief, index) => (
              console.log(brief),
              <div key={brief.id || index} className={styles.briefCard}>
                <div className={styles.briefHeader} onClick={() => handleBriefClick(brief.id)}>
                  <h4>Target Audiences</h4>
                </div>
                {/* Show saved audiences for this brief */}
                {/* {savedAudiences[brief.id] && savedAudiences[brief.id].length > 0 && (
                  <div className={styles.savedAudiences}>
                    <h5>Target Audiences</h5>
                    <ul>
                      {savedAudiences[brief.id].map((audience, idx) => (
                        <li key={idx}>Target audience {idx + 1}</li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleBriefClick = async (briefId) => {
    try {
      setCurrentBriefId(briefId); // Store the current brief ID
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/brief/${briefId}/audience`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch brief details');
      }

      const data = await response.json();
      
      // Update the audiences state with the fetched data
      if (data.data && data.data.length > 0) {
        const formattedAudiences = data.data.map(audience => {
          let name = 'Audience Segment';
          let description = '';
          try {
            const segmentData = JSON.parse(audience.segment);
            if (typeof segmentData === 'object' && segmentData !== null) {
              name = segmentData.name || 'Untitled Segment';
              description = segmentData.description || '';
            } else if (typeof segmentData === 'string') {
              name = segmentData;
              try {
                const insightsData = JSON.parse(audience.insights);
                if (Array.isArray(insightsData)) {
                  description = insightsData.join(' ');
                } else if (typeof insightsData === 'object' && insightsData !== null) {
                  description = getAllValues(insightsData).join(' ').replace(/<br\s*\/?>/gi, ' ');
                } else {
                  description = String(insightsData);
                }
                description = description.substring(0, 150) + (description.length > 150 ? '...' : '');
              } catch (e) {
                description = 'No description available.';
              }
            }
          } catch (e) {
            name = 'Error Parsing Segment';
            description = '';
          }
          return { ...audience, name, description };
        });

        // If there are saved audiences for this brief, show only those
        if (savedAudiences[briefId] && savedAudiences[briefId].length > 0) {
          setAudiences(savedAudiences[briefId]);
        } else {
          // Otherwise show all available audiences
          setAudiences(formattedAudiences);
        }
      }

      // Show the brief form section to display the audiences
      setIsBriefFormOpen(true);
    } catch (error) {
      console.error('Error fetching brief details:', error);
      setError('Failed to load brief details');
    }
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
      <div className={`${styles.qaSection} ${!isBriefFormOpen && isMobileView ? styles.hidden : ''}`}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p className={styles.loadingMessage}>{loadingMessage}</p>
            </div>
          </div>
        )}
        {isBriefFormOpen && selectedFolder && !audiences.length && !showGeneratedContent && (
          <div className={styles.briefForm}>
            <button className={styles.backButton} onClick={handleBackToFolders}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2>Create Brief</h2>
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleBriefSubmit}>
              {questionsLoading ? (
                <div className={styles.loadingOverlay}>
                  <div className={styles.loadingContainer}>
                    <div className={styles.loader}></div>
                    <p className={styles.loadingMessage}>Loading questions...</p>
                  </div>
                </div>
              ) : (
                  <>
                    <div className={styles.formGroup}>
                      <h1>How would you like to define your audience?</h1>
                      <div className={styles.radioGroup}>
                        <div className={`${styles.radioOption} ${briefData.audienceType === 'know' ? styles.selected : ''}`}>
                          <input
                            type="radio"
                            name="audienceType"
                            value="know"
                            checked={briefData.audienceType === 'know'}
                            onChange={(e) => setBriefData({ 
                              audienceType: e.target.value,
                              labelName: '',
                              whoTheyAre: '',
                              whatTheyWant: '',
                              whatTheyStruggle: '',
                              additionalInfo: ''
                            })}
                            id="know"
                          />
                          <label htmlFor="know" className={styles.radioLabel}>I know my audience</label>
                        </div>
                        <div className={`${styles.radioOption} ${briefData.audienceType === 'suggest' ? styles.selected : ''}`}>
                          <input
                            type="radio"
                            name="audienceType"
                            value="suggest"
                            checked={briefData.audienceType === 'suggest'}
                            onChange={(e) => {
                              setBriefData({ 
                                audienceType: e.target.value
                              });
                              // Automatically submit for audience suggestions
                              setTimeout(() => handleBriefSubmit(new Event('submit')), 0);
                            }}
                            id="suggest"
                          />
                          <label htmlFor="suggest" className={styles.radioLabel}>Suggest audiences for me</label>
                        </div>
                      </div>
                      {briefData.audienceType === 'know' && (
                        <div className={styles.questionsContainer}>
                          <div className={styles.formGroup}>
                            <h4>Label / Persona name</h4>
                            <textarea
                              value={briefData.labelName || ''}
                              onChange={(e) => setBriefData(prev => ({ ...prev, labelName: e.target.value }))}
                              className={styles.textarea}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <h4>Who they are (role, life stage, market segment)?</h4>
                            <textarea
                              value={briefData.whoTheyAre || ''}
                              onChange={(e) => setBriefData(prev => ({ ...prev, whoTheyAre: e.target.value }))}
                              className={styles.textarea}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <h4>What they want (main goal or desired outcome)?</h4>
                            <textarea
                              value={briefData.whatTheyWant || ''}
                              onChange={(e) => setBriefData(prev => ({ ...prev, whatTheyWant: e.target.value }))}
                              className={styles.textarea}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <h4>What they struggle with (main pain point or problem)?</h4>
                            <textarea
                              value={briefData.whatTheyStruggle || ''}
                              onChange={(e) => setBriefData(prev => ({ ...prev, whatTheyStruggle: e.target.value }))}
                              className={styles.textarea}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <h4>(Optional) Age, channels, purchasing power, etc.</h4>
                            <textarea
                              value={briefData.additionalInfo || ''}
                              onChange={(e) => setBriefData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                              className={styles.textarea}
                            />
                          </div>
                          <button className={styles.submitButton} type="submit">Generate</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </form>
          </div>
        )}
        {showGeneratedContent && (
          <div className={styles.coreMessageSection}>
            <button className={styles.backButton} onClick={() => {
              setShowGeneratedContent(false);
              setGeneratedContent('');
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className={styles.coreMessageContainer}>
              <div className={styles.coreMessageHeader}>
                {/* <h3>Your Core Marketing Message</h3> */}
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
                  <div className={styles.skeleton}>
                    <div className={styles.skeletonLine}></div>
                    <div className={styles.skeletonLine}></div>
                    <div className={styles.skeletonLine}></div>
                    <div className={styles.skeletonLine}></div>
                  </div>
                ) : showTypewriter ? (
                  <div className={styles.typewriterContainer}>
                    <Typewriter
                      words={[generatedContent]}
                      loop={1}
                      cursor
                      cursorStyle=""
                      typeSpeed={15}
                      delaySpeed={500}
                      onLoopDone={() => {
                        setTimeout(() => setShowTypewriter(false), 500);
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.typewriterContainer}>
                    {generatedContent.split('\n\n').map((section, index) => {
                      if (section.includes(':')) {
                        const [title, ...content] = section.split('\n');
                        return (
                          <div key={index}>
                            <h4>{title}</h4>
                            {content.map((line, i) => (
                              <p key={i}>{line.trim()}</p>
                            ))}
                          </div>
                        );
                      }
                      return <p key={index}>{section}</p>;
                    })}
                  </div>
                )}
              </div>
              {/* <div className={styles.messageOptions}>
                <button 
                  className={styles.optionButton}
                  onClick={() => handleOptionClick('make it shorter')}
                  disabled={isRefreshing}
                >
                  Make it shorter
                      </button>
                      <button 
                  className={styles.optionButton}
                  onClick={() => handleOptionClick('make it longer')}
                  disabled={isRefreshing}
                >
                  Make it longer
                </button>
                <button 
                  className={styles.optionButton}
                  onClick={() => handleOptionClick('make it more professional')}
                  disabled={isRefreshing}
                >
                  More professional
                </button>
                <button 
                  className={styles.optionButton}
                  onClick={() => handleOptionClick('make it more casual')}
                  disabled={isRefreshing}
                >
                  More casual
                      </button>
                    </div> */}
              <div className={styles.chatInterface}>
                <div className={styles.chatMessages}>
                  {messages.map((message, index) => (
                    <div key={index} className={`${styles.messageContent} ${message.type === 'user' ? styles.userMessage : styles.aiMessage}`}>
                      <p>{message.content}</p>
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
        {audiences.length > 0 && !showGeneratedContent && (
          console.log(audiences),
          <div className={styles.audienceSegments}>
              <button className={styles.backButton} onClick={handleBackFromAudience}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            <div className={styles.audienceHeader}>
              <h3>Target Audience Segments</h3>
              {!savedAudiences[currentBriefId] && (
                <button 
                  className={styles.saveAudiencesButton}
                  onClick={handleSaveSelectedAudiences}
                  disabled={isSavingAudiences || !Object.values(checkedAudiences).some(isChecked => isChecked)}
                >
                  {isSavingAudiences ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
            <div className={styles.segmentsList}>
              {audiences.map((audience, index) => (
                console.log(audience),
                <div key={index} className={styles.segmentCard}>
                    <div className={styles.segmentHeader}>
                        {!savedAudiences[currentBriefId] && (
                          <input 
                            type="checkbox"
                            checked={checkedAudiences[audience.id] || false}
                            onChange={() => handleCheckAudience(audience.id)}
                          />
                        )}
                        {/* <h4>{audience.segment}</h4> */}
                        <button
                            className={styles.editAudienceButton}
                            onClick={() => handleEditAudience(audience)}
                        >
                            <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    </div>
                    <p>{audience.segment}</p>
                    <div className={styles.audienceActions}>
                        <button
                            className={styles.viewDetailsButton}
                            onClick={() => handleViewAudience(audience)}
                        >
                            view
                        </button>
                        {/* <button className={styles.generateDocumentButton} onClick={() => {
                            setSelectedAudienceId(audience.id);
                            setSelectedAssetType(audience.segment);
                            setIsAssetPopupOpen(true);
                        }}>Generate <Image
                            src="/GenerateDoc.png"
                            alt="Marklee Logo"
                            width={20}
                            height={20}
                            priority
                        /></button> */}
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const startLoadingSequence = (questions, setMessage) => {
    let currentIndex = 0;
    setMessage(questions[currentIndex]);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % questions.length;
      setMessage(questions[currentIndex]);
    }, 3000);

    return interval;
  };

  const handleBriefSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      if (briefData.audienceType === 'know') {
        // Validate required fields
        if (!briefData.labelName || !briefData.whoTheyAre || !briefData.whatTheyWant || !briefData.whatTheyStruggle) {
          throw new Error('Please fill in all required fields');
        }

        // Add validation for selectedFolder
        if (!selectedFolder || !selectedFolder.id) {
          throw new Error('No folder selected. Please select a folder first.');
        }

        // Start loading sequence
        const loadingInterval = startLoadingSequence(loadingQuestions, setLoadingMessage);

        // Handle "I Know My Audience" path
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-from-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
          body: JSON.stringify({
            labelName: briefData.labelName,
            whoTheyAre: briefData.whoTheyAre,
            whatTheyWant: briefData.whatTheyWant,
            whatTheyStruggle: briefData.whatTheyStruggle,
            additionalInfo: briefData.additionalInfo,
            projectId: selectedFolder.id,
            projectName: selectedFolder.name
          })
        });

        if (!response.ok) {
          clearInterval(loadingInterval);
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate core message');
        }

        const data = await response.json();
        clearInterval(loadingInterval);
        
        if (data.success) {
          setGeneratedContent(data.data.coreMessage);
          setCoreMessage(data.data.coreMessage);
          setMessages(prevMessages => [
            ...prevMessages,
            { type: 'assistant', content: data.data.chatResponse }
          ]);
          setShowTypewriter(true);
          setShowGeneratedContent(true);

          // If we have brief and audience data, update the folder structure
          if (data.data.brief && data.data.audience) {
            setCurrentBriefId(data.data.brief.id);
            
            // Update folder structure with new brief and audience
            const folderKey = selectedFolder.name.toLowerCase().replace(/\s+/g, '_');
            setFolderStructure(prev => {
              const currentFolder = prev[folderKey] || {};
              const currentBriefs = currentFolder.briefs || [];
              
              return {
                ...prev,
                [folderKey]: {
                  ...currentFolder,
                  briefs: [
                    ...currentBriefs,
                    {
                      ...data.data.brief,
                      audiences: [data.data.audience]
                    }
                  ]
                }
              };
            });
          }
        }
      } else {
        // Handle "Suggest audiences for me" path
        // Start loading sequence
        startLoadingSequence(loadingQuestions, setLoadingMessage);

        // Add validation for selectedFolder
        if (!selectedFolder || !selectedFolder.id) {
          throw new Error('No folder selected. Please select a folder first.');
        }

        // Get the onboarding data first
        const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!onboardingResponse.ok) {
          throw new Error('Failed to fetch onboarding data');
        }

        const onboardingData = await onboardingResponse.json();
        if (!onboardingData.data || !onboardingData.data.data) {
          throw new Error('No Discovery Questionnaire data found. Please complete the questionnaire first.');
        }

        const formData = typeof onboardingData.data.data === 'string' 
          ? JSON.parse(onboardingData.data.data) 
          : onboardingData.data.data;

        // Map Discovery Questionnaire data to required fields
        const mappedData = {
          description: formData.productSummary || formData.description || '',
          whoItHelps: formData.coreAudience || formData.targetMarket || '',
          problemItSolves: formData.outcome || formData.problemSolved || '',
          projectId: selectedFolder.id,
          projectName: selectedFolder.name
        };

        // Validate required fields
        if (!mappedData.description || !mappedData.whoItHelps || !mappedData.problemItSolves) {
          throw new Error('Insufficient data in Discovery Questionnaire. Please make sure you have filled out the product summary, core audience, and outcome sections.');
        }

        // Use the mapped data to generate audiences
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-suggested-audiences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mappedData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate audience suggestions');
        }

        const data = await response.json();
        
        if (data.success) {
          setAudiences(data.data.audiences);

          // If we have brief data, update the folder structure
          if (data.data.brief) {
            setCurrentBriefId(data.data.brief.id);
            
            // Update folder structure with new brief and audiences
            const folderKey = selectedFolder.name.toLowerCase().replace(/\s+/g, '_');
            setFolderStructure(prev => {
              const currentFolder = prev[folderKey] || {};
              const currentBriefs = currentFolder.briefs || [];
              
              return {
                ...prev,
                [folderKey]: {
                  ...currentFolder,
                  briefs: [
                    ...currentBriefs,
                    {
                      ...data.data.brief,
                      audiences: data.data.audiences
                    }
                  ]
                }
              };
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in brief submission:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const renderAssetPopup = () => {
    if (!isAssetPopupOpen) return null;

    const assetTypes = [
      "Ad Copy",
      "Landing Page",
      "Email",
      "Headline",
      "Social Media Post",
      "Product Description",
      "Company Bio",
      "Sales Funnel",
      "Tagline"
    ];

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Generate Asset</h2>
            <button 
              className={styles.closeButton}
              onClick={() => setIsAssetPopupOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className={styles.modalBody}>
            {loading && (
              <div className={styles.loadingOverlay} style={{ zIndex: 1000 }}>
                <div className={styles.loadingContainer}>
                  <div className={styles.loader}></div>
                  <p className={styles.loadingMessage}>{loadingMessage}</p>
                </div>
              </div>
            )}
            <div className={styles.formGroup}>
              <label htmlFor="assetType">Select Asset Type</label>
              <select 
                id="assetType" 
                className={styles.assetSelect}
                onChange={(e) => setSelectedAssetType(e.target.value)}
              >
                <option value="">Select an asset type</option>
                {assetTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancel}
                onClick={() => setIsAssetPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.generateButton}
                onClick={async () => {
                  let loadingInterval;
                  try {
                    setLoading(true);
                    loadingInterval = startLoadingSequence(assetLoadingQuestions, setLoadingMessage);
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-content`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({
                        briefId: currentBriefId,
                        audienceId: selectedAudienceId,
                        assetType: selectedAssetType
                      })
                    });
                    const responseData = await response.json();
                    if (responseData.success) {
                      setGeneratedContent(responseData.data.content);
                      setShowGeneratedContent(true);
                      setIsAssetPopupOpen(false);
                      clearInterval(loadingInterval);
                      setLoading(false);
                      setLoadingMessage('');
                    } else {
                      throw new Error(responseData.message || 'Failed to generate content');
                    }
                  } catch (error) {
                    console.error('Error generating asset:', error);
                    if (loadingInterval) {
                      clearInterval(loadingInterval);
                    }
                    setLoading(false);
                    setLoadingMessage('');
                  }
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleViewAudience = (audience) => {
    setSelectedAudience(audience);
    setDrawerOpen(true);
  };

  const fetchCoreMessage = async (refresh = false) => {
    try {
      setIsRefreshing(true);
      setShowTypewriter(false);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      // Validate project information
      if (!selectedFolder || !selectedFolder.id) {
        throw new Error('No folder selected. Please select a folder first.');
      }

      // Use generate-from-audience endpoint with refresh parameter
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-from-audience${refresh ? '?refresh=true' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          labelName: briefData.labelName,
          whoTheyAre: briefData.whoTheyAre,
          whatTheyWant: briefData.whatTheyWant,
          whatTheyStruggle: briefData.whatTheyStruggle,
          additionalInfo: briefData.additionalInfo,
          currentMessage: generatedContent,
          projectId: selectedFolder.id,
          projectName: selectedFolder.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate core message');
      }

      const data = await response.json();
      if (data.success) {
        setGeneratedContent(data.data.coreMessage);
        setShowTypewriter(true);

        // Add AI response to chat if available
        if (data.data.chatResponse) {
          setMessages(prev => [...prev, {
            content: data.data.chatResponse,
            type: 'ai'
          }]);
        }
      } else {
        throw new Error(data.message || 'Failed to generate core message');
      }
    } catch (error) {
      console.error('Error generating core message:', error);
      setError(error.message || 'Failed to generate core message');
      setMessages(prev => [...prev, {
        content: 'Sorry, I encountered an error while refreshing the core message. Please try again.',
        type: 'ai'
      }]);
    } finally {
      setIsRefreshing(false);
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
    setIsRefreshing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      // Get the current form data
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formData: {
            labelName: briefData.labelName,
            whoTheyAre: briefData.whoTheyAre,
            whatTheyWant: briefData.whatTheyWant,
            whatTheyStruggle: briefData.whatTheyStruggle,
            additionalInfo: briefData.additionalInfo
          },
          currentMessage: coreMessage,
          userPrompt: inputMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update core message
        setCoreMessage(data.data.coreMessage);
        setShowTypewriter(true);
        
        // Add AI response to chat
        setMessages(prev => [...prev, {
          content: data.data.chatResponse,
          type: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'ai'
      }]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOptionClick = async (option) => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formData: {
            labelName: briefData.labelName,
            whoTheyAre: briefData.whoTheyAre,
            whatTheyWant: briefData.whatTheyWant,
            whatTheyStruggle: briefData.whatTheyStruggle,
            additionalInfo: briefData.additionalInfo
          },
          currentMessage: generatedContent,
          userPrompt: option
        })
      });

      if (!response.ok) {
        throw new Error('Failed to modify message');
      }

      const data = await response.json();
      
      if (data.success) {
        setGeneratedContent(data.data.coreMessage);
        setCoreMessage(data.data.coreMessage);
        setShowTypewriter(true);
        
        // Add AI response to chat if available
        if (data.data.chatResponse) {
          setMessages(prev => [...prev, {
            content: data.data.chatResponse,
            type: 'ai'
          }]);
        }
      }
    } catch (error) {
      console.error('Error modifying message:', error);
      setError('Failed to modify message. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditAudience = (audience) => {
    setEditingAudience(audience);
    setIsEditAudiencePopupOpen(true);
  };

  const handleCloseEditPopup = () => {
    setIsEditAudiencePopupOpen(false);
    setEditingAudience(null);
  };

  const handleSaveEditedAudience = (updatedAudience) => {
    // Update the audiences list
    setAudiences(audiences.map(a => 
      a.id === updatedAudience.id ? updatedAudience : a
    ));
    setIsEditAudiencePopupOpen(false);
    setEditingAudience(null);
  };

  const handleCheckAudience = (audienceId) => {
    setCheckedAudiences(prev => ({
      ...prev,
      [audienceId]: !prev[audienceId]
    }));
  };

  const handleSaveSelectedAudiences = async () => {
    try {
      setIsSavingAudiences(true);
      const token = localStorage.getItem('token');
      
      // Get the selected and unselected audience objects
      const selectedAudienceObjects = audiences.filter(audience => 
        checkedAudiences[audience.id]
      );
      
      const unselectedAudienceIds = audiences
        .filter(audience => !checkedAudiences[audience.id])
        .map(audience => audience.id);

      // Delete unselected audiences from the database
      if (unselectedAudienceIds.length > 0) {
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/brief/${currentBriefId}/audience/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            audienceIds: unselectedAudienceIds
          })
        });

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete unselected audiences');
        }
      }

      // Update saved audiences in local state
      setSavedAudiences(prev => ({
        ...prev,
        [currentBriefId]: selectedAudienceObjects
      }));

      // Update audiences state to only show selected ones
      setAudiences(selectedAudienceObjects);

      // Clear checkboxes after successful save
      setCheckedAudiences({});
      
    } catch (error) {
      console.error('Error saving/deleting audiences:', error);
      setError('Failed to save changes to audiences');
    } finally {
      setIsSavingAudiences(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Add new useEffect to automatically open brief form
  useEffect(() => {
    if (projects.length > 0) {
      // Get the first project
      const firstProject = projects[0];
      const projectKey = firstProject.name.toLowerCase().replace(/\s+/g, '_');
      
      // Set the selected folder to the first project
      setSelectedFolder({
        id: firstProject.id,
        name: firstProject.name,
        status: firstProject.status
      });

      // Open the brief form
      setIsBriefFormOpen(true);

      // Expand the first folder
      setExpandedFolders(prev => ({
        ...prev,
        [projectKey]: true
      }));
    }
  }, [projects]);

  // Add resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle mobile view transitions
  useEffect(() => {
    if (isMobileView) {
      console.log(isMobileView);
      if (isBriefFormOpen) {
        setShowFolderSection(false);
        setShowQASection(true);
      } else if (audiences.length > 0) {
        setShowFolderSection(false);
        setShowQASection(true);
      } else {
        setShowFolderSection(true);
        setShowQASection(false);
      }
    } else {
      setShowFolderSection(true);
      setShowQASection(true);
    }
  }, [isMobileView, isBriefFormOpen, audiences.length]);

  // Add new effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newIsMobileView = window.innerWidth <= 768;
      setIsMobileView(newIsMobileView);
      
      // Reset states when switching to mobile view
      if (newIsMobileView && !isBriefFormOpen && audiences.length === 0) {
        setShowFolderSection(true);
        setShowQASection(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isBriefFormOpen, audiences.length]);

  return (
    <div className={styles.sections}>
      <section className={`${styles.section} ${styles.librarySection}`}>
        <div className={styles.librarySections}>
          <div className={`${styles.folderSection} ${!showFolderSection && isMobileView ? styles.hidden : ''}`}>
            {renderFolderSection()}
          </div>
          {renderQASection()}
        </div>
      </section>
      {renderProjectPopup()}
      {renderAssetPopup()}
      {drawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)} />
          <div className={`${styles.drawer} ${drawerOpen ? styles.open : ''}`}>
            <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>×</button>
            {selectedAudience && (
              <div>
                <h2>Audience Details</h2>
                <h3>Insights</h3>
                <pre style={{whiteSpace: 'pre-line'}}>
                  {(() => {
                    try {
                      let insights = selectedAudience.insights;
                      if (!insights) return '-';
                      if (typeof insights === 'string') insights = JSON.parse(insights);
                      const values = getAllValues(insights);
                      return values.length ? values.join(' | ') : '-';
                    } catch {
                      return '-';
                    }
                  })()}
                </pre>
                <h3>Messaging Angle</h3>
                <p>
                  {selectedAudience.messagingAngle
                    ? selectedAudience.messagingAngle.replace(/^"|"$/g, '')
                    : '-'}
                </p>
                <h3>Tone</h3>
                <p>
                  {selectedAudience.tone
                    ? selectedAudience.tone.replace(/^"|"$/g, '')
                    : '-'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {isEditAudiencePopupOpen && (
          <MemoizedEditAudiencePopup
              isOpen={isEditAudiencePopupOpen}
              audience={editingAudience}
              briefData={briefData}
              onClose={handleCloseEditPopup}
              onSave={handleSaveEditedAudience}
          />
      )}
    </div>
  );
};

Library.displayName = 'Library';
export default Library; 