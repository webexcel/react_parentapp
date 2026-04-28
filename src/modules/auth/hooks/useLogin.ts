import { useState } from 'react';
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
      const errorMessage = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
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
