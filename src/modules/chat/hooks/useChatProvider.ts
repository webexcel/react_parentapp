import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiService } from '../services/geminiService';
import { dialogflowService } from '../services/dialogflowService';
import {
  ChatProvider,
  StudentContext,
  ChatServiceInterface,
} from '../types/chat.types';

const STORAGE_KEY = '@chat_provider_preference';

/**
 * Hook for managing chat provider (Gemini vs Dialogflow)
 * Handles provider switching, persistence, and service abstraction
 */
export const useChatProvider = () => {
  const [provider, setProvider] = useState<ChatProvider>('gemini');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dialogflow' || saved === 'gemini') {
          setProvider(saved);
        }
      } catch (e) {
        console.error('Failed to load chat provider preference:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  // Initialize current provider when it changes
  useEffect(() => {
    if (isLoading) return;

    const service = provider === 'gemini' ? geminiService : dialogflowService;
    const initialized = service.initialize();
    setIsInitialized(initialized);

    if (!initialized && provider === 'gemini') {
      setError('Gemini API key not configured. Try switching to Assistant.');
    } else {
      setError(null);
    }
  }, [provider, isLoading]);

  /**
   * Switch between providers
   */
  const switchProvider = useCallback(async (newProvider: ChatProvider) => {
    setProvider(newProvider);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newProvider);
    } catch (e) {
      console.error('Failed to save provider preference:', e);
    }
  }, []);

  /**
   * Get the current service instance
   */
  const getService = useCallback((): ChatServiceInterface => {
    return provider === 'gemini' ? geminiService : dialogflowService;
  }, [provider]);

  /**
   * Send message through current provider
   */
  const sendMessage = useCallback(
    async (message: string): Promise<string> => {
      const service = getService();
      return service.sendMessage(message);
    },
    [getService]
  );

  /**
   * Set student context for current provider
   */
  const setStudentContext = useCallback(
    (context: StudentContext) => {
      const service = getService();
      service.setStudentContext(context);
    },
    [getService]
  );

  /**
   * Reset chat for current provider
   */
  const resetChat = useCallback(() => {
    const service = getService();
    service.resetChat();
  }, [getService]);

  /**
   * Get provider display name
   */
  const getProviderDisplayName = useCallback((): string => {
    return provider === 'gemini' ? 'Gemini AI' : 'School Assistant';
  }, [provider]);

  return {
    provider,
    switchProvider,
    isLoading,
    isInitialized,
    error,
    sendMessage,
    setStudentContext,
    resetChat,
    getService,
    getProviderDisplayName,
  };
};
