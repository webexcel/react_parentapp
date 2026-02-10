import { Student, UserData } from '../api/apiTypes';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userData: UserData | null;
  students: Student[];
  selectedStudentId: string | null;
  requiresPasswordSetup: boolean;
}

export interface AuthContextType extends AuthState {
  login: (token: string, userData: UserData, hasPassword?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setStudents: (students: Student[]) => Promise<void>;
  selectStudent: (studentId: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshStudentPhotos: () => Promise<void>;
  completePasswordSetup: () => void;
}

export interface LoginCredentials {
  mobileNumber: string;
}

export interface OtpCredentials {
  mobileNumber: string;
  otp: string;
  installId?: string;
}
