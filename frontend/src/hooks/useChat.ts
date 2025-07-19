import { AgentMessage } from '@/lib/types/agent';
import { useState, useRef, useCallback } from 'react';

export interface ChatState {
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
}

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    console.log('Adding message:', newMessage);
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<AgentMessage>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Add user message
    addMessage({
      content: content.trim(),
      role: 'user'
    });

    // Add loading AI message
    const aiMessageId = addMessage({
      content: '',
      role: 'assistant'
    });

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Prepare conversation history for context
      const conversationHistory = state.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content.trim(),
          conversationHistory 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // The backend now returns a complete AgentMessage
      // Update the AI message with the complete response
      updateMessage(aiMessageId, {
        content: data.content || data.response || '',
        toolResults: data.toolResults || []
      });

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== aiMessageId),
          isLoading: false
        }));
        return;
      }

      console.error('Error sending message:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      updateMessage(aiMessageId, {
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      });

      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      abortControllerRef.current = null;
    }
  }, [addMessage, updateMessage, state.messages]);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null
    });
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearChat,
    cancelRequest
  };
};
