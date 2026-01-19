import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../core/auth';
import {ROUTES} from '../core/constants';
import {Spinner, Icon} from '../design-system';
import {useTheme} from '../design-system/theme/ThemeContext';
import {useBrand, useAuthType} from '../core/brand';

// Auth Screens
import {LoginScreen, OtpScreen, PasswordScreen} from '../modules/auth';

// Main Screens
import {DashboardScreen} from '../modules/dashboard';
import {HomeworkScreen} from '../modules/homework';
import {ProfileScreen, NotificationSettingsScreen} from '../modules/profile';

// Feature Screens
import {CircularsListScreen, CircularDetailScreen} from '../modules/circulars';
import {AttendanceScreen} from '../modules/attendance';
import {ExamScheduleScreen} from '../modules/exams';
import {FeeDetailsScreen} from '../modules/fees';
import {CalendarScreen} from '../modules/calendar';
import {GalleryScreen} from '../modules/gallery';
import {TimetableScreen} from '../modules/timetable';
import {ChatScreen} from '../modules/chat';
import {MarksScreen} from '../modules/marks';

// Stack and Tab navigators
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Navigator - Handles login flow based on brand auth type
 * Auth type can be: 'otp', 'password', or 'both'
 */
const AuthNavigator = () => {
  const authType = useAuthType();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <AuthStack.Screen name={ROUTES.LOGIN} component={LoginScreen} />

      {/* Show Password screen if auth type is 'password' or 'both' */}
      {(authType === 'password' || authType === 'both') && (
        <AuthStack.Screen name={ROUTES.PASSWORD} component={PasswordScreen} />
      )}

      {/* Show OTP screen if auth type is 'otp' or 'both' */}
      {(authType === 'otp' || authType === 'both') && (
        <AuthStack.Screen name={ROUTES.OTP} component={OtpScreen} />
      )}
    </AuthStack.Navigator>
  );
};

/**
 * Bottom Tab Navigator - Shows tabs based on enabled modules
 * Modules are configured per brand in brand.config.json
 */
const TabNavigator = () => {
  const {colors} = useTheme();
  const {isModuleEnabled} = useBrand();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 10,
          paddingBottom: 24,
          height: 80,
          backgroundColor: colors.surfaceLight,
        },
        tabBarIcon: ({color, size}) => {
          let iconName: any = 'home';
          if (route.name === ROUTES.DASHBOARD) iconName = 'home';
          else if (route.name === ROUTES.HOMEWORK) iconName = 'homework';
          else if (route.name === ROUTES.CIRCULARS) iconName = 'campaign';
          else if (route.name === ROUTES.CHAT) iconName = 'chat';
          else if (route.name === ROUTES.PROFILE) iconName = 'profile';

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      {/* Dashboard - Always shown */}
      {isModuleEnabled('dashboard') && (
        <Tab.Screen
          name={ROUTES.DASHBOARD}
          component={DashboardScreen}
          options={{tabBarLabel: 'Home'}}
        />
      )}

      {/* Homework - Conditional */}
      {isModuleEnabled('homework') && (
        <Tab.Screen
          name={ROUTES.HOMEWORK}
          component={HomeworkScreen}
          options={{tabBarLabel: 'Homework'}}
        />
      )}

      {/* Circulars - Conditional */}
      {isModuleEnabled('circulars') && (
        <Tab.Screen
          name={ROUTES.CIRCULARS}
          component={CircularsListScreen}
          options={{tabBarLabel: 'Circulars'}}
        />
      )}

      {/* Chat - Conditional */}
      {isModuleEnabled('chat') && (
        <Tab.Screen
          name={ROUTES.CHAT}
          component={ChatScreen}
          options={{tabBarLabel: 'Chat'}}
        />
      )}

      {/* Profile - Always shown */}
      {isModuleEnabled('profile') && (
        <Tab.Screen
          name={ROUTES.PROFILE}
          component={ProfileScreen}
          options={{tabBarLabel: 'Profile'}}
        />
      )}
    </Tab.Navigator>
  );
};

/**
 * Main App Navigator - Shows screens based on enabled modules
 * Feature screens are conditionally included based on brand configuration
 */
const MainNavigator = () => {
  const {isModuleEnabled} = useBrand();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {/* Main Tab Navigator - Always present */}
      <MainStack.Screen name={ROUTES.MAIN_TABS} component={TabNavigator} />

      {/* Circular Detail - Show if circulars module is enabled */}
      {isModuleEnabled('circulars') && (
        <MainStack.Screen
          name={ROUTES.CIRCULAR_DETAIL}
          component={CircularDetailScreen}
        />
      )}

      {/* Attendance - Conditional */}
      {isModuleEnabled('attendance') && (
        <MainStack.Screen
          name={ROUTES.ATTENDANCE}
          component={AttendanceScreen}
        />
      )}

      {/* Exam Schedule - Conditional */}
      {isModuleEnabled('exams') && (
        <MainStack.Screen
          name={ROUTES.EXAM_SCHEDULE}
          component={ExamScheduleScreen}
        />
      )}

      {/* Calendar - Conditional */}
      {isModuleEnabled('calendar') && (
        <MainStack.Screen name={ROUTES.CALENDAR} component={CalendarScreen} />
      )}

      {/* Fee Details - Conditional */}
      {isModuleEnabled('fees') && (
        <MainStack.Screen
          name={ROUTES.FEE_DETAILS}
          component={FeeDetailsScreen}
        />
      )}

      {/* Gallery - Conditional */}
      {isModuleEnabled('gallery') && (
        <MainStack.Screen name={ROUTES.GALLERY} component={GalleryScreen} />
      )}

      {/* Timetable - Conditional */}
      {isModuleEnabled('timetable') && (
        <MainStack.Screen name={ROUTES.TIMETABLE} component={TimetableScreen} />
      )}

      {/* Marks - Conditional */}
      {isModuleEnabled('marks') && (
        <MainStack.Screen name={ROUTES.MARKS} component={MarksScreen} />
      )}

      {/* Notification Settings - Always available (part of profile) */}
      <MainStack.Screen
        name={ROUTES.NOTIFICATION_SETTINGS}
        component={NotificationSettingsScreen}
      />
    </MainStack.Navigator>
  );
};

// Root Navigator
export const Navigation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
