import { useState } from 'react';
import { authService } from '../../../core/auth/authService';
import { useAuth } from '../../../core/auth';
import { Student } from '../../../core/api/apiTypes';
import { getBrandConfig } from '../../../core/brand';

interface UseOtpVerificationReturn {
  verifyOtp: (mobileNumber: string, otp: string, installId?: string) => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
  error: string | null;
}

export const useOtpVerification = (): UseOtpVerificationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, setStudents } = useAuth();

  const verifyOtp = async (mobileNumber: string, otp: string, installId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify OTP
      const response = await authService.verifyOtp({
        mobileNumber,
        otp,
        installId,
      });

      if (response.status && response.token && response.userdata) {
        // Login successful - store token and user data with mobile number
        const userDataWithMobile = {
          ...response.userdata,
          mobileNumber,
        };
        // Only require password setup for brands that use password auth (e.g. pssenior)
        const brandConfig = getBrandConfig();
        const authType = brandConfig.auth.type;
        const hasPassword = authType === 'password' || authType === 'both'
          ? (response.data?.hasPassword !== undefined ? response.data.hasPassword : true)
          : true; // OTP-only brands never need password setup
        await login(response.token, userDataWithMobile, hasPassword);

        // Update FCM token to backend after successful login
        try {
          const { fcmService } = await import('../../../core/notifications');
          const fcmToken = await fcmService.getToken();

          if (fcmToken) {
            await authService.updateFcmToken(fcmToken, mobileNumber);
          }
        } catch (fcmError) {
          // Don't fail login if FCM update fails
        }

        // Get students list using installId
        try {
          const studentsResponse = await authService.getStudents(installId || '');
          if (studentsResponse.status && studentsResponse.data) {
            // API returns fields from v_mobileapp view: SNAME, ADMISSION_ID, ADNO, CLASS, SECTION, etc.
            // Map API response to Student objects
            const students: Student[] = await Promise.all(
              studentsResponse.data.map(async (s: any) => {
                const adno = String(s.ADNO || s.ADMISSION_ID || s.studentId || s.id || '');

                // Fetch student photo
                let photoBase64 = null;
                try {
                  photoBase64 = await authService.getStudentPhoto(adno);
                } catch (photoError) {
                  // Photo fetch failed - continue without photo
                }

                // Get CLASSSEC (e.g., "VI-A") - keep it whole for display
                const classSec = s.CLASSSEC || s.classSec || '';

                // Parse for section extraction if needed
                let parsedSection = '';
                if (classSec && classSec.includes('-')) {
                  const parts = classSec.split('-');
                  parsedSection = parts[1]?.trim() || '';
                }

                return {
                  id: adno,
                  studentId: adno,
                  name: s.SNAME || s.sname || s.name || s.studentName || s.STUDENT_NAME || '',
                  className: classSec || s.CLASS || s.class || s.className || s.CLASS_NAME || '',
                  section: parsedSection || s.SECTION || s.section || '',
                  rollNo: s.ROLL_NO || s.rollNo || '',
                  admissionNo: adno,
                  photo: photoBase64 || '',
                  schoolName: s.schoolName || '',
                  dbname: s.dbname || response.userdata?.dbname || '',
                  classId: String(s.CLASS_ID || s.classId || ''),
                  examgrpid: s.examgrpid || s.EXAMGRPID || s.ExamGrpId || null,
                };
              })
            );

            await setStudents(students);
          }
        } catch (studentsError) {
          // Continue even if students fetch fails - user is still logged in
        }

        return { success: true };
      } else {
        setError(response.message || 'Invalid OTP');
        return {
          success: false,
          message: response.message || 'Invalid OTP',
        };
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
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
    verifyOtp,
    isLoading,
    error,
  };
};
