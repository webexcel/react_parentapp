import { useState } from 'react';
import { authService } from '../../../core/auth/authService';
import { useAuth } from '../../../core/auth';
import { Student } from '../../../core/api/apiTypes';

interface UsePasswordLoginReturn {
    verifyPassword: (mobileNumber: string, password: string, installId?: string) => Promise<{ success: boolean; message?: string }>;
    isLoading: boolean;
    error: string | null;
}

export const usePasswordLogin = (): UsePasswordLoginReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, setStudents } = useAuth();

    const verifyPassword = async (mobileNumber: string, password: string, installId?: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Verify password (uses same endpoint as OTP - password is the admission number)
            const response = await authService.verifyOtp({
                mobileNumber,
                otp: password, // Password is used as OTP (admission number)
                installId,
            });

            if (response.status && response.token && response.userdata) {
                // Login successful - store token and user data with mobile number
                const userDataWithMobile = {
                    ...response.userdata,
                    mobileNumber,
                };
                // Pass hasPassword flag to determine if password setup is needed
                const hasPassword = response.data?.hasPassword !== undefined ? response.data.hasPassword : true;
                await login(response.token, userDataWithMobile, hasPassword);

                // Get students list using installId
                try {
                    const studentsResponse = await authService.getStudents(installId || '');
                    if (studentsResponse.status && studentsResponse.data) {
                        // Map API response to Student objects
                        const students: Student[] = await Promise.all(
                            studentsResponse.data.map(async (s: any) => {
                                const adno = String(s.ADNO || s.ADMISSION_ID || s.studentId || s.id || '');

                                // Fetch student photo
                                let photoBase64 = null;
                                try {
                                    photoBase64 = await authService.getStudentPhoto(adno);
                                } catch (photoError) {
                                    console.error(`Error fetching photo for student ${adno}:`, photoError);
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
                    console.error('Error fetching students:', studentsError);
                    // Continue even if students fetch fails - user is still logged in
                }

                return { success: true };
            } else {
                setError(response.message || 'Invalid password');
                return {
                    success: false,
                    message: response.message || 'Invalid password',
                };
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
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
        verifyPassword,
        isLoading,
        error,
    };
};
