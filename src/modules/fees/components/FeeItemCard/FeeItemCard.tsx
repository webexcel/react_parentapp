import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Icon, colors, spacing } from '../../../../design-system';
import { SelectableFeeItem } from '../../types/fees.types';

interface FeeItemCardProps {
  fee: SelectableFeeItem;
  onPress: (feeheadId: number) => void;
  showOrder?: boolean;
}

export const FeeItemCard: React.FC<FeeItemCardProps> = ({
  fee,
  onPress,
  showOrder = true,
}) => {
  const handlePress = () => {
    if (fee.isSelectable || fee.isSelected) {
      onPress(fee.feeheadId);
    }
  };

  const isDisabled = !fee.isSelectable && !fee.isSelected;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        fee.isSelected && styles.containerSelected,
        isDisabled && styles.containerDisabled,
      ]}
      onPress={handlePress}
      activeOpacity={isDisabled ? 1 : 0.7}
      disabled={isDisabled}
    >
      {/* Selection Checkbox */}
      <View
        style={[
          styles.checkbox,
          fee.isSelected && styles.checkboxSelected,
          isDisabled && styles.checkboxDisabled,
        ]}
      >
        {fee.isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
        {isDisabled && !fee.isSelected && (
          <Icon name="lock" size={12} color={colors.textMuted} />
        )}
      </View>

      {/* Fee Details */}
      <View style={styles.content}>
        <View style={styles.header}>
          {showOrder && (
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{fee.order}</Text>
            </View>
          )}
          <Text
            style={[styles.feeHead, isDisabled && styles.textDisabled]}
            numberOfLines={1}
          >
            {fee.feehead}
          </Text>
        </View>

        {fee.feetype && (
          <Text style={[styles.feeType, isDisabled && styles.textDisabled]}>
            {fee.feetype}
          </Text>
        )}

        <View style={styles.amountRow}>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, isDisabled && styles.textDisabled]}>
              Total
            </Text>
            <Text style={[styles.totalAmount, isDisabled && styles.textDisabled]}>
              ₹{fee.Total_Amount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, isDisabled && styles.textDisabled]}>
              Balance
            </Text>
            <Text
              style={[
                styles.balanceAmount,
                isDisabled && styles.textDisabled,
                fee.isSelected && styles.balanceSelected,
              ]}
            >
              ₹{fee.Balance_Amount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Lock indicator for disabled fees */}
      {isDisabled && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockText}>Pay previous fees first</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  containerDisabled: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    borderColor: colors.textMuted,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  orderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  feeHead: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  feeType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  balanceSelected: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.textMuted,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
  },
  lockText: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
