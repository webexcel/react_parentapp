import ReactNativeBlobUtil from 'react-native-blob-util';
import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
import { downloadPdf } from '../../../core/api/downloadPdf';
import {
  FeeDetailsResponse,
  FeeInstallmentResponse,
  PaymentHistoryResponse,
  PayEnableResponse,
  PayOnlineRequest,
  PayOnlineResponse,
  UpdateOrderRequest,
  UpdateOrderResponse,
  PrintBillRequest,
  PrintBillResponse,
  AcademicYearResponse,
  FeeDefaulterResponse,
  CheckPaymentStatusResponse,
} from '../types/fees.types';

export const feesApi = {
  /**
   * Get student fee details for a specific interval/installment
   * Returns fees ordered by feeheadId (payment order)
   */
  getStudentPayDetails: async (
    adno: string,
    interval: string = '0'
  ): Promise<FeeDetailsResponse> => {
    try {
      const response = await apiClient.post<FeeDetailsResponse>(
        API_ENDPOINTS.PAYMENTS.GET_STUDENT_PAY_DETAILS,
        { adno, interval }
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no fee details exist - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No fee details',
          Student_details: {
            FEE_DETAILS: [],
            TOT_AMOUNT: 0,
          },
        };
      }
      throw error;
    }
  },

  /**
   * Check if payment is enabled for student
   * Returns false if student has outstanding balance from previous years
   */
  getPayEnable: async (adno: string): Promise<PayEnableResponse> => {
    const response = await apiClient.post<PayEnableResponse>(
      API_ENDPOINTS.PAYMENTS.GET_PAY_ENABLE,
      { adno }
    );
    return response.data;
  },

  /**
   * Get fee installment details
   */
  getFeeInstallment: async (adno: string): Promise<FeeInstallmentResponse> => {
    const response = await apiClient.post<FeeInstallmentResponse>(
      API_ENDPOINTS.PAYMENTS.GET_FEE_INSTALLMENT,
      { adno }
    );
    return response.data;
  },

  /**
   * Get student payment history
   * Returns payments grouped by receipt ID
   */
  getStudentPayHistory: async (
    adno: string,
    classId: string
  ): Promise<PaymentHistoryResponse> => {
    try {
      const response = await apiClient.post<PaymentHistoryResponse>(
        API_ENDPOINTS.PAYMENTS.GET_STUDENT_PAY_HISTORY,
        { adno, CLASS_ID: classId }
      );
      return response.data;
    } catch (error: any) {
      // Backend returns 400 when no payment history exists - treat as empty data
      if (error.response?.status === 400) {
        return {
          status: false,
          message: error.response?.data?.message || 'No payment history',
          Student_History: {
            FEE_HISTORY: {},
            TOT_HISTORY: 0,
          },
        };
      }
      throw error;
    }
  },

  /**
   * Initiate online payment
   * Creates a merchant entry and returns merchant ID
   */
  payOnline: async (data: PayOnlineRequest): Promise<PayOnlineResponse> => {
    const response = await apiClient.post<PayOnlineResponse>(
      API_ENDPOINTS.PAYMENTS.PAY_ONLINE,
      data
    );
    return response.data;
  },

  /**
   * Update order ID with payment gateway details
   */
  updateOrderId: async (data: UpdateOrderRequest): Promise<UpdateOrderResponse> => {
    const response = await apiClient.post<UpdateOrderResponse>(
      API_ENDPOINTS.PAYMENTS.UPDATE_ORDER_ID,
      data
    );
    return response.data;
  },

  /**
   * Get print bill PDF URL
   */
  getPrintBill: async (data: PrintBillRequest): Promise<PrintBillResponse> => {
    const response = await apiClient.post<PrintBillResponse>(
      API_ENDPOINTS.PAYMENTS.GET_PRINT_BILL,
      data
    );
    return response.data;
  },

  /**
   * Downloads the fee bill PDF for a receipt into the app cache.
   * Returns the local file path; throws with the backend's message when the
   * response isn't a PDF (e.g. the school has no fee bill template yet).
   */
  downloadFeeBill: (receiptID: string, yearid: number): Promise<string> =>
    downloadPdf(
      API_ENDPOINTS.PAYMENTS.GET_FEE_BILL,
      { receiptID, yearid },
      `${ReactNativeBlobUtil.fs.dirs.CacheDir}/fee_receipt_${receiptID}.pdf`,
      'Could not load the receipt. Please try again.'
    ),

  /**
   * Get list of academic years
   */
  getAcademicYears: async (): Promise<AcademicYearResponse> => {
    const response = await apiClient.get<AcademicYearResponse>(
      API_ENDPOINTS.PAYMENTS.GET_YEAR_ID
    );
    return response.data;
  },

  /**
   * Check if student is a fee defaulter
   */
  checkFeesDefaulter: async (
    yearid: string,
    adno: string
  ): Promise<FeeDefaulterResponse> => {
    const response = await apiClient.post<FeeDefaulterResponse>(
      API_ENDPOINTS.PAYMENTS.CHECK_FEES_DEFAULTER,
      { yearid, adno }
    );
    return response.data;
  },

  /**
   * Check payment status (for UPI intent flow)
   * Polls the razorpay table status after user returns from UPI app
   */
  checkPaymentStatus: async (
    merchantOrderId: number
  ): Promise<CheckPaymentStatusResponse> => {
    const response = await apiClient.post<CheckPaymentStatusResponse>(
      API_ENDPOINTS.PAYMENTS.CHECK_PAYMENT_STATUS,
      { merchantOrderId }
    );
    return response.data;
  },
};
