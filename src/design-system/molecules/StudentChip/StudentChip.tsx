import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { Avatar, AvatarColor } from '../../atoms/Avatar';
import { Text } from '../../atoms/Text';

export interface StudentChipProps {
  name: string;
  className?: string;
  photo?: string | null;
  selected?: boolean;
  color?: AvatarColor;
  onPress?: () => void;
  style?: object;
}

export const StudentChip: React.FC<StudentChipProps> = ({
  name,
  className,
  photo,
  selected = false,
  color,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar source={photo} name={name} size="sm" color={color} showBorder={true} />
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.name,
            selected && styles.nameSelected,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {className && (
          <Text
            style={[
              styles.className,
              selected && styles.classNameSelected,
            ]}
            numberOfLines={1}
          >
            {className}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  textContainer: {
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  nameSelected: {
    color: colors.primary,
  },
  className: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  classNameSelected: {
    color: colors.primary,
  },
});
