'use client';
import { useState } from 'react';
import styles from './styles.module.css';

export default function PromptEdit() {
    const [categories, setCategories] = useState([]);
  const [prompts, setPrompts] = useState([
    { 
      id: 1, 
      prompt: 'Write a product description that highlights the unique features and benefits of [product_name]. Focus on its [key_feature] and explain how it solves [pain_point].',
      category: 'Product',
      variables: ['product_name', 'key_feature', 'pain_point'],
      updatedAt: '2024-06-01' 
    },
    { 
      id: 2, 
      prompt: 'Analyze the customer feedback for [product_name] and identify the top 3 recurring themes. Provide specific examples and suggest improvements based on the feedback.',
      category: 'Feedback',
      variables: ['product_name'],
      updatedAt: '2024-06-02' 
    },
  ]);

  const [activePrompt, setActivePrompt] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    prompt: '',
    category: '',
    variables: []
  });

  const handleAddPrompt = (e) => {
    e.preventDefault();
    const variables = newPrompt.prompt.match(/\[(.*?)\]/g)?.map(v => v.replace(/[\[\]]/g, '')) || [];
    
    const prompt = {
      id: prompts.length + 1,
      ...newPrompt,
      variables,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setPrompts([...prompts, prompt]);
    setNewPrompt({ prompt: '', category: '', variables: [] });
    setShowAddForm(false);
  };

  const handleDeletePrompt = (id) => {
    setPrompts(prompts.filter(prompt => prompt.id !== id));
    if (activePrompt?.id === id) {
      setActivePrompt(null);
    }
  };

  const getAiPromptsType = async () => {
    const response = await fetch('http://localhost:4000/api/admin/ai-prompts-type',{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    const data = await response.json();
    console.log(data);
    setCategories(data);
  }
  getAiPromptsType();

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
                  <option key={cat.value} value={cat.value}>{cat.value}</option>
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
                  placeholder="Write your prompt here... Use [variable_name] for dynamic variables"
                  className={styles.promptInput}
                />
                <div className={styles.promptTips}>
                  <h4>Tips:</h4>
                  <ul>
                    <li>Use [variable_name] for dynamic content</li>
                    <li>Be specific with instructions</li>
                    <li>Include examples if needed</li>
                  </ul>
                </div>
              </div>
            </div>
            <button type="submit" className={styles.submitButton}>Create Prompt</button>
          </form>
        </div>
      )}

      <div className={styles.promptsGrid}>
        {prompts.map((prompt) => (
          <div 
            key={prompt.id} 
            className={`${styles.promptCard} ${activePrompt?.id === prompt.id ? styles.activeCard : ''}`}
            onClick={() => setActivePrompt(prompt)}
          >
            <div className={styles.promptCardHeader}>
              <span 
                className={styles.categoryTag}
                style={{
                  backgroundColor: categories.find(c => c.value === prompt.category)?.color
                }}
              >
                {prompt.category}
              </span>
              <div className={styles.cardActions}>
                <button 
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePrompt(prompt.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className={styles.promptContent}>
              <p>{prompt.prompt}</p>
            </div>
            <div className={styles.promptFooter}>
              <div className={styles.variables}>
                {prompt.variables.map((variable, index) => (
                  <span key={index} className={styles.variableTag}>
                    [{variable}]
                  </span>
                ))}
              </div>
              <span className={styles.updatedAt}>Updated: {prompt.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>

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