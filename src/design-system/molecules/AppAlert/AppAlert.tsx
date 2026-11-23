import React, { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { AlertButton, AlertOptions } from 'react-native';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/Icon';
import { colors, spacing } from '../../theme';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
}

// Module-level queue so AppAlert.alert() can be called from anywhere (hooks,
// services) exactly like Alert.alert; <AppAlertHost /> renders the head.
let queue: AlertRequest[] = [];
let nextId = 1;
const listeners = new Set<(q: AlertRequest[]) => void>();
const emit = () => listeners.forEach((l) => l(queue));

/**
 * Drop-in replacement for React Native's Alert.alert, rendered in the app's
 * own styling (same look as ConfirmDialog) instead of the OS dialog.
 */
export const AppAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    queue = [
      ...queue,
      {
        id: nextId++,
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
        options,
      },
    ];
    emit();
  },
};

const getVariant = (req: AlertRequest): AlertVariant => {
  const text = `${req.title} ${req.message || ''}`.toLowerCase();
  if (req.buttons.some((b) => b.style === 'destructive')) return 'warning';
  if (/\b(error|fail(ed|ure)?|could not|couldn't|unable|invalid|incorrect|denied|not allowed)\b/.test(text)) return 'error';
  if (/\b(success(ful(ly)?)?|submitted|updated|deleted|saved|marked|refreshed|downloaded|sent)\b/.test(text)) return 'success';
  if (/\b(warning|pending|required|please)\b/.test(text)) return 'warning';
  return 'info';
};

const VARIANTS: Record<AlertVariant, { icon: IconName; color: string; soft: string }> = {
  success: { icon: 'check', color: colors.success, soft: colors.successLight },
  error: { icon: 'warning', color: colors.error, soft: colors.errorLight },
  warning: { icon: 'warning', color: colors.warning, soft: colors.warningLight },
  info: { icon: 'info', color: colors.primary, soft: colors.primarySoft },
};

export const AppAlertHost: React.FC = () => {
  const [items, setItems] = useState<AlertRequest[]>(queue);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  const current = items[0];
  if (!current) return null;

  const close = (button?: AlertButton) => {
    queue = queue.filter((q) => q.id !== current.id);
    emit();
    // Run the handler after the dialog is gone, as the OS Alert does
    if (button?.onPress) setTimeout(() => button.onPress?.(), 0);
  };

  const handleBack = () => {
    const cancel = current.buttons.find((b) => b.style === 'cancel');
    if (cancel) close(cancel);
    else if (current.buttons.length === 1) close(current.buttons[0]);
    else if (current.options?.cancelable) {
      close();
      current.options.onDismiss?.();
    }
  };

  const variant = getVariant(current);
  const { icon, color, soft } = VARIANTS[variant];
  const stacked = current.buttons.length > 2;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleBack}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: soft }]}>
            <Icon name={icon} size={32} color={color} />
          </View>

          <Text style={styles.title}>{current.title}</Text>
          {!!current.message && (
            <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageContent}>
              <Text style={styles.message}>{current.message}</Text>
            </ScrollView>
          )}

          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {current.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              const filled = !isCancel;
              const bg = isDestructive ? colors.error : variant === 'error' && !stacked ? colors.error : colors.primary;
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    stacked ? styles.buttonStacked : index > 0 && styles.buttonSpacing,
                    filled ? { backgroundColor: bg } : styles.cancelButton,
                  ]}
                  onPress={() => close(button)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={filled ? styles.confirmText : styles.cancelText}>{button.text || 'OK'}</Text>
                </TouchableOpacity>
              );
            })}
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
    maxHeight: '80%',
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
  messageScroll: {
    alignSelf: 'stretch',
    flexGrow: 0,
    marginTop: spacing.sm,
  },
  messageContent: {
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSpacing: {
    marginLeft: spacing.md,
  },
  buttonStacked: {
    flex: 0,
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
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
