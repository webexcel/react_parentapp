import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { ButtonVariant, ButtonSize } from './Button.types';

export const getButtonStyles = (variant: ButtonVariant, size: ButtonSize, disabled: boolean) => {
  const baseStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      fontWeight: fontWeight.semibold,
    },
  });

  const variantStyles = {
    primary: {
      container: {
        backgroundColor: colors.primary,
      },
      text: {
        color: colors.textWhite,
      },
    },
    secondary: {
      container: {
        backgroundColor: colors.primarySoft,
      },
      text: {
        color: colors.primary,
      },
    },
    outline: {
      container: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.primary,
      },
      text: {
        color: colors.primary,
      },
    },
    ghost: {
      container: {
        backgroundColor: colors.transparent,
      },
      text: {
        color: colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: colors.error,
      },
      text: {
        color: colors.textWhite,
      },
    },
  };

  const sizeStyles = {
    sm: {
      container: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        minHeight: 36,
      },
      text: {
        fontSize: fontSize.sm,
      },
    },
    md: {
      container: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
      },
      text: {
        fontSize: fontSize.base,
      },
    },
    lg: {
      container: {
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.xl,
        minHeight: 52,
      },
      text: {
        fontSize: fontSize.md,
      },
    },
  };

  return {
    container: [
      baseStyles.container,
      variantStyles[variant].container,
      sizeStyles[size].container,
    ],
    text: [
      baseStyles.text,
      variantStyles[variant].text,
      sizeStyles[size].text,
    ],
  };
};
