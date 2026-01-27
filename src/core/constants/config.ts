import { getBrandConfig } from '../brand/BrandConfig';

// Get config from brand configuration (reads from brand.config.json with .env override)
const brandConfig = getBrandConfig();

console.log('🔧 CONFIG DEBUG: Using brand:', brandConfig.brand.id);
console.log('🔧 Using API_BASE_URL:', brandConfig.api.baseUrl);

export const config = {
  API_BASE_URL: brandConfig.api.baseUrl,
  FIREBASE_PROJECT_ID: brandConfig.firebase.projectId,
  APP_NAME: brandConfig.brand.name,
  APP_VERSION: '1.0.0',
};

export const API_TIMEOUT = 30000; // 30 seconds
