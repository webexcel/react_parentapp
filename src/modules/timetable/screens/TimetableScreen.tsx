import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ListTemplate,
  Text,
  Badge,
  Icon,
  Spinner,
  EmptyState,
  colors,
  spacing,
  borderRadius,
  shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useBrand } from '../../../core/brand';
import { useTimetable } from '../hooks/useTimetable';
import {
  TimetableEntry,
  DAY_MAP,
  DAY_FULL_MAP,
  PERIOD_MAP,
  TT_TYPE_LABEL,
  TimetableType,
} from '../types/timetable.types';

interface BreakConfig {
  afterPeriod: number;
  label: string;
  startTime: string;
  endTime: string;
}

type ListItem =
  | { type: 'period'; data: TimetableEntry }
  | { type: 'break'; data: BreakConfig };

const DAY_IDS = [1, 2, 3, 4, 5, 6]; // Mon–Sat

const SUBJECT_COLORS: string[] = [
  '#137fec', '#10b981', '#f59e0b', '#ef4444', '#9333EA',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316',
];

const getSubjectColor = (subject: string): string => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
};

export const TimetableScreen: React.FC = () => {
  const navigation = useNavigation();
  const { students, selectedStudentId, selectStudent } = useAuth();
  const { getModuleConfig } = useBrand();

  const timetableConfig = getModuleConfig('timetable');
  const breaks: BreakConfig[] = timetableConfig?.breaks || [];

  const today = new Date().getDay(); // 0=Sun, 1=Mon..6=Sat
  const currentDayId = today >= 1 && today <= 6 ? today : 1;

  const [selectedDayId, setSelectedDayId] = useState(currentDayId);
  const [refreshing, setRefreshing] = useState(false);

  const { timetableByDay, isLoading, isFetching, refetch } = useTimetable();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const currentPeriods = useMemo(() => {
    return timetableByDay[selectedDayId] || [];
  }, [timetableByDay, selectedDayId]);

  // Build list with breaks inserted after configured periods
  const listData = useMemo(() => {
    const breakMap = new Map<number, BreakConfig>();
    breaks.forEach((b) => breakMap.set(b.afterPeriod, b));

    const items: ListItem[] = [];
    currentPeriods.forEach((entry) => {
      items.push({ type: 'period', data: entry });

      const breakAfter = breakMap.get(entry.period_id);
      if (breakAfter) {
        items.push({ type: 'break', data: breakAfter });
      }
    });

    return items;
  }, [currentPeriods, breaks]);

  const renderTypeBadge = (ttType: TimetableType, groupId: string | null) => {
    if (ttType === 0) return null;

    const label =
      ttType === 2 && groupId
        ? `Split ${groupId}`
        : TT_TYPE_LABEL[ttType];

    return (
      <Badge
        label={label}
        variant={ttType === 1 ? 'info' : 'warning'}
        size="sm"
      />
    );
  };

  const renderDaySelector = () => (
    <View style={styles.daySelectorContainer}>
      {DAY_IDS.map((dayId) => (
        <TouchableOpacity
          key={dayId}
          style={[
            styles.dayButton,
            selectedDayId === dayId && styles.dayButtonActive,
          ]}
          onPress={() => setSelectedDayId(dayId)}
        >
          <Text
            variant="caption"
            semibold
            style={[
              styles.dayText,
              selectedDayId === dayId && styles.dayTextActive,
            ]}
          >
            {DAY_MAP[dayId]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBreak = (breakConfig: BreakConfig) => (
    <View style={styles.breakCard}>
      <Icon name="calendar" size={16} color={colors.textMuted} />
      <Text variant="caption" color="muted" style={styles.breakText}>
        {breakConfig.label} ({breakConfig.startTime} - {breakConfig.endTime})
      </Text>
    </View>
  );

  const renderPeriod = (entry: TimetableEntry) => {
    const subjectColor = getSubjectColor(entry.subject_name);

    return (
      <View style={styles.periodCard}>
        <View style={[styles.periodIndicator, { backgroundColor: subjectColor }]} />

        <View style={styles.periodNumber}>
          <Text variant="caption" color="muted">
            {PERIOD_MAP[entry.period_id]}
          </Text>
        </View>

        <View style={styles.periodDetails}>
          <View style={styles.periodHeader}>
            <Text variant="body" semibold numberOfLines={1} style={styles.subjectName}>
              {entry.subject_name}
            </Text>
            {renderTypeBadge(entry.tt_type, entry.group_id)}
          </View>

          <View style={styles.periodMeta}>
            <View style={styles.metaItem}>
              <Icon name="profile" size={12} color={colors.textMuted} />
              <Text variant="caption" color="secondary" style={styles.metaText}>
                {entry.staff_name}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'break') {
      return renderBreak(item.data);
    }
    return renderPeriod(item.data);
  };

  if ((isLoading || isFetching) && !refreshing) {
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
        <Spinner fullScreen message="Loading timetable..." />
      </ListTemplate>
    );
  }

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
        data={listData}
        keyExtractor={(item, index) =>
          item.type === 'break'
            ? `break-${item.data.afterPeriod}`
            : `${item.data.day_id}-${item.data.period_id}-${item.data.group_id || ''}`
        }
        renderItem={renderItem}
        ListHeaderComponent={renderDaySelector}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No Classes"
            description={`No classes scheduled for ${DAY_FULL_MAP[selectedDayId]}.`}
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
  periodIndicator: {
    width: 4,
  },
  periodNumber: {
    width: 40,
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
