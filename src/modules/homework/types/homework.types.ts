// Alias of the shared attachment shape (core/utils/attachments) so homework,
// circulars and flash messages all render through the same component.
import type { Attachment } from '../../../core/utils/attachments';

export type HomeworkAttachment = Attachment;

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  assignedDate: string;
  status: 'pending' | 'completed' | 'overdue';
  attachments: HomeworkAttachment[];
  teacherName?: string;
  subjectColor?: string;
  isAcknowledged?: boolean;
}

export interface HomeworkResponse {
  status: boolean;
  message: string;
  data?: Homework[];
}

export const SUBJECT_COLORS: Record<string, string> = {
  maths: '#3b82f6',
  mathematics: '#3b82f6',
  science: '#10b981',
  english: '#8b5cf6',
  hindi: '#f97316',
  history: '#f59e0b',
  geography: '#14b8a6',
  social: '#f97316',
  physics: '#06b6d4',
  chemistry: '#22c55e',
  biology: '#84cc16',
  computer: '#6366f1',
  default: '#64748b',
};
