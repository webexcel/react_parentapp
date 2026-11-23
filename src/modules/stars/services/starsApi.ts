import {apiClient, API_ENDPOINTS} from '../../../core/api';
import {
  StarHistoryPage,
  StarLeaderboard,
  StarPeriod,
  StarSummary,
  StarsApiResponse,
} from '../types/stars.types';

// Every call names the child (adno); the server checks the child belongs to the
// logged-in parent and has the 'stars' menu.
export const starsApi = {
  summary: async (adno: string): Promise<StarSummary> => {
    const res = await apiClient.post<StarsApiResponse<StarSummary>>(API_ENDPOINTS.STARS.SUMMARY, {adno});
    return res.data?.data || {enabled: false};
  },

  history: async (adno: string, page: number): Promise<StarHistoryPage> => {
    const res = await apiClient.post<StarsApiResponse<StarHistoryPage>>(API_ENDPOINTS.STARS.HISTORY, {adno, page});
    return res.data?.data || {enabled: false};
  },

  leaderboard: async (adno: string, period: StarPeriod): Promise<StarLeaderboard> => {
    const res = await apiClient.post<StarsApiResponse<StarLeaderboard>>(API_ENDPOINTS.STARS.LEADERBOARD, {adno, period});
    return res.data?.data || {enabled: false};
  },
};
