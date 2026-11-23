import { apiClient, API_ENDPOINTS } from '../../../core/api';

/** One row of /calendar/getCalendar (school-wide events). */
export interface CalendarApiEvent {
  title: string;
  description: string | null;
  calenderImage: string | null;
  color: string | null;
  isHolliday: number | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

export const calendarApi = {
  getEvents: async (): Promise<CalendarApiEvent[]> => {
    try {
      const response = await apiClient.get<{ status: boolean; data: CalendarApiEvent[] }>(
        API_ENDPOINTS.CALENDAR.GET
      );
      return response.data?.data ?? [];
    } catch (error: any) {
      // The backend answers 400 when there are no events - that is just an empty calendar.
      if (error.response?.status === 400) {
        return [];
      }
      throw error;
    }
  },
};
