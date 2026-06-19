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
import RNFS from 'react-native-blob-util';

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

// Optional document picker - may not be installed
let pickDocument: any = null;
try {
  const docPicker = require('@react-native-documents/picker');
  pickDocument = docPicker.pick || docPicker.default?.pick;
} catch (e) {
  // Document picker not installed
}

// File type helpers
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', '3gp', 'wmv'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'wma', 'flac'];
const DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'];

const getFileCategory = (extension: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  const ext = extension.toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (DOC_EXTENSIONS.includes(ext)) return 'document';
  return 'other';
};

const getFileMimeType = (extension: string): string => {
  const ext = extension.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    bmp: 'image/bmp', webp: 'image/webp',
    mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
    '3gp': 'video/3gpp', wmv: 'video/x-ms-wmv',
    mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', ogg: 'audio/ogg',
    m4a: 'audio/mp4', wma: 'audio/x-ms-wma', flac: 'audio/flac',
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain', csv: 'text/csv', rtf: 'application/rtf',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

const getFileIcon = (category: string): string => {
  switch (category) {
    case 'audio': return 'audio';
    case 'document': return 'pdf';
    case 'video': return 'playCircle';
    default: return 'attachment';
  }
};

const getFileCategoryLabel = (category: string): string => {
  switch (category) {
    case 'image': return 'Image';
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    case 'document': return 'Document';
    default: return 'File';
  }
};

export const SendMessageScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{
    uri: string;
    type: string;
    fileName: string;
    fileCategory: 'image' | 'video' | 'audio' | 'document' | 'other';
    base64?: string;
  } | null>(null);

  const { sendMessageAsync, isLoading, error, isSuccess, reset } = useSendMessage();

  const isImagePickerAvailable = launchImageLibrary !== null && launchCamera !== null;

  const handlePickAttachment = () => {
    const options: any[] = [];

    if (isImagePickerAvailable) {
      options.push({
        text: 'Camera',
        onPress: () => {
          launchCamera(
            {
              mediaType: 'mixed',
              includeBase64: true,
              quality: 0.8,
            },
            handleMediaResponse,
          );
        },
      });
      options.push({
        text: 'Gallery',
        onPress: () => {
          launchImageLibrary(
            {
              mediaType: 'mixed',
              includeBase64: true,
              quality: 0.8,
            },
            handleMediaResponse,
          );
        },
      });
    }

    if (pickDocument) {
      options.push({
        text: 'Browse Files',
        onPress: handlePickDocument,
      });
    }

    if (options.length === 0) {
      Alert.alert(
        'Feature Not Available',
        'Attachment feature requires react-native-image-picker or react-native-document-picker to be installed.',
      );
      return;
    }

    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Add Attachment', 'Choose an option', options);
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
      const category = getFileCategory(fileType);
      setAttachment({
        uri: asset.uri || '',
        type: fileType,
        fileName: asset.fileName || `attachment.${fileType}`,
        fileCategory: category,
        base64: asset.base64,
      });
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await pickDocument({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'audio/mpeg',
          'audio/wav',
          'audio/aac',
          'audio/ogg',
          'audio/mp4',
          'audio/flac',
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'image/*',
        ],
      });

      const file = Array.isArray(result) ? result[0] : result;
      if (!file) return;

      const fileName = file.name || 'attachment';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      const category = getFileCategory(extension);

      // Read file as base64
      let base64Data: string | undefined;
      try {
        const filePath = file.uri.replace('file://', '');
        base64Data = await RNFS.fs.readFile(filePath, 'base64');
      } catch (readErr) {
        console.warn('Could not read file as base64:', readErr);
      }

      setAttachment({
        uri: file.uri,
        type: extension,
        fileName,
        fileCategory: category,
        base64: base64Data,
      });
    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;
      Alert.alert('Error', 'Failed to pick file');
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
      let imageData: string | undefined;
      if (attachment?.base64) {
        const mimeType = getFileMimeType(attachment.type);
        imageData = `data:${mimeType};base64,${attachment.base64}`;
      }

      const response = await sendMessageAsync({
        message: message.trim(),
        filename: attachment?.fileName,
        type: attachment?.type,
        image: imageData,
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
                {attachment.fileCategory === 'image' ? (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.filePreview}>
                    <Icon
                      name={getFileIcon(attachment.fileCategory)}
                      size={40}
                      color={colors.white}
                    />
                    <Text variant="caption" style={styles.filePreviewLabel}>
                      {getFileCategoryLabel(attachment.fileCategory)} attached
                    </Text>
                    <Text variant="caption" style={styles.filePreviewName} numberOfLines={1}>
                      {attachment.fileName}
                    </Text>
                  </View>
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
          <TouchableOpacity style={styles.addAttachment} onPress={handlePickAttachment}>
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
  filePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  filePreviewLabel: {
    color: colors.white,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  filePreviewName: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
    fontSize: 12,
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
