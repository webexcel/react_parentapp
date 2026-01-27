import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import {
  ListTemplate,
  Text,
  Spinner,
  Icon,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceCalendar } from '../components/AttendanceCalendar';

type AttendanceRouteParams = {
  Attendance: {
    studentId?: string;
  };
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const AttendanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AttendanceRouteParams, 'Attendance'>>();
  const { students, selectedStudentId, selectStudent } = useAuth();

  // Auto-select student from route params if provided
  useEffect(() => {
    const studentIdFromRoute = route.params?.studentId;
    if (studentIdFromRoute && studentIdFromRoute !== selectedStudentId) {
      const studentExists = students.some(s => s.id === studentIdFromRoute);
      if (studentExists) {
        selectStudent(studentIdFromRoute);
      }
    }
  }, [route.params?.studentId]);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const { days, summary, isLoading, isFetching, refetch } = useAttendance(
    selectedMonth,
    selectedYear
  );

  // Auto-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentMonth =
      selectedMonth === currentDate.getMonth() + 1 &&
      selectedYear === currentDate.getFullYear();

    if (isCurrentMonth) return;

    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isNextDisabled =
    selectedMonth === currentDate.getMonth() + 1 &&
    selectedYear === currentDate.getFullYear();

  if ((isLoading || isFetching) && !refreshing) {
    return (
      <ListTemplate
        headerProps={{
          title: 'Attendance',
          showBack: true,
          onBack: () => navigation.goBack(),
        }}
        students={students}
        selectedStudentId={selectedStudentId || ''}
        onSelectStudent={selectStudent}
      >
        <Spinner fullScreen message="Loading attendance..." />
      </ListTemplate>
    );
  }

  return (
    <ListTemplate
      headerProps={{
        title: 'Attendance',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.arrowButton}>
            <Icon name="back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.monthDisplay}>
            <Text variant="h3">{MONTHS[selectedMonth - 1]}</Text>
            <Text variant="bodySmall" color="secondary">
              {selectedYear}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={[styles.arrowButton, isNextDisabled && styles.arrowDisabled]}
            disabled={isNextDisabled}
          >
            <Icon
              name="forward"
              size={24}
              color={isNextDisabled ? colors.textMuted : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.percentageCard]}>
            <Text variant="h1" style={styles.percentageText}>
              {summary.percentage}%
            </Text>
            <Text variant="caption" color="secondary">
              Attendance
            </Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: colors.success }]} />
              <Text variant="h3">{summary.presentDays}</Text>
              <Text variant="caption" color="secondary">
                Present
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: colors.error }]} />
              <Text variant="h3">{summary.absentDays}</Text>
              <Text variant="caption" color="secondary">
                Absent
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#8b5cf6' }]} />
              <Text variant="h3">{summary.holidays}</Text>
              <Text variant="caption" color="secondary">
                Holidays
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: '#f97316' }]} />
              <Text variant="h3">{summary.leaves}</Text>
              <Text variant="caption" color="secondary">
                Leaves
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="h4">{summary.workingDays}</Text>
            <Text variant="caption" color="secondary">Working Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="h4">{summary.halfDays}</Text>
            <Text variant="caption" color="secondary">Half Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="h4">{summary.weekends}</Text>
            <Text variant="caption" color="secondary">Weekends</Text>
          </View>
        </View>

        {/* Calendar */}
        <AttendanceCalendar
          month={selectedMonth}
          year={selectedYear}
          days={days}
        />
      </ScrollView>
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  arrowButton: {
    padding: spacing.sm,
  },
  arrowDisabled: {
    opacity: 0.5,
  },
  monthDisplay: {
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    ...shadows.sm,
  },
  percentageCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  percentageText: {
    color: colors.primary,
  },
  summaryGrid: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    ...shadows.sm,
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
});
