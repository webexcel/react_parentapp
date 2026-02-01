
import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Icon,
  colors,
  spacing,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { ROUTES } from '../../../core/constants';
import { useDashboard } from '../hooks';
import { FlashMessageModal } from '../components';
import { useIsModuleEnabled } from '../../../core/brand/featureFlags';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Student avatar colors
const avatarColors = [
  { bg: '#DBEAFE', text: '#2563EB' }, // blue
  { bg: '#F3E8FF', text: '#9333EA' }, // purple
  { bg: '#FCE7F3', text: '#DB2777' }, // pink
  { bg: '#D1FAE5', text: '#059669' }, // green
  { bg: '#FEF3C7', text: '#D97706' }, // amber
];

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { students, selectedStudentId, userData } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showFlashModal, setShowFlashModal] = React.useState(false);
  const hasShownModalRef = React.useRef(false);

  // Feature flags - check which modules are enabled
  const isMarksEnabled = useIsModuleEnabled('marks');
  const isGalleryEnabled = useIsModuleEnabled('gallery');
  const isExamsEnabled = useIsModuleEnabled('exams');
  const isCalendarEnabled = useIsModuleEnabled('calendar');
  const isFeesEnabled = useIsModuleEnabled('fees');
  const isHomeworkEnabled = useIsModuleEnabled('homework');
  const isAttendanceEnabled = useIsModuleEnabled('attendance');
  const isTimetableEnabled = useIsModuleEnabled('timetable');

  // Use dashboard hook for all data
  const {
    summary,
    flashMessages,
    hasFlashMessage,
    latestMessages,
    isLoading,
    isFetching,
    error,
    refresh,
  } = useDashboard();

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Auto-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Show modal only on first load when flash messages are available
  useEffect(() => {
    if (hasFlashMessage && flashMessages.length > 0 && !hasShownModalRef.current) {
      setShowFlashModal(true);
      hasShownModalRef.current = true;
    }
  }, [hasFlashMessage, flashMessages.length]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const getStudentInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const getAvatarColor = (index: number) => {
    return avatarColors[index % avatarColors.length];
  };

  const getHomeworkStatusText = (pending: number, completed: number) => {
    if (pending === 0 && completed === 0) return 'No Homework';
    if (pending === 0 && completed > 0) return 'All Complete';
    return `${pending} Pending`;
  };

  // Transform API data for attendance display - show all students
  const attendanceData = useMemo(() => {
    return students.map((student, index) => ({
      ...student,
      percentage: student.id === selectedStudentId ? summary.attendancePercentage : 0,
      leaveCount: student.id === selectedStudentId ? summary.leaveCount : 0,
      color: getAvatarColor(index),
    }));
  }, [students, selectedStudentId, summary.attendancePercentage, summary.leaveCount]);

  // Transform API data for homework display - show all students
  const homeworkData = useMemo(() => {
    return students.map((student, index) => ({
      ...student,
      pending: student.id === selectedStudentId ? summary.homeworkCount : 0,
      completed: student.id === selectedStudentId ? summary.homeworkCompleted : 0,
      color: getAvatarColor(index),
    }));
  }, [students, selectedStudentId, summary.homeworkCount, summary.homeworkCompleted]);

  // Transform API latest messages to news format
  const latestNews = useMemo(() => {
    if (latestMessages.length > 0) {
      return latestMessages.slice(0, 5).map((msg) => ({
        id: msg.sn,
        text: msg.Message,
        date: msg.SMSdate,
        type: msg.type,
      }));
    }
    // Fallback to empty array if no messages
    return [];
  }, [latestMessages]);

  // All quick access items with their enabled state
  const allQuickAccessItems = [
    {
      id: 'marks',
      enabled: isMarksEnabled,
      icon: 'star',
      title: 'View Marks',
      subtitle: 'Progress reports & grades',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      halfWidth: true,
      onPress: () => navigation.navigate(ROUTES.MARKS),
    },
    {
      id: 'gallery',
      enabled: isGalleryEnabled,
      icon: 'collections',
      title: 'Gallery',
      subtitle: 'Event photos & memories',
      iconBg: '#FCE7F3',
      iconColor: '#DB2777',
      halfWidth: true,
      onPress: () => navigation.navigate(ROUTES.GALLERY),
    },
    {
      id: 'exams',
      enabled: isExamsEnabled,
      icon: 'eventNote',
      title: 'Exam Schedule',
      subtitle: 'Datesheet & syllabus',
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      halfWidth: true,
      onPress: () => navigation.navigate(ROUTES.EXAM_SCHEDULE),
    },
    {
      id: 'calendar',
      enabled: isCalendarEnabled,
      icon: 'calendar',
      title: 'Calendar',
      subtitle: 'Holidays & events',
      iconBg: '#FFEDD5',
      iconColor: '#EA580C',
      halfWidth: true,
      onPress: () => navigation.navigate(ROUTES.CALENDAR),
    },
    {
      id: 'fees',
      enabled: isFeesEnabled,
      icon: 'payments',
      title: 'Fee Details',
      subtitle: 'Invoices & receipts',
      badge: summary.paymentStatus === 'Payment Due' ? 'PAYMENT DUE' : undefined,
      badgeColor: '#FEE2E2',
      badgeTextColor: '#DC2626',
      iconBg: '#E0E7FF',
      iconColor: '#4F46E5',
      onPress: () => navigation.navigate(ROUTES.FEE_DETAILS),
    },
    {
      id: 'timetable',
      enabled: isTimetableEnabled,
      icon: 'schedule',
      title: 'Timetable',
      subtitle: 'Weekly class routine',
      iconBg: '#CFFAFE',
      iconColor: '#0891B2',
      onPress: () => navigation.navigate(ROUTES.TIMETABLE),
    },
    {
      id: 'parentMessage',
      enabled: true, // Always enabled
      icon: 'message',
      title: 'Write to School',
      subtitle: 'Contact school',
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
      onPress: () => navigation.navigate(ROUTES.PARENT_MESSAGES),
    },
    {
      id: 'leaveLetter',
      enabled: true, // Always enabled
      icon: 'calendar',
      title: 'Leave Letter',
      subtitle: 'Request student leave',
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
      onPress: () => navigation.navigate(ROUTES.LEAVE_LETTER),
    },
  ];

  // Filter to only show enabled modules
  const quickAccessItems = allQuickAccessItems.filter(item => item.enabled);

  const displayName = 'Parent';

  // Handle flash message dismiss
  const handleFlashMessageDismiss = useCallback((messageId: number) => {
    // Could implement local dismissal state or API call
    console.log('Dismissed flash message:', messageId);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setShowFlashModal(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundLight} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => hasFlashMessage && setShowFlashModal(true)}
          >
            <Icon name="notification" size={24} color={colors.textSecondary} />
            {(summary.circularsCount > 0 || hasFlashMessage) && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Flash Message Modal */}
        <FlashMessageModal
          messages={flashMessages}
          visible={showFlashModal}
          onClose={handleCloseModal}
          onDismiss={handleFlashMessageDismiss}
        />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}>
            <View style={styles.heroStudentsList}>
              {students.map((student, index) => (
                <React.Fragment key={student.id}>
                  {index > 0 && <View style={styles.heroStudentDivider} />}
                  <View style={styles.heroStudentRow}>
                    <View
                      style={[
                        styles.heroStudentAvatar,
                        { backgroundColor: getAvatarColor(index).bg }
                      ]}
                    >
                      {student.photo ? (
                        <Image
                          source={{ uri: student.photo }}
                          style={styles.heroStudentAvatarImage}
                        />
                      ) : (
                        <Text style={[styles.heroStudentAvatarText, { color: getAvatarColor(index).text }]}>
                          {getStudentInitial(student.name)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.heroStudentInfo}>
                      <Text style={styles.heroStudentName} numberOfLines={1}>
                        {student.name}
                      </Text>
                      <Text style={styles.heroStudentDetails}>
                        {student.className} | Adm No: {student.admissionNo || student.studentId}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          {/* Circulars Card */}
          <TouchableOpacity
            style={styles.circularsCard}
            onPress={() => navigation.navigate(ROUTES.CIRCULARS)}
          >
            <View style={styles.circularsContent}>
              <Text style={styles.cardLabel}>Circulars</Text>
              {(isLoading || isFetching) && !refreshing ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.xs }} />
              ) : (
                <Text style={styles.circularsValue}>
                  {summary.circularsCount > 0 ? `${summary.circularsCount} New` : 'All Read'}
                </Text>
              )}
            </View>
            <View style={styles.circularsIcon}>
              <Icon name="campaign" size={24} color="#2563EB" />
            </View>
          </TouchableOpacity>

          {/* Attendance Card - Bigger for 2+ students, compact for 1 */}
          {isAttendanceEnabled && (students.length >= 2 ? (
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Attendance</Text>
                <View style={[styles.cardIconBadge, { backgroundColor: '#D1FAE5' }]}>
                  <Icon name="check" size={14} color="#059669" />
                </View>
              </View>
              <View style={styles.studentGrid}>
                {attendanceData.map((student, index) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentColumn,
                      index === 0 && styles.studentColumnFirst,
                    ]}
                    onPress={() => navigation.navigate(ROUTES.ATTENDANCE, { studentId: student.id })}
                  >
                    {student.photo ? (
                      <View
                        style={[
                          styles.studentAvatar,
                          {
                            backgroundColor: student.color.bg,
                            borderColor: student.color.text,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: student.photo }}
                          style={styles.studentAvatarImage}
                        />
                      </View>
                    ) : (
                      <>
                        <View
                          style={[
                            styles.studentAvatar,
                            {
                              backgroundColor: student.color.bg,
                              borderColor: student.color.text,
                            },
                          ]}
                        >
                          <Text style={[styles.studentAvatarText, { color: student.color.text }]}>
                            {getStudentInitial(student.name)}
                          </Text>
                        </View>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {student.name}
                        </Text>
                      </>
                    )}
                    <Text style={styles.studentValue}>{student.leaveCount} Absent</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.compactCard}
              onPress={() => navigation.navigate(ROUTES.ATTENDANCE, { studentId: selectedStudentId })}
            >
              <View style={[styles.compactCardIcon, { backgroundColor: '#D1FAE5' }]}>
                <Icon name="attendance" size={20} color="#059669" />
              </View>
              <View style={styles.compactCardContent}>
                <Text style={styles.cardLabel}>Attendance</Text>
                <Text style={styles.compactCardValue}>{summary.leaveCount} Absent</Text>
              </View>
              <View style={[
                styles.compactCardBadge,
                {
                  backgroundColor: summary.todayAttendanceStatus?.toLowerCase() === 'present'
                    ? '#D1FAE5'
                    : summary.todayAttendanceStatus?.toLowerCase() === 'absent'
                    ? '#FEE2E2'
                    : '#FEF3C7'
                }
              ]}>
                <Text style={[
                  styles.compactCardBadgeText,
                  {
                    color: summary.todayAttendanceStatus?.toLowerCase() === 'present'
                      ? '#059669'
                      : summary.todayAttendanceStatus?.toLowerCase() === 'absent'
                      ? '#DC2626'
                      : '#D97706'
                  }
                ]}>
                  {summary.todayAttendanceStatus?.toUpperCase() || 'NOT MARKED'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Homework Card - Bigger for 2+ students, compact for 1 */}
          {isHomeworkEnabled && (students.length >= 2 ? (
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Homework</Text>
                <View style={[styles.cardIconBadge, { backgroundColor: '#FFEDD5' }]}>
                  <Icon name="assignment" size={14} color="#EA580C" />
                </View>
              </View>
              <View style={styles.studentGrid}>
                {homeworkData.map((student, index) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentColumn,
                      index === 0 && styles.studentColumnFirst,
                    ]}
                    onPress={() => navigation.navigate(ROUTES.HOMEWORK, { studentId: student.id })}
                  >
                    {student.photo ? (
                      <View
                        style={[
                          styles.studentAvatar,
                          {
                            backgroundColor: student.color.bg,
                            borderColor: student.color.text,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: student.photo }}
                          style={styles.studentAvatarImage}
                        />
                      </View>
                    ) : (
                      <>
                        <View
                          style={[
                            styles.studentAvatar,
                            {
                              backgroundColor: student.color.bg,
                              borderColor: student.color.text,
                            },
                          ]}
                        >
                          <Text style={[styles.studentAvatarText, { color: student.color.text }]}>
                            {getStudentInitial(student.name)}
                          </Text>
                        </View>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {student.name}
                        </Text>
                      </>
                    )}
                    <Text style={[
                      styles.studentValue,
                      student.pending === 0 && student.completed > 0 && { color: colors.success }
                    ]}>
                      {getHomeworkStatusText(student.pending, student.completed)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.compactCard}
              onPress={() => navigation.navigate(ROUTES.HOMEWORK)}
            >
              <View style={[styles.compactCardIcon, { backgroundColor: '#FFEDD5' }]}>
                <Icon name="homework" size={20} color="#EA580C" />
              </View>
              <View style={styles.compactCardContent}>
                <Text style={styles.cardLabel}>Homework</Text>
                <Text style={[
                  styles.compactCardValue,
                  summary.homeworkCount === 0 && summary.homeworkCompleted > 0 && { color: colors.success }
                ]}>
                  {getHomeworkStatusText(summary.homeworkCount, summary.homeworkCompleted)}
                </Text>
              </View>
              {/* Only show badge if there's homework (pending or completed) */}
              {(summary.homeworkCount > 0 || summary.homeworkCompleted > 0) && (
                <View style={[
                  styles.compactCardBadge,
                  { backgroundColor: summary.homeworkCount === 0 ? '#D1FAE5' : '#FFEDD5' }
                ]}>
                  <Text style={[
                    styles.compactCardBadgeText,
                    { color: summary.homeworkCount === 0 ? colors.success : '#EA580C' }
                  ]}>
                    {summary.homeworkCount === 0 ? 'DONE' : 'PENDING'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>


        {/* Latest News */}
        {latestNews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest News</Text>
              <TouchableOpacity onPress={() => navigation.navigate(ROUTES.CIRCULARS)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.newsContainer}
              contentContainerStyle={styles.newsContent}
            >
              {latestNews.map((news) => (
                <TouchableOpacity
                  key={news.id}
                  style={styles.newsCard}
                  onPress={() => navigation.navigate(ROUTES.CIRCULARS)}
                >
                  <Text style={styles.newsText}>{news.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Access */}
        {quickAccessItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.quickAccessHeader}>
              <Icon name="gridView" size={20} color="#2563EB" />
              <Text style={styles.quickAccessHeaderTitle}>Quick Access</Text>
            </View>

            <View style={styles.quickAccessList}>
              {/* Render items in rows of 2 */}
              {Array.from({ length: Math.ceil(quickAccessItems.length / 2) }, (_, rowIndex) => (
                <View key={rowIndex} style={styles.quickAccessRow}>
                  {quickAccessItems.slice(rowIndex * 2, rowIndex * 2 + 2).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.quickAccessGridItem}
                      onPress={item.onPress}
                    >
                      <View style={[styles.quickAccessIcon, { backgroundColor: item.iconBg }]}>
                        <Icon name={item.icon as any} size={20} color={item.iconColor} />
                      </View>
                      <Text style={styles.quickAccessGridTitle}>{item.title}</Text>
                      <Text style={styles.quickAccessGridSubtitle}>{item.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  heroSection: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  heroBackground: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: spacing.base,
    overflow: 'hidden',
  },
  heroStudentsList: {
    gap: spacing.md,
  },
  heroStudentDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: spacing.xs,
  },
  heroStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStudentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroStudentAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  heroStudentAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroStudentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  heroStudentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroStudentDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  studentSelectorContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  studentSelectorContent: {
    paddingHorizontal: spacing.base,
  },
  studentChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  studentChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  studentChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  studentChipTextSelected: {
    color: '#FFFFFF',
  },
  welcomeSection: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardsContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cardIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  studentColumn: {
    alignItems: 'center',
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingHorizontal: spacing.xs,
  },
  studentColumnFirst: {
    borderLeftWidth: 0,
  },
  studentAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    padding: 3,
  },
  studentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  studentName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  studentStatus: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  circularsCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circularsContent: {
    flex: 1,
  },
  circularsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  circularsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  compactCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  compactCardBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  compactCardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  newsContainer: {
    marginHorizontal: -spacing.base,
  },
  newsContent: {
    paddingHorizontal: spacing.base,
  },
  newsCard: {
    width: SCREEN_WIDTH * 0.55,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  newsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  quickAccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickAccessHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  quickAccessList: {
    gap: spacing.md,
  },
  quickAccessFullItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  quickAccessItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickAccessItemSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickAccessBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  quickAccessBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAccessGridItem: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAccessGridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  quickAccessGridSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  attendanceStats: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  leaveCountText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  leaveCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
