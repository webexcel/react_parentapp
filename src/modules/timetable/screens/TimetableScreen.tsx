import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ListTemplate,
  Text,
  Badge,
  Icon,
  EmptyState,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';

interface Period {
  id: string;
  periodNumber: number;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room?: string;
}

interface DaySchedule {
  day: string;
  dayShort: string;
  periods: Period[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock data - replace with API call
const MOCK_TIMETABLE: Record<string, Period[]> = {
  Monday: [
    { id: 'm1', periodNumber: 1, subject: 'Mathematics', teacher: 'Mrs. Sharma', startTime: '08:30', endTime: '09:15', room: 'Room 101' },
    { id: 'm2', periodNumber: 2, subject: 'English', teacher: 'Mr. Kumar', startTime: '09:15', endTime: '10:00', room: 'Room 101' },
    { id: 'm3', periodNumber: 3, subject: 'Science', teacher: 'Mrs. Reddy', startTime: '10:15', endTime: '11:00', room: 'Lab 1' },
    { id: 'm4', periodNumber: 4, subject: 'Hindi', teacher: 'Mr. Singh', startTime: '11:00', endTime: '11:45', room: 'Room 101' },
    { id: 'm5', periodNumber: 5, subject: 'Social Studies', teacher: 'Mrs. Patel', startTime: '12:30', endTime: '13:15', room: 'Room 101' },
    { id: 'm6', periodNumber: 6, subject: 'Computer Science', teacher: 'Mr. Das', startTime: '13:15', endTime: '14:00', room: 'Lab 2' },
  ],
  Tuesday: [
    { id: 't1', periodNumber: 1, subject: 'English', teacher: 'Mr. Kumar', startTime: '08:30', endTime: '09:15', room: 'Room 101' },
    { id: 't2', periodNumber: 2, subject: 'Mathematics', teacher: 'Mrs. Sharma', startTime: '09:15', endTime: '10:00', room: 'Room 101' },
    { id: 't3', periodNumber: 3, subject: 'Physical Education', teacher: 'Mr. Verma', startTime: '10:15', endTime: '11:00', room: 'Ground' },
    { id: 't4', periodNumber: 4, subject: 'Science', teacher: 'Mrs. Reddy', startTime: '11:00', endTime: '11:45', room: 'Lab 1' },
    { id: 't5', periodNumber: 5, subject: 'Art', teacher: 'Mrs. Gupta', startTime: '12:30', endTime: '13:15', room: 'Art Room' },
    { id: 't6', periodNumber: 6, subject: 'Hindi', teacher: 'Mr. Singh', startTime: '13:15', endTime: '14:00', room: 'Room 101' },
  ],
  Wednesday: [
    { id: 'w1', periodNumber: 1, subject: 'Science', teacher: 'Mrs. Reddy', startTime: '08:30', endTime: '09:15', room: 'Lab 1' },
    { id: 'w2', periodNumber: 2, subject: 'Mathematics', teacher: 'Mrs. Sharma', startTime: '09:15', endTime: '10:00', room: 'Room 101' },
    { id: 'w3', periodNumber: 3, subject: 'English', teacher: 'Mr. Kumar', startTime: '10:15', endTime: '11:00', room: 'Room 101' },
    { id: 'w4', periodNumber: 4, subject: 'Social Studies', teacher: 'Mrs. Patel', startTime: '11:00', endTime: '11:45', room: 'Room 101' },
    { id: 'w5', periodNumber: 5, subject: 'Music', teacher: 'Mr. Iyer', startTime: '12:30', endTime: '13:15', room: 'Music Room' },
    { id: 'w6', periodNumber: 6, subject: 'Computer Science', teacher: 'Mr. Das', startTime: '13:15', endTime: '14:00', room: 'Lab 2' },
  ],
  Thursday: [
    { id: 'th1', periodNumber: 1, subject: 'Hindi', teacher: 'Mr. Singh', startTime: '08:30', endTime: '09:15', room: 'Room 101' },
    { id: 'th2', periodNumber: 2, subject: 'Science', teacher: 'Mrs. Reddy', startTime: '09:15', endTime: '10:00', room: 'Lab 1' },
    { id: 'th3', periodNumber: 3, subject: 'Mathematics', teacher: 'Mrs. Sharma', startTime: '10:15', endTime: '11:00', room: 'Room 101' },
    { id: 'th4', periodNumber: 4, subject: 'English', teacher: 'Mr. Kumar', startTime: '11:00', endTime: '11:45', room: 'Room 101' },
    { id: 'th5', periodNumber: 5, subject: 'Physical Education', teacher: 'Mr. Verma', startTime: '12:30', endTime: '13:15', room: 'Ground' },
    { id: 'th6', periodNumber: 6, subject: 'Social Studies', teacher: 'Mrs. Patel', startTime: '13:15', endTime: '14:00', room: 'Room 101' },
  ],
  Friday: [
    { id: 'f1', periodNumber: 1, subject: 'Mathematics', teacher: 'Mrs. Sharma', startTime: '08:30', endTime: '09:15', room: 'Room 101' },
    { id: 'f2', periodNumber: 2, subject: 'Hindi', teacher: 'Mr. Singh', startTime: '09:15', endTime: '10:00', room: 'Room 101' },
    { id: 'f3', periodNumber: 3, subject: 'English', teacher: 'Mr. Kumar', startTime: '10:15', endTime: '11:00', room: 'Room 101' },
    { id: 'f4', periodNumber: 4, subject: 'Computer Science', teacher: 'Mr. Das', startTime: '11:00', endTime: '11:45', room: 'Lab 2' },
    { id: 'f5', periodNumber: 5, subject: 'Science', teacher: 'Mrs. Reddy', startTime: '12:30', endTime: '13:15', room: 'Lab 1' },
    { id: 'f6', periodNumber: 6, subject: 'Library', teacher: 'Mrs. Joshi', startTime: '13:15', endTime: '14:00', room: 'Library' },
  ],
  Saturday: [
    { id: 's1', periodNumber: 1, subject: 'Mathematics', teacher: 'Mrs. Sharma', startTime: '08:30', endTime: '09:15', room: 'Room 101' },
    { id: 's2', periodNumber: 2, subject: 'Science', teacher: 'Mrs. Reddy', startTime: '09:15', endTime: '10:00', room: 'Lab 1' },
    { id: 's3', periodNumber: 3, subject: 'English', teacher: 'Mr. Kumar', startTime: '10:15', endTime: '11:00', room: 'Room 101' },
    { id: 's4', periodNumber: 4, subject: 'Activity Period', teacher: 'Various', startTime: '11:00', endTime: '11:45', room: 'Various' },
  ],
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: colors.primary,
  English: colors.info,
  Science: colors.success,
  Hindi: colors.warning,
  'Social Studies': '#9333EA',
  'Computer Science': '#06B6D4',
  'Physical Education': colors.error,
  Art: '#EC4899',
  Music: '#F59E0B',
  Library: '#6B7280',
  'Activity Period': '#10B981',
};

export const TimetableScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();

  const today = new Date().getDay();
  const currentDayIndex = today === 0 ? 0 : today - 1; // Sunday returns 0, adjust for Monday start

  const [selectedDay, setSelectedDay] = useState(currentDayIndex < 6 ? currentDayIndex : 0);
  const [refreshing, setRefreshing] = useState(false);

  const currentSchedule = useMemo(() => {
    return MOCK_TIMETABLE[DAYS[selectedDay]] || [];
  }, [selectedDay]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Fetch timetable from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getSubjectColor = (subject: string) => {
    return SUBJECT_COLORS[subject] || colors.textMuted;
  };

  const isCurrentPeriod = (period: Period) => {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Check if it's the selected day (Sunday = 0, so Monday = 1, etc.)
    if (dayOfWeek !== selectedDay + 1) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = period.startTime.split(':').map(Number);
    const [endHour, endMin] = period.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime < endTime;
  };

  const renderDaySelector = () => (
    <View style={styles.daySelectorContainer}>
      {DAYS.map((day, index) => (
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            selectedDay === index && styles.dayButtonActive,
          ]}
          onPress={() => setSelectedDay(index)}
        >
          <Text
            variant="caption"
            semibold
            style={[
              styles.dayText,
              selectedDay === index && styles.dayTextActive,
            ]}
          >
            {DAYS_SHORT[index]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPeriod = ({ item }: { item: Period }) => {
    const isCurrent = isCurrentPeriod(item);
    const subjectColor = getSubjectColor(item.subject);

    return (
      <View style={[styles.periodCard, isCurrent && styles.periodCardCurrent]}>
        <View style={[styles.periodIndicator, { backgroundColor: subjectColor }]} />

        <View style={styles.periodTime}>
          <Text variant="bodySmall" semibold>
            {item.startTime}
          </Text>
          <Text variant="caption" color="muted">
            {item.endTime}
          </Text>
        </View>

        <View style={styles.periodDetails}>
          <View style={styles.periodHeader}>
            <Text variant="body" semibold numberOfLines={1} style={styles.subjectName}>
              {item.subject}
            </Text>
            {isCurrent && (
              <Badge label="NOW" variant="primary" size="sm" />
            )}
          </View>

          <View style={styles.periodMeta}>
            <View style={styles.metaItem}>
              <Icon name="profile" size={12} color={colors.textMuted} />
              <Text variant="caption" color="secondary" style={styles.metaText}>
                {item.teacher}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.periodNumber}>
          <Text variant="caption" color="muted">
            P{item.periodNumber}
          </Text>
        </View>
      </View>
    );
  };

  const renderBreak = (afterPeriod: number) => {
    if (afterPeriod === 2) {
      return (
        <View style={styles.breakCard}>
          <Icon name="calendar" size={16} color={colors.textMuted} />
          <Text variant="caption" color="muted" style={styles.breakText}>
            Short Break (10:00 - 10:15)
          </Text>
        </View>
      );
    }
    if (afterPeriod === 4) {
      return (
        <View style={styles.breakCard}>
          <Icon name="calendar" size={16} color={colors.textMuted} />
          <Text variant="caption" color="muted" style={styles.breakText}>
            Lunch Break (11:45 - 12:30)
          </Text>
        </View>
      );
    }
    return null;
  };

  const dataWithBreaks = useMemo(() => {
    const result: (Period | { type: 'break'; afterPeriod: number })[] = [];
    currentSchedule.forEach((period) => {
      result.push(period);
      if (period.periodNumber === 2 || period.periodNumber === 4) {
        result.push({ type: 'break', afterPeriod: period.periodNumber });
      }
    });
    return result;
  }, [currentSchedule]);

  return (
    <ListTemplate
      headerProps={{
        title: 'Timetable',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
    >
      <FlatList
        data={dataWithBreaks}
        keyExtractor={(item, index) =>
          'type' in item ? `break-${item.afterPeriod}` : item.id
        }
        renderItem={({ item }) => {
          if ('type' in item) {
            return renderBreak(item.afterPeriod);
          }
          return renderPeriod({ item });
        }}
        ListHeaderComponent={renderDaySelector}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No Classes"
            description={`No classes scheduled for ${DAYS[selectedDay]}.`}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  daySelectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  dayButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.textSecondary,
  },
  dayTextActive: {
    color: colors.white,
  },
  periodCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  periodCardCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  periodIndicator: {
    width: 4,
  },
  periodTime: {
    width: 55,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  periodDetails: {
    flex: 1,
    padding: spacing.md,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  subjectName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  periodMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: spacing.xs,
  },
  periodNumber: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundLight,
  },
  breakText: {
    marginLeft: spacing.sm,
  },
});
