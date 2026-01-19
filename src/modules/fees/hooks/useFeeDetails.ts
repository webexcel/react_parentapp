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

  console.log('=== useFeeDetails ===');
  console.log('targetStudentId:', targetStudentId);
  console.log('student:', JSON.stringify(student, null, 2));
  console.log('adno:', adno);
  console.log('students array length:', students.length);
  console.log('query enabled:', !!adno);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.FEES, 'details', targetStudentId, adno, interval],
    queryFn: async () => {
      // Re-derive adno inside queryFn to ensure fresh value
      const currentStudent = students.find((s) => s.id === targetStudentId);
      const currentAdno = currentStudent?.studentId || currentStudent?.id;

      if (!currentAdno) {
        console.log('No adno - returning empty');
        return {
          fees: [] as SelectableFeeItem[],
          totalAmount: 0,
          balanceAmount: 0,
        };
      }

      console.log('Calling getStudentPayDetails with adno:', currentAdno, 'interval:', interval);
      const response = await feesApi.getStudentPayDetails(currentAdno, interval);
      console.log('Fee details response:', JSON.stringify(response, null, 2));

      // Check if we have Student_details (regardless of status - handles empty data case)
      if (response.Student_details) {
        const feeDetails = response.Student_details.FEE_DETAILS || [];
        console.log('FEE_DETAILS count:', feeDetails.length);
        const pendingFees = feeDetails.filter((fee) => fee.Balance_Amount > 0);
        console.log('Pending fees count:', pendingFees.length);

        return {
          fees: transformToSelectableFees(pendingFees),
          totalAmount: response.Student_details.TOT_AMOUNT || 0,
          balanceAmount: pendingFees.reduce((sum, fee) => sum + fee.Balance_Amount, 0),
        };
      }

      console.log('No Student_details in response');
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
    error: error as Error | null,
    refetch,
  };
};
