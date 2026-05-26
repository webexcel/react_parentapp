import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../../core/auth';
import { feesApi } from '../services/feesApi';
import { SelectableFeeItem } from '../types/fees.types';

export type PaymentFlowType = 'PG_CHECKOUT' | 'INTENT';

export interface PaymentInitResult {
  redirectUrl: string;
  intentUrl?: string;
  orderId: string;
  merchantId: number;
  paymentFlowType: PaymentFlowType;
}

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
 * 2. Call updateOrderId with fee details → get PhonePe redirectUrl/intentUrl
 *
 * On Android, uses INTENT flow (opens PhonePe app directly).
 * Falls back to PG_CHECKOUT (WebView) if needed.
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

        // Determine payment flow type: INTENT on Android, PG_CHECKOUT otherwise
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

        // Step 2: Create PhonePe order
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

        const { redirectUrl, intentUrl, orderId } = updateOrderRes.data;
        const paymentUrl = intentUrl || redirectUrl;

        if (!paymentUrl) {
          throw new Error('No payment URL received from server');
        }

        return {
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
