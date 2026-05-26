import { Platform } from 'react-native';
import { apiClient, API_ENDPOINTS } from '../api';
import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  GetStudentsResponse,
  ForgotPasswordResponse,
  CreatePasswordResponse,
  ChangePasswordResponse,
} from '../api/apiTypes';
import { currentBrand } from '../brand/BrandConfig';

export const authService = {
  /**
   * Send OTP to mobile number
   */
  sendOtp: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
    // Get version code from package.json
    const packageJson = require('../../../package.json');
    const versionCode = packageJson.version.split('.').pop() || '1';

    // Transform to API expected format
    const requestBody = {
      mobile_no: data.mobileNumber,
      platform_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
      manufacturer_name: 'React Native',
      manufacturer_model: Platform.OS,
      os_version: Platform.Version?.toString() || '',
      app_version_code: versionCode,
      dbname: currentBrand.api.databaseName,
    };
    try {
      const response = await apiClient.post<SendOtpResponse>(
        API_ENDPOINTS.AUTH.SEND_OTP,
        requestBody
      );
      // Map response to expected format
      return {
        status: response.data.status,
        message: response.data.message,
        installId: response.data.data?.id,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Verify OTP and get auth token
   */
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    // Transform to API expected format
    const requestBody = {
      id: data.installId,
      otp: data.otp,
      dbname: currentBrand.api.databaseName,
    };
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      requestBody
    );
    // Map response to expected format
    return {
      status: response.data.status,
      message: response.data.message,
      token: response.data.data?.token,
      userdata: response.data.userdata,
      data: response.data.data,
    };
  },

  /**
   * Get list of students linked to parent
   * @param installId - The install ID from OTP verification
   */
  getStudents: async (installId: string): Promise<GetStudentsResponse> => {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.GET_STUDENTS,
        { id: installId }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get student photo
   * @param adno - Student admission number
   */
  getStudentPhoto: async (adno: string): Promise<string | null> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GET_STUDENT_PHOTO, {
        adno,
      });

      const photoData = response.data?.data;

      if (photoData && typeof photoData === 'string' && photoData.length > 0) {
        // Check if it's already a data URI
        if (photoData.startsWith('data:image/')) {
          return photoData;
        }

        // If it's raw base64, add the data URI prefix
        // Assume JPEG format by default (most common)
        return `data:image/jpeg;base64,${photoData}`;
      }

      return null;
    } catch (error: any) {
      return null;
    }
  },

  /**
   * Forgot password - sends password to registered email
   */
  forgotPassword: async (mobileNumber: string): Promise<ForgotPasswordResponse> => {
    const requestBody = {
      mobile_no: mobileNumber,
      dbname: currentBrand.api.databaseName,
    };
    try {
      const response = await apiClient.post<ForgotPasswordResponse>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        requestBody
      );
      return {
        status: response.data.status,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      // Return the error response from backend if available
      if (error.response?.data) {
        return {
          status: error.response.data.status ?? false,
          message: error.response.data.message || 'Something went wrong',
          data: error.response.data.data,
        };
      }
      return {
        status: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  /**
   * Create password for first-time parent login
   */
  createPassword: async (password: string, mobileNumber: string): Promise<CreatePasswordResponse> => {
    const requestBody = {
      password,
      mobile_no: mobileNumber,
      dbname: currentBrand.api.databaseName,
    };
    try {
      const response = await apiClient.post<CreatePasswordResponse>(
        API_ENDPOINTS.AUTH.CREATE_PASSWORD,
        requestBody
      );
      return {
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error: any) {
      if (error.response?.data) {
        return {
          status: error.response.data.status ?? false,
          message: error.response.data.message || 'Something went wrong',
        };
      }
      return {
        status: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  /**
   * Change password for authenticated parent
   */
  changePassword: async (oldPassword: string, newPassword: string, mobileNumber: string): Promise<ChangePasswordResponse> => {
    const requestBody = {
      old_password: oldPassword,
      new_password: newPassword,
      mobile_no: mobileNumber,
      dbname: currentBrand.api.databaseName,
    };
    try {
      const response = await apiClient.post<ChangePasswordResponse>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        requestBody
      );
      return {
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error: any) {
      if (error.response?.data) {
        return {
          status: error.response.data.status ?? false,
          message: error.response.data.message || 'Something went wrong',
        };
      }
      return {
        status: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  /**
   * Update FCM token for push notifications
   */
  updateFcmToken: async (fcmToken: string, mobileNumber: string): Promise<boolean> => {
    const requestBody = {
      firebase_id: fcmToken,
      mobile_no: mobileNumber,
      dbname: currentBrand.api.databaseName,
    };
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.UPDATE_FCM_TOKEN, requestBody);
      return true;
    } catch (error: any) {
      // Don't throw - just return false
      return false;
    }
  },
};
