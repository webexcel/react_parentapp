# Parent Mobile App - Developer Implementation Guide

**Version:** 2.2
**Last Updated:** January 2026
**Tech Stack:** React Native | Node.js + Express | MySQL | JWT | FCM
**Architecture:** Atomic Design + Modular Plugin System
**API Reference:** parent_app endpoints only (from Postman collection)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design Interpretation from Stitch](#2-design-interpretation-from-stitch)
3. [React Native App Architecture (Atomic Design)](#3-react-native-app-architecture-atomic-design)
4. [Modular Plugin Architecture](#4-modular-plugin-architecture)
5. [Feature-wise Implementation Plan](#5-feature-wise-implementation-plan)
6. [AI Chatbot Integration Foundation](#6-ai-chatbot-integration-foundation)
7. [Backend API Review & Suggestions](#7-backend-api-review--suggestions)
8. [Database Interaction Overview](#8-database-interaction-overview)
9. [Push Notification (FCM) Flow](#9-push-notification-fcm-flow)
10. [State Management & Data Flow](#10-state-management--data-flow)
11. [Security & Access Control](#11-security--access-control)
12. [Development Phases & Milestones](#12-development-phases--milestones)
13. [Risks, Assumptions & Constraints](#13-risks-assumptions--constraints)

---

## 1. Project Overview

### 1.1 Purpose of the App

The Parent Mobile App is a **scalable communication platform** enabling parents to:
- Receive school circulars and announcements
- View their children's homework assignments
- Track attendance records
- Check exam schedules and academic marks
- View fee details and payment history
- Access school calendar and events
- **[Future]** Interact with AI-powered chatbot for queries

### 1.2 Parent User Role

Parents are **consumers of information** with the following capabilities:
- View multiple children's data (multi-student support)
- Mark homework as "acknowledged/complete" (from parent side)
- Download attachments (PDFs, images, documents)
- Play audio/voice notes from teachers
- Receive push notifications for updates
- **[Future]** Chat with AI assistant for school-related queries

### 1.3 School Role (Backend Only)

Schools manage all content creation through a separate admin portal:
- Send circulars with attachments (images, PDFs, voice notes)
- Assign homework with due dates
- Mark attendance daily
- Publish exam schedules and marks
- Update fee records
- Post calendar events

### 1.4 Core Objectives

| Objective | Description |
|-----------|-------------|
| **Real-time Communication** | Parents receive instant updates via push notifications |
| **Multi-Student Support** | Single parent account linked to multiple children |
| **Offline Accessibility** | Cache critical data for poor network conditions |
| **Security** | Parent-only access to their children's data |
| **Scalability** | Modular architecture for easy feature addition |
| **AI-Ready** | Foundation for chatbot and smart features |

### 1.5 Future Modules Roadmap

| Module | Description | Priority |
|--------|-------------|----------|
| **AI Chatbot** | Natural language queries for school info | Phase 3 |
| **Transport Tracking** | Live bus location, ETA | Future |
| **Online Payments** | Fee payment gateway | Future |
| **PTM Scheduling** | Book parent-teacher meetings | Future |
| **Leave Application** | Submit leave requests | Future |
| **Report Cards** | Downloadable progress reports | Future |
| **Gallery** | School event photos/videos | Phase 2 |
| **Timetable** | Weekly class schedule | Phase 2 |

---

## 2. Design Interpretation from Stitch

### 2.1 Screen-by-Screen Breakdown

Based on the Stitch design files provided, the app consists of **11 screens**:

| Screen # | Screen Name | Purpose | Key UI Elements |
|----------|-------------|---------|-----------------|
| 1 | Login | Parent authentication entry | Mobile number input, "Get OTP" button, school logo |
| 2 | OTP Verification | Verify 4-digit OTP | 4 OTP input boxes, countdown timer, resend button |
| 3 | Dashboard | Main hub with overview | Student selector chips, attendance/homework cards, quick access grid, bottom navigation |
| 4 | Circulars & Notices | View school messages | Search bar, student filter chips, circular cards with attachments |
| 5 | Homework List | View pending/completed homework | Pending/completed sections, subject tags, attachment preview |
| 6 | Homework Confirm | Confirmation modal | Modal overlay with confirm/cancel actions |
| 7 | Attendance | Monthly attendance calendar | Calendar grid, color-coded days (present/absent), history list |
| 8 | Exam Schedule | View upcoming exams | Student selector, exam cards with portions and PDFs |
| 9 | Calendar | School events view | Calendar with event markers, event cards with categories |
| 10 | View Marks | Academic results | Student/year/exam selectors, subject-wise marks display |
| 11 | Fee Details | Fee summary and payments | Fee table, paid history cards, download buttons |

### 2.2 Navigation Flow (Text-Based)

```
App Launch
    │
    ├── [Not Authenticated] ─→ Login Screen
    │                              │
    │                              └─→ OTP Screen ─→ Dashboard
    │
    └── [Authenticated] ─→ Dashboard (Home)
                              │
                              ├── Bottom Tab: Home (Dashboard)
                              ├── Bottom Tab: Homework ─→ Homework List
                              │                              └─→ Homework Confirm Modal
                              ├── Bottom Tab: Marks ─→ View Marks
                              ├── Bottom Tab: Chat ─→ AI Chatbot [Future]
                              └── Bottom Tab: Profile ─→ Settings/Logout
                              │
                              └── Quick Access Cards:
                                   ├── Circulars ─→ Circulars Screen
                                   ├── Attendance ─→ Attendance Screen
                                   ├── Exam Schedule ─→ Exam Schedule Screen
                                   ├── Calendar ─→ Calendar Screen
                                   ├── Fee Details ─→ Fee Details Screen
                                   └── Gallery ─→ Gallery Screen [Future]
```

### 2.3 Atomic Component Mapping (From Designs)

| Level | Component | Composed Of | Used In |
|-------|-----------|-------------|---------|
| **Atom** | `Button` | - | All screens |
| **Atom** | `Text` | - | All screens |
| **Atom** | `Icon` | - | All screens |
| **Atom** | `Avatar` | - | Dashboard, Selectors |
| **Atom** | `Badge` | - | Dashboard, Notifications |
| **Atom** | `Input` | - | Login, Search |
| **Atom** | `Chip` | - | Student selector |
| **Atom** | `Divider` | - | Lists, Cards |
| **Atom** | `Spinner` | - | Loading states |
| **Molecule** | `SearchBar` | Input + Icon | Circulars, Homework |
| **Molecule** | `StudentChip` | Avatar + Text + Chip | All data screens |
| **Molecule** | `OtpInput` | Input[] (4) | OTP Screen |
| **Molecule** | `AttachmentItem` | Icon + Text + Button | Circulars, Homework |
| **Molecule** | `AudioPlayer` | Icon + Slider + Text | Circulars, Homework |
| **Molecule** | `SubjectTag` | Badge + Text | Homework, Marks |
| **Molecule** | `DateBadge` | Icon + Text | Exams, Calendar |
| **Molecule** | `StatCard` | Icon + Text + Text | Dashboard |
| **Molecule** | `NavItem` | Icon + Text | Bottom Nav |
| **Organism** | `StudentSelector` | StudentChip[] | All data screens |
| **Organism** | `ScreenHeader` | Button + Text + Button | All screens |
| **Organism** | `BottomNavigation` | NavItem[] | Main screens |
| **Organism** | `CircularCard` | DateBadge + Text + AttachmentItem[] | Circulars |
| **Organism** | `HomeworkCard` | SubjectTag + Text + AttachmentItem + Button | Homework |
| **Organism** | `AttendanceCalendar` | CalendarGrid + Legend | Attendance |
| **Organism** | `ExamCard` | DateBadge + Text + AttachmentItem | Exam Schedule |
| **Organism** | `MarksResultCard` | Icon + Text + ProgressBar | Marks |
| **Organism** | `FeeTable` | Table rows | Fees |
| **Organism** | `PaymentCard` | Text + Button | Fees |
| **Organism** | `EventCard` | Image + Badge + Text | Calendar |
| **Organism** | `QuickAccessGrid` | QuickAccessItem[] | Dashboard |
| **Organism** | `ConfirmModal` | Text + Button[] | Homework |
| **Organism** | `ChatBubble` | Avatar + Text + Timestamp | AI Chatbot [Future] |
| **Organism** | `ChatInput` | Input + Button | AI Chatbot [Future] |
| **Template** | `AuthTemplate` | Centered layout | Login, OTP |
| **Template** | `ListTemplate` | Header + StudentSelector + ScrollView | Circulars, Homework |
| **Template** | `DashboardTemplate` | Header + Cards + Grid + BottomNav | Dashboard |
| **Template** | `ChatTemplate` | Header + MessageList + ChatInput | AI Chatbot [Future] |

### 2.4 Design Consistency Rules

#### Color Palette (from Tailwind config)

```javascript
export const colors = {
  // Brand
  primary: '#137fec',
  primaryDark: '#0b4dc9',
  primarySoft: '#EFF6FF',

  // Background
  backgroundLight: '#f6f7f8',
  backgroundDark: '#101922',
  surfaceLight: '#ffffff',
  surfaceDark: '#1e293b',

  // Text
  textPrimary: '#111418',
  textSecondary: '#617589',
  textMuted: '#94A3B8',
  textDark: '#f3f4f6',

  // Status
  success: '#10b981',
  successLight: '#D1FAE5',
  warning: '#f59e0b',
  warningLight: '#FEF3C7',
  error: '#ef4444',
  errorLight: '#FEE2E2',
  info: '#3b82f6',
  infoLight: '#DBEAFE',

  // Subject Colors (for consistency)
  subjects: {
    maths: '#3b82f6',
    science: '#10b981',
    english: '#8b5cf6',
    history: '#f59e0b',
    geography: '#14b8a6',
    social: '#f97316',
  },

  // Semantic
  border: '#E2E8F0',
  borderDark: '#334155',
  shadow: 'rgba(0, 0, 0, 0.05)',
};
```

#### Typography

```javascript
export const typography = {
  fontFamily: {
    primary: 'Lexend',
    secondary: 'Inter',
    fallback: 'System',
  },

  fontSize: {
    xs: 10,      // Badges, labels
    sm: 12,      // Secondary text, captions
    base: 14,    // Body text
    md: 16,      // Subheadings
    lg: 18,      // Screen titles
    xl: 20,      // Large headings
    '2xl': 24,   // Hero numbers
    '3xl': 32,   // Dashboard stats
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

#### Spacing & Layout

```javascript
export const spacing = {
  // Base unit: 4px
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
```

---

## 3. React Native App Architecture (Atomic Design)

### 3.1 Folder Structure (Scalable + Atomic)

```
src/
├── app/                              # App entry and configuration
│   ├── App.tsx                       # Root component
│   ├── AppProviders.tsx              # All context providers wrapped
│   ├── Navigation.tsx                # Navigation container
│   └── ModuleRegistry.ts             # Dynamic module registration
│
├── core/                             # Core infrastructure (shared across modules)
│   ├── api/
│   │   ├── apiClient.ts              # Axios instance with interceptors
│   │   ├── apiEndpoints.ts           # Centralized endpoint definitions
│   │   └── apiTypes.ts               # Shared API types
│   │
│   ├── auth/
│   │   ├── AuthContext.tsx           # Auth state provider
│   │   ├── authService.ts            # Login, logout, token refresh
│   │   └── authTypes.ts
│   │
│   ├── storage/
│   │   ├── secureStorage.ts          # Encrypted storage (tokens)
│   │   ├── asyncStorage.ts           # Regular storage (preferences)
│   │   └── mmkvStorage.ts            # Fast cache storage
│   │
│   ├── notifications/
│   │   ├── fcmService.ts             # Firebase Cloud Messaging
│   │   ├── notificationHandler.ts    # Handle notification actions
│   │   └── notificationTypes.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNetwork.ts
│   │   ├── useTheme.ts
│   │   └── usePermissions.ts
│   │
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── formatUtils.ts
│   │   ├── validationUtils.ts
│   │   └── platformUtils.ts
│   │
│   └── constants/
│       ├── config.ts                 # App configuration
│       ├── routes.ts                 # Route names
│       └── keys.ts                   # Storage keys
│
├── design-system/                    # Atomic Design Components
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.styles.ts
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Text/
│   │   │   ├── Text.tsx
│   │   │   ├── Text.styles.ts
│   │   │   └── index.ts
│   │   ├── Icon/
│   │   ├── Input/
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Chip/
│   │   ├── Spinner/
│   │   ├── Divider/
│   │   ├── Image/
│   │   ├── ProgressBar/
│   │   └── index.ts                  # Export all atoms
│   │
│   ├── molecules/
│   │   ├── SearchBar/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchBar.styles.ts
│   │   │   └── index.ts
│   │   ├── StudentChip/
│   │   ├── OtpInput/
│   │   ├── AttachmentItem/
│   │   ├── AudioPlayer/
│   │   ├── SubjectTag/
│   │   ├── DateBadge/
│   │   ├── StatCard/
│   │   ├── NavItem/
│   │   ├── ListItem/
│   │   ├── EmptyState/
│   │   ├── ErrorState/
│   │   └── index.ts                  # Export all molecules
│   │
│   ├── organisms/
│   │   ├── ScreenHeader/
│   │   │   ├── ScreenHeader.tsx
│   │   │   ├── ScreenHeader.styles.ts
│   │   │   └── index.ts
│   │   ├── StudentSelector/
│   │   ├── BottomNavigation/
│   │   ├── CircularCard/
│   │   ├── HomeworkCard/
│   │   ├── AttendanceCalendar/
│   │   ├── ExamCard/
│   │   ├── MarksResultCard/
│   │   ├── FeeTable/
│   │   ├── PaymentCard/
│   │   ├── EventCard/
│   │   ├── QuickAccessGrid/
│   │   ├── ConfirmModal/
│   │   ├── ImageViewer/
│   │   ├── PdfViewer/
│   │   └── index.ts                  # Export all organisms
│   │
│   ├── templates/
│   │   ├── AuthTemplate/
│   │   │   ├── AuthTemplate.tsx
│   │   │   └── index.ts
│   │   ├── ListTemplate/
│   │   ├── DashboardTemplate/
│   │   ├── DetailTemplate/
│   │   ├── ChatTemplate/             # For AI Chatbot
│   │   └── index.ts
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   ├── ThemeContext.tsx
│   │   └── index.ts
│   │
│   └── index.ts                      # Export entire design system
│
├── modules/                          # Feature Modules (Plugin Architecture)
│   ├── auth/                         # Authentication Module
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OtpScreen.tsx
│   │   ├── hooks/
│   │   │   └── useLogin.ts
│   │   ├── services/
│   │   │   └── authApi.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   ├── navigation.tsx            # Module navigation config
│   │   └── index.ts                  # Module entry point
│   │
│   ├── dashboard/                    # Dashboard Module
│   │   ├── screens/
│   │   │   └── DashboardScreen.tsx
│   │   ├── components/
│   │   │   ├── AttendanceOverview.tsx
│   │   │   ├── HomeworkOverview.tsx
│   │   │   └── LatestNewsCarousel.tsx
│   │   ├── hooks/
│   │   │   └── useDashboard.ts
│   │   ├── services/
│   │   │   └── dashboardApi.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── students/                     # Student Management Module
│   │   ├── context/
│   │   │   └── StudentContext.tsx
│   │   ├── hooks/
│   │   │   └── useStudents.ts
│   │   ├── services/
│   │   │   └── studentsApi.ts
│   │   ├── types/
│   │   │   └── student.types.ts
│   │   └── index.ts
│   │
│   ├── circulars/                    # Circulars Module
│   │   ├── screens/
│   │   │   ├── CircularsListScreen.tsx
│   │   │   └── CircularDetailScreen.tsx
│   │   ├── components/
│   │   │   └── CircularAttachments.tsx
│   │   ├── hooks/
│   │   │   └── useCirculars.ts
│   │   ├── services/
│   │   │   └── circularsApi.ts
│   │   ├── types/
│   │   │   └── circular.types.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── homework/                     # Homework Module
│   │   ├── screens/
│   │   │   ├── HomeworkListScreen.tsx
│   │   │   └── HomeworkDetailScreen.tsx
│   │   ├── components/
│   │   │   └── HomeworkActions.tsx
│   │   ├── hooks/
│   │   │   └── useHomework.ts
│   │   ├── services/
│   │   │   └── homeworkApi.ts
│   │   ├── types/
│   │   │   └── homework.types.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── attendance/                   # Attendance Module
│   │   ├── screens/
│   │   │   └── AttendanceScreen.tsx
│   │   ├── hooks/
│   │   │   └── useAttendance.ts
│   │   ├── services/
│   │   │   └── attendanceApi.ts
│   │   ├── types/
│   │   │   └── attendance.types.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── exams/                        # Exams Module
│   │   ├── screens/
│   │   │   └── ExamScheduleScreen.tsx
│   │   ├── hooks/
│   │   │   └── useExams.ts
│   │   ├── services/
│   │   │   └── examsApi.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── marks/                        # Academic Marks Module
│   │   ├── screens/
│   │   │   └── ViewMarksScreen.tsx
│   │   ├── hooks/
│   │   │   └── useMarks.ts
│   │   ├── services/
│   │   │   └── marksApi.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── fees/                         # Fee Details Module
│   │   ├── screens/
│   │   │   └── FeeDetailsScreen.tsx
│   │   ├── hooks/
│   │   │   └── useFees.ts
│   │   ├── services/
│   │   │   └── feesApi.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── calendar/                     # School Calendar Module
│   │   ├── screens/
│   │   │   └── CalendarScreen.tsx
│   │   ├── hooks/
│   │   │   └── useCalendar.ts
│   │   ├── services/
│   │   │   └── calendarApi.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   ├── profile/                      # Profile & Settings Module
│   │   ├── screens/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   ├── navigation.tsx
│   │   └── index.ts
│   │
│   └── chatbot/                      # AI Chatbot Module [Future]
│       ├── screens/
│       │   └── ChatbotScreen.tsx
│       ├── components/
│       │   ├── ChatBubble.tsx
│       │   ├── ChatInput.tsx
│       │   ├── QuickReplies.tsx
│       │   └── TypingIndicator.tsx
│       ├── hooks/
│       │   ├── useChatbot.ts
│       │   └── useSpeechToText.ts
│       ├── services/
│       │   ├── chatbotApi.ts
│       │   └── aiService.ts
│       ├── context/
│       │   └── ChatContext.tsx
│       ├── types/
│       │   └── chatbot.types.ts
│       ├── navigation.tsx
│       └── index.ts
│
├── store/                            # Global State Management
│   ├── index.ts                      # Store configuration
│   ├── rootReducer.ts                # Combined reducers
│   ├── middleware.ts                 # Custom middleware
│   └── slices/
│       ├── authSlice.ts
│       ├── studentsSlice.ts
│       ├── uiSlice.ts
│       └── chatSlice.ts              # For chatbot
│
├── types/                            # Shared TypeScript types
│   ├── global.d.ts
│   ├── navigation.types.ts
│   └── api.types.ts
│
└── assets/                           # Static assets
    ├── images/
    ├── icons/
    ├── animations/                   # Lottie files
    └── fonts/
```

### 3.2 Atomic Design Implementation

#### Atoms (Basic Building Blocks)

```typescript
// design-system/atoms/Button/Button.tsx
import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../Text';
import { Icon } from '../Icon';
import { styles } from './Button.styles';
import { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#137fec'} />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} style={styles.leftIcon} />}
          <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
          {rightIcon && <Icon name={rightIcon} style={styles.rightIcon} />}
        </>
      )}
    </TouchableOpacity>
  );
};
```

```typescript
// design-system/atoms/Button/Button.types.ts
export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  fullWidth?: boolean;
  onPress: () => void;
  testID?: string;
}
```

#### Molecules (Combinations of Atoms)

```typescript
// design-system/molecules/StudentChip/StudentChip.tsx
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Avatar, Text, Icon } from '../../atoms';
import { styles } from './StudentChip.styles';

interface StudentChipProps {
  name: string;
  photoUrl?: string;
  isSelected: boolean;
  onPress: () => void;
}

export const StudentChip: React.FC<StudentChipProps> = ({
  name,
  photoUrl,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && (
        <Icon name="check-circle" size={16} color="#fff" style={styles.checkIcon} />
      )}
      <Text
        style={[styles.name, isSelected && styles.selectedName]}
        numberOfLines={1}
      >
        {name.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};
```

#### Organisms (Complex Components)

```typescript
// design-system/organisms/StudentSelector/StudentSelector.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { StudentChip } from '../../molecules';
import { Text } from '../../atoms';
import { styles } from './StudentSelector.styles';
import { Student } from '@/modules/students/types';

interface StudentSelectorProps {
  students: Student[];
  selectedId: string;
  onSelect: (adno: string) => void;
  label?: string;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedId,
  onSelect,
  label,
}) => {
  if (students.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {students.map((student) => (
          <StudentChip
            key={student.adno}
            name={student.name}
            photoUrl={student.photo_url}
            isSelected={student.adno === selectedId}
            onPress={() => onSelect(student.adno)}
          />
        ))}
      </ScrollView>
    </View>
  );
};
```

#### Templates (Page Layouts)

```typescript
// design-system/templates/ListTemplate/ListTemplate.tsx
import React from 'react';
import { View, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { ScreenHeader, StudentSelector } from '../../organisms';
import { SearchBar, EmptyState, ErrorState } from '../../molecules';
import { Spinner } from '../../atoms';
import { styles } from './ListTemplate.styles';

interface ListTemplateProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  students?: Student[];
  selectedStudentId?: string;
  onStudentSelect?: (id: string) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

export const ListTemplate: React.FC<ListTemplateProps> = ({
  title,
  showBack = true,
  onBack,
  students,
  selectedStudentId,
  onStudentSelect,
  showSearch = false,
  searchPlaceholder,
  onSearch,
  searchValue,
  loading = false,
  error,
  onRetry,
  refreshing = false,
  onRefresh,
  isEmpty = false,
  emptyMessage,
  children,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={title} showBack={showBack} onBack={onBack} />

      {students && students.length > 0 && (
        <StudentSelector
          students={students}
          selectedId={selectedStudentId!}
          onSelect={onStudentSelect!}
        />
      )}

      {showSearch && (
        <View style={styles.searchWrapper}>
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearch}
          />
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : isEmpty ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
```

### 3.3 Design System Export

```typescript
// design-system/index.ts
// Atoms
export * from './atoms';

// Molecules
export * from './molecules';

// Organisms
export * from './organisms';

// Templates
export * from './templates';

// Theme
export * from './theme';
```

Usage in screens:
```typescript
import {
  Button,
  Text,
  Icon,
  StudentSelector,
  CircularCard,
  ListTemplate,
  colors,
} from '@/design-system';
```

---

## 4. Modular Plugin Architecture

### 4.1 Module Structure

Each module is self-contained and can be enabled/disabled:

```typescript
// modules/circulars/index.ts
import { CircularsListScreen, CircularDetailScreen } from './screens';
import { circularsNavigation } from './navigation';
import { useCirculars } from './hooks/useCirculars';
import * as circularsApi from './services/circularsApi';

// Module configuration
export const circularsModule = {
  name: 'circulars',
  displayName: 'Circulars & Notices',
  icon: 'campaign',
  enabled: true,
  navigation: circularsNavigation,
  screens: {
    CircularsList: CircularsListScreen,
    CircularDetail: CircularDetailScreen,
  },
  hooks: {
    useCirculars,
  },
  api: circularsApi,
};

export { useCirculars };
export * from './types/circular.types';
```

### 4.2 Module Registry

```typescript
// app/ModuleRegistry.ts
import { authModule } from '@/modules/auth';
import { dashboardModule } from '@/modules/dashboard';
import { studentsModule } from '@/modules/students';
import { circularsModule } from '@/modules/circulars';
import { homeworkModule } from '@/modules/homework';
import { attendanceModule } from '@/modules/attendance';
import { examsModule } from '@/modules/exams';
import { marksModule } from '@/modules/marks';
import { feesModule } from '@/modules/fees';
import { calendarModule } from '@/modules/calendar';
import { profileModule } from '@/modules/profile';
import { chatbotModule } from '@/modules/chatbot';

export interface AppModule {
  name: string;
  displayName: string;
  icon: string;
  enabled: boolean;
  navigation: any;
  screens: Record<string, React.ComponentType<any>>;
  hooks?: Record<string, any>;
  api?: Record<string, any>;
}

// All available modules
const ALL_MODULES: AppModule[] = [
  authModule,
  dashboardModule,
  studentsModule,
  circularsModule,
  homeworkModule,
  attendanceModule,
  examsModule,
  marksModule,
  feesModule,
  calendarModule,
  profileModule,
  chatbotModule,  // Future module
];

// Filter enabled modules
export const getEnabledModules = (): AppModule[] => {
  return ALL_MODULES.filter(module => module.enabled);
};

// Get module by name
export const getModule = (name: string): AppModule | undefined => {
  return ALL_MODULES.find(module => module.name === name);
};

// Check if module is enabled
export const isModuleEnabled = (name: string): boolean => {
  const module = getModule(name);
  return module?.enabled ?? false;
};

// Dynamic navigation registration
export const getModuleNavigations = () => {
  return getEnabledModules()
    .filter(module => module.navigation)
    .map(module => module.navigation);
};
```

### 4.3 Dynamic Navigation

```typescript
// app/Navigation.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '@/core/hooks/useAuth';
import { getEnabledModules, isModuleEnabled } from './ModuleRegistry';
import { BottomNavigation } from '@/design-system';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => {
  const authModule = getModule('auth');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={authModule.screens.Login} />
      <Stack.Screen name="Otp" component={authModule.screens.Otp} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator (Dynamic based on enabled modules)
const MainTabs = () => {
  const tabModules = [
    { module: 'dashboard', label: 'Home', icon: 'dashboard' },
    { module: 'homework', label: 'Homework', icon: 'menu_book' },
    { module: 'marks', label: 'Marks', icon: 'bar_chart' },
    // Conditionally add chatbot tab
    ...(isModuleEnabled('chatbot')
      ? [{ module: 'chatbot', label: 'Chat', icon: 'chat' }]
      : []),
    { module: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavigation {...props} tabs={tabModules} />}
      screenOptions={{ headerShown: false }}
    >
      {tabModules.map(({ module, label }) => {
        const moduleConfig = getModule(module);
        if (!moduleConfig) return null;

        return (
          <Tab.Screen
            key={module}
            name={label}
            component={moduleConfig.screens.Main || moduleConfig.screens.List}
          />
        );
      })}
    </Tab.Navigator>
  );
};

// Root Navigator
export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />

            {/* Modal screens from all modules */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              {getEnabledModules().map((module) => {
                if (!module.screens) return null;
                return Object.entries(module.screens).map(([name, Screen]) => (
                  <Stack.Screen
                    key={`${module.name}-${name}`}
                    name={`${module.name}/${name}`}
                    component={Screen}
                  />
                ));
              })}
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 4.4 Adding a New Module (Template)

To add a new module (e.g., Transport Tracking):

```typescript
// modules/transport/index.ts
import { TransportScreen } from './screens/TransportScreen';
import { transportNavigation } from './navigation';
import { useTransport } from './hooks/useTransport';
import * as transportApi from './services/transportApi';

export const transportModule = {
  name: 'transport',
  displayName: 'Transport Tracking',
  icon: 'directions_bus',
  enabled: false,  // Set to true when ready
  navigation: transportNavigation,
  screens: {
    Main: TransportScreen,
  },
  hooks: {
    useTransport,
  },
  api: transportApi,
};

export { useTransport };
export * from './types/transport.types';
```

Then register in `ModuleRegistry.ts`:
```typescript
import { transportModule } from '@/modules/transport';

const ALL_MODULES: AppModule[] = [
  // ... existing modules
  transportModule,
];
```

---

## 5. Feature-wise Implementation Plan

### 5.1 Login / Authentication

#### Feature Purpose
Enable parents to authenticate using mobile number + OTP verification.

#### Screens Involved
- `LoginScreen`
- `OtpScreen`

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/auth/mobileInstallsNew` | POST | Register device and request OTP | `{ mobile_no, platform_type, manufacturer_name, manufacturer_model, os_version, app_version_code, dbname }` |
| `/api/auth/mobileInstallerVerify` | POST | Verify OTP | `{ id, otp, dbname }` |
| `/api/auth/getMobStudentDetail` | POST | Get linked students after login | `{ id }` |
| `/api/auth/getMobStudentPhoto` | POST | Get student photo | `{ adno }` |
| `/api/auth/updateParentFirebaseId` | POST | Register FCM token | `{ firebase_id, mobile_no, dbname }` |

#### Implementation Flow

```
1. User enters mobile number
2. Call /api/auth/mobileInstallsNew → Returns {id} (session ID)
3. User enters OTP
4. Call /api/auth/mobileInstallerVerify with {id, otp, dbname}
5. On success, call /api/auth/getMobStudentDetail with {id} → Returns students[]
6. For each student, call /api/auth/getMobStudentPhoto with {adno}
7. Call /api/auth/updateParentFirebaseId to register FCM token
8. Store: session ID, students array, mobile_no, dbname
```

#### Expected Data Shape

```typescript
// Login Request
interface LoginRequest {
  mobile_no: string;
  platform_type: 'Android' | 'iOS';
  manufacturer_name: string;
  manufacturer_model: string;
  os_version: string;
  app_version_code: string;
  dbname: string;
}

// Login Response
interface LoginResponse {
  success: boolean;
  id: string;              // Session ID for OTP verification
  message: string;
}

// OTP Verification Request
interface OtpVerifyRequest {
  id: string;
  otp: string;
  dbname: string;
}

// Student Detail Response
interface StudentDetailResponse {
  students: Student[];
}

interface Student {
  adno: string;
  name: string;
  class: string;
  section: string;
  class_id: string;
  // ... other fields
}
```

---

### 5.2 Student Mapping (Multi-Student Support)

#### Feature Purpose
Allow parents to switch between multiple children's data.

#### Implementation

```typescript
// modules/students/context/StudentContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student } from '../types/student.types';
import { mmkvStorage } from '@/core/storage/mmkvStorage';

interface StudentContextType {
  students: Student[];
  selectedStudent: Student | null;
  selectedStudentId: string | null;
  setSelectedStudent: (adno: string) => void;
  loading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    const loadStudents = async () => {
      const cached = mmkvStorage.getString('students');
      const lastSelected = mmkvStorage.getString('selectedStudentId');

      if (cached) {
        const parsed = JSON.parse(cached);
        setStudents(parsed);
        setSelectedStudentId(lastSelected || parsed[0]?.adno || null);
      }
      setLoading(false);
    };
    loadStudents();
  }, []);

  const setSelectedStudent = (adno: string) => {
    setSelectedStudentId(adno);
    mmkvStorage.set('selectedStudentId', adno);
  };

  const selectedStudent = students.find(s => s.adno === selectedStudentId) || null;

  return (
    <StudentContext.Provider
      value={{
        students,
        selectedStudent,
        selectedStudentId,
        setSelectedStudent,
        loading,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within StudentProvider');
  }
  return context;
};
```

---

### 5.3 Circulars / Messages

#### Feature Purpose
Display school circulars with attachments (images, PDFs, voice notes).

#### Screens Involved
- `CircularsListScreen`
- `CircularDetailScreen` (optional)

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/circular/getAllMessagesByMobileNumber` | POST | Get all circulars with pagination | `{ mobile_number, page_size, current_size }` |
| `/api/circular/getBase64` | POST | Get attachment as base64 | `{ url }` |

#### Implementation Notes
- Use `mobile_number` (not adno) to fetch circulars
- Supports pagination with `page_size` and `current_size` (offset)
- Attachments can be fetched as base64 for offline viewing

#### Screen Implementation

```typescript
// modules/circulars/screens/CircularsListScreen.tsx
import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { ListTemplate, CircularCard } from '@/design-system';
import { useStudents } from '@/modules/students';
import { useCirculars } from '../hooks/useCirculars';

export const CircularsListScreen = () => {
  const { students, selectedStudentId, setSelectedStudent } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: circulars,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCirculars(selectedStudentId, searchQuery);

  return (
    <ListTemplate
      title="Circulars"
      students={students}
      selectedStudentId={selectedStudentId}
      onStudentSelect={setSelectedStudent}
      showSearch
      searchPlaceholder="Search circulars..."
      onSearch={setSearchQuery}
      searchValue={searchQuery}
      loading={isLoading}
      error={error?.message}
      onRetry={refetch}
      refreshing={isRefetching}
      onRefresh={refetch}
      isEmpty={circulars?.length === 0}
      emptyMessage="No circulars found"
    >
      <FlatList
        data={circulars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CircularCard
            circular={item}
            onPress={() => {/* Navigate to detail */}}
          />
        )}
        scrollEnabled={false}
      />
    </ListTemplate>
  );
};
```

---

### 5.4 Homework

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/homework/getSaveHomeworkByClass` | POST | Get homework for student | `{ classid, adno }` |

#### Implementation Notes
- Requires both `classid` and `adno` from student context
- Filter by pending/completed status on client side

---

### 5.5 Attendance

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/attendance/getAttendance` | POST | Get student attendance | `{ ADNO }` |

#### Implementation Notes
- Returns attendance data for the student
- Display as calendar view with color-coded days

---

### 5.6 Exam Schedule

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/examschedule/getParentExamSchedule` | POST | Get exam schedule | `{ CLASS_ID }` |

#### Implementation Notes
- Uses `CLASS_ID` (not adno) to fetch exams
- Display with date badges and exam details

---

### 5.7 View Marks / Report Card

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/reportcard/getMarksOnAdno` | POST | Get marks for specific exam | `{ ADNO, examid, yearid }` |
| `/api/reportCard/selectExamName` | POST | Get available exams | `{ class_Id }` |
| `/api/reportCard/getTermType` | GET | Get term types | - |
| `/api/reportCard/getAnnualReportcard` | POST | Get annual report | `{ adno }` |
| `/api/reportCard/getTermReportcardAdno` | POST | Get term report | `{ ADNO, CLASSID, EXGRPID, YEARID, TERMTYPE }` |

#### Implementation Flow
1. Load term types with `getTermType`
2. Load exam names with `selectExamName` using class_Id
3. On exam selection, fetch marks with `getMarksOnAdno`
4. Optionally fetch annual/term report cards

---

### 5.8 Fee Details

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/payments/getStudentPayDetails` | POST | Get fee structure | `{ adno, interval }` |
| `/api/payments/getStudentPayHistory` | POST | Get payment history | `{ adno, CLASS_ID }` |
| `/api/payments/getPrintBill` | POST | Download bill | `{ rid, payment_id, adno, name, className }` |
| `/api/payments/getFeeInstallment` | POST | Get installment options | `{ adno }` |
| `/api/payments/getPayEnable` | POST | Check if online payment enabled | `{ adno }` |
| `/api/payments/payOnline` | POST | Initiate payment | `{ admission_id, payment_amount, mobile_no, token }` |
| `/api/dashboard/feesFlash` | POST | Fee alert for dashboard | `{ adno }` |
| `/api/dashboard/checkFeesBalance` | POST | Quick balance check | `{ adno: [] }` |

---

### 5.9 Calendar / Events

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/calendar/getCalendar` | GET | Get school calendar | - |
| `/api/newsevents/getMobileEvents` | POST | Get events | `{ CLASS_ID }` |

---

### 5.10 Timetable

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/timetable/getStudentTimetable` | POST | Get weekly timetable | `{ class_id }` |

---

### 5.11 Gallery

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/gallery/getParentCategory` | POST | Get gallery categories | `{ class_id: [] }` |
| `/api/gallery/getCategoryAll` | POST | Get images in category | `{ GalCatID }` |

---

### 5.12 Leave Application

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/leaveletter/getLeaveRequest` | POST | Get leave requests | `{ ADNO }` |
| `/api/leaveletter/insertLeaveRequest` | POST | Submit new leave | `{ ADNO, CLASS_ID, selectedSession, s_date, e_date, message }` |
| `/api/leaveletter/updateLeaveRequest` | POST | Update leave | `{ id, selectedSession, s_date, e_date, message }` |
| `/api/leaveLetter/deleteLeaveRequest` | POST | Delete leave | `{ id }` |

---

### 5.13 Parent Message to School

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/parentmessage/saveMessage` | POST | Send message | `{ AdmNo, name, classid, message, filename, type, image, thumbnail }` |
| `/api/parentmessage/getParentUploadDetails` | POST | Get sent messages | `{ adno }` |
| `/api/parentmessage/deleteMessage` | POST | Delete message | `{ id }` |

---

### 5.14 Dashboard

#### API Dependencies (parent_app)

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/dashboard/getLatestMessage` | POST | Get latest circulars | `{ mobile_number }` |
| `/api/dashboard/getFlashMessage` | GET | Get announcements | - |
| `/api/dashboard/feesFlash` | POST | Get fee alert | `{ adno }` |
| `/api/dashboard/checkFeesBalance` | POST | Get fee summary | `{ adno: [] }` |
| `/api/dashboard/getIdCard` | POST | Get ID card | `{ adno }` |
| `/api/dashboard/batchCount` | POST | Get batch info | `{ ADNO }` |

---

### 5.15 Screen-to-API Quick Reference

| Screen | Primary API(s) | Key Parameters |
|--------|----------------|----------------|
| **Login** | `mobileInstallsNew` | mobile_no, dbname |
| **OTP** | `mobileInstallerVerify`, `getMobStudentDetail` | id, otp |
| **Dashboard** | `getLatestMessage`, `getFlashMessage`, `feesFlash`, `checkFeesBalance` | mobile_number, adno |
| **Circulars** | `getAllMessagesByMobileNumber` | mobile_number, page_size |
| **Homework** | `getSaveHomeworkByClass` | classid, adno |
| **Attendance** | `getAttendance` | ADNO |
| **Exam Schedule** | `getParentExamSchedule` | CLASS_ID |
| **View Marks** | `getMarksOnAdno`, `selectExamName`, `getTermType` | ADNO, examid, yearid |
| **Fee Details** | `getStudentPayDetails`, `getStudentPayHistory` | adno, CLASS_ID |
| **Calendar** | `getCalendar`, `getMobileEvents` | CLASS_ID |
| **Timetable** | `getStudentTimetable` | class_id |
| **Gallery** | `getParentCategory`, `getCategoryAll` | class_id, GalCatID |
| **Leave** | `getLeaveRequest`, `insertLeaveRequest` | ADNO, CLASS_ID |
| **Parent Message** | `saveMessage`, `getParentUploadDetails` | AdmNo, classid |

---

## 6. AI Chatbot Integration Foundation

### 6.1 Overview

The AI Chatbot module will allow parents to:
- Ask questions in natural language
- Get instant answers about their children's school information
- Receive contextual suggestions
- Voice input support (future)

### 6.2 Chatbot Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Parent App                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  ChatbotScreen                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  ││
│  │  │ ChatBubble  │  │ QuickReplies│  │  ChatInput     │  ││
│  │  │ (User/Bot)  │  │             │  │ (Text/Voice)   │  ││
│  │  └─────────────┘  └─────────────┘  └────────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │  useChatbot   │                        │
│                    │    Hook       │                        │
│                    └───────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐
    │ School  │        │    AI     │       │ Context │
    │  Data   │        │  Engine   │       │ Builder │
    │  APIs   │        │(LLM/RAG)  │       │         │
    └─────────┘        └───────────┘       └─────────┘
```

### 6.3 Module Structure

```
modules/chatbot/
├── screens/
│   └── ChatbotScreen.tsx
├── components/
│   ├── ChatBubble/
│   │   ├── ChatBubble.tsx
│   │   ├── UserBubble.tsx
│   │   └── BotBubble.tsx
│   ├── ChatInput/
│   │   ├── ChatInput.tsx
│   │   └── VoiceButton.tsx
│   ├── QuickReplies/
│   │   └── QuickReplies.tsx
│   ├── TypingIndicator/
│   │   └── TypingIndicator.tsx
│   └── SuggestionChips/
│       └── SuggestionChips.tsx
├── hooks/
│   ├── useChatbot.ts
│   ├── useChatHistory.ts
│   └── useSpeechToText.ts
├── services/
│   ├── chatbotApi.ts
│   └── contextBuilder.ts
├── context/
│   └── ChatContext.tsx
├── types/
│   └── chatbot.types.ts
├── constants/
│   └── quickReplies.ts
├── navigation.tsx
└── index.ts
```

### 6.4 Types Definition

```typescript
// modules/chatbot/types/chatbot.types.ts

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  metadata?: {
    intent?: string;
    confidence?: number;
    sources?: string[];
    actions?: ChatAction[];
  };
}

export interface ChatAction {
  type: 'navigate' | 'call' | 'link' | 'quick_reply';
  label: string;
  payload: any;
}

export interface QuickReply {
  id: string;
  label: string;
  query: string;
  icon?: string;
}

export interface ChatContext {
  studentId: string;
  studentName: string;
  className: string;
  recentTopics: string[];
  parentMobile: string;
  dbname: string;
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
  conversationId?: string;
  language?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  intent: string;
  confidence: number;
  actions?: ChatAction[];
  quickReplies?: QuickReply[];
  sources?: string[];
}
```

### 6.5 Chatbot Hook

```typescript
// modules/chatbot/hooks/useChatbot.ts
import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useStudents } from '@/modules/students';
import { chatbotApi } from '../services/chatbotApi';
import { buildContext } from '../services/contextBuilder';
import { ChatMessage, ChatResponse } from '../types/chatbot.types';
import { generateId } from '@/core/utils/formatUtils';
import { mmkvStorage } from '@/core/storage/mmkvStorage';

export const useChatbot = () => {
  const { selectedStudent } = useStudents();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  // Load chat history from storage
  const loadHistory = useCallback(async () => {
    const history = mmkvStorage.getString(`chat_history_${selectedStudent?.adno}`);
    if (history) {
      setMessages(JSON.parse(history));
    }
  }, [selectedStudent]);

  // Save chat history
  const saveHistory = useCallback((msgs: ChatMessage[]) => {
    if (selectedStudent) {
      mmkvStorage.set(
        `chat_history_${selectedStudent.adno}`,
        JSON.stringify(msgs.slice(-50)) // Keep last 50 messages
      );
    }
  }, [selectedStudent]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const context = buildContext(selectedStudent!);
      return chatbotApi.sendMessage({
        message: userMessage,
        context,
        conversationId: conversationIdRef.current || undefined,
      });
    },
    onMutate: (userMessage) => {
      // Optimistic update - add user message immediately
      const userMsg: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
        status: 'sending',
      };

      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
    },
    onSuccess: (response: ChatResponse, userMessage) => {
      // Update conversation ID
      conversationIdRef.current = response.conversationId;

      // Update user message status
      setMessages(prev =>
        prev.map(msg =>
          msg.type === 'user' && msg.status === 'sending'
            ? { ...msg, status: 'sent' }
            : msg
        )
      );

      // Add bot response
      const botMsg: ChatMessage = {
        id: generateId(),
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        status: 'sent',
        metadata: {
          intent: response.intent,
          confidence: response.confidence,
          sources: response.sources,
          actions: response.actions,
        },
      };

      setMessages(prev => {
        const updated = [...prev, botMsg];
        saveHistory(updated);
        return updated;
      });

      setIsTyping(false);
    },
    onError: (error) => {
      // Mark message as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.type === 'user' && msg.status === 'sending'
            ? { ...msg, status: 'error' }
            : msg
        )
      );
      setIsTyping(false);
    },
  });

  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || !selectedStudent) return;
    sendMessageMutation.mutate(message.trim());
  }, [selectedStudent, sendMessageMutation]);

  const clearChat = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    if (selectedStudent) {
      mmkvStorage.delete(`chat_history_${selectedStudent.adno}`);
    }
  }, [selectedStudent]);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    loadHistory,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
};
```

### 6.6 Chatbot Screen

```typescript
// modules/chatbot/screens/ChatbotScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, StudentSelector } from '@/design-system';
import { useStudents } from '@/modules/students';
import { useChatbot } from '../hooks/useChatbot';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { QuickReplies } from '../components/QuickReplies';
import { TypingIndicator } from '../components/TypingIndicator';
import { QUICK_REPLIES } from '../constants/quickReplies';
import { styles } from './ChatbotScreen.styles';

export const ChatbotScreen = () => {
  const flatListRef = useRef<FlatList>(null);
  const { students, selectedStudentId, setSelectedStudent, selectedStudent } = useStudents();
  const {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    loadHistory,
  } = useChatbot();

  // Load history when student changes
  useEffect(() => {
    loadHistory();
  }, [selectedStudentId, loadHistory]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleQuickReply = (query: string) => {
    sendMessage(query);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="School Assistant"
        rightIcon="delete_outline"
        onRightPress={clearChat}
      />

      <StudentSelector
        students={students}
        selectedId={selectedStudentId!}
        onSelect={setSelectedStudent}
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Hi! I'm your school assistant. Ask me anything about {selectedStudent?.name}'s school activities.
            </Text>
            <QuickReplies
              replies={QUICK_REPLIES}
              onSelect={handleQuickReply}
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onActionPress={(action) => {
                  // Handle action (navigate, etc.)
                }}
              />
            )}
            contentContainerStyle={styles.messageList}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />
        )}

        <ChatInput
          onSend={sendMessage}
          disabled={!selectedStudent}
          placeholder={`Ask about ${selectedStudent?.name || 'your child'}...`}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```

### 6.7 Context Builder

```typescript
// modules/chatbot/services/contextBuilder.ts
import { ChatContext } from '../types/chatbot.types';
import { Student } from '@/modules/students/types';
import { mmkvStorage } from '@/core/storage/mmkvStorage';

export const buildContext = (student: Student): ChatContext => {
  // Get recent topics from storage
  const recentTopics = JSON.parse(
    mmkvStorage.getString(`recent_topics_${student.adno}`) || '[]'
  );

  return {
    studentId: student.adno,
    studentName: student.name,
    className: `${student.class}-${student.section}`,
    recentTopics,
    parentMobile: mmkvStorage.getString('parent_mobile') || '',
    dbname: mmkvStorage.getString('dbname') || '',
  };
};

export const updateRecentTopics = (studentId: string, topic: string) => {
  const key = `recent_topics_${studentId}`;
  const existing = JSON.parse(mmkvStorage.getString(key) || '[]');

  // Keep last 5 unique topics
  const updated = [topic, ...existing.filter((t: string) => t !== topic)].slice(0, 5);
  mmkvStorage.set(key, JSON.stringify(updated));
};
```

### 6.8 Chatbot API Service

```typescript
// modules/chatbot/services/chatbotApi.ts
import { apiClient } from '@/core/api/apiClient';
import { ChatRequest, ChatResponse } from '../types/chatbot.types';

const CHATBOT_BASE_URL = '/api/chatbot';

export const chatbotApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>(
      `${CHATBOT_BASE_URL}/message`,
      request
    );
    return response.data;
  },

  getConversationHistory: async (conversationId: string) => {
    const response = await apiClient.get(
      `${CHATBOT_BASE_URL}/history/${conversationId}`
    );
    return response.data;
  },

  getSuggestions: async (studentId: string) => {
    const response = await apiClient.get(
      `${CHATBOT_BASE_URL}/suggestions/${studentId}`
    );
    return response.data;
  },

  submitFeedback: async (messageId: string, rating: 'positive' | 'negative') => {
    await apiClient.post(`${CHATBOT_BASE_URL}/feedback`, {
      messageId,
      rating,
    });
  },
};
```

### 6.9 Quick Replies Configuration

```typescript
// modules/chatbot/constants/quickReplies.ts
import { QuickReply } from '../types/chatbot.types';

export const QUICK_REPLIES: QuickReply[] = [
  {
    id: '1',
    label: 'Today\'s Homework',
    query: 'What homework does my child have today?',
    icon: 'assignment',
  },
  {
    id: '2',
    label: 'Attendance',
    query: 'How many days has my child been absent this month?',
    icon: 'event_available',
  },
  {
    id: '3',
    label: 'Fee Status',
    query: 'What is the current fee balance?',
    icon: 'payments',
  },
  {
    id: '4',
    label: 'Upcoming Exams',
    query: 'When are the next exams scheduled?',
    icon: 'quiz',
  },
  {
    id: '5',
    label: 'Latest Marks',
    query: 'What were the marks in the last exam?',
    icon: 'grade',
  },
  {
    id: '6',
    label: 'School Events',
    query: 'What events are coming up this month?',
    icon: 'event',
  },
];
```

### 6.10 Backend API Requirements for Chatbot

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `POST /api/chatbot/message` | POST | Send message to AI | **Needs Creation** |
| `GET /api/chatbot/history/:id` | GET | Get conversation history | **Needs Creation** |
| `GET /api/chatbot/suggestions/:studentId` | GET | Get contextual suggestions | **Needs Creation** |
| `POST /api/chatbot/feedback` | POST | Submit user feedback | **Needs Creation** |

#### Chatbot Message Request/Response

```typescript
// Request
{
  "message": "What homework does my child have today?",
  "context": {
    "studentId": "9230",
    "studentName": "ARIVUMATHI V",
    "className": "5-B",
    "recentTopics": ["homework", "attendance"],
    "parentMobile": "9600037999",
    "dbname": "appdemoo"
  },
  "conversationId": "conv_abc123",
  "language": "en"
}

// Response
{
  "message": "ARIVUMATHI V has 2 homework assignments due today:\n\n1. **Mathematics** - Complete exercises 5-10 on Algebraic Expressions\n2. **Science** - Save Water project submission\n\nWould you like me to show more details?",
  "conversationId": "conv_abc123",
  "intent": "homework_query",
  "confidence": 0.95,
  "actions": [
    {
      "type": "navigate",
      "label": "View Homework",
      "payload": { "screen": "homework/List" }
    }
  ],
  "quickReplies": [
    { "id": "1", "label": "Show details", "query": "Show homework details" },
    { "id": "2", "label": "Mark as seen", "query": "Mark homework as acknowledged" }
  ],
  "sources": ["homework_table", "student_data"]
}
```

### 6.11 AI Engine Integration Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **OpenAI GPT-4** | Hosted LLM API | Easy integration, powerful | Cost per request, data privacy |
| **Google Gemini** | Google's LLM | Good for multimodal | Newer, less documentation |
| **Self-hosted LLM** | Local deployment (Llama, etc.) | Data privacy, no per-request cost | Infrastructure, maintenance |
| **RAG + Vector DB** | Retrieval-Augmented Generation | Accurate school-specific answers | Complex setup |

**Recommended Approach:** RAG (Retrieval-Augmented Generation) with school data indexed in a vector database, using OpenAI/Gemini for generation.

---

## 7. Backend API Review & Suggestions

### 7.1 Complete Parent App API Reference (parent_app only)

Based on the Postman collection analysis, here are ALL the parent_app endpoints:

#### 7.1.1 Authentication APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/auth/mobileInstallsNew` | POST | Register device & request OTP | `{ mobile_no, platform_type, manufacturer_name, manufacturer_model, os_version, app_version_code, dbname }` |
| `/api/auth/mobileInstallerVerify` | POST | Verify OTP | `{ id, otp, dbname }` |
| `/api/auth/getMobStudentDetail` | POST | Get linked students | `{ id }` |
| `/api/auth/getMobStudentPhoto` | POST | Get student photo | `{ adno }` |
| `/api/auth/updateParentFirebaseId` | POST | Register FCM token | `{ firebase_id, mobile_no, dbname }` |

#### 7.1.2 Dashboard APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/dashboard/getLatestMessage` | POST | Get latest messages | `{ mobile_number }` |
| `/api/dashboard/getFlashMessage` | GET | Get flash messages | - |
| `/api/dashboard/feesFlash` | POST | Get fees flash alert | `{ adno }` |
| `/api/dashboard/checkFeesBalance` | POST | Check fee balance for students | `{ adno: [] }` |
| `/api/dashboard/batchCount` | POST | Get batch count | `{ ADNO }` |
| `/api/dashboard/getIdCard` | POST | Get student ID card | `{ adno }` |
| `/api/dashboard/forgotPassword` | POST | Forgot password | `{ mobile_no }` |

#### 7.1.3 Circular/Messages APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/circular/getAllMessagesByMobileNumber` | POST | Get all circulars | `{ mobile_number, page_size, current_size }` |
| `/api/circular/getBase64` | POST | Get attachment as base64 | `{ url }` |

#### 7.1.4 Homework APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/homework/getSaveHomeworkByClass` | POST | Get homework by class | `{ classid, adno }` |

#### 7.1.5 Attendance APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/attendance/getAttendance` | POST | Get student attendance | `{ ADNO }` |

#### 7.1.6 Exam Schedule APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/examschedule/getParentExamSchedule` | POST | Get exam schedule | `{ CLASS_ID }` |

#### 7.1.7 Report Card/Marks APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/reportcard/getMarksOnAdno` | POST | Get marks by admission no | `{ ADNO, examid, yearid }` |
| `/api/reportCard/getAnnualReportcard` | POST | Get annual report card | `{ adno }` |
| `/api/reportCard/selectExamName` | POST | Get exam names for class | `{ class_Id }` |
| `/api/reportCard/getTermType` | GET | Get term types | - |
| `/api/reportCard/getTermReportcardAdno` | POST | Get term report card | `{ ADNO, CLASSID, EXGRPID, YEARID, TERMTYPE }` |

#### 7.1.8 Payments/Fees APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/payments/getStudentPayDetails` | POST | Get fee details | `{ adno, interval }` |
| `/api/payments/getPayEnable` | POST | Check if payment enabled | `{ adno }` |
| `/api/payments/getFeeInstallment` | POST | Get fee installments | `{ adno }` |
| `/api/payments/getStudentPayHistory` | POST | Get payment history | `{ adno, CLASS_ID }` |
| `/api/payments/getPrintBill` | POST | Get printable bill | `{ rid, payment_id, adno, name, className }` |
| `/api/payments/payOnline` | POST | Initiate online payment | `{ admission_id, payment_amount, mobile_no, token }` |
| `/api/payments/updateOrderId` | POST | Update payment order | `{ token, amount, FEE_DETAILS, id }` |

#### 7.1.9 Calendar APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/calendar/getCalendar` | GET | Get school calendar | - |

#### 7.1.10 Timetable APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/timetable/getStudentTimetable` | POST | Get class timetable | `{ class_id }` |

#### 7.1.11 News & Events APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/newsevents/getMobileEvents` | POST | Get mobile events | `{ CLASS_ID }` |

#### 7.1.12 Gallery APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/gallery/getParentCategory` | POST | Get gallery categories | `{ class_id: [] }` |
| `/api/gallery/getCategoryAll` | POST | Get all items in category | `{ GalCatID }` |

#### 7.1.13 Leave Request APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/leaveletter/getLeaveRequest` | POST | Get leave requests | `{ ADNO }` |
| `/api/leaveletter/insertLeaveRequest` | POST | Submit leave request | `{ ADNO, CLASS_ID, selectedSession, s_date, e_date, message }` |
| `/api/leaveletter/updateLeaveRequest` | POST | Update leave request | `{ id, selectedSession, s_date, e_date, message }` |
| `/api/leaveLetter/deleteLeaveRequest` | POST | Delete leave request | `{ id }` |

#### 7.1.14 Parent Message APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/parentmessage/saveMessage` | POST | Send message to school | `{ AdmNo, name, classid, message, filename, type, image, thumbnail }` |
| `/api/parentmessage/getParentUploadDetails` | POST | Get uploaded messages | `{ adno }` |
| `/api/parentmessage/deleteMessage` | POST | Delete message | `{ id }` |

#### 7.1.15 MCQ/Online Exam APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/mcq/getExamDetails` | POST | Get MCQ exam details | `{ classid }` |
| `/api/mcq/getExamStatus` | POST | Get exam status | `{ adno, qus_paper_id: [] }` |
| `/api/mcq/getExamStart` | POST | Start exam | `{ qus_paper_id }` |
| `/api/mcq/insertExamAttend` | POST | Submit exam attendance | `{ adno, qus_paper_id, qus_list: [] }` |
| `/api/mcq/getMcqExamResult` | POST | Get exam result | `{ adno, qus_paper_id }` |

#### 7.1.16 Knowledge Base APIs

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/knowledgebase/getMobStudentDetailothers` | POST | Get student details (other) | `{ id }` |

---

### 7.1.17 Complete API Response Schemas (from Backend Code)

All parent_app API responses follow this standard format:

```typescript
interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
  // Some endpoints have custom fields like total_size, Student_details, etc.
}
```

#### Authentication Response Schemas

```typescript
// POST /api/auth/mobileInstallsNew
// Request: { mobile_no, platform_type, manufacturer_name, manufacturer_model, os_version, app_version_code, dbname }
interface MobileInstallsNewResponse {
  status: boolean;
  message: string;  // "Registration Successfully" | "Already Registered" | "Mobile Number or Device-info required"
  data: {
    id: number;           // Session ID for OTP verification
    contact1: string;     // Parent mobile number
  };
}

// POST /api/auth/mobileInstallerVerify
// Request: { id, otp, dbname }
interface MobileInstallerVerifyResponse {
  status: boolean;
  message: string;  // "OTP Verified Successfully" | "Invalid OTP"
  token?: string;   // JWT access token (if implemented)
  data?: any;
}

// POST /api/auth/getMobStudentDetail
// Request: { id }
interface GetMobStudentDetailResponse {
  status: boolean;
  message: string;
  data: Student[];  // Array of linked students
}

interface Student {
  ADMISSION_ID: string;
  NAME: string;
  CLASSSEC: string;
  CLASS_ID: string;
  contact: string;
  contact1: string;
  photo?: string;
}

// POST /api/auth/getMobStudentPhoto
// Request: { adno }
interface GetMobStudentPhotoResponse {
  status: boolean;
  message: string;  // "Get Student Photo Successfully"
  data: {
    photo: string;  // Base64 encoded image or URL
  };
}

// POST /api/auth/updateParentFirebaseId
// Request: { firebase_id, mobile_no, dbname }
interface UpdateParentFirebaseIdResponse {
  status: boolean;
  message: string;  // "Firebase ID Updated Successfully"
}
```

#### Dashboard Response Schemas

```typescript
// POST /api/dashboard/getLatestMessage
// Request: { mobile_number }
interface GetLatestMessageResponse {
  status: boolean;
  message: string;  // "Latest Message Successfully Fetched"
  data: CircularMessage[];
}

interface CircularMessage {
  Sno: number;
  ADNO: string;
  SMSdate: string;       // Date string
  STUDENTNAME: string;
  Message: string;
  event_image: string;   // Attachment URL
  mobile_number: string;
  type: string;
}

// GET /api/dashboard/getFlashMessage
interface GetFlashMessageResponse {
  status: boolean;
  message: string;  // "Flash Message Successfully Retrieved"
  data: FlashMessage[];
}

interface FlashMessage {
  id: number;
  message: string;
  start_date: string;
  end_date: string;
  status: string;
}

// POST /api/dashboard/feesFlash
// Request: { adno }
interface FeesFlashResponse {
  status: boolean;
  message: string;  // "Fees Flash" | "No Fees Data"
  data: string;     // Fee alert message
}

// POST /api/dashboard/checkFeesBalance
// Request: { adno: string[] }  // Array of admission numbers
interface CheckFeesBalanceResponse {
  status: boolean;
  message: string;
  data: FeeBalance[];
}

interface FeeBalance {
  ADMISSION_ID: string;
  Total_Amount: number;
  Paid_Amount: number;
  Balance_Amount: number;
}

// POST /api/dashboard/batchCount
// Request: { ADNO }
interface BatchCountResponse {
  status: boolean;
  message: string;  // "Batch Count"
  data: BatchCountItem[];
}

interface BatchCountItem {
  label: string;      // "circulars" | "attendance" | "homework" | "payment_due"
  count: number;
  status?: string;    // For attendance: "Today Present" | "Today Absent"
  payment_status?: string;  // For payment_due: "No Due" | "Due"
}

// POST /api/dashboard/getIdCard
// Request: { adno }
interface GetIdCardResponse {
  status: boolean;
  message: string;  // "Get ID Card Detail"
  data: IdCardDetail[];
}

interface IdCardDetail {
  NAME: string;
  fname: string;        // Father's name
  ADMISSION_ID: string;
  contact: string;
  contact1: string;
  dob: string;          // Date of birth
  bg: string;           // Blood group
  address: string;
}

// POST /api/dashboard/forgotPassword
// Request: { mobile_no }
interface ForgotPasswordResponse {
  status: boolean;
  message: string;  // "Password sent to registered email" | "Email not found"
}
```

#### Circular/Messages Response Schemas

```typescript
// POST /api/circular/getAllMessagesByMobileNumber
// Request: { mobile_number, page_size, current_size }
interface GetAllMessagesResponse {
  status: boolean;
  message: string;  // "Get All Messages Successfully"
  data: CircularItem[];
  total_size: number;  // Total count for pagination
}

interface CircularItem {
  Sno: number;
  ADNO: string;
  SMSdate: string;
  STUDENTNAME: string;
  Message: string;
  event_image: string;  // Can be image URL, PDF, or voice note
  type: string;
}

// POST /api/circular/getBase64
// Request: { url }
interface GetBase64Response {
  status: boolean;
  data: string;  // "data:${mimeType};base64,..." encoded file
}
```

#### Homework Response Schemas

```typescript
// POST /api/homework/getSaveHomeworkByClass
// Request: { classid, adno }
interface GetHomeworkByClassResponse {
  status: boolean;
  message: string;  // "Homework Message Successfully"
  data: HomeworkItem[];
}

interface HomeworkItem {
  MSG_ID: number;        // Sno from database
  CLASS: string;         // CLASSSEC
  MESSAGE: string;       // Homework description
  MSG_DATE: string;      // SMSdate
  subject: string;       // Subject name
  event_image: string;   // Attachment URL
}
```

#### Attendance Response Schemas

```typescript
// POST /api/attendance/getAttendance
// Request: { ADNO }
interface GetAttendanceResponse {
  status: boolean;
  message: string;  // "Get Absent List" | "No Absent List"
  data: AttendanceRecord[];
}

interface AttendanceRecord {
  absent: string;     // Date formatted as "MM-DD-YYYY"
  CLASSSEC: string;
  NAME: string;
}
```

#### Exam Schedule Response Schemas

```typescript
// POST /api/examschedule/getParentExamSchedule
// Request: { CLASS_ID }
interface GetParentExamScheduleResponse {
  status: boolean;
  message: string;  // "Exam Schedule Retrieved"
  data: ExamScheduleItem[];
}

interface ExamScheduleItem {
  exam_id: number;
  exam_name: string;
  subject: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  portion: string;
  attachment: string;  // PDF URL
}
```

#### Report Card/Marks Response Schemas

```typescript
// POST /api/reportcard/getMarksOnAdno
// Request: { ADNO, examid, yearid }
interface GetMarksOnAdnoResponse {
  status: boolean;
  message: string;
  data: MarksRecord[];
}

interface MarksRecord {
  subject: string;
  max_marks: number;
  obtained_marks: number;
  grade: string;
  remarks: string;
}

// POST /api/reportCard/selectExamName
// Request: { class_Id }
interface SelectExamNameResponse {
  status: boolean;
  message: string;
  data: ExamName[];
}

interface ExamName {
  exam_id: number;
  exam_name: string;
  exam_group_id: number;
}

// GET /api/reportCard/getTermType
interface GetTermTypeResponse {
  status: boolean;
  message: string;
  data: TermType[];
}

interface TermType {
  id: number;
  term_type: string;  // "Term 1", "Term 2", "Annual"
}

// POST /api/reportCard/getAnnualReportcard
// Request: { adno }
interface GetAnnualReportcardResponse {
  status: boolean;
  message: string;
  data: AnnualReport;
}

// POST /api/reportCard/getTermReportcardAdno
// Request: { ADNO, CLASSID, EXGRPID, YEARID, TERMTYPE }
interface GetTermReportcardResponse {
  status: boolean;
  message: string;
  data: TermReport;
}
```

#### Payments/Fees Response Schemas

```typescript
// POST /api/payments/getStudentPayDetails
// Request: { adno, interval }
interface GetStudentPayDetailsResponse {
  status: boolean;
  message: string;  // "Student details for payment" | "Incorrect Fees Details"
  Student_details: {
    FEE_DETAILS: FeeDetail[];
    TOT_AMOUNT: number;
  };
}

interface FeeDetail {
  feeheadId: number;
  feehead: string;
  feetype: string;
  Total_Amount: number;
  Paid_Amount: number;
  Balance_Amount: number;
  interval: string;
}

// POST /api/payments/getPayEnable
// Request: { adno }
interface GetPayEnableResponse {
  status: boolean;
  message: string;  // "Pay Current Year fees" | "Fees defaulter for Last Year"
}

// POST /api/payments/getFeeInstallment
// Request: { adno }
interface GetFeeInstallmentResponse {
  status: boolean;
  message: string;  // "Get Fees Installment Details"
  data: FeeInstallment[];   // Installment options
  data1: FeeStatusByInterval[];  // Balance by interval
}

interface FeeInstallment {
  id: number;
  installment_name: string;
  due_date: string;
  Year_Id: number;
  status: string;
}

interface FeeStatusByInterval {
  interval: string;
  amt: number;  // Balance amount for this interval
}

// POST /api/payments/getStudentPayHistory
// Request: { adno, CLASS_ID }
interface GetStudentPayHistoryResponse {
  status: boolean;
  message: string;  // "Student Payment History" | "No Fees History"
  Student_History: {
    TOT_HISTORY: number;
    FEE_HISTORY: {
      [receiptId: string]: PaymentHistoryItem[];
    };
  };
}

interface PaymentHistoryItem {
  FEE_REC_DET_ID: number;
  RECPID: number;
  RECPNO: string;
  PAY_ID: string;
  FEE_HEAD: string;
  YEAR_ID: number;
  FEE_TYPE: string;
  DATE: string;         // Formatted as "DD MMM YYYY"
  PAID_AMOUNT: number;
}

// POST /api/payments/getPrintBill
// Request: { rid, payment_id, adno, name, className }
interface GetPrintBillResponse {
  status: boolean;
  message: string;  // "Bill Pdf Url"
  data: string;     // URL to download bill PDF
}

// POST /api/payments/payOnline
// Request: { admission_id, payment_amount, mobile_no, token }
interface PayOnlineResponse {
  status: boolean;
  message: string;  // "Merchant Id Created"
  data: number;     // Merchant ID (lastInsertId)
}

// POST /api/payments/updateOrderId
// Request: { token, amount, FEE_DETAILS, id }
interface UpdateOrderIdResponse {
  status: boolean;
  message: string;  // "Merchant OrderId Created"
  data: {
    orderId: string;
    expireAt: string;
    redirectUrl: string;
    state: string;
  };
}
```

#### Calendar Response Schemas

```typescript
// GET /api/calendar/getCalendar
interface GetCalendarResponse {
  status: boolean;
  message: string;
  data: CalendarEvent[];
}

interface CalendarEvent {
  id: number;
  event_name: string;
  event_date: string;
  event_type: string;
  description: string;
}
```

#### Timetable Response Schemas

```typescript
// POST /api/timetable/getStudentTimetable
// Request: { class_id }
interface GetStudentTimetableResponse {
  status: boolean;
  message: string;
  data: TimetableEntry[];
}

interface TimetableEntry {
  day: string;        // "Monday", "Tuesday", etc.
  period: number;
  subject: string;
  teacher: string;
  start_time: string;
  end_time: string;
}
```

#### News & Events Response Schemas

```typescript
// POST /api/newsevents/getMobileEvents
// Request: { CLASS_ID }
interface GetMobileEventsResponse {
  status: boolean;
  message: string;  // "Get News and Event" | "No News & Events"
  data: NewsEvent[];
}

interface NewsEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  image_url: string;
  category: string;
  CLASS_ID: string;
}
```

#### Gallery Response Schemas

```typescript
// POST /api/gallery/getParentCategory
// Request: { class_id: string[] }
interface GetParentCategoryResponse {
  status: boolean;
  message: string;
  data: GalleryCategory[];
}

interface GalleryCategory {
  GalCatID: number;
  category_name: string;
  thumbnail: string;
  item_count: number;
}

// POST /api/gallery/getCategoryAll
// Request: { GalCatID }
interface GetCategoryAllResponse {
  status: boolean;
  message: string;
  data: GalleryItem[];
}

interface GalleryItem {
  id: number;
  image_url: string;
  thumbnail_url: string;
  caption: string;
  uploaded_date: string;
}
```

#### Leave Request Response Schemas

```typescript
// POST /api/leaveletter/getLeaveRequest
// Request: { ADNO }
interface GetLeaveRequestResponse {
  status: boolean;
  message: string;
  data: LeaveRequest[];
}

interface LeaveRequest {
  id: number;
  ADNO: string;
  CLASS_ID: string;
  selectedSession: string;  // "FN" | "AN" | "Full Day"
  s_date: string;           // Start date
  e_date: string;           // End date
  message: string;          // Reason
  status: string;           // "Pending" | "Approved" | "Rejected"
  created_at: string;
}

// POST /api/leaveletter/insertLeaveRequest
// Request: { ADNO, CLASS_ID, selectedSession, s_date, e_date, message }
interface InsertLeaveRequestResponse {
  status: boolean;
  message: string;  // "Leave Request Submitted Successfully"
  data: {
    id: number;     // New leave request ID
  };
}

// POST /api/leaveletter/updateLeaveRequest
// Request: { id, selectedSession, s_date, e_date, message }
interface UpdateLeaveRequestResponse {
  status: boolean;
  message: string;  // "Leave Request Updated Successfully"
}

// POST /api/leaveLetter/deleteLeaveRequest
// Request: { id }
interface DeleteLeaveRequestResponse {
  status: boolean;
  message: string;  // "Leave Request Deleted Successfully"
}
```

#### Parent Message Response Schemas

```typescript
// POST /api/parentmessage/saveMessage
// Request: { AdmNo, name, classid, message, filename, type, image, thumbnail }
interface SaveMessageResponse {
  status: boolean;
  message: string;  // "Message saved successfully" | "Message save failed"
  data: number[];   // Insert result
}

// POST /api/parentmessage/getParentUploadDetails
// Request: { adno }
interface GetParentUploadDetailsResponse {
  status: boolean;
  message?: string;  // Only on error: "No uploads from your side."
  data: ParentMessage[];
}

interface ParentMessage {
  id: number;
  Adno: string;
  name: string;
  description: string;
  url: string;          // File URL
  thumbnail: string;    // Thumbnail for videos
  classid: string;
  Date: string;
  status: string;
}

// POST /api/parentmessage/deleteMessage
// Request: { id }
interface DeleteMessageResponse {
  status: boolean;
  message: string;  // "Message Deleted" | "Oops!!! Message not Deleted"
}
```

#### MCQ/Online Exam Response Schemas

```typescript
// POST /api/mcq/getExamDetails
// Request: { classid }
interface GetExamDetailsResponse {
  status: boolean;
  message: string;  // "Get Exam Details" | "No Data"
  data: ExamDetail[];
}

interface ExamDetail {
  class_name: string;
  sub_name: string;
  qus_paper_id: number;
  qus_paper_name: string;
  qus_date: string;
}

// POST /api/mcq/getExamStatus
// Request: { adno, qus_paper_id: number[] }
interface GetExamStatusResponse {
  status: boolean;
  message: string;  // "Exam Status Fetched Successfully"
  data: ExamStatus[];
}

interface ExamStatus {
  qus_paper_id: number;
  message: string;  // "COMPLETED" | "PENDING"
}

// POST /api/mcq/getExamStart
// Request: { qus_paper_id }
interface GetExamStartResponse {
  status: boolean;
  message: string;  // "Get Exam Question Details"
  data: ExamQuestion[];
}

interface ExamQuestion {
  qus_id: number;
  qus_name: string;
  qus_image: string;
  opt1: string;
  opt2: string;
  opt3: string;
  opt4: string;
  correct_opt: string;
  qus_type: string;  // "text" | "image"
}

// POST /api/mcq/insertExamAttend
// Request: { adno, qus_paper_id, qus_list: [{qus_id, attend, correct_ans}] }
interface InsertExamAttendResponse {
  status: boolean;
  message: string;  // "Exam Attend successfully" | "Failed to record exam attendance"
  data: string;     // "SUCCESS" | "FAILED"
}

// POST /api/mcq/getMcqExamResult
// Request: { adno, qus_paper_id }
interface GetMcqExamResultResponse {
  status: boolean;
  message: string;  // "Get Exam Result"
  Result: ExamResultSummary[];
  DetailedResult: ExamResultDetail[];
}

interface ExamResultSummary {
  total_questions: number;
  attended_questions: number;
  correct_answers: number;
  mis_match: number;
  not_attended: number;
}

interface ExamResultDetail {
  qus_name: string;
  qus_image: string;
  opt1: string;
  opt2: string;
  opt3: string;
  opt4: string;
  correct_opt: string;
  attend: string;  // User's answer
}
```

---

### 7.2 API Improvements Needed

| Area | Current Issue | Suggested Improvement | Priority |
|------|---------------|----------------------|----------|
| **Authentication** | No JWT tokens returned | Implement JWT with refresh tokens | High |
| **Authentication** | OTP doesn't return expiry | Add `otp_expires_at` in response | Medium |
| **Authentication** | No rate limiting visible | Implement 3 attempts per 10 minutes | High |
| **Homework** | No endpoint to mark as completed | Add `POST /api/homework/markComplete` | Medium |
| **Circulars** | No read tracking | Add `POST /api/circular/markAsRead` | Low |
| **Error Handling** | Inconsistent error format | Standardize error response structure | Medium |
| **Pagination** | Not all endpoints support it | Add pagination to all list endpoints | Medium |
| **Search** | Limited search capabilities | Add search endpoint for circulars/homework | Low |

#### Suggested New Endpoints for Future

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `POST /api/chatbot/message` | POST | AI chatbot integration | Phase 3 |
| `GET /api/chatbot/suggestions/:adno` | GET | Contextual AI suggestions | Phase 3 |
| `POST /api/homework/markComplete` | POST | Mark homework as seen by parent | Medium |
| `POST /api/circular/markAsRead` | POST | Track read status | Low |

### 7.3 FCM Token Registration

**Current Implementation:**

```typescript
// When to register FCM token
const registerFCMToken = async (mobileNo: string, dbname: string) => {
  const fcmToken = await messaging().getToken();

  await apiClient.post('/api/auth/updateParentFirebaseId', {
    firebase_id: fcmToken,
    mobile_no: mobileNo,
    dbname: dbname,
  });
};

// Call after:
// 1. Successful OTP verification
// 2. App launch (if authenticated)
// 3. Token refresh event
```

**Suggested Improvement:**

```typescript
// After JWT implementation, simplify to:
await apiClient.post('/api/auth/fcm-token', {
  fcm_token: fcmToken,
});
// Server extracts mobile_no and dbname from JWT
```

### 7.4 API Versioning

**Recommendation:** Implement API versioning now.

```
Current:  /api/auth/...
Proposed: /api/v1/auth/...
          /api/v1/parent/...
          /api/v2/parent/...  (future)
```

---

## 8. Database Interaction Overview

### 8.1 Tables Used by the App (Inferred)

| Table | Purpose | Access Type |
|-------|---------|-------------|
| `mobile_installs` | Parent device registrations | Read/Write |
| `students` | Student master data | Read |
| `parent_student_mapping` | Parent-student relationships | Read |
| `group_messages` | Circulars/notices | Read |
| `message_attachments` | Circular attachments | Read |
| `homework` | Homework assignments | Read |
| `homework_status` | Completion status | Read/Write |
| `attendance` | Daily attendance | Read |
| `exam_schedule` | Exam timetables | Read |
| `student_marks` | Academic results | Read |
| `fee_structure` | Fee configuration | Read |
| `fee_payments` | Payment transactions | Read |
| `calendar_events` | School events | Read |
| `fcm_tokens` | Push tokens | Read/Write |
| `chat_conversations` | AI chat history | Read/Write (Future) |
| `chat_messages` | Individual messages | Read/Write (Future) |

### 8.2 Multi-School Data Isolation

**Strategy:** Separate database per school (`dbname` parameter)

```javascript
// Middleware example
const schoolDbMiddleware = async (req, res, next) => {
  const dbname = req.user?.dbname; // Extract from JWT

  if (!dbname || !isValidSchool(dbname)) {
    return res.status(403).json({ error: 'Invalid school' });
  }

  req.db = await getSchoolConnection(dbname);
  next();
};
```

---

## 9. Push Notification (FCM) Flow

### 9.1 Notification Triggers

| Event | Payload Type | Priority |
|-------|--------------|----------|
| New Circular | `circular` | High |
| Homework Assigned | `homework` | High |
| Fee Reminder | `fee` | High |
| Attendance Alert | `attendance` | Medium |
| Exam Schedule | `exam` | Medium |
| Marks Published | `marks` | Medium |
| AI Response (if background) | `chat` | Low |

### 9.2 FCM Service Implementation

```typescript
// core/notifications/fcmService.ts
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { apiClient } from '../api/apiClient';
import { secureStorage } from '../storage/secureStorage';

class FCMService {
  private unsubscribers: (() => void)[] = [];

  async initialize() {
    // Request permissions
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

    if (!enabled) {
      console.warn('Push notifications not authorized');
      return;
    }

    // Create notification channel (Android)
    await notifee.createChannel({
      id: 'school_updates',
      name: 'School Updates',
      importance: AndroidImportance.HIGH,
    });

    // Setup handlers
    this.setupForegroundHandler();
    this.setupBackgroundHandler();
    this.setupTokenRefreshHandler();

    // Register token
    await this.registerToken();
  }

  async registerToken() {
    try {
      const fcmToken = await messaging().getToken();
      const mobileNo = await secureStorage.get('mobile_no');
      const dbname = await secureStorage.get('dbname');

      if (mobileNo && dbname) {
        await apiClient.post('/api/auth/updateParentFirebaseId', {
          firebase_id: fcmToken,
          mobile_no: mobileNo,
          dbname: dbname,
        });
      }
    } catch (error) {
      console.error('FCM token registration failed:', error);
    }
  }

  private setupForegroundHandler() {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      // Display notification in foreground
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Update',
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'school_updates',
          pressAction: { id: 'default' },
        },
        data: remoteMessage.data,
      });
    });

    this.unsubscribers.push(unsubscribe);
  }

  private setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });
  }

  private setupTokenRefreshHandler() {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      await this.registerToken();
    });

    this.unsubscribers.push(unsubscribe);
  }

  cleanup() {
    this.unsubscribers.forEach(unsub => unsub());
  }
}

export const fcmService = new FCMService();
```

---

## 10. State Management & Data Flow

### 10.1 Recommended Approach

| State Type | Tool | Purpose |
|------------|------|---------|
| Server State | **React Query** | API data, caching, refetching |
| Global Client State | **Zustand** | Auth, selected student, theme |
| Local Component State | **useState** | Form inputs, UI toggles |
| Persisted State | **MMKV** | Cache, preferences |

### 10.2 React Query Setup

```typescript
// core/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkvStorage } from '../storage/mmkvStorage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Offline persistence
export const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => mmkvStorage.getString(key) ?? null,
    setItem: (key, value) => mmkvStorage.set(key, value),
    removeItem: (key) => mmkvStorage.delete(key),
  },
});
```

### 10.3 Zustand Store

```typescript
// store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/core/storage/mmkvStorage';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  token: string | null;

  // Students
  students: Student[];
  selectedStudentId: string | null;

  // UI
  theme: 'light' | 'dark' | 'system';

  // Actions
  setAuth: (token: string, students: Student[]) => void;
  setSelectedStudent: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      students: [],
      selectedStudentId: null,
      theme: 'system',

      setAuth: (token, students) => set({
        isAuthenticated: true,
        token,
        students,
        selectedStudentId: students[0]?.adno || null,
      }),

      setSelectedStudent: (id) => set({ selectedStudentId: id }),

      setTheme: (theme) => set({ theme }),

      logout: () => set({
        isAuthenticated: false,
        token: null,
        students: [],
        selectedStudentId: null,
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => mmkvStorage.getString(key) ?? null,
        setItem: (key, value) => mmkvStorage.set(key, value),
        removeItem: (key) => mmkvStorage.delete(key),
      })),
    }
  )
);
```

---

## 11. Security & Access Control

### 11.1 JWT Implementation

```typescript
// core/auth/authService.ts
import { secureStorage } from '../storage/secureStorage';
import { apiClient } from '../api/apiClient';
import jwtDecode from 'jwt-decode';

interface JWTPayload {
  sub: string;          // Parent mobile
  dbname: string;
  students: string[];
  exp: number;
  iat: number;
}

export const authService = {
  async getAccessToken(): Promise<string | null> {
    const token = await secureStorage.get('access_token');

    if (!token) return null;

    // Check expiration
    const decoded = jwtDecode<JWTPayload>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return this.refreshToken();
    }

    return token;
  },

  async refreshToken(): Promise<string | null> {
    const refreshToken = await secureStorage.get('refresh_token');

    if (!refreshToken) {
      this.logout();
      return null;
    }

    try {
      const response = await apiClient.post('/api/auth/parent/refresh', {
        refresh_token: refreshToken,
      });

      await secureStorage.set('access_token', response.data.access_token);
      return response.data.access_token;
    } catch {
      this.logout();
      return null;
    }
  },

  async logout() {
    await secureStorage.delete('access_token');
    await secureStorage.delete('refresh_token');
    // Clear other sensitive data
  },
};
```

### 11.2 API Client Interceptors

```typescript
// core/api/apiClient.ts
import axios from 'axios';
import { authService } from '../auth/authService';

const apiClient = axios.create({
  baseURL: 'https://dev1.schooltree.in/api',
  timeout: 30000,
});

// Request interceptor - attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await authService.logout();
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

### 11.3 Secure Storage

```typescript
// core/storage/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
// OR
import EncryptedStorage from 'react-native-encrypted-storage';

export const secureStorage = {
  async set(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },

  async delete(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};
```

---

## 12. Development Phases & Milestones

### Phase 1: MVP (Core Functionality)

| Feature | Priority | Estimated Effort |
|---------|----------|------------------|
| Project Setup & Design System | P0 | - |
| Login/OTP Authentication | P0 | - |
| Dashboard Overview | P0 | - |
| Student Selector | P0 | - |
| View Circulars | P0 | - |
| View Homework | P0 | - |
| View Attendance | P0 | - |
| Push Notifications (Basic) | P0 | - |
| Logout | P0 | - |

**Deliverable:** Internal testing APK/IPA

---

### Phase 2: Feature Complete

| Feature | Priority | Estimated Effort |
|---------|----------|------------------|
| View Marks | P1 | - |
| View Exam Schedule | P1 | - |
| View Fee Details | P1 | - |
| School Calendar | P1 | - |
| Mark Homework Complete | P1 | - |
| Deep Linking | P1 | - |
| Dark Mode | P2 | - |
| Offline Mode | P2 | - |
| Gallery Module | P2 | - |
| Timetable Module | P2 | - |

**Deliverable:** Beta release

---

### Phase 3: AI & Scale

| Feature | Priority | Estimated Effort |
|---------|----------|------------------|
| AI Chatbot (Basic) | P1 | - |
| Quick Replies | P1 | - |
| Contextual Suggestions | P2 | - |
| Voice Input | P3 | - |
| Multi-language Support | P3 | - |
| Widget Support | P3 | - |
| Performance Optimization | P2 | - |
| Analytics Integration | P2 | - |

**Deliverable:** Production release with AI

---

### Future Phases

| Module | Description |
|--------|-------------|
| Transport Tracking | Live bus location |
| Online Payments | Fee gateway |
| PTM Scheduling | Meeting bookings |
| Leave Application | Submit leave requests |
| Report Cards | Downloadable PDFs |

---

## 13. Risks, Assumptions & Constraints

### 13.1 Design Limitations

| Limitation | Mitigation |
|------------|------------|
| Profile/Settings not designed | Create minimal version |
| Gallery/Timetable not designed | Use standard layouts |
| Chatbot UI not designed | Follow industry patterns |
| No error/empty states | Design generic placeholders |

### 13.2 Backend Constraints

| Constraint | Mitigation |
|------------|------------|
| Teacher-centric APIs | Create parent wrapper endpoints |
| No API documentation | Document during development |
| No JWT auth currently | Plan for implementation |
| No chatbot backend | Requires new development |

### 13.3 AI Chatbot Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inaccurate responses | Medium | Use RAG with school data |
| High API costs | Medium | Cache common queries |
| Slow response times | Low | Stream responses |
| Data privacy concerns | Medium | On-premise option |

### 13.4 Dependencies

| Dependency | Version | Risk |
|------------|---------|------|
| React Native | 0.73+ | Low |
| React Navigation | 6.x | Low |
| React Query | 5.x | Low |
| Firebase Messaging | 18.x | Medium |
| Zustand | 4.x | Low |
| OpenAI/Gemini API | Latest | Medium |

---

## Appendix A: Quick Reference - Component Exports

```typescript
// Import from design system
import {
  // Atoms
  Button,
  Text,
  Icon,
  Input,
  Avatar,
  Badge,
  Chip,
  Spinner,
  Divider,

  // Molecules
  SearchBar,
  StudentChip,
  OtpInput,
  AttachmentItem,
  AudioPlayer,
  SubjectTag,
  EmptyState,

  // Organisms
  ScreenHeader,
  StudentSelector,
  BottomNavigation,
  CircularCard,
  HomeworkCard,
  ConfirmModal,

  // Templates
  ListTemplate,
  AuthTemplate,
  ChatTemplate,

  // Theme
  colors,
  typography,
  spacing,
} from '@/design-system';
```

---

## Appendix B: Module Quick Reference

```typescript
// Enable/disable modules
const moduleConfig = {
  auth: true,
  dashboard: true,
  students: true,
  circulars: true,
  homework: true,
  attendance: true,
  exams: true,
  marks: true,
  fees: true,
  calendar: true,
  profile: true,
  chatbot: false,      // Enable in Phase 3
  transport: false,    // Future
  payments: false,     // Future
};
```

---

**End of Document**

*Version 2.0 - Updated with Atomic Design, Modular Architecture, and AI Chatbot Foundation*
