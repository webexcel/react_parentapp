// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  STUDENTS: '@students',
  SELECTED_STUDENT: '@selected_student',
  STUDENT_PHOTOS: '@student_photos',
  FCM_TOKEN: '@fcm_token',
  THEME_MODE: '@theme_mode',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  NOTIFICATION_SETTINGS: '@notification_settings',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  STUDENTS: 'students',
  CIRCULARS: 'circulars',
  HOMEWORK: 'homework',
  ATTENDANCE: 'attendance',
  EXAM_SCHEDULE: 'examSchedule',
  MARKS: 'marks',
  FEES: 'fees',
  CALENDAR: 'calendar',
  DASHBOARD: 'dashboard',
  FLASH_MESSAGE: 'flashMessage',
  LATEST_MESSAGE: 'latestMessage',
  STUDENT_PHOTO: 'studentPhoto',
  GALLERY: 'gallery',
} as const;
