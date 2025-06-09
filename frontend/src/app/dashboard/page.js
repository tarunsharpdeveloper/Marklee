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

  const folderStructure = {
    marketing: {
      name: 'Marketing',
      subfolders: ['Email Campaigns', 'Ad Copies', 'Landing Pages']
    },
    content: {
      name: 'Content',
      subfolders: ['Blog Posts', 'Newsletters', 'Case Studies']
    },
    social: {
      name: 'Social Media',
      subfolders: ['Instagram', 'Twitter', 'LinkedIn']
    }
  };

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
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.clear();
    // Redirect to home page
    router.push('/');
  };

  const handleCreateProject = () => {
    setActiveSection('library');
  };

  const renderFolderSection = () => {
    return (
      <div className={styles.folderSection}>
        {/* <div className={styles.sectionHeader}>
          <h2>Project Folders</h2>
          <button className={styles.newFolderButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Folder
          </button>
        </div> */}
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
              {expandedFolders[key] && (
                <div className={styles.subfolderList}>
                  {folder.subfolders.map((subfolder, index) => (
                    <div key={index} className={styles.subfolderItem}>
                      <div className={styles.subfolderIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        </svg>
                      </div>
                      <span>{subfolder}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQASection = () => {
    return (
      <div className={styles.qaSection}>
        <div className={styles.sectionHeader}>
          <h2>Content Assistant</h2>
        </div>
        <div className={styles.qaList}>
          {qaPairs.map((qa, index) => (
            <div key={index} className={styles.qaCard}>
              <h3>{qa.question}</h3>
              <div className={styles.optionsList}>
                {qa.options.map((option, optIndex) => (
                  <button key={optIndex} className={styles.optionButton}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className={styles.generateButton}>
            Generate Content Ideas
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 5l7 7-7 7M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderLibrarySection = () => {
    return (
      <section className={`${styles.section} ${styles.librarySection}`}>
        {/* <div className={styles.libraryHeader}>
          <h2>Content Library</h2>
          <div className={styles.libraryActions}>
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input type="text" placeholder="Search content..." />
            </div>
          </div>
        </div> */}
        <div className={styles.librarySections}>
          {renderFolderSection()}
          {renderQASection()}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.container}>
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
      <div className={`${styles.main} ${isSidebarCollapsed ? styles.collapsedMain : ''}`}>
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
            renderLibrarySection()
          )}
        </div>
      </div>
    </div>
  );
}
