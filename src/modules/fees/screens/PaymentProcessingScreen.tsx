import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  AppState,
  AppStateStatus,
  BackHandler,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Text, Icon, Spinner, colors, spacing } from '../../../design-system';
import { TouchableOpacity } from 'react-native';
import { ROUTES } from '../../../core/constants';
import { feesApi } from '../services/feesApi';

interface PaymentProcessingParams {
  orderId: string;
  merchantId: number;
  amount: number;
  /**
   * Which gateway this order belongs to. Razorpay's checkout sheet runs inside
   * the app, so there is no app switch to wait for — polling starts on mount.
   */
  gateway?: 'PHONEPE' | 'RAZORPAY';
  /** Optional status line, e.g. the reason verification was inconclusive. */
  message?: string;
}

const MAX_POLLS = 15; // 15 polls * 2 sec = 30 seconds max
const POLL_INTERVAL = 2000;

/**
 * Screen shown while a payment is still being confirmed.
 *
 * PhonePe (UPI intent) flow:
 * 1. User is redirected to PhonePe app (Linking.openURL called before navigating here)
 * 2. This screen shows a waiting spinner
 * 3. When user returns (AppState → active), we poll checkPaymentStatus
 * 4. On terminal status (success/failed) → navigate to PaymentResultScreen
 * 5. On timeout → navigate with 'pending' status
 *
 * Razorpay flow:
 * The checkout sheet is in-process, so the app never backgrounds and there is no
 * AppState transition to key off. We land here only when the payment was made but
 * couldn't be verified, so polling starts immediately on mount and the backend
 * webhook/reconciliation sweep settles the order underneath us.
 */
export const PaymentProcessingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, merchantId, amount, gateway, message } =
    route.params as PaymentProcessingParams;
  const isRazorpay = gateway === 'RAZORPAY';

  const [statusMessage, setStatusMessage] = useState(
    isRazorpay
      ? 'Confirming your payment...'
      : 'Complete payment in your UPI app...'
  );
  const [isPolling, setIsPolling] = useState(false);
  const hasNavigatedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const navigateToResult = useCallback(
    (status: 'success' | 'failed' | 'pending' | 'cancelled') => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
      navigation.replace(ROUTES.PAYMENT_RESULT, {
        status,
        orderId,
        merchantId,
        amount,
      });
    },
    [navigation, orderId, merchantId, amount]
  );

  // Poll the backend for payment status
  const pollPaymentStatus = useCallback(async () => {
    if (hasNavigatedRef.current || isPolling) return;
    setIsPolling(true);
    setStatusMessage('Checking payment status...');
    pollCountRef.current = 0;

    const poll = async () => {
      if (hasNavigatedRef.current) return;

      if (pollCountRef.current >= MAX_POLLS) {
        // Max polls reached — navigate to pending
        setIsPolling(false);
        navigateToResult('pending');
        return;
      }

      try {
        const res = await feesApi.checkPaymentStatus(merchantId);
        if (res.status && res.data) {
          const { paymentState } = res.data;
          if (paymentState === 'success' || paymentState === 'failed') {
            setIsPolling(false);
            navigateToResult(paymentState);
            return;
          }
        }
      } catch (err) {
        // Payment status poll error - continue polling
      }

      pollCountRef.current++;
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
    };

    poll();
  }, [merchantId, navigateToResult, isPolling]);

  // Razorpay never backgrounds the app, so there is no "user came back" moment
  // to wait for — start checking as soon as the screen mounts.
  useEffect(() => {
    if (isRazorpay) {
      pollPaymentStatus();
    }
    // Mount-only: pollPaymentStatus guards itself against concurrent runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for AppState changes (user returning from PhonePe)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // User returned to app — start polling
          pollPaymentStatus();
        }
        appStateRef.current = nextAppState;
      }
    );

    return () => subscription.remove();
  }, [pollPaymentStatus]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Cancel Payment?',
          isRazorpay
            ? 'Are you sure you want to leave? If your payment went through, it will still be processed.'
            : 'Are you sure you want to cancel? If you already completed payment in PhonePe, it will still be processed.',
          [
            { text: 'Wait', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => navigateToResult('pending'),
            },
          ]
        );
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => sub.remove();
    }, [navigateToResult, isRazorpay])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerAmount}>
            {'\u20B9'}
            {amount.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Spinner size="large" color={colors.primary} />
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>
        <Text style={styles.hintText}>
          {message ||
            (isRazorpay
              ? 'Your payment is being confirmed with the bank. This usually takes a few seconds — please do not pay again.'
              : 'Please complete the payment in your UPI app. You will be redirected automatically once the payment is confirmed.')}
        </Text>
      </View>

      {/* Manual check button */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={pollPaymentStatus}
          activeOpacity={0.7}
          disabled={isPolling}
        >
          <Icon name="refresh" size={20} color={colors.primary} />
          <Text style={styles.checkButtonText}>
            {isPolling ? 'Checking...' : 'Check Payment Status'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});
