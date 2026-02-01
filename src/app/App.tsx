import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet, Alert} from 'react-native';
import {AppProviders} from './AppProviders';
import {Navigation} from './Navigation';
import {fcmService} from '../core/notifications';
import {SplashScreen} from '../design-system/atoms';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize FCM
    const initFCM = async () => {
      await fcmService.initialize();

      // Check if app was opened from notification
      const initialNotification = await fcmService.getInitialNotification();
      if (initialNotification) {
        console.log('App opened from notification:', initialNotification);
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

    return () => {
      fcmService.cleanup();
    };
  }, []);

  if (showSplash) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <AppProviders>
          <SplashScreen onAnimationComplete={() => setShowSplash(false)} />
        </AppProviders>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppProviders>
          <Navigation />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
