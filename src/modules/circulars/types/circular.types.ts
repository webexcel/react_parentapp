export interface Attachment {
  id: string;
  type: 'pdf' | 'image' | 'audio' | 'document';
  url: string;
  name: string;
  size?: number;
}

export interface Circular {
  id: string;
  title: string;
  content: string;
  date: string;
  category?: string;
  attachments: Attachment[];
  isRead?: boolean;
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
