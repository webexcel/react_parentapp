import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';

export interface FCMNotification {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export type NotificationHandler = (notification: FCMNotification) => void;

class FCMService {
  private foregroundHandler: NotificationHandler | null = null;
  private backgroundHandler: NotificationHandler | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private foregroundUnsubscribe: (() => void) | null = null;
  private appStateSubscription: ReturnType<
    typeof AppState.addEventListener
  > | null = null;
  private isInitialized = false;

  /**
   * Initialize FCM service - call this early in app lifecycle
   */
  async initialize(): Promise<void> {
    try {
      // Request permission with force option
      const hasPermission = await this.requestPermissionWithForce();
      if (!hasPermission) {
        console.log('FCM: Notification permission denied, waiting for user');
        return;
      }

      await this.setupFCM();
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * Setup FCM after permission is granted
   */
  private async setupFCM(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Get and log initial token
    const token = await this.getToken();
    console.log('FCM Token:', token);

    // Set up token refresh listener
    this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(newToken => {
      console.log('FCM Token refreshed:', newToken);
      // TODO: Send new token to backend
    });

    // Set up foreground message handler
    this.foregroundUnsubscribe = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('FCM Foreground message:', remoteMessage);
        if (this.foregroundHandler) {
          this.foregroundHandler({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          });
        }
      },
    );

    this.isInitialized = true;
    console.log('FCM Service initialized successfully');
  }

  /**
   * Request notification permission with force - keeps prompting until allowed
   */
  async requestPermissionWithForce(): Promise<boolean> {
    const hasPermission = await this.checkPermission();

    if (hasPermission) {
      return true;
    }

    // Try requesting permission first
    const granted = await this.requestPermission();
    if (granted) {
      return true;
    }

    // Permission denied - show alert and guide to settings
    this.showPermissionRequiredAlert();

    // Listen for app state changes to check permission when user returns
    this.setupAppStateListener();

    return false;
  }

  /**
   * Check if notification permission is already granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (!result) {
          return false;
        }
      }

      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('FCM checkPermission error:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permission denied');
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('FCM Authorization status:', authStatus, 'Enabled:', enabled);
      return enabled;
    } catch (error) {
      console.error('FCM permission request error:', error);
      return false;
    }
  }

  /**
   * Show alert requiring user to enable notifications
   */
  private showPermissionRequiredAlert(): void {
    Alert.alert(
      'Notifications Required',
      'This app requires notification permissions to keep you updated about important school information. Please enable notifications in Settings.',
      [
        {
          text: 'Open Settings',
          onPress: () => this.openAppSettings(),
        },
      ],
      {cancelable: false},
    );
  }

  /**
   * Open app settings
   */
  private openAppSettings(): void {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  }

  /**
   * Setup listener to check permission when app comes to foreground
   */
  private setupAppStateListener(): void {
    if (this.appStateSubscription) {
      return;
    }

    this.appStateSubscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          const hasPermission = await this.checkPermission();
          if (hasPermission && !this.isInitialized) {
            console.log('FCM: Permission granted, initializing...');
            await this.setupFCM();
            // Remove listener once initialized
            if (this.appStateSubscription) {
              this.appStateSubscription.remove();
              this.appStateSubscription = null;
            }
          } else if (!hasPermission) {
            // Still no permission, show alert again
            this.showPermissionRequiredAlert();
          }
        }
      },
    );
  }

  /**
   * Get the FCM token for this device
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('FCM getToken error:', error);
      return null;
    }
  }

  /**
   * Delete the FCM token (useful for logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('FCM token deleted');
    } catch (error) {
      console.error('FCM deleteToken error:', error);
    }
  }

  /**
   * Set handler for foreground notifications
   */
  setForegroundHandler(handler: NotificationHandler): void {
    this.foregroundHandler = handler;
  }

  /**
   * Set handler for background/quit state notifications
   */
  setBackgroundHandler(handler: NotificationHandler): void {
    this.backgroundHandler = handler;
  }

  /**
   * Check if app was opened from a notification
   */
  async getInitialNotification(): Promise<FCMNotification | null> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        return {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        };
      }
      return null;
    } catch (error) {
      console.error('FCM getInitialNotification error:', error);
      return null;
    }
  }

  /**
   * Subscribe to a topic for targeted notifications
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log('FCM subscribed to topic:', topic);
    } catch (error) {
      console.error('FCM subscribeToTopic error:', error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log('FCM unsubscribed from topic:', topic);
    } catch (error) {
      console.error('FCM unsubscribeFromTopic error:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe();
      this.tokenRefreshUnsubscribe = null;
    }
    if (this.foregroundUnsubscribe) {
      this.foregroundUnsubscribe();
      this.foregroundUnsubscribe = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance
export const fcmService = new FCMService();

// Background message handler - must be registered outside of component lifecycle
// This should be called in index.js
export function registerBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('FCM Background message:', remoteMessage);
    // Handle background message here
    // Note: You cannot update UI directly from here
  });
}
