// Base API Response
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
}

// Auth Response with token
export interface AuthResponse {
  status: boolean;
  message: string;
  token?: string;
  userdata?: UserData;
  data?: any;
}

export interface UserData {
  dbname: string;
  UserId: string;
  user_name: string;
  mobileNumber?: string;
  mobile_number?: string;
}

// OTP Request/Response
export interface SendOtpRequest {
  mobileNumber: string;
  deviceId?: string;
  deviceType?: string;
}

export interface SendOtpResponse extends ApiResponse {
  installId?: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
  installId?: string;
}

export interface VerifyOtpResponse extends AuthResponse {}

// Student
export interface Student {
  id: string;
  studentId: string;
  name: string;
  className: string;
  section?: string;
  rollNo?: string;
  admissionNo?: string;
  photo?: string | null;
  schoolName?: string;
  dbname?: string;
  classId?: string;
  examgrpid?: number | null;  // Exam Group ID for report cards (from student_class_map)
}

export interface GetStudentsResponse extends ApiResponse<Student[]> {}

// Forgot Password
export interface ForgotPasswordRequest {
  mobile_no: string;
  dbname: string;
}

export interface ForgotPasswordResponse {
  status: boolean;
  message: string;
  data?: string;
}

// Create Password
export interface CreatePasswordRequest {
  password: string;
  dbname: string;
  mobile_no: string;
}

export interface CreatePasswordResponse {
  status: boolean;
  message: string;
}

// Change Password
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  dbname: string;
  mobile_no: string;
}

export interface ChangePasswordResponse {
  status: boolean;
  message: string;
}

// Error Response
export interface ApiError {
  status: boolean;
  message: string;
  code?: string;
}
