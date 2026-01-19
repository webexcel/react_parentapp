import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import {
  Text,
  Badge,
  Icon,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { Circular } from '../types/circular.types';
import { useStudentPhoto } from '../hooks/useStudentPhoto';

interface CircularCardProps {
  circular: Circular;
  onPress: () => void;
}

export const CircularCard: React.FC<CircularCardProps> = ({ circular, onPress }) => {
  const { photoUrl } = useStudentPhoto(circular.adno);

  const formatDate = (dateString: string) => {
    // API returns format like "10,Jan-14:30"
    if (!dateString) return '';
    // Just return as-is since it's already formatted from API
    return dateString.replace(',', ' ').replace('-', ' at ');
  };

  const getStudentInitial = (name: string) => {
    if (!name) return 'S';
    // Trim whitespace and get first character
    const trimmedName = name.trim();
    if (!trimmedName) return 'S';
    // Get first alphabetic character
    const firstChar = trimmedName.charAt(0).toUpperCase();
    // If first character is not a letter, try to find first letter
    if (!/[A-Z]/.test(firstChar)) {
      const match = trimmedName.match(/[A-Za-z]/);
      return match ? match[0].toUpperCase() : 'S';
    }
    return firstChar;
  };

  const getAvatarColor = (name: string) => {
    // Generate consistent color based on name
    const colors = [
      { bg: '#DBEAFE', text: '#2563EB' }, // blue
      { bg: '#F3E8FF', text: '#9333EA' }, // purple
      { bg: '#FCE7F3', text: '#DB2777' }, // pink
      { bg: '#D1FAE5', text: '#059669' }, // green
      { bg: '#FEF3C7', text: '#D97706' }, // amber
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const getPriorityVariant = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      default:
        return 'muted';
    }
  };

  const getAttachmentIcon = (type: string): 'pdf' | 'image' | 'audio' | 'attachment' => {
    switch (type) {
      case 'pdf':
        return 'pdf';
      case 'image':
        return 'image';
      case 'audio':
        return 'audio';
      default:
        return 'attachment';
    }
  };

  const getAttachmentColor = (type: string): string => {
    switch (type) {
      case 'pdf':
        return colors.error;
      case 'image':
        return colors.success;
      case 'audio':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, !circular.isRead && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.studentContainer}>
          {photoUrl && typeof photoUrl === 'string' ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(circular.title).bg }]}>
              <Text style={[styles.avatarText, { color: getAvatarColor(circular.title).text }]}>
                {getStudentInitial(circular.title)}
              </Text>
            </View>
          )}
          <Text variant="bodySmall" style={[styles.studentName, { color: getAvatarColor(circular.title).text }]} numberOfLines={1}>
            {circular.title}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text variant="caption" style={styles.date}>
            {formatDate(circular.date)}
          </Text>
        </View>
      </View>

      <Text variant="body" semibold numberOfLines={3} style={styles.content}>
        {circular.content}
      </Text>

      {circular.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {circular.attachments.map((attachment, idx) => (
            <View key={idx} style={styles.attachmentItem}>
              {attachment.type === 'image' && attachment.url ? (
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: attachment.url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <>
                  <Icon
                    name={getAttachmentIcon(attachment.type)}
                    size={18}
                    color={getAttachmentColor(attachment.type)}
                  />
                  <Text
                    variant="caption"
                    style={[styles.attachmentText, { color: getAttachmentColor(attachment.type) }]}
                  >
                    {attachment.type.toUpperCase()}
                  </Text>
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconBg: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    padding: 6,
    marginRight: spacing.xs,
  },
  date: {
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  studentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentName: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.xs,
  },
  content: {
    marginBottom: spacing.sm,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentText: {
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  thumbnailContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
});
