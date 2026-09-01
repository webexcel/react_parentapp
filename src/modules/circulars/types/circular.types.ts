// One shared shape across circulars, homework and flash messages, so the same
// parser and the same AttachmentSection renderer serve all three.
export type { Attachment, AttachmentType } from '../../../core/utils/attachments';
import type { Attachment } from '../../../core/utils/attachments';

export interface Circular {
  id: string;
  sn?: number;
  title: string;
  content: string;
  date: string;
  category?: string;
  attachments: Attachment[];
  isRead?: boolean;
  isAcknowledged?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  senderName?: string;
  senderRole?: string;
  adno?: string;
}

export interface CircularsResponse {
  status: boolean;
  message: string;
  data?: Circular[];
}
