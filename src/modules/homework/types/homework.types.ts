export interface HomeworkAttachment {
  id: string;
  type: 'pdf' | 'image' | 'audio' | 'document';
  url: string;
  name: string;
}

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
