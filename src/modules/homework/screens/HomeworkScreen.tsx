import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import {
  ListTemplate,
  Chip,
  EmptyState,
  Spinner,
  Text,
  colors,
  spacing,
} from '../../../design-system';
import { ROUTES, QUERY_KEYS } from '../../../core/constants';
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
  const queryClient = useQueryClient();
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

  const {
    homework,
    totalSize,
    pendingHomework,
    completedHomework,
    isLoading,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
    hasNextPage,
    acknowledgeHomeworkAsync,
  } = useHomework();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Reset query and fetch fresh first page when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      queryClient.resetQueries({ queryKey: [QUERY_KEYS.HOMEWORK] });
    }, [queryClient])
  );

  const filteredHomework = useMemo(() => {
    if (filter === 'pending') return pendingHomework;
    if (filter === 'completed') return completedHomework;
    return homework;
  }, [homework, pendingHomework, completedHomework, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.resetQueries({ queryKey: [QUERY_KEYS.HOMEWORK] });
    setRefreshing(false);
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleHomeworkPress = useCallback((homework: Homework) => {
    navigation.navigate(ROUTES.HOMEWORK_DETAIL, { homework });
  }, [navigation]);

  const handleAcknowledge = useCallback((homework: Homework) => {
    Alert.alert(
      'Mark as Complete',
      `Are you sure you want to mark "${homework.title}" as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await acknowledgeHomeworkAsync(homework.id);
              Alert.alert('Success', 'Homework marked as complete');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark homework as complete');
            }
          },
        },
      ]
    );
  }, [acknowledgeHomeworkAsync]);

  const renderHomework = useCallback(({ item }: { item: Homework }) => (
    <HomeworkCard
      homework={item}
      onPress={() => handleHomeworkPress(item)}
      onAcknowledge={
        item.status !== 'completed' && !item.isAcknowledged
          ? () => handleAcknowledge(item)
          : undefined
      }
    />
  ), [handleHomeworkPress, handleAcknowledge]);

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loadingMore}
        />
      );
    }
    return null;
  }, [isFetchingNextPage]);

  if (isLoading && homework.length === 0 && !refreshing) {
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
          label={`All (${totalSize || homework.length})`}
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

      <FlatList
        data={filteredHomework}
        keyExtractor={(item) => item.id}
        renderItem={renderHomework}
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
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: spacing.base,
  },
});
