import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScreenHeader,
  Text,
  Switch,
  Divider,
  colors,
  spacing,
  borderRadius,
  shadows,
  Spinner,
} from '../../../design-system';
import {
  getNotificationSettings,
  updateNotificationSetting,
  type NotificationSettings,
} from '../../../core/storage';

interface SettingItem {
  key: keyof NotificationSettings;
  label: string;
  description: string;
  category?: 'general' | 'features' | 'preferences';
}

const NOTIFICATION_SETTINGS: SettingItem[] = [
  {
    key: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Enable or disable all push notifications',
    category: 'general',
  },
  {
    key: 'circulars',
    label: 'Circulars',
    description: 'Get notified about new circulars and announcements',
    category: 'features',
  },
  {
    key: 'homework',
    label: 'Homework',
    description: 'Receive notifications for new homework assignments',
    category: 'features',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Get alerts about attendance updates',
    category: 'features',
  },
  {
    key: 'exams',
    label: 'Exams',
    description: 'Receive notifications about exam schedules and updates',
    category: 'features',
  },
  {
    key: 'fees',
    label: 'Fees',
    description: 'Get notified about fee dues and payment reminders',
    category: 'features',
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Receive notifications about school events and calendar updates',
    category: 'features',
  },
  {
    key: 'sound',
    label: 'Sound',
    description: 'Play sound when receiving notifications',
    category: 'preferences',
  },
  {
    key: 'vibration',
    label: 'Vibration',
    description: 'Vibrate when receiving notifications',
    category: 'preferences',
  },
];

export const NotificationSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      // Optimistic update
      if (settings) {
        setSettings({ ...settings, [key]: value });
      }

      // Save to storage
      await updateNotificationSetting(key, value);

      // If toggling master switch, show appropriate message
      if (key === 'pushNotifications') {
        if (!value) {
          Alert.alert(
            'Notifications Disabled',
            'You will not receive any push notifications. You can re-enable them anytime from settings.'
          );
        } else {
          // Check if platform permissions are granted
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Alert.alert(
              'Notifications Enabled',
              'Make sure notification permissions are granted in your device settings.'
            );
          }
        }
      }
    } catch (error) {
      // Revert on error
      if (settings) {
        setSettings({ ...settings, [key]: !value });
      }
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const renderSettingItem = (item: SettingItem) => {
    const isDisabled = item.key !== 'pushNotifications' && !settings?.pushNotifications;

    return (
      <View key={item.key} style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text variant="body" semibold>
            {item.label}
          </Text>
          <Text
            variant="caption"
            color={isDisabled ? 'muted' : 'secondary'}
            style={styles.settingDescription}
          >
            {item.description}
          </Text>
        </View>
        <Switch
          value={settings?.[item.key] || false}
          onValueChange={(value) => handleToggle(item.key, value)}
          disabled={isDisabled}
        />
      </View>
    );
  };

  const renderCategory = (title: string, category: 'general' | 'features' | 'preferences') => {
    const items = NOTIFICATION_SETTINGS.filter((item) => item.category === category);
    if (items.length === 0) return null;

    return (
      <View style={styles.categoryContainer}>
        <Text variant="label" color="secondary" style={styles.categoryTitle}>
          {title}
        </Text>
        <View style={styles.settingsCard}>
          {items.map((item, index) => (
            <React.Fragment key={item.key}>
              {renderSettingItem(item)}
              {index < items.length - 1 && <Divider spacing={0} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return <Spinner fullScreen message="Loading settings..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Notification Settings" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="caption" color="secondary" style={styles.headerDescription}>
          Manage your notification preferences. You can control which notifications you want
          to receive and customize notification behavior.
        </Text>

        {renderCategory('GENERAL', 'general')}
        {renderCategory('FEATURE NOTIFICATIONS', 'features')}
        {renderCategory('NOTIFICATION PREFERENCES', 'preferences')}

        <View style={styles.infoCard}>
          <Text variant="caption" color="secondary" center>
            Note: To completely disable notifications, you may also need to turn them off in
            your device settings.
          </Text>
        </View>
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
  headerDescription: {
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  categoryContainer: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  settingsCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    minHeight: 72,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingDescription: {
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.base,
  },
});
