import React from 'react';
import {useBrand, ModuleName} from './BrandContext';

/**
 * useIsModuleEnabled - Check if a specific module is enabled
 *
 * @param moduleName - The name of the module to check
 * @returns boolean indicating if the module is enabled
 *
 * @example
 * ```tsx
 * const isFeesEnabled = useIsModuleEnabled('fees');
 * if (isFeesEnabled) {
 *   // Render fees component
 * }
 * ```
 */
export const useIsModuleEnabled = (moduleName: ModuleName): boolean => {
  const {isModuleEnabled} = useBrand();
  return isModuleEnabled(moduleName);
};

/**
 * useModuleConfig - Get the configuration for a specific module
 *
 * @param moduleName - The name of the module
 * @returns Module configuration or null if disabled
 *
 * @example
 * ```tsx
 * const feesConfig = useModuleConfig('fees');
 * if (feesConfig?.showPaymentGateway) {
 *   // Show payment gateway
 * }
 * ```
 */
export const useModuleConfig = <T extends ModuleName>(moduleName: T) => {
  const {getModuleConfig} = useBrand();
  return getModuleConfig(moduleName);
};

/**
 * useAuthType - Get the authentication type for current brand
 *
 * @returns 'otp' | 'password' | 'both'
 *
 * @example
 * ```tsx
 * const authType = useAuthType();
 * if (authType === 'otp' || authType === 'both') {
 *   // Show OTP input
 * }
 * ```
 */
export {useAuthType} from './BrandContext';

/**
 * useFeatureFlag - Check if a specific feature is enabled
 *
 * @param feature - The feature to check
 * @returns boolean indicating if the feature is enabled
 *
 * @example
 * ```tsx
 * const isDarkModeEnabled = useFeatureFlag('darkMode');
 * ```
 */
export const useFeatureFlag = (
  feature: 'darkMode' | 'offlineMode' | 'notifications' | 'paymentGateway',
): boolean => {
  const {brand, isNotificationsEnabled, isOfflineModeEnabled, isDarkModeAvailable} =
    useBrand();

  switch (feature) {
    case 'darkMode':
      return isDarkModeAvailable();
    case 'offlineMode':
      return isOfflineModeEnabled();
    case 'notifications':
      return isNotificationsEnabled();
    case 'paymentGateway':
      return brand.features.modules.fees.showPaymentGateway || false;
    default:
      return false;
  }
};

/**
 * useEnabledModules - Get list of all enabled modules
 *
 * @returns Array of enabled module names
 *
 * @example
 * ```tsx
 * const enabledModules = useEnabledModules();
 * // ['dashboard', 'circulars', 'homework', ...]
 * ```
 */
export const useEnabledModules = (): ModuleName[] => {
  const {brand} = useBrand();
  const modules = brand.features.modules;

  return (Object.keys(modules) as ModuleName[]).filter(
    moduleName => modules[moduleName]?.enabled,
  );
};

/**
 * withModuleEnabled - HOC to conditionally render based on module availability
 *
 * @param WrappedComponent - Component to conditionally render
 * @param moduleName - The module that must be enabled
 * @returns Component that only renders if module is enabled
 *
 * @example
 * ```tsx
 * const FeesScreenWithGuard = withModuleEnabled(FeesScreen, 'fees');
 * // FeesScreenWithGuard will only render if fees module is enabled
 * ```
 */
export function withModuleEnabled<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleName: ModuleName,
): React.FC<P> {
  const WithModuleEnabled: React.FC<P> = props => {
    const isEnabled = useIsModuleEnabled(moduleName);

    if (!isEnabled) {
      return null;
    }

    return React.createElement(WrappedComponent, props);
  };

  // Set display name for debugging
  const wrappedName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithModuleEnabled.displayName = `withModuleEnabled(${wrappedName})`;

  return WithModuleEnabled;
}

/**
 * ModuleGuard - Component to conditionally render children based on module
 *
 * @example
 * ```tsx
 * <ModuleGuard module="fees">
 *   <FeesButton />
 * </ModuleGuard>
 * ```
 */
interface ModuleGuardProps {
  module: ModuleName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
  module,
  children,
  fallback = null,
}) => {
  const isEnabled = useIsModuleEnabled(module);

  if (!isEnabled) {
    return fallback as React.ReactElement | null;
  }

  return children as React.ReactElement;
};

/**
 * AuthGuard - Component to conditionally render based on auth type
 *
 * @example
 * ```tsx
 * <AuthGuard types={['otp', 'both']}>
 *   <OtpInput />
 * </AuthGuard>
 * ```
 */
interface AuthGuardProps {
  types: Array<'otp' | 'password' | 'both'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  types,
  children,
  fallback = null,
}) => {
  const {brand} = useBrand();
  const currentAuthType = brand.auth.type;

  if (!types.includes(currentAuthType)) {
    return fallback as React.ReactElement | null;
  }

  return children as React.ReactElement;
};
