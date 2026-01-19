import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Icon,
  Spinner,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useChatProvider } from '../hooks/useChatProvider';
import { MessageBubble, ChatInput, SuggestedQuestions, ProviderSelector } from '../components';
import { ChatMessage, StudentContext, ChatProvider } from '../types/chat.types';
import { SafeAreaView } from 'react-native-safe-area-context';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getWelcomeMessage = (provider: ChatProvider): ChatMessage => ({
  id: 'welcome',
  role: 'assistant',
  content:
    provider === 'dialogflow'
      ? "Hello! I'm your school assistant. I can help you with school information, student queries, and answer questions about homework, attendance, fees, and more. How can I assist you today?"
      : "Hello! I'm your AI assistant for the Crescent Parent App. I can help you with questions about your child's academics, homework, attendance, school events, and more. How can I assist you today?",
  timestamp: new Date(),
  provider,
});

export const ChatScreen: React.FC = () => {
  const { students, selectedStudentId } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const {
    provider,
    switchProvider,
    isLoading: isProviderLoading,
    isInitialized,
    error: providerError,
    sendMessage: sendProviderMessage,
    setStudentContext,
    resetChat,
    getProviderDisplayName,
  } = useChatProvider();

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(provider)]);
  const [isLoading, setIsLoading] = useState(false);

  // Get selected student
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Update messages when provider changes
  useEffect(() => {
    if (!isProviderLoading) {
      setMessages([getWelcomeMessage(provider)]);
    }
  }, [provider, isProviderLoading]);

  // Update student context when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      const context: StudentContext = {
        id: selectedStudent.id,
        name: selectedStudent.name,
        grade: selectedStudent.className || '',
        section: selectedStudent.section || '',
        rollNumber: selectedStudent.rollNo,
        // Additional context can be fetched from API
        pendingHomework: 3, // Mock data
        recentAttendance: '92% this month',
        recentMarks: 'Average 85% in recent tests',
      };
      setStudentContext(context);
    }
  }, [selectedStudent, setStudentContext]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!isInitialized) {
      Alert.alert(
        'AI Not Available',
        providerError || 'The AI assistant is not configured. Please contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      provider,
    };

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await sendProviderMessage(text);

      // Replace loading message with actual response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        provider,
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== 'loading').concat(assistantMessage)
      );
    } catch (error: any) {
      // Remove loading message and show error
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      Alert.alert('Error', error.message || 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            resetChat();
            setMessages([getWelcomeMessage(provider)]);
          },
        },
      ]
    );
  };

  const handleProviderSwitch = (newProvider: ChatProvider) => {
    if (newProvider === provider) return;

    // If there are messages beyond welcome, confirm switch
    if (messages.length > 1) {
      Alert.alert(
        'Switch AI Provider',
        `Switching to ${newProvider === 'dialogflow' ? 'School Assistant' : 'Gemini AI'} will clear the current conversation. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: async () => {
              resetChat();
              await switchProvider(newProvider);
            },
          },
        ]
      );
    } else {
      switchProvider(newProvider);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <View style={styles.aiAvatar}>
            <Icon name="chat" size={24} color={colors.white} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text variant="h3">{getProviderDisplayName()}</Text>
            <Text variant="caption" color="secondary">
              {selectedStudent ? `Helping with ${selectedStudent.name}` : 'Select a student'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <ProviderSelector
            currentProvider={provider}
            onSelect={handleProviderSwitch}
            disabled={isLoading}
          />
          <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
            <Icon name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="chat" size={48} color={colors.primary} />
      </View>
      <Text variant="h3" style={styles.emptyTitle}>
        Ask Me Anything
      </Text>
      <Text variant="body" color="secondary" style={styles.emptyDescription}>
        {provider === 'dialogflow'
          ? 'I can help with school information, fees, attendance, homework, and more.'
          : "I can help you with your child's academics, homework, attendance, and more."}
      </Text>
      <SuggestedQuestions onSelectQuestion={handleSendMessage} />
    </View>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} />
  );

  // Show loading while provider is being loaded
  if (isProviderLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Spinner size="large" />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if provider failed to initialize
  if (providerError && !isInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Icon name="close" size={48} color={colors.error} />
          <Text variant="h3" style={styles.errorTitle}>
            AI Not Available
          </Text>
          <Text variant="body" color="secondary" style={styles.errorText}>
            {providerError}
          </Text>
          {provider === 'gemini' && (
            <TouchableOpacity
              style={styles.switchProviderButton}
              onPress={() => switchProvider('dialogflow')}
            >
              <Text variant="body" style={styles.switchProviderText}>
                Try School Assistant instead
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {renderHeader()}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyChat}
          ListFooterComponent={
            messages.length === 1 ? (
              <SuggestedQuestions onSelectQuestion={handleSendMessage} />
            ) : null
          }
          onContentSizeChange={scrollToBottom}
        />

        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder={
            selectedStudent
              ? `Ask about ${selectedStudent.name}...`
              : 'Type your message...'
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  clearButton: {
    padding: spacing.sm,
  },
  messageList: {
    padding: spacing.base,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.base,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  switchProviderButton: {
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.md,
  },
  switchProviderText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
