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

  useEffect(() => {
    fetchProjects();
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
      setShowFolderSection(!isBriefFormOpen);
    } else {
      setShowFolderSection(true);
    }
  }, [isMobileView, isBriefFormOpen]);

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

  const handleCreateBrief = (folder) => {
    setSelectedFolder(folder);
    setIsBriefFormOpen(true);
    if (isMobileView) {
      setShowFolderSection(false);
    }
  };

  const handleBackToFolders = () => {
    setIsBriefFormOpen(false);
    setSelectedFolder(null);
    setShowFolderSection(true);
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
  };

  const handleBackFromAudience = () => {
    setAudiences([]);
    setIsBriefFormOpen(false);
    setSelectedFolder(null);
    setShowFolderSection(true);
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
              <div key={brief.id || index} className={styles.briefCard}>
                <div className={styles.briefHeader}>
                  <h4>{brief.title || 'Brief'}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
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
      <div className={`${styles.qaSection} ${!isBriefFormOpen && isMobileView ? styles.hidden : ''}`}>
        {isBriefFormOpen && selectedFolder && !audiences.length && (
          <div className={styles.briefForm}>
            {isMobileView && (
              <button className={styles.backButton} onClick={handleBackToFolders}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Folders
              </button>
            )}
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
                  placeholder="What are the benefits?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Call to Action</label>
                <textarea
                  value={briefData.call_to_action}
                  onChange={(e) => setBriefData(prev => ({ ...prev, call_to_action: e.target.value }))}
                  placeholder="What action should the audience take?"
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
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsBriefFormOpen(false);
                    setSelectedFolder(null);
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
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Brief'}
                </button>
              </div>
            </form>
          </div>
        )}
        {audiences.length > 0 && (
          <div className={styles.audienceSegments}>
            {isMobileView && (
              <button className={styles.backButton} onClick={handleBackFromAudience}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Folders
              </button>
            )}
            <div className={styles.audienceHeader}>
              <h3>Target Audience Segments</h3>
            </div>
            <div className={styles.segmentsList}>
              {audiences.map((audience, index) => (
                <div key={index} className={styles.segmentCard}>
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

  const handleBriefSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFolder) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
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

        // Update folder structure with the new brief
        const newBrief = {
          id: responseData.data.id,
          title: briefData.main_message,
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

        // Reset form data but keep the form section open to show audiences
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
        setError('');

        // Refresh projects to get updated data
        fetchProjects();
      } else {
        const errorMessage = responseData.message || 'Failed to create brief';
        console.error('Server error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating brief:', error);
      setError('Failed to create brief. Please try again.');
    } finally {
      setLoading(false);
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
    </div>
  );
} 