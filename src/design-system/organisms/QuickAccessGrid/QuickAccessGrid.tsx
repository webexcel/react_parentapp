import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { Text } from '../../atoms/Text';
import { Icon, IconName } from '../../atoms/Icon';

export interface QuickAccessItem {
  id: string;
  icon: IconName;
  label: string;
  color?: string;
  bgColor?: string;
  onPress: () => void;
}

export interface QuickAccessGridProps {
  items: QuickAccessItem[];
  columns?: number;
  style?: object;
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({
  items,
  columns = 4,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, { width: `${100 / columns}%` }]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.bgColor || colors.primarySoft },
            ]}
          >
            <Icon
              name={item.icon}
              size={24}
              color={item.color || colors.primary}
            />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  item: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
