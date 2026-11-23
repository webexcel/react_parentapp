import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { homeworkApi } from '../services/homeworkApi';
import { Homework, SUBJECT_COLORS } from '../types/homework.types';
import { parseAttachments } from '../../../core/utils/attachments';
import { daysFromToday } from '../../../core/utils/dates';

export const useHomework = () => {
  const { selectedStudentId, students } = useAuth();
  const queryClient = useQueryClient();

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const {
    data: homework = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.HOMEWORK, selectedStudentId],
    queryFn: async (): Promise<Homework[]> => {
      if (!selectedStudentId || !selectedStudent) return [];

      // API requires adno (admission number) and classid (class ID)
      const adno = selectedStudent.studentId;
      const classId = selectedStudent.classId;

      if (!adno || !classId) {
        return [];
      }

      try {
        const response = await homeworkApi.getHomework(adno, classId);

        if (response.status && response.data && Array.isArray(response.data)) {
          if (response.data.length === 0) {
            return [];
          }

          const mappedHomework = response.data.map((item: any, index: number) => {
            // API returns: MSG_ID, CLASS, MESSAGE, MSG_DATE, subject, event_image
            const homework = {
              id: String(item.MSG_ID || item.id || item.homeworkId || Math.random()),
              subject: item.subject || item.subjectName || 'General',
              title: item.MESSAGE || item.title || item.topic || 'Homework',
              description: item.MESSAGE || item.description || item.details || '',
              dueDate: item.dueDate || item.submissionDate || item.MSG_DATE || new Date().toISOString(),
              // getSaveHomeworkByClass only sends MSG_DATE, the day it was posted
              hasDueDate: !!(item.dueDate || item.submissionDate),
              assignedDate: item.MSG_DATE || item.assignedDate || item.createdAt || new Date().toISOString(),
              status: getHomeworkStatus(item),
              attachments: parseAttachments(item.event_image, index),
              teacherName: item.teacherName || item.teacher || '',
              subjectColor: getSubjectColor(item.subject || item.subjectName || ''),
              isAcknowledged: item.completed_status === '1' || item.completed_status === 1 || item.isAcknowledged || item.acknowledged || false,
            };

            return homework;
          });

          return mappedHomework;
        } else {
          return [];
        }
      } catch (error: any) {
        throw error;
      }
    },
    enabled: !!selectedStudentId,
  });

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
      throw error; // Re-throw to let the screen handle the error
    },
  });

  const pendingHomework = homework.filter((h) => h.status === 'pending' || h.status === 'overdue');
  const completedHomework = homework.filter((h) => h.status === 'completed');

  return {
    homework,
    pendingHomework,
    completedHomework,
    isLoading,
    isFetching,
    error,
    refetch,
    acknowledgeHomework: acknowledgeMutation.mutate,
    acknowledgeHomeworkAsync: acknowledgeMutation.mutateAsync,
    isAcknowledging: acknowledgeMutation.isPending,
  };
};

const getHomeworkStatus = (item: any): 'pending' | 'completed' | 'overdue' => {
  // Check completed_status from API (returns '0' or '1')
  if (item.completed_status === '1' || item.completed_status === 1) return 'completed';
  if (item.status === 'completed' || item.isCompleted) return 'completed';

  // Only a real due date can make homework overdue. MSG_DATE is when it was
  // posted, so using it marked everything posted before today as "Overdue".
  const due = item.dueDate || item.submissionDate;
  if (!due) return 'pending';
  const diffDays = daysFromToday(due);
  if (diffDays !== null && diffDays < 0) return 'overdue';
  return 'pending';
};


const getSubjectColor = (subject: string): string => {
  const key = subject.toLowerCase().replace(/\s/g, '');
  return SUBJECT_COLORS[key] || SUBJECT_COLORS.default;
};
