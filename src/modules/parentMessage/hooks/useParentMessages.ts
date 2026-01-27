import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentMessageApi } from '../services/parentMessageApi';
import { useAuth } from '../../../core/auth';
import { ParentMessage, SaveMessageRequest } from '../types/parentMessage.types';

const QUERY_KEYS = {
  PARENT_MESSAGES: 'parentMessages',
};

export const useParentMessages = () => {
  const queryClient = useQueryClient();
  const { students, selectedStudentId } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Fetch messages for selected student
  const query = useQuery({
    queryKey: [QUERY_KEYS.PARENT_MESSAGES, selectedStudent?.studentId],
    queryFn: async () => {
      if (!selectedStudent?.studentId) {
        return { status: false, message: 'No student selected', data: [] };
      }

      const response = await parentMessageApi.getMessages({
        adno: selectedStudent.studentId,
      });
      return response;
    },
    enabled: !!selectedStudent?.studentId,
  });

  const messages: ParentMessage[] = query.data?.data || [];

  // Don't expose error if we got a valid response (even if empty)
  const hasValidResponse = query.data !== undefined;

  return {
    messages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: hasValidResponse ? null : query.error,
    refetch: query.refetch,
  };
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { students, selectedStudentId } = useAuth();
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const mutation = useMutation({
    mutationFn: async (params: Omit<SaveMessageRequest, 'AdmNo' | 'name' | 'classid'> & { message: string }) => {
      if (!selectedStudent) {
        throw new Error('No student selected');
      }

      return parentMessageApi.saveMessage({
        AdmNo: selectedStudent.studentId,
        name: selectedStudent.name,
        classid: selectedStudent.classId || '',
        message: params.message,
        filename: params.filename,
        type: params.type,
        image: params.image,
        thumbnail: params.thumbnail,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARENT_MESSAGES] });
    },
  });

  return {
    sendMessage: mutation.mutate,
    sendMessageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      return parentMessageApi.deleteMessage({ id });
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PARENT_MESSAGES] });
    },
  });

  return {
    deleteMessage: mutation.mutate,
    deleteMessageAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};
