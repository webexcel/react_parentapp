import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
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
import { useReportCard } from '../hooks/useReportCard';
import { ReportCardWebView } from '../components/ReportCardWebView';
import { useReportCardTypes } from '../../reportCard';
import { ROUTES } from '../../../core/constants';

// Subject color mapping (lowercase keys for case-insensitive matching)
const SUBJECT_COLORS: { [key: string]: string } = {
  mathematics: '#3b82f6',
  maths: '#3b82f6',
  science: '#10b981',
  english: '#8b5cf6',
  hindi: '#f97316',
  tamil: '#ec4899',
  'social studies': '#f59e0b',
  'social science': '#f59e0b',
  sst: '#f59e0b',
  physics: '#06b6d4',
  chemistry: '#14b8a6',
  biology: '#84cc16',
  computer: '#a855f7',
  'computer science': '#a855f7',
  computers: '#a855f7',
  'information technology': '#a855f7',
  it: '#a855f7',
  'business studies': '#0ea5e9',
  accountancy: '#f43f5e',
  accounts: '#f43f5e',
  economics: '#22c55e',
  geography: '#eab308',
  history: '#d97706',
  'political science': '#7c3aed',
  sanskrit: '#be185d',
  urdu: '#059669',
  telugu: '#dc2626',
  kannada: '#7c2d12',
  malayalam: '#4f46e5',
  marathi: '#c026d3',
  gujarati: '#0d9488',
  'physical education': '#16a34a',
  'moral science': '#8b5cf6',
  'general knowledge': '#06b6d4',
  gk: '#06b6d4',
  art: '#f472b6',
  music: '#a78bfa',
  evs: '#22d3ee',
  'environmental science': '#22d3ee',
};

// Array of colors to cycle through for unknown subjects
const COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899',
  '#f59e0b', '#06b6d4', '#14b8a6', '#84cc16', '#a855f7',
  '#0ea5e9', '#f43f5e', '#22c55e', '#eab308', '#d97706',
];

// Cache for dynamically assigned colors
const dynamicColorCache: { [key: string]: string } = {};
let colorIndex = 0;

// Subject names come straight from the subject master ("II_LANGUAGE",
// "Social_Science"): show them with spaces, and long ALL-CAPS words in title
// case, keeping short codes such as II, EVS or GK as they are.
const formatSubjectName = (subject: string): string =>
  subject
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) =>
      word.length > 3 && word === word.toUpperCase()
        ? word.charAt(0) + word.slice(1).toLowerCase()
        : word
    )
    .join(' ');

const getSubjectColor = (subject: string): string => {
  const normalizedSubject = subject.toLowerCase().trim();

  // Check predefined colors
  if (SUBJECT_COLORS[normalizedSubject]) {
    return SUBJECT_COLORS[normalizedSubject];
  }

  // Check partial match (e.g., "Mathematics - Class X" matches "mathematics")
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (normalizedSubject.includes(key) || key.includes(normalizedSubject)) {
      return color;
    }
  }

  // Assign a consistent color from palette for unknown subjects
  if (!dynamicColorCache[normalizedSubject]) {
    dynamicColorCache[normalizedSubject] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
    colorIndex++;
  }

  return dynamicColorCache[normalizedSubject];
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


export const MarksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);
  const [showReportCard, setShowReportCard] = useState(false);

  // Get selected student's classId
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const classId = selectedStudent?.classId;

  // Fetch exams list from API using classId
  const { exams, isLoading: isLoadingExams, isWaitingForClassId, error: examsError } = useExams(classId);

  // Reset exam selection when student/class changes
  useEffect(() => {
    setSelectedExamIndex(0);
  }, [selectedStudentId, classId]);

  // Get selected exam (only if exams exist)
  const selectedExam = exams.length > 0 ? exams[selectedExamIndex] : null;

  // Only fetch marks if we have a valid exam from API
  const {
    marks,
    feeBlocked,
    feeMessage,
    blockedSubjects,
    isLoading: isLoadingMarks,
    isFetching: isFetchingMarks,
    error,
    refetch,
  } = useMarks(
    selectedExam?.id ?? 0,
    selectedExam?.year_id ?? 0
  );

  // Report cards from schooltree templates: available when the school has set
  // up a template for the student's exam group. Takes over from the per-school
  // PHP report card below, which stays only for schools without templates.
  const { types: reportCardTypes } = useReportCardTypes(selectedStudent?.studentId);
  const hasTemplateReportCard = reportCardTypes.length > 0;

  // Get report card URL - examgrpid from student (source of truth), term_type from exam
  const {
    reportCardUrl,
    isAvailable: isReportCardAvailable,
    isLoading: isLoadingReportCard,
  } = useReportCard(
    selectedStudent?.admissionNo || '',
    Number(classId) || 0,
    selectedStudent?.examgrpid ?? undefined,  // From student (student_class_map)
    selectedExam?.year_id || 0,
    selectedExam?.term_type,
    selectedExam?.id
  );

  // Auto-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Show loading when:
  // 1. Exams are loading
  // 2. We have exams and marks are loading
  // 3. Waiting for classId (student data not yet loaded)
  const isLoading = isWaitingForClassId || isLoadingExams || (exams.length > 0 && isLoadingMarks);
  const isFetching = exams.length > 0 && isFetchingMarks;

  // Check if no exams available from API (only after loading is complete)
  const noExamsAvailable = !isWaitingForClassId && !isLoadingExams && exams.length === 0;

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

        {/* Report Card Button - template report card when the school has one,
            otherwise the PHP one (only for exams with a term_type) */}
        {(hasTemplateReportCard || (selectedExam?.term_type && isReportCardAvailable)) && (
          <TouchableOpacity
            style={styles.reportCardButton}
            onPress={() =>
              hasTemplateReportCard
                ? navigation.navigate(ROUTES.REPORT_CARD)
                : setShowReportCard(true)
            }
            activeOpacity={0.7}
          >
            <Icon name="document-text-outline" size={20} color={colors.primary} />
            <Text variant="body" semibold style={styles.reportCardButtonText}>
              View Report Card
            </Text>
            <Icon name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Loading State */}
        {(isLoading || isFetching) && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="body" color="secondary" style={{ marginTop: spacing.md }}>
              Loading marks...
            </Text>
          </View>
        ) : noExamsAvailable ? (
          <EmptyState
            icon="marks"
            title="No Marks Available"
            description="Exam results have not been published yet."
          />
        ) : error ? (
          <EmptyState
            icon="marks"
            title="Unable to Load Marks"
            description="Please check your connection and try again."
          />
        ) : feeBlocked && blockedSubjects.length === 0 ? (
          <EmptyState
            icon="marks"
            title="Term Fees Pending"
            description={feeMessage}
          />
        ) : feeBlocked ? (
          <>
            <View style={styles.feeBanner}>
              <Icon name="lock-closed" size={20} color={colors.warning} />
              <View style={styles.feeBannerText}>
                <Text variant="body" semibold>
                  Term Fees Pending
                </Text>
                <Text variant="caption" color="secondary">
                  {feeMessage}
                </Text>
              </View>
            </View>

            <Text variant="h3" style={styles.sectionTitle}>
              Subject-wise Marks
            </Text>

            {/* Placeholders only — the backend sends no marks while fees are pending */}
            {blockedSubjects.map((subject, index) => {
              const color = getSubjectColor(subject);
              return (
                <View key={index} style={styles.markCard}>
                  <View style={styles.markHeader}>
                    <View style={[styles.subjectDot, { backgroundColor: color }]} />
                    <Text variant="body" semibold style={styles.subjectName}>
                      {formatSubjectName(subject)}
                    </Text>
                    <Icon name="lock-closed" size={16} color={colors.textSecondary} />
                  </View>

                  {/* Soft stacked layers read as a blurred score */}
                  <View style={styles.blurredScore}>
                    <View style={[styles.blurLayer, styles.blurOuter, { backgroundColor: color }]} />
                    <View style={[styles.blurLayer, styles.blurMiddle, { backgroundColor: color }]} />
                    <View style={[styles.blurLayer, styles.blurInner, { backgroundColor: color }]} />
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, styles.blurredFill, { backgroundColor: color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            {/* Subject-wise Marks */}
            <Text variant="h3" style={styles.sectionTitle}>
              Subject-wise Marks
            </Text>

            {marks.length > 0 ? (
              marks.map((mark, index) => {
                // Only when both are real numbers: the API sends text such as
                // "A" (absent), null for blank marks, and a null total when no
                // max marks are configured for the subject.
                const hasPercentage =
                  typeof mark.marks === 'number' && typeof mark.total === 'number' && mark.total > 0;
                const subjectPercentage = hasPercentage
                  ? Math.round(((mark.marks as number) / (mark.total as number)) * 100)
                  : null;
                const grade = subjectPercentage !== null ? calculateGrade(subjectPercentage) : null;
                const color = getSubjectColor(mark.subject);

                return (
                  <View key={index} style={styles.markCard}>
                    <View style={styles.markHeader}>
                      <View style={[styles.subjectDot, { backgroundColor: color }]} />
                      <Text variant="body" semibold style={styles.subjectName}>
                        {formatSubjectName(mark.subject)}
                      </Text>
                      {grade && (
                        <View style={[styles.gradeBadge, { backgroundColor: `${color}20` }]}>
                          <Text variant="caption" semibold style={{ color }}>
                            {grade}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.markDetails}>
                      <Text variant="h3" style={{ color }}>
                        {mark.marks ?? '–'}
                      </Text>
                      {mark.total != null && (
                        <Text variant="caption" color="muted">
                          /{mark.total}
                        </Text>
                      )}
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(Math.max(subjectPercentage ?? 0, 0), 100)}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text variant="caption" color="secondary">
                        {subjectPercentage !== null ? `${subjectPercentage}%` : '–'}
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

      {/* Report Card WebView Modal */}
      <ReportCardWebView
        visible={showReportCard}
        url={reportCardUrl || ''}
        onClose={() => setShowReportCard(false)}
      />
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
  reportCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reportCardButtonText: {
    color: colors.primary,
    marginHorizontal: spacing.sm,
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
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}1A`,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  feeBannerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  blurredScore: {
    width: 96,
    height: 36,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  blurLayer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  blurOuter: {
    width: 96,
    height: 36,
    borderRadius: 18,
    opacity: 0.08,
  },
  blurMiddle: {
    width: 76,
    height: 26,
    borderRadius: 13,
    opacity: 0.12,
  },
  blurInner: {
    width: 56,
    height: 16,
    borderRadius: 8,
    opacity: 0.18,
  },
  blurredFill: {
    width: '60%',
    opacity: 0.25,
  },
});
