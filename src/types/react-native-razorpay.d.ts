/**
 * react-native-razorpay ships `src/types.ts` but its entry point
 * (RazorpayCheckout.js) has no `types` field in package.json, so TypeScript
 * can't resolve the module. This mirrors the shipped types for the subset of
 * the API the fees module uses.
 */
declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    key: string;
    amount: number | string;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
      hide_topbar?: boolean;
    };
    modal?: {
      backdropclose?: boolean;
      escape?: boolean;
      handleback?: boolean;
      confirm_close?: boolean;
      ondismiss?: () => void;
      animation?: boolean;
    };
    timeout?: number;
    retry?: {
      enabled?: boolean;
      max_count?: number;
    };
    readonly?: {
      email?: boolean;
      contact?: boolean;
      name?: boolean;
    };
    /** Offer saved cards / OTP login for the contact. Off = guest checkout. */
    remember_customer?: boolean;
    [key: string]: any;
  }

  export interface PaymentSuccessData {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    [key: string]: any;
  }

  export interface PaymentErrorData {
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
      [key: string]: any;
    };
  }

  export interface ExternalWalletData {
    external_wallet: string;
    [key: string]: any;
  }

  export default class RazorpayCheckout {
    static open(
      options: RazorpayOptions,
      successCallback?: (data: PaymentSuccessData) => void,
      errorCallback?: (data: PaymentErrorData) => void
    ): Promise<PaymentSuccessData>;

    static onExternalWalletSelection(
      externalWalletCallback: (data: ExternalWalletData) => void
    ): void;
  }
}
