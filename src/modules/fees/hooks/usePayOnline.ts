import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../../core/auth';
import { feesApi } from '../services/feesApi';
import {
  PaymentFlowType,
  RazorpayOrderData,
  SelectableFeeItem,
} from '../types/fees.types';

export type { PaymentFlowType };

/** PhonePe: the app gets a URL to open, either a UPI intent or a WebView page. */
export interface PhonePePaymentInit {
  gateway: 'PHONEPE';
  redirectUrl: string;
  intentUrl?: string;
  orderId: string;
  merchantId: number;
  paymentFlowType: PaymentFlowType;
}

/** Razorpay: the app gets an order to hand to the native checkout sheet. */
export interface RazorpayPaymentInit {
  gateway: 'RAZORPAY';
  order: RazorpayOrderData;
  orderId: string;
  merchantId: number;
}

export type PaymentInitResult = PhonePePaymentInit | RazorpayPaymentInit;

interface UsePayOnlineResult {
  initiatePayment: (
    selectedFees: SelectableFeeItem[],
    totalAmount: number
  ) => Promise<PaymentInitResult>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook that handles the 2-step payment initiation flow:
 * 1. Call payOnline → get merchantId
 * 2. Call updateOrderId with fee details → get the gateway's order
 *
 * The gateway is chosen server-side per school: schools with Razorpay
 * credentials get a Razorpay order for the native checkout sheet, the rest get
 * a PhonePe redirect/intent URL. `paymentFlowType` only matters to PhonePe —
 * on Android it asks for the INTENT flow (opens the PhonePe app directly),
 * otherwise PG_CHECKOUT (WebView).
 */
export const usePayOnline = (): UsePayOnlineResult => {
  const { token, userData, students, selectedStudentId } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const initiatePayment = useCallback(
    async (
      selectedFees: SelectableFeeItem[],
      totalAmount: number
    ): Promise<PaymentInitResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        const student = students.find((s) => s.id === selectedStudentId);
        const adno = student?.studentId || student?.id;
        const mobileNo =
          userData?.mobileNumber || userData?.mobile_number || '';

        if (!adno || !token || !mobileNo) {
          throw new Error(`Missing required payment information (adno: ${!!adno}, token: ${!!token}, mobile: ${!!mobileNo})`);
        }

        // Determine PhonePe payment flow type: INTENT on Android, PG_CHECKOUT otherwise.
        // Ignored by the backend when the school is on Razorpay.
        const paymentFlowType: PaymentFlowType =
          Platform.OS === 'android' ? 'INTENT' : 'PG_CHECKOUT';

        // Step 1: Create merchant entry
        const payOnlineRes = await feesApi.payOnline({
          admission_id: adno,
          payment_amount: String(totalAmount),
          mobile_no: mobileNo,
          token,
        });
        if (!payOnlineRes.status || !payOnlineRes.data) {
          throw new Error(
            payOnlineRes.message || 'Failed to initiate payment'
          );
        }

        const merchantId = payOnlineRes.data;

        // Step 2: Create the gateway order
        const updateOrderRes = await feesApi.updateOrderId({
          token,
          amount: String(totalAmount),
          FEE_DETAILS: selectedFees,
          id: merchantId,
          paymentFlowType,
        });
        if (!updateOrderRes.status || !updateOrderRes.data) {
          throw new Error(
            updateOrderRes.message || 'Failed to create payment order'
          );
        }

        const orderData = updateOrderRes.data;

        if (orderData.gateway === 'RAZORPAY') {
          if (!orderData.orderId || !orderData.keyId) {
            throw new Error('Incomplete Razorpay order received from server');
          }

          return {
            gateway: 'RAZORPAY',
            order: orderData,
            orderId: orderData.orderId,
            merchantId,
          };
        }

        const { redirectUrl, intentUrl, orderId } = orderData;
        const paymentUrl = intentUrl || redirectUrl;

        if (!paymentUrl) {
          throw new Error('No payment URL received from server');
        }

        return {
          gateway: 'PHONEPE',
          redirectUrl: paymentUrl,
          intentUrl,
          orderId,
          merchantId,
          paymentFlowType,
        };
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Payment initiation failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [token, userData, students, selectedStudentId]
  );

  return { initiatePayment, isProcessing, error, clearError };
};
