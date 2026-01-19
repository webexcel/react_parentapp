import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ButtonProps } from './Button.types';
import { getButtonStyles } from './Button.styles';

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...props
}) => {
  const styles = getButtonStyles(variant, size, disabled || loading);
  const spinnerColor = variant === 'primary' || variant === 'danger'
    ? colors.textWhite
    : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        fullWidth && { width: '100%' },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View style={localStyles.content}>
          {leftIcon && <View style={localStyles.leftIcon}>{leftIcon}</View>}
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {rightIcon && <View style={localStyles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});
