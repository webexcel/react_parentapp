import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Text, Icon, colors, spacing } from '../../../../design-system';
import { FlashMessage } from '../../types/dashboard.types';

interface FlashMessageModalProps {
  messages: FlashMessage[];
  visible: boolean;
  onClose: () => void;
  onDismiss?: (messageId: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const FlashMessageModal: React.FC<FlashMessageModalProps> = ({
  messages,
  visible,
  onClose,
  onDismiss,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible]);

  if (messages.length === 0) return null;

  const currentMessage = messages[currentIndex];

  const handleNext = () => {
    if (currentIndex < messages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(currentMessage.id);
    }

    // If there are more messages, show the next one
    if (currentIndex < messages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more messages, close the modal
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header - Hidden */}
          {/* <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Icon name="campaign" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.headerTitle}>Flash Message</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View> */}

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            {/* Display image if available */}
            {((currentMessage.image && currentMessage.image.trim()) ||
              (currentMessage.event_image && currentMessage.event_image.trim())) && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentMessage.image || currentMessage.event_image }}
                  style={styles.messageImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={[
              styles.textContent,
              !((currentMessage.image && currentMessage.image.trim()) ||
                (currentMessage.event_image && currentMessage.event_image.trim())) && styles.textContentNoImage
            ]}>
              {/* Display title - Always show, fallback to 'Flash Message' if not provided */}
              <Text style={styles.messageTitle}>
                {currentMessage.Title || currentMessage.title || 'Flash Message'}
              </Text>

              {/* Display description or message - Always show */}
              {(currentMessage.Discription || currentMessage.description || currentMessage.message) && (
                <Text style={styles.messageText}>
                  {currentMessage.Discription || currentMessage.description || currentMessage.message}
                </Text>
              )}

              {/* Display date */}
              {currentMessage.start_date && (
                <Text style={styles.messageDate}>
                  {new Date(currentMessage.start_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer with navigation */}
          <View style={styles.footer}>
            {messages.length > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}
                  style={[
                    styles.navigationButton,
                    currentIndex === 0 && styles.navigationButtonDisabled,
                  ]}
                >
                  <Icon
                    name="back"
                    size={20}
                    color={currentIndex === 0 ? colors.textMuted : colors.textPrimary}
                  />
                </TouchableOpacity>

                <Text style={styles.paginationText}>
                  {currentIndex + 1} / {messages.length}
                </Text>

                <TouchableOpacity
                  onPress={handleNext}
                  disabled={currentIndex === messages.length - 1}
                  style={[
                    styles.navigationButton,
                    currentIndex === messages.length - 1 && styles.navigationButtonDisabled,
                  ]}
                >
                  <Icon
                    name="chevronRight"
                    size={20}
                    color={
                      currentIndex === messages.length - 1
                        ? colors.textMuted
                        : colors.textPrimary
                    }
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    width: '100%',
    maxWidth: SCREEN_WIDTH - spacing.lg * 2,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    paddingTop: spacing.lg,
  },
  imageContainer: {
    marginBottom: spacing.lg,
  },
  messageImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  textContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  textContentNoImage: {
    paddingTop: 0,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  messageDate: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  navigationButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
  },
  navigationButtonDisabled: {
    opacity: 0.4,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 60,
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
