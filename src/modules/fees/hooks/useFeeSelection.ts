import { useState, useCallback, useMemo } from 'react';
import { SelectableFeeItem } from '../types/fees.types';

interface UseFeeSelectionResult {
  selectedFees: SelectableFeeItem[];
  fees: SelectableFeeItem[];
  selectedAmount: number;
  selectedCount: number;
  canProceedToPayment: boolean;

  // Actions
  toggleFeeSelection: (feeheadId: number) => void;
  selectAllFees: () => void;
  clearSelection: () => void;
  isSelected: (feeheadId: number) => boolean;
  isSelectable: (feeheadId: number) => boolean;
}

/**
 * Hook for managing sequential fee selection
 *
 * BUSINESS RULE: Fees must be paid in order by feeheadId.
 * - Cannot select a fee unless all fees before it are selected
 * - Can select multiple consecutive fees
 * - Cannot skip fees in the sequence
 *
 * Example:
 * - Fees: [Tuition (1), Lab (2), Sports (3)]
 * - Valid: Select Tuition only, Select Tuition + Lab, Select All
 * - Invalid: Select Lab only (must select Tuition first)
 */
export const useFeeSelection = (
  initialFees: SelectableFeeItem[]
): UseFeeSelectionResult => {
  const [selectedFeeIds, setSelectedFeeIds] = useState<Set<number>>(new Set());

  // Sort fees by order/feeheadId
  const sortedFees = useMemo(() => {
    return [...initialFees].sort((a, b) => a.feeheadId - b.feeheadId);
  }, [initialFees]);

  // Determine which fees are selectable based on current selection
  const feesWithSelectability = useMemo((): SelectableFeeItem[] => {
    return sortedFees.map((fee, index) => {
      // First fee is always selectable
      if (index === 0) {
        return { ...fee, isSelectable: true, isSelected: selectedFeeIds.has(fee.feeheadId) };
      }

      // A fee is selectable only if the previous fee is selected
      const previousFee = sortedFees[index - 1];
      const isPreviousSelected = selectedFeeIds.has(previousFee.feeheadId);

      return {
        ...fee,
        isSelectable: isPreviousSelected,
        isSelected: selectedFeeIds.has(fee.feeheadId),
      };
    });
  }, [sortedFees, selectedFeeIds]);

  // Get selected fees
  const selectedFees = useMemo(() => {
    return feesWithSelectability.filter((fee) => fee.isSelected);
  }, [feesWithSelectability]);

  // Calculate total selected amount
  const selectedAmount = useMemo(() => {
    return selectedFees.reduce((sum, fee) => sum + fee.Balance_Amount, 0);
  }, [selectedFees]);

  // Check if selection is valid for payment
  const canProceedToPayment = useMemo(() => {
    if (selectedFees.length === 0) return false;

    // Validate that selected fees are consecutive from the start
    const selectedIds = selectedFees.map((f) => f.feeheadId).sort((a, b) => a - b);
    const allIds = sortedFees.map((f) => f.feeheadId);

    // First selected fee must be the first in the list
    if (selectedIds[0] !== allIds[0]) return false;

    // All selected fees must be consecutive
    for (let i = 1; i < selectedIds.length; i++) {
      const currentIndex = allIds.indexOf(selectedIds[i]);
      const previousIndex = allIds.indexOf(selectedIds[i - 1]);
      if (currentIndex !== previousIndex + 1) return false;
    }

    return true;
  }, [selectedFees, sortedFees]);

  // Toggle fee selection
  const toggleFeeSelection = useCallback(
    (feeheadId: number) => {
      const feeIndex = sortedFees.findIndex((f) => f.feeheadId === feeheadId);
      if (feeIndex === -1) return;

      setSelectedFeeIds((prev) => {
        const newSet = new Set(prev);
        const isCurrentlySelected = newSet.has(feeheadId);

        if (isCurrentlySelected) {
          // Deselecting: Also deselect all fees after this one
          for (let i = feeIndex; i < sortedFees.length; i++) {
            newSet.delete(sortedFees[i].feeheadId);
          }
        } else {
          // Selecting: Also select all fees before this one
          for (let i = 0; i <= feeIndex; i++) {
            newSet.add(sortedFees[i].feeheadId);
          }
        }

        return newSet;
      });
    },
    [sortedFees]
  );

  // Select all fees
  const selectAllFees = useCallback(() => {
    setSelectedFeeIds(new Set(sortedFees.map((f) => f.feeheadId)));
  }, [sortedFees]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedFeeIds(new Set());
  }, []);

  // Check if a fee is selected
  const isSelected = useCallback(
    (feeheadId: number) => {
      return selectedFeeIds.has(feeheadId);
    },
    [selectedFeeIds]
  );

  // Check if a fee is selectable
  const isSelectable = useCallback(
    (feeheadId: number) => {
      const fee = feesWithSelectability.find((f) => f.feeheadId === feeheadId);
      return fee?.isSelectable ?? false;
    },
    [feesWithSelectability]
  );

  return {
    selectedFees,
    fees: feesWithSelectability,
    selectedAmount,
    selectedCount: selectedFees.length,
    canProceedToPayment,
    toggleFeeSelection,
    selectAllFees,
    clearSelection,
    isSelected,
    isSelectable,
  };
};
