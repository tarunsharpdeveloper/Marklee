'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    darkMode: false,
    emailNotifications: true,
    marketingEmails: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
          router.push('/');
          return;
        }

        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          darkMode: localStorage.getItem('darkMode') === 'true'
        }));
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      if (response.ok) {
        // Update local storage
        const updatedUser = { ...user, name: formData.name, email: formData.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        alert('Password changed successfully!');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please check your current password.');
    }
  };

  const handlePreferenceChange = async (name, value) => {
    try {
      if (name === 'darkMode') {
        localStorage.setItem('darkMode', value);
        // Trigger dark mode change event
        window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { darkMode: value } }));
      }

      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/update-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [name]: value
        })
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        localStorage.clear();
        router.push('/');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account preferences and security</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'danger' ? styles.active : ''}`}
          onClick={() => setActiveTab('danger')}
        >
          Danger Zone
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'profile' && (
          <div className={styles.section}>
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className={styles.saveButton}>
                Update Profile
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className={styles.section}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className={styles.saveButton}>
                Change Password
              </button>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className={styles.section}>
            <h2>Preferences</h2>
            <div className={styles.preferences}>
              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <h3>Dark Mode</h3>
                  <p>Switch between light and dark themes</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={formData.darkMode}
                    onChange={(e) => {
                      handleInputChange(e);
                      handlePreferenceChange('darkMode', e.target.checked);
                    }}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <h3>Email Notifications</h3>
                  <p>Receive important account notifications</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={(e) => {
                      handleInputChange(e);
                      handlePreferenceChange('emailNotifications', e.target.checked);
                    }}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.preferenceItem}>
                <div className={styles.preferenceInfo}>
                  <h3>Marketing Emails</h3>
                  <p>Receive updates about new features and offers</p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    checked={formData.marketingEmails}
                    onChange={(e) => {
                      handleInputChange(e);
                      handlePreferenceChange('marketingEmails', e.target.checked);
                    }}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className={styles.section}>
            <h2>Danger Zone</h2>
            <div className={styles.dangerZone}>
              <div className={styles.dangerItem}>
                <div className={styles.dangerInfo}>
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className={styles.deleteButton}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 