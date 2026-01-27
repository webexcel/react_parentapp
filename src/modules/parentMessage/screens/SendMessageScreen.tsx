import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  Icon,
  Button,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../core/auth';
import { useSendMessage } from '../hooks/useParentMessages';

// Optional image picker - may not be installed
let launchImageLibrary: any = null;
let launchCamera: any = null;
try {
  const imagePicker = require('react-native-image-picker');
  launchImageLibrary = imagePicker.launchImageLibrary;
  launchCamera = imagePicker.launchCamera;
} catch (e) {
  // Image picker not installed - attachment feature will be disabled
}

export const SendMessageScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{
    uri: string;
    type: string;
    fileName: string;
    base64?: string;
  } | null>(null);

  const { sendMessageAsync, isLoading, error, isSuccess, reset } = useSendMessage();

  const isImagePickerAvailable = launchImageLibrary !== null && launchCamera !== null;

  const handlePickImage = () => {
    if (!isImagePickerAvailable) {
      Alert.alert(
        'Feature Not Available',
        'Image attachment feature requires react-native-image-picker to be installed.'
      );
      return;
    }

    Alert.alert(
      'Add Attachment',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'mixed',
                includeBase64: true,
                quality: 0.8,
              },
              handleMediaResponse
            );
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'mixed',
                includeBase64: true,
                quality: 0.8,
              },
              handleMediaResponse
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMediaResponse = (response: any) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Failed to pick media');
      return;
    }

    const asset = response.assets?.[0];
    if (asset) {
      const fileType = asset.type?.split('/')[1] || 'jpeg';
      setAttachment({
        uri: asset.uri || '',
        type: fileType,
        fileName: asset.fileName || `attachment.${fileType}`,
        base64: asset.base64,
      });
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  const handleSend = async () => {
    if (!message.trim() && !attachment) {
      Alert.alert('Error', 'Please enter a message or add an attachment');
      return;
    }

    try {
      const response = await sendMessageAsync({
        message: message.trim(),
        filename: attachment?.fileName,
        type: attachment?.type,
        image: attachment?.base64 ? `data:image/${attachment.type};base64,${attachment.base64}` : undefined,
      });

      if (response?.status) {
        Alert.alert('Success', 'Message sent successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response?.message || 'Failed to send message');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrowBack" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="h3" style={styles.headerTitle}>
          Send Message
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Student Info */}
          <View style={styles.studentInfo}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentInitial}>
                {selectedStudent?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text variant="body" semibold>
                {selectedStudent?.name}
              </Text>
              <Text variant="caption" color="secondary">
                {selectedStudent?.className} | {selectedStudent?.admissionNo}
              </Text>
            </View>
          </View>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Text variant="caption" color="secondary" style={styles.inputLabel}>
              Your Message
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          {/* Attachment Preview */}
          {attachment && (
            <View style={styles.attachmentContainer}>
              <Text variant="caption" color="secondary" style={styles.inputLabel}>
                Attachment
              </Text>
              <View style={styles.attachmentPreview}>
                {attachment.type?.includes('mp4') ? (
                  <View style={styles.videoPreview}>
                    <Icon name="playCircle" size={40} color={colors.white} />
                    <Text variant="caption" style={styles.videoText}>
                      Video attached
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                )}
                <TouchableOpacity
                  style={styles.removeAttachment}
                  onPress={handleRemoveAttachment}
                >
                  <Icon name="close" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add Attachment Button */}
          <TouchableOpacity style={styles.addAttachment} onPress={handlePickImage}>
            <Icon name="attachment" size={20} color={colors.primary} />
            <Text variant="body" style={styles.addAttachmentText}>
              {attachment ? 'Change Attachment' : 'Add Attachment'}
            </Text>
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color={colors.info} />
            <Text variant="caption" color="secondary" style={styles.infoText}>
              Your message will be sent to the school administration. They will review and respond if needed.
            </Text>
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.footer}>
          <Button
            title={isLoading ? 'Sending...' : 'Send Message'}
            onPress={handleSend}
            disabled={isLoading || (!message.trim() && !attachment)}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  studentDetails: {
    marginLeft: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentContainer: {
    marginBottom: spacing.lg,
  },
  attachmentPreview: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: colors.white,
    marginTop: spacing.sm,
  },
  removeAttachment: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addAttachmentText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.base,
    backgroundColor: colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
