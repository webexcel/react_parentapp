import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Text, Button, Icon} from '../../../design-system';
import {colors} from '../../../design-system/theme/colors';
import {spacing, borderRadius} from '../../../design-system/theme/spacing';
import {fontSize} from '../../../design-system/theme/typography';
import {SESSION_OPTIONS, LeaveFormData} from '../types/leaveLetter.types';

interface LeaveRequestFormProps {
  onSubmit: (data: LeaveFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<LeaveFormData>;
  isEditMode?: boolean;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  isEditMode = false,
}) => {
  const [sessionType, setSessionType] = useState<string>(
    initialData?.sessionType || '0',
  );
  const [startDate, setStartDate] = useState<Date>(
    initialData?.startDate || new Date(),
  );
  const [endDate, setEndDate] = useState<Date>(
    initialData?.endDate || new Date(),
  );
  const [message, setMessage] = useState<string>(initialData?.message || '');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!message.trim()) {
      newErrors.message = 'Please enter a reason for leave';
    }

    if (endDate < startDate) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        sessionType,
        startDate,
        endDate,
        message: message.trim(),
      });
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      // Auto-adjust end date if it's before start date
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
      setErrors(prev => ({...prev, endDate: ''}));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      setErrors(prev => ({...prev, endDate: ''}));
    }
  };

  const getSessionLabel = (): string => {
    const option = SESSION_OPTIONS.find(opt => opt.value === sessionType);
    return option?.label || 'Select Session';
  };

  return (
    <View style={styles.container}>
      {/* Session Type Dropdown */}
      <View style={styles.fieldContainer}>
        <Text variant="label" color="secondary" style={styles.label}>
          Session Type
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowSessionDropdown(true)}>
          <Text style={styles.dropdownText}>{getSessionLabel()}</Text>
          <Icon name="chevronDown" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Session Dropdown Modal */}
      <Modal
        visible={showSessionDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSessionDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSessionDropdown(false)}>
          <View style={styles.dropdownModal}>
            <Text variant="h3" style={styles.dropdownTitle}>
              Select Session Type
            </Text>
            {SESSION_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  sessionType === option.value && styles.dropdownOptionSelected,
                ]}
                onPress={() => {
                  setSessionType(option.value);
                  setShowSessionDropdown(false);
                }}>
                <Text
                  style={[
                    styles.dropdownOptionText,
                    sessionType === option.value &&
                      styles.dropdownOptionTextSelected,
                  ]}>
                  {option.label}
                </Text>
                {sessionType === option.value && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers Row */}
      <View style={styles.dateRow}>
        {/* Start Date */}
        <View style={styles.dateField}>
          <Text variant="label" color="secondary" style={styles.label}>
            Start Date
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}>
            <Icon name="calendar" size={18} color={colors.primary} />
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* End Date */}
        <View style={styles.dateField}>
          <Text variant="label" color="secondary" style={styles.label}>
            End Date
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.endDate && styles.inputError]}
            onPress={() => setShowEndPicker(true)}>
            <Icon name="calendar" size={18} color={colors.primary} />
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          {errors.endDate && (
            <Text variant="caption" color="error" style={styles.errorText}>
              {errors.endDate}
            </Text>
          )}
        </View>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

      {/* Message Textarea */}
      <View style={styles.fieldContainer}>
        <Text variant="label" color="secondary" style={styles.label}>
          Reason for Leave
        </Text>
        <TextInput
          style={[
            styles.textarea,
            errors.message && styles.inputError,
          ]}
          placeholder="Enter the reason for your leave request..."
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={text => {
            setMessage(text);
            if (text.trim()) {
              setErrors(prev => ({...prev, message: ''}));
            }
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {errors.message && (
          <Text variant="caption" color="error" style={styles.errorText}>
            {errors.message}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {onCancel && (
          <Button
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={isSubmitting}
          />
        )}
        <Button
          title={isEditMode ? 'Update Request' : 'Submit Request'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={[styles.submitButton, !onCancel && styles.fullWidthButton]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  fieldContainer: {
    marginBottom: spacing.base,
  },
  label: {
    marginBottom: spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dropdownModal: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 320,
    padding: spacing.base,
  },
  dropdownTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  dropdownOptionText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  textarea: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: 100,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
});
