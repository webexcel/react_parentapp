import Config from 'react-native-config';

// Import brand registry (add new schools in brands/index.ts)
import { brandRegistry } from '../../../brands';

// Auth type options
export type AuthType = 'otp' | 'password' | 'both';

// Color definitions for brand theming
export interface BrandColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Module configuration
export interface ModuleConfig {
  enabled: boolean;
  [key: string]: any;
}

// All available modules
export interface BrandModules {
  dashboard: ModuleConfig;
  circulars: ModuleConfig;
  homework: ModuleConfig;
  attendance: ModuleConfig;
  exams: ModuleConfig;
  marks: ModuleConfig;
  fees: ModuleConfig & { showPaymentGateway?: boolean };
  calendar: ModuleConfig;
  gallery: ModuleConfig;
  timetable: ModuleConfig;
  chat: ModuleConfig;
  profile: ModuleConfig;
}

// Feature flags and settings
export interface BrandFeatures {
  modules: BrandModules;
  notifications: {
    enabled: boolean;
    topics: string[];
  };
  offlineMode: boolean;
  darkMode: boolean;
}

// Complete brand configuration
export interface BrandConfig {
  brand: {
    id: string;
    name: string;
    shortName: string;
    tagline: string;
  };
  api: {
    baseUrl: string;
    databaseName: string;
  };
  firebase: {
    projectId: string;
    configGroup: string;
  };
  auth: {
    type: AuthType;
    otpLength: number;
    countryCode: string;
  };
  theme: {
    colors: BrandColors;
    fonts: {
      primary: string;
      secondary: string;
    };
  };
  features: BrandFeatures;
}

// Default colors (used as fallback)
const defaultColors: BrandColors = {
  primary: '#137fec',
  primaryDark: '#0b4dc9',
  primarySoft: '#EFF6FF',
  accent: '#10b981',
  background: '#f6f7f8',
  surface: '#ffffff',
  text: '#111418',
  textSecondary: '#617589',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Default features
const defaultFeatures: BrandFeatures = {
  modules: {
    dashboard: { enabled: true },
    circulars: { enabled: true },
    homework: { enabled: true },
    attendance: { enabled: true },
    exams: { enabled: true },
    marks: { enabled: true },
    fees: { enabled: true, showPaymentGateway: false },
    calendar: { enabled: true },
    gallery: { enabled: true },
    timetable: { enabled: true },
    chat: { enabled: false },
    profile: { enabled: true },
  },
  notifications: {
    enabled: true,
    topics: ['circulars', 'homework', 'attendance'],
  },
  offlineMode: true,
  darkMode: false,
};

// Helper to transform JSON config to BrandConfig
const transformJsonConfig = (jsonConfig: any): BrandConfig => ({
  brand: jsonConfig.brand,
  api: {
    // Allow API_BASE_URL override from .env for local development (e.g., localhost:3005)
    // Otherwise use the URL from brand.config.json
    baseUrl: Config.API_BASE_URL || jsonConfig.api.baseUrl,
    databaseName: jsonConfig.api.databaseName,
  },
  firebase: jsonConfig.firebase,
  auth: {
    type: jsonConfig.auth.type as AuthType,
    otpLength: jsonConfig.auth.otpLength,
    countryCode: jsonConfig.auth.countryCode,
  },
  theme: {
    colors: { ...defaultColors, ...jsonConfig.theme.colors },
    fonts: jsonConfig.theme.fonts,
  },
  features: {
    modules: { ...defaultFeatures.modules, ...jsonConfig.features.modules },
    notifications: jsonConfig.features.notifications,
    offlineMode: jsonConfig.features.offlineMode,
    darkMode: jsonConfig.features.darkMode,
  },
});

/**
 * Get the Gemini API key from environment
 * This is kept in .env as it's a secret that shouldn't be in JSON configs
 */
export const getGeminiApiKey = (): string | undefined => {
  return Config.GEMINI_API_KEY;
};

// Build brand configurations from registry
const brandConfigs: Record<string, BrandConfig> = Object.fromEntries(
  Object.entries(brandRegistry).map(([brandId, jsonConfig]) => [
    brandId,
    transformJsonConfig(jsonConfig),
  ])
);

/**
 * Get the current brand ID from environment/build config
 */
export const getCurrentBrandId = (): string => {
  return Config.BRAND_ID || 'crescent';
};

/**
 * Get brand configuration by ID
 * Falls back to crescent if brand not found
 */
export const getBrandConfig = (brandId?: string): BrandConfig => {
  const id = brandId || getCurrentBrandId();
  const config = brandConfigs[id];

  if (!config) {
    console.warn(`Brand "${id}" not found, falling back to crescent`);
    return brandConfigs.crescent;
  }

  return config;
};

/**
 * Register a new brand configuration at runtime
 * Useful for loading configs from JSON files
 */
export const registerBrandConfig = (
  brandId: string,
  config: BrandConfig,
): void => {
  brandConfigs[brandId] = config;
};

/**
 * Get all registered brand IDs
 */
export const getAvailableBrands = (): string[] => {
  return Object.keys(brandConfigs);
};

/**
 * Current brand config singleton
 * Use this for quick access in non-component code
 */
export const currentBrand = getBrandConfig();

/**
 * Export default colors for backward compatibility
 */
export { defaultColors };
