import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScreenHeader,
  Text,
  Avatar,
  Icon,
  Divider,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useBrandName } from '../../../core/brand';
import { ROUTES } from '../../../core/constants';

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export const ProfileScreen: React.FC = () => {
  const { students, logout, refreshStudentPhotos } = useAuth();
  const navigation = useNavigation<any>();
  const brandName = useBrandName();

  // Debug: Log student data to see what's available
  React.useEffect(() => {
    console.log('=== PROFILE SCREEN STUDENTS ===');
    console.log('Number of students:', students.length);
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, JSON.stringify(student, null, 2));
    });
  }, [students]);

  const handleRefreshPhotos = async () => {
    Alert.alert(
      'Refresh Photos',
      'Fetching latest student photos...',
      [{ text: 'OK' }]
    );
    try {
      await refreshStudentPhotos();
      Alert.alert('Success', 'Student photos refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh photos. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'refresh-photos',
      icon: 'profile',
      label: 'Refresh Student Photos',
      onPress: handleRefreshPhotos,
    },
    {
      id: 'change-password',
      icon: 'lock',
      label: 'Change Password',
      onPress: () => navigation.navigate(ROUTES.CHANGE_PASSWORD),
    },
    {
      id: 'notifications',
      icon: 'notification',
      label: 'Notification Settings',
      onPress: () => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS),
    },
    {
      id: 'language',
      icon: 'settings',
      label: 'Language',
      onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon.'),
    },
    {
      id: 'about',
      icon: 'circular',
      label: 'About App',
      onPress: () => Alert.alert(brandName, 'Version 1.0.0\n\nStay connected with your child\'s education.'),
    },
    {
      id: 'privacy',
      icon: 'profile',
      label: 'Privacy Policy',
      onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon.'),
    },
    {
      id: 'terms',
      icon: 'circular',
      label: 'Terms & Conditions',
      onPress: () => Alert.alert('Coming Soon', 'This feature will be available soon.'),
    },
    {
      id: 'logout',
      icon: 'logout',
      label: 'Logout',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Profiles */}
        {students.length > 0 && (
          <View style={styles.studentCard}>
            <Text variant="label" color="secondary" style={styles.sectionLabel}>
              STUDENT PROFILE{students.length > 1 ? 'S' : ''}
            </Text>
            {students.map((student, index) => (
              <React.Fragment key={student.id}>
                <View style={styles.studentRow}>
                  <Avatar
                    source={student.photo}
                    name={student.name}
                    size="lg"
                  />
                  <View style={styles.studentInfo}>
                    <Text variant="body" semibold>
                      {student.name}
                    </Text>
                    {student.studentId && (
                      <Text variant="caption" color="secondary">
                        Adm No: {student.studentId}
                      </Text>
                    )}
                    {student.className && (
                      <Text variant="caption" color="secondary">
                        Class: {student.className}
                      </Text>
                    )}
                    {student.rollNo && (
                      <Text variant="caption" color="secondary">
                        Roll No: {student.rollNo}
                      </Text>
                    )}
                  </View>
                </View>
                {index < students.length - 1 && (
                  <Divider spacing={spacing.md} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color={item.danger ? colors.error : colors.textSecondary}
                  />
                </View>
                <Text
                  variant="body"
                  style={[
                    styles.menuLabel,
                    item.danger && { color: colors.error },
                  ]}
                >
                  {item.label}
                </Text>
                <Icon
                  name="chevronRight"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <Divider spacing={0} />}
            </React.Fragment>
          ))}
        </View>

        {/* App Version */}
        <Text variant="caption" color="muted" center style={styles.version}>
          {brandName} v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  studentCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  menuCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
  },
  version: {
    marginTop: spacing.base,
  },
});
