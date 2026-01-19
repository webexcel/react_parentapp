import React, {createContext, useContext, useMemo, useCallback} from 'react';
import {
  BrandConfig,
  getBrandConfig,
  getCurrentBrandId,
  BrandModules,
} from './BrandConfig';

// Module name type for type-safe access
export type ModuleName = keyof BrandModules;

// Context value type
interface BrandContextType {
  /** Current brand configuration */
  brand: BrandConfig;
  /** Current brand ID */
  brandId: string;
  /** Check if a specific module is enabled */
  isModuleEnabled: (moduleName: ModuleName) => boolean;
  /** Get configuration for a specific module */
  getModuleConfig: <T extends ModuleName>(
    moduleName: T,
  ) => BrandModules[T] | null;
  /** Check if notifications are enabled */
  isNotificationsEnabled: () => boolean;
  /** Check if offline mode is enabled */
  isOfflineModeEnabled: () => boolean;
  /** Check if dark mode is available */
  isDarkModeAvailable: () => boolean;
}

// Create context with null default (will throw if used outside provider)
const BrandContext = createContext<BrandContextType | null>(null);

// Provider props
interface BrandProviderProps {
  children: React.ReactNode;
  /** Optional brand ID override (useful for testing) */
  brandId?: string;
}

/**
 * BrandProvider - Provides brand configuration to the app
 *
 * Wrap your app with this provider to access brand settings throughout:
 *
 * @example
 * ```tsx
 * <BrandProvider>
 *   <App />
 * </BrandProvider>
 * ```
 */
export const BrandProvider: React.FC<BrandProviderProps> = ({
  children,
  brandId,
}) => {
  // Get brand ID from props or environment
  const currentBrandId = brandId || getCurrentBrandId();

  // Load brand configuration
  const brand = useMemo(
    () => getBrandConfig(currentBrandId),
    [currentBrandId],
  );

  // Check if a module is enabled
  const isModuleEnabled = useCallback(
    (moduleName: ModuleName): boolean => {
      const moduleConfig = brand.features.modules[moduleName];
      return moduleConfig?.enabled ?? false;
    },
    [brand.features.modules],
  );

  // Get module configuration
  const getModuleConfig = useCallback(
    <T extends ModuleName>(moduleName: T): BrandModules[T] | null => {
      const moduleConfig = brand.features.modules[moduleName];
      if (!moduleConfig?.enabled) {
        return null;
      }
      return moduleConfig as BrandModules[T];
    },
    [brand.features.modules],
  );

  // Check if notifications are enabled
  const isNotificationsEnabled = useCallback((): boolean => {
    return brand.features.notifications.enabled;
  }, [brand.features.notifications.enabled]);

  // Check if offline mode is enabled
  const isOfflineModeEnabled = useCallback((): boolean => {
    return brand.features.offlineMode;
  }, [brand.features.offlineMode]);

  // Check if dark mode is available
  const isDarkModeAvailable = useCallback((): boolean => {
    return brand.features.darkMode;
  }, [brand.features.darkMode]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<BrandContextType>(
    () => ({
      brand,
      brandId: currentBrandId,
      isModuleEnabled,
      getModuleConfig,
      isNotificationsEnabled,
      isOfflineModeEnabled,
      isDarkModeAvailable,
    }),
    [
      brand,
      currentBrandId,
      isModuleEnabled,
      getModuleConfig,
      isNotificationsEnabled,
      isOfflineModeEnabled,
      isDarkModeAvailable,
    ],
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
};

/**
 * useBrand - Hook to access brand configuration
 *
 * @throws Error if used outside BrandProvider
 *
 * @example
 * ```tsx
 * const { brand, isModuleEnabled } = useBrand();
 *
 * if (isModuleEnabled('fees')) {
 *   // Show fees module
 * }
 * ```
 */
export const useBrand = (): BrandContextType => {
  const context = useContext(BrandContext);

  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }

  return context;
};

/**
 * useBrandId - Hook to get just the brand ID
 */
export const useBrandId = (): string => {
  const {brandId} = useBrand();
  return brandId;
};

/**
 * useBrandName - Hook to get the brand display name
 */
export const useBrandName = (): string => {
  const {brand} = useBrand();
  return brand.brand.name;
};

/**
 * useAuthType - Hook to get the authentication type
 */
export const useAuthType = () => {
  const {brand} = useBrand();
  return brand.auth.type;
};

/**
 * useApiConfig - Hook to get API configuration
 */
export const useApiConfig = () => {
  const {brand} = useBrand();
  return brand.api;
};

export default BrandContext;
