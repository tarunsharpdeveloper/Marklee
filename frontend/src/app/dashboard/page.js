"use client";

import { useState, useEffect, useRef, memo, useMemo,useCallback} from "react";
import { useRouter } from "next/navigation";
import { Typewriter } from "react-simple-typewriter";
import Image from 'next/image';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import styles from "./styles.module.css";
import DarkModeToggle from "../components/DarkModeToggle";

const MessageSkeleton = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
  </div>
);

// Helper function to get first 2 words from a string (title)
const getFirstTwoWords = (text) => {
  if (!text || typeof text !== 'string') {
    return 'Untitled Segment';
  }
  
  // Handle audience editing case - if text contains newlines, split by first newline
  if (text.includes('\n')) {
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    if (firstLine) {
      // Split first line by whitespace and take first 2 words
      const words = firstLine.split(/\s+/).filter(word => word.length > 0);
      if (words.length >= 2) {
        return words.slice(0, 2).join(' ');
      } else if (words.length === 1) {
        return words[0];
      }
    }
  }
  
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  
  // If we have 2 or more words, take the first 2
  if (words.length >= 2) {
    const firstTwoWords = words.slice(0, 2).join(' ');
    return firstTwoWords;
  }
  
  // If we have only 1 word, return it
  if (words.length === 1) {
    return words[0];
  }
  
  return 'Untitled Segment';
};

// Function to get description (everything after the first 2 words)
const getDescription = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Handle audience editing case - if text contains newlines, get everything after first line
  if (text.includes('\n')) {
    const lines = text.split('\n');
    if (lines.length > 1) {
      const description = lines.slice(1).join('\n').trim();
      return description || 'No description available';
    }
  }
  
  // Split by whitespace and filter out empty strings
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  
  // If we have 3 or more words, return everything after the first 2 words
  if (words.length >= 3) {
    const description = words.slice(2).join(' ');
    return description;
  }
  
  // If we have exactly 2 words, there's no description
  if (words.length === 2) {
    return 'No description available';
  }
  
  // If we have only 1 word, treat it as description
  return text;
};

const MemoizedEditPopup = memo(({ 
  isOpen, 
  messages, 
  setMessages, 
  editedCoreMessage,
  coreMessage,
  setCoreMessage,
  setEditedCoreMessage,
  isRefreshing,
  setIsRefreshing,
  isSending,
  setIsSending,
  showTypewriter,
  setShowTypewriter,
  onClose,
  currentStep = 1
}) => {
  const [localInputMessage, setLocalInputMessage] = useState("");
  const [localEditedCoreMessage, setLocalEditedCoreMessage] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [showMobileEdit, setShowMobileEdit] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isQuestionMode, setIsQuestionMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const editInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const router = useRef(null);

  // Store core message in localStorage
  const storeCoreMessage = (message) => {
    if (message) {
      const storedData = {
        message,
        timestamp: Date.now(),
        context: 'core-message'
      };
      localStorage.setItem('marketingCoreMessage', JSON.stringify(storedData));
    }
  };

  // Get stored core message
  const getStoredCoreMessage = () => {
    try {
      const stored = localStorage.getItem('marketingCoreMessage');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored core message:', error);
      return null;
    }
  };

  // Get contextual question from backend
  const getContextualQuestion = async (userInput = null, currentStep = 1) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('getContextualQuestion - Current project ID:', currentProjectId);
      
      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;
      
      // Fetch onboarding data to get project-specific core message
      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        console.log('getContextualQuestion - Failed to fetch onboarding data, continuing with basic flow');
        const errorText = await onboardingResponse.text();
        console.log('getContextualQuestion - Error response:', errorText);
        console.log('getContextualQuestion - Response status:', onboardingResponse.status);
        console.log('getContextualQuestion - Response URL:', onboardingResponse.url);
      }

      const { data } = await onboardingResponse.json();
      console.log('getContextualQuestion - Fetched data:', data);
      console.log('getContextualQuestion - Data structure:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : 'null',
        hasCoreMessage: !!(data && data.core_message),
        coreMessageLength: data && data.core_message ? data.core_message.length : 0,
        hasDataField: !!(data && data.data),
        dataFieldType: data && data.data ? typeof data.data : 'null'
      });
      
      // Get project-specific core message from the fetched data
      const projectCoreMessage = data?.core_message;
      console.log('getContextualQuestion - Project core message:', projectCoreMessage ? projectCoreMessage.substring(0, 100) + '...' : 'null');
      
      // If no core message found, show a helpful message
      if (!projectCoreMessage || projectCoreMessage.trim() === '') {
        console.log('getContextualQuestion - No core message found, showing helpful message');
        setMessages((prev) => [
          ...prev,
          {
            content: "I don't see a core message yet. Please generate your core message first, then I can help you refine it with contextual questions.",
            type: "ai",
          },
        ]);
        return;
      }

      console.log('getContextualQuestion - Using project-specific core message:', projectCoreMessage.substring(0, 100) + '...');

      // Safety check: stop after 5 questions maximum
      if (questionIndex >= 5) {
        await updateCoreMessageWithAnswers();
        return;
      }

      // Prepare form data - create basic structure if data is missing
      let formData;
      if (!data || !data.data || data.data === null) {
        console.log('No form data found, creating basic structure for contextual questions');
        formData = {
          formFields: [],
          formAnswers: {},
          welcomeMessage: "Welcome to your marketing journey!",
          footerMessage: "Thank you for completing the questionnaire."
        };
      } else {
        formData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      }

      console.log('getContextualQuestion - Prepared formData:', formData);

      // Filter out duplicate questions based on content
      const uniqueUserAnswers = userAnswers.reduce((acc, current) => {
        const isDuplicate = acc.some(item => 
          item.question.trim().toLowerCase() === current.question.trim().toLowerCase()
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      console.log('getContextualQuestion - Sending request with:', {
        formData: !!formData,
        currentMessage: projectCoreMessage ? projectCoreMessage.substring(0, 50) + '...' : 'null',
        questionIndex,
        userAnswersCount: uniqueUserAnswers.length,
        userInput
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/get-contextual-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            formData,
            currentMessage: projectCoreMessage, // Use project-specific core message
            questionIndex,
            userAnswers: uniqueUserAnswers,
            userInput
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('getContextualQuestion - Response not ok:', response.status, errorText);
        setMessages((prev) => [
          ...prev,
          {
            content: `Sorry, I couldn't generate a question. (Error: ${response.status}) Please try again.`,
            type: "ai",
          },
        ]);
        return;
      }

      const responseData = await response.json();
      if (responseData.success) {
        if (responseData.data.question && !responseData.data.completed) {
          setCurrentQuestion(responseData.data.question);
          setIsQuestionMode(true);
          // If it's a greeting response, add it to chat
          if (responseData.data.isGreeting && userInput) {
            setMessages((prev) => [
              ...prev,
              {
                content: userInput,
                type: "user",
              },
              {
                content: responseData.data.question,
                type: "ai",
              },
            ]);
          }
        } else {
          // No more questions, update core message with all answers
          await updateCoreMessageWithAnswers();
        }
      }
    } catch (error) {
      console.error("Error getting contextual question:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        currentStep,
        hasProjectId: !!localStorage.getItem('currentProjectId'),
        hasToken: !!localStorage.getItem('token')
      });
      setMessages((prev) => [
        ...prev,
        {
          content: `Sorry, something went wrong while generating a question. (${error.message})`,
          type: "ai",
        },
      ]);
      // Fallback: if there's an error, try to update with current answers
      if (userAnswers.length > 0) {
        await updateCoreMessageWithAnswers();
      }
    }
  };

  // Update core message with all collected answers
  const updateCoreMessageWithAnswers = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('updateCoreMessageWithAnswers - Current project ID:', currentProjectId);

      // Add completion message to chat
      setMessages((prev) => [
        ...prev,
        {
          content: "Analyzing your responses and refining your core message...",
          type: "ai",
        },
      ]);

      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to fetch onboarding data");
      }

      const { data } = await onboardingResponse.json();
      
      // Get project-specific core message
      const projectCoreMessage = data.core_message;
      if (!projectCoreMessage) {
        throw new Error("No core message found for this project");
      }

      console.log('updateCoreMessageWithAnswers - Using project-specific core message:', projectCoreMessage.substring(0, 100) + '...');
      
      const formData =
        typeof data.data === "string" ? JSON.parse(data.data) : data.data;

      // Filter out duplicate questions based on content
      const uniqueUserAnswers = userAnswers.reduce((acc, current) => {
        const isDuplicate = acc.some(item => 
          item.question.trim().toLowerCase() === current.question.trim().toLowerCase()
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      console.log('Updating core message - Original userAnswers:', userAnswers.length);
      console.log('Updating core message - Filtered userAnswers:', uniqueUserAnswers.length);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/update-with-answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            formData,
            currentMessage: projectCoreMessage, // Use project-specific core message
            userAnswers: uniqueUserAnswers
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update core message");
      }

      const responseData = await response.json();

      if (responseData.success) {
        const newMessage = responseData.data.coreMessage;
        setCoreMessage(newMessage);
        setEditedCoreMessage(newMessage);
        storeCoreMessage(newMessage);
        
        // Update the final message in chat
        setMessages((prev) => {
          const newMessages = [...prev];
          // Replace the processing message with the completion message
          const answerText = userAnswers.length === 1 ? 'answer' : 'answers';
          newMessages[newMessages.length - 1] = {
            content: `Thank you for your responses. I've refined your core message based on your answers. Here's the updated version:`,
            type: "ai",
          };
          return newMessages;
        });

        // Save to database with project ID
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              coreMessage: newMessage,
              projectId: currentProjectId 
            }),
          }
        );

        setShowTypewriter(true);
        setIsQuestionMode(false);
        setCurrentQuestion("");
        setQuestionIndex(0);
        setUserAnswers([]);
      }
    } catch (error) {
      console.error("Error updating core message with answers:", error);
      // Show error message in chat
      setMessages((prev) => [
        ...prev,
        {
          content: "I encountered an error while refining your core message. Please try again.",
          type: "ai",
        },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle answer to contextual question
  const handleQuestionAnswer = async () => {
    if (!localInputMessage.trim()) return;

    const answer = localInputMessage.trim();
    
    // Add question and answer to chat
    setMessages((prev) => [
      ...prev,
      {
        content: currentQuestion,
        type: "ai",
      },
      {
        content: answer,
        type: "user",
      },
    ]);

    // Store the answer
    setUserAnswers((prev) => [...prev, { question: currentQuestion, answer }]);
    
    setLocalInputMessage("");
    const nextQuestionIndex = questionIndex + 1;
    setQuestionIndex(nextQuestionIndex);
    setIsQuestionMode(false);
    setCurrentQuestion("");

    // Get next question after a short delay - AI will decide when to stop
    setTimeout(() => {
      getContextualQuestion(null, currentStep);
    }, 500);
  };

  // Initialize when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log("Initializing edit popup with:", editedCoreMessage);
      console.log("Current step:", currentStep);
      setLocalEditedCoreMessage(editedCoreMessage || coreMessage);
      setLocalInputMessage("");
      
      // Start question flow if no conversation exists
      if (messages.length === 0) {
        console.log("Starting contextual question flow with currentStep:", currentStep);
        getContextualQuestion(null, currentStep);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editedCoreMessage, coreMessage, currentStep]);

  // Modified useEffect to scroll only on user messages
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0 && messages[messages.length - 1].type === 'ai') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Add effect to show edit view when AI responds
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === 'ai' && window.innerWidth <= 838) {
      setShowMobileEdit(true);
    }
  }, [messages]);

  // Focus management for edit input
  useEffect(() => {
    if (editingMessageIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageIndex]);

  const handleLocalInputChange = (e) => {
    setLocalInputMessage(e.target.value);
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleLocalSendMessage = async () => {
    if (isQuestionMode) {
      handleQuestionAnswer();
      return;
    }

    if (!localInputMessage.trim()) return;

    const userInput = localInputMessage.trim();
    setLocalInputMessage("");
    
    // Reset textarea height to normal
    const textarea = document.querySelector(`.${styles.messageInput}`);
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = '44px'; // Reset to min-height
    }
    
    setIsSending(true);

    try {
      // Check if this is a greeting or general conversation
      const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'thanks', 'thank you', 'ok', 'okay', 'yes', 'no', 'sure', 'alright'];
      const isGreeting = greetingKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isGreeting && messages.length === 0) {
        // Handle greeting and start question flow
        await getContextualQuestion(userInput, currentStep);
      } else {
        // Regular chat flow
        // Add user message to chat
        setMessages((prev) => [
          ...prev,
          {
            content: userInput,
            type: "user",
          },
        ]);

        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }

        // Get current project ID
        const currentProjectId = localStorage.getItem('currentProjectId');
        console.log('handleLocalSendMessage - Current project ID:', currentProjectId);

        // Only include projectId if it's a valid value (not null, undefined, or empty string)
        const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

        // First get the onboarding data
        const onboardingResponse = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!onboardingResponse.ok) {
          throw new Error("Failed to fetch onboarding data");
        }

        const { data } = await onboardingResponse.json();
        
        // Get project-specific core message
        const projectCoreMessage = data.core_message;
        console.log('handleLocalSendMessage - Using project-specific core message:', projectCoreMessage ? projectCoreMessage.substring(0, 100) + '...' : 'null');
        
        const formData =
          typeof data.data === "string" ? JSON.parse(data.data) : data.data;

        // Now make the chat request with the form data
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              formData,
              currentMessage: projectCoreMessage || (isOpen ? editedCoreMessage : coreMessage), // Use project-specific core message if available
              userPrompt: userInput,
              isAudienceEdit: false
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const responseData = await response.json();

        if (responseData.success) {
          // Add AI response to chat
          setMessages((prev) => [
            ...prev,
            {
              content: responseData.data.chatResponse,
            type: "ai",
            },
          ]);

          // Update both core message states to keep them in sync
          const newMessage = responseData.data.coreMessage;
          setCoreMessage(newMessage);
          setEditedCoreMessage(newMessage);
          
          // Store the updated message
          storeCoreMessage(newMessage);

          // Show typewriter effect for the update
          setShowTypewriter(true);

          // Save the updated message to the database
          const currentProjectId = localStorage.getItem('currentProjectId');
          await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ 
                coreMessage: newMessage,
                projectId: currentProjectId 
              }),
            }
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message in chat
      setMessages((prev) => [
        ...prev,
        {
          content: "Sorry, I encountered an error. Please try again.",
          type: "ai",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleLocalEditSubmit = async (index) => {
    if (!editInputValue.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/edit-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageIndex: index,
            newContent: editInputValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to edit message");
      }

      // Update messages array with edited message
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[index] = {
          ...newMessages[index],
          content: editInputValue,
        };
        return newMessages;
      });

      // Clear edit state
      setEditingMessageIndex(null);
      setEditInputValue("");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const handleStartEditing = (index, content) => {
    setEditingMessageIndex(index);
    setEditInputValue(content);
  };

  const handleCancelEditing = () => {
    setEditingMessageIndex(null);
    setEditInputValue("");
  };

  const handleLocalOptionClick = async (optionType) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('handleLocalOptionClick - Current project ID:', currentProjectId);

      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to fetch onboarding data");
      }

      const { data } = await onboardingResponse.json();
      
      // Get project-specific core message
      const projectCoreMessage = data.core_message;
      console.log('handleLocalOptionClick - Using project-specific core message:', projectCoreMessage ? projectCoreMessage.substring(0, 100) + '...' : 'null');
      
      const formData =
        typeof data.data === "string" ? JSON.parse(data.data) : data.data;

      let modificationPrompt = "";
      switch (optionType) {
        case "shorter":
          modificationPrompt =
            "Make this message shorter and punchier while keeping the main point";
          break;
        case "tone":
          modificationPrompt =
            "Make this message more friendly and confident";
          break;
        case "emphasis":
          modificationPrompt = "Emphasize the benefits and value more";
          break;
        case "alternative":
          modificationPrompt =
            "Give me an alternative version with a different angle";
          break;
        case "fresh":
          modificationPrompt = "Rewrite this with a fresh perspective";
          break;
        default:
          break;
      }

      // Use the same endpoint and format as handleSendMessage
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            formData,
            currentMessage: projectCoreMessage || localEditedCoreMessage, // Use project-specific core message if available
            userPrompt: modificationPrompt,
            isAudienceEdit: false
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to modify message");
      }

      const responseData = await response.json();

      if (responseData.success) {
        const newMessage = responseData.data.coreMessage;
        
        // Update local state
        setLocalEditedCoreMessage(newMessage);
        
        // Update parent state
        setCoreMessage(newMessage);
        setEditedCoreMessage(newMessage);

        // Save to database with project ID
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              coreMessage: newMessage,
              projectId: currentProjectId 
            }),
          }
        );
      }
    } catch (error) {
      console.error("Error modifying message:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLocalSave = async () => {
    if (!localEditedCoreMessage.trim()) return;

    try {
      setIsRefreshing(true);
      const token = localStorage.getItem("token");
      const currentProjectId = localStorage.getItem('currentProjectId');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            coreMessage: localEditedCoreMessage,
            projectId: currentProjectId 
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update core message");
      }

      setCoreMessage(localEditedCoreMessage);
      setEditedCoreMessage(localEditedCoreMessage);
      storeCoreMessage(localEditedCoreMessage);
      onClose();
      setShowTypewriter(true);
    } catch (error) {
      console.error("Error updating core message:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Reset question state when popup closes
  const handleClose = () => {
    setCurrentQuestion("");
    setQuestionIndex(0);
    setIsQuestionMode(false);
    setUserAnswers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.editPopupOverlay}>
      <div className={styles.editPopupContent}>
        <div className={`${styles.editPopupLeft} ${showMobileEdit ? styles.hideMobile : ''}`}>
          <div className={styles.Content}>
            <div className={styles.editPopupHeader}>
              <h2>Message Assistant</h2>
              <button
                className={styles.editPopupCloseButton}
                onClick={handleClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.editChatMessages} ref={chatContainerRef}>
              {messages.map((message, index) => (
                <div
                  key={`message-${index}`}
                  className={`${styles.editMessageContent} ${
                    message.type === "user"
                      ? styles.editUserMessage
                      : styles.editAiMessage
                  }`}
                >
                  {message.type === "user" &&
                  editingMessageIndex !== index ? (
                    <>
                      {/* <button
                        className={styles.editButton}
                        onClick={() =>
                          handleStartEditing(index, message.content)
                        }
                        aria-label="Edit message"
                      >
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
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button> */}
                      <p>{message.content}</p>
                    </>
                  ) : editingMessageIndex === index ? (
                    <div className={styles.editInputContainer}>
                      <input
                        ref={editInputRef}
                        type="text"
                        className={styles.editInput}
                        value={editInputValue}
                        onChange={(e) => {
                          e.preventDefault();
                          setEditInputValue(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleLocalEditSubmit(index);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelEditing();
                          }
                        }}
                      />
                      <button
                        className={styles.editSendButton}
                        onClick={() => handleLocalEditSubmit(index)}
                        disabled={!editInputValue.trim()}
                        aria-label="Send edited message"
                      >
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
                          <path d="M22 2L11 13" />
                          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              ))}
              
            </div>
            {/* Current Question Display */}
            {isQuestionMode && currentQuestion && (
              <div className={styles.editCurrentQuestionSection}>
                <div className={styles.editCurrentQuestionHeader}>
                  <span className={styles.editQuestionIcon}>❓</span>
                  <span className={styles.editQuestionText}>Refining your message</span>
                  <button 
                    className={styles.editSkipQuestionsButton}
                    onClick={async () => {
                      if (userAnswers.length > 0) {
                        await updateCoreMessageWithAnswers();
                      } else {
                        setIsQuestionMode(false);
                        setCurrentQuestion("");
                      }
                    }}
                  >
                    {userAnswers.length > 0 ? "Complete & Refine" : "Skip Questions"}
                  </button>
                </div>
                <div className={styles.editQuestionProgress}>
                  <div className={styles.editProgressBar}>
                    <div 
                      className={styles.editProgressFill} 
                      style={{ width: `${Math.min((userAnswers.length / 3) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className={styles.editProgressText}>
                    {userAnswers.length > 0 ? `${userAnswers.length} answers collected` : "Getting started..."}
                  </div>
                </div>
                <p className={styles.editCurrentQuestionText}>{currentQuestion}</p>
              </div>
            )}

            <div className={styles.editInputContainer}>
              
              <textarea
                className={styles.editMessageInput} 
                value={localInputMessage}
                onChange={handleLocalInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleLocalSendMessage();
                  }
                }}
                placeholder={isQuestionMode ? "Type your answer..." : "Type your message..."}
                disabled={isRefreshing}
                rows={1}
              />
              <button
                className={styles.editSendButton}
                onClick={handleLocalSendMessage}
                disabled={!localInputMessage.trim() || isRefreshing}
              >
                {isQuestionMode ? "Answer" : "Send"}
              </button>
            </div>
          </div>
        </div>
        <div className={`${styles.editPopupRight} ${!showMobileEdit ? styles.hideMobile : ''}`}>
          {window.innerWidth <= 838 && (
            <button 
              className={styles.backButton}
              onClick={() => setShowMobileEdit(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Chat
            </button>
          )}
          <div className={styles.editPopupHeader}>
                        <h2>Edit Core Message</h2>
                    </div>
                    <div className={styles.editCoreMessageActions}>
              <button
                className={styles.saveButton}
                onClick={handleLocalSave}
                disabled={!localEditedCoreMessage.trim()}
              >
                Save Changes
              </button>
            </div>
            <textarea
              className={styles.editCoreMessageInput}
              value={localEditedCoreMessage}
              onChange={(e) => setLocalEditedCoreMessage(e.target.value)}
              placeholder="Enter your core message..."
              style={{ minHeight: '150px' }}  // Give more space for the content
            />
            <div className={styles.messageOptions}>
              <button
                className={styles.optionButton}
                onClick={() => handleLocalOptionClick("shorter")}
                disabled={isRefreshing}
              >
                Make it Shorter
              </button>
              <button
                className={styles.optionButton}
                onClick={() => handleLocalOptionClick("tone")}
                disabled={isRefreshing}
              >
                Adjust Tone
              </button>
              <button
                className={styles.optionButton}
                onClick={() => handleLocalOptionClick("emphasis")}
                disabled={isRefreshing}
              >
                Add Emphasis
              </button>
              <button
                className={styles.optionButton}
                onClick={() => handleLocalOptionClick("alternative")}
                disabled={isRefreshing}
              >
                Try Alternative
              </button>
              <button
                className={styles.optionButton}
                onClick={() => handleLocalOptionClick("fresh")}
                disabled={isRefreshing}
              >
                Fresh Perspective
              </button>
            </div>
           
          </div>
        </div>
      </div>
    );
  });

  MemoizedEditPopup.displayName = 'MemoizedEditPopup';

const MemoizedEditAudiencePopup = memo(({ 
    isOpen, 
    audience, 
    onClose, 
    onSave 
}) => {
    const [localInputMessage, setLocalInputMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localSegment, setLocalSegment] = useState(audience?.segment || "");
    const [showMobileEdit, setShowMobileEdit] = useState(false);
    const textareaRef = useRef(null);
    const chatContainerRef = useRef(null);
    const router = useRouter();
    const timeoutRef = useRef(null);

    // Add effect to show edit view when AI responds
    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].type === 'ai' && window.innerWidth <= 838) {
            setShowMobileEdit(true);
        }
    }, [messages]);

    // Modified useEffect to scroll only on user messages
    useEffect(() => {
        if (chatContainerRef.current && messages.length > 0 && messages[messages.length - 1].type === 'ai') {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Initialize textarea value once
                            useEffect(() => {
                            if (audience?.segment) {
                                // Format audience segment as "Title Description" (like initial generation)
                                const title = getFirstTwoWords(audience.segment);
                                const description = getDescription(audience.segment);
                                const formattedText = `${title}\n${description}`;
                                setLocalSegment(formattedText);
                            }
                        }, [audience?.segment]);

    const handleTextAreaChange = (e) => {
        const newValue = e.target.value;
        setLocalSegment(newValue);
    };

    const handleInputChange = (e) => {
        setLocalInputMessage(e.target.value);
        // Auto-resize the textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    const handleLocalSendMessage = async () => {
        if (!localInputMessage.trim()) return;

        setMessages(prev => [...prev, { content: localInputMessage, type: 'user' }]);
        setLocalInputMessage('');
        
        // Reset textarea height to normal
        const textarea = document.querySelector(`.${styles.messageInput}`);
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = '44px'; // Reset to min-height
        }
        
        setIsRefreshing(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        formData: {
                            labelName: "Audience Editing",
                            whoTheyAre: "User editing audience segment",
                            whatTheyWant: "Improve audience description",
                            whatTheyNeed: "Better audience targeting",
                            whatTheyValue: "Clear audience definition",
                            whatTheyFear: "Poor audience targeting",
                            whatTheyDesire: "Effective audience segmentation"
                        },
                        currentMessage: localSegment,
                        userPrompt: localInputMessage,
                        isAudienceEdit: true
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const result = await response.json();
            
            if (result.success) {
                setMessages(prev => [...prev, {
                    content: result.data?.chatResponse || "Sorry, I couldn't process that. Please try again.",
                    type: 'ai'
                }]);
                
                // Clear any pending timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                                                        // Set new value with a small delay
                                        timeoutRef.current = setTimeout(() => {
                                            const newSegment = result.data.coreMessage;
                                            console.log('AI Response for audience editing:', newSegment);
                                            // Use the AI response directly as it should already be formatted correctly
                                            setLocalSegment(newSegment);
                                        }, 100);
            } else {
                setMessages(prev => [...prev, {
                    content: "Sorry, I couldn't process that. Please try again.",
                    type: 'ai'
                }]);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            setMessages(prev => [...prev, {
                content: "Sorry, I encountered an error. Please try again.",
                type: 'ai'
            }]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!audience?.id) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
                return;
            }

                                        // Split the textarea content by lines
                            const lines = localSegment.split('\n');
                            const titleLine = lines[0] || '';
                            const description = lines.slice(1).join('\n') || '';
                            
                            // Extract title (first line)
                            const title = titleLine.trim();
                            
                            // Combine title and description with a space (like initial generation)
                            const combinedSegment = `${title} ${description}`.trim();
                            console.log('Saving audience segment:', combinedSegment);

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/audience/${audience.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    segment: combinedSegment
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update audience');
            }

            // Call the parent's onSave with the updated audience
            onSave({
                ...audience,
                segment: combinedSegment
            });
        } catch (error) {
            console.error('Error updating audience:', error);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    if (!isOpen || !audience) return null;

    return (
        <div className={styles.editPopupOverlay}>
            <div className={styles.editPopupContent}>
                <div className={`${styles.editPopupLeft} ${showMobileEdit ? styles.hideMobile : ''}`}>
                    <div className={styles.editPopupHeader}>
                        <h2>Message Assistant</h2>
                        <button
                            className={styles.editPopupCloseButton}
                            onClick={onClose}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className={styles.chatMessages} ref={chatContainerRef}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.messageContent} ${
                                    message.type === "user"
                                        ? styles.userMessage
                                        : styles.aiMessage
                                }`}
                            >
                                <p>{message.content}</p>
                            </div>
                        ))}
                        {isRefreshing && (
                            <div className={styles.aiMessage}>
                                <div className={styles.loadingDots}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.inputContainer}>
                        <textarea
                            className={styles.messageInput}
                            value={localInputMessage}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleLocalSendMessage();
                                }
                            }}
                            placeholder="Type your message..."
                            style={{height: '44px', minHeight: '44px', maxHeight: '200px', resize: 'none', overflow: 'hidden'}}
                        />
                        <button
                            className={styles.sendButton}
                            onClick={handleLocalSendMessage}
                            disabled={isRefreshing || !localInputMessage.trim()}
                        >Send
                        </button>
                    </div>
                </div>
                <div className={`${styles.editPopupRight} ${!showMobileEdit ? styles.hideMobile : ''}`}>
                    {window.innerWidth <= 838 && (
                        <button 
                            className={styles.backButton}
                            onClick={() => setShowMobileEdit(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Chat
                        </button>
                    )}
                    <div className={styles.editPopupHeader}>
                        <h2>Edit Audience</h2>
                    </div>
                    <div className={styles.formGroup}>
                        <textarea
                            ref={textareaRef}
                            className={`${styles.editCoreMessageInput} ${styles.audienceEditTextarea}`}
                            value={localSegment}
                            onChange={handleTextAreaChange}
                            placeholder="Your Title Here&#10;Description goes here..."
                            style={{minHeight: '120px'}}
                        />
                    </div>
                    <div className={styles.editCoreMessageActions}>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

MemoizedEditAudiencePopup.displayName = 'MemoizedEditAudiencePopup';

export default function Dashboard() {
  const router = useRouter();
  const [isSavePopupOpen, setSavePopupOpen] = useState(false);
  const [showSaveAndContinue, setShowSaveAndContinue] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({
    marketing: false,
    content: false,
    social: false,
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState({ name: "", initials: "" });
  const [activeSection, setActiveSection] = useState("greeting");
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coreMessage, setCoreMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [sidebarProjectName, setSidebarProjectName] = useState("");

  // Brand Discovery Form State
  const [showBrandDiscovery, setShowBrandDiscovery] = useState(false);
  const [brandDiscoveryStep, setBrandDiscoveryStep] = useState(1);
  const [brandDiscoveryTab, setBrandDiscoveryTab] = useState("discovery");
  const [parentBrandStep, setParentBrandStep] = useState(1);
  const [showDiscoveryChildForm, setShowDiscoveryChildForm] = useState(false);
  const [messagingStep, setMessagingStep] = useState(1);
  const [showMessagingChildForm, setShowMessagingChildForm] = useState(false);
  const [brandFormData, setBrandFormData] = useState({
    brandName: "",
    industry: "",
    shortDescription: "",
    websiteLink: "",
    toneOfVoice: "",
    targetAudience: "",
    compliance: ""
  });

  // Brand Core Message micro-flow state
  const [brandCoreMessage, setBrandCoreMessage] = useState("");
  const [brandCoreSuggestions, setBrandCoreSuggestions] = useState([]);
  const [brandCoreIntro, setBrandCoreIntro] = useState("");
  const [brandCoreQA, setBrandCoreQA] = useState([]); // [{question, answer}]
  const [brandCoreQuestion, setBrandCoreQuestion] = useState("");
  const [brandCoreAnswer, setBrandCoreAnswer] = useState("");
  const [isBrandCoreLoading, setIsBrandCoreLoading] = useState(false);

  // Tone of Voice Chat Flow State
  const [showToneOfVoiceChat, setShowToneOfVoiceChat] = useState(false);
  const [toneChatMessages, setToneChatMessages] = useState([]);
  const [toneChatInput, setToneChatInput] = useState("");
  const [isToneChatLoading, setIsToneChatLoading] = useState(false);
  const [toneChatStep, setToneChatStep] = useState(0);
  const [toneChatAnswers, setToneChatAnswers] = useState([]);
  const [toneChatQuestions, setToneChatQuestions] = useState([]);
  const [currentToneQuestion, setCurrentToneQuestion] = useState('');
  const [selectedArchetypes, setSelectedArchetypes] = useState([]);
  const [toneOfVoiceResult, setToneOfVoiceResult] = useState(null);
  const [toneExplanation, setToneExplanation] = useState("");
  const [workflowId, setWorkflowId] = useState(null);
  const toneChatContainerRef = useRef(null);

  // Friendly, user-understandable summaries for the 12 archetypes (presentation only)
  const ARCHETYPE_DESCRIPTIONS = {
    "The Hero": "Bold, action‑oriented, motivates progress and achievement.",
    "The Explorer": "Curious, adventurous, seeks new ideas and possibilities.",
    "The Caregiver": "Warm, supportive, puts people first and builds trust.",
    "The Sage": "Wise, clear, evidence‑led guidance with calm authority.",
    "The Innocent": "Simple, optimistic, honest and feel‑good.",
    "The Outlaw": "Challenging, disruptive, breaks norms to spark change.",
    "The Magician": "Visionary, transformative, turns complex into remarkable.",
    "Regular Guy": "Down‑to‑earth, relatable, everyday and approachable.",
    "The Lover": "Emotional, intimate, focuses on connection and desire.",
    "The Jester": "Playful, witty, light‑hearted and memorable.",
    "The Creator": "Imaginative, design‑driven, crafts original, expressive work.",
    "The Ruler": "Confident, premium, leads with standards and control."
  };


  const [folderStructure, setFolderStructure] = useState({});

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isBriefFormOpen, setIsBriefFormOpen] = useState(false);
  const [briefData, setBriefData] = useState({
    purpose: "",
    main_message: "",
    special_features: "",
    beneficiaries: "",
    benefits: "",
    call_to_action: "",
    importance: "",
    additional_info: "",
  });

  const [audiences, setAudiences] = useState([]);

  // Target Audience State (exactly like library page)
  const [audienceData, setAudienceData] = useState({
    audienceType: null,
    labelName: '',
    whoTheyAre: '',
    whatTheyWant: '',
    whatTheyStruggle: '',
    additionalInfo: ''
  });
  const [isGeneratingAudiences, setIsGeneratingAudiences] = useState(false);
  const [isSavingAudiences, setIsSavingAudiences] = useState(false);
  const [audienceError, setAudienceError] = useState('');
  const [audienceLoadingMessage, setAudienceLoadingMessage] = useState('');
  const [checkedAudiences, setCheckedAudiences] = useState({});
  const [savedAudiences, setSavedAudiences] = useState({});
  const [currentBriefId, setCurrentBriefId] = useState(null);
  
  // Track if user came from Open Library button
    const [cameFromOpenLibrary, setCameFromOpenLibrary] = useState(false);
  const [newlyCreatedLibraryName, setNewlyCreatedLibraryName] = useState('');
  
    

  
  // Edit Audience Popup State
  const [isEditAudiencePopupOpen, setIsEditAudiencePopupOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState(null);
  
  const [audienceLoadingQuestions] = useState([
    "Analyzing your brief requirements...",
    "Identifying key audience segments...",
    "Generating detailed audience insights...",
    "Creating personalized messaging strategies...",
    "Finalizing audience profiles..."
  ]);

  const qaPairs = [
    {
      question: "What type of content are you looking to create?",
      options: ["Blog Post", "Social Media", "Email", "Ad Copy"],
    },
    {
      question: "What's your content goal?",
      options: ["Engagement", "Lead Generation", "Brand Awareness", "Sales"],
    },
  ];

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-scroll for tone chat messages
  useEffect(() => {
    if (toneChatContainerRef.current && toneChatMessages.length > 0 && toneChatMessages[toneChatMessages.length - 1].type === 'bot') {
      toneChatContainerRef.current.scrollTop = toneChatContainerRef.current.scrollHeight;
    }
  }, [toneChatMessages]);
  
  const loadingMessages = useMemo(() => [
   "Analyzing your inputs...",
    "Generating your marketing content...",
    "Crafting your brand message...",
    "Shaping content to fit your audience...",
    "Finalizing your personalized copy."

  ], []);

  useEffect(() => {
    let messageIndex = 0;
    let intervalId;

    if (isLoading) {
      intervalId = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
      }, 2000); // Change message every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, loadingMessages]);

  const [isEditingCoreMessage, setIsEditingCoreMessage] = useState(false);
  const [editedCoreMessage, setEditedCoreMessage] = useState("");

  const adjustTextareaHeight = (element) => {
    if (element) {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [coreMessageSeen, setCoreMessageSeen] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [hasExistingProjects, setHasExistingProjects] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false); // Changed from true to false
  const [showStepForm, setShowStepForm] = useState(false);
  const [formFields, setFormFields] = useState(null);
  const [marketingFormAnswers, setMarketingFormAnswers] = useState({});
  const [isMarketingFormLoading, setIsMarketingFormLoading] = useState(false);
  const [marketingError, setMarketingError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Add loading state for initial project check
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);
  const autoSaveTimeout = useRef(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formAnswers, setFormAnswers] = useState({});
  const [showFormSuccess, setShowFormSuccess] = useState(false);

  const handleEditCoreMessage = async () => {
    try {
      if (!isEditPopupOpen) {
        // Clear chat messages to ensure project-specific chat
        setMessages([]);
        
        // Simple approach: just open the popup and let getContextualQuestion handle everything
        console.log('handleEditCoreMessage - Opening edit popup');
        setEditedCoreMessage(coreMessage);
        setIsEditPopupOpen(true);
      } else {
        // Save the edited message to the current project
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const currentProjectId = localStorage.getItem('currentProjectId');
        
        console.log('Saving edited core message for project:', currentProjectId);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              coreMessage: editedCoreMessage,
              projectId: currentProjectId 
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update core message");
        }

        setCoreMessage(editedCoreMessage);
        setIsEditPopupOpen(false);
        setShowTypewriter(true);
      }
    } catch (error) {
      console.error("Error updating core message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update form data in database
  const updateFormDataInDB = async (updatedData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log('Sending data to update endpoint:', updatedData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            data: updatedData
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update form data in database: ${errorText}`);
      }

      const result = await response.json();
      console.log('Database update successful:', result);
      return result;
    } catch (error) {
      console.error("Error updating form data:", error);
      throw error;
    }
  };

  // Function to refresh form data from database
  const refreshFormData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('No token found, skipping refreshFormData');
        return;
      }

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('Refreshing form data from database for project:', currentProjectId);

      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

      console.log('Making request to:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log('Fresh data from database:', data);
        
        // Update the onboarding data
        setOnboardingData(data);
        
        // Clear any local form changes to show fresh data
        setFormAnswers({});
        
        console.log('Form data refreshed from database');
      } else {
        const errorText = await response.text();
        console.error('Failed to refresh form data:', response.status, errorText);
        console.log('Response headers:', response.headers);
        console.log('Response URL:', response.url);
        
        // Don't throw error, just log it and continue
        console.log('Continuing without refreshing form data due to error');
      }
    } catch (error) {
      console.error('Error refreshing form data:', error);
      console.log('Continuing without refreshing form data due to error');
    }
  };



  // Store core message in localStorage
  const storeCoreMessage = (message) => {
    if (message) {
      const storedData = {
        message,
        timestamp: Date.now(),
        context: 'core-message'
      };
      localStorage.setItem('marketingCoreMessage', JSON.stringify(storedData));
    }
  };

  const fetchCoreMessage = async (shouldRefresh = false) => {
    try {
      setIsRefreshing(true);
      setShowTypewriter(false);
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get current project ID for debugging
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('fetchCoreMessage - Current project ID:', currentProjectId);
      
      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;
      
      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to fetch onboarding data");
      }

      const { data } = await onboardingResponse.json();
      console.log('Fetched onboarding data from database:', data);
      console.log('Data structure:', {
        hasData: !!data,
        hasDataField: !!(data && data.data),
        dataType: data && data.data ? typeof data.data : 'null',
        dataValue: data && data.data ? (typeof data.data === 'string' ? data.data.substring(0, 100) + '...' : 'object') : 'null'
      });
      setOnboardingData(data);

      // Check if we have valid onboarding data (not just empty structure)
      const hasValidData = data && data.data && data.data !== null;
      console.log('Has valid onboarding data:', hasValidData);

      if (shouldRefresh && hasValidData) {
        const formData =
          typeof data.data === "string" ? JSON.parse(data.data) : data.data;

        const marketingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate?refresh=true`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (!marketingResponse.ok) {
          throw new Error("Failed to generate new marketing content");
        }

        const marketingData = await marketingResponse.json();

        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              coreMessage: marketingData.data.coreMessage,
              projectId: currentProjectId,
            }),
          }
        );

        setCoreMessage(marketingData.data.coreMessage);
        storeCoreMessage(marketingData.data.coreMessage);
        setShowTypewriter(true);
      } else if (data && data.core_message) {
        setCoreMessage(data.core_message);
        storeCoreMessage(data.core_message);
      }

      // Check if core message has been seen
      if (data && typeof data.core_message_seen === 'boolean') {
        setCoreMessageSeen(data.core_message_seen);
        // If core message has been seen in database, show projects directly
        if (data.core_message_seen) {
          setShowProjects(true);
        }
      }
    } catch (error) {
      console.error("Error fetching core message:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Removed unnecessary fetchCoreMessage call on mount
  // Core message will be loaded when needed (e.g., when opening edit popup)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  // Fetch marketing form fields when step form is shown
  useEffect(() => {
    if (showStepForm && !formFields) {
      const fetchFormFields = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setMarketingError('No authentication token found');
            return;
          }

          // If no existing data, fetch fresh form fields
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/form`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch form fields');
          }

          const data = await response.json();
          setFormFields(data.data);

          // Initialize form answers
          const initialAnswers = {};
          data.data.fields.forEach(field => {
            initialAnswers[field.nameKey] = '';
          });
          setMarketingFormAnswers(initialAnswers);

        } catch (error) {
          console.error('Error fetching form fields:', error);
          setMarketingError(error.message);
        }
      };

      fetchFormFields();
    }
  }, [showStepForm, formFields]);

  // Refresh form data when onboardingData changes
  useEffect(() => {
    if (onboardingData && onboardingData.data) {
      try {
        const parsedData = typeof onboardingData.data === "string" ? JSON.parse(onboardingData.data) : onboardingData.data;
        if (parsedData.formFields && parsedData.formAnswers) {
          // Load form answers from database data
          setFormAnswers(parsedData.formAnswers);
          console.log('Loaded form answers from database:', parsedData.formAnswers);
        }
      } catch (error) {
        console.error('Error parsing onboarding data:', error);
      }
    }
  }, [onboardingData]);

  // Auto-load audiences when reaching step 3 and came from Open Library
  useEffect(() => {
    const loadAudiencesForOpenLibrary = async () => {
      // Only load if we're on step 3, came from Open Library, and don't have audiences yet
      if (currentStep === 3 && cameFromOpenLibrary && audiences.length === 0) {
        try {
          const currentProjectId = localStorage.getItem('currentProjectId');
          const token = localStorage.getItem('token');
          
          if (!currentProjectId || !token) {
            console.log('No project ID or token available for audience loading');
            return;
          }

          console.log('Auto-loading audiences for Open Library user on step 3');
          
          // Fetch audiences for this project
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/project/${currentProjectId}/audiences`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const audienceData = await response.json();
            if (audienceData.data && audienceData.data.length > 0) {
              // Format the existing audiences
              const formattedAudiences = audienceData.data.map(audience => ({
                ...audience,
                name: getFirstTwoWords(audience.segment),
                description: getDescription(audience.segment)
              }));
              
              setAudiences(formattedAudiences);
              // Set the brief ID from the first audience (they all have the same brief_id)
              if (formattedAudiences.length > 0 && formattedAudiences[0].briefId) {
                setCurrentBriefId(formattedAudiences[0].briefId);
              }
              console.log('Auto-loaded audiences for Open Library user:', formattedAudiences);
            } else {
              console.log('No audiences found for this project');
            }
          } else {
            console.error('Failed to fetch audiences for Open Library user');
          }
        } catch (error) {
          console.error('Error auto-loading audiences for Open Library user:', error);
        }
      }
    };

    loadAudiencesForOpenLibrary();
  }, [currentStep, cameFromOpenLibrary, audiences.length]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = '/';
        return;
      }

      try {
        // Set user data from localStorage
        const userData = JSON.parse(localStorage.getItem("user"));
        if (!userData) {
          window.location.href = '/';
          return;
        }

        // Check if user is admin - redirect to admin panel
        if (userData.role === 'admin') {
          window.location.href = '/usermanagement';
          return;
        }

        setUser({
          name: userData.name,
          initials: userData.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
        });


      } catch (error) {
        console.error("Error checking auth:", error);
        window.location.href = '/';
      }
    };

    checkAuth();
  }, [router]);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        console.log("Fetched projects:", data);

        // Convert to folder structure without filtering
        const newFolderStructure = data.reduce((acc, project) => {
          const projectKey = project.name.toLowerCase().replace(/\s+/g, "_");
          acc[projectKey] = {
            id: project.id,
            name: project.name,
            status: project.status,
          };
          return acc;
        }, {});

        setFolderStructure(newFolderStructure);
        setProjects(data);
        
        // Check if user has existing projects
        if (data && data.length > 0) {
          setHasExistingProjects(true);
          setShowProjects(true);
          setShowWelcome(false);
          setShowStepForm(false);
          setIsInitialLoading(false); // Stop loading when projects found
        } else {
          // No existing projects, show welcome section immediately
          setShowWelcome(true);
          setShowProjects(false);
          setShowStepForm(false);
          setIsInitialLoading(false); // Stop loading when no projects found
        }
      } else {
        console.error("Failed to fetch projects:", response.status);
        // On error, show welcome section as fallback
        setShowWelcome(true);
        setShowProjects(false);
        setShowStepForm(false);
        setIsInitialLoading(false); // Stop loading on error
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      // On error, show welcome section as fallback
      setShowWelcome(true);
      setShowProjects(false);
      setShowStepForm(false);
      setIsInitialLoading(false); // Stop loading on error
    }
    // Remove the finally block since we're setting loading to false in each condition
  }, [router]);

  // Fetch brands with their projects
  const fetchBrandsWithProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(
        `${baseUrl}/api/brands/with-projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        console.log("Fetched brands with projects:", data);
        setBrands(data);
      } else {
        console.error("Failed to fetch brands:", response.status);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  }, []);

  const fetchProjectName = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(
        `${baseUrl}/api/onboarding/get`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        if (data && data.data) {
          const formData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
          // Get the project name from the description field (first question)
          const projectName = formData.description;
          setSidebarProjectName(projectName);
        }
      }
    } catch (error) {
      console.error("Error fetching project name:", error);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const initials = parsedUser.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
      setUser({ ...parsedUser, initials });

      // Fetch projects, project name, and brands when user data is available
      fetchProjects();
      fetchProjectName();
      fetchBrandsWithProjects();
    }
  }, [fetchProjects, fetchProjectName, fetchBrandsWithProjects]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleFolder = (folderKey) => {
    setExpandedFolders((prev) => {
      // Create a new object with all folders closed
      const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

      // Toggle only the clicked folder
      return {
        ...allClosed,
        [folderKey]: !prev[folderKey],
      };
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user"));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/project`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: userData.id,
            projectName: projectName.trim(),
          }),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        
        // Clear any existing project-specific data to ensure clean slate
        clearProjectSpecificData();
        
        setProjectName("");
        setIsProjectPopupOpen(false);
        // Navigate to library after successful project creation
        router.push("/library");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBriefSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user"));

      const briefPayload = {
        projectId: selectedFolder.id,
        projectName: selectedFolder.name,
        purpose: briefData.purpose,
        mainMessage: briefData.main_message,
        specialFeatures: briefData.special_features,
        beneficiaries: briefData.beneficiaries,
        benefits: briefData.benefits,
        callToAction: briefData.call_to_action,
        importance: briefData.importance,
        additionalInfo: briefData.additional_info,
      };

      console.log("Creating brief with payload:", briefPayload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-brief`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(briefPayload),
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        // Parse and store audiences
        const newAudiences = responseData.data.audiences.map((audience) => {
          const segmentData = JSON.parse(audience.segment);
          return {
            id: audience.id,
            name: segmentData.name,
            description: segmentData.description,
          };
        });
        setAudiences(newAudiences);

        setBriefData({
          purpose: "",
          main_message: "",
          special_features: "",
          beneficiaries: "",
          benefits: "",
          call_to_action: "",
          importance: "",
          additional_info: "",
        });
        setIsBriefFormOpen(false);
        setError("");
      } else {
        const errorMessage = responseData.message || "Failed to create brief";
        console.error("Server error:", errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error creating brief:", error);
      setError(error.message || "Failed to create brief. Please try again.");
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const input = e.target;
    const value = input.value;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // Handle backspace
    if (e.nativeEvent.inputType === "deleteContentBackward") {
      setInputMessage((prevMessage) => prevMessage.slice(0, -1));
      return;
    }

    // Handle regular input
    const newChar = value.charAt(start - 1);
    if (newChar) {
      setInputMessage((prevMessage) => prevMessage + newChar);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        content: inputMessage,
        type: "user",
      },
    ]);
    setInputMessage("");
    setIsSending(true);
    setIsRefreshing(true); // Show skeleton loader

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('handleSendMessage - Current project ID:', currentProjectId);

      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

      // First get the onboarding data
      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to fetch onboarding data");
      }

      const { data } = await onboardingResponse.json();
      console.log('handleSendMessage - Fetched data:', data);
      console.log('handleSendMessage - Current step:', currentStep);
      
      // Check if we have valid onboarding data OR if user is on step 2 or higher (which means Discovery Questionnaire is completed)
      if ((!data || !data.data || data.data === null) && currentStep < 2) {
        setMessages((prev) => [
          ...prev,
          {
            content: "Please complete the Discovery Questionnaire first.",
            type: "ai",
          },
        ]);
        return;
      }
      
      // If we're on step 2 or higher but don't have form data, create a basic structure
      let formData;
      if (!data || !data.data || data.data === null) {
        console.log('No form data found, but user is on step', currentStep, '- creating basic structure');
        formData = {
          formFields: [],
          formAnswers: {},
          welcomeMessage: "Welcome to your marketing journey!",
          footerMessage: "Thank you for completing the questionnaire."
        };
      } else {
        formData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      }

      // Now make the chat request with the form data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            formData,
            currentMessage: data.core_message || (isEditPopupOpen ? editedCoreMessage : coreMessage), // Use project-specific core message if available
            userPrompt: inputMessage,
            isAudienceEdit: false
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const responseData = await response.json();

      if (responseData.success) {
        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          {
            content: responseData.data.chatResponse,
            type: "ai",
          },
        ]);

        // Update both core message states to keep them in sync
        const newMessage = responseData.data.coreMessage;
        setCoreMessage(newMessage);
        setEditedCoreMessage(newMessage);
        
        // Store the updated message
        storeCoreMessage(newMessage);

        // Show typewriter effect for the update
        setShowTypewriter(true);

        // Save the updated message to the database
        const currentProjectId = localStorage.getItem('currentProjectId');
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              coreMessage: newMessage,
              projectId: currentProjectId 
            }),
          }
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message in chat
      setMessages((prev) => [
        ...prev,
        {
          content: "Sorry, I encountered an error. Please try again.",
          type: "ai",
        },
      ]);
    } finally {
      setIsSending(false);
      setIsRefreshing(false); // Hide skeleton loader
    }
  };

  // Add effect to handle message updates
  useEffect(() => {
    if (coreMessage && !isRefreshing) {
      setNewMessage(coreMessage);
      setShowTypewriter(true);
    }
  }, [coreMessage, isRefreshing]);

  const handleOptionClick = async (optionType) => {
    try {
      setIsRefreshing(true);
      setShowTypewriter(false);
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('handleOptionClick - Current project ID:', currentProjectId);

      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to fetch onboarding data");
      }

      const { data } = await onboardingResponse.json();
      console.log('handleOptionClick - Fetched data:', data);
      console.log('handleOptionClick - Current step:', currentStep);

      // Check if we have valid onboarding data OR if user is on step 2 or higher (which means Discovery Questionnaire is completed)
      if ((!data || !data.data || data.data === null) && currentStep < 2) {
        setMessages((prev) => [
          ...prev,
          {
            content: "Please complete the Discovery Questionnaire first.",
            type: "ai",
          },
        ]);
        return;
      }
      
      // If we're on step 2 or higher but don't have form data, create a basic structure
      let formData;
      if (!data || !data.data || data.data === null) {
        console.log('No form data found, but user is on step', currentStep, '- creating basic structure');
        formData = {
          formFields: [],
          formAnswers: {},
          welcomeMessage: "Welcome to your marketing journey!",
          footerMessage: "Thank you for completing the questionnaire."
        };
      } else {
        formData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      }

        let modificationPrompt = "";
        switch (optionType) {
          case "shorter":
            modificationPrompt =
              "Make this message shorter and punchier while keeping the main point";
            break;
          case "tone":
            modificationPrompt =
              "Make this message more friendly and confident";
            break;
          case "emphasis":
            modificationPrompt = "Emphasize the benefits and value more";
            break;
          case "alternative":
            modificationPrompt =
              "Give me an alternative version with a different angle";
            break;
          case "fresh":
            modificationPrompt = "Rewrite this with a fresh perspective";
            break;
          default:
            break;
        }

        // Add the current core message and modification request to the form data
        formData.currentMessage = coreMessage;
        formData.modificationRequest = modificationPrompt;
        formData.additionalInfo = `Please modify this core message: "${coreMessage}". ${modificationPrompt}`;

        const marketingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate?refresh=true`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (!marketingResponse.ok) {
          throw new Error("Failed to generate new marketing content");
        }

        const marketingData = await marketingResponse.json();

        if (marketingData.success && marketingData.data) {
          setCoreMessage(marketingData.data.coreMessage);
          setShowTypewriter(true);

          const currentProjectId = localStorage.getItem('currentProjectId');
          await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                coreMessage: marketingData.data.coreMessage,
                projectId: currentProjectId,
              }),
            }
          );
        }
    } catch (error) {
      console.error("Error modifying message:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add new function to handle edit submission
  const handleEditSubmit = async (index) => {
    if (!editInputValue.trim()) return;

    const originalMessage = messages[index];

    // Update the message immediately for better UX
    const updatedMessages = [...messages];
    updatedMessages[index] = {
      ...originalMessage,
      content: editInputValue,
    };
    setMessages(updatedMessages);

    // Reset edit state
    setEditingMessageIndex(null);
    setEditInputValue("");
    setIsRefreshing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      // Get current project ID
      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('handleEditSubmit - Current project ID:', currentProjectId);

      // Only include projectId if it's a valid value (not null, undefined, or empty string)
      const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

      // Get the onboarding data
      const onboardingResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!onboardingResponse.ok) {
        throw new Error("Failed to fetch onboarding data");
      }

      const { data } = await onboardingResponse.json();
      console.log('handleEditSubmit - Fetched data:', data);
      console.log('handleEditSubmit - Current step:', currentStep);
      
      // Check if we have valid onboarding data OR if user is on step 2 or higher (which means Discovery Questionnaire is completed)
      if ((!data || !data.data || data.data === null) && currentStep < 2) {
        setMessages((prev) => [
          ...prev,
          {
            content: "Please complete the Discovery Questionnaire first.",
            type: "ai",
          },
        ]);
        return;
      }
      
      // If we're on step 2 or higher but don't have form data, create a basic structure
      let formData;
      if (!data || !data.data || data.data === null) {
        console.log('No form data found, but user is on step', currentStep, '- creating basic structure');
        formData = {
          formFields: [],
          formAnswers: {},
          welcomeMessage: "Welcome to your marketing journey!",
          footerMessage: "Thank you for completing the questionnaire."
        };
      } else {
        formData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      }

      // Make the generate request with the edited message
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-with-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            formData,
            currentMessage: data.core_message || coreMessage, // Use project-specific core message if available
            userPrompt: editInputValue,
            isAudienceEdit: false
          }),
        }
      );

      const marketingData = await response.json();

      if (marketingData.success) {
        // Update core message silently
        setCoreMessage(marketingData.data.coreMessage);

        // Save the new core message to the database
        const currentProjectId = localStorage.getItem('currentProjectId');
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              coreMessage: marketingData.data.coreMessage,
              projectId: currentProjectId,
            }),
          }
        );

        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          {
            content: marketingData.data.chatResponse,
            type: "ai",
          },
        ]);
      }
    } catch (error) {
      console.error("Error updating message:", error);
      // Revert the message on error
      setMessages(messages);
      setMessages((prev) => [
        ...prev,
        {
          content: "Sorry, I encountered an error. Please try again.",
          type: "ai",
        },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Mark core message as seen
      await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/core-message-seen`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCoreMessageSeen(true);
      setShowSaveAndContinue(true);
    } catch (error) {
      console.error("Error marking core message as seen:", error);
      // Still show the save and continue section even if marking as seen fails
      setShowSaveAndContinue(true);
    }
  };

  const renderProjectPopup = () => {
    if (!isProjectPopupOpen) return null;

    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popup}>
          <div className={styles.popupHeader}>
            <h2>Create New Project</h2>
            <button
              className={styles.closeButton}
              onClick={() => {
                setIsProjectPopupOpen(false);
                setProjectName("");
                setError("");
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleCreateProject}>
            <div className={styles.formGroup}>
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                className={styles.input}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className={styles.popupActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setIsProjectPopupOpen(false);
                  setProjectName("");
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !projectName.trim()}
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderBrandForm = () => {
    if (!showBrandDiscovery) return null;

    return (
      <div className={styles.modernBrandContainer}>
        
        {/* Header Section */}
        <div className={styles.modernBrandHeader}>
          <div className={styles.brandHeaderContent}>
            <div className={styles.brandHeaderLeft}>
              <div className={styles.brandIconWrapper}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className={styles.brandHeaderText}>
                <h2>Create New Brand</h2>
                <p>Build your brand identity with AI-powered insights</p>
              </div>
            </div>
            <button
              className={styles.modernCloseButton}
              onClick={() => {
                setShowBrandDiscovery(false);
                // If there are no projects, return to welcome
                if (!hasExistingProjects) {
                  setShowWelcome(true);
                  setShowProjects(false);
                  setShowStepForm(false);
                }
                setBrandFormData({
                  brandName: "",
                  industry: "",
                  shortDescription: "",
                  websiteLink: "",
                  toneOfVoice: "",
                  targetAudience: "",
                  compliance: ""
                });
                setBrandDiscoveryStep(1);
                setBrandDiscoveryTab("discovery");
                setParentBrandStep(1);
                setShowDiscoveryChildForm(false);
                setAiGeneratedTone(null);
                setAiGeneratedAudience(null);
                setAiGeneratedCompliance(null);
                setToneChatMessages([]);
                setToneChatInput("");
                setToneChatStep(0);
                setToneChatAnswers([]);
                setSelectedArchetypes([]);
                setToneOfVoiceResult(null);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Modern Progress Indicator with Checkpoints */}
          <div className={styles.modernProgressContainer}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressBar}
                style={{ 
                  width: `${(() => {
                    // Calculate more precise progress based on current state
                    if (parentBrandStep === 1) {
                      // If in discovery and child form is shown, show partial progress
                      if (showDiscoveryChildForm) {
                        // Progress within discovery: 0% + (brandDiscoveryStep / 3) * 33.33%
                        return (brandDiscoveryStep / 3) * 33.33;
                      }
                      // Just started discovery
                      return 5; // Small initial progress
                    } else if (parentBrandStep === 2) {
                      // Messaging step - show up to messaging (33.33% for completed discovery + some progress in messaging)
                      return 50; // Show progress up to middle of messaging step
                    } else if (parentBrandStep === 3) {
                      // Guidelines step - show up to guidelines (66.66% for completed discovery + messaging)
                      return 100;
                    }
                    return 0;
                  })()}%` 
                }}
              ></div>
              
              {/* Checkpoint Indicators */}
              <div className={styles.checkpointContainer}>
                {/* Discovery sub-checkpoints - always show */}
                {[
                  { position: 11.11, step: 1, icon: "📝", title: "Discovery" },
                  { position: 22.22, step: 2, icon: "🎯", title: "Brand Voice" },
                  { position: 33.33, step: 3, icon: "📋", title: "Compliance" }
                ].map((checkpoint) => (
                  <div
                    key={checkpoint.step}
                    className={`${styles.checkpoint} ${
                      parentBrandStep === 1 && showDiscoveryChildForm && brandDiscoveryStep >= checkpoint.step ? styles.checkpointActive : ''
                    } ${parentBrandStep === 1 && showDiscoveryChildForm && brandDiscoveryStep > checkpoint.step ? styles.checkpointCompleted : ''
                    } ${parentBrandStep > 1 ? styles.checkpointCompleted : ''}`}
                    style={{ left: `${checkpoint.position}%` }}
                  >
                    <div className={styles.checkpointIcon}>
                      {(parentBrandStep === 1 && showDiscoveryChildForm && brandDiscoveryStep > checkpoint.step) || parentBrandStep > 1 ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      ) : (
                        checkpoint.icon
                      )}
            </div>
                    <div className={styles.checkpointTooltip}>
                      {checkpoint.title}
          </div>
        </div>
                ))}
                
                {/* Messaging checkpoint - always show */}
                <div
                  className={`${styles.checkpoint} ${styles.checkpointMajor} ${
                    parentBrandStep >= 2 ? styles.checkpointActive : ''
                  } ${parentBrandStep > 2 ? styles.checkpointCompleted : ''}`}
                  style={{ left: '50%' }}
                >
                  <div className={styles.checkpointIcon}>
                    {parentBrandStep > 2 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.checkpointTooltip}>
                    Messaging Complete
                  </div>
                </div>
                
                {/* Messaging sub-checkpoints - show when in messaging step */}
                {parentBrandStep === 2 && showMessagingChildForm && [
                  { position: 66.67, step: 1, icon: "👥", title: "Target Audience" },
                  { position: 77.78, step: 2, icon: "💬", title: "Core Message" }
                ].map((checkpoint) => (
                  <div
                    key={checkpoint.step}
                    className={`${styles.checkpoint} ${
                      messagingStep >= checkpoint.step ? styles.checkpointActive : ''
                    } ${messagingStep > checkpoint.step ? styles.checkpointCompleted : ''}`}
                    style={{ left: `${checkpoint.position}%` }}
                  >
                    <div className={styles.checkpointIcon}>
                      {messagingStep > checkpoint.step ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      ) : (
                        checkpoint.icon
                      )}
                    </div>
                    <div className={styles.checkpointTooltip}>
                      {checkpoint.title}
                    </div>
                  </div>
                ))}
                
                {/* Guidelines checkpoint - always show */}
                <div
                  className={`${styles.checkpoint} ${styles.checkpointMajor} ${
                    parentBrandStep >= 3 ? styles.checkpointActive : ''
                  } ${parentBrandStep > 3 ? styles.checkpointCompleted : ''}`}
                  style={{ left: '100%' }}
                >
                  <div className={styles.checkpointIcon}>
                    {parentBrandStep > 3 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c-1 0-2-.4-2.7-1.1l-1.4-1.4c-.6-.6-1.4-.9-2.2-.9H9c-.8 0-1.6.3-2.2.9L5.4 10.9C4.7 11.6 3.7 12 2.7 12"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.checkpointTooltip}>
                    Brand Complete
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.progressSteps}>
              {[
                { step: 1, title: "Discovery", subtitle: "Brand basics" },
                { step: 2, title: "Messaging", subtitle: "Voice & tone" },
                { step: 3, title: "Copy", subtitle: "Brand rules" }
              ].map((item) => {
                // Determine if step is active, completed, or current
                const isCompleted = parentBrandStep > item.step;
                const isCurrent = parentBrandStep === item.step;
                const isActive = parentBrandStep >= item.step;
                
                // Special case for Discovery step - check if child form is completed
                const isDiscoveryCompleted = item.step === 1 && parentBrandStep > 1;
                const isDiscoveryInProgress = item.step === 1 && parentBrandStep === 1 && showDiscoveryChildForm;
                
                return (
                  <div 
                    key={item.step}
                    className={`${styles.progressStep} ${
                      isActive ? styles.progressStepActive : ''
                    } ${isCompleted ? styles.progressStepCompleted : ''} ${
                      isCurrent ? styles.progressStepCurrent : ''
                    }`}
                  >
                    <div className={styles.progressStepNumber}>
                      {isCompleted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      ) : isCurrent ? (
                        <div className={styles.currentStepIndicator}>
                          <div className={styles.pulsingDot}></div>
                        </div>
                      ) : (
                        item.step
                      )}
                    </div>
                    <div className={styles.progressStepText}>
                      <span className={styles.progressStepTitle}>{item.title}</span>
                      <span className={styles.progressStepSubtitle}>{item.subtitle}</span>
                      {/* Show sub-progress for Discovery step */}
                      {item.step === 1 && parentBrandStep === 1 && showDiscoveryChildForm && (
                        <div className={styles.subProgress}>
                          <div className={styles.subProgressBar}>
                            <div 
                              className={styles.subProgressFill}
                              style={{ width: `${(brandDiscoveryStep / 3) * 100}%` }}
                            ></div>
                          </div>
                          <span className={styles.subProgressText}>
                            Step {brandDiscoveryStep} of 3
                          </span>
                        </div>
                      )}
                      
                      {/* Show sub-progress for Messaging step */}
                      {item.step === 2 && parentBrandStep === 2 && showMessagingChildForm && (
                        <div className={styles.subProgress}>
                          <div className={styles.subProgressBar}>
                            <div 
                              className={styles.subProgressFill}
                              style={{ width: `${(messagingStep / 2) * 100}%` }}
                            ></div>
                          </div>
                          <span className={styles.subProgressText}>
                            {messagingStep === 1 ? 'Target Audience' : 'Core Message'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modern Form Content */}
        <div className={styles.modernBrandContent}>
          {parentBrandStep === 1 && (
            <div className={styles.modernDiscoveryStep}>
              <div className={styles.stepIntro}>
                <h3>Let's discover your brand</h3>
                <p>Tell us about your brand fundamentals to create a personalized strategy</p>
              </div>
              
                {!showDiscoveryChildForm ? (
                <div className={styles.discoveryStartCard}>
                  <div className={styles.startCardContent}>
                    <div className={styles.startCardIcon}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4>Ready to build your brand?</h4>
                    <p>Our AI-powered questionnaire will help you define your brand's core identity, values, and messaging strategy.</p>
                    <div className={styles.startCardFeatures}>
                      <div className={styles.featureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>AI-powered insights</span>
                      </div>
                      <div className={styles.featureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>Personalized recommendations</span>
                      </div>
                      <div className={styles.featureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>5-minute setup</span>
                      </div>
                    </div>
                  </div>
                    <button 
                    className={styles.modernStartButton}
                      onClick={() => setShowDiscoveryChildForm(true)}
                    >
                    <span>Start Discovery Questionnaire</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    </button>
                  </div>
                ) : (
                <div className={styles.modernFormContainer}>
                  {/* Discovery Sub-steps */}
                  <div className={styles.subStepIndicator}>
                    {[
                      { step: 1, title: "Discovery", icon: "📝" },
                      { step: 2, title: "Brand Voice", icon: "🎯" },
                      { step: 3, title: "Compliance", icon: "📋" }
                    ].map((item) => (
                      <div 
                        key={item.step}
                        className={`${styles.subStep} ${
                          brandDiscoveryStep >= item.step ? styles.subStepActive : ''
                        }`}
                      >
                        <div className={styles.subStepIcon}>{item.icon}</div>
                        <span className={styles.subStepTitle}>{item.title}</span>
                      </div>
                    ))}
                    </div>

                  {/* Form Fields */}
                  <div className={styles.modernFormFields}>
                      {brandDiscoveryStep === 1 && (
                      <div className={styles.modernDiscoveryForm}>
                        <div className={styles.formGroup}>
                          <div className={styles.modernFormField}>
                            <label className={styles.modernLabel}>
                              <span className={styles.labelText}>What's the name of this brand?</span>
                              <span className={styles.labelRequired}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                            <input
                              type="text"
                              value={brandFormData.brandName}
                              onChange={(e) => handleBrandFormChange('brandName', e.target.value)}
                              placeholder="Enter your brand name"
                                className={styles.modernInput}
                            />
                              <div className={styles.inputIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                          </div>
                            </div>
                          </div>

                          <div className={styles.modernFormField}>
                            <label className={styles.modernLabel}>
                              <span className={styles.labelText}>What industry is the brand in?</span>
                              <span className={styles.labelRequired}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                            <input
                              type="text"
                              value={brandFormData.industry}
                              onChange={(e) => handleBrandFormChange('industry', e.target.value)}
                              placeholder="e.g., Technology, Healthcare, Fashion"
                                className={styles.modernInput}
                            />
                              <div className={styles.inputIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                          </div>
                            </div>
                          </div>

                          <div className={styles.modernFormField}>
                            <label className={styles.modernLabel}>
                              <span className={styles.labelText}>Describe what this brand is and what it does</span>
                              <span className={styles.labelRequired}>*</span>
                            </label>
                            <div className={styles.textareaWrapper}>
                            <textarea
                              value={brandFormData.shortDescription}
                              onChange={(e) => handleBrandFormChange('shortDescription', e.target.value)}
                                placeholder="Describe what your brand does and its unique value proposition..."
                              rows={4}
                                className={styles.modernTextarea}
                            />
                              <div className={styles.textareaCounter}>
                                {brandFormData.shortDescription.length}/500
                          </div>
                            </div>
                          </div>

                          <div className={styles.modernFormField}>
                            <label className={styles.modernLabel}>
                              <span className={styles.labelText}>Brand website (optional)</span>
                            </label>
                            <div className={styles.inputWrapper}>
                            <input
                              type="url"
                              value={brandFormData.websiteLink}
                              onChange={(e) => handleBrandFormChange('websiteLink', e.target.value)}
                              placeholder="https://yourwebsite.com"
                                className={styles.modernInput}
                              />
                              <div className={styles.inputIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      )}

                      {brandDiscoveryStep === 2 && (
                        <div className={styles.brandToneChatContainer}>
                          <div className={styles.brandToneChatHeader}>
                            <h3>Tone of Voice Discovery</h3>
                            <p>I'll help you identify {brandFormData.brandName}'s tone of voice by asking a series of questions to understand your brand's personality.</p>
                          </div>
                          
                                                    {(toneOfVoiceResult || (selectedArchetypes && selectedArchetypes.length > 0)) ? (
                            <div className={styles.brandToneResults}>
                              <div className={styles.brandToneResultsHeader}>
                                <div className={styles.brandToneBackButton} onClick={() => {
                                    setToneOfVoiceResult(null);
                                    setSelectedArchetypes([]);
                                }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                  </svg>
                                  <span>Back to Chat</span>
                              </div>
                                <div className={styles.brandToneSuccessIndicator}>
                                  <div className={styles.brandToneSuccessIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                  </div>
                                  <div className={styles.brandToneSuccessText}>
                                    <h4>Tone of Voice Generated!</h4>
                                    <p>Your brand's personality and communication style has been defined</p>
                                  </div>
                                </div>
                                </div>
                                
                              <div className={styles.brandToneDocument}>
                                {selectedArchetypes && selectedArchetypes.length > 0 && (
                                  <div className={styles.brandToneDocumentSection}>
                                    <div className={styles.brandToneSectionHeader}>
                                      <div className={styles.brandToneSectionIcon}>🎯</div>
                                      <h4>Brand Archetypes</h4>
                                    </div>
                                    <div className={styles.brandToneArchetypeGrid}>
                                      {selectedArchetypes.map((archetype, index) => (
                                        <div key={index} className={styles.brandToneArchetypeTag} title={ARCHETYPE_DESCRIPTIONS[archetype] || ''}>
                                          <span>{archetype}</span>
                                        </div>
                                      ))}
                                  </div>
                                         
                                  </div>
                                )}
                                  
                                  {toneOfVoiceResult && (
                                    <>
                                    <div className={styles.brandToneDocumentSection}>
                                      <div className={styles.brandToneSectionHeader}>
                                        <div className={styles.brandToneSectionIcon}>💬</div>
                                        <h4>Communication Style</h4>
                                        </div>
                                      <div className={styles.brandToneSectionContent}>
                                          {typeof toneOfVoiceResult.communicationStyle === 'string' ? toneOfVoiceResult.communicationStyle : JSON.stringify(toneOfVoiceResult.communicationStyle)}
                                        </div>
                                      </div>
                                    </>
                                  )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={styles.brandToneChatMessages} ref={toneChatContainerRef}>
                                {(() => {
                                  let questionCounter = 0;
                                  return toneChatMessages.map((message, index) => {
                                    const isQuestion = message.type === 'bot' && Array.isArray(message.suggestions) && message.suggestions.length > 0;
                                    const badgeNumber = isQuestion ? ++questionCounter : null;
                                    return (
                                      <div key={index} className={`${styles.brandToneChatMessage} ${message.type === 'user' ? styles.brandToneUserMessage : styles.brandToneBotMessage}`}>
                                        <div className={styles.brandToneMessageContent}>
                                          {isQuestion && (
                                            <span className={styles.brandToneQuestionBadge}>{badgeNumber}</span>
                                          )}
                                          <span>{message.content}</span>
                                        </div>
                                        {/* Show suggestions for bot messages if available */}
                                        {isQuestion && (
                                          <div className={styles.brandToneMessageSuggestions}>
                                            <div className={styles.brandToneSuggestionsLabel}>
                                              Suggested answers:
                                            </div>
                                            {message.suggestions.map((suggestion, suggestionIndex) => (
                                              <button
                                                key={suggestionIndex}
                                                className={styles.brandToneSuggestionChip}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                title="Click to use this suggestion"
                                              >
                                                {suggestion}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Show compliance rules if available */}
                                        {message.type === 'bot' && message.showCompliance && message.compliance && (
                                          <div className={styles.brandToneMessageCompliance}>
                                            {renderComplianceRules(message.compliance)}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  });
                                })()}
                                {isToneChatLoading && (
                                  <div className={`${styles.brandToneChatMessage} ${styles.brandToneBotMessage}`}>
                                    <div className={styles.brandToneMessageContent}>
                                      <div className={styles.brandToneTypingIndicator}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className={styles.brandToneChatInput}>
                                <textarea
                                  value={toneChatInput}
                                  onChange={(e) => setToneChatInput(e.target.value)}
                                  placeholder="Type your answer here..."
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleToneChatSend();
                                    }
                                  }}
                                />
                                <button 
                                  onClick={handleToneChatSend}
                                  disabled={!toneChatInput.trim() || isToneChatLoading}
                                  className={styles.brandToneSendButton}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {brandDiscoveryStep === 3 && (
                        <div className={styles.complianceMicroFlow}>
                          <div className={styles.complianceHeader}>
                            <h3>📋 Brand Compliance</h3>
                            <p>Set rules for what should or shouldn't be said in your messaging and copy.</p>
                          </div>
                          
                          {/* AI Preset Options */}
                          <div className={styles.complianceSection}>
                            <h4>🚀 Quick Preset Options</h4>
                            <p>Select from AI-generated presets to get started:</p>
                            <div className={styles.presetOptions}>
                              {aiGeneratedCompliance ? (
                                aiGeneratedCompliance.map((preset, index) => {
                                  const isChecked = selectedPresets.some(p => p === preset);
                                  console.log(`Preset ${index} checked:`, isChecked, preset);
                                  return (
                                    <div key={index} className={styles.presetOption}>
                                      <input
                                        type="checkbox"
                                        id={`preset-${index}`}
                                        checked={isChecked}
                                        onChange={(e) => handlePresetToggle(index, e.target.checked)}
                                      />
                                      <label htmlFor={`preset-${index}`}>
                                        <span className={styles.presetType}>{preset.type.toUpperCase()}</span>
                                        <span className={styles.presetRule}>{preset.rule}</span>
                                        <span className={styles.presetEnforce}>{preset.enforce}</span>
                                      </label>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className={styles.complianceLoading}>
                                  <div className={styles.complianceLoadingSpinner}>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                  </div>
                                  <p>Generating preset options...</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Custom Forbidden Words/Phrases */}
                          <div className={styles.complianceSection}>
                            <h4>🚫 Custom Forbidden Words/Phrases</h4>
                            <p>Add words or phrases your brand should never use:</p>
                            <div className={styles.customInputContainer}>
                            <textarea
                                value={customForbiddenWords}
                                onChange={(e) => setCustomForbiddenWords(e.target.value)}
                                placeholder="Enter forbidden words or phrases, separated by commas..."
                                rows={3}
                                className={styles.customTextarea}
                              />
                              <button 
                                onClick={addForbiddenWords}
                                className={styles.addButton}
                                disabled={!customForbiddenWords.trim()}
                              >
                                Add to List
                              </button>
                          </div>
                            {forbiddenWordsList.length > 0 && (
                              <div className={styles.forbiddenWordsList}>
                                {forbiddenWordsList.map((word, index) => (
                                  <span key={index} className={styles.forbiddenWordTag}>
                                    {word}
                                    <button onClick={() => removeForbiddenWord(index)} className={styles.removeTag}>
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Required Disclaimers */}
                          <div className={styles.complianceSection}>
                            <h4>⚠️ Required Disclaimers</h4>
                            <p>Add legal disclaimers that must be included in certain content:</p>
                            <div className={styles.customInputContainer}>
                              <textarea
                                value={customDisclaimers}
                                onChange={(e) => setCustomDisclaimers(e.target.value)}
                                placeholder="Enter required disclaimers..."
                                rows={3}
                                className={styles.customTextarea}
                              />
                              <button 
                                onClick={addDisclaimers}
                                className={styles.addButton}
                                disabled={!customDisclaimers.trim()}
                              >
                                Add Disclaimer
                              </button>
                            </div>
                            {disclaimersList.length > 0 && (
                              <div className={styles.disclaimersList}>
                                {disclaimersList.map((disclaimer, index) => (
                                  <div key={index} className={styles.disclaimerItem}>
                                    <span>{disclaimer}</span>
                                    <button onClick={() => removeDisclaimer(index)} className={styles.removeTag}>
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* File Upload */}
                          <div className={styles.complianceSection}>
                            <h4>📄 Legal/Compliance Guidelines</h4>
                            <p>Upload existing legal or compliance documents (optional):</p>
                            <div className={styles.fileUpload}>
                              <input
                                type="file"
                                id="compliance-file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileUpload}
                                className={styles.fileInput}
                              />
                              <label htmlFor="compliance-file" className={styles.fileUploadLabel}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </svg>
                                Choose File
                              </label>
                              {uploadedFile && (
                                <div className={styles.uploadedFile}>
                                  <span>{uploadedFile.name}</span>
                                  <button onClick={removeUploadedFile} className={styles.removeTag}>×</button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Preview Do's/Don'ts */}
                          <div className={styles.complianceSection}>
                            <h4>📋 Content Do's & Don'ts Preview</h4>
                            <div className={styles.dosDontsPreview}>
                              <div className={styles.dosSection}>
                                <h5>✅ DO</h5>
                                <ul>
                                  {selectedPresets.filter(p => p.type === 'style' || p.type === 'required').map((preset, index) => (
                                    <li key={index}>{preset.rule}</li>
                                  ))}
                                  {disclaimersList.map((disclaimer, index) => (
                                    <li key={`disclaimer-${index}`}>Include: {disclaimer}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className={styles.dontsSection}>
                                <h5>❌ DON'T</h5>
                                <ul>
                                  {selectedPresets.filter(p => p.type === 'forbidden').map((preset, index) => (
                                    <li key={index}>{preset.rule}</li>
                                  ))}
                                  {forbiddenWordsList.map((word, index) => (
                                    <li key={`forbidden-${index}`}>Use: {word}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Enforcement Toggle */}
                          <div className={styles.complianceSection}>
                            <div className={styles.enforcementToggle}>
                              <div className={styles.toggleInfo}>
                                <h4>🤖 AI Content Enforcement</h4>
                                <p>Apply these rules to future AI-generated content</p>
                              </div>
                              <label className={styles.toggleSwitch}>
                                <input
                                  type="checkbox"
                                  checked={enforceCompliance}
                                  onChange={(e) => setEnforceCompliance(e.target.checked)}
                                />
                                <span className={styles.toggleSlider}></span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                  {/* Modern Navigation */}
                  <div className={styles.modernNavigation}>
                        <button
                      className={`${styles.modernNavButton} ${styles.modernBackButton}`}
                          onClick={handleBrandPreviousStep}
                          disabled={brandDiscoveryStep === 1}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>
                      <span>Back</span>
                        </button>
                    
                    <div className={styles.navProgress}>
                      <span className={styles.navStepIndicator}>
                        Step {brandDiscoveryStep} of 3
                      </span>
                    </div>
                    
                        <button
                      className={`${styles.modernNavButton} ${styles.modernNextButton}`}
                          onClick={() => {
                            if (brandDiscoveryStep === 3) {
                              // Complete child form and move to parent step 2
                              setParentBrandStep(2);
                              setShowDiscoveryChildForm(false);
                            } else {
                              handleBrandNextStep();
                            }
                          }}
                          disabled={
                            (brandDiscoveryStep === 1 && (!brandFormData.brandName || !brandFormData.industry || !brandFormData.shortDescription)) ||
                            (brandDiscoveryStep === 2 && !toneOfVoiceResult)
                          }
                        >
                      <span>{brandDiscoveryStep === 3 ? 'Complete Discovery' : 'Continue'}</span>
                          {brandDiscoveryStep !== 3 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {parentBrandStep === 2 && (
            <div className={styles.messagingStep}>
              <div className={styles.stepIntro}>
                <h3>Messaging Strategy</h3>
                <p>Define your target audience and craft your core message</p>
              </div>
              
              {!showMessagingChildForm ? (
                <div className={styles.discoveryStartCard}>
                  <div className={styles.startCardContent}>
                    <div className={styles.startCardIcon}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4>Ready to define your messaging?</h4>
                    <p>Let's create a comprehensive messaging strategy with target audience analysis and core message development.</p>
                    <div className={styles.startCardFeatures}>
                      <div className={styles.featureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>Target audience analysis</span>
                      </div>
                      <div className={styles.featureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>Core message development</span>
                      </div>
                      <div className={styles.featureItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <span>Strategic messaging framework</span>
                      </div>
                    </div>
                    <button
                      className={styles.modernStartButton}
                      onClick={() => {
                        setShowMessagingChildForm(true);
                        setMessagingStep(1);
                      }}
                    >
                      <span>Start Messaging Strategy</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.modernFormContainer}>
                  {/* Messaging Sub-steps */}
                  <div className={styles.subStepIndicator}>
                    {[
                      { step: 1, title: "Target Audience", icon: "👥" },
                      { step: 2, title: "Core Message", icon: "💬" }
                    ].map((item) => (
                      <div 
                        key={item.step}
                        className={`${styles.subStep} ${
                          messagingStep >= item.step ? styles.subStepActive : ''
                        }`}
                      >
                        <div className={styles.subStepIcon}>{item.icon}</div>
                        <span className={styles.subStepTitle}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Form Fields */}
                  <div className={styles.modernFormFields}>
                    {messagingStep === 1 && (
                      <div className={styles.modernTargetAudienceForm}>
                        <div className={styles.formGroup}>
                          {/* AI Generation Button */}
                          <div className={styles.modernFormField}>
                            <button
                              type="button"
                              className={styles.modernGenerateButton}
                              onClick={generateTargetAudience}
                              disabled={isGeneratingAI}
                            >
                              {isGeneratingAI ? (
                                <>
                                  <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                                  </svg>
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                    <line x1="12" y1="19" x2="12" y2="23"/>
                                    <line x1="8" y1="23" x2="16" y2="23"/>
                                  </svg>
                                  <span>Generate AI Suggestions</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                                                     {/* Display Generated Categories */}
                           {targetAudienceCategories.length > 0 && (
                             <div className={styles.modernFormField}>
                               <label className={styles.modernLabel}>
                                 <span className={styles.labelText}>AI Suggested Categories</span>
                               </label>
                               <div className={styles.suggestedCategories}>
                                 {targetAudienceCategories.map((category, index) => (
                                   <div key={index} className={styles.categoryChip}>
                                     <span>{category}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                           
                           {/* Add New Audience Input */}
                           <div className={styles.modernFormField}>
                             <label className={styles.modernLabel}>
                               <span className={styles.labelText}>Add New Audience</span>
                               <span className={styles.labelDescription}>Add custom audience types to your list</span>
                             </label>
                             <div className={styles.enhancedInputContainer}>
                               <div className={styles.inputWrapper}>
                                 <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                   <circle cx="8.5" cy="7" r="4" />
                                   <line x1="20" y1="8" x2="20" y2="14" />
                                   <line x1="23" y1="11" x2="17" y2="11" />
                                 </svg>
                                 <input
                                   type="text"
                                   placeholder="e.g., 'tech-savvy millennials', 'enterprise decision makers'"
                                   value={newAudienceInput}
                                   onChange={(e) => setNewAudienceInput(e.target.value)}
                                   className={styles.enhancedInput}
                                   onKeyPress={(e) => {
                                     if (e.key === 'Enter') {
                                       handleAddNewAudience();
                                     }
                                   }}
                                 />
                               </div>
                               <button
                                 type="button"
                                 className={styles.enhancedAddButton}
                                 onClick={handleAddNewAudience}
                                 disabled={!newAudienceInput.trim()}
                               >
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <line x1="12" y1="5" x2="12" y2="19" />
                                   <line x1="5" y1="12" x2="19" y2="12" />
                                 </svg>
                                 <span>Add Audience</span>
                               </button>
                             </div>
                           </div>
                           
                           {/* Display All Audiences (AI + Custom) */}
                           {(targetAudienceCategories.length > 0 || customAudiences.length > 0) && (
                             <div className={styles.modernFormField}>
                               <label className={styles.modernLabel}>
                                 <span className={styles.labelText}>All Audiences</span>
                                 <span className={styles.labelDescription}>
                                   {targetAudienceCategories.length + customAudiences.length} audience types
                                 </span>
                               </label>
                               <div className={styles.enhancedAudiencesGrid}>
                                 {targetAudienceCategories.map((audience, index) => (
                                   <div key={`ai-${index}`} className={styles.enhancedAudienceCard}>
                                     <div className={styles.audienceContent}>
                                       <svg className={styles.audienceIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                         <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                         <circle cx="9" cy="7" r="4" />
                                       </svg>
                                       <span className={styles.audienceText}>{audience}</span>
                                     </div>
                                     <div className={styles.audienceBadge}>
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                         <path d="M9 12l2 2 4-4" />
                                         <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" />
                                       </svg>
                                       <span>AI</span>
                                     </div>
                                   </div>
                                 ))}
                                 {customAudiences.map((audience, index) => (
                                   <div key={`custom-${index}`} className={styles.enhancedAudienceCard}>
                                     <div className={styles.audienceContent}>
                                       <svg className={styles.audienceIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                         <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                         <circle cx="8.5" cy="7" r="4" />
                                         <line x1="20" y1="8" x2="20" y2="14" />
                                         <line x1="23" y1="11" x2="17" y2="11" />
                                       </svg>
                                       <span className={styles.audienceText}>{audience}</span>
                                     </div>
                                     <button
                                       type="button"
                                       className={styles.enhancedRemoveButton}
                                       onClick={() => removeCustomAudience(index)}
                                       title="Remove audience"
                                     >
                                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                         <line x1="18" y1="6" x2="6" y2="18"></line>
                                         <line x1="6" y1="6" x2="18" y2="18"></line>
                                       </svg>
                                     </button>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    )}

                    {messagingStep === 2 && (
                      <div className={styles.modernCoreMessageForm}>
                        <div className={styles.formGroup}>
                          {/* Generate Core Message */}
                          {!brandCoreMessage && (
                          <div className={styles.modernFormField}>
                              <button
                                type="button"
                                className={styles.modernGenerateButton}
                                onClick={async () => {
                                  try {
                                    setIsBrandCoreLoading(true);
                                    const token = localStorage.getItem('token');
                                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
                                    const body = {
                                      brandData: {
                                        brandName: brandFormData.brandName,
                                        industry: brandFormData.industry,
                                        shortDescription: brandFormData.shortDescription
                                      },
                                      toneOfVoice: toneOfVoiceResult || {},
                                      targetAudience: targetAudienceCategories || [],
                                      positioningStatement: '',
                                      extraInputs: {}
                                    };
                                    const resp = await fetch(`${baseUrl}/api/brands/core-message/generate`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify(body)
                                    });
                                    const data = await resp.json();
                                    if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to generate');
                                    setBrandCoreMessage(data.data.coreMessage || '');
                                    setBrandCoreSuggestions(Array.isArray(data.data.suggestions) ? data.data.suggestions : []);
                                    setBrandCoreIntro(data.data.intro || '');
                                  } catch (e) {
                                    console.error('Core message generate error:', e);
                                  } finally {
                                    setIsBrandCoreLoading(false);
                                  }
                                }}
                                disabled={isBrandCoreLoading || !brandFormData.brandName || !brandFormData.industry || !brandFormData.shortDescription}
                              >
                                {isBrandCoreLoading ? 'Generating…' : 'Generate Core Message'}
                              </button>
                            </div>
                          )}

                          {/* Show Intro and current Core Message */}
                          {brandCoreMessage && (
                          <div className={styles.modernFormField}>
                              {brandCoreIntro && (
                                <p className={styles.labelDescription}>{brandCoreIntro}</p>
                              )}
                            <div className={styles.textareaWrapper}>
                              <textarea
                                  value={brandCoreMessage}
                                  onChange={(e) => setBrandCoreMessage(e.target.value)}
                                rows={3}
                                className={styles.modernTextarea}
                              />
                            </div>
                          </div>
                          )}

                          {/* Suggestions */}
                          {brandCoreSuggestions && brandCoreSuggestions.length > 0 && (
                          <div className={styles.modernFormField}>
                            <label className={styles.modernLabel}>
                                <span className={styles.labelText}>Suggestions</span>
                            </label>
                              <div className={styles.suggestedCategories}>
                                {brandCoreSuggestions.map((s, i) => (
                                  <button key={i} className={styles.categoryChip} onClick={() => setBrandCoreMessage(s)}>
                                    {s}
                                  </button>
                                ))}
                            </div>
                          </div>
                          )}

                          {/* One-by-one refinement Q&A */}
                          {brandCoreMessage && (
                          <div className={styles.modernFormField}>
                              {!brandCoreQuestion ? (
                                <button
                                  type="button"
                                  className={styles.modernGenerateButton}
                                  onClick={async () => {
                                    try {
                                      setIsBrandCoreLoading(true);
                                      const token = localStorage.getItem('token');
                                      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
                                      const body = {
                                        brandData: { brandName: brandFormData.brandName },
                                        currentMessage: brandCoreMessage,
                                        previousQA: brandCoreQA
                                      };
                                      const resp = await fetch(`${baseUrl}/api/brands/core-message/question`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify(body)
                                      });
                                      const data = await resp.json();
                                      if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to get question');
                                      setBrandCoreQuestion(data.data.question || '');
                                    } catch (e) {
                                      console.error('Get question error:', e);
                                    } finally {
                                      setIsBrandCoreLoading(false);
                                    }
                                  }}
                                >
                                  {isBrandCoreLoading ? 'Thinking…' : 'Ask a refining question'}
                                </button>
                              ) : (
                                <div>
                                  <div className={styles.labelText}>{brandCoreQuestion}</div>
                            <div className={styles.textareaWrapper}>
                              <textarea
                                      value={brandCoreAnswer}
                                      onChange={(e) => setBrandCoreAnswer(e.target.value)}
                                      placeholder="Type your answer…"
                                rows={3}
                                className={styles.modernTextarea}
                              />
                            </div>
                                  <div className={styles.startCardFeatures}>
                                    <button
                                      type="button"
                                      className={styles.modernBackButton}
                                      onClick={() => { setBrandCoreQuestion(''); setBrandCoreAnswer(''); }}
                                    >
                                      Skip
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.modernNextButton}
                                      disabled={!brandCoreAnswer.trim()}
                                      onClick={async () => {
                                        const nextQA = [...brandCoreQA, { question: brandCoreQuestion, answer: brandCoreAnswer.trim() }];
                                        setBrandCoreQA(nextQA);
                                        setBrandCoreQuestion('');
                                        setBrandCoreAnswer('');
                                        try {
                                          setIsBrandCoreLoading(true);
                                          const token = localStorage.getItem('token');
                                          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
                                          const body = {
                                            brandData: { brandName: brandFormData.brandName },
                                            currentMessage: brandCoreMessage,
                                            userAnswers: nextQA
                                          };
                                          const resp = await fetch(`${baseUrl}/api/brands/core-message/update-with-answers`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify(body)
                                          });
                                          const data = await resp.json();
                                          if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to refine');
                                          setBrandCoreMessage(data.data.coreMessage || brandCoreMessage);
                                        } catch (e) {
                                          console.error('Refine error:', e);
                                        } finally {
                                          setIsBrandCoreLoading(false);
                                        }
                                      }}
                                    >
                                      Submit answer & refine
                                    </button>
                          </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modern Navigation */}
                  <div className={styles.modernNavigation}>
                    <button
                      className={`${styles.modernNavButton} ${styles.modernBackButton}`}
                      onClick={() => {
                        if (messagingStep === 1) {
                          setShowMessagingChildForm(false);
                        } else {
                          setMessagingStep(prev => prev - 1);
                        }
                      }}
                      disabled={messagingStep === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      <span>Back</span>
                    </button>
                    
                    <div className={styles.navProgress}>
                      <span className={styles.navStepIndicator}>
                        Step {messagingStep} of 2
                      </span>
                    </div>
                    
                    <button
                      className={`${styles.modernNavButton} ${styles.modernNextButton}`}
                      onClick={() => {
                        if (messagingStep === 2) {
                          // Complete messaging and move to parent step 3
                          setParentBrandStep(3);
                          setShowMessagingChildForm(false);
                        } else {
                          setMessagingStep(prev => prev + 1);
                        }
                      }}
                    >
                      <span>{messagingStep === 2 ? 'Complete Messaging' : 'Continue'}</span>
                      {messagingStep !== 2 && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {parentBrandStep === 3 && (
            <div className={styles.copyStep}>
              <h4>Copy</h4>
              <p>This step will contain copy-related content.</p>
              <div className={styles.copyContent}>
                <p>Copy step content will be implemented here.</p>
              </div>
            </div>
          )}

          {/* Final Navigation */}
          {parentBrandStep > 1 && (
            <div className={styles.finalNavigation}>
            <button
                className={`${styles.modernNavButton} ${styles.modernBackButton}`}
              onClick={() => setParentBrandStep(prev => Math.max(1, prev - 1))}
              disabled={parentBrandStep === 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Previous</span>
            </button>
              
            <button
                className={`${styles.modernNavButton} ${styles.modernCompleteButton}`}
              onClick={() => {
                if (parentBrandStep === 3) {
                  // Handle final submission
                  console.log('Brand creation completed');
                } else {
                  setParentBrandStep(prev => prev + 1);
                }
              }}
            >
                <span>{parentBrandStep === 3 ? 'Create Brand' : 'Continue'}</span>
                {parentBrandStep === 3 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          )}
        </div>
      </div>
    );
  };

  const renderFolderContent = (folder) => {
    return (
      <div className={styles.folderContent}>
        <button
          className={styles.createBriefButton}
          onClick={() => {
            setSelectedFolder(folder);
            setIsBriefFormOpen(true);
          }}
        >
          Create Brief
          <div className={styles.createBriefButtonIcon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </button>
      </div>
    );
  };

  const renderFolderSection = () => {
    return (
      <div className={styles.folderSection}>
        <div className={styles.folderList}>
          {Object.entries(folderStructure).map(([key, folder]) => (
            <div key={key} className={styles.folderItem}>
              <div
                className={styles.folderHeader}
                onClick={() => toggleFolder(key)}
              >
                <div className={styles.folderIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <span>{folder.name}</span>
                <svg
                  className={`${styles.arrowIcon} ${
                    expandedFolders[key] ? styles.expanded : ""
                  }`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {expandedFolders[key] && renderFolderContent(folder)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjectsSection = () => {
    return (
      <div className={styles.projectsSection}>
        <div className={styles.projectsHeader}>
          <h2>Your Library</h2>
          <div className={styles.headerButtons}>
            <button 
              className={styles.createBrandButton}
              onClick={handleCreateBrand}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Create Brand
            </button>
            <button 
              className={styles.createProjectButton}
              onClick={() => {
                // Clear any existing project context
                localStorage.removeItem('currentProjectId');
                
                // Clear form fields to trigger loading state (same as Get Started)
                setFormFields(null);
                setMarketingFormAnswers({});
                              setCoreMessage('');
                
                // Clear the newly created library name
                setNewlyCreatedLibraryName('');
                
                
                
                // Show the step form directly (same as Get Started)
                setShowStepForm(true);
                setCurrentStep(1);
                setShowProjects(false);
                setShowWelcome(false);
                setShowSaveAndContinue(false);
                
                console.log('Create New Project clicked - opening discovery questionnaire with loading state');
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create New Library
            </button>
          </div>
        </div>
        
        <div className={styles.projectsGrid}>
          {projects && projects.length > 0 && (
            projects.map((project) => (
              <div key={project.id} className={styles.projectCard}>
                <div className={styles.projectCardHeader}>
                  <div className={styles.projectIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <div className={styles.projectInfo}>
                    <h3 className={styles.projectName}>{project.name}</h3>
                  
                  </div>
                </div>
                <div className={styles.projectActions}>
                  <button 
                    className={styles.projectActionButton}
                    onClick={async () => {
                      try {
                        // Set project context
                        localStorage.setItem('currentProjectId', project.id);
                        
                        const token = localStorage.getItem('token');
                        if (token) {
                          console.log('=== OPEN PROJECT CLICKED ===');
                          console.log('Project ID:', project.id);
                          console.log('Fetching saved onboarding data for project...');
                          
                          // Fetch the saved onboarding data for this specific project
                          // Only include projectId if it's a valid value (not null, undefined, or empty string)
                          const url = project.id && project.id !== 'null' && project.id !== 'undefined' && project.id.toString().trim() !== ''
                            ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${project.id}`
                            : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

                          const response = await fetch(url, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });

                          console.log('Response status:', response.status);
                          console.log('Response ok:', response.ok);

                          if (response.ok) {
                            const result = await response.json();
                            console.log('Fetched onboarding data:', result);
                            console.log('Project ID being fetched:', project.id);
                            console.log('Full response data:', JSON.stringify(result, null, 2));

                            if (result.data && result.data.data) {
                              try {
                                // Parse the saved data
                                const savedData = JSON.parse(result.data.data);
                                console.log('Parsed saved data:', savedData);

                                // Check if we have the expected format
                                if (savedData.formFields && savedData.formAnswers) {
                                  console.log('Setting form fields with saved data...');
                                  
                                  // Set the form fields and answers
                                  setFormFields({
                                    fields: savedData.formFields,
                                    welcomeMessage: savedData.welcomeMessage || '',
                                    footerMessage: savedData.footerMessage || ''
                                  });
                                  
                                  // Set the marketing form answers
                                  setMarketingFormAnswers(savedData.formAnswers);
                                  
                                  console.log('Form populated with saved data');
                                  console.log('Form fields count:', savedData.formFields.length);
                                  console.log('Form answers:', savedData.formAnswers);
                                  console.log('Current formFields state will be:', {
                                    fields: savedData.formFields,
                                    welcomeMessage: savedData.welcomeMessage || '',
                                    footerMessage: savedData.footerMessage || ''
                                  });
                                } else {
                                  console.log('Saved data format not as expected, using default form');
                                  console.log('Expected formFields and formAnswers, got:', Object.keys(savedData));
                                  // If data format is not as expected, use default form
                                  await fetchFormFields();
                                }

                                // Store the project-specific core message if it exists
                                if (result.data.core_message) {
                                  console.log('Found project-specific core message:', result.data.core_message);
                                  // Store in localStorage for later use
                                  const coreMessageData = {
                                    message: result.data.core_message,
                                    timestamp: Date.now(),
                                    context: 'project-specific-core-message',
                                    projectId: project.id
                                  };
                                  localStorage.setItem('projectCoreMessage', JSON.stringify(coreMessageData));
                                  // Also set in state for immediate use
                                  setCoreMessage(result.data.core_message);
                                } else {
                                  console.log('No project-specific core message found');
                                  // Clear any existing core message
                                  localStorage.removeItem('projectCoreMessage');
                                  setCoreMessage('');
                                }
                              } catch (parseError) {
                                console.error('Error parsing saved data:', parseError);
                                // If parsing fails, use default form
                                await fetchFormFields();
                              }
                            } else {
                              console.log('No saved data found, using default form');
                              console.log('Result data structure:', result);
                              // If no saved data, use default form
                              await fetchFormFields();
                            }
                          } else {
                            console.error('Failed to fetch onboarding data:', response.status);
                            const errorText = await response.text();
                            console.error('Error response:', errorText);
                            // If fetch fails, use default form
                            await fetchFormFields();
                          }
                        } else {
                          console.error('No authentication token found');
                          // If no token, use default form
                          await fetchFormFields();
                        }
                      } catch (error) {
                        console.error('Error in handleOpenProject:', error);
                        // If any error, use default form
                        await fetchFormFields();
                      }
                      
                      // Load the current step for this project
                      const savedStep = await loadCurrentStep(project.id);
                      console.log('Loaded saved step for project:', savedStep);
                      
                      // Load project-specific audiences if we're on step 3 or higher
                      if (savedStep >= 3) {
                        try {
                          const token = localStorage.getItem('token');
                          const audienceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/project/${project.id}/audiences`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });

                          if (audienceResponse.ok) {
                            const audienceData = await audienceResponse.json();
                            if (audienceData.data && audienceData.data.length > 0) {
                              // Format the existing audiences
                              const formattedAudiences = audienceData.data.map(audience => ({
                                ...audience,
                                name: getFirstTwoWords(audience.segment),
                                description: getDescription(audience.segment)
                              }));
                              
                              setAudiences(formattedAudiences);
                              // Set the brief ID from the first audience (they all have the same brief_id)
                              if (formattedAudiences.length > 0 && formattedAudiences[0].briefId) {
                                setCurrentBriefId(formattedAudiences[0].briefId);
                              }
                              console.log('Loaded project-specific audiences:', formattedAudiences);
                            }
                          }
                        } catch (error) {
                          console.error('Error loading project audiences:', error);
                        }
                      }
                      
                      // Clear chat messages to ensure project-specific chat
                      setMessages([]);
                      
                      // Set flag to indicate user came from Open Library
                      setCameFromOpenLibrary(true);
                      
                      // Hide projects and show step form
                      setShowProjects(false);
                      setShowWelcome(false);
                      setShowSaveAndContinue(false);
                      setShowStepForm(true);
                      setCurrentStep(savedStep); // Start from the saved step
                      
                      console.log('Step form should now be visible');
                      console.log('Current step set to:', savedStep);
                    }}
                  >
                    Open Library  
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderQASection = () => {
    return (
      <div className={styles.qaSection}>
        {isBriefFormOpen && selectedFolder && !audiences.length && (
          <div className={styles.briefForm}>
            <h2>Create Brief for {selectedFolder.name}</h2>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleBriefSubmit}>
              <div className={styles.formGroup}>
                <label>Purpose</label>
                <textarea
                  value={briefData.purpose}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      purpose: e.target.value,
                    }))
                  }
                  placeholder="What is the purpose of this brief?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Main Message</label>
                <textarea
                  value={briefData.main_message}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      main_message: e.target.value,
                    }))
                  }
                  placeholder="What is the main message you want to convey?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Special Features (Optional)</label>
                <textarea
                  value={briefData.special_features}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      special_features: e.target.value,
                    }))
                  }
                  placeholder="Any special features or unique aspects?"
                  className={styles.textarea}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Beneficiaries</label>
                <textarea
                  value={briefData.beneficiaries}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      beneficiaries: e.target.value,
                    }))
                  }
                  placeholder="Who will benefit from this?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Benefits</label>
                <textarea
                  value={briefData.benefits}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      benefits: e.target.value,
                    }))
                  }
                  placeholder="What are the key benefits?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Call to Action</label>
                <textarea
                  value={briefData.call_to_action}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      call_to_action: e.target.value,
                    }))
                  }
                  placeholder="What action do you want people to take?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Importance</label>
                <textarea
                  value={briefData.importance}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      importance: e.target.value,
                    }))
                  }
                  placeholder="Why is this important?"
                  className={styles.textarea}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Additional Information (Optional)</label>
                <textarea
                  value={briefData.additional_info}
                  onChange={(e) =>
                    setBriefData((prev) => ({
                      ...prev,
                      additional_info: e.target.value,
                    }))
                  }
                  placeholder="Any other relevant information?"
                  className={styles.textarea}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => {
                    setIsBriefFormOpen(false);
                    setBriefData({
                      purpose: "",
                      main_message: "",
                      special_features: "",
                      beneficiaries: "",
                      benefits: "",
                      call_to_action: "",
                      importance: "",
                      additional_info: "",
                    });
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? "Creating..." : "Create Brief"}
                </button>
              </div>
            </form>
          </div>
        )}

        {audiences.length === 0 && isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p className={styles.loadingMessage}>{loadingMessage}</p>
            </div>
          </div>
        )}

        {audiences.length > 0 && (
          <div className={styles.audienceSegments}>
            <div className={styles.audienceHeader}>
              <h3>Target Audience Segments</h3>
              <button
                onClick={() => {
                  setAudiences([]);
                  setIsBriefFormOpen(true);
                }}
                className={styles.newBriefButton}
              >
                Create New Brief
              </button>
            </div>
            <div className={styles.segmentsList}>
              {audiences.map((audience) => (
                <div key={audience.id} className={styles.segmentCard}>
                  <h4>{audience.name}</h4>
                  <p>{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleCloseEditPopup = () => {
        setIsEditPopupOpen(false);
  };

  // Function to clear project-specific data
  const clearProjectSpecificData = () => {
    localStorage.removeItem('projectCoreMessage');
    localStorage.removeItem('currentProjectId');
    setCoreMessage('');
    setShowTypewriter(false);
    // Clear chat messages to ensure project-specific chat
    setMessages([]);
    
    // Clear audience-related state to ensure project-specific audiences
    setAudiences([]);
    setCurrentBriefId(null);
    setAudienceData({
      audienceType: null,
      labelName: '',
      whoTheyAre: '',
      whatTheyWant: '',
      whatTheyStruggle: '',
      additionalInfo: ''
    });
    setAudienceError('');
    setCheckedAudiences({});
    setSavedAudiences({});
    
    // Reset the Open Library flag when clearing project data
    setCameFromOpenLibrary(false);
    
    // Clear the newly created library name
    setNewlyCreatedLibraryName('');
    
    fetchProjects()
  };

  const handleNextStep = async () => {
    const nextStep = currentStep + 1;
    
    if (nextStep <= totalSteps) {
      setCurrentStep(nextStep);
      // Save the current step to database
      saveCurrentStep(nextStep);
    }
    
    // If we're moving FROM step 1 TO step 2 (Discovery Questionnaire to Core Message)
    if (currentStep === 1 && nextStep === 2) {
      // Check if we have a project-specific core message stored
      const projectCoreMessage = localStorage.getItem('projectCoreMessage');
      if (projectCoreMessage) {
        try {
          const coreMessageData = JSON.parse(projectCoreMessage);
          console.log('Loading project-specific core message:', coreMessageData.message);
          setCoreMessage(coreMessageData.message);
          setShowTypewriter(true); // Show typewriter effect for the core message
        } catch (error) {
          console.error('Error parsing project core message:', error);
          // Core message will be loaded when needed (e.g., when opening edit popup)
        }
      } else {
        console.log('No project-specific core message found');
        // Core message will be loaded when needed (e.g., when opening edit popup)
      }
    }
    
    // If we're moving FROM step 2 TO step 3 (Core Message to Target Audience)
    if (currentStep === 2 && nextStep === 3) {
      // Initialize audience data for step 3
      setAudienceData({
        audienceType: null,
        labelName: '',
        whoTheyAre: '',
        whatTheyWant: '',
        whatTheyStruggle: '',
        additionalInfo: ''
      });
      setAudienceError('');
      
      // First, check if we have temporarily stored audiences from navigation
      const tempAudiences = localStorage.getItem('tempAudiences');
      const tempCurrentBriefId = localStorage.getItem('tempCurrentBriefId');
      
      if (tempAudiences && tempCurrentBriefId) {
        try {
          const parsedAudiences = JSON.parse(tempAudiences);
          setAudiences(parsedAudiences);
          setCurrentBriefId(tempCurrentBriefId);
          console.log('Restored audiences from navigation:', parsedAudiences);
          
          // Clear the temporary storage
          localStorage.removeItem('tempAudiences');
          localStorage.removeItem('tempCurrentBriefId');
          return; // Don't proceed with API calls since we have restored audiences
        } catch (error) {
          console.error('Error parsing temp audiences:', error);
          localStorage.removeItem('tempAudiences');
          localStorage.removeItem('tempCurrentBriefId');
        }
      }
      
      // Check if there are existing audiences for this project
      const currentProjectId = localStorage.getItem('currentProjectId');
      let foundExistingAudiences = false;
      
      if (currentProjectId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const { data } = await response.json();
            const currentProject = data.find(project => project.id === currentProjectId);
            
            if (currentProject && currentProject.briefs && currentProject.briefs.length > 0) {
              // Get the most recent brief
              const latestBrief = currentProject.briefs[currentProject.briefs.length - 1];
              
              // Fetch audiences for this brief
              const audienceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/brief/${latestBrief.id}/audience`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (audienceResponse.ok) {
                const audienceData = await audienceResponse.json();
                if (audienceData.data && audienceData.data.length > 0) {
                  // Format the existing audiences
                  const formattedAudiences = audienceData.data.map(audience => ({
                    ...audience,
                    name: getFirstTwoWords(audience.segment),
                    description: getDescription(audience.segment)
                  }));
                  
                  setAudiences(formattedAudiences);
                  setCurrentBriefId(latestBrief.id);
                  foundExistingAudiences = true;
                  console.log('Loaded existing audiences for project:', formattedAudiences);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking for existing audiences:', error);
        }
      }
      
      // Only clear audiences if we didn't find existing ones
      if (!foundExistingAudiences) {
        setAudiences([]);
        console.log('No existing audiences found, proceeding with generation');
      }
    }
    
    // If we're moving FROM step 3 TO step 4 (Target Audience to Complete)
    if (currentStep === 3 && nextStep === 4) {
      setShowStepForm(false);
      setShowProjects(true);
      // Clear project-specific data when returning to projects
      clearProjectSpecificData();
      // Clear any temporary audience storage
      localStorage.removeItem('tempAudiences');
      localStorage.removeItem('tempCurrentBriefId');
      // Reset the Open Library flag since we're moving away from step 3
      setCameFromOpenLibrary(false);
      // Fetch latest projects to ensure we have the most recent data
      fetchProjects();
    }
    
    // If we're on the last step, hide the step form and show projects
    if (nextStep > totalSteps) {
      setShowStepForm(false);
      setShowProjects(true);
    }
  };

  // Function to save current step to database
  const saveCurrentStep = async (step) => {
    try {
      const token = localStorage.getItem('token');
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!token || !currentProjectId) {
        console.log('No token or project ID, skipping step save');
        return;
      }

      console.log('Saving current step:', step, 'for project:', currentProjectId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/current-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: currentProjectId,
          currentStep: step
        })
      });

      if (response.ok) {
        console.log('Current step saved successfully:', step);
      } else {
        console.error('Failed to save current step');
      }
    } catch (error) {
      console.error('Error saving current step:', error);
    }
  };

  // Function to load current step from database
  const loadCurrentStep = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || !projectId) {
        console.log('No token or project ID, using default step 1');
        return 1;
      }

      console.log('Loading current step for project:', projectId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/current-step?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const step = data.data?.currentStep || 1;
        console.log('Loaded current step:', step);
        return step;
      } else {
        console.error('Failed to load current step, using default step 1');
        return 1;
      }
    } catch (error) {
      console.error('Error loading current step:', error);
      return 1;
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      const previousStep = currentStep - 1;
      
      // If we're going back from step 3, save the current audiences to localStorage
      if (currentStep === 3 && audiences && audiences.length > 0) {
        localStorage.setItem('tempAudiences', JSON.stringify(audiences));
        localStorage.setItem('tempCurrentBriefId', currentBriefId);
        console.log('Saved audiences to localStorage for navigation:', audiences);
      }
      
      // Reset the Open Library flag if moving away from step 3
      if (currentStep === 3) {
        setCameFromOpenLibrary(false);
      }
      
      setCurrentStep(previousStep);
      // Save the current step to database
      saveCurrentStep(previousStep);
    }
  };

  // Marketing form functions
  const startLoadingSequence = () => {
    let currentIndex = 0;
    setLoadingMessage(loadingMessages[currentIndex]);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[currentIndex]);
    }, 3000);

    return interval;
  };

  // Function to save form data without generating core message
  const saveFormData = async (formAnswers) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (!formFields) return;

      setIsAutoSaving(true);

      // Prepare form data with questions and answers
      const formDataWithQuestions = {
        formFields: formFields.fields,
        formAnswers: formAnswers,
        welcomeMessage: formFields.welcomeMessage,
        footerMessage: formFields.footerMessage
      };

      // Save to onboarding without core message
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: JSON.stringify(formDataWithQuestions),
          coreMessage: null // Don't generate core message yet
        })
      });

      console.log('Form data auto-saved successfully');
    } catch (error) {
      console.error('Error auto-saving form data:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleMarketingInputChange = async (e) => {
    const { name, value } = e.target;
    const updated = { ...marketingFormAnswers, [name]: value };
    setMarketingFormAnswers(updated);
    
    // Check if we're opening an existing project
    const currentProjectId = localStorage.getItem('currentProjectId');
    const isOpeningExistingProject = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined';
    
    if (isOpeningExistingProject) {
      // Auto-save form changes immediately for existing projects
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const formDataWithQuestions = {
            formFields: formFields.fields,
            formAnswers: updated,
            welcomeMessage: formFields.welcomeMessage,
            footerMessage: formFields.footerMessage
          };

          console.log('🔄 Auto-saving form changes for existing project:', {
            projectId: currentProjectId,
            formAnswers: updated
          });
          
          // Save updated form data to onboarding for the existing project
          const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              data: JSON.stringify(formDataWithQuestions),
              coreMessage: null, // Don't update core message yet
              projectId: currentProjectId
            })
          });

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            console.log('✅ Form changes auto-saved successfully for existing project:', saveResult.message);
          } else {
            const errorText = await saveResponse.text();
            console.error('❌ Failed to auto-save form changes:', errorText);
          }
        } catch (error) {
          console.error('❌ Error auto-saving form changes:', error);
        }
      }, 2000); // Save after 2 seconds of no typing
    } else {
      // Auto-save the form data as user types (debounced) for new projects
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(() => {
        saveFormData(updated);
      }, 2000); // Save after 2 seconds of no typing
    }
  };

  const handleMarketingSubmit = async (e) => {
    e.preventDefault();
    setIsMarketingFormLoading(true);
    setMarketingError(null);

    // Validate required fields
    const requiredFields = ['description', 'productSummary', 'coreAudience', 'outcome'];
    const missingFields = requiredFields.filter(field => !marketingFormAnswers[field]?.trim());

    if (missingFields.length > 0) {
      setMarketingError('Please fill in all required fields');
      setIsMarketingFormLoading(false);
      return;
    }

    const loadingInterval = startLoadingSequence();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Check if we're opening an existing project
      const currentProjectId = localStorage.getItem('currentProjectId');
      const isOpeningExistingProject = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined';

      console.log('Is opening existing project:', isOpeningExistingProject);
      console.log('Current project ID:', currentProjectId);

      if (isOpeningExistingProject) {
        // We're opening an existing project - don't create/update projects, just generate core message
        console.log('Opening existing project - skipping project creation/update');
        
        // Check if the project name (description) has changed and update it if needed
        const currentProjectName = projects?.find(p => p.id == currentProjectId)?.name;
        const newProjectName = marketingFormAnswers.description?.trim();
        
        if (currentProjectName && newProjectName && currentProjectName !== newProjectName) {
          console.log('Project name changed from:', currentProjectName, 'to:', newProjectName);
          
          // Update the project name in the database
          const updateProjectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project/${currentProjectId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              projectName: newProjectName
            })
          });
          
          if (updateProjectResponse.ok) {
            console.log('Project name updated successfully');
            // Refresh projects to get updated data
            await fetchProjects();
            // Restore step form state after fetching projects
            setShowStepForm(true);
            setShowProjects(false);
          } else {
            console.error('Failed to update project name');
          }
        }
        
        // Generate marketing content for existing project (form data is already auto-saved)
        console.log('🚀 Generating core message for existing project:', {
          projectId: currentProjectId,
          projectName: newProjectName || marketingFormAnswers.description
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...marketingFormAnswers,
            projectId: currentProjectId,
            projectName: newProjectName || marketingFormAnswers.description
          })
        });

        if (!response.ok) {
          clearInterval(loadingInterval);
          throw new Error('Failed to generate marketing content');
        }

        const data = await response.json();
        console.log('✅ Core message generated successfully:', data.data?.coreMessage?.substring(0, 100) + '...');
        clearInterval(loadingInterval);

        // Save the core message to onboarding for the existing project
        const formDataWithQuestions = {
          formFields: formFields.fields,
          formAnswers: marketingFormAnswers,
          welcomeMessage: formFields.welcomeMessage,
          footerMessage: formFields.footerMessage
        };

        console.log('💾 Saving core message to database for project:', currentProjectId);

        const coreMessageSaveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: JSON.stringify(formDataWithQuestions),
            coreMessage: data.data?.coreMessage,
            projectId: currentProjectId
          }),
        });

        if (coreMessageSaveResponse.ok) {
          console.log('✅ Core message saved successfully for existing project');
        } else {
          console.error('❌ Failed to save core message');
        }

        if (data.data?.coreMessage) {
          const storedData = {
            message: data.data.coreMessage,
            timestamp: Date.now(),
            context: 'core-message'
          };
          localStorage.setItem('marketingCoreMessage', JSON.stringify(storedData));
        }

        // Update local state and advance to next step
        setCoreMessage(data.data?.coreMessage || '');
        setShowTypewriter(true);
        setCurrentStep(2); // Move to step 2 (Core Message)
        setShowStepForm(true); // Ensure step form stays visible
        
        return; // Exit early - no project creation/update needed
      }

      // Original logic for new project creation (only runs when NOT opening existing project)
      // First, save the updated form data to database
      const formDataWithQuestions = {
        formFields: formFields.fields,
        formAnswers: marketingFormAnswers,
        welcomeMessage: formFields.welcomeMessage,
        footerMessage: formFields.footerMessage
      };

      // Log the data being sent to verify format
      console.log('Sending form data to onboarding API:', formDataWithQuestions);
      console.log('Form data JSON string:', JSON.stringify(formDataWithQuestions));

      // Save updated form data to onboarding
      const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: JSON.stringify(formDataWithQuestions),
          coreMessage: null, // Don't generate core message yet
          projectId: localStorage.getItem('currentProjectId') || null
        })
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('Failed to save form data:', errorText);
        throw new Error('Failed to save form data to database');
      }

      const saveResult = await saveResponse.json();
      console.log('Form data saved successfully:', saveResult);
      
      // Verify the data was saved correctly by fetching it back
      console.log('Verifying saved data...');
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('Verified saved data:', verifyData);
        
        if (verifyData.data && verifyData.data.data) {
          const parsedData = JSON.parse(verifyData.data.data);
          console.log('Parsed saved data:', parsedData);
          console.log('Form fields count:', parsedData.formFields ? parsedData.formFields.length : 0);
          console.log('Form answers count:', parsedData.formAnswers ? Object.keys(parsedData.formAnswers).length : 0);
        }
      }

      // Check if project already exists for this user
      const existingProjectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let projectId;
      if (existingProjectResponse.ok) {
        const existingProjects = await existingProjectResponse.json();
        const existingProject = existingProjects.data?.find(project => 
          project.name === marketingFormAnswers.description.trim()
        );
        
        if (existingProject) {
          // Use existing project
          projectId = existingProject.id;
          console.log('Using existing project:', projectId);
        } else {
          // Create new project
          const userDataString = localStorage.getItem('user');
          if (!userDataString) {
            throw new Error('User data not found. Please log in again.');
          }
          
          let userData;
          try {
            userData = JSON.parse(userDataString);
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            throw new Error('Invalid user data. Please log in again.');
          }
          
          if (!userData || !userData.id) {
            throw new Error('User ID not found. Please log in again.');
          }
          
          const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: userData.id,
              projectName: marketingFormAnswers.description.trim()
            })
          });

          if (!projectResponse.ok) {
            const errorText = await projectResponse.text();
            console.error('Project creation failed:', errorText);
            throw new Error('Failed to create project. Please try again.');
          }

          const projectData = await projectResponse.json();
          projectId = projectData.data.id;
          console.log('Created new project:', projectId);
        }
      } else {
        // Create new project if fetch fails
        const userDataString = localStorage.getItem('user');
        if (!userDataString) {
          throw new Error('User data not found. Please log in again.');
        }
        
        let userData;
        try {
          userData = JSON.parse(userDataString);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          throw new Error('Invalid user data. Please log in again.');
        }
        
        if (!userData || !userData.id) {
          throw new Error('User ID not found. Please log in again.');
        }
        
        const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/project`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userData.id,
            projectName: marketingFormAnswers.description.trim()
          })
        });

        if (!projectResponse.ok) {
          const errorText = await projectResponse.text();
          console.error('Project creation failed:', errorText);
          throw new Error('Failed to create project. Please try again.');
        }

        const projectData = await projectResponse.json();
        projectId = projectData.data.id;
        console.log('Created new project:', projectId);
      }

      localStorage.setItem('currentProjectId', projectId);

      // Generate marketing content
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...marketingFormAnswers,
          projectId,
          projectName: marketingFormAnswers.description
        })
      });

      if (!response.ok) {
        clearInterval(loadingInterval);
        throw new Error('Failed to generate marketing content');
      }

      const data = await response.json();
      clearInterval(loadingInterval);

      // Update the existing formDataWithQuestions with the core message
      const updatedFormData = {
        ...formDataWithQuestions,
        coreMessage: data.data?.coreMessage
      };

      // Save both form data and core message to onboarding
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: JSON.stringify(formDataWithQuestions),
          coreMessage: data.data?.coreMessage,
          projectId: projectId // Use the projectId from the current context
        }),
      });

      if (data.data?.coreMessage) {
        const storedData = {
          message: data.data.coreMessage,
          timestamp: Date.now(),
          context: 'core-message'
        };
        localStorage.setItem('marketingCoreMessage', JSON.stringify(storedData));
      }

      // Keep the project ID for future use (like editing the core message)
      localStorage.setItem('currentProjectId', projectId);

      // Store the newly created library name for immediate display
      setNewlyCreatedLibraryName(marketingFormAnswers.description?.trim() || 'New Library');

      // Update local state and advance to next step (continue normal flow)
      setCoreMessage(data.data?.coreMessage || '');
      setShowTypewriter(true);
      setCurrentStep(2); // Move to step 2 (Core Message)
      setShowStepForm(true); // Ensure step form stays visible

    } catch (error) {
      console.error('Error generating content:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('User data not found') || error.message.includes('Invalid user data') || error.message.includes('User ID not found')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.message.includes('Failed to create project')) {
        errorMessage = 'Failed to create project. Please try again.';
      } else if (error.message.includes('No authentication token found')) {
        errorMessage = 'Authentication failed. Please log in again.';
      }
      
      setMarketingError(errorMessage);
    } finally {
      setIsMarketingFormLoading(false);
      setLoadingMessage('');
    }
  };

  // Function to test form data update
  const testFormDataUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentProjectId = localStorage.getItem('currentProjectId');
      
      if (!token || !currentProjectId) {
        console.error('No token or project ID found for testing');
        return;
      }

      console.log('=== TESTING FORM DATA UPDATE ===');
      console.log('Project ID:', currentProjectId);
      console.log('Current form answers:', marketingFormAnswers);

      const formDataWithQuestions = {
        formFields: formFields.fields,
        formAnswers: marketingFormAnswers,
        welcomeMessage: formFields.welcomeMessage,
        footerMessage: formFields.footerMessage
      };

      console.log('Form data to save:', formDataWithQuestions);

      const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: JSON.stringify(formDataWithQuestions),
          coreMessage: null,
          projectId: currentProjectId
        })
      });

      console.log('Save response status:', saveResponse.status);
      
      if (saveResponse.ok) {
        const saveResult = await saveResponse.json();
        console.log('Save result:', saveResult);
        
        // Test fetching the data back
        // Only include projectId if it's a valid value (not null, undefined, or empty string)
        const url = currentProjectId && currentProjectId !== 'null' && currentProjectId !== 'undefined' && currentProjectId.trim() !== ''
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get`;

        const fetchResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (fetchResponse.ok) {
          const fetchResult = await fetchResponse.json();
          console.log('Fetched data after save:', fetchResult);
          
          if (fetchResult.data && fetchResult.data.data) {
            try {
              const parsedData = JSON.parse(fetchResult.data.data);
              console.log('Parsed fetched data:', parsedData);
              console.log('Form answers in fetched data:', parsedData.formAnswers);
            } catch (parseError) {
              console.error('Error parsing fetched data:', parseError);
            }
          }
        }
      } else {
        const errorText = await saveResponse.text();
        console.error('Save error:', errorText);
      }

    } catch (error) {
      console.error('Error testing form data update:', error);
    }
  };



  // Handle audience generation (exactly like library page but project-specific)
  const handleGenerateAudiences = async (e) => {
    if (e) e.preventDefault();
    console.log('handleGenerateAudiences called with audienceType:', audienceData.audienceType);
    setIsGeneratingAudiences(true);
    setAudienceError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        router.push('/');
        return;
      }

      const currentProjectId = localStorage.getItem('currentProjectId');
      console.log('Current project ID:', currentProjectId);
      if (!currentProjectId) {
        throw new Error('No project selected. Please select a project first.');
      }

      // If audienceType is null, default to 'suggest' for auto-generation
      const audienceType = audienceData.audienceType || 'suggest';
      console.log('Using audience type:', audienceType);

      if (audienceType === 'know') {
        // Validate required fields
        if (!audienceData.labelName || !audienceData.whoTheyAre || !audienceData.whatTheyWant || !audienceData.whatTheyStruggle) {
          throw new Error('Please fill in all required fields');
        }

        // Start loading sequence
        const loadingInterval = startLoadingSequence(audienceLoadingQuestions, setAudienceLoadingMessage);

        // Handle "I Know My Audience" path - project-specific
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-from-audience`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            labelName: audienceData.labelName,
            whoTheyAre: audienceData.whoTheyAre,
            whatTheyWant: audienceData.whatTheyWant,
            whatTheyStruggle: audienceData.whatTheyStruggle,
            additionalInfo: audienceData.additionalInfo,
            projectId: currentProjectId,
            projectName: localStorage.getItem('currentProjectName') || 'My Project'
          })
        });

        if (!response.ok) {
          clearInterval(loadingInterval);
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate core message');
        }

        const data = await response.json();
        clearInterval(loadingInterval);
        
        if (data.success) {
          const generatedAudiences = data.data.audiences || [];
          setAudiences(generatedAudiences);
          setCurrentBriefId(data.data.brief?.id);
          
          // Audiences are automatically saved to database during generation
          console.log('Generated and saved audiences for project:', currentProjectId);
        }
      } else if (audienceType === 'suggest') {
        // Handle "Suggest audiences for me" path - project-specific
        console.log('Starting "Suggest audiences for me" path');
        // Start loading sequence
        const loadingInterval = startLoadingSequence(audienceLoadingQuestions, setAudienceLoadingMessage);

        // Get the onboarding data first (project-specific)
        console.log('Fetching onboarding data for project:', currentProjectId);
        const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/onboarding/get?projectId=${currentProjectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!onboardingResponse.ok) {
          throw new Error('Failed to fetch project data');
        }

        const onboardingData = await onboardingResponse.json();
        if (!onboardingData.data || !onboardingData.data.data) {
          throw new Error('No Discovery Questionnaire data found. Please complete the questionnaire first.');
        }

        const formData = typeof onboardingData.data.data === 'string' 
          ? JSON.parse(onboardingData.data.data) 
          : onboardingData.data.data;

        console.log('Parsed form data:', formData);

        // Extract form answers from the parsed data
        const formAnswers = formData.formAnswers || {};
        console.log('Form answers:', formAnswers);

        // Extract all available text data from formAnswers (not formData)
        const allTextData = [];
        Object.keys(formAnswers).forEach(key => {
          if (formAnswers[key] && typeof formAnswers[key] === 'string' && formAnswers[key].trim().length > 0) {
            allTextData.push(formAnswers[key].trim());
          }
        });
        console.log('All available text data from form answers:', allTextData);

        // Map Discovery Questionnaire data to required fields with more fallbacks
        const mappedData = {
          description: formAnswers.productSummary || formAnswers.description || formAnswers.productDescription || formAnswers.summary || formAnswers.product || formAnswers.name || formAnswers.title || '',
          whoItHelps: formAnswers.coreAudience || formAnswers.targetMarket || formAnswers.audience || formAnswers.whoItHelps || formAnswers.targetAudience || formAnswers.who || formAnswers.customer || formAnswers.target || '',
          problemItSolves: formAnswers.outcome || formAnswers.problemSolved || formAnswers.problem || formAnswers.solution || formAnswers.value || formAnswers.why || formAnswers.benefit || formAnswers.challenge || '',
          projectId: currentProjectId,
          projectName: localStorage.getItem('currentProjectName') || 'My Project'
        };

        // If we still don't have enough data, try to construct from all available text
        if (!mappedData.description && allTextData.length > 0) {
          mappedData.description = allTextData.slice(0, 2).join(' ');
        }
        if (!mappedData.whoItHelps && allTextData.length > 1) {
          mappedData.whoItHelps = allTextData.slice(1, 3).join(' ');
        }
        if (!mappedData.problemItSolves && allTextData.length > 2) {
          mappedData.problemItSolves = allTextData.slice(2, 4).join(' ');
        }

        console.log('Mapped data for audience generation:', mappedData);

        // Try to get core message as fallback if available
        const projectCoreMessage = localStorage.getItem('projectCoreMessage');
        let coreMessageData = null;
        if (projectCoreMessage) {
          try {
            coreMessageData = JSON.parse(projectCoreMessage);
            console.log('Found core message data:', coreMessageData);
          } catch (error) {
            console.log('Could not parse core message data');
          }
        }

        // Check if we have at least some meaningful data
        const hasDescription = mappedData.description && mappedData.description.trim().length > 5;
        const hasAudience = mappedData.whoItHelps && mappedData.whoItHelps.trim().length > 3;
        const hasProblem = mappedData.problemItSolves && mappedData.problemItSolves.trim().length > 3;

        // If we don't have enough data, try to use core message as fallback
        if ((!hasDescription || !hasAudience || !hasProblem) && coreMessageData && coreMessageData.message) {
          console.log('Using core message as fallback for audience generation');
          const coreMessage = coreMessageData.message;
          
          // Create a basic audience suggestion based on core message
          const fallbackAudience = {
            segment: "General Audience",
            insights: "Based on your core message",
            messagingAngle: "Focus on the value proposition from your core message",
            tone: "Professional and engaging",
            personaProfile: coreMessage.substring(0, 200) + "..."
          };
          
          setAudiences([fallbackAudience]);
          return;
        }

        // Final fallback: Create a basic audience with whatever data we have
        if (!hasDescription || !hasAudience || !hasProblem) {
          console.log('Missing required fields:', {
            hasDescription,
            hasAudience,
            hasProblem,
            description: mappedData.description,
            whoItHelps: mappedData.whoItHelps,
            problemItSolves: mappedData.problemItSolves
          });
          
          if (allTextData.length > 0) {
            console.log('Creating basic audience with available data');
            const basicAudience = {
              segment: "General Target Audience",
              insights: "Based on your project information",
              messagingAngle: "Focus on the value and benefits of your offering",
              tone: "Professional and approachable",
              personaProfile: allTextData.join(' ').substring(0, 300) + "..."
            };
            
            setAudiences([basicAudience]);
            return;
          }
          
          throw new Error('Insufficient project data. Please complete the Discovery Questionnaire with more detailed information about your product, target audience, and the problem you solve.');
        }

        // Use the mapped data to generate audiences
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/generate-suggested-audiences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mappedData)
        });

        if (!response.ok) {
          clearInterval(loadingInterval);
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate audience suggestions');
        }

        const data = await response.json();
        clearInterval(loadingInterval);
        
        if (data.success) {
          const generatedAudiences = data.data.audiences || [];
          setAudiences(generatedAudiences);
          setCurrentBriefId(data.data.brief?.id);
          
          // Audiences are automatically saved to database during generation
          console.log('Generated and saved audiences for project:', currentProjectId);
        }
      }
    } catch (error) {
      console.error('Error generating audiences:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        audienceType: audienceData.audienceType,
        currentProjectId: localStorage.getItem('currentProjectId')
      });
      setAudienceError(error.message);
    } finally {
      setIsGeneratingAudiences(false);
      setAudienceLoadingMessage('');
    }
  };

  // Handle audience saving (exactly like library page)
  const handleSaveAudiences = async () => {
    try {
      setIsSavingAudiences(true);
      setAudienceError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      if (!currentBriefId) {
        throw new Error('No brief found. Please generate audiences first.');
      }

      // Get the selected and unselected audience objects
      const selectedAudienceObjects = audiences.filter(audience => 
        checkedAudiences[audience.id]
      );
      
      const unselectedAudienceIds = audiences
        .filter(audience => !checkedAudiences[audience.id])
        .map(audience => audience.id);

      // Delete unselected audiences from the database
      if (unselectedAudienceIds.length > 0) {
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/brief/${currentBriefId}/audience/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            audienceIds: unselectedAudienceIds
          })
        });

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete unselected audiences');
        }
      }

      // Update saved audiences in local state
      setSavedAudiences(prev => ({
        ...prev,
        [currentBriefId]: selectedAudienceObjects
      }));

      // Update audiences state to only show selected ones
      setAudiences(selectedAudienceObjects);

      // Clear checkboxes after successful save
      setCheckedAudiences({});

      // Move to next step
      await handleNextStep();
      
    } catch (error) {
      console.error('Error saving/deleting audiences:', error);
      setAudienceError('Failed to save changes to audiences');
    } finally {
      setIsSavingAudiences(false);
    }
  };

  // Handle audience refresh (exactly like library page)
  const handleRefreshAudiences = () => {
    setAudiences([]);
    setCheckedAudiences({});
    setAudienceError('');
    handleGenerateAudiences();
  };

  // Handle audience editing
  const handleEditAudience = (audience) => {
    setEditingAudience(audience);
    setIsEditAudiencePopupOpen(true);
  };

  // Handle audience viewing (placeholder for now)
  const handleViewAudienceDetails = (audience) => {
    console.log('View audience details:', audience);
    // TODO: Implement view functionality
  };

  // Handle closing edit audience popup
  const handleCloseEditAudiencePopup = () => {
    setIsEditAudiencePopupOpen(false);
    setEditingAudience(null);
  };

  // Handle saving edited audience
  const handleSaveEditedAudience = (updatedAudience) => {
    // Update the audiences list
    setAudiences(audiences.map(a => 
      a.id === updatedAudience.id ? updatedAudience : a
    ));
    setIsEditAudiencePopupOpen(false);
    setEditingAudience(null);
  };

  // Handle audience checkbox (exactly like library page)
  const handleCheckAudience = (audienceId) => {
    setCheckedAudiences(prev => ({
      ...prev,
      [audienceId]: !prev[audienceId]
    }));
  };

  // Brand Discovery Form Handlers
  const handleCreateBrand = () => {
    setShowBrandDiscovery(true);
    setBrandDiscoveryStep(1);
    setBrandDiscoveryTab("discovery");
  };

  const handleBrandFormChange = (field, value) => {
    setBrandFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Ensure the brand name is always updated when the first field changes
      if (field === 'brandName') {
        updated.brandName = value;
      }
      
      return updated;
    });
  };

  const handleBrandNextStep = async () => {
    if (brandDiscoveryStep === 1) {
      // Start tone of voice chat when moving to step 2
      if (brandFormData.brandName && brandFormData.industry && brandFormData.shortDescription) {
        setBrandDiscoveryStep(2);
        await initializeToneOfVoiceChat();
      }
            } else if (brandDiscoveryStep < 3) {
      setBrandDiscoveryStep(prev => prev + 1);
    }
  };

  const handleBrandPreviousStep = () => {
    if (brandDiscoveryStep > 1) {
      setBrandDiscoveryStep(prev => prev - 1);
    }
  };

  const handleBrandTabChange = (tab) => {
    setBrandDiscoveryTab(tab);
  };

  const handleBrandSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/brands/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(brandFormData),
      });

      if (response.ok) {
        // Reset form and close
        setBrandFormData({
          brandName: "",
          industry: "",
          shortDescription: "",
          websiteLink: "",
          toneOfVoice: "",
          targetAudience: "",
          compliance: ""
        });
        setShowBrandDiscovery(false);
        setBrandDiscoveryStep(1);
        setBrandDiscoveryTab("discovery");
        
        // Refresh brands and projects to show new brand
        fetchBrandsWithProjects();
        fetchProjects();
      }
    } catch (error) {
      console.error("Error creating brand:", error);
    }
  };

  // Generate AI suggestions for tone of voice
  const generateToneOfVoice = async () => {
    try {
      setIsGeneratingAI(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      // Generate AI suggestions
      const response = await fetch(`${baseUrl}/api/brands/ai-suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brandData: brandFormData
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setAiGeneratedTone(data.tone);
        setAiGeneratedAudience(data.audiences);
        setAiGeneratedCompliance(data.compliance);
      }
    } catch (error) {
      console.error("Error generating tone of voice:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Tone of Voice Chat Functions
  const initializeToneOfVoiceChat = async () => {
    // Clear all chat-related state
    setToneChatMessages([
      {
        type: 'bot',
        content: `Hi! I'm here to help you identify ${brandFormData.brandName}'s tone of voice. I'll ask you a series of questions to understand your brand's personality and then suggest the most fitting brand archetypes from the 12 marketing archetypes. Let's start with the first question:`
      }
    ]);
    setToneChatStep(0);
    setToneChatAnswers([]);
    setToneChatQuestions([]);
    setCurrentToneQuestion(''); // Reset current question
    setSelectedArchetypes([]);
    setToneOfVoiceResult(null);
    setToneChatInput(''); // Clear input field

    setIsToneChatLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Initialize the LangGraph workflow
      console.log('Initializing LangGraph workflow with brand data:', brandFormData);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      console.log('API URL:', `${baseUrl}/api/brands/workflow/initialize`);
      const response = await fetch(`${baseUrl}/api/brands/workflow/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brandData: brandFormData
        }),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const { data } = await response.json();
        console.log('Received data from backend:', data);
        
        // Store the workflow ID for future requests
        setWorkflowId(data.workflowId);
        console.log('Set workflow ID:', data.workflowId);
        
                     // Add the first question to the chat with suggestions
        console.log('Adding first question:', data.nextQuestion);
        console.log('Adding first suggestions:', data.suggestions);
             setToneChatMessages(prev => [...prev, { 
               type: 'bot', 
               content: data.nextQuestion,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
             }]);
             setCurrentToneQuestion(data.nextQuestion);
      } else {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        setToneChatMessages(prev => [...prev, { 
          type: 'bot', 
          content: `Error: ${errorData.message || 'Unknown error occurred'}` 
        }]);
      }
    } catch (error) {
      console.error("Error initializing tone of voice chat:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setToneChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: `Error: ${error.message || 'Unknown error occurred'}` 
      }]);
    } finally {
      setIsToneChatLoading(false);
    }
  };

  const handleToneChatSend = async () => {
    if (!toneChatInput.trim() || isToneChatLoading) return;

    const userAnswer = toneChatInput.trim();
    setToneChatMessages(prev => [...prev, { type: 'user', content: userAnswer }]);
    setToneChatInput('');
    setIsToneChatLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Use the tracked current question
      console.log('Current question from state:', currentToneQuestion);
      
      // Store the question-answer pair (like in edit core message chatbot)
      const newQAPair = { question: currentToneQuestion, answer: userAnswer };
      
      // Create the updated array with the new Q&A pair
      const updatedQAPairs = [...toneChatAnswers, newQAPair];
      setToneChatAnswers(updatedQAPairs);
      
      // Filter out duplicate questions based on content (like in edit core message chatbot)
      const uniqueQAPairs = updatedQAPairs.reduce((acc, current) => {
        const isDuplicate = acc.some(item => 
          item.question.trim().toLowerCase() === current.question.trim().toLowerCase()
        );
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      console.log('Unique Q&A pairs:', uniqueQAPairs);
      
      // Send the answer to the backend for processing using LangGraph workflow
      console.log('Sending discovery step data:', {
        workflowId: workflowId,
        userAnswer: userAnswer,
        currentQuestion: currentToneQuestion
      });
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/brands/workflow/discovery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflowId: workflowId,
          userAnswer: userAnswer,
          currentQuestion: currentToneQuestion
        }),
      });

      console.log('Discovery step response status:', response.status);
      if (response.ok) {
        const { data } = await response.json();
        console.log('Discovery step response data:', data);
        
        if (data.isComplete) {
          // Discovery phase is complete, trigger tone analysis
          console.log('Discovery completed, triggering tone analysis');
          setToneChatMessages(prev => [...prev, { 
            type: 'bot', 
            content: "Great! I've gathered enough information about your brand. Now let me analyze your tone of voice..."
          }]);
          
          // Trigger tone analysis
          await triggerToneAnalysis();
        } else {
          // Add next question with suggestions
          console.log('Adding next question:', data.nextQuestion);
          console.log('Adding suggestions:', data.suggestions);
          setToneChatMessages(prev => [...prev, { 
            type: 'bot', 
            content: data.nextQuestion,
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
          }]);
          setCurrentToneQuestion(data.nextQuestion);
          setToneChatStep(prev => prev + 1);
        }
      } else {
        const errorData = await response.json();
        console.error('Discovery step error:', errorData);
        setToneChatMessages(prev => [...prev, { 
          type: 'bot', 
          content: `Error: ${errorData.message || 'Failed to process discovery step'}` 
        }]);
      }
    } catch (error) {
      console.error("Error in tone of voice chat:", error);
      setToneChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsToneChatLoading(false);
    }
  };

  // Trigger tone analysis after discovery is complete
  const triggerToneAnalysis = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log('Triggering tone analysis for workflow:', workflowId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/brands/workflow/tone-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflowId: workflowId
        }),
      });

      console.log('Tone analysis response status:', response.status);
      if (response.ok) {
        const { data } = await response.json();
        console.log('Tone analysis response data:', data);
        
        // Set the tone analysis results (now includes optional explanation)
        setSelectedArchetypes(data.archetypes || []);
        setToneOfVoiceResult(data.toneOfVoice || {});
        setToneExplanation(data.explanation || "");
        setBrandFormData(prev => ({
          ...prev,
          toneOfVoice: data.toneOfVoice?.guidelines || ''
        }));
        
        // Add completion message
        setToneChatMessages(prev => [...prev, { 
          type: 'bot', 
          content: "Perfect! I've analyzed your brand's tone of voice. Here are the results:",
          results: data
        }]);
        
        // Automatically trigger compliance generation after tone analysis
        console.log('Tone analysis completed, triggering compliance generation');
        await triggerComplianceGeneration();
      } else {
        const errorData = await response.json();
        console.error('Tone analysis error:', errorData);
        setToneChatMessages(prev => [...prev, { 
          type: 'bot', 
          content: `Error: ${errorData.message || 'Failed to analyze tone of voice'}` 
        }]);
      }
    } catch (error) {
      console.error("Error in tone analysis:", error);
      setToneChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error during tone analysis. Please try again.' 
      }]);
    }
  };

  // Trigger compliance generation after tone analysis
  const triggerComplianceGeneration = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log('Triggering compliance generation for workflow:', workflowId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/brands/workflow/compliance-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflowId: workflowId
        }),
      });

      console.log('Compliance generation response status:', response.status);
      if (response.ok) {
        const { data } = await response.json();
        console.log('Compliance generation response data:', data);
        
        // Set the compliance results
        setAiGeneratedCompliance(data.compliance || []);
        
        // Add completion message with compliance display
        setToneChatMessages(prev => [...prev, { 
          type: 'bot', 
          content: "Excellent! I've generated compliance guidelines for your brand. Here are the rules and requirements:",
          compliance: data.compliance,
          showCompliance: true
        }]);
      } else {
        const errorData = await response.json();
        console.error('Compliance generation error:', errorData);
        setToneChatMessages(prev => [...prev, { 
          type: 'bot', 
          content: `Error: ${errorData.message || 'Failed to generate compliance guidelines'}` 
        }]);
      }
    } catch (error) {
      console.error("Error in compliance generation:", error);
      setToneChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error during compliance generation. Please try again.' 
      }]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    // Fill the input field with the suggestion
    setToneChatInput(suggestion);
    
    // Optionally, you can also auto-send the suggestion
    // Uncomment the line below if you want suggestions to auto-send
    // handleToneChatSend();
    
    // Focus the input field for better UX
    const textarea = document.querySelector(`.${styles.brandToneChatInput} textarea`);
    if (textarea) {
      textarea.focus();
    }
  };

  // Render compliance rules component
  const renderComplianceRules = (compliance) => {
    if (!compliance || !Array.isArray(compliance)) return null;

    const getTypeColor = (type) => {
      switch (type) {
        case 'forbidden': return '#ef4444'; // red
        case 'disclaimer': return '#f59e0b'; // amber
        case 'style': return '#3b82f6'; // blue
        case 'required': return '#10b981'; // green
        default: return '#6b7280'; // gray
      }
    };

    const getEnforceIcon = (enforce) => {
      switch (enforce) {
        case 'yes': return '🔒';
        case 'warn': return '⚠️';
        case 'no': return 'ℹ️';
        default: return '📋';
      }
    };

    return (
      <div className={styles.complianceRules}>
        {compliance.map((rule, index) => (
          <div key={index} className={styles.complianceRule}>
            <div className={styles.complianceRuleHeader}>
              <span 
                className={styles.complianceType}
                style={{ backgroundColor: getTypeColor(rule.type) }}
              >
                {rule.type.toUpperCase()}
              </span>
              <span className={styles.complianceEnforce}>
                {getEnforceIcon(rule.enforce)} {rule.enforce}
              </span>
            </div>
            <div className={styles.complianceRuleContent}>
              <p className={styles.complianceRuleText}>{rule.rule}</p>
              <div className={styles.complianceAppliesTo}>
                <span className={styles.complianceAppliesLabel}>Applies to:</span>
                <span className={styles.complianceAppliesValue}>{rule.applies_to}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Generate AI suggestions for target audience using workflow
  const generateTargetAudience = async () => {
    try {
      setIsGeneratingAI(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/brands/workflow/target-audience-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflowId: workflowId
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        console.log('Target audience generation response:', data);
        if (data.targetAudienceCategories) {
          setTargetAudienceCategories(data.targetAudienceCategories);
        }
      }
    } catch (error) {
      console.error("Error generating target audience:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Generate AI suggestions for compliance using workflow
  const generateCompliance = async () => {
    try {
      setIsGeneratingAI(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/brands/workflow/compliance-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflowId: workflowId
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setAiGeneratedCompliance(data.compliance);
      }
    } catch (error) {
      console.error("Error generating compliance:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Compliance Micro-Flow Handlers
  const handlePresetToggle = (index, checked) => {
    console.log('Toggle preset:', index, checked, aiGeneratedCompliance[index]);
    if (checked) {
      setSelectedPresets(prev => {
        const newPresets = [...prev, aiGeneratedCompliance[index]];
        console.log('Added preset, new list:', newPresets);
        return newPresets;
      });
    } else {
      setSelectedPresets(prev => {
        const newPresets = prev.filter(preset => preset !== aiGeneratedCompliance[index]);
        console.log('Removed preset, new list:', newPresets);
        return newPresets;
      });
    }
  };

  const addForbiddenWords = () => {
    if (customForbiddenWords.trim()) {
      const words = customForbiddenWords.split(',').map(word => word.trim()).filter(word => word);
      setForbiddenWordsList(prev => [...prev, ...words]);
      setCustomForbiddenWords('');
    }
  };

  const removeForbiddenWord = (index) => {
    setForbiddenWordsList(prev => prev.filter((_, i) => i !== index));
  };

  const addDisclaimers = () => {
    if (customDisclaimers.trim()) {
      setDisclaimersList(prev => [...prev, customDisclaimers.trim()]);
      setCustomDisclaimers('');
    }
  };

  const removeDisclaimer = (index) => {
    setDisclaimersList(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

      const removeUploadedFile = () => {
      setUploadedFile(null);
    };

    // Target Audience Handlers
    const handleAddNewAudience = () => {
      if (newAudienceInput.trim()) {
        setCustomAudiences(prev => [...prev, newAudienceInput.trim()]);
        setNewAudienceInput('');
      }
    };

    const removeCustomAudience = (index) => {
      setCustomAudiences(prev => prev.filter((_, i) => i !== index));
    };

  // New state for brands and AI generation
  const [brands, setBrands] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedTone, setAiGeneratedTone] = useState(null);
  const [aiGeneratedAudience, setAiGeneratedAudience] = useState(null);
  const [aiGeneratedCompliance, setAiGeneratedCompliance] = useState(null);
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [customForbiddenWords, setCustomForbiddenWords] = useState('');
  const [forbiddenWordsList, setForbiddenWordsList] = useState([]);
  const [customDisclaimers, setCustomDisclaimers] = useState('');
  const [disclaimersList, setDisclaimersList] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [enforceCompliance, setEnforceCompliance] = useState(true);
  const [targetAudienceCategories, setTargetAudienceCategories] = useState([]);
  const [newAudienceInput, setNewAudienceInput] = useState('');
  const [customAudiences, setCustomAudiences] = useState([]);

  // Debug useEffect for selectedArchetypes
  useEffect(() => {
    console.log('selectedArchetypes state changed:', selectedArchetypes);
  }, [selectedArchetypes]);

  // Debug useEffect for toneOfVoiceResult
  useEffect(() => {
    console.log('toneOfVoiceResult state changed:', toneOfVoiceResult);
  }, [toneOfVoiceResult]);

  // Auto-trigger compliance generation when step 3 is reached
  useEffect(() => {
    if (brandDiscoveryStep === 3 && !aiGeneratedCompliance) {
      console.log('Step 3 reached, triggering compliance generation');
      triggerComplianceGeneration();
    }
  }, [brandDiscoveryStep, aiGeneratedCompliance]);
  const [marketingArchetypes, setMarketingArchetypes] = useState([]);

  return (
    <div className={styles.container}>
      {renderProjectPopup()}
      <MemoizedEditPopup 
        isOpen={isEditPopupOpen}
        messages={messages}
        setMessages={setMessages}
        editedCoreMessage={editedCoreMessage}
        coreMessage={coreMessage}
        setCoreMessage={setCoreMessage}
        setEditedCoreMessage={setEditedCoreMessage}
        isRefreshing={isRefreshing}
        setIsRefreshing={setIsRefreshing}
        isSending={isSending}
        setIsSending={setIsSending}
        showTypewriter={showTypewriter}
        setShowTypewriter={setShowTypewriter}
        onClose={handleCloseEditPopup}
        currentStep={currentStep}
      />
      {isEditAudiencePopupOpen && (
        <MemoizedEditAudiencePopup
          isOpen={isEditAudiencePopupOpen}
          audience={editingAudience}
          onClose={handleCloseEditAudiencePopup}
          onSave={handleSaveEditedAudience}
        />
      )}
      {isSavePopupOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Save and Continue</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSavePopupOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <h3>Great! Let&apos;s now pinpoint who you&apos;re talking to.</h3>
              <div className={styles.modalList}>
                <p>You can:</p>
                <ul>
                  <li>Create your own audience profiles</li>
                  <li>Get AI suggestions based on the information you&apos;ve shared and the Core Message we&apos;ve created together</li>
                  <li>Edit and refine any audience in a chat window</li>
                  <li>Refresh suggestions to see new options</li>
                  <li>Save the ones that fit</li>
                  <li>Come back and adjust anytime</li>
                </ul>
                <p>Ready to go?</p>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.generateButton}
                  onClick={() => {
                    setSavePopupOpen(false);
                    router.push('/library');
                  }}
                >
                  Let&apos;s go!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      <aside
        className={`${styles.sidebar} ${
          isSidebarCollapsed ? styles.collapsed : ""
        }`}
      >
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
                className={activeSection === "greeting" ? styles.active : ""}
                onClick={() => setActiveSection("greeting")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Home</span>
              </li>
             
              <li onClick={() => router.push("/settings")}> 
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Settings</span>
              </li>
            </ul>
          </nav>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main
        className={`${styles.main} ${
          isSidebarCollapsed ? styles.collapsedMain : ""
        }`}
      >
        <header
          className={`${styles.header} ${
            isSidebarCollapsed ? styles.collapsed : ""
          }`}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "start",
            }}
          >
            {/* <button onClick={toggleSidebar} className={styles.toggleButton}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#1A1A1A"
                viewBox="0 0 30 30"
                width="30px"
                height="30px"
              >
                <path d="M 3 7 A 1.0001 1.0001 0 1 0 3 9 L 27 9 A 1.0001 1.0001 0 1 0 27 7 L 3 7 z M 3 14 A 1.0001 1.0001 0 1 0 3 16 L 27 16 A 1.0001 1.0001 0 1 0 27 14 L 3 14 z M 3 21 A 1.0001 1.0001 0 1 0 3 23 L 27 23 A 1.0001 1.0001 0 1 0 27 21 L 3 21 z" />
              </svg>
            </button> */}
          </div>
          
          <div >
            {/* <DarkModeToggle inHeader={true} /> */}
            <div className={styles.userProfile}>
              <span className={styles.userName}>{user.name || "Guest"}</span>
              <div className={styles.avatar}>{user.initials || "G"}</div>
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
          {/* <div className={styles.greetingContainer}>
            <button
              className={styles.createProjectButton}
              onClick={() => setIsProjectPopupOpen(true)}
            >
              Create New Project
            </button>
          </div> */}
                    <section className={`${styles.section} ${styles.greetingSection}`}>
            {/* Welcome Section */}
            {showWelcome && !showStepForm && !showSaveAndContinue && !showProjects && !hasExistingProjects && (
              <div className={styles.welcomeSection}>
                <div className={styles.welcomeContainer}>
                  <div className={styles.welcomeContent}>
                    <h1 className={styles.welcomeTitle}>Welcome to Marklee</h1>
                    <p className={styles.welcomeSubtitle}>
                      Your AI-powered marketing companion that helps you create compelling messages and reach your target audience effectively.
                    </p>
                    <div className={styles.welcomeButtonContainer}>
                    <button 
                      className={styles.getStartedButton}
                      onClick={() => {
                        setShowWelcome(false);
                        setShowBrandDiscovery(true);
                      }}
                    >
                        <span>Create Brand</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </button>
                      <button 
                        className={styles.secondaryButton}
                        onClick={() => {
                          setShowWelcome(false);
                          // Open library (projects) creation flow
                          setShowProjects(false);
                          setShowStepForm(true);
                          setCurrentStep(1);
                          // Clear any current project to create new
                          localStorage.removeItem('currentProjectId');
                        }}
                      >
                        <span>Create Library</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Form Section */}
            {showStepForm && !showSaveAndContinue && !showProjects && (
              <div className={styles.stepFormSection}>
                
                <div className={styles.stepFormContainer}>
                <button 
                        className={styles.backToProjectsButton}
                        onClick={() => {
                          setShowStepForm(false);
                          setShowProjects(true);
                          // Clear project-specific data when going back to projects
                          clearProjectSpecificData();
                        }}
                      >
                        Back to Library
                      
                      </button>
                  <div className={styles.stepFormHeader}>
                  
                    <div className={styles.stepFormHeaderTop}>
                      
                      <h3>
                        {localStorage.getItem('currentProjectId') ? 
                          `Library: ${newlyCreatedLibraryName || projects?.find(p => p.id == localStorage.getItem('currentProjectId'))?.name || ''}` : 
                          "Let's Get Started"
                        }
                      </h3>
                      </div>
                      <div className={styles.stepFormHeaderBottom}>
                    <div className={styles.stepperWrapper}>
                      <Stepper 
                        activeStep={currentStep - 1} 
                        alternativeLabel 
                        sx={{ 
                          width: '100%', 
                          maxWidth: 600, 
                          margin: '0 auto',
                          '& .MuiStepLabel-label.Mui-active': {
                            color: '#282ab3 !important'
                          },
                          '& .MuiStepLabel-label.Mui-completed': {
                            color: '#282ab3 !important'
                          },
                          '& .MuiStepIcon-root.Mui-active': {
                            color: '#282ab3 !important'
                          },
                          '& .MuiStepIcon-root.Mui-completed': {
                            color: '#282ab3 !important'
                          },
                          '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                            borderColor: '#282ab3 !important'
                          },
                          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                            borderColor: '#282ab3 !important'
                          }
                        }}
                      >
                      <Step >
                        <StepLabel >Discovery Questionnaire</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel >Core Message</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Target Audience</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Complete</StepLabel>
                      </Step>
                    </Stepper>
                    </div>
                    </div>
                  </div>
                  
                  {/* Step 1: Discovery Questionnaire */}
                  {currentStep === 1 && (
                    <div className={styles.discoveryStep}>
                      <div className={styles.discoveryContent}>
                        <h4>Discovery Questionnaire</h4>
                        <p>
                          {localStorage.getItem('currentProjectId') ? 
                            'Review and update your project details to regenerate your core marketing message' : 
                            'Tell us about your business so we can create your perfect marketing message'
                          }
                        </p>
                       {isMarketingFormLoading && (
                          <div className={styles.loadingOverlay}>
                            <div className={styles.loadingContainer}>
                              <div className={styles.loader}></div>
                              <p className={styles.loadingMessage}>{loadingMessage}</p>
                                      </div>
                            </div>
                          )}
                        
                        {formFields && (
                          <div className={styles.formContainer}>
                            <form onSubmit={handleMarketingSubmit} className={styles.form}>
                              {formFields.fields.map((field, index) => {
                                // Check if field is one of the required ones
                                const isRequired = field.nameKey === 'description' || 
                                                 field.nameKey === 'productSummary' ||
                                                 field.nameKey === 'coreAudience' ||
                                                 field.nameKey === 'outcome';
                                
                                // Debug: Log the field value
                                console.log(`Field ${field.nameKey}:`, marketingFormAnswers[field.nameKey]);
                                    
                                    return (
                                  <div key={index} className={styles.inputGroup}>
                                            <label htmlFor={field.nameKey}>
                                              {field.title}
                                      {isRequired && <span className={styles.requiredIndicator}>*</span>}
                                            </label>
                                            <textarea
                                              id={field.nameKey}
                                      name={field.nameKey}
                                      value={marketingFormAnswers[field.nameKey] || ''}
                                      onChange={handleMarketingInputChange}
                                              placeholder={field.placeholder}
                                      required={isRequired}
                                      disabled={isMarketingFormLoading}
                                      className={styles.textarea}
                                            />
                                            {field.guidance && (
                                      <small className={styles.guidance}>{field.guidance}</small>
                                            )}
                                            {localStorage.getItem('currentProjectId') && (
                                      <small className={styles.readOnlyIndicator}>*Changes will be saved to this project and core message will be regenerated</small>
                                            )}
                                          </div>
                                );
                              })}
                              
                              <div className={styles.buttonContainer}>
                                <button 
                                  type="submit" 
                                  className={styles.continueButton}
                                  disabled={isMarketingFormLoading}
                                >
                                  {isMarketingFormLoading ? 'Generating Core Message...' : 
                                   localStorage.getItem('currentProjectId') ? 'Save Changes & Generate Core Message' : 'Save & Generate Core Message'}
                                </button>
                                
                               
                              </div>

                              {marketingError && (
                                <div className={styles.error}>
                                  {marketingError}
                                          </div>
                              )}
                              
                              {/* Auto-save indicator */}
                             
                            </form>
                          </div>
                        )}
                        
                        {!formFields && !isMarketingFormLoading && (
                          <div className={styles.formContainer}>
                            <div className={styles.formLoaderContainer}>
                              <div className={styles.formLoader}></div>
                              {/* <p className={styles.formLoadingMessage}>{loadingMessage}</p> */}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Step 2: Core Message */}
                  {currentStep === 2 && (
                    <div className={styles.coreMessageSection}>
                      <div className={styles.coreMessageContainer}>
                        <div className={styles.coreMessageHeader}>
                          <h3>Your Core Marketing Message</h3>
                        </div>
                        <div className={styles.messageContainer}>
                          {isRefreshing ? (
                            <MessageSkeleton />
                          ) : isEditingCoreMessage ? (
                            <div className={styles.editCoreMessageContainer}>
                              <textarea
                                className={styles.editCoreMessageInput}
                                value={editedCoreMessage}
                                onChange={(e) => setEditedCoreMessage(e.target.value)}
                              />
                              <div className={styles.editCoreMessageActions}>
                                <button
                                  className={styles.cancelButton}
                                  onClick={() => {
                                    setIsEditingCoreMessage(false);
                                    setEditedCoreMessage("");
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className={styles.saveButton}
                                  onClick={handleEditCoreMessage}
                                  disabled={
                                    !editedCoreMessage.trim() ||
                                    editedCoreMessage === coreMessage
                                  }
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : showTypewriter ? (
                            <div className={styles.typewriterContainer}>
                              <Typewriter
                                words={[coreMessage]}
                                loop={1}
                                cursor
                                cursorStyle=""
                                typeSpeed={15}
                                delaySpeed={500}
                                onLoopDone={() => {
                                  setTimeout(() => setShowTypewriter(false), 500);
                                }}
                              />
                              <button
                                className={styles.editButtonCore}
                                onClick={() => {
                                  setIsEditPopupOpen(true);
                                  setEditedCoreMessage(coreMessage);
                                }}
                                aria-label="Edit core message"
                              >
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
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className={styles.fadeIn}>
                              <p>{coreMessage}</p>
                              <button
                                className={styles.editButtonCore}
                                onClick={() => {
                                  setIsEditPopupOpen(true);
                                  setEditedCoreMessage(coreMessage);
                                }}
                                aria-label="Edit core message"
                              >
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
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Target Audience Creation */}
                  {currentStep === 3 && (
                    <div className={styles.audienceStep}>
                      <div className={styles.audienceContent}>
                        <h3>Target Audience Creation</h3>
                        <p>Now let&apos;s define who you&apos;re talking to. You can create your own audience profiles or get AI suggestions based on your core message.</p>
                        
                        {/* Audience Type Selection - Exactly like library page */}
                        <div className={styles.formGroup}>
                          <h1>How would you like to define your audience?</h1>
                          <div className={styles.radioGroup}>
                            <div className={`${styles.radioOption} ${audienceData.audienceType === 'know' ? styles.selected : ''}`}>
                              <input
                                type="radio"
                                name="audienceType"
                                value="know"
                                checked={audienceData.audienceType === 'know'}
                                onChange={(e) => setAudienceData({ 
                                  audienceType: e.target.value,
                                  labelName: '',
                                  whoTheyAre: '',
                                  whatTheyWant: '',
                                  whatTheyStruggle: '',
                                  additionalInfo: ''
                                })}
                                id="know"
                              />
                              <label htmlFor="know" className={styles.radioLabel}>I know my audience</label>
                            </div>
                            <div className={`${styles.radioOption} ${audienceData.audienceType === 'suggest' ? styles.selected : ''}`}>
                              <input
                                type="radio"
                                name="audienceType"
                                value="suggest"
                                checked={audienceData.audienceType === 'suggest'}
                                onChange={(e) => {
                                  setAudienceData({ 
                                    audienceType: e.target.value
                                  });
                                  // Automatically submit for audience suggestions
                                  setTimeout(() => handleGenerateAudiences(new Event('submit')), 0);
                                }}
                                id="suggest"
                              />
                              <label htmlFor="suggest" className={styles.radioLabel}>Suggest audiences for me</label>
                            </div>
                          </div>
                          {audienceData.audienceType === 'know' && (
                            <div className={styles.questionsContainer}>
                              <div className={styles.formGroup}>
                                <h4>Label / Persona name</h4>
                                <textarea
                                  value={audienceData.labelName || ''}
                                  onChange={(e) => setAudienceData(prev => ({ ...prev, labelName: e.target.value }))}
                                  className={styles.textarea}
                                />
                              </div>
                              <div className={styles.formGroup}>
                                <h4>Who they are (role, life stage, market segment)?</h4>
                                <textarea
                                  value={audienceData.whoTheyAre || ''}
                                  onChange={(e) => setAudienceData(prev => ({ ...prev, whoTheyAre: e.target.value }))}
                                  className={styles.textarea}
                                />
                              </div>
                              <div className={styles.formGroup}>
                                <h4>What they want (main goal or desired outcome)?</h4>
                                <textarea
                                  value={audienceData.whatTheyWant || ''}
                                  onChange={(e) => setAudienceData(prev => ({ ...prev, whatTheyWant: e.target.value }))}
                                  className={styles.textarea}
                                />
                              </div>
                              <div className={styles.formGroup}>
                                <h4>What they struggle with (main pain point or problem)?</h4>
                                <textarea
                                  value={audienceData.whatTheyStruggle || ''}
                                  onChange={(e) => setAudienceData(prev => ({ ...prev, whatTheyStruggle: e.target.value }))}
                                  className={styles.textarea}
                                />
                              </div>
                              <div className={styles.formGroup}>
                                <h4>(Optional) Age, channels, purchasing power, etc.</h4>
                                <textarea
                                  value={audienceData.additionalInfo || ''}
                                  onChange={(e) => setAudienceData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                  className={styles.textarea}
                                />
                              </div>
                              <button className={styles.submitButton} onClick={handleGenerateAudiences}>Generate</button>
                            </div>
                          )}
                        </div>

                        {/* Loading State */}
                        {isGeneratingAudiences && (
                          <div className={styles.loadingOverlay}>
                            <div className={styles.loadingContainer}>
                              <div className={styles.loader}></div>
                              <p className={styles.loadingMessage}>Generating audiences...</p>
                            </div>
                          </div>
                        )}

                        {/* Generated Audiences Display - Exactly like library page */}
                        {audiences.length > 0 && (
                          <div className={styles.generatedAudiences}>
                            <div className={styles.audienceActions}>
                              {!savedAudiences[currentBriefId] && (
                                <button 
                                  className={styles.saveAudiencesButton}
                                  onClick={handleSaveAudiences}
                                  disabled={isSavingAudiences}
                                >
                                  {isSavingAudiences ? 'Saving...' : 'Save'}
                                </button>
                              )}
                            </div>
                            <div className={styles.segmentsList}>
                              {audiences.map((audience, index) => (
                                <div key={index} className={styles.segmentCard}>
                                  <div className={styles.segmentHeader}>
                                    {!savedAudiences[currentBriefId] && (
                                      <input 
                                        type="checkbox"
                                        checked={checkedAudiences[audience.id] || false}
                                        onChange={() => handleCheckAudience(audience.id)}
                                      />
                                    )}
                                    
                                    <button
                                      className={styles.editAudienceButton}
                                      onClick={() => handleEditAudience(audience)}
                                    >
                                      <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                      </svg>
                                    </button>
                                  </div>
                                  <h4>{getFirstTwoWords(audience.segment)}</h4>
                                  <p>{getDescription(audience.segment) || 'No description available'}</p>
                                  <div className={styles.audienceActions}>
                                    <button
                                      className={styles.viewDetailsButton}
                                      onClick={() => handleViewAudienceDetails(audience)}
                                    >
                                      view
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error Display */}
                        {audienceError && (
                          <div className={styles.error}>
                            <div className={styles.errorIcon}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            </div>
                            <div className={styles.errorContent}>
                              <p>{audienceError}</p>
                              {audienceError.includes('Insufficient project data') && (
                                <p className={styles.errorSuggestion}>
                                  💡 Tip: You can still create audiences manually by filling out the form above.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Setup Complete */}
                  {currentStep === 4 && (
                    <div className={styles.completeStep}>
                      <div className={styles.completeContent}>
                        <div className={styles.completeIcon}>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                        <h3>Setup Complete!</h3>
                        <p>Your core marketing message and target audiences have been created successfully. You&apos;re now ready to start creating content and reaching your audience.</p>
                        <div className={styles.completeActions}>
                          <button 
                            className={styles.completeButton}
                            onClick={handleSaveAndContinue}
                          >
                            Continue to Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step Navigation Buttons */}
                  <div className={styles.stepNavigation}>
                    <button
                      className={`${styles.stepButton} ${styles.previousButton}`}
                      onClick={handlePreviousStep}
                      disabled={currentStep === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    
                    <button
                      className={`${styles.stepButton} ${styles.nextButton}`}
                      onClick={async () => await handleNextStep()}
                      disabled={
                        (currentStep === 1 && !coreMessage) ||
                        (currentStep === 3 && audiences.length === 0)
                      }
                    >
                      <span>Next</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Projects Section */}
            {showProjects && !showBrandDiscovery && (
              renderProjectsSection()
            )}

            {/* Brand Form Section */}
            {showBrandDiscovery && (
              renderBrandForm()
            )}

            {/* Save and Continue Section */}
            {showSaveAndContinue ? (
              <div className={styles.saveAndContinueSection}>
                <div className={styles.saveAndContinueContainer}>
                  <div className={styles.saveAndContinueHeader}>
                    <h3>Save and Continue</h3>
                    <button
                      onClick={() => setShowSaveAndContinue(false)}
                      className={styles.saveAndContinueBackButton}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.saveAndContinueContent}>
                    <h3 className={styles.saveAndContinueTitle}>
                      Great! Let&apos;s now pinpoint who you&apos;re talking to.
                    </h3>
                    <div className={styles.saveAndContinueFeatures}>
                      <p>You can:</p>
                      <ul>
                        <li>Create your own audience profiles</li>
                        <li>Get AI suggestions based on the information you&apos;ve shared and the Core Message we&apos;ve created together</li>
                        <li>Edit and refine any audience in a chat window</li>
                        <li>Refresh suggestions to see new options</li>
                        <li>Save the ones that fit</li>
                        <li>Come back and adjust anytime</li>
                      </ul>
                    </div>
                    <p className={styles.saveAndContinueReady}>Ready to go?</p>
                    <button 
                      className={styles.saveAndContinueButton}
                      onClick={() => {
                        setShowSaveAndContinue(false);
                        setShowProjects(true);
                      }}
                    >
                      Let&apos;s go!
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

          </section>
        </div>
      </main> 
    </div>
  );
}
