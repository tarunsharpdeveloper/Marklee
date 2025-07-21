'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard/styles.module.css';
import Image from 'next/image';
import DarkModeToggle from '../components/DarkModeToggle';

export default function LibraryLayout({ children }) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: '', initials: '' });
  const [sidebarProjectName, setSidebarProjectName] = useState('');

  const fetchProjectName = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        if (data && data.data) {
          const formData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
          // Get the project name from the description field (first question)
          const projectName = formData.description;
          setSidebarProjectName(projectName);
        }
      }
    } catch (error) {
      console.error('Error fetching project name:', error);
    }
  }, []);

  // Fix useEffect with router dependency
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (!response.ok || !data.data) {
          router.push('/pre-homepage');
          return;
        }

        // Set user data if everything is ok
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          setUser({
            name: userData.name,
            initials: userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
          });
        }

        // Fetch project name
        fetchProjectName();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, fetchProjectName]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <Image
                src="/Bold.png"
                alt="Logo"
                width={100}
                height={95}
                className={styles.logoImage}
                priority
              />
            </div>
          </div>
          <nav className={styles.nav}>
            <ul>
              <li onClick={() => router.push('/dashboard')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Home</span>
              </li>
              <li className={styles.active}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span>{sidebarProjectName}</span>
              </li>
              <li onClick={() => router.push('/settings')}>
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
        <header className={`${styles.header} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'start'}}>
            <button onClick={toggleSidebar} className={styles.toggleButton}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="#1A1A1A" viewBox="0 0 30 30" width="30px" height="30px">
                <path d="M 3 7 A 1.0001 1.0001 0 1 0 3 9 L 27 9 A 1.0001 1.0001 0 1 0 27 7 L 3 7 z M 3 14 A 1.0001 1.0001 0 1 0 3 16 L 27 16 A 1.0001 1.0001 0 1 0 27 14 L 3 14 z M 3 21 A 1.0001 1.0001 0 1 0 3 23 L 27 23 A 1.0001 1.0001 0 1 0 27 21 L 3 21 z"/>
              </svg>
            </button>
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            {/* <DarkModeToggle inHeader={true} /> */}
            <div className={styles.userProfile}>
              <span className={styles.userName}>{user.name || 'Guest'}</span>
              <div className={styles.avatar}>{user.initials || 'G'}</div>
              <div className={styles.avatarDropdown}>
                <button onClick={handleLogout} className={styles.dropdownLogoutBtn}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className={styles.sections}>
          {children}
        </div>
      </main>
    </div>
  );
} 