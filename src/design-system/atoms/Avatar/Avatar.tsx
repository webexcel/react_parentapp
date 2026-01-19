import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { Text } from '../Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarColor {
  bg: string;
  text: string;
}

export interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  color?: AvatarColor;
  showBorder?: boolean;
  style?: object;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: fontSize.xs,
  md: fontSize.sm,
  lg: fontSize.lg,
  xl: fontSize['2xl'],
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = '',
  size = 'md',
  color,
  showBorder = false,
  style,
}) => {
  const dimension = sizeMap[size];
  const innerDimension = showBorder ? dimension - 6 : dimension;

  const containerStyle = showBorder && color ? {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    borderWidth: 1,
    borderColor: color.text,
    backgroundColor: color.bg,
    padding: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } : undefined;

  const imageContent = source ? (
    <Image
      source={{ uri: source }}
      style={[
        styles.image,
        { width: innerDimension, height: innerDimension, borderRadius: innerDimension / 2 },
      ]}
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        color && { backgroundColor: color.bg },
        { width: innerDimension, height: innerDimension, borderRadius: innerDimension / 2 },
      ]}
    >
      <Text
        style={[
          styles.initials,
          color && { color: color.text },
          { fontSize: fontSizeMap[size] },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );

  if (showBorder && containerStyle) {
    return (
      <View style={[containerStyle, style]}>
        {imageContent}
      </View>
    );
  }

  return imageContent;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.backgroundLight,
  },
  placeholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
