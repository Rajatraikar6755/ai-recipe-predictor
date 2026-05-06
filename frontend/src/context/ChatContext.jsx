import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { chatService } from '../services';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ChatContext = createContext(null);

const initialState = {
  messages: [],
  isLoading: false,
  isSending: false,
  sessionId: 'default',
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, isLoading: false };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_SENDING':
      return { ...state, isSending: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load chat history when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    } else {
      dispatch({ type: 'CLEAR_MESSAGES' });
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await chatService.getHistory('default', 50);
      if (res.success) {
        dispatch({ type: 'SET_MESSAGES', payload: res.data.messages });
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendMessage = useCallback(async (message) => {
    // Add user message immediately (optimistic)
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_SENDING', payload: true });

    try {
      const res = await chatService.sendMessage(message, state.sessionId);
      if (res.success) {
        dispatch({ type: 'ADD_MESSAGE', payload: res.data.message });
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      // Remove optimistic message on error
      dispatch({ type: 'SET_MESSAGES', payload: state.messages });
    } finally {
      dispatch({ type: 'SET_SENDING', payload: false });
    }
  }, [state.messages, state.sessionId]);

  const clearHistory = useCallback(async () => {
    try {
      await chatService.clearHistory(state.sessionId);
      dispatch({ type: 'CLEAR_MESSAGES' });
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear chat history');
    }
  }, [state.sessionId]);

  return (
    <ChatContext.Provider value={{ ...state, sendMessage, clearHistory, loadHistory }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
