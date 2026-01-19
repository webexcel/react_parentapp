import { Platform } from 'react-native';
import { apiClient, API_ENDPOINTS } from '../api';
import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  GetStudentsResponse,
} from '../api/apiTypes';
import { currentBrand } from '../brand/BrandConfig';

export const authService = {
  /**
   * Send OTP to mobile number
   */
  sendOtp: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
    // Transform to API expected format
    const requestBody = {
      mobile_no: data.mobileNumber,
      platform_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
      manufacturer_name: 'React Native',
      manufacturer_model: Platform.OS,
      os_version: Platform.Version?.toString() || '',
      app_version_code: '100',
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
   * Update FCM token for push notifications
   */
  updateFcmToken: async (fcmToken: string, mobileNumber: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.UPDATE_FCM_TOKEN, {
      firebaseId: fcmToken,
      mobileNumber,
    });
  },
};
