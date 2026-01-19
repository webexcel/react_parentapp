import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Icon, colors, spacing } from '../../../../design-system';

interface PaymentSummaryBarProps {
  selectedCount: number;
  totalFees: number;
  selectedAmount: number;
  onPayPress: () => void;
  disabled?: boolean;
}

export const PaymentSummaryBar: React.FC<PaymentSummaryBarProps> = ({
  selectedCount,
  totalFees,
  selectedAmount,
  onPayPress,
  disabled = false,
}) => {
  if (selectedCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.infoContainer}>
          <Icon name="info" size={20} color={colors.textMuted} />
          <Text style={styles.infoText}>
            Select fees to pay (in order)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.countContainer}>
          <Text style={styles.countLabel}>Selected</Text>
          <Text style={styles.countValue}>
            {selectedCount} of {totalFees} fees
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            ₹{selectedAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payButton, disabled && styles.payButtonDisabled]}
        onPress={onPayPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Icon name="payments" size={20} color="#FFFFFF" />
        <Text style={styles.payButtonText}>Pay Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  countContainer: {
    flex: 1,
  },
  countLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  countValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
});
