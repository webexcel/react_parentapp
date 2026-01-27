import { useCallback } from 'react';
import { useAuth } from '../../../core/auth';
import { useBatchCount } from './useBatchCount';
import { useFlashMessage } from './useFlashMessage';
import { useLatestMessages } from './useLatestMessages';
import { DashboardSummary, FlashMessage, LatestMessage } from '../types/dashboard.types';

interface UseDashboardResult {
  // Selected student summary data
  summary: DashboardSummary;

  // Flash messages
  flashMessages: FlashMessage[];
  hasFlashMessage: boolean;

  // Latest news/messages
  latestMessages: LatestMessage[];

  // Loading states
  isLoading: boolean;
  isFetching: boolean;

  // Error
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
}

export const useDashboard = (): UseDashboardResult => {
  const { selectedStudentId } = useAuth();

  // Get data for selected student (now includes leaveCount from absent_days)
  const {
    summary,
    isLoading: isBatchCountLoading,
    isFetching: isBatchCountFetching,
    error: batchCountError,
    refetch: refetchBatchCount,
  } = useBatchCount(selectedStudentId || undefined);

  // Get flash messages
  const {
    flashMessages,
    hasFlashMessage,
    isLoading: isFlashLoading,
    isFetching: isFlashFetching,
    error: flashError,
    refetch: refetchFlash,
  } = useFlashMessage();

  // Get latest messages
  const {
    latestMessages,
    isLoading: isLatestLoading,
    isFetching: isLatestFetching,
    error: latestError,
    refetch: refetchLatest,
  } = useLatestMessages();

  const isLoading = isBatchCountLoading || isFlashLoading || isLatestLoading;
  const isFetching = isBatchCountFetching || isFlashFetching || isLatestFetching;
  const error = batchCountError || flashError || latestError;

  const refresh = useCallback(async () => {
    await Promise.all([refetchBatchCount(), refetchFlash(), refetchLatest()]);
  }, [refetchBatchCount, refetchFlash, refetchLatest]);

  return {
    summary,
    flashMessages,
    hasFlashMessage,
    latestMessages,
    isLoading,
    isFetching,
    error: error as Error | null,
    refresh,
  };
};
