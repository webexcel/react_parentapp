import { useState } from 'react';
import { Alert } from 'react-native';
import { authService } from '../../../core/auth/authService';

interface UseLoginReturn {
  sendOtp: (mobileNumber: string) => Promise<{ success: boolean; installId?: string; message?: string }>;
  isLoading: boolean;
  error: string | null;
}

export const useLogin = (): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (mobileNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.sendOtp({
        mobileNumber,
        deviceType: 'parent_app',
      });

      if (response.status) {
        return {
          success: true,
          installId: response.installId,
        };
      } else {
        setError(response.message || 'Failed to send OTP');
        return {
          success: false,
          message: response.message,
        };
      }
    } catch (err: any) {
      // Show detailed error for debugging
      const debugInfo = `
Error: ${err.message}
Status: ${err.response?.status || 'N/A'}
Data: ${JSON.stringify(err.response?.data || {})}
URL: ${err.config?.baseURL}${err.config?.url}
Request: ${JSON.stringify(err.config?.data || {})}
      `.trim();
      Alert.alert('Debug Error', debugInfo);

      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendOtp,
    isLoading,
    error,
  };
};
