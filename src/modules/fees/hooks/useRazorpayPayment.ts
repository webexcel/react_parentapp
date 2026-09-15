import { useCallback, useState } from 'react';
import { feesApi } from '../services/feesApi';
import {
  RazorpayCheckoutError,
  openRazorpayCheckout,
} from '../services/razorpayCheckout';
import { RazorpayOrderData } from '../types/fees.types';

export type RazorpayOutcome =
  | { status: 'success'; paymentId: string }
  /** Paid, but we couldn't confirm it — the webhook/poller will settle it. */
  | { status: 'pending'; paymentId?: string; message?: string }
  | { status: 'failed'; message: string }
  | { status: 'cancelled' };

interface UseRazorpayPaymentResult {
  runCheckout: (order: RazorpayOrderData, merchantId: number) => Promise<RazorpayOutcome>;
  isVerifying: boolean;
}

/**
 * Runs a Razorpay payment end to end: open the native checkout sheet, then ask
 * the backend to verify the signature it returned.
 *
 * The distinction that matters is between "the payment failed" and "the payment
 * may have gone through but we couldn't confirm it". Money must never be shown
 * as lost: once the sheet reports success, the worst outcome this returns is
 * `pending`, which sends the parent to the polling screen while the webhook and
 * the server-side reconciliation sweep catch up.
 */
export const useRazorpayPayment = (): UseRazorpayPaymentResult => {
  const [isVerifying, setIsVerifying] = useState(false);

  const runCheckout = useCallback(
    async (order: RazorpayOrderData, merchantId: number): Promise<RazorpayOutcome> => {
      let checkoutResult;

      try {
        checkoutResult = await openRazorpayCheckout(order);
      } catch (err) {
        if (err instanceof RazorpayCheckoutError) {
          if (err.isCancelled) {
            return { status: 'cancelled' };
          }
          // The sheet reached a payment before failing, so a debit is possible.
          if (err.paymentId) {
            return { status: 'pending', paymentId: err.paymentId, message: err.message };
          }
          return { status: 'failed', message: err.message };
        }
        return {
          status: 'failed',
          message: (err as Error)?.message || 'Payment failed. Please try again.',
        };
      }

      setIsVerifying(true);
      try {
        const res = await feesApi.verifyRazorpayPayment({
          merchantOrderId: merchantId,
          ...checkoutResult,
        });

        if (res.status) {
          return {
            status: 'success',
            paymentId: checkoutResult.razorpay_payment_id,
          };
        }

        return {
          status: 'pending',
          paymentId: checkoutResult.razorpay_payment_id,
          message: res.message || 'Payment is being confirmed.',
        };
      } catch (err: any) {
        // Verification failed (offline, server error). The payment itself may
        // well have succeeded — let the status poller decide.
        return {
          status: 'pending',
          paymentId: checkoutResult.razorpay_payment_id,
          message:
            err?.response?.data?.message ||
            'Could not confirm the payment yet. It will be updated shortly.',
        };
      } finally {
        setIsVerifying(false);
      }
    },
    []
  );

  return { runCheckout, isVerifying };
};
