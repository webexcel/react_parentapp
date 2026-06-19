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
import { Homework } from '../types/homework.types';

interface HomeworkCardProps {
  homework: Homework;
  onPress: () => void;
  onAcknowledge?: () => void;
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({
  homework,
  onPress,
  onAcknowledge,
}) => {
  const imageAttachments = homework.attachments.filter(a => a.type === 'image');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDaysRemaining = () => {
    const dueDate = new Date(homework.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const getStatusVariant = () => {
    switch (homework.status) {
      case 'overdue': return 'error';
      case 'completed': return 'success';
      default: return 'warning';
    }
  };

  const getAttachmentIcon = (type: string): 'pdf' | 'image' | 'audio' | 'playCircle' | 'attachment' => {
    switch (type) {
      case 'pdf': return 'pdf';
      case 'image': return 'image';
      case 'audio': return 'audio';
      case 'video': return 'playCircle';
      default: return 'attachment';
    }
  };

  const getAttachmentColor = (type: string): string => {
    switch (type) {
      case 'pdf': return colors.error;
      case 'image': return colors.success;
      case 'audio': return colors.warning;
      case 'video': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Subject Tag, Status, and Acknowledge */}
      <View style={styles.header}>
        <View
          style={[styles.subjectTag, { backgroundColor: `${homework.subjectColor}15` }]}
        >
          <View style={[styles.subjectDot, { backgroundColor: homework.subjectColor }]} />
          <Text variant="caption" semibold style={{ color: homework.subjectColor }}>
            {homework.subject}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Badge
            label={homework.status === 'completed' ? 'Completed' : getDaysRemaining()}
            variant={getStatusVariant()}
            size="sm"
          />
          {homework.isAcknowledged || homework.status === 'completed' ? (
            <View style={styles.acknowledgedIcon}>
              <Icon name="check" size={16} color={colors.success} />
            </View>
          ) : onAcknowledge ? (
            <TouchableOpacity
              style={styles.acknowledgeIcon}
              onPress={(e) => {
                e.stopPropagation?.();
                onAcknowledge();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="thumbUp" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Title */}
      <Text variant="body" semibold style={styles.title} numberOfLines={2}>
        {homework.title}
      </Text>

      {/* Description */}
      {homework.description && (
        <Text variant="bodySmall" color="secondary" numberOfLines={3} style={styles.description}>
          {homework.description}
        </Text>
      )}

      {/* Due Date and Teacher */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={14} color={colors.textMuted} />
          <Text variant="caption" color="muted" style={styles.metaText}>
            Due: {formatDate(homework.dueDate)}
          </Text>
        </View>
        {homework.teacherName ? (
          <View style={styles.metaItem}>
            <Icon name="profile" size={14} color={colors.textMuted} />
            <Text variant="caption" color="muted" style={styles.metaText}>
              {homework.teacherName}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Attachment indicators */}
      {homework.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {/* Image thumbnails */}
          {imageAttachments.map((attachment, index) => (
            <View key={attachment.id} style={styles.thumbnailContainer}>
              <Image
                source={{ uri: attachment.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </View>
          ))}
          {/* Non-image attachment icons */}
          {homework.attachments
            .filter(a => a.type !== 'image')
            .map((attachment, idx) => (
              <View key={attachment.id || idx} style={styles.attachmentItem}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  acknowledgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acknowledgedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  title: {
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  metaText: {
    marginLeft: spacing.xs,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
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
