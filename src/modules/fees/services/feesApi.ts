import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';
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
      console.log('=== feesApi.getStudentPayDetails ===');
      console.log('Request params:', { adno, interval });
      const response = await apiClient.post<FeeDetailsResponse>(
        API_ENDPOINTS.PAYMENTS.GET_STUDENT_PAY_DETAILS,
        { adno, interval }
      );
      console.log('Response status:', response.status);
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
      console.log('=== feesApi.getStudentPayHistory ===');
      console.log('Request params:', { adno, CLASS_ID: classId });
      const response = await apiClient.post<PaymentHistoryResponse>(
        API_ENDPOINTS.PAYMENTS.GET_STUDENT_PAY_HISTORY,
        { adno, CLASS_ID: classId }
      );
      console.log('Response status:', response.status);
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
};
