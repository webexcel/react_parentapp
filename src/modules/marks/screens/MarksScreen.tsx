import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ListTemplate,
  Text,
  Chip,
  EmptyState,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useMarks } from '../hooks/useMarks';
import { useExams } from '../hooks/useExams';

// Subject color mapping
const SUBJECT_COLORS: { [key: string]: string } = {
  Mathematics: '#3b82f6',
  Science: '#10b981',
  English: '#8b5cf6',
  Hindi: '#f97316',
  Tamil: '#ec4899',
  'Social Studies': '#f59e0b',
  Physics: '#06b6d4',
  Chemistry: '#14b8a6',
  Biology: '#84cc16',
  Computer: '#a855f7',
};

const getSubjectColor = (subject: string): string => {
  return SUBJECT_COLORS[subject] || '#6b7280';
};

const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

// Fallback exams in case API fails
const FALLBACK_EXAMS = [
  { id: 1, name: 'Unit Test 1', year_id: 5 },
  { id: 2, name: 'Mid Term', year_id: 5 },
  { id: 3, name: 'Unit Test 2', year_id: 5 },
  { id: 4, name: 'Final Exam', year_id: 5 },
];

export const MarksScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);

  // Get selected student's classId
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const classId = selectedStudent?.classId;

  console.log('=== MARKS SCREEN ===');
  console.log('selectedStudentId:', selectedStudentId);
  console.log('selectedStudent:', selectedStudent);
  console.log('classId:', classId);

  // Fetch exams list from API using classId
  const { exams: apiExams, isLoading: isLoadingExams, error: examsError } = useExams(classId);

  // Reset exam selection when student/class changes
  useEffect(() => {
    setSelectedExamIndex(0);
  }, [selectedStudentId, classId]);

  // Use API exams if available, otherwise use fallback
  const exams = apiExams.length > 0 ? apiExams : FALLBACK_EXAMS;

  // Use first exam as default
  const selectedExam = exams[selectedExamIndex] || FALLBACK_EXAMS[0];

  const {
    marks,
    isLoading: isLoadingMarks,
    error,
    refetch,
  } = useMarks(selectedExam.id, selectedExam.year_id);

  const isLoading = isLoadingExams || isLoadingMarks;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ListTemplate
      headerProps={{
        title: 'Marks',
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
        {/* Exam Selector */}
        {exams.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.examSelector}
            contentContainerStyle={styles.examSelectorContent}
          >
            {exams.map((exam, idx) => (
              <Chip
                key={exam.id}
                label={exam.name}
                selected={selectedExamIndex === idx}
                onPress={() => setSelectedExamIndex(idx)}
                style={styles.examChip}
              />
            ))}
          </ScrollView>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
              Loading marks...
            </Text>
          </View>
        ) : error ? (
          <EmptyState
            icon="marks"
            title="Unable to Load Marks"
            description="Please check your connection and try again."
          />
        ) : (
          <>
            {/* Subject-wise Marks */}
            <Text variant="h3" style={styles.sectionTitle}>
              Subject-wise Marks
            </Text>

            {marks.length > 0 ? (
              marks.map((mark, index) => {
                const subjectPercentage = Math.round((mark.marks / mark.total) * 100);
                const grade = calculateGrade(subjectPercentage);
                const color = getSubjectColor(mark.subject);

                return (
                  <View key={index} style={styles.markCard}>
                    <View style={styles.markHeader}>
                      <View style={[styles.subjectDot, { backgroundColor: color }]} />
                      <Text variant="body" semibold style={styles.subjectName}>
                        {mark.subject}
                      </Text>
                      <View style={[styles.gradeBadge, { backgroundColor: `${color}20` }]}>
                        <Text variant="caption" semibold style={{ color }}>
                          {grade}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.markDetails}>
                      <Text variant="h3" style={{ color }}>
                        {mark.marks}
                      </Text>
                      <Text variant="caption" color="muted">
                        /{mark.total}
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${subjectPercentage}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text variant="caption" color="secondary">
                        {subjectPercentage}%
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <EmptyState
                icon="marks"
                title="No Marks Available"
                description="Marks for this exam have not been published yet."
              />
            )}
          </>
        )}
      </ScrollView>
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  examSelector: {
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  examSelectorContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  examChip: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  markCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  markHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  subjectName: {
    flex: 1,
  },
  gradeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  markDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundLight,
    borderRadius: 3,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
