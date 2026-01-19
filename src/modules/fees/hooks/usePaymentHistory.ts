import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { feesApi } from '../services/feesApi';
import { PaymentHistoryItem } from '../types/fees.types';

interface PaymentReceipt {
  receiptId: string;
  receiptNo: string;
  date: string;
  totalAmount: number;
  items: PaymentHistoryItem[];
}

interface UsePaymentHistoryResult {
  receipts: PaymentReceipt[];
  totalPaid: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export const usePaymentHistory = (
  studentId?: string,
  classId?: string
): UsePaymentHistoryResult => {
  const { students, selectedStudentId } = useAuth();

  const targetStudentId = studentId || selectedStudentId;
  const student = students.find((s) => s.id === targetStudentId);
  const adno = student?.studentId || student?.id;
  const studentClassId = classId || student?.classId;

  console.log('=== usePaymentHistory ===');
  console.log('targetStudentId:', targetStudentId);
  console.log('student:', JSON.stringify(student, null, 2));
  console.log('adno:', adno, 'studentClassId:', studentClassId);
  console.log('query enabled:', !!adno && !!studentClassId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.FEES, 'history', targetStudentId, adno, studentClassId],
    queryFn: async () => {
      // Re-derive values inside queryFn to ensure fresh values
      const currentStudent = students.find((s) => s.id === targetStudentId);
      const currentAdno = currentStudent?.studentId || currentStudent?.id;
      const currentClassId = classId || currentStudent?.classId;

      if (!currentAdno || !currentClassId) {
        console.log('Missing adno or classId - returning empty');
        return { receipts: [] as PaymentReceipt[], totalPaid: 0 };
      }

      console.log('Calling getStudentPayHistory with adno:', currentAdno, 'classId:', currentClassId);
      const response = await feesApi.getStudentPayHistory(currentAdno, currentClassId);
      console.log('Payment history response:', JSON.stringify(response, null, 2));

      // Check for Student_History regardless of status (handles empty data case)
      if (response.Student_History) {
        const { FEE_HISTORY, TOT_HISTORY } = response.Student_History;

        // Transform grouped history into receipt objects
        const receipts: PaymentReceipt[] = Object.entries(FEE_HISTORY || {}).map(
          ([receiptId, items]) => {
            const firstItem = items[0];
            return {
              receiptId,
              receiptNo: firstItem?.RECPNO || `REC-${receiptId}`,
              date: firstItem?.DATE || '',
              totalAmount: items.reduce((sum, item) => sum + item.PAID_AMOUNT, 0),
              items,
            };
          }
        );

        // Sort by date descending (newest first)
        receipts.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });

        return {
          receipts,
          totalPaid: TOT_HISTORY || 0,
        };
      }

      return { receipts: [] as PaymentReceipt[], totalPaid: 0 };
    },
    enabled: !!adno && !!studentClassId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    receipts: data?.receipts || [],
    totalPaid: data?.totalPaid || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
