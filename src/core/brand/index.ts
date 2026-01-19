// Brand Configuration System
// =========================
// This module provides white-label/multi-tenant support for the app.
// Each school can have its own branding, features, and configuration.

// Core configuration types and loaders
export {
  getCurrentBrandId,
  getBrandConfig,
  registerBrandConfig,
  getAvailableBrands,
  currentBrand,
  defaultColors,
} from './BrandConfig';

export type {
  BrandConfig,
  BrandColors,
  BrandFeatures,
  BrandModules,
  ModuleConfig,
  AuthType,
} from './BrandConfig';

// React context and hooks
export {
  BrandProvider,
  useBrand,
  useBrandId,
  useBrandName,
  useAuthType,
  useApiConfig,
} from './BrandContext';

export type {ModuleName} from './BrandContext';

// Feature flags and guards
export {
  useIsModuleEnabled,
  useModuleConfig,
  useFeatureFlag,
  useEnabledModules,
  withModuleEnabled,
  ModuleGuard,
  AuthGuard,
} from './featureFlags';
