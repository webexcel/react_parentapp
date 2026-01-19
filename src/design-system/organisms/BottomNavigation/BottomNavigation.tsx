import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, shadows } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { Text } from '../../atoms/Text';
import { Icon, IconName } from '../../atoms/Icon';

export interface NavItem {
  key: string;
  icon: IconName;
  label: string;
}

export interface BottomNavigationProps {
  items: NavItem[];
  activeKey: string;
  onPress: (key: string) => void;
  style?: object;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  onPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => onPress(item.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isActive && styles.iconContainerActive,
              ]}
            >
              <Icon
                name={item.icon}
                size={24}
                color={isActive ? colors.primary : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    paddingTop: spacing.sm,
    ...shadows.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: 12,
  },
  iconContainerActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  labelActive: {
    color: colors.primary,
  },
});
