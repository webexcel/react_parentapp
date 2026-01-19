export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  OTP: 'OTP',
  PASSWORD: 'Password',

  // Main App
  MAIN_TABS: 'MainTabs',
  DASHBOARD: 'Dashboard',
  HOMEWORK: 'Homework',
  MARKS: 'Marks',
  CHAT: 'Chat',
  PROFILE: 'Profile',
  NOTIFICATION_SETTINGS: 'NotificationSettings',

  // Feature Screens
  CIRCULARS: 'Circulars',
  CIRCULAR_DETAIL: 'CircularDetail',
  ATTENDANCE: 'Attendance',
  EXAM_SCHEDULE: 'ExamSchedule',
  CALENDAR: 'Calendar',
  FEE_DETAILS: 'FeeDetails',
  GALLERY: 'Gallery',
  TIMETABLE: 'Timetable',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
