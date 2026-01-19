import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Text, Icon, colors, spacing } from '../../../../design-system';
import { FlashMessage } from '../../types/dashboard.types';

interface FlashMessageBannerProps {
  messages: FlashMessage[];
  onDismiss?: (messageId: number) => void;
  onPress?: (message: FlashMessage) => void;
  style?: object;
}

export const FlashMessageBanner: React.FC<FlashMessageBannerProps> = ({
  messages,
  onDismiss,
  onPress,
  style,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-rotate messages every 5 seconds
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length, fadeAnim]);

  if (messages.length === 0) return null;

  const currentMessage = messages[currentIndex];

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(currentMessage.id);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(currentMessage);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Icon name="campaign" size={20} color="#FFFFFF" />
        </View>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>ANNOUNCEMENT</Text>
          <Text style={styles.message} numberOfLines={2}>
            {currentMessage.message || currentMessage.title}
          </Text>
        </Animated.View>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Icon name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>

      {messages.length > 1 && (
        <View style={styles.pagination}>
          {messages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  banner: {
    backgroundColor: '#f59e0b', // warning color
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#f59e0b',
  },
});
