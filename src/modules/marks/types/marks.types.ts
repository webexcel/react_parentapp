export interface MarksRequest {
  ADNO: string;
  examid: number;
  yearid: number;
}

export interface SubjectMark {
  subject: string;
  subject_code?: string;
  marks: number;
  total: number;
  grade?: string;
  percentage?: number;
}

export interface MarksResponse {
  status: boolean;
  message: string;
  data: {
    exam_name?: string;
    exam_id?: number;
    student_name?: string;
    class?: string;
    marks: SubjectMark[];
    total_marks?: number;
    total_possible?: number;
    overall_percentage?: number;
    overall_grade?: string;
  };
}

export interface Exam {
  id: number;
  name: string;
  year_id: number;
}

export interface ExamListResponse {
  status: boolean;
  message: string;
  data: Exam[];
}

// selectExamName API types
export interface SelectExamNameRequest {
  class_Id: number;
}

export interface ExamNameItem {
  exam_id: number;
  exam_name: string;
  Year_Id: number;
  Class_Id: number;
  status?: string;
}

export interface SelectExamNameResponse {
  status: boolean;
  message: string;
  examdata: ExamNameItem[];
}
