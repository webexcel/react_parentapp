import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, colors, spacing, borderRadius } from '../../../design-system';
import { DayAttendance, AttendanceStatus } from '../types/attendance.types';

interface AttendanceCalendarProps {
  month: number;
  year: number;
  days: DayAttendance[];
  onDayPress?: (day: DayAttendance | null, date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: colors.success,      // Green
  absent: colors.error,         // Red
  holiday: '#8b5cf6',           // Purple
  leave: '#f97316',             // Orange
  half_day: '#eab308',          // Yellow
  weekend: '#9ca3af',           // Gray
  future: 'transparent',        // No color
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  holiday: 'Holiday',
  leave: 'Leave',
  half_day: 'Half Day',
  weekend: 'Weekend',
  future: 'Future',
};

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  month,
  year,
  days,
  onDayPress,
}) => {
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calDays: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      calDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calDays.push(day);
    }

    return calDays;
  }, [month, year]);

  const attendanceMap = useMemo(() => {
    const map: Record<number, DayAttendance> = {};
    days.forEach((item) => {
      const date = new Date(item.date);
      const dayNum = date.getDate();
      map[dayNum] = item;
    });
    return map;
  }, [days]);

  const getStatusForDay = (day: number): AttendanceStatus | null => {
    const dayData = attendanceMap[day];
    if (!dayData) return null;
    // Don't show dot for future dates
    if (dayData.status === 'future') return null;
    return dayData.status;
  };

  const handleDayPress = (day: number | null) => {
    if (!day || !onDayPress) return;

    const date = new Date(year, month - 1, day);
    const attendanceDay = attendanceMap[day] || null;
    onDayPress(attendanceDay, date);
  };

  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  // Filter legend to only show relevant statuses (exclude future)
  const legendStatuses: AttendanceStatus[] = ['present', 'absent', 'leave', 'half_day', 'holiday', 'weekend'];

  return (
    <View style={styles.container}>
      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text variant="caption" color="secondary" semibold>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const status = day ? getStatusForDay(day) : null;
          const isToday = isCurrentMonth && day === today.getDate();
          const dayData = day ? attendanceMap[day] : null;
          const isFuture = dayData?.status === 'future';

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={!day}
              activeOpacity={0.7}
            >
              {day && (
                <>
                  <Text
                    variant="body"
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isFuture && styles.futureText,
                    ]}
                  >
                    {day}
                  </Text>
                  {status && (
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[status] },
                      ]}
                    />
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {legendStatuses.map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
            <Text variant="caption" color="secondary" style={styles.legendText}>
              {STATUS_LABELS[status]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  todayCell: {
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.full,
  },
  dayText: {
    color: colors.textPrimary,
  },
  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  futureText: {
    color: colors.textTertiary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendText: {
    textTransform: 'capitalize',
  },
});
