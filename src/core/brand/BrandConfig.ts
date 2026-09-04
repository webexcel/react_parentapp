import Config from 'react-native-config';
import { NativeModules, Platform } from 'react-native';

// Import brand registry (add new schools in brands/index.ts)
import { brandRegistry } from '../../../brands';

// Get brand info from native module (more reliable than react-native-config)
const { BrandModule } = NativeModules;
const nativeBrandId = Platform.OS === 'android' ? BrandModule?.BRAND_ID : Config.BRAND_ID;

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
  parentMessage: ModuleConfig;
  leaveLetter: ModuleConfig;
}

// Splash screen configuration
export type SplashVariant = 'default' | 'minimal' | 'fullLogo' | 'gradient';

export interface SplashConfig {
  variant: SplashVariant;
  showTagline?: boolean;
  showLoader?: boolean;
  duration?: number;
  backgroundColor?: string; // Override primary color
  logoSize?: 'small' | 'medium' | 'large';
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
  splash?: SplashConfig;
}

// Social media links (all optional - a blank/missing link hides that icon)
export interface SocialLinks {
  youtube?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
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
  social?: SocialLinks;
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

// Default splash config
const defaultSplash: SplashConfig = {
  variant: 'default',
  showTagline: true,
  showLoader: true,
  duration: 2500,
  logoSize: 'medium',
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
    timetable: {
      enabled: true,
      breaks: [
        { afterPeriod: 2, label: 'Short Break', startTime: '10:00', endTime: '10:15' },
        { afterPeriod: 4, label: 'Lunch Break', startTime: '11:45', endTime: '12:30' },
      ],
    },
    chat: { enabled: false },
    profile: { enabled: true },
    parentMessage: { enabled: true },
    leaveLetter: { enabled: true },
  },
  notifications: {
    enabled: true,
    topics: ['circulars', 'homework', 'attendance'],
  },
  offlineMode: true,
  darkMode: false,
  splash: defaultSplash,
};

/**
 * Merge a brand's `features.modules` over the defaults, one level deeper than a
 * plain spread.
 *
 * A single `{ ...defaults, ...overrides }` at the `modules` level replaces each
 * module object wholesale, so a brand declaring `timetable: { enabled: true }`
 * silently discarded the default `breaks` array. 43 of the 48 brands do exactly
 * that, which is why their timetables rendered with no break rows while the
 * five brands that happen to list `breaks` showed them.
 *
 * Merging per module keeps every default sub-key a brand does not explicitly
 * set, for `timetable.breaks` and for any future module default alike.
 *
 * Arrays are replaced, never concatenated: a brand that DOES list its own
 * `breaks` gets exactly those, not the defaults plus its own.
 */
const mergeModules = (
  defaults: BrandFeatures['modules'],
  overrides: Partial<BrandFeatures['modules']> = {},
): BrandFeatures['modules'] => {
  const merged: Record<string, unknown> = { ...(defaults as unknown as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides || {})) {
    const base = (defaults as unknown as Record<string, unknown>)[key];
    const bothPlainObjects =
      value !== null && typeof value === 'object' && !Array.isArray(value) &&
      base !== null && typeof base === 'object' && !Array.isArray(base);
    merged[key] = bothPlainObjects
      ? { ...(base as object), ...(value as object) }
      : value;
  }
  return merged as unknown as BrandFeatures['modules'];
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
    modules: mergeModules(defaultFeatures.modules, jsonConfig.features.modules),
    notifications: jsonConfig.features.notifications,
    offlineMode: jsonConfig.features.offlineMode,
    darkMode: jsonConfig.features.darkMode,
    splash: { ...defaultSplash, ...jsonConfig.features.splash },
  },
  social: jsonConfig.social || {},
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
 * Uses native BrandModule for Android (more reliable than react-native-config)
 */
export const getCurrentBrandId = (): string => {
  // Try native module first (Android), then react-native-config, then fallback
  const brandId = nativeBrandId || Config.BRAND_ID || 'crescent';
  return brandId;
};

/**
 * Get brand configuration by ID
 * Falls back to crescent if brand not found
 */
export const getBrandConfig = (brandId?: string): BrandConfig => {
  const id = brandId || getCurrentBrandId();
  const config = brandConfigs[id];

  if (!config) {
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
