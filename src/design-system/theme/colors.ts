/**
 * Colors Module
 *
 * This file provides static color exports for backward compatibility.
 * For dynamic theming based on brand, use the useTheme() or useColors() hooks.
 *
 * Migration guide:
 * - Old: import { colors } from '@/design-system/theme/colors';
 * - New: const { colors } = useTheme(); // or const colors = useColors();
 *
 * The static colors below match the default brand (crescent).
 * Components should gradually migrate to using the hooks for full white-label support.
 */

export const colors = {
  // Brand
  primary: '#137fec',
  primaryDark: '#0b4dc9',
  primarySoft: '#EFF6FF',

  // Background
  backgroundLight: '#f6f7f8',
  backgroundDark: '#101922',
  surfaceLight: '#ffffff',
  surfaceDark: '#1e293b',

  // Text
  textPrimary: '#111418',
  textSecondary: '#617589',
  textMuted: '#94A3B8',
  textDark: '#f3f4f6',
  textWhite: '#ffffff',

  // Status
  success: '#10b981',
  successLight: '#D1FAE5',
  warning: '#f59e0b',
  warningLight: '#FEF3C7',
  error: '#ef4444',
  errorLight: '#FEE2E2',
  info: '#3b82f6',
  infoLight: '#DBEAFE',

  // Subject Colors
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

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Common
  white: '#ffffff',
  black: '#000000',
};

export type Colors = typeof colors;

// Re-export theme hooks for convenience
export {useTheme, useColors} from './ThemeContext';
