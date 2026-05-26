import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { feesApi } from '../services/feesApi';
import { FeeItem, SelectableFeeItem } from '../types/fees.types';

interface UseFeeDetailsResult {
  fees: SelectableFeeItem[];
  totalAmount: number;
  balanceAmount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Transform fee items to selectable items with order rules
 * Fees are ordered by feeheadId - lower IDs must be paid first
 */
const transformToSelectableFees = (fees: FeeItem[]): SelectableFeeItem[] => {
  // Sort by feeheadId to ensure correct order
  const sortedFees = [...fees].sort((a, b) => a.feeheadId - b.feeheadId);

  return sortedFees.map((fee, index) => ({
    ...fee,
    isSelected: false,
    isSelectable: true, // Initially all are selectable, will be managed by selection logic
    order: index + 1,
  }));
};

export const useFeeDetails = (
  studentId?: string,
  interval: string = '0' // '0' fetches all intervals, '1' only interval 1
): UseFeeDetailsResult => {
  const { students, selectedStudentId } = useAuth();

  const targetStudentId = studentId || selectedStudentId;
  const student = students.find((s) => s.id === targetStudentId);
  const adno = student?.studentId || student?.id;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.FEES, 'details', targetStudentId, adno, interval],
    queryFn: async () => {
      // Re-derive adno inside queryFn to ensure fresh value
      const currentStudent = students.find((s) => s.id === targetStudentId);
      const currentAdno = currentStudent?.studentId || currentStudent?.id;

      if (!currentAdno) {
        return {
          fees: [] as SelectableFeeItem[],
          totalAmount: 0,
          balanceAmount: 0,
        };
      }

      const response = await feesApi.getStudentPayDetails(currentAdno, interval);

      // Check if we have Student_details (regardless of status - handles empty data case)
      if (response.Student_details) {
        const feeDetails = response.Student_details.FEE_DETAILS || [];
        const pendingFees = feeDetails.filter((fee) => fee.Balance_Amount > 0);

        return {
          fees: transformToSelectableFees(pendingFees),
          totalAmount: response.Student_details.TOT_AMOUNT || 0,
          balanceAmount: pendingFees.reduce((sum, fee) => sum + fee.Balance_Amount, 0),
        };
      }

      return {
        fees: [] as SelectableFeeItem[],
        totalAmount: 0,
        balanceAmount: 0,
      };
    },
    enabled: !!adno,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    fees: data?.fees || [],
    totalAmount: data?.totalAmount || 0,
    balanceAmount: data?.balanceAmount || 0,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
