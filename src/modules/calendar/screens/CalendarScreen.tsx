import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
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

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: 'holiday' | 'event' | 'exam' | 'meeting' | 'activity';
  description?: string;
}

// Mock data - replace with API call
const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Republic Day', date: '2024-01-26', category: 'holiday', description: 'National Holiday' },
  { id: '2', title: 'Annual Sports Day', date: '2024-02-05', category: 'event', description: 'Sports competitions and games' },
  { id: '3', title: 'Parent-Teacher Meeting', date: '2024-02-10', category: 'meeting', description: 'Discuss student progress' },
  { id: '4', title: 'Science Exhibition', date: '2024-02-15', category: 'activity', description: 'Student project showcase' },
  { id: '5', title: 'Unit Test 1', date: '2024-02-20', category: 'exam', description: 'First unit test' },
  { id: '6', title: 'Holi', date: '2024-03-25', category: 'holiday', description: 'Festival of Colors' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_COLORS = {
  holiday: colors.warning,
  event: colors.primary,
  exam: colors.error,
  meeting: colors.info,
  activity: colors.success,
};

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((event) => {
      const eventDate = new Date(event.date);
      const monthMatch = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
      const dateMatch = selectedDate ? event.date === selectedDate : true;
      return monthMatch && dateMatch;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedMonth, selectedYear, selectedDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: number | null; dateString: string | null; hasEvent: boolean; isToday: boolean }> = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, dateString: null, hasEvent: false, isToday: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEvent = MOCK_EVENTS.some(event => event.date === dateString);
      const today = new Date();
      const isToday = day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
      days.push({ date: day, dateString, hasEvent, isToday });
    }

    return days;
  }, [selectedMonth, selectedYear]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Fetch events from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(null); // Clear selected date when changing month
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDate(null); // Clear selected date when changing month
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDatePress = (dateString: string | null) => {
    if (dateString) {
      setSelectedDate(selectedDate === dateString ? null : dateString);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-IN', { day: 'numeric' }),
      weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
  };

  const renderEvent = ({ item }: { item: CalendarEvent }) => {
    const { day, weekday } = formatDate(item.date);
    const categoryColor = CATEGORY_COLORS[item.category];

    return (
      <View style={styles.eventCard}>
        <View style={[styles.dateBlock, { borderLeftColor: categoryColor }]}>
          <Text variant="h3">{day}</Text>
          <Text variant="caption" color="secondary">
            {weekday}
          </Text>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.eventHeader}>
            <Text variant="body" semibold numberOfLines={1} style={styles.eventTitle}>
              {item.title}
            </Text>
            <Badge
              label={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              variant={
                item.category === 'holiday'
                  ? 'warning'
                  : item.category === 'exam'
                  ? 'error'
                  : item.category === 'meeting'
                  ? 'info'
                  : item.category === 'activity'
                  ? 'success'
                  : 'primary'
              }
              size="sm"
            />
          </View>
          {item.description && (
            <Text variant="caption" color="secondary" numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.arrowButton}>
          <Icon name="back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.monthDisplay}>
          <Text variant="h3">{MONTHS[selectedMonth]}</Text>
          <Text variant="bodySmall" color="secondary">
            {selectedYear}
          </Text>
        </View>

        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
          <Icon name="forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdaysRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text variant="caption" color="secondary" semibold>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day.isToday && styles.todayCell,
              day.dateString === selectedDate && styles.selectedDayCell,
              !day.date && styles.emptyCell,
            ]}
            onPress={() => handleDatePress(day.dateString)}
            disabled={!day.date}
            activeOpacity={0.7}
          >
            {day.date && (
              <>
                <Text
                  variant="body"
                  semibold={day.isToday || day.dateString === selectedDate}
                  style={[
                    styles.dayText,
                    day.isToday && styles.todayText,
                    day.dateString === selectedDate && styles.selectedDayText,
                  ]}
                >
                  {day.date}
                </Text>
                {day.hasEvent && (
                  <View style={styles.eventDot} />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.eventsHeader}>
      <Text variant="h3" style={{ fontSize: 18 }}>
        {selectedDate
          ? `Events on ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`
          : 'All Events'}
      </Text>
      {selectedDate && (
        <TouchableOpacity onPress={() => setSelectedDate(null)}>
          <Text variant="bodySmall" color="primary" semibold>
            Clear
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ListTemplate
      headerProps={{
        title: 'School Calendar',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
      hideStudentSelector
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.listContent}>
          {renderCalendar()}
          {renderHeader()}
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item) => (
              <View key={item.id}>
                {renderEvent({ item })}
              </View>
            ))
          ) : (
            <EmptyState
              icon="calendar"
              title="No Events"
              description={selectedDate ? 'No events on this date.' : `No events scheduled for ${MONTHS[selectedMonth]} ${selectedYear}.`}
            />
          )}
        </View>
      </ScrollView>
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  calendarContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  arrowButton: {
    padding: spacing.sm,
  },
  monthDisplay: {
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    position: 'relative',
  },
  emptyCell: {
    opacity: 0,
  },
  todayCell: {
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.md,
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  dayText: {
    textAlign: 'center',
  },
  todayText: {
    color: colors.primary,
  },
  selectedDayText: {
    color: colors.surfaceLight,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.error,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  dateBlock: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    borderLeftWidth: 4,
    backgroundColor: colors.backgroundLight,
  },
  eventDetails: {
    flex: 1,
    padding: spacing.base,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
