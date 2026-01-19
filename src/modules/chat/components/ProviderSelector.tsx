import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, colors, spacing, borderRadius } from '../../../design-system';
import { ChatProvider } from '../types/chat.types';

interface ProviderSelectorProps {
  currentProvider: ChatProvider;
  onSelect: (provider: ChatProvider) => void;
  disabled?: boolean;
}

interface ProviderOption {
  id: ChatProvider;
  label: string;
}

const providers: ProviderOption[] = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'dialogflow', label: 'Assistant' },
];

/**
 * Toggle component for switching between AI chat providers
 */
export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  currentProvider,
  onSelect,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        {providers.map((provider) => {
          const isActive = currentProvider === provider.id;
          return (
            <TouchableOpacity
              key={provider.id}
              style={[
                styles.option,
                isActive && styles.optionActive,
                disabled && styles.optionDisabled,
              ]}
              onPress={() => onSelect(provider.id)}
              disabled={disabled || isActive}
              activeOpacity={0.7}
            >
              <Text
                variant="caption"
                style={[
                  styles.optionText,
                  isActive && styles.optionTextActive,
                  disabled && !isActive && styles.optionTextDisabled,
                ]}
              >
                {provider.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
  },
  optionTextDisabled: {
    color: colors.textMuted,
  },
});
