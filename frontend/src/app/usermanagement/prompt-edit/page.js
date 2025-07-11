'use client';
import { useState, useEffect } from 'react';
import styles from './styles.module.css';

export default function PromptEdit() {
    const [prompts, setPrompts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [promptToDelete, setPromptToDelete] = useState(null);
    const [newPrompt, setNewPrompt] = useState({
        prompt: '',
        category: '',
        variables: []
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPromptId, setExpandedPromptId] = useState(null);

    const fetchPrompts = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/ai-prompts`, {
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/ai-prompt`, {
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
            setShowAddModal(false);
        } catch (error) {
            console.error('Detailed error:', error);
            setError(error.message || 'Error creating AI prompt. Please check your input and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePrompt = async (e) => {
        e.preventDefault();
        if (!editingPrompt) return;

        setIsSubmitting(true);
        setError('');

        try {
            if (!newPrompt.prompt.trim() || !newPrompt.category) {
                throw new Error('Please fill in all required fields');
            }

            const payload = {
                prompt_for_id: parseInt(newPrompt.category),
                prompt: newPrompt.prompt.trim()
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/ai-prompt/${editingPrompt.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update prompt');
            }

            await fetchPrompts();

            setShowEditModal(false);
            setEditingPrompt(null);
            setNewPrompt({ prompt: '', category: '', variables: [] });

        } catch (error) {
            console.error('Detailed error:', error);
            setError(error.message || 'Error updating AI prompt. Please check your input and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (editingPrompt) {
            handleUpdatePrompt();
        } else {
            handleAddPrompt(e);
        }
    };

    const handleEditClick = (promptToEdit) => {
        setEditingPrompt(promptToEdit);
        const category = categories.find(c => c.type === promptToEdit.category);
        setNewPrompt({
            prompt: promptToEdit.prompt,
            category: category ? String(category.id) : '',
            variables: promptToEdit.variables
        });
        setShowEditModal(true);
    };

    const handleAddClick = () => {
        setNewPrompt({ prompt: '', category: '', variables: [] });
        setShowAddModal(true);
    };

    const handleDeletePrompt = async (id) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/ai-prompt/${id}`, {
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
        } catch (error) {
            console.error('Error deleting prompt:', error);
            setError('Failed to delete prompt');
        }
    };

    const getAiPromptsType = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/ai-prompts-type`, {
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

    const countWords = (text) => {
        return text.trim().split(/\s+/).length;
    };

    const truncateText = (text) => {
        const words = text.trim().split(/\s+/);
        if (words.length > 100) {
            return words.slice(0, 100).join(' ') + '...';
        }
        return text;
    };

    useEffect(() => {
        getAiPromptsType();
    }, []);

    useEffect(() => {
        if (categories.length > 0) {
            fetchPrompts();
        }
    }, [categories]);

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingPrompt(null);
        setNewPrompt({ prompt: '', category: '', variables: [] });
        setError('');
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setNewPrompt({ prompt: '', category: '', variables: [] });
        setError('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.promptContainer}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h1>AI Prompt Editor</h1>
                        <p className={styles.subtitle}>Create and manage your AI prompts</p>
                    </div>
                    <button className={styles.addButton} onClick={handleAddClick}>
                        Add New Prompt
                    </button>
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
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
                                    className={`${styles.promptCard}`}
                                >
                                    <div className={styles.promptCardHeader}>
                                        <span className={styles.categoryTag}>
                                            {prompt.category}
                                        </span>
                                        <div className={styles.promptActions}>
                                            <button
                                                className={styles.editButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(prompt);
                                                }}
                                                title="Edit Prompt"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                className={styles.deleteButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPromptToDelete(prompt);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                title="Delete Prompt"
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
                                    </div>
                                    <div 
                                        className={`${styles.promptContent} ${expandedPromptId === prompt.id ? styles.expanded : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (countWords(prompt.prompt) > 100) {
                                                setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id);
                                            }
                                        }}
                                    >
                                        {expandedPromptId === prompt.id ? prompt.prompt : truncateText(prompt.prompt)}
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
                                            {/* Updated: {prompt.updatedAt} */}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {showDeleteConfirm && (
                    <div className={styles.deleteConfirmation}>
                        <div className={styles.confirmationContent}>
                            <h3>Confirm Deletion</h3>
                            <p>Are you sure you want to delete this prompt?</p>
                            <div className={styles.buttonGroup}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setPromptToDelete(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => {
                                        handleDeletePrompt(promptToDelete.id);
                                        setShowDeleteConfirm(false);
                                        setPromptToDelete(null);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add New Prompt</h2>
                            <button className={styles.closeButton} onClick={closeAddModal}>
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddPrompt}>
                            <div className={styles.formGroup}>
                                <label htmlFor="category">Category</label>
                                <select
                                    id="category"
                                    value={newPrompt.category}
                                    onChange={(e) => setNewPrompt({
                                        ...newPrompt,
                                        category: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="prompt">Prompt</label>
                                <textarea
                                    id="prompt"
                                    className={styles.promptInput}
                                    value={newPrompt.prompt}
                                    onChange={(e) => setNewPrompt({
                                        ...newPrompt,
                                        prompt: e.target.value
                                    })}
                                    required
                                    rows={6}
                                    placeholder="Write your prompt here... Use {variable_name} for dynamic variables"
                                />
                            </div>

                            {error && <p className={styles.error}>{error}</p>}

                            <div className={styles.buttonGroup}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={closeAddModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Prompt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Edit Prompt</h2>
                            <button className={styles.closeButton} onClick={closeEditModal}>
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdatePrompt}>
                            <div className={styles.formGroup}>
                                <label htmlFor="editCategory">Category</label>
                                <select
                                    id="editCategory"
                                    value={newPrompt.category}
                                    onChange={(e) => setNewPrompt({
                                        ...newPrompt,
                                        category: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="editPrompt">Prompt</label>
                                <textarea
                                    id="editPrompt"
                                    className={styles.promptInput}
                                    value={newPrompt.prompt}
                                    onChange={(e) => setNewPrompt({
                                        ...newPrompt,
                                        prompt: e.target.value
                                    })}
                                    required
                                    rows={6}
                                />
                            </div>

                            {error && <p className={styles.error}>{error}</p>}

                            <div className={styles.buttonGroup}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={closeEditModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 