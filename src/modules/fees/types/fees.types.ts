import { ApiResponse } from '../../../core/api/apiTypes';

// ============================================
// Fee Details Types (POST /payments/getStudentPayDetails)
// ============================================

export interface FeeItem {
  ADMISSION_ID: string;
  Total_Amount: number;
  Balance_Amount: number;
  feeheadId: number; // Used for ordering - lower IDs must be paid first
  interval: string;
  feehead: string; // Fee head name (e.g., "Tuition Fee", "Lab Fee")
  feetype?: string;
  Year_Id?: string;
  CLASS_ID?: string;
  CLASSSEC?: string;
  NAME?: string;
}

export interface FeeDetailsRequest {
  adno: string;
  interval: string;
}

export interface FeeDetailsData {
  FEE_DETAILS: FeeItem[];
  TOT_AMOUNT: number;
}

export interface FeeDetailsResponse extends ApiResponse<never> {
  Student_details: FeeDetailsData;
}

// ============================================
// Fee Installment Types (POST /payments/getFeeInstallment)
// ============================================

export interface FeeInstallment {
  id: number;
  installment_name: string;
  Year_Id: string;
  status: string;
}

export interface InstallmentAmount {
  interval: string;
  amt: number;
}

export interface FeeInstallmentResponse extends ApiResponse<FeeInstallment[]> {
  data1?: InstallmentAmount[];
}

// ============================================
// Payment History Types (POST /payments/getStudentPayHistory)
// ============================================

export interface PaymentHistoryItem {
  FEE_REC_DET_ID: number;
  RECPID: number;
  RECPNO: string;
  PAY_ID: string;
  FEE_HEAD: string;
  YEAR_ID: number;
  FEE_TYPE: string;
  DATE: string;
  PAID_AMOUNT: number;
}

export interface PaymentHistoryData {
  TOT_HISTORY: number;
  FEE_HISTORY: Record<string, PaymentHistoryItem[]>; // Grouped by RECEIPT_ID
}

export interface PaymentHistoryRequest {
  adno: string;
  CLASS_ID: string;
}

export interface PaymentHistoryResponse extends ApiResponse<never> {
  Student_History: PaymentHistoryData;
}

// ============================================
// Pay Enable Check Types (POST /payments/getPayEnable)
// ============================================

export interface PayEnableRequest {
  adno: string;
}

export interface PayEnableResponse {
  status: boolean;
  message: string; // "Pay Current Year fees" or "Fees defaulter for Last Year"
}

// ============================================
// Online Payment Types (POST /payments/payOnline)
// ============================================

export interface PayOnlineRequest {
  admission_id: string;
  payment_amount: string;
  mobile_no: string;
  token: string;
}

export interface PayOnlineResponse extends ApiResponse<number> {} // Returns merchant ID

// ============================================
// Update Order ID Types (POST /payments/updateOrderId)
// ============================================

/**
 * Which gateway the backend used for this order. Chosen per school (per dbname)
 * on the server — schools with Razorpay credentials get RAZORPAY, the rest stay
 * on PhonePe. The app never picks the gateway itself.
 */
export type PaymentGateway = 'PHONEPE' | 'RAZORPAY';

/** PhonePe only: INTENT opens the UPI app directly, PG_CHECKOUT uses a WebView. */
export type PaymentFlowType = 'PG_CHECKOUT' | 'INTENT';

export interface UpdateOrderRequest {
  token: string;
  amount: string;
  FEE_DETAILS: FeeItem[];
  id: number;
  paymentFlowType?: PaymentFlowType;
}

export interface PhonePeOrderData {
  gateway?: 'PHONEPE';
  orderId: string;
  expireAt: string;
  redirectUrl: string;
  intentUrl?: string;
  state: string;
}

/**
 * Everything the Razorpay checkout sheet needs. `keyId` is the PUBLIC key —
 * the key secret stays on the backend and is never sent to the app.
 */
export interface RazorpayOrderData {
  gateway: 'RAZORPAY';
  orderId: string; // Razorpay order id (order_xxx)
  merchantOrderId: string; // Our `razorpay` table row id
  keyId: string;
  amount: number; // In paise
  currency: string;
  name: string;
  description: string;
  themeColor: string;
  prefill: {
    name: string;
    contact: string;
    email: string;
  };
  notes: Record<string, string>;
}

export type UpdateOrderData = PhonePeOrderData | RazorpayOrderData;

export interface UpdateOrderResponse extends ApiResponse<UpdateOrderData> {}

// ============================================
// Razorpay Verification (POST /payments/verifyRazorpayPayment)
// ============================================

/** The fields the Razorpay checkout sheet hands back on success. */
export interface RazorpayCheckoutSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyRazorpayPaymentRequest extends RazorpayCheckoutSuccess {
  merchantOrderId: number;
}

export interface VerifyRazorpayPaymentData {
  merchantOrderId: number;
  orderId: string;
  paymentId: string;
  amount: number;
  paymentState: PaymentState;
}

export interface VerifyRazorpayPaymentResponse
  extends ApiResponse<VerifyRazorpayPaymentData> {}

// ============================================
// Payment Status Types (POST /payments/checkPaymentStatus)
// ============================================

export type PaymentState = 'success' | 'failed' | 'pending';

export interface CheckPaymentStatusData {
  merchantOrderId: number;
  orderId: string;
  paymentId: string | null;
  amount: number;
  paymentState: PaymentState;
  rawStatus: string | null;
}

export interface CheckPaymentStatusResponse
  extends ApiResponse<CheckPaymentStatusData> {}

// ============================================
// Print Bill Types (POST /payments/getPrintBill)
// ============================================

export interface PrintBillRequest {
  rid: string;
  payment_id: string;
  adno: string;
  name: string;
  className: string;
}

export interface PrintBillResponse extends ApiResponse<string> {} // Returns PDF URL

// ============================================
// Academic Year Types (GET /payments/getYearId)
// ============================================

export interface AcademicYear {
  YearId: string;
  AcademicYear: string;
}

export interface AcademicYearResponse extends ApiResponse<AcademicYear[]> {}

// ============================================
// Fee Defaulter Types (POST /payments/checkFeesDefaulter)
// ============================================

export interface FeeDefaulterRequest {
  yearid: string;
  adno: string;
}

export interface DefaulterData {
  bal: number;
  Year_Id: string;
}

export interface FeeDefaulterResponse extends ApiResponse<DefaulterData[]> {
  message: 'Defaulter' | 'No Defaulter';
}

// ============================================
// UI State Types for Sequential Payment Selection
// ============================================

export interface SelectableFeeItem extends FeeItem {
  isSelected: boolean;
  isSelectable: boolean; // Based on sequential order rule
  order: number; // Display order (same as feeheadId)
}

export interface FeeSelectionState {
  fees: SelectableFeeItem[];
  selectedFeeIds: number[]; // Array of feeheadIds
  totalSelectedAmount: number;
  canProceedToPayment: boolean;
}

// ============================================
// Fee Summary for Dashboard
// ============================================

export interface FeeSummary {
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  hasPendingFees: boolean;
  pendingFeesCount: number;
}
