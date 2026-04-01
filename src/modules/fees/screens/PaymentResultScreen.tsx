import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Text, Icon, colors, spacing } from '../../../design-system';
import { TouchableOpacity } from 'react-native';
import { ROUTES } from '../../../core/constants';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';

type PaymentStatus = 'success' | 'failed' | 'pending' | 'cancelled';

interface PaymentResultParams {
  status: PaymentStatus;
  orderId?: string;
  merchantId?: number;
  amount: number;
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { icon: string; iconColor: string; bgColor: string; title: string; message: string }
> = {
  success: {
    icon: 'check-circle',
    iconColor: colors.success,
    bgColor: '#D1FAE5',
    title: 'Payment Successful!',
    message: 'Your fee payment has been processed successfully. The receipt will be available in your payment history.',
  },
  failed: {
    icon: 'error',
    iconColor: colors.error,
    bgColor: '#FEE2E2',
    title: 'Payment Failed',
    message: 'The payment could not be processed. No amount has been deducted from your account. Please try again.',
  },
  pending: {
    icon: 'schedule',
    iconColor: colors.warning,
    bgColor: '#FEF3C7',
    title: 'Payment Pending',
    message: 'Your payment is being processed. This may take a few minutes. Please check your payment history later.',
  },
  cancelled: {
    icon: 'cancel',
    iconColor: colors.textMuted,
    bgColor: '#F3F4F6',
    title: 'Payment Cancelled',
    message: 'You cancelled the payment. No amount has been deducted from your account.',
  },
};

export const PaymentResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const { status, orderId, amount } = route.params as PaymentResultParams;
  const config = STATUS_CONFIG[status];

  const handleGoToFees = useCallback(() => {
    // Invalidate fees queries so data is refetched
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEES] });
    // Navigate back to Fee Details, removing this screen from stack
    navigation.navigate(ROUTES.FEE_DETAILS);
  }, [navigation, queryClient]);

  const handleRetryPayment = useCallback(() => {
    // Go back to Fee Details to re-select fees and retry
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEES] });
    navigation.navigate(ROUTES.FEE_DETAILS);
  }, [navigation, queryClient]);

  const handleGoHome = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEES] });
    navigation.navigate(ROUTES.MAIN_TABS);
  }, [navigation, queryClient]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Icon name={config.icon} size={64} color={config.iconColor} />
        </View>

        {/* Status Title */}
        <Text style={styles.title}>{config.title}</Text>

        {/* Amount */}
        <Text style={styles.amount}>
          {'\u20B9'}{amount.toLocaleString('en-IN')}
        </Text>

        {/* Message */}
        <Text style={styles.message}>{config.message}</Text>

        {/* Order ID */}
        {orderId && (
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>{orderId}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {status === 'failed' || status === 'cancelled' ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRetryPayment}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToFees}
              activeOpacity={0.8}
            >
              <Icon name="receipt" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View Fee Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  orderIdContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actions: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
