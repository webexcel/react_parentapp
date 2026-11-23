import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants/keys';
import { reportCardApi } from '../services/reportCardApi';
import { ReportCardType } from '../types/reportCard.types';

export const useReportCardTypes = (admissionId: string | undefined) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.REPORT_CARD_TYPES, admissionId],
    queryFn: () => reportCardApi.getReportCardTypes(admissionId as string),
    enabled: !!admissionId,
    // Lock state (unpublished / fees) changes on the school's side; the app-wide
    // 5 min staleTime kept showing "Not Published Yet" after marks were published.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    types: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/** Generates the selected report card for a student; resolves to the cached PDF path. */
export const useReportCardPdf = (admissionId: string | undefined, type: ReportCardType | null) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.REPORT_CARD_TYPES, 'pdf', admissionId, type?.id, type?.Year_Id],
    queryFn: () =>
      reportCardApi.generateReportCardPdf({
        admissionId: admissionId as string,
        yearid: (type as ReportCardType).Year_Id,
        report_type_id: (type as ReportCardType).id,
      }),
    enabled: !!admissionId && !!type,
    retry: false,
    // Always regenerate on open — marks can change after publishing.
    gcTime: 0,
  });

  return {
    pdfPath: query.data || null,
    isLoading: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
