import Config from 'react-native-config';

// TODO: Fix react-native-config for new architecture - Config returns empty object
// Temporarily using hardcoded values until react-native-config is properly configured
const ENV_API_BASE_URL = 'http://192.168.1.8:3005/api';
const ENV_FIREBASE_PROJECT_ID = 'schooltrees-69f4b';

console.log('🔧 CONFIG DEBUG:', JSON.stringify(Config));
console.log('🔧 Using API_BASE_URL:', ENV_API_BASE_URL);

export const config = {
  API_BASE_URL: Config.API_BASE_URL || ENV_API_BASE_URL,
  FIREBASE_PROJECT_ID: Config.FIREBASE_PROJECT_ID || ENV_FIREBASE_PROJECT_ID,
  APP_NAME: 'Crescent Parent App',
  APP_VERSION: '1.0.0',
};

export const API_TIMEOUT = 30000; // 30 seconds
