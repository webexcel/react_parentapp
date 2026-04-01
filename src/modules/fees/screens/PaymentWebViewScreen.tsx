import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Text, Icon, colors, spacing } from '../../../design-system';
import { TouchableOpacity } from 'react-native';
import { ROUTES } from '../../../core/constants';

interface PaymentWebViewParams {
  redirectUrl: string;
  orderId: string;
  merchantId: number;
  amount: number;
}

/**
 * WebView screen that loads the PhonePe payment page.
 *
 * Detection logic:
 * - PhonePe redirects to a success/failure URL after payment.
 * - We detect the final state from the URL pattern and navigate
 *   to the PaymentResult screen.
 */
export const PaymentWebViewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { redirectUrl, orderId, merchantId, amount } =
    route.params as PaymentWebViewParams;

  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasNavigatedRef = useRef(false);

  // Handle Android back button — confirm before leaving payment
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Cancel Payment?',
          'Are you sure you want to cancel this payment?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Cancel',
              style: 'destructive',
              onPress: () => {
                navigation.navigate(ROUTES.PAYMENT_RESULT, {
                  status: 'cancelled',
                  orderId,
                  merchantId,
                  amount,
                });
              },
            },
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription.remove();
    }, [navigation, orderId, merchantId, amount])
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (hasNavigatedRef.current) return;

      const { url } = navState;
      const lowerUrl = url.toLowerCase();

      let paymentStatus: 'success' | 'failed' | 'pending' | null = null;

      // 1. Detect PhonePe redirect to merchant verify page
      //    PhonePe redirects to: parentalert.in/online/verify.php?mid={id}
      //    The verify page may further redirect or show status via query params
      if (lowerUrl.includes('parentalert.in/online/verify.php')) {
        // The verify page is the final redirect — PhonePe only redirects here
        // after payment completion. We treat arrival at this URL as success
        // (the backend callback handles the actual status update server-side)
        paymentStatus = 'success';
      }

      // 2. Detect explicit status patterns from PhonePe or verify page
      if (!paymentStatus) {
        if (
          lowerUrl.includes('/success') ||
          lowerUrl.includes('status=success') ||
          lowerUrl.includes('code=payment_success') ||
          lowerUrl.includes('state=completed')
        ) {
          paymentStatus = 'success';
        } else if (
          lowerUrl.includes('/failure') ||
          lowerUrl.includes('/failed') ||
          lowerUrl.includes('status=failure') ||
          lowerUrl.includes('status=failed') ||
          lowerUrl.includes('code=payment_error') ||
          lowerUrl.includes('code=payment_declined') ||
          lowerUrl.includes('state=failed')
        ) {
          paymentStatus = 'failed';
        } else if (
          lowerUrl.includes('/pending') ||
          lowerUrl.includes('status=pending') ||
          lowerUrl.includes('state=pending')
        ) {
          paymentStatus = 'pending';
        }
      }

      if (paymentStatus) {
        hasNavigatedRef.current = true;
        navigation.replace(ROUTES.PAYMENT_RESULT, {
          status: paymentStatus,
          orderId,
          merchantId,
          amount,
        });
      }
    },
    [navigation, orderId, merchantId, amount]
  );

  const handleClose = useCallback(() => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            navigation.navigate(ROUTES.PAYMENT_RESULT, {
              status: 'cancelled',
              orderId,
              merchantId,
              amount,
            });
          },
        },
      ]
    );
  }, [navigation, orderId, merchantId, amount]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerAmount}>
            {'\u20B9'}{amount.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.closeButton} />
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: redirectUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        style={styles.webView}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 60, // below header
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
