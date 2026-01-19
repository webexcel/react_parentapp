import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { useAuth } from '../../../core/auth';
import { homeworkApi } from '../services/homeworkApi';
import { Homework, SUBJECT_COLORS } from '../types/homework.types';

export const useHomework = () => {
  const { selectedStudentId, students } = useAuth();
  const queryClient = useQueryClient();

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const {
    data: homework = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.HOMEWORK, selectedStudentId],
    queryFn: async (): Promise<Homework[]> => {
      if (!selectedStudentId || !selectedStudent) return [];

      // API requires adno (admission number) and classid (class ID)
      const adno = selectedStudent.studentId;
      const classId = selectedStudent.classId;

      console.log('=== HOMEWORK FETCH DEBUG ===');
      console.log('Selected Student:', JSON.stringify(selectedStudent, null, 2));
      console.log('adno:', adno);
      console.log('classId:', classId);

      if (!adno || !classId) {
        console.error('ERROR: Missing required fields for homework API');
        console.error('adno:', adno);
        console.error('classId:', classId);
        console.error('Please logout and login again to capture classId');
        return [];
      }

      console.log('Fetching homework with:', { adno, classid: classId });

      try {
        const response = await homeworkApi.getHomework(adno, classId);

        console.log('=== HOMEWORK API RESPONSE ===');
        console.log('Full response:', JSON.stringify(response, null, 2));
        console.log('response.status:', response.status);
        console.log('response.data:', response.data);
        console.log('response.message:', response.message);

        if (response.status && response.data && Array.isArray(response.data)) {
          console.log('Number of homework items:', response.data.length);

          if (response.data.length === 0) {
            console.log('API returned empty homework array');
            return [];
          }

          const mappedHomework = response.data.map((item: any, index: number) => {
            console.log(`=== Homework item ${index + 1} RAW ===`);
            console.log(JSON.stringify(item, null, 2));

            // API returns: MSG_ID, CLASS, MESSAGE, MSG_DATE, subject, event_image
            const homework = {
              id: String(item.MSG_ID || item.id || item.homeworkId || Math.random()),
              subject: item.subject || item.subjectName || 'General',
              title: item.MESSAGE || item.title || item.topic || 'Homework',
              description: item.MESSAGE || item.description || item.details || '',
              dueDate: item.MSG_DATE || item.dueDate || item.submissionDate || new Date().toISOString(),
              assignedDate: item.MSG_DATE || item.assignedDate || item.createdAt || new Date().toISOString(),
              status: getHomeworkStatus(item),
              attachments: item.event_image ? [{
                id: String(item.MSG_ID || Math.random()),
                type: getAttachmentType(item.event_image),
                url: item.event_image,
                name: 'Attachment',
              }] : [],
              teacherName: item.teacherName || item.teacher || '',
              subjectColor: getSubjectColor(item.subject || item.subjectName || ''),
              isAcknowledged: item.isAcknowledged || item.acknowledged || false,
            };

            console.log(`=== Homework item ${index + 1} MAPPED ===`);
            console.log(JSON.stringify(homework, null, 2));
            return homework;
          });

          console.log('=== FINAL HOMEWORK ARRAY ===');
          console.log(`Total items: ${mappedHomework.length}`);
          return mappedHomework;
        } else {
          console.error('Invalid response format');
          console.error('response.status:', response.status);
          console.error('response.data is array:', Array.isArray(response.data));
          console.error('response.data:', response.data);
          return [];
        }
      } catch (error: any) {
        console.error('=== HOMEWORK API ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Full error:', JSON.stringify(error, null, 2));
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

      console.log('=== MARKING HOMEWORK COMPLETE ===');
      console.log('homeworkId:', homeworkId);
      console.log('adno:', adno);

      return homeworkApi.acknowledgeHomework(homeworkId, adno);
    },
    onSuccess: () => {
      console.log('Homework marked as complete successfully');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HOMEWORK] });
    },
    onError: (error) => {
      console.error('Error marking homework complete:', error);
    },
  });

  const pendingHomework = homework.filter((h) => h.status === 'pending' || h.status === 'overdue');
  const completedHomework = homework.filter((h) => h.status === 'completed');

  return {
    homework,
    pendingHomework,
    completedHomework,
    isLoading,
    error,
    refetch,
    acknowledgeHomework: acknowledgeMutation.mutate,
    isAcknowledging: acknowledgeMutation.isPending,
  };
};

const getHomeworkStatus = (item: any): 'pending' | 'completed' | 'overdue' => {
  if (item.status === 'completed' || item.isCompleted) return 'completed';

  const dueDate = new Date(item.dueDate || item.submissionDate);
  const now = new Date();

  if (dueDate < now) return 'overdue';
  return 'pending';
};

const getAttachmentType = (url: string): 'pdf' | 'image' | 'audio' | 'document' => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) return 'audio';
  return 'document';
};

const getSubjectColor = (subject: string): string => {
  const key = subject.toLowerCase().replace(/\s/g, '');
  return SUBJECT_COLORS[key] || SUBJECT_COLORS.default;
};
