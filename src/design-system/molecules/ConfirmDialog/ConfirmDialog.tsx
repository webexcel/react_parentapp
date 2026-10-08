import React from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/Icon';
import { colors, spacing } from '../../theme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: IconName;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button and icon, for actions like logout or delete */
  destructive?: boolean;
  /** Shows a spinner on the confirm button and blocks both buttons */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Two-button confirmation in the app's own styling, in place of an OS
 * Alert dialog.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const accent = destructive ? colors.error : colors.primary;
  const accentSoft = destructive ? colors.errorLight : colors.primarySoft;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon && (
            <View style={[styles.iconCircle, { backgroundColor: accentSoft }]}>
              <Icon name={icon} size={32} color={accent} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: accent }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
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
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textWhite,
  },
});
