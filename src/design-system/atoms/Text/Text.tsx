import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSize, fontWeight } from '../../theme/typography';
import { TextProps, TextVariant, TextColor } from './Text.types';

const variantStyles: Record<TextVariant, object> = {
  h1: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  h2: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.base, fontWeight: fontWeight.normal },
  bodySmall: { fontSize: fontSize.sm, fontWeight: fontWeight.normal },
  caption: { fontSize: fontSize.xs, fontWeight: fontWeight.normal },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
};

const colorStyles: Record<TextColor, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  white: colors.textWhite,
  error: colors.error,
  success: colors.success,
  warning: colors.warning,
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  bold = false,
  semibold = false,
  center = false,
  style,
  children,
  ...props
}) => {
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        { color: colorStyles[color] },
        bold && { fontWeight: fontWeight.bold },
        semibold && { fontWeight: fontWeight.semibold },
        center && { textAlign: 'center' },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: colors.textPrimary,
  },
});
