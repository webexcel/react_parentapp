import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {QUERY_KEYS} from '../../../core/constants';
import {useAuth} from '../../../core/auth';
import {leaveLetterApi} from '../services/leaveLetterApi';
import {
  LeaveRequest,
  InsertLeaveRequestPayload,
  UpdateLeaveRequestPayload,
} from '../types/leaveLetter.types';

export const useLeaveLetter = () => {
  const {selectedStudentId, students} = useAuth();
  const queryClient = useQueryClient();

  // Get selected student's details
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const adno = selectedStudent?.studentId || '';
  const classId = selectedStudent?.classId || '';

  // Query for fetching leave requests
  const {
    data: leaveRequests = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_LETTER, selectedStudentId],
    queryFn: async (): Promise<LeaveRequest[]> => {
      if (!adno) return [];

      const response = await leaveLetterApi.getLeaveRequests(adno);

      if (response.data && Array.isArray(response.data)) {
        // Sort by date descending (most recent first)
        return response.data.sort(
          (a, b) =>
            new Date(b.updateTme).getTime() - new Date(a.updateTme).getTime(),
        );
      }
      return [];
    },
    enabled: !!adno,
  });

  // Mutation for inserting a new leave request
  const insertMutation = useMutation({
    mutationFn: async (data: {
      sessionType: string;
      startDate: string;
      endDate: string;
      message: string;
    }) => {
      const payload: InsertLeaveRequestPayload = {
        ADNO: adno,
        CLASS_ID: classId,
        selectedSession: data.sessionType,
        s_date: data.startDate,
        e_date: data.endDate,
        message: data.message,
      };
      return leaveLetterApi.insertLeaveRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LEAVE_LETTER, selectedStudentId],
      });
    },
  });

  // Mutation for updating a leave request
  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      sessionType: string;
      startDate: string;
      endDate: string;
      message: string;
    }) => {
      const payload: UpdateLeaveRequestPayload = {
        id: data.id,
        selectedSession: data.sessionType,
        s_date: data.startDate,
        e_date: data.endDate,
        message: data.message,
      };
      return leaveLetterApi.updateLeaveRequest(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LEAVE_LETTER, selectedStudentId],
      });
    },
  });

  // Mutation for deleting a leave request
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return leaveLetterApi.deleteLeaveRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LEAVE_LETTER, selectedStudentId],
      });
    },
  });

  // Filter requests by status
  const pendingRequests = leaveRequests.filter(
    req => req.leaveStatus === 'REQUEST',
  );
  const approvedRequests = leaveRequests.filter(
    req => req.leaveStatus === 'APPROVED',
  );
  const rejectedRequests = leaveRequests.filter(
    req => req.leaveStatus === 'REJECTED',
  );

  return {
    // Data
    leaveRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,

    // Loading states
    isLoading,
    isFetching,
    error,

    // Actions
    refetch,

    // Insert
    insertLeaveRequest: insertMutation.mutateAsync,
    isInserting: insertMutation.isPending,
    insertError: insertMutation.error,

    // Update
    updateLeaveRequest: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete
    deleteLeaveRequest: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Student info
    adno,
    classId,
  };
};
