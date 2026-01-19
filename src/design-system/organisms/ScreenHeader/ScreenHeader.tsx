import React from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Text } from '../../atoms/Text';
import { Icon, IconName } from '../../atoms/Icon';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  style?: object;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  rightComponent,
  transparent = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        transparent && styles.containerTransparent,
        style,
      ]}
    >
      <StatusBar
        barStyle={transparent ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : colors.surfaceLight}
        translucent={transparent}
      />
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="back" size={24} color={transparent ? colors.textWhite : colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerContainer}>
        <Text
          variant="h3"
          style={[styles.title, transparent && styles.titleTransparent]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            variant="caption"
            color={transparent ? 'white' : 'secondary'}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightComponent}
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
            <Icon
              name={rightIcon}
              size={24}
              color={transparent ? colors.textWhite : colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing['3xl'] : spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: spacing.xs,
  },
  rightButton: {
    padding: spacing.xs,
  },
  title: {
    textAlign: 'center',
  },
  titleTransparent: {
    color: colors.textWhite,
  },
});
