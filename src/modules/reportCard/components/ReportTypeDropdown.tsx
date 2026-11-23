import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text, colors, spacing, borderRadius, shadows } from '../../../design-system';
import { ReportCardType } from '../types/reportCard.types';

interface Props {
  types: ReportCardType[];
  selected: ReportCardType | null;
  onSelect: (type: ReportCardType) => void;
  disabled?: boolean;
}

export const ReportTypeDropdown: React.FC<Props> = ({ types, selected, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => setOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {selected?.locked && (
          <Icon name="lock-closed" size={16} color={colors.warning} style={styles.lockIcon} />
        )}
        <Text variant="body" color={selected ? 'primary' : 'muted'} style={styles.fieldText}>
          {selected ? selected.report_type : 'Select report card'}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text variant="h3" style={styles.sheetTitle}>
              Select Report Card
            </Text>
            <ScrollView>
              {types.map(type => {
                const isSelected = selected?.id === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      setOpen(false);
                      onSelect(type);
                    }}
                  >
                    {type.locked && (
                      <Icon name="lock-closed" size={16} color={colors.warning} style={styles.lockIcon} />
                    )}
                    <View style={styles.fieldText}>
                      <Text variant="body" semibold={isSelected}>
                        {type.report_type}
                      </Text>
                      {type.locked && (
                        <Text variant="caption" color="secondary">
                          {type.lock_reason === 'fees' ? 'Fees pending' : 'Not published yet'}
                        </Text>
                      )}
                    </View>
                    {isSelected && <Icon name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldText: {
    flex: 1,
  },
  lockIcon: {
    marginRight: spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.base,
    maxHeight: '70%',
    ...shadows.sm,
  },
  sheetTitle: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
  },
});
