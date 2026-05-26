import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet, Alert} from 'react-native';
import {AppProviders} from './AppProviders';
import {Navigation} from './Navigation';
import {fcmService} from '../core/notifications';
import crashlytics from '@react-native-firebase/crashlytics';
import {SplashScreen} from '../design-system/atoms';
import {ForceUpdateScreen} from '../design-system/organisms';
import {useForceUpdate} from '../core/hooks/useForceUpdate';

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {needsUpdate, playStoreUrl, isChecking} = useForceUpdate();

  useEffect(() => {
    // Initialize FCM
    const initFCM = async () => {
      await fcmService.initialize();

      // Check if app was opened from notification
      const initialNotification = await fcmService.getInitialNotification();
      if (initialNotification) {
        // Handle navigation based on notification data
      }

      // Set foreground notification handler
      fcmService.setForegroundHandler(notification => {
        // Show alert for foreground notifications
        Alert.alert(
          notification.title || 'Notification',
          notification.body || '',
          [{text: 'OK'}],
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
