import { useState } from 'react';
import { authService } from '../../../core/auth/authService';

interface UseForgotPasswordReturn {
  forgotPassword: (mobileNumber: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
}

export const useForgotPassword = (): UseForgotPasswordReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const forgotPassword = async (mobileNumber: string) => {
    try {
      setIsLoading(true);

      const response = await authService.forgotPassword(mobileNumber);

      return {
        success: response.status,
        message: response.message,
      };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Something went wrong. Please try again.';
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    forgotPassword,
    isLoading,
  };
};
