import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, UserData } from '../api/apiTypes';
import { AuthContextType, AuthState } from './authTypes';
import {
  setAuthToken,
  getAuthToken,
  setUserData as storeUserData,
  getUserData,
  setStudents as storeStudents,
  getStudents,
  setSelectedStudent as storeSelectedStudent,
  getSelectedStudent,
  clearAuthData,
} from '../storage/secureStorage';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  token: null,
  userData: null,
  students: [],
  selectedStudentId: null,
  requiresPasswordSetup: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  const checkAuth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const token = await getAuthToken();
      const userData = await getUserData();
      const students = await getStudents();
      const selectedStudentId = await getSelectedStudent();

      if (token && userData) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          token,
          userData: userData as UserData,
          students: students || [],
          selectedStudentId: selectedStudentId || (students?.[0]?.id || null),
        });
      } else {
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setState({
        ...initialState,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (token: string, userData: UserData, hasPassword?: boolean) => {
    await setAuthToken(token);
    await storeUserData(userData);

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      token,
      userData,
      requiresPasswordSetup: hasPassword === false,
    }));
  };

  const logout = async () => {
    await clearAuthData();
    setState({
      ...initialState,
      isLoading: false,
    });
  };

  const setStudents = async (students: Student[]) => {
    await storeStudents(students);
    const selectedId = students.length > 0 ? students[0].id : null;
    if (selectedId) {
      await storeSelectedStudent(selectedId);
    }

    setState((prev) => ({
      ...prev,
      students,
      selectedStudentId: selectedId,
    }));
  };

  const selectStudent = async (studentId: string) => {
    await storeSelectedStudent(studentId);
    setState((prev) => ({
      ...prev,
      selectedStudentId: studentId,
    }));
  };

  const completePasswordSetup = () => {
    setState((prev) => ({
      ...prev,
      requiresPasswordSetup: false,
    }));
  };

  const refreshStudentPhotos = async () => {
    // Import authService dynamically to avoid circular dependency
    const { authService } = await import('./authService');

    if (state.students.length === 0) return;

    console.log('=== REFRESHING STUDENT PHOTOS ===');
    const updatedStudents = await Promise.all(
      state.students.map(async (student) => {
        try {
          const photo = await authService.getStudentPhoto(student.studentId);
          return { ...student, photo: photo || '' };
        } catch (error) {
          console.error(`Error refreshing photo for ${student.name}:`, error);
          return student;
        }
      })
    );

    await setStudents(updatedStudents);
    console.log('=== PHOTOS REFRESHED ===');
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    setStudents,
    selectStudent,
    checkAuth,
    refreshStudentPhotos,
    completePasswordSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
