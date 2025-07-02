'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard/styles.module.css';
import Image from 'next/image';
import { Typewriter } from 'react-simple-typewriter';

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
  const [briefData, setBriefData] = useState({
    audienceType: null
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
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [coreMessage, setCoreMessage] = useState('');
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            {/* <h2>Create Brief for {selectedFolder.name}</h2> */}
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
                      <label>How would you like to define your audience?</label>
                      <div className={styles.radioGroup}>
                        <label className={`${styles.radioOption} ${briefData.audienceType === 'know' ? styles.selected : ''}`}>
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
                          />
                          <span className={styles.radioLabel}>I know my audience</span>
                        </label>
                        <label className={`${styles.radioOption} ${briefData.audienceType === 'suggest' ? styles.selected : ''}`}>
                          <input
                            type="radio"
                            name="audienceType"
                            value="suggest"
                            checked={briefData.audienceType === 'suggest'}
                            onChange={(e) => setBriefData({ 
                              audienceType: e.target.value,
                              description: '',
                              whoItHelps: '',
                              problemItSolves: ''
                            })}
                          />
                          <span className={styles.radioLabel}>Suggest audiences for me</span>
                        </label>
                        
                      </div>
                      {briefData.audienceType === 'know' && (
                      <div className={styles.questionsContainer}>
                        <div className={styles.formGroup}>
                          <label>Label / Persona name</label>
                          <textarea
                            value={briefData.labelName || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, labelName: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Who they are (role, life stage, market segment)?</label>
                          <textarea
                            value={briefData.whoTheyAre || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, whoTheyAre: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>What they want (main goal or desired outcome)?</label>
                          <textarea
                            value={briefData.whatTheyWant || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, whatTheyWant: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>What they struggle with (main pain point or problem)?</label>
                          <textarea
                            value={briefData.whatTheyStruggle || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, whatTheyStruggle: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>(Optional) Age, channels, purchasing power, etc.</label>
                          <textarea
                            value={briefData.additionalInfo || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <button className={styles.submitButton} type="submit" onClick={handleBriefSubmit}>Generate</button>
                      </div>
                    )}

                    {briefData.audienceType === 'suggest' && (
                      <div className={styles.questionsContainer}>
                        <div className={styles.formGroup}>
                          <label>what it is and what it does?</label>
                          <textarea
                            value={briefData.description || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, description: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Who it helps?</label>
                          <textarea
                            value={briefData.whoItHelps || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, whoItHelps: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Problem it solves?</label>
                          <textarea
                            value={briefData.problemItSolves || ''}
                            onChange={(e) => setBriefData(prev => ({ ...prev, problemItSolves: e.target.value }))}
                            className={styles.textarea}
                          />
                        </div>
                        <button className={styles.submitButton} type="submit" onClick={handleBriefSubmit}>Generate</button>
                      </div>
                    )}
                    </div>

                  
                  </>
                )}
              </form>
            )}
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
                <h3>Generated {selectedAssetType}</h3>
              </div>
              <div className={styles.messageContainer}>
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
                    }}>Generate <Image
                      src="/GenerateDoc.png"
                      alt="Marklee Logo"
                      width={20}
                      height={20}
                      priority
                    /></button>
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
        // Start loading sequence
        startLoadingSequence(loadingQuestions, setLoadingMessage);

        // Add validation for selectedFolder
        if (!selectedFolder || !selectedFolder.id) {
          throw new Error('No folder selected. Please select a folder first.');
        }

        // Handle "I Know My Audience" path
        const response = await fetch('http://localhost:4000/api/marketing/generate-from-audience', {
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
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate core message');
        }

        const data = await response.json();
        
        if (data.success) {
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

        const response = await fetch('http://localhost:4000/api/marketing/generate-suggested-audiences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            description: briefData.description,
            whoItHelps: briefData.whoItHelps,
            problemItSolves: briefData.problemItSolves,
            projectId: selectedFolder.id,
            projectName: selectedFolder.name
          })
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

  const fetchCoreMessage = async (refresh) => {
    if (refresh) {
      setIsRefreshing(true);
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      // Use the correct endpoint for generating core message from audience data
      const response = await fetch('http://localhost:4000/api/marketing/generate-from-audience', {
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
          additionalInfo: briefData.additionalInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate core message');
      }

      const data = await response.json();
      if (data.success) {
        setCoreMessage(data.data.coreMessage);
        setShowTypewriter(true);
        setIsRefreshing(false);
        
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
      const response = await fetch('http://localhost:4000/api/marketing/generate-with-prompt', {
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
        
        // Save the new core message
        await fetch('http://localhost:4000/api/onboarding/core-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ coreMessage: data.data.coreMessage })
        });

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