import React, { useState, useEffect, useCallback } from 'react';
import { View, SectionList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import {
  ListTemplate,
  Chip,
  EmptyState,
  Spinner,
  Text,
  colors,
  spacing,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { useHomework } from '../hooks/useHomework';
import { HomeworkCard } from '../components/HomeworkCard';
import { Homework } from '../types/homework.types';

type FilterType = 'all' | 'pending' | 'completed';

type HomeworkRouteParams = {
  Homework: {
    studentId?: string;
  };
};

export const HomeworkScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<HomeworkRouteParams, 'Homework'>>();
  const { students, selectedStudentId, selectStudent } = useAuth();

  // Auto-select student from route params if provided
  useEffect(() => {
    const studentIdFromRoute = route.params?.studentId;
    if (studentIdFromRoute && studentIdFromRoute !== selectedStudentId) {
      // Verify the student exists before selecting
      const studentExists = students.some(s => s.id === studentIdFromRoute);
      if (studentExists) {
        selectStudent(studentIdFromRoute);
      }
    }
  }, [route.params?.studentId]);

  const {
    pendingHomework,
    completedHomework,
    isLoading,
    isFetching,
    refetch,
    acknowledgeHomeworkAsync,
    isAcknowledging,
  } = useHomework();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // Refetch data when screen comes into focus
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

  const handleAcknowledge = (homework: Homework) => {
    Alert.alert(
      'Mark as Complete',
      `Are you sure you want to mark "${homework.title}" as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setAcknowledgingId(homework.id);
              await acknowledgeHomeworkAsync(homework.id);
              Alert.alert('Success', 'Homework marked as complete');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark homework as complete');
            } finally {
              setAcknowledgingId(null);
            }
          },
        },
      ]
    );
  };

  const getSections = () => {
    const sections = [];

    if (filter === 'all' || filter === 'pending') {
      if (pendingHomework.length > 0) {
        sections.push({
          title: 'Pending',
          data: pendingHomework,
        });
      }
    }

    if (filter === 'all' || filter === 'completed') {
      if (completedHomework.length > 0) {
        sections.push({
          title: 'Completed',
          data: completedHomework,
        });
      }
    }

    return sections;
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text variant="h3" style={styles.sectionTitle}>
        {section.title}
      </Text>
    </View>
  );

  const renderHomework = ({ item }: { item: Homework }) => (
    <HomeworkCard
      homework={item}
      onAcknowledge={
        item.status !== 'completed' ? () => handleAcknowledge(item) : undefined
      }
      isAcknowledging={acknowledgingId === item.id}
    />
  );

  if ((isLoading || isFetching) && !refreshing) {
    return (
      <ListTemplate
        headerProps={{
          title: 'Homework',
          showBack: true,
          onBack: () => navigation.goBack(),
        }}
        students={students}
        selectedStudentId={selectedStudentId || ''}
        onSelectStudent={selectStudent}
      >
        <Spinner fullScreen message="Loading homework..." />
      </ListTemplate>
    );
  }

  const sections = getSections();

  return (
    <ListTemplate
      headerProps={{
        title: 'Homework',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}
    >

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Chip
          label="All"
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        />
        <Chip
          label={`Pending (${pendingHomework.length})`}
          selected={filter === 'pending'}
          onPress={() => setFilter('pending')}
          style={styles.filterChip}
        />
        <Chip
          label={`Completed (${completedHomework.length})`}
          selected={filter === 'completed'}
          onPress={() => setFilter('completed')}
          style={styles.filterChip}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderHomework}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={
          <EmptyState
            icon="homework"
            title="No Homework"
            description={
              filter === 'pending'
                ? 'Great job! No pending homework.'
                : filter === 'completed'
                ? 'No completed homework yet.'
                : 'No homework assigned yet.'
            }
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  sectionHeader: {
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
});
