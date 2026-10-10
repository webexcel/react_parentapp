import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {AppProviders} from './AppProviders';
import {Navigation} from './Navigation';
import {fcmService} from '../core/notifications';
import {NotificationOpener, openNotification} from '../core/notifications/NotificationOpener';
import crashlytics from '@react-native-firebase/crashlytics';
import {SplashScreen} from '../design-system/atoms';
import {ForceUpdateScreen} from '../design-system/organisms';
import {AppAlert, AppAlertHost} from '../design-system/molecules';
import {useForceUpdate} from '../core/hooks/useForceUpdate';

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {needsUpdate, playStoreUrl, isChecking} = useForceUpdate();

  useEffect(() => {
    // Initialize FCM
    const initFCM = async () => {
      // Tapped notification while the app was in the background. Registered
      // before initialize(), which can wait on the permission prompt.
      fcmService.onNotificationOpened(openNotification);

      await fcmService.initialize();

      // App was started by tapping a notification
      const initialNotification = await fcmService.getInitialNotification();
      if (initialNotification) {
        openNotification(initialNotification);
      }

      // Notification arrived while the app is open: show it, View opens it
      fcmService.setForegroundHandler(notification => {
        AppAlert.alert(
          notification.title || 'Notification',
          notification.body || '',
          [
            {text: 'Close', style: 'cancel'},
            {text: 'View', onPress: () => openNotification(notification)},
          ],
        );
      });
    };

    initFCM();

    crashlytics().log('App opened');
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      crashlytics().recordError(error);
      previousHandler(error, isFatal);
    });

    return () => {
      fcmService.cleanup();
    };
  }, []);

  if (showSplash || isChecking) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  if (needsUpdate) {
    return <ForceUpdateScreen playStoreUrl={playStoreUrl} />;
  }

  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AppProviders>
        <AppContent />
        <NotificationOpener />
        <AppAlertHost />
      </AppProviders>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
