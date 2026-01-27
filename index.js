/**
 * @format
 */

// Initialize Reactotron in development (must be first import)
if (__DEV__) {
  require('./src/core/debug');
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundHandler } from './src/core/notifications';

// Register FCM background handler - must be done outside of component lifecycle
registerBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
