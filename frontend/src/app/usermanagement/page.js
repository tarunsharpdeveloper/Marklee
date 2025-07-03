'use client';
 
import { useState, useEffect } from 'react';
import styles from './styles.module.css';
import Pagination from '../components/Pagination';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const handlePageChange = (newPage) => {
    setIsPageChanging(true);
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users?limit=${limit}&page=${currentPage}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
 
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users);
          setTotalPages(data.data.totalPages);
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
        setIsPageChanging(false);
      }
    };
 
    fetchUsers();
  }, [currentPage, limit]);
 
  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing limit
  };
 
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
 
  if (loading && !isPageChanging) {
    return <div className={styles.loading}>Loading...</div>;
  }
 
  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }
 
  return (
    <>
    <div className={styles.container}>
      <h1 style={{textAlign: 'left'}}>User Management</h1>
      <div className={`${styles.tableContainer} ${isPageChanging ? styles.fadeOut : ''}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Created At</th>
              {/* <th>Updated At</th> */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td className={styles.name}>{user.name}</td>
                <td className={styles.email}>{user.email}</td>
                <td>
                  <span className={styles.role}>{user.role}</span>
                </td>
                <td>
                  <span className={user.is_verified ? styles.verified : styles.notVerified}>
                    {user.is_verified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                {/* <td>{formatDate(user.updated_at)}</td> */}
                <td>
                  <label className={styles.switch}>
                    <input type="checkbox" />
                    <span className={styles.slider}></span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.tableFooter}>
        <div className={styles.limitSelector}>
          <label htmlFor="limit">Show entries:</label>
          <select 
            id="limit" 
            value={limit} 
            onChange={handleLimitChange}
            className={styles.select}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
        </div>
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
    </>
  );
}