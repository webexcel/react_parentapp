import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { homeworkApi } from '../services/homeworkApi';
import { Homework, HomeworkAttachment, SUBJECT_COLORS } from '../types/homework.types';

const PAGE_SIZE = 10;

export const useHomework = () => {
  const { selectedStudentId, students } = useAuth();
  const queryClient = useQueryClient();

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.HOMEWORK, selectedStudentId],
    queryFn: async ({ pageParam = 0 }): Promise<{
      homework: Homework[];
      totalSize: number;
      currentOffset: number;
    }> => {
      if (!selectedStudentId || !selectedStudent) {
        return { homework: [], totalSize: 0, currentOffset: 0 };
      }

      const adno = selectedStudent.studentId;
      const classId = selectedStudent.classId;

      if (!adno || !classId) {
        return { homework: [], totalSize: 0, currentOffset: 0 };
      }

      const response = await homeworkApi.getHomework(adno, classId, PAGE_SIZE, pageParam);
      const totalSize = response.total_size || 0;

      if (response.status && response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          return { homework: [], totalSize, currentOffset: pageParam };
        }

        const mappedHomework = response.data.map((item: any, index: number) => {
          const homework = {
            id: String(item.MSG_ID || item.id || item.homeworkId || Math.random()),
            subject: item.subject || item.subjectName || 'General',
            title: item.MESSAGE || item.title || item.topic || 'Homework',
            description: item.MESSAGE || item.description || item.details || '',
            dueDate: item.MSG_DATE || item.dueDate || item.submissionDate || new Date().toISOString(),
            assignedDate: item.MSG_DATE || item.assignedDate || item.createdAt || new Date().toISOString(),
            status: getHomeworkStatus(item),
            attachments: parseAttachments(item.event_image, pageParam + index),
            teacherName: item.teacherName || item.teacher || '',
            subjectColor: getSubjectColor(item.subject || item.subjectName || ''),
            isAcknowledged: item.completed_status === '1' || item.completed_status === 1 || item.isAcknowledged || item.acknowledged || false,
          };

          return homework;
        });

        return { homework: mappedHomework, totalSize, currentOffset: pageParam };
      } else {
        return { homework: [], totalSize, currentOffset: pageParam };
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.currentOffset + PAGE_SIZE;
      return nextOffset < lastPage.totalSize ? nextOffset : undefined;
    },
    enabled: !!selectedStudentId,
  });

  // Flatten all pages into a single array
  const homework = data?.pages.flatMap((page) => page.homework) || [];
  const totalSize = data?.pages[0]?.totalSize || 0;

  const acknowledgeMutation = useMutation({
    mutationFn: async (homeworkId: string) => {
      if (!selectedStudentId || !selectedStudent) throw new Error('No student selected');
      const adno = selectedStudent.studentId;
      if (!adno) throw new Error('Student admission number not found');

      return homeworkApi.acknowledgeHomework(homeworkId, adno);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOMEWORK] });
    },
    onError: (error: any) => {
      throw error;
    },
  });

  const pendingHomework = homework.filter((h) => h.status === 'pending' || h.status === 'overdue');
  const completedHomework = homework.filter((h) => h.status === 'completed');

  return {
    homework,
    totalSize,
    pendingHomework,
    completedHomework,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    acknowledgeHomework: acknowledgeMutation.mutate,
    acknowledgeHomeworkAsync: acknowledgeMutation.mutateAsync,
    isAcknowledging: acknowledgeMutation.isPending,
  };
};

const getHomeworkStatus = (item: any): 'pending' | 'completed' | 'overdue' => {
  if (item.completed_status === '1' || item.completed_status === 1) return 'completed';
  if (item.status === 'completed' || item.isCompleted) return 'completed';

  const dueDate = new Date(item.MSG_DATE || item.dueDate || item.submissionDate);
  const now = new Date();

  if (dueDate < now) return 'overdue';
  return 'pending';
};

const parseAttachments = (eventImage: any, index: number): HomeworkAttachment[] => {
  if (!eventImage || typeof eventImage !== 'string' || eventImage.trim() === '') {
    return [];
  }

  const trimmed = eventImage.trim();

  if (trimmed.startsWith('http')) {
    return [{
      id: String(index),
      type: getAttachmentType(trimmed),
      url: trimmed,
      name: 'Attachment',
    }];
  }

  if (trimmed.startsWith('[')) {
    try {
      const sanitized = trimmed.replace(/\s+/g, '');
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed)) {
        const urls = parsed.filter(
          (u: any) => typeof u === 'string' && u !== '',
        );
        if (urls.length > 0) {
          return urls.map((url: string, idx: number) => ({
            id: `${index}-${idx}`,
            type: getAttachmentType(url),
            url,
            name: `Attachment ${idx + 1}`,
          }));
        }
      }
    } catch {
      // Invalid JSON, fall through
    }
  }

  return [];
};

const getAttachmentType = (url: string): 'pdf' | 'image' | 'audio' | 'video' | 'document' => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  return 'document';
};

const getSubjectColor = (subject: string): string => {
  const key = subject.toLowerCase().replace(/\s/g, '');
  return SUBJECT_COLORS[key] || SUBJECT_COLORS.default;
};
