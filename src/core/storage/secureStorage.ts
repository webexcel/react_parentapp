import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/keys';

// Note: For production, use react-native-encrypted-storage or expo-secure-store
// Using AsyncStorage as fallback for development

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setUserData = async (userData: object): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const getUserData = async (): Promise<object | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const setStudents = async (students: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (error) {
    console.error('Error saving students:', error);
    throw error;
  }
};

export const getStudents = async (): Promise<any[] | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting students:', error);
    return null;
  }
};

export const setSelectedStudent = async (studentId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_STUDENT, studentId);
  } catch (error) {
    console.error('Error saving selected student:', error);
    throw error;
  }
};

export const getSelectedStudent = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT);
  } catch (error) {
    console.error('Error getting selected student:', error);
    return null;
  }
};

export const setStudentPhotos = async (photos: Record<string, string>): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_PHOTOS, JSON.stringify(photos));
  } catch (error) {
    console.error('Error saving student photos:', error);
    throw error;
  }
};

export const getStudentPhotos = async (): Promise<Record<string, string> | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_PHOTOS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting student photos:', error);
    return null;
  }
};

export const setStudentPhoto = async (studentId: string, photoBase64: string): Promise<void> => {
  try {
    const photos = await getStudentPhotos() || {};
    photos[studentId] = photoBase64;
    await setStudentPhotos(photos);
  } catch (error) {
    console.error('Error saving student photo:', error);
    throw error;
  }
};

export const getStudentPhoto = async (studentId: string): Promise<string | null> => {
  try {
    const photos = await getStudentPhotos();
    return photos?.[studentId] || null;
  } catch (error) {
    console.error('Error getting student photo:', error);
    return null;
  }
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.STUDENTS,
      STORAGE_KEYS.SELECTED_STUDENT,
      STORAGE_KEYS.STUDENT_PHOTOS,
    ]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

// Notification Settings
export interface NotificationSettings {
  pushNotifications: boolean;
  circulars: boolean;
  homework: boolean;
  attendance: boolean;
  exams: boolean;
  fees: boolean;
  events: boolean;
  sound: boolean;
  vibration: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushNotifications: true,
  circulars: true,
  homework: true,
  attendance: true,
  exams: true,
  fees: true,
  events: true,
  sound: true,
  vibration: true,
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to handle any new settings added
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const setNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
};

export const updateNotificationSetting = async (
  key: keyof NotificationSettings,
  value: boolean
): Promise<void> => {
  try {
    const currentSettings = await getNotificationSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    await setNotificationSettings(updatedSettings);
  } catch (error) {
    console.error('Error updating notification setting:', error);
    throw error;
  }
};
