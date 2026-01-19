import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Image, Alert } from 'react-native';
import {
  Text,
  Badge,
  Button,
  Icon,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { Homework } from '../types/homework.types';

interface HomeworkCardProps {
  homework: Homework;
  onAcknowledge?: () => void;
  isAcknowledging?: boolean;
}

export const HomeworkCard: React.FC<HomeworkCardProps> = ({
  homework,
  onAcknowledge,
  isAcknowledging,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
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
      case 'overdue':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'warning';
    }
  };

  return (
    <View style={styles.container}>
      {/* Subject Tag */}
      <View style={styles.header}>
        <View
          style={[
            styles.subjectTag,
            { backgroundColor: `${homework.subjectColor}15` },
          ]}
        >
          <View
            style={[
              styles.subjectDot,
              { backgroundColor: homework.subjectColor },
            ]}
          />
          <Text
            variant="caption"
            semibold
            style={{ color: homework.subjectColor }}
          >
            {homework.subject}
          </Text>
        </View>
        <Badge
          label={homework.status === 'completed' ? 'Completed' : getDaysRemaining()}
          variant={getStatusVariant()}
          size="sm"
        />
      </View>

      {/* Title and Description */}
      <Text variant="body" semibold style={styles.title} numberOfLines={2}>
        {homework.title}
      </Text>

      {homework.description && (
        <Text variant="bodySmall" color="secondary" numberOfLines={2} style={styles.description}>
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
        {homework.teacherName && (
          <View style={styles.metaItem}>
            <Icon name="profile" size={14} color={colors.textMuted} />
            <Text variant="caption" color="muted" style={styles.metaText}>
              {homework.teacherName}
            </Text>
          </View>
        )}
      </View>

      {/* Attachments - clickable */}
      {homework.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {homework.attachments.map((attachment, index) => (
            <TouchableOpacity
              key={attachment.id}
              style={[
                styles.attachmentButton,
                attachment.type === 'image' && styles.imageAttachment,
                index > 0 && { marginLeft: spacing.sm },
              ]}
              onPress={() => {
                console.log('=== ATTACHMENT TAP ===');
                console.log('Attachment pressed:', attachment.url);
                console.log('Attachment type:', attachment.type);

                Alert.alert(
                  'Opening Attachment',
                  `Type: ${attachment.type}\nURL: ${attachment.url}`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open',
                      onPress: () => {
                        if (attachment.url) {
                          Linking.openURL(attachment.url).catch((err) => {
                            console.error('Error opening attachment:', err);
                            Alert.alert('Error', `Could not open: ${err.message}`);
                          });
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {attachment.type === 'image' ? (
                <Image
                  source={{ uri: attachment.url }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Icon
                    name={attachment.type === 'pdf' ? 'pdf' : attachment.type === 'audio' ? 'audio' : 'attachment'}
                    size={20}
                    color={
                      attachment.type === 'pdf'
                        ? colors.error
                        : attachment.type === 'audio'
                        ? colors.warning
                        : colors.primary
                    }
                  />
                  <Text
                    variant="caption"
                    semibold
                    style={[
                      styles.attachmentText,
                      {
                        color:
                          attachment.type === 'pdf'
                            ? colors.error
                            : attachment.type === 'audio'
                            ? colors.warning
                            : colors.primary,
                      },
                    ]}
                  >
                    {attachment.type.toUpperCase()}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Acknowledge Button */}
      {homework.status !== 'completed' && !homework.isAcknowledged && onAcknowledge && (
        <Button
          title="Mark as Complete"
          variant="secondary"
          size="sm"
          onPress={onAcknowledge}
          loading={isAcknowledging}
          fullWidth
          style={styles.acknowledgeButton}
        />
      )}

      {homework.isAcknowledged && homework.status !== 'completed' && (
        <View style={styles.acknowledgedBadge}>
          <Icon name="check" size={14} color={colors.success} />
          <Text variant="caption" style={{ color: colors.success, marginLeft: spacing.xs }}>
            Acknowledged
          </Text>
        </View>
      )}
    </View>
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
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  imageAttachment: {
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  attachmentText: {
    marginLeft: spacing.xs,
  },
  acknowledgeButton: {
    marginTop: spacing.md,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
