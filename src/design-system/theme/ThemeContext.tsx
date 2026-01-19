import React, {createContext, useContext, useMemo, useState, useCallback} from 'react';
import {useColorScheme} from 'react-native';
import {useBrand} from '../../core/brand';
import {BrandColors} from '../../core/brand/BrandConfig';

// Extended colors that include both brand colors and additional UI colors
export interface ExtendedColors extends BrandColors {
  // Background variants
  backgroundLight: string;
  backgroundDark: string;
  surfaceLight: string;
  surfaceDark: string;

  // Text variants
  textPrimary: string;
  textMuted: string;
  textDark: string;
  textWhite: string;

  // Status light variants
  successLight: string;
  warningLight: string;
  errorLight: string;
  infoLight: string;

  // Subject colors
  subjects: {
    maths: string;
    science: string;
    english: string;
    history: string;
    geography: string;
    social: string;
  };

  // Semantic
  border: string;
  borderDark: string;
  shadow: string;

  // Attendance
  present: string;
  absent: string;
  holiday: string;
  leave: string;

  // Common
  transparent: string;
  overlay: string;
  white: string;
  black: string;
}

// Theme context value
interface ThemeContextType {
  /** Current color palette (dynamic based on brand and dark mode) */
  colors: ExtendedColors;
  /** Whether dark mode is currently active */
  isDarkMode: boolean;
  /** Toggle dark mode on/off */
  toggleDarkMode: () => void;
  /** Set dark mode explicitly */
  setDarkMode: (enabled: boolean) => void;
  /** Whether dark mode feature is available for this brand */
  isDarkModeAvailable: boolean;
}

// Default/fallback colors (matching existing colors.ts)
const defaultExtendedColors: ExtendedColors = {
  // Brand colors
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

  // Background variants
  backgroundLight: '#f6f7f8',
  backgroundDark: '#101922',
  surfaceLight: '#ffffff',
  surfaceDark: '#1e293b',

  // Text variants
  textPrimary: '#111418',
  textMuted: '#94A3B8',
  textDark: '#f3f4f6',
  textWhite: '#ffffff',

  // Status light variants
  successLight: '#D1FAE5',
  warningLight: '#FEF3C7',
  errorLight: '#FEE2E2',
  infoLight: '#DBEAFE',

  // Subject colors
  subjects: {
    maths: '#3b82f6',
    science: '#10b981',
    english: '#8b5cf6',
    history: '#f59e0b',
    geography: '#14b8a6',
    social: '#f97316',
  },

  // Semantic
  border: '#E2E8F0',
  borderDark: '#334155',
  shadow: 'rgba(0, 0, 0, 0.05)',

  // Attendance
  present: '#10b981',
  absent: '#ef4444',
  holiday: '#f59e0b',
  leave: '#8b5cf6',

  // Common
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#ffffff',
  black: '#000000',
};

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Provider props
interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider - Provides dynamic theming based on brand configuration
 *
 * Must be used inside BrandProvider.
 *
 * @example
 * ```tsx
 * <BrandProvider>
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 * </BrandProvider>
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const {brand, isDarkModeAvailable} = useBrand();
  const systemColorScheme = useColorScheme();

  // Dark mode state (only used if brand allows it)
  const [darkModeOverride, setDarkModeOverride] = useState<boolean | null>(null);

  // Determine if dark mode is active
  const isDarkMode = useMemo(() => {
    if (!isDarkModeAvailable()) {
      return false;
    }
    // If user has explicitly set dark mode, use that
    if (darkModeOverride !== null) {
      return darkModeOverride;
    }
    // Otherwise follow system preference
    return systemColorScheme === 'dark';
  }, [isDarkModeAvailable, darkModeOverride, systemColorScheme]);

  // Build extended colors from brand colors
  const colors = useMemo((): ExtendedColors => {
    const brandColors = brand.theme.colors;

    // Merge brand colors with extended colors
    const extendedColors: ExtendedColors = {
      // Brand colors (from config)
      ...brandColors,

      // Background variants (derived)
      backgroundLight: brandColors.background,
      backgroundDark: '#101922',
      surfaceLight: brandColors.surface,
      surfaceDark: '#1e293b',

      // Text variants (derived)
      textPrimary: brandColors.text,
      textMuted: '#94A3B8',
      textDark: '#f3f4f6',
      textWhite: '#ffffff',

      // Status light variants (derived from status colors)
      successLight: lightenColor(brandColors.success, 0.85),
      warningLight: lightenColor(brandColors.warning, 0.85),
      errorLight: lightenColor(brandColors.error, 0.85),
      infoLight: lightenColor(brandColors.info, 0.85),

      // Subject colors (fixed for consistency)
      subjects: {
        maths: '#3b82f6',
        science: '#10b981',
        english: '#8b5cf6',
        history: '#f59e0b',
        geography: '#14b8a6',
        social: '#f97316',
      },

      // Semantic (derived)
      border: '#E2E8F0',
      borderDark: '#334155',
      shadow: 'rgba(0, 0, 0, 0.05)',

      // Attendance (use brand status colors)
      present: brandColors.success,
      absent: brandColors.error,
      holiday: brandColors.warning,
      leave: '#8b5cf6',

      // Common (fixed)
      transparent: 'transparent',
      overlay: 'rgba(0, 0, 0, 0.5)',
      white: '#ffffff',
      black: '#000000',
    };

    // Apply dark mode transformations if active
    if (isDarkMode) {
      return {
        ...extendedColors,
        background: extendedColors.backgroundDark,
        surface: extendedColors.surfaceDark,
        text: extendedColors.textDark,
        textSecondary: extendedColors.textMuted,
        border: extendedColors.borderDark,
      };
    }

    return extendedColors;
  }, [brand.theme.colors, isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    if (!isDarkModeAvailable()) {
      return;
    }
    setDarkModeOverride(prev => (prev === null ? !isDarkMode : !prev));
  }, [isDarkModeAvailable, isDarkMode]);

  // Set dark mode explicitly
  const setDarkMode = useCallback(
    (enabled: boolean) => {
      if (!isDarkModeAvailable()) {
        return;
      }
      setDarkModeOverride(enabled);
    },
    [isDarkModeAvailable],
  );

  // Memoize context value
  const value = useMemo<ThemeContextType>(
    () => ({
      colors,
      isDarkMode,
      toggleDarkMode,
      setDarkMode,
      isDarkModeAvailable: isDarkModeAvailable(),
    }),
    [colors, isDarkMode, toggleDarkMode, setDarkMode, isDarkModeAvailable],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * useTheme - Hook to access theme colors and dark mode controls
 *
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * const { colors, isDarkMode, toggleDarkMode } = useTheme();
 *
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.text }}>Hello</Text>
 * </View>
 * ```
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

/**
 * useColors - Shorthand hook to get just the colors
 *
 * @example
 * ```tsx
 * const colors = useColors();
 * ```
 */
export const useColors = (): ExtendedColors => {
  const {colors} = useTheme();
  return colors;
};

/**
 * Helper function to lighten a hex color
 */
function lightenColor(hex: string, percent: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Lighten
  const newR = Math.round(r + (255 - r) * percent);
  const newG = Math.round(g + (255 - g) * percent);
  const newB = Math.round(b + (255 - b) * percent);

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Export default colors for backward compatibility
export {defaultExtendedColors as colors};
export type {ExtendedColors as Colors};

export default ThemeContext;
