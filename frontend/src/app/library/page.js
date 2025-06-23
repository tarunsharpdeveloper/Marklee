'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard/styles.module.css';

export default function Library() {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const [briefData, setBriefData] = useState({});
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
  const [questionsLoading, setQuestionsLoading] = useState(true);
  useEffect(() => {
    fetchProjects();
    fetchBriefQuestions();
  }, []);

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

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('http://localhost:4000/api/projects', {
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

      const response = await fetch('http://localhost:4000/api/project', {
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
  const fetchBriefQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/brief-questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setBriefQuestions(data.data);
        
        // Dynamically initialize briefData based on fetched questions
        const initialBriefData = {};
        data.data.forEach(question => {
          initialBriefData[question.input_field_name] = '';
        });
        setBriefData(initialBriefData);
        
        console.log('Initialized briefData with fields:', Object.keys(initialBriefData)); // Debug log
        setError('');
      } else {
        setError(data.message || 'Failed to fetch questions');
      }
      setQuestionsLoading(false);
    } catch (error) {
      console.error('Error fetching brief questions:', error);
      setError('Failed to fetch questions. Please try again.');
      setQuestionsLoading(false);
    }
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
        <button 
          className={styles.createBriefButton}
          onClick={() => handleCreateBrief(folder)}
        >
          Create Brief
          <div className={styles.createBriefButtonIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </button>

        {/* Display Briefs */}
        {folder.briefs && folder.briefs.length > 0 && (
          <div className={styles.briefsList}>
            {folder.briefs.map((brief, index) => (
              console.log(brief),
              <div key={brief.id || index} className={styles.briefCard}>
                <div className={styles.briefHeader} onClick={() => handleBriefClick(brief.id)}>
                  <h4>{brief.title || 'Brief'}</h4>
                </div>
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
      const response = await fetch(`http://localhost:4000/api/brief/${briefId}/audience`, {
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
        setAudiences(formattedAudiences);
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
        {isBriefFormOpen && selectedFolder && !audiences.length && !showGeneratedContent && (
          <div className={styles.briefForm}>
            <button className={styles.backButton} onClick={handleBackToFolders}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2>Create Brief for {selectedFolder.name}</h2>
            {error && <div className={styles.error}>{error}</div>}
            
            {loading ? (
              <div className={styles.loadingOverlay}>
                <div className={styles.loadingContainer}>
                  <div className={styles.loader}></div>
                  <p className={styles.loadingMessage}>{loadingMessage}</p>
                </div>
              </div>
            ) : (
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
                      {briefQuestions.map((question, index) => (
                        <div key={index}>
                          <label>{question.question}</label>
                          <textarea
                            value={briefData[question.input_field_name] || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, [question.input_field_name]: e.target.value }))}
                            placeholder={question.placeholder}
                            className={styles.textarea}
                          />
                        </div>
                      ))}
                    </div>
                   
                    <div className={styles.formActions}>
                      <button 
                        type="button" 
                        className={styles.cancelButton}
                        onClick={() => {
                          setIsBriefFormOpen(false);
                          setSelectedFolder(null);
                          // Reset briefData to empty values for all fields
                          const resetBriefData = {};
                          briefQuestions.forEach(question => {
                            resetBriefData[question.input_field_name] = '';
                          });
                          setBriefData(resetBriefData);
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={loading || questionsLoading}
                      >
                        {loading ? 'Creating...' : 'Create Brief'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
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
            </div>
            <div className={styles.segmentsList}>
              {audiences.map((audience, index) => (
                console.log(audience),
                <div key={index} className={styles.segmentCard}>
                  <h4>{audience.name}</h4>
                  <p>{audience.description}</p>
                  <div className={styles.audienceActions}>
                  <button
                    className={styles.viewDetailsButton}
                    onClick={() => handleViewAudience(audience)}
                  >
                    view
                  </button>
                  <button className={styles.generateDocumentButton} onClick={() => {
                    setSelectedAudienceId(audience.id);
                    setSelectedAssetType(audience.name);
                    setIsAssetPopupOpen(true);
                  }}>Generate Document</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showGeneratedContent && generatedContent && (
          <div className={styles.generatedContentSection}>
            <div className={styles.generatedContentHeader}>
              <h3>Generated Content</h3>
              <span className={styles.generatedAssetType}>{selectedAssetType}</span>
            </div>
            <button 
              className={styles.generatedContentBackButton}
              onClick={() => setShowGeneratedContent(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height={20} width={20} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className={styles.generatedContentBody}>
              <p className={styles.generatedContentText}>{generatedContent}</p>
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
    if (!selectedFolder) return;

    // Check if questions are loaded
    if (briefQuestions.length === 0) {
      setError('Please wait for questions to load before submitting');
      return;
    }

    setLoading(true);
    setError('');
    const loadingInterval = startLoadingSequence(loadingQuestions, setLoadingMessage);

    try {
      const token = localStorage.getItem('token');
      
      // Filter out undefined values and ensure all fields have values
      const cleanBriefData = {};
      briefQuestions.forEach(question => {
        const value = briefData[question.input_field_name];
        cleanBriefData[question.input_field_name] = value || ''; // Use empty string if undefined
      });
      
      const briefPayload = {
        projectId: selectedFolder.id,
        projectName: selectedFolder.name,
        ...cleanBriefData // Use cleaned data
      };

      console.log('Sending brief payload:', briefPayload); // Debug log

      const response = await fetch(`http://localhost:4000/api/create-brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(briefPayload)
      });

      const responseData = await response.json();

      if (response.ok) {
        setCurrentBriefId(responseData.data.brief.id); // Save the new brief's ID
        const newAudiences = responseData.data.audiences.map(audience => {
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
        setAudiences(newAudiences);

        const newBrief = {
          id: responseData.data.brief.id,
          title: cleanBriefData[briefQuestions.find(q => q.input_field_name === 'main_message')?.input_field_name] || 'Brief',
          created_at: new Date().toISOString()
        };

        setFolderStructure(prev => {
          const projectKey = selectedFolder.name.toLowerCase().replace(/\s+/g, '_');
          return {
            ...prev,
            [projectKey]: {
              ...prev[projectKey],
              briefs: [...(prev[projectKey].briefs || []), newBrief]
            }
          };
        });

        // Reset briefData to empty values for all fields
        const resetBriefData = {};
        briefQuestions.forEach(question => {
          resetBriefData[question.input_field_name] = '';
        });
        setBriefData(resetBriefData);
        setError('');
        fetchProjects();
        clearInterval(loadingInterval);
        setLoading(false);
        setLoadingMessage('');
      } else {
        const errorMessage = responseData.message || 'Failed to create brief';
        console.error('Server error:', errorMessage);
        setError(errorMessage);
        clearInterval(loadingInterval);
        setLoading(false);
        setLoadingMessage('');
      }
    } catch (error) {
      console.error('Error creating brief:', error);
      setError('Failed to create brief. Please try again.');
      clearInterval(loadingInterval);
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
                    
                    const response = await fetch(`http://localhost:4000/api/generate-content`, {
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

  // Helper to recursively get all values from an object
  function getAllValues(obj) {
    let values = [];
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          values = values.concat(getAllValues(obj[key]));
        } else {
          values.push(obj[key]);
        }
      }
    }
    return values;
  }

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
    </div>
  );
} 