import { useState } from 'react';
import { authService } from '../../../core/auth/authService';
import { useAuth } from '../../../core/auth';
import { Student } from '../../../core/api/apiTypes';

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
        await login(response.token, userDataWithMobile);

        // Get students list using installId
        try {
          const studentsResponse = await authService.getStudents(installId || '');
          if (studentsResponse.status && studentsResponse.data) {
            console.log('=== FETCHING STUDENT PHOTOS ===');
            console.log('Number of students:', studentsResponse.data.length);

            // API returns fields from v_mobileapp view: SNAME, ADMISSION_ID, ADNO, CLASS, SECTION, etc.
            const students: Student[] = await Promise.all(
              studentsResponse.data.map(async (s: any, index: number) => {
                console.log(`=== STUDENT ${index + 1} RAW DATA ===`);
                console.log('Full student object:', JSON.stringify(s));
                console.log('ADNO:', s.ADNO);
                console.log('ADMISSION_ID:', s.ADMISSION_ID);
                console.log('studentId:', s.studentId);
                console.log('id:', s.id);

                const adno = String(s.ADNO || s.ADMISSION_ID || s.studentId || s.id || '');
                console.log(`Resolved ADNO for photo fetch: "${adno}"`);

                // Fetch student photo
                let photoBase64 = null;
                try {
                  photoBase64 = await authService.getStudentPhoto(adno);
                  console.log(`Photo fetched for ${s.SNAME}:`, photoBase64 ? 'SUCCESS' : 'NULL');
                } catch (photoError) {
                  console.error(`Error fetching photo for student ${adno}:`, photoError);
                }

                // Get CLASSSEC (e.g., "VI-A") - keep it whole for display
                const classSec = s.CLASSSEC || s.classSec || '';

                // Parse for section extraction if needed
                let parsedClass = classSec;
                let parsedSection = '';

                if (classSec && classSec.includes('-')) {
                  const parts = classSec.split('-');
                  parsedClass = parts[0]?.trim() || classSec;
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
                };
              })
            );

            console.log('=== STUDENTS WITH PHOTOS ===');
            students.forEach((student, i) => {
              console.log(`Student ${i + 1}: ${student.name}, Has Photo: ${!!student.photo}`);
            });

            await setStudents(students);
          }
        } catch (studentsError) {
          console.error('Error fetching students:', studentsError);
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
      const errorMessage = err.response?.data?.message || 'Verification failed. Please try again.';
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
