import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { Text } from '../../atoms/Text';
import { Icon, IconName } from '../../atoms/Icon';

export interface StatCardProps {
  icon: IconName;
  label: string;
  value: string | number;
  iconColor?: string;
  iconBgColor?: string;
  style?: object;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  iconColor = colors.primary,
  iconBgColor = colors.primarySoft,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
