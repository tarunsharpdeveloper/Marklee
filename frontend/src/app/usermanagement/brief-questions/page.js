'use client';
import { useState, useEffect } from 'react';
import styles from './styles.module.css';

export default function BriefQuestions() {
  const [briefQuestions, setBriefQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    title: '',
    placeholder: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBriefQuestions();
  }, []);

  const fetchBriefQuestions = async () => {
    try {
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
      console.log(data);
      if (data.success) {
        setBriefQuestions(data.data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch questions');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching brief questions:', error);
      setError('Failed to fetch questions. Please try again.');
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/brief-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuestion),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        fetchBriefQuestions();
        setNewQuestion({ question: '', title: '', placeholder: '' });
        setShowAddForm(false);
        setError('');
      } else {
        setError(data.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding brief question:', error);
      setError('Failed to add question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/admin/brief-question/${id}`, {
        method: 'DELETE',
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
        fetchBriefQuestions();
        setError('');
      } else {
        setError(data.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting brief question:', error);
      setError('Failed to delete question. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Brief Questions Management</h1>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Question'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {showAddForm && (
        <form className={styles.addForm} onSubmit={handleAddQuestion}>
          <div className={styles.formGroup}>
            <label>Question:</label>
            <input
              type="text"
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Title:</label>
            <input
              type="text"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Placeholder:</label>
            <input
              type="text"
              value={newQuestion.placeholder}
              onChange={(e) => setNewQuestion({...newQuestion, placeholder: e.target.value})}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>Add Question</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Question</th>
              <th>Title</th>
              {/* <th>Input Field Name</th> */}
              <th>Placeholder</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {briefQuestions.map((question) => (
              <tr key={question.id}>
                <td>{question.question}</td>
                <td>{question.title}</td>
                {/* <td>{question.input_field_name}</td> */}
                <td>{question.placeholder}</td>
                <td>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}