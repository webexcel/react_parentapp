import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
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
import { useExamSchedule } from '../hooks/useExamSchedule';
import { ExamScheduleItem } from '../types/examSchedule.types';

// Subject color mapping
const SUBJECT_COLORS: { [key: string]: string } = {
  Mathematics: '#3b82f6',
  Maths: '#3b82f6',
  Science: '#10b981',
  English: '#8b5cf6',
  Hindi: '#f97316',
  Tamil: '#ec4899',
  'Social Studies': '#f59e0b',
  Social: '#f59e0b',
  Physics: '#06b6d4',
  Chemistry: '#14b8a6',
  Biology: '#84cc16',
  Computer: '#a855f7',
};

const getSubjectColor = (subject: string): string => {
  // Check for exact match first
  if (SUBJECT_COLORS[subject]) {
    return SUBJECT_COLORS[subject];
  }
  // Check for partial match
  const subjectLower = subject.toLowerCase();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subjectLower.includes(key.toLowerCase())) {
      return color;
    }
  }
  return '#6b7280';
};

export const ExamScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get selected student's classId
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const classId = selectedStudent?.classId;

  const { examSchedule, isLoading, error, refetch } = useExamSchedule(classId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const parseDate = (dateString: string) => {
    // Format: '15-Feb-2024'
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const months: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      const day = parseInt(parts[0], 10);
      const month = months[parts[1]] ?? 0;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  };

  const formatDate = (dateString: string) => {
    const date = parseDate(dateString);
    return {
      day: date.toLocaleDateString('en-IN', { day: 'numeric' }),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
  };

  const getDaysUntil = (dateString: string) => {
    const examDate = parseDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Completed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const renderExam = ({ item }: { item: ExamScheduleItem }) => {
    const { day, month, weekday } = formatDate(item.exam_date);
    const daysUntil = getDaysUntil(item.exam_date);
    const isPast = daysUntil === 'Completed';
    const color = getSubjectColor(item.subject);

    return (
      <View style={[styles.examCard, isPast && styles.examCardPast]}>
        {/* Date Block */}
        <View style={[styles.dateBlock, { backgroundColor: `${color}15` }]}>
          <Text variant="h2" style={{ color }}>
            {day}
          </Text>
          <Text variant="caption" semibold style={{ color }}>
            {month}
          </Text>
          <Text variant="caption" color="secondary">
            {weekday}
          </Text>
        </View>

        {/* Exam Details */}
        <View style={styles.examDetails}>
          <View style={styles.examHeader}>
            <Text variant="body" semibold style={[isPast && styles.textFaded]}>
              {item.subject}
            </Text>
            <Badge
              label={daysUntil}
              variant={isPast ? 'muted' : daysUntil === 'Today' ? 'error' : 'primary'}
              size="sm"
            />
          </View>

          {item.time && (
            <View style={styles.metaRow}>
              <Icon name="timetable" size={14} color={colors.textMuted} />
              <Text variant="caption" color="secondary" style={styles.metaText}>
                {item.time}
              </Text>
            </View>
          )}

          {item.portion && (
            <View style={styles.syllabusContainer}>
              <Text variant="caption" color="secondary">
                Syllabus: {item.portion}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ListTemplate
      headerProps={{
        title: 'Exam Schedule',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
            Loading exam schedule...
          </Text>
        </View>
      ) : error ? (
        <EmptyState
          icon="exam"
          title="Unable to Load Exam Schedule"
          description="Please check your connection and try again."
        />
      ) : (
        <FlatList
          data={examSchedule}
          keyExtractor={(item, index) => `${item.exam_date}-${item.subject}-${index}`}
          renderItem={renderExam}
          ListEmptyComponent={
            <EmptyState
              icon="exam"
              title="No Exams Scheduled"
              description="There are no upcoming exams at the moment."
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  examCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  examCardPast: {
    opacity: 0.6,
  },
  dateBlock: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  examDetails: {
    flex: 1,
    padding: spacing.md,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  textFaded: {
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    marginLeft: spacing.xs,
  },
  syllabusContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
