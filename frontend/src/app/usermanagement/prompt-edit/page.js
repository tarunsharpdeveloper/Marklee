'use client';
    import { useState, useEffect } from 'react';
import styles from './styles.module.css';

export default function PromptEdit() {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activePrompt, setActivePrompt] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    prompt: '',
    category: '',
    variables: []
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/ai-prompts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      
      // Transform the data to match our frontend structure
      const transformedPrompts = data.data.map(prompt => ({
        id: prompt.id,
        prompt: prompt.prompt,
        category: categories.find(c => c.id === prompt.prompt_for_id)?.type || 'Unknown',
        variables: prompt.prompt.match(/\{(.*?)\}/g)?.map(v => v.replace(/[{}]/g, '')) || [],
        updatedAt: new Date(prompt.updated_at).toISOString().split('T')[0]
      }));

      setPrompts(transformedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError('Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!newPrompt.prompt.trim() || !newPrompt.category) {
        throw new Error('Please fill in all required fields');
      }

      // Create the request payload
      const payload = {
        prompt_for_id: parseInt(newPrompt.category),
        prompt: newPrompt.prompt.trim()
      };

      console.log('Attempting to create prompt with payload:', payload);

      const response = await fetch('http://localhost:4000/api/admin/ai-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create prompt');
      }

      // After successful creation, fetch the updated list of prompts
      await fetchPrompts();
      
      setNewPrompt({ prompt: '', category: '', variables: [] });
      setShowAddForm(false);
    } catch (error) {
      console.error('Detailed error:', error);
      setError(error.message || 'Error creating AI prompt. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrompt = async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/admin/ai-prompt/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      setPrompts(prompts.filter(prompt => prompt.id !== id));
      if (activePrompt?.id === id) {
        setActivePrompt(null);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setError('Failed to delete prompt');
    }
  };

  const getAiPromptsType = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/ai-prompts-type', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      console.log('Categories:', data);
      setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  useEffect(() => {
    getAiPromptsType();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchPrompts();
    }
  }, [categories]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>AI Prompt Editor</h1>
          <p className={styles.subtitle}>Create and manage your AI prompts</p>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ New Prompt'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className={styles.addFormContainer}>
          <form className={styles.addForm} onSubmit={handleAddPrompt}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                value={newPrompt.category}
                onChange={(e) => setNewPrompt({...newPrompt, category: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.type}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Prompt Template</label>
              <div className={styles.promptInputContainer}>
                <textarea
                  value={newPrompt.prompt}
                  onChange={(e) => setNewPrompt({...newPrompt, prompt: e.target.value})}
                  required
                  placeholder="Write your prompt here... Use {variable_name} for dynamic variables"
                  className={styles.promptInput}
                />
                <div className={styles.promptTips}>
                  <h4>Tips:</h4>
                  <ul>
                    <li>Use {'{variable_name}'} for dynamic content</li>
                    <li>Be specific with instructions</li>
                    <li>Include examples if needed</li>
                  </ul>
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Prompt'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>Loading prompts...</div>
      ) : (
        <div className={styles.promptsGrid}>
          {prompts.length === 0 ? (
            <div className={styles.noPrompts}>
              No prompts available. Create your first prompt!
            </div>
          ) : (
            prompts.map((prompt) => (
              <div 
                key={prompt.id} 
                className={`${styles.promptCard} ${activePrompt?.id === prompt.id ? styles.activeCard : ''}`}
                onClick={() => setActivePrompt(prompt)}
              >
                <div className={styles.promptCardHeader}>
                  <span className={styles.categoryTag}>
                    {prompt.category}
                  </span>
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePrompt(prompt.id);
                    }}
                  >
                              <svg xmlns="http://www.w3.org/2000/svg" 
     fill="none" 
     viewBox="0 0 24 24" 
     strokeWidth={1.5} 
     stroke="currentColor" 
     className="w-6 h-6" width="24" height="20">
  <path strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M6 7h12M9 7V4h6v3M10 11v6M14 11v6M5 7h14l-1.5 12.5a1.5 1.5 0 01-1.5 1.5H8a1.5 1.5 0 01-1.5-1.5L5 7z" />
</svg>
                  </button>
                </div>
                <div className={styles.promptContent}>
                  {prompt.prompt}
                </div>
                <div className={styles.promptFooter}>
                  <div className={styles.variables}>
                    {prompt.variables.map((variable, index) => (
                      <span key={index} className={styles.variableTag}>
                        {variable}
                      </span>
                    ))}
                  </div>
                  <div className={styles.updatedAt}>
                    Updated: {prompt.updatedAt}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activePrompt && (
        <div className={styles.promptPreview}>
          <div className={styles.previewHeader}>
            <h3>Preview</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setActivePrompt(null)}
            >
              ✕
            </button>
          </div>
          <div className={styles.previewContent}>
            <p>{activePrompt.prompt}</p>
            {activePrompt.variables.length > 0 && (
              <div className={styles.variableInputs}>
                <h4>Variables</h4>
                {activePrompt.variables.map((variable, index) => (
                  <div key={index} className={styles.variableInput}>
                    <label>{variable}:</label>
                    <input type="text" placeholder={`Enter ${variable}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 