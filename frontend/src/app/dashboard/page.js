'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: '', initials: '' });

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

  const folderStructure = [
    {
      id: 'marketing',
      name: 'Marketing',
      subFolders: [
        { id: 'social', name: 'Social Media' },
        { id: 'email', name: 'Email Camp' },
        { id: 'ads', name: 'Advertising' }
      ]
    },
    {
      id: 'sales',
      name: 'Sales',
      subFolders: [
        { id: 'leads', name: 'Lead Generation' },
        { id: 'pipeline', name: 'Sales Pipeline' }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      subFolders: [
        { id: 'revenue', name: 'Revenue' },
        { id: 'expenses', name: 'Expenses' },
        { id: 'reports', name: 'Reports' }
      ]
    }
  ];

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
              <li className={styles.active}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Dashboard</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Profile</span>
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
      <div className={styles.main}>
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
          <section className={styles.section}>
            <div className={styles.folderStructure}>
              {folderStructure.map((folder) => (
                <div key={folder.id} className={styles.folder}>
                  <div 
                    className={styles.folderHeader}
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                      className={expandedFolders[folder.id] ? styles.iconExpanded : ''}
                    >
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                    </svg>
                    <span>{folder.name}</span>
                    <svg 
                      className={styles.arrowIcon} 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {expandedFolders[folder.id] && (
                    <div className={styles.subFolders}>
                      {folder.subFolders.map((subFolder) => (
                        <div key={subFolder.id} className={styles.subFolder}>
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="1.5"
                          >
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                          </svg>
                          <span>{subFolder.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h2>Greetings🚀!!</h2>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityContent}>
                  <p>Hello and welcome! I'm your AI partner for business growth — here to help you streamline strategies, boost performance, and unlock new opportunities. Whether you're scaling up, starting fresh, or optimizing what already works, let's turn your goals into results — smarter, faster, and with confidence.</p>
                </div>
              </div>
            </div>
          </section>
  
          <section className={styles.section}>
            <div className={styles.activityList}>
              <div className={styles.questionCategory}>
                <h3>🔍 Market & Audience</h3>
                <div className={styles.questionItem}>
                  <p>Define your ideal customer profile</p>
                </div>
                <div className={styles.questionItem}>
                  <p>List top 3 customer pain points addressed</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Marketing channels effectiveness analysis</p>
                </div>
              </div>

              <div className={styles.questionCategory}>
                <h3>📈 Growth & Strategy</h3>
                <div className={styles.questionItem}>
                  <p>6-month growth target projection</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Identify potential market segments</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Current KPI measurement review</p>
                </div>
              </div>

              <div className={styles.questionCategory}>
                <h3>🧠 Operations & Efficiency</h3>
                <div className={styles.questionItem}>
                  <p>Automation opportunity assessment</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Time-consuming task identification</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Customer feedback system evaluation</p>
                </div>
              </div>

              <div className={styles.questionCategory}>
                <h3>💸 Sales & Revenue</h3>
                <div className={styles.questionItem}>
                  <p>Most profitable product analysis</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Upsell/cross-sell opportunity review</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Sales funnel conversion assessment</p>
                </div>
              </div>

              <div className={styles.questionCategory}>
                <h3>🤖 AI & Tech Integration</h3>
                <div className={styles.questionItem}>
                  <p>AI-ready workflow identification</p>
                </div>
                <div className={styles.questionItem}>
                  <p>AI implementation opportunity scan</p>
                </div>
                <div className={styles.questionItem}>
                  <p>Team AI readiness evaluation</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
