import {apiClient, API_ENDPOINTS} from '../../../core/api';
import {
  McqApiResponse,
  McqExamResult,
  McqFinishReason,
  McqResultSummary,
  McqStartedExam,
  McqTest,
} from '../types/mcq.types';

// Every call names the child (adno); the server checks the child belongs to the
// logged-in parent and has the MCQ menu.
export const mcqApi = {
  list: async (adno: string): Promise<McqTest[]> => {
    const res = await apiClient.post<McqApiResponse<McqTest[]>>(API_ENDPOINTS.MCQ.LIST, {adno});
    return res.data?.data || [];
  },

  start: async (adno: string, paperId: number): Promise<McqStartedExam> => {
    const res = await apiClient.post<McqApiResponse<McqStartedExam>>(API_ENDPOINTS.MCQ.START, {
      adno,
      qus_paper_id: paperId,
    });
    return res.data.data;
  },

  /** attend: '1'-'4', or '' to clear. */
  answer: async (adno: string, paperId: number, qusId: number, attend: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.MCQ.ANSWER, {adno, qus_paper_id: paperId, qus_id: qusId, attend});
  },

  finish: async (
    adno: string,
    paperId: number,
    reason: McqFinishReason,
    closeReason?: string,
  ): Promise<McqResultSummary> => {
    const res = await apiClient.post<McqApiResponse<McqResultSummary>>(API_ENDPOINTS.MCQ.FINISH, {
      adno,
      qus_paper_id: paperId,
      reason,
      close_reason: closeReason,
    });
    return res.data.data;
  },

  result: async (adno: string, paperId: number): Promise<McqExamResult> => {
    const res = await apiClient.post<McqApiResponse<McqExamResult>>(API_ENDPOINTS.MCQ.RESULT, {
      adno,
      qus_paper_id: paperId,
    });
    return res.data.data;
  },
};

/** Server error code from an axios error (e.g. ALREADY_ATTEMPTED, FINISHED). */
export const mcqErrorCode = (err: any): string | undefined => err?.response?.data?.code;

/** Readable message from an axios error. */
export const mcqErrorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.message || err?.message || fallback;
