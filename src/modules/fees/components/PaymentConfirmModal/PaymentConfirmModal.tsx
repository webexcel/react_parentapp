import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Text, Icon, colors } from '../../../../design-system';
import type { Student } from '../../../../core/api/apiTypes';
import type { SelectableFeeItem } from '../../types/fees.types';
import { styles } from './PaymentConfirmModal.styles';

export interface PaymentConfirmModalProps {
  visible: boolean;
  student?: Student;
  fees: SelectableFeeItem[];
  totalAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatAmount = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/**
 * Bottom-sheet confirmation shown before handing off to the payment gateway.
 * Replaces the OS alert so the parent sees who and what they are paying for.
 */
export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  visible,
  student,
  fees,
  totalAmount,
  onConfirm,
  onCancel,
}) => {
  // className already includes the section for most schools ("XI-C"); only
  // append it when it doesn't, so we never render "XI-C-C".
  const studentLine = student
    ? student.section && !student.className.endsWith(student.section)
      ? `${student.className}-${student.section}`
      : student.className
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        {/* Tapping the dimmed area dismisses, same as Cancel */}
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="payments" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Confirm Payment</Text>
              <Text style={styles.subtitle}>Review the details before you proceed</Text>
            </View>
          </View>

          {student && (
            <View style={styles.studentRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={styles.studentMeta} numberOfLines={1}>
                  {studentLine}
                  {student.admissionNo ? `  •  Adm No: ${student.admissionNo}` : ''}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>
            {fees.length === 1 ? 'Fee' : `${fees.length} Fees`}
          </Text>
          <ScrollView
            style={styles.feeList}
            contentContainerStyle={styles.feeListContent}
            bounces={false}
          >
            {fees.map((fee, index) => (
              <View
                key={fee.feeheadId}
                style={[styles.feeRow, index === fees.length - 1 && styles.feeRowLast]}
              >
                <View style={styles.feeOrder}>
                  <Text style={styles.feeOrderText}>{fee.order}</Text>
                </View>
                <Text style={styles.feeName} numberOfLines={1}>
                  {fee.feehead}
                </Text>
                <Text style={styles.feeAmount}>{formatAmount(fee.Balance_Amount)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total to pay</Text>
            <Text style={styles.totalValue}>{formatAmount(totalAmount)}</Text>
          </View>

          <View style={styles.secureRow}>
            <Icon name="lock" size={14} color={colors.success} />
            <Text style={styles.secureText}>
              Secure payment via UPI, cards or netbanking
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>Pay {formatAmount(totalAmount)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
