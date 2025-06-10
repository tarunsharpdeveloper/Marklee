'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

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

  const [showAudienceForm, setShowAudienceForm] = useState(false);
  const [audienceData, setAudienceData] = useState({
    segment: '',
    insights: '',
    messaging_angle: '',
    support_points: '',
    tone: '',
    persona_profile: ''
  });

  const [createdBriefId, setCreatedBriefId] = useState(null);

  const qaPairs = [
    {
      question: "What type of content are you looking to create?",
      options: ["Blog Post", "Social Media", "Email", "Ad Copy"]
    },
    {
      question: "Who is your target audience?",
      options: ["B2B", "B2C", "Technical", "General"]
    },
    {
      question: "What's your content goal?",
      options: ["Engagement", "Lead Generation", "Brand Awareness", "Sales"]
    }
  ];

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
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !userData) {
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
        
        // Filter projects for current user and convert to folder structure
        const newFolderStructure = data.reduce((acc, project) => {
          // Only include projects that belong to current user
          if (project.user_id === userData.id) {
            const projectKey = project.project_name.toLowerCase().replace(/\s+/g, '_');
            acc[projectKey] = {
              id: project.id,
              name: project.project_name,
              status: project.status
            };
          }
          return acc;
        }, {});

        setFolderStructure(newFolderStructure);
        setProjects(data.filter(project => project.user_id === userData.id));
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
    // Clear all localStorage data
    localStorage.clear();
    // Redirect to home page
    router.push('/');
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
      const userData = JSON.parse(localStorage.getItem('user'));

      const response = await fetch('http://localhost:4000/api/project', {
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
        const { data } = await response.json();
        console.log('Created project:', data);

        // Add new project to folder structure
        const projectKey = data.project_name.toLowerCase().replace(/\s+/g, '_');
        setFolderStructure(prev => ({
          ...prev,
          [projectKey]: {
            id: data.id,
            name: data.project_name,
            status: data.status,
            user_id: userData.id // Store user_id with the folder
          }
        }));

        setProjectName('');
        setIsProjectPopupOpen(false);
        
        // Switch to library view
        setActiveSection('library');
        
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

  const handleBriefSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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

      const response = await fetch(`http://localhost:4000/api/create-brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(briefPayload)
      });

      const responseData = await response.json();
      console.log('Full brief creation response:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        // Log the structure of the response
        console.log('Response data type:', typeof responseData);
        console.log('Response data keys:', Object.keys(responseData));
        console.log('Response data.data:', responseData.data);
        
        // Try to get the ID from the response
        const briefId = responseData.data?.id || responseData.id;
        console.log('Extracted Brief ID:', briefId);
        
        if (!briefId) {
          console.error('Failed to extract brief ID from response:', responseData);
          throw new Error('Could not get brief ID from server response');
        }

        // Store the brief ID
        setCreatedBriefId(briefId);
        console.log('Successfully stored Brief ID in state:', briefId);

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
        setShowAudienceForm(true);
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
    }
  };

  const handleAudienceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      console.log('Current brief ID when creating audience:', createdBriefId);
      
      if (!createdBriefId) {
        throw new Error('No brief ID available. Please create a brief first.');
      }

      // Make sure we're using a valid brief ID
      const briefId = parseInt(createdBriefId);
      if (isNaN(briefId)) {
        throw new Error('Invalid brief ID format');
      }

      const response = await fetch(`http://localhost:4000/api/brief/${briefId}/audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...audienceData,
          brief_id: briefId // Include the brief_id in the payload as well
        })
      });

      const responseData = await response.json();
      console.log('Audience creation response:', responseData);

      if (response.ok) {
        setAudienceData({
          segment: '',
          insights: '',
          messaging_angle: '',
          support_points: '',
          tone: '',
          persona_profile: ''
        });
        setShowAudienceForm(false);
        setIsBriefFormOpen(false);
        setCreatedBriefId(null);
      } else {
        const errorMessage = responseData.message || 'Failed to create audience';
        console.error('Server error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in audience creation:', error);
      setError(error.message || 'Failed to create audience. Please try again.');
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
        {isBriefFormOpen && selectedFolder && (
          <div className={styles.briefForm}>
            <h2>{showAudienceForm ? 'Define Your Audience' : `Create Brief for ${selectedFolder.name}`}</h2>
            {error && <div className={styles.error}>{error}</div>}
            
            {!showAudienceForm ? (
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
            ) : (
              <form onSubmit={handleAudienceSubmit}>
                <div className={styles.formGroup}>
                  <label>Target Segment</label>
                  <textarea
                    value={audienceData.segment}
                    onChange={(e) => setAudienceData(prev => ({ ...prev, segment: e.target.value }))}
                    placeholder="Describe your target audience segment"
                    className={styles.textarea}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Audience Insights</label>
                  <textarea
                    value={audienceData.insights}
                    onChange={(e) => setAudienceData(prev => ({ ...prev, insights: e.target.value }))}
                    placeholder="What are the key insights about this audience?"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Messaging Angle</label>
                  <textarea
                    value={audienceData.messaging_angle}
                    onChange={(e) => setAudienceData(prev => ({ ...prev, messaging_angle: e.target.value }))}
                    placeholder="What is the best angle to approach this audience?"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Support Points</label>
                  <textarea
                    value={audienceData.support_points}
                    onChange={(e) => setAudienceData(prev => ({ ...prev, support_points: e.target.value }))}
                    placeholder="What points will support your message to this audience?"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tone of Voice</label>
                  <select
                    value={audienceData.tone}
                    onChange={(e) => setAudienceData(prev => ({ ...prev, tone: e.target.value }))}
                    className={styles.input}
                    required
                  >
                    <option value="">Select tone</option>
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="empathetic">Empathetic</option>
                    <option value="inspirational">Inspirational</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Persona Profile</label>
                  <textarea
                    value={audienceData.persona_profile}
                    onChange={(e) => setAudienceData(prev => ({ ...prev, persona_profile: e.target.value }))}
                    placeholder="Describe the typical persona for this audience"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAudienceForm(false);
                      setIsBriefFormOpen(false);
                      setAudienceData({
                        segment: '',
                        insights: '',
                        messaging_angle: '',
                        support_points: '',
                        tone: '',
                        persona_profile: ''
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
                    {loading ? 'Creating...' : 'Create Audience'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderProjectPopup()}
      {/* <button 
        className={styles.hamburgerIcon}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button> */}
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
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Dashboard</span>
              </li>
              <li className={activeSection === 'library' ? styles.active : ''} onClick={() => setActiveSection('library')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
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
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <header className={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent:"start"}}>
        <button onClick={toggleSidebar} className={styles.toggleButton}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="#1A1A1A" viewBox="0 0 30 30" width="30px" height="30px"><path d="M 3 7 A 1.0001 1.0001 0 1 0 3 9 L 27 9 A 1.0001 1.0001 0 1 0 27 7 L 3 7 z M 3 14 A 1.0001 1.0001 0 1 0 3 16 L 27 16 A 1.0001 1.0001 0 1 0 27 14 L 3 14 z M 3 21 A 1.0001 1.0001 0 1 0 3 23 L 27 23 A 1.0001 1.0001 0 1 0 27 21 L 3 21 z"/></svg>
          </button>
          
          </div>
          <div className={styles.userProfile}>
            <span className={styles.userName}>{user.name || 'Guest'}</span>
            <div className={styles.avatar}>{user.initials || 'G'}</div>
          </div>
        </header>
        <div className={styles.sections}>
          {activeSection === 'greeting' ? (
            <section className={`${styles.section} ${styles.greetingSection}`}>
              <div className={styles.greetingContainer}>
                <div className={styles.welcomeText}>
                  <h1>Hello, <span className={styles.userName}>{user.name || 'Guest'}</span> 👋</h1>
                  <p className={styles.copyQuestion}>What are you writing copy for today?</p>
                </div>
                <button className={styles.createButton} onClick={handleCreateProject}>
                  <span>Create New Project</span>
                  <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </section>
          ) : (
            <section className={`${styles.section} ${styles.librarySection}`}>
              <div className={styles.librarySections}>
                {renderFolderSection()}
                {renderQASection()}
            </div>
          </section>
          )}
        </div>
      </main>
    </div>
  );
}
