import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text, Icon, Badge} from '../../../design-system';
import {colors} from '../../../design-system/theme/colors';
import {spacing, borderRadius} from '../../../design-system/theme/spacing';
import {
  LeaveRequest,
  getSessionLabel,
  getStatusColor,
  getStatusBgColor,
  getStatusLabel,
} from '../types/leaveLetter.types';

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onEdit?: (request: LeaveRequest) => void;
  onDelete?: (request: LeaveRequest) => void;
  isDeleting?: boolean;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  request,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDateRangeText = (): string => {
    const start = formatDate(request.fdate);
    const end = formatDate(request.tdate);
    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const canEdit = request.leaveStatus === 'REQUEST' || request.leaveStatus === 'PENDING';
  const statusColor = getStatusColor(request.leaveStatus);
  const statusBgColor = getStatusBgColor(request.leaveStatus);
  const statusLabel = getStatusLabel(request.leaveStatus);

  return (
    <View style={styles.card}>
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Icon name="calendar" size={16} color={colors.primary} />
          <Text style={styles.dateText}>{getDateRangeText()}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: statusBgColor}]}>
          <Text style={[styles.statusText, {color: statusColor}]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Session Type */}
      <View style={styles.sessionRow}>
        <Icon name="schedule" size={14} color={colors.textSecondary} />
        <Text variant="caption" color="secondary" style={styles.sessionText}>
          {getSessionLabel(request.abtype)}
        </Text>
      </View>

      {/* Reason/Message */}
      <View style={styles.messageContainer}>
        <Text variant="body" style={styles.messageText} numberOfLines={3}>
          {request.reson || 'No reason provided'}
        </Text>
      </View>

      {/* Actions (only for pending requests) */}
      {canEdit && (onEdit || onDelete) && (
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(request)}
              disabled={isDeleting}>
              <Icon name="assignment" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(request)}
              disabled={isDeleting}>
              <Icon name="delete" size={16} color={colors.error} />
              <Text style={[styles.actionText, styles.deleteText]}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Submitted time */}
      <View style={styles.footer}>
        <Text variant="caption" color="muted">
          Submitted: {formatDate(request.updateTme)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sessionText: {
    marginLeft: spacing.xs,
  },
  messageContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  messageText: {
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  deleteButton: {},
  deleteText: {
    color: colors.error,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
