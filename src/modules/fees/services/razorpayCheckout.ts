import type {
  PaymentErrorData,
  PaymentSuccessData,
  RazorpayOptions,
} from 'react-native-razorpay';
import Config from 'react-native-config';
import { RazorpayOrderData, RazorpayCheckoutSuccess } from '../types/fees.types';

/**
 * Razorpay Android SDK error codes, passed straight through by the RN bridge.
 * @see https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/
 */
const RAZORPAY_ERROR = {
  NETWORK_ERROR: 0,
  INVALID_OPTIONS: 1,
  PAYMENT_CANCELLED: 2,
  TLS_ERROR: 3,
  INCOMPATIBLE_PLUGIN: 4,
} as const;

export class RazorpayCheckoutError extends Error {
  /** True when the parent backed out of the sheet rather than a payment failing. */
  readonly isCancelled: boolean;
  readonly code?: number;
  readonly paymentId?: string;

  constructor(message: string, options: { isCancelled: boolean; code?: number; paymentId?: string }) {
    super(message);
    this.name = 'RazorpayCheckoutError';
    this.isCancelled = options.isCancelled;
    this.code = options.code;
    this.paymentId = options.paymentId;
  }
}

/**
 * Load the native module lazily.
 *
 * The package builds a NativeEventEmitter at import time, which throws when the
 * native side isn't linked yet (a JS-only reload after `npm install`, or Jest).
 * Requiring it here keeps that failure inside the payment flow, where it can be
 * reported, instead of taking down the whole app at startup.
 */
const loadCheckout = () => {
  try {
    return require('react-native-razorpay').default;
  } catch {
    throw new RazorpayCheckoutError(
      'Payments are unavailable in this build. Please update the app.',
      { isCancelled: false }
    );
  }
};

/** Razorpay cancellations surface as a code on Android and only as text on iOS. */
const isCancellation = (error: PaymentErrorData): boolean => {
  if (error?.code === RAZORPAY_ERROR.PAYMENT_CANCELLED) return true;
  const text = `${error?.description ?? ''} ${error?.reason ?? ''}`.toLowerCase();
  return text.includes('cancel');
};

const describeError = (error: PaymentErrorData): string => {
  if (error?.description) return error.description;

  switch (error?.code) {
    case RAZORPAY_ERROR.NETWORK_ERROR:
      return 'Network error. Please check your connection and try again.';
    case RAZORPAY_ERROR.INVALID_OPTIONS:
      return 'Payment could not be started. Please contact the school office.';
    case RAZORPAY_ERROR.TLS_ERROR:
      return 'Your device does not support a secure connection to the payment gateway.';
    case RAZORPAY_ERROR.INCOMPATIBLE_PLUGIN:
      return 'Payments are unavailable in this build. Please update the app.';
    default:
      return 'Payment failed. Please try again.';
  }
};

/**
 * Build the options object for the native checkout sheet from the order the
 * backend created. The amount and order id come from the server — never from
 * anything the app computed — so the sheet can't be opened for a tampered sum.
 */
export const buildCheckoutOptions = (order: RazorpayOrderData): RazorpayOptions => ({
  // The backend is the source of truth for the key; RAZORPAY_KEY_ID in .env is
  // only a fallback for local builds pointed at an older backend.
  key: order.keyId || Config.RAZORPAY_KEY_ID || '',
  order_id: order.orderId,
  amount: order.amount,
  currency: order.currency || 'INR',
  name: order.name,
  description: order.description,
  prefill: {
    name: order.prefill?.name || '',
    contact: order.prefill?.contact || '',
    email: order.prefill?.email || '',
  },
  notes: order.notes || {},
  theme: { color: order.themeColor },
  // The contact is the parent's login mobile; locking it skips Razorpay's
  // "Enter payer's number" step. Only lock what we actually have.
  readonly: { contact: !!order.prefill?.contact },
  // Parents pay as guests. Without this Razorpay tries to OTP-log the payer
  // into a saved-cards profile, which shows a "Login failed" popup when the
  // number has none (always the case in test mode).
  remember_customer: false,
  // Fee payments are one shot — a mistaken back-swipe shouldn't drop the sheet.
  modal: { confirm_close: true },
  retry: { enabled: true, max_count: 3 },
});

/**
 * Open the Razorpay checkout sheet and resolve with the fields the backend
 * needs to verify the payment signature.
 *
 * Rejects with a {@link RazorpayCheckoutError}; check `isCancelled` to tell a
 * parent backing out from a genuine payment failure.
 */
export const openRazorpayCheckout = async (
  order: RazorpayOrderData
): Promise<RazorpayCheckoutSuccess> => {
  const RazorpayCheckout = loadCheckout();
  const options = buildCheckoutOptions(order);

  if (!options.key) {
    throw new RazorpayCheckoutError(
      'Payment gateway is not configured. Please contact the school office.',
      { isCancelled: false }
    );
  }

  let result: PaymentSuccessData;
  try {
    result = await RazorpayCheckout.open(options);
  } catch (err) {
    const error = err as PaymentErrorData;
    throw new RazorpayCheckoutError(describeError(error), {
      isCancelled: isCancellation(error),
      code: error?.code,
      paymentId: error?.metadata?.payment_id,
    });
  }

  // A success without a signature can't be verified server-side. Treat it as a
  // failure here — the webhook and the status poller are the safety net, so a
  // genuine payment still gets its receipt.
  if (!result?.razorpay_payment_id || !result?.razorpay_order_id || !result?.razorpay_signature) {
    throw new RazorpayCheckoutError(
      'Payment could not be confirmed. If money was debited it will be updated shortly.',
      { isCancelled: false, paymentId: result?.razorpay_payment_id }
    );
  }

  return {
    razorpay_payment_id: result.razorpay_payment_id,
    razorpay_order_id: result.razorpay_order_id,
    razorpay_signature: result.razorpay_signature,
  };
};
