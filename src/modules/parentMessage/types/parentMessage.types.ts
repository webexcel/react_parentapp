// Parent Message Types

export interface ParentMessage {
  id: number;
  Adno: string;
  name: string;
  description: string;
  url: string | null;
  thumbnail: string | null;
  classid: string;
  Date: string;
  status: number;
}

// API Request Types
export interface GetMessagesRequest {
  adno: string;
}

export interface SaveMessageRequest {
  AdmNo: string;
  name: string;
  classid: string;
  message: string;
  filename?: string;
  type?: string;
  image?: string;
  thumbnail?: string;
}

export interface DeleteMessageRequest {
  id: number;
}

// API Response Types
export interface GetMessagesResponse {
  status: boolean;
  message?: string;
  data: ParentMessage[];
}

export interface SaveMessageResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface DeleteMessageResponse {
  status: boolean;
  message: string;
}
