import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';
import { colors, spacing } from '../../theme';

const DURATION_MS = 2500;

// Module-level like AppAlert, so AppToast.show() works from hooks and
// non-React code; <AppToastHost /> renders the latest message.
let listener: ((message: string) => void) | null = null;

/** A short message that disappears on its own (no button to tap). */
export const AppToast = {
  show: (message: string) => {
    listener?.(message);
  },
};

export const AppToastHost: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (next) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(next);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(null));
      }, DURATION_MS);
    };
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.toast, { opacity }]}>
        <Icon name="info" size={18} color={colors.white} />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    // Rendered outside SafeAreaProvider (like AppAlertHost); clears the 80px tab bar.
    bottom: 110,
    left: spacing.base,
    right: spacing.base,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(17, 20, 24, 0.92)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    flexShrink: 1,
  },
});
