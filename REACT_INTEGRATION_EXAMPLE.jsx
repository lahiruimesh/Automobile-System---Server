// Example React Component Integration for AI Chatbot
// This file shows how to integrate the chatbot backend with your React frontend

import React, { useState, useEffect, useRef } from 'react';

const ChatbotComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatbotReady, setIsChatbotReady] = useState(false);
  const messagesEndRef = useRef(null);

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Check chatbot status on component mount
  useEffect(() => {
    checkChatbotStatus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if chatbot is ready
  const checkChatbotStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/status`);
      const data = await response.json();
      
      if (data.success && data.configured) {
        setIsChatbotReady(true);
      } else {
        setIsChatbotReady(false);
        console.error('Chatbot not configured properly');
      }
    } catch (error) {
      console.error('Error checking chatbot status:', error);
      setIsChatbotReady(false);
    }
  };

  // Send message to chatbot
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to UI
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get JWT token from localStorage (adjust based on your auth implementation)
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please login to use the chatbot');
      }

      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response to UI
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        
        // Update conversation history for context
        setConversationHistory(data.conversationHistory);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to UI
      const errorMessage = {
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear conversation
  const clearConversation = async () => {
    try {
      const token = localStorage.getItem('token');

      await fetch(`${API_BASE_URL}/chatbot/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      setMessages([]);
      setConversationHistory([]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot Header */}
      <div className="chatbot-header">
        <h3>AI Assistant</h3>
        <button onClick={clearConversation} className="clear-btn">
          Clear Chat
        </button>
      </div>

      {/* Status Indicator */}
      {!isChatbotReady && (
        <div className="status-warning">
          Chatbot is not configured. Please set up OpenAI API key.
        </div>
      )}

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>👋 Hello! I'm your AI assistant for automobile services.</p>
            <p>How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.role}`}
          >
            <div className="message-content">
              {msg.content}
            </div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isChatbotReady || isLoading}
          className="message-input"
        />
        <button
          type="submit"
          disabled={!isChatbotReady || isLoading || !inputMessage.trim()}
          className="send-btn"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatbotComponent;

/* 
  Example CSS Styles (add to your stylesheet):

  .chatbot-container {
    display: flex;
    flex-direction: column;
    height: 600px;
    max-width: 800px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }

  .chatbot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #007bff;
    color: white;
  }

  .status-warning {
    background-color: #fff3cd;
    color: #856404;
    padding: 10px;
    text-align: center;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f8f9fa;
  }

  .message {
    margin-bottom: 15px;
    padding: 10px 15px;
    border-radius: 8px;
    max-width: 70%;
  }

  .message.user {
    background-color: #007bff;
    color: white;
    margin-left: auto;
    text-align: right;
  }

  .message.assistant {
    background-color: white;
    border: 1px solid #ddd;
  }

  .message.system {
    background-color: #f8d7da;
    color: #721c24;
    text-align: center;
    max-width: 100%;
  }

  .message-time {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 5px;
  }

  .input-form {
    display: flex;
    padding: 15px;
    border-top: 1px solid #ddd;
    background-color: white;
  }

  .message-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 10px;
  }

  .send-btn {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .send-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    background-color: #666;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
*/
