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
    console.log('=== SEND OTP REQUEST ===');
    console.log('URL:', API_ENDPOINTS.AUTH.SEND_OTP);
    console.log('Body:', JSON.stringify(requestBody));
    try {
      const response = await apiClient.post<SendOtpResponse>(
        API_ENDPOINTS.AUTH.SEND_OTP,
        requestBody
      );
      console.log('=== SEND OTP RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data));
      // Map response to expected format
      return {
        status: response.data.status,
        message: response.data.message,
        installId: response.data.data?.id,
      };
    } catch (error: any) {
      console.log('=== SEND OTP ERROR ===');
      console.log('Error:', error.message);
      console.log('Response:', JSON.stringify(error.response?.data));
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
    console.log('=== VERIFY OTP REQUEST ===');
    console.log('Body:', JSON.stringify(requestBody));
    const response = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      requestBody
    );
    console.log('=== VERIFY OTP RESPONSE ===');
    console.log('Response:', JSON.stringify(response.data));
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
    console.log('=== GET STUDENTS REQUEST ===');
    console.log('Body:', JSON.stringify({ id: installId }));
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.GET_STUDENTS,
        { id: installId }
      );
      console.log('=== GET STUDENTS RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.log('=== GET STUDENTS ERROR ===');
      console.log('Error:', error.message);
      console.log('Response:', JSON.stringify(error.response?.data));
      throw error;
    }
  },

  /**
   * Get student photo
   * @param adno - Student admission number
   */
  getStudentPhoto: async (adno: string): Promise<string | null> => {
    try {
      console.log('=== GET STUDENT PHOTO REQUEST ===');
      console.log('Admission Number:', adno);
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GET_STUDENT_PHOTO, {
        adno,
      });
      console.log('=== GET STUDENT PHOTO RESPONSE ===');
      console.log('Full Response:', JSON.stringify(response.data));
      console.log('Status:', response.data?.status);
      console.log('Message:', response.data?.message);

      const photoData = response.data?.data;
      console.log('Has Photo Data:', !!photoData);
      console.log('Photo Data Type:', typeof photoData);
      console.log('Photo Data Length:', photoData?.length || 0);

      if (photoData && typeof photoData === 'string' && photoData.length > 0) {
        console.log('Photo Data Preview (first 100 chars):', photoData.substring(0, 100));

        // Check if it's already a data URI
        if (photoData.startsWith('data:image/')) {
          console.log('Photo is already a data URI');
          return photoData;
        }

        // If it's raw base64, add the data URI prefix
        // Assume JPEG format by default (most common)
        console.log('Converting raw base64 to data URI');
        return `data:image/jpeg;base64,${photoData}`;
      }

      console.log('No photo found - API message:', response.data?.message);
      return null;
    } catch (error: any) {
      console.error('=== GET STUDENT PHOTO ERROR ===');
      console.error('Error:', error.message);
      console.error('Response:', error.response?.data);
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
    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('URL:', API_ENDPOINTS.AUTH.FORGOT_PASSWORD);
    console.log('Body:', JSON.stringify(requestBody));
    try {
      const response = await apiClient.post<ForgotPasswordResponse>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        requestBody
      );
      console.log('=== FORGOT PASSWORD RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data));
      return {
        status: response.data.status,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      console.log('=== FORGOT PASSWORD ERROR ===');
      console.log('Error:', error.message);
      console.log('Response:', JSON.stringify(error.response?.data));
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
    console.log('=== CREATE PASSWORD REQUEST ===');
    console.log('URL:', API_ENDPOINTS.AUTH.CREATE_PASSWORD);
    console.log('Body:', JSON.stringify({ ...requestBody, password: '***' }));
    try {
      const response = await apiClient.post<CreatePasswordResponse>(
        API_ENDPOINTS.AUTH.CREATE_PASSWORD,
        requestBody
      );
      console.log('=== CREATE PASSWORD RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data));
      return {
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error: any) {
      console.log('=== CREATE PASSWORD ERROR ===');
      console.log('Error:', error.message);
      console.log('Response:', JSON.stringify(error.response?.data));
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
    console.log('=== CHANGE PASSWORD REQUEST ===');
    console.log('URL:', API_ENDPOINTS.AUTH.CHANGE_PASSWORD);
    console.log('Body:', JSON.stringify({ ...requestBody, old_password: '***', new_password: '***' }));
    try {
      const response = await apiClient.post<ChangePasswordResponse>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        requestBody
      );
      console.log('=== CHANGE PASSWORD RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data));
      return {
        status: response.data.status,
        message: response.data.message,
      };
    } catch (error: any) {
      console.log('=== CHANGE PASSWORD ERROR ===');
      console.log('Error:', error.message);
      console.log('Response:', JSON.stringify(error.response?.data));
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
    console.log('===========================================');
    console.log('=== UPDATE FCM TOKEN REQUEST ===');
    console.log('Endpoint:', API_ENDPOINTS.AUTH.UPDATE_FCM_TOKEN);
    console.log('Database:', currentBrand.api.databaseName);
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    console.log('===========================================');
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.UPDATE_FCM_TOKEN, requestBody);
      console.log('===========================================');
      console.log('=== UPDATE FCM TOKEN SUCCESS ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('===========================================');
      return true;
    } catch (error: any) {
      console.log('===========================================');
      console.log('=== UPDATE FCM TOKEN ERROR ===');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
      console.log('===========================================');
      // Don't throw - just return false
      return false;
    }
  },
};
