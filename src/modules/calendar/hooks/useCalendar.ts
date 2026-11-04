import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../core/constants';
import { calendarApi } from '../services/calendarApi';

export interface CalendarEvent {
  id: string;
  title: string;
  /** First day, YYYY-MM-DD */
  date: string;
  /** Last day, YYYY-MM-DD (same as date for a one-day event) */
  endDate: string;
  category: 'holiday' | 'event';
  /** Colour chosen when the event was created, when it is a valid hex colour */
  color?: string;
  description?: string;
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * School-wide events. They are the same for every child, so the query is not
 * keyed by student; the server only checks that at least one child has the
 * Calendar menu.
 */
export const useCalendar = () => {
  const { data: events = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.CALENDAR],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const rows = await calendarApi.getEvents();
      return rows.map((row, index) => {
        const start = row.start_date;
        // An event with no (or an earlier) end date is a single day.
        const end = row.end_date && row.end_date >= start ? row.end_date : start;
        return {
          id: `${start}-${index}`,
          title: row.title,
          date: start,
          endDate: end,
          category: Number(row.isHolliday) === 1 ? 'holiday' : 'event',
          color: row.color && HEX_COLOR.test(row.color.trim()) ? row.color.trim() : undefined,
          description: row.description || undefined,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  return { events, isLoading, isFetching, error, refetch };
};
