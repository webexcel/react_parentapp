import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface DividerProps {
  vertical?: boolean;
  spacing?: number;
  color?: string;
  style?: object;
}

export const Divider: React.FC<DividerProps> = ({
  vertical = false,
  spacing: dividerSpacing = spacing.base,
  color = colors.border,
  style,
}) => {
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: color },
        vertical
          ? { marginHorizontal: dividerSpacing }
          : { marginVertical: dividerSpacing },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
