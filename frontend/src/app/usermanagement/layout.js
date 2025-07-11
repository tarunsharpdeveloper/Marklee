'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from '../dashboard/styles.module.css';
import Image from 'next/image';

export default function UserManagementLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: '', initials: '' });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        // Get user data from localStorage first
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          router.push('/');
          return;
        }

        // Check if user is admin
        if (userData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        // Set user data for admin
        setUser({
          name: userData.name,
          initials: userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
        });

      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
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
              <li 
                className={pathname === '/usermanagement' ? styles.active : ''} 
                onClick={() => router.push('/usermanagement')}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Customers</span>
              </li>
              <li 
                className={pathname === '/usermanagement/brief-questions' ? styles.active : ''} 
                onClick={() => router.push('/usermanagement/brief-questions')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-2-2-1.5 0-2 .62-2 2 0 1.5.5 2 2 2zM12 17h-2c-1.5 0-2-.62-2-2"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <span>Brief Questions</span>
              </li>
              <li 
                className={pathname === '/usermanagement/prompt-edit' ? styles.active : ''} 
                onClick={() => router.push('/usermanagement/prompt-edit')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/>
                </svg>
                <span>AI Prompt</span>
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
          <div className={styles.userProfile}>
            <span className={styles.userName}>{user.name || 'Guest'}</span>
            <div className={styles.avatar}>{user.initials || 'G'}</div>
          </div>
        </header>
        <div className={styles.sections}>
          {children}
        </div>
      </main>
    </div>
  );
} 