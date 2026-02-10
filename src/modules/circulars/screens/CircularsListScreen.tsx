import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ListTemplate,
  SearchBar,
  EmptyState,
  Spinner,
  Chip,
  colors,
  spacing,
} from '../../../design-system';
import { ROUTES } from '../../../core/constants';
import { useCirculars } from '../hooks/useCirculars';
import { CircularCard } from '../components/CircularCard';
import { Circular } from '../types/circular.types';

type FilterType = 'all' | 'today' | 'pending' | 'acknowledged';

export const CircularsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { circulars, isLoading, isFetching, refetch, acknowledgeCircular } = useCirculars();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Today's date string for "New" filter
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const isToday = useCallback((dateStr: string) => {
    return dateStr?.startsWith(todayStr);
  }, [todayStr]);

  // Counts for filter chips
  const todayCount = useMemo(
    () => circulars.filter((c) => isToday(c.date)).length,
    [circulars, isToday]
  );
  const pendingCount = useMemo(
    () => circulars.filter((c) => !c.isAcknowledged).length,
    [circulars]
  );
  const acknowledgedCount = useMemo(
    () => circulars.filter((c) => c.isAcknowledged).length,
    [circulars]
  );

  const filteredCirculars = useMemo(() => {
    return circulars.filter((circular) => {
      // Filter by today
      if (activeFilter === 'today' && !isToday(circular.date)) return false;
      // Filter by acknowledge status
      if (activeFilter === 'pending' && circular.isAcknowledged) return false;
      if (activeFilter === 'acknowledged' && !circular.isAcknowledged) return false;

      // Filter by search
      const matchesSearch =
        circular.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circular.content.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [circulars, searchQuery, activeFilter, isToday]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCircularPress = useCallback((circular: Circular) => {
    navigation.navigate(ROUTES.CIRCULAR_DETAIL, { circular });
  }, [navigation]);

  const handleAcknowledge = useCallback((circular: Circular) => {
    if (circular.sn && circular.adno) {
      acknowledgeCircular(circular.sn, circular.adno);
    }
  }, [acknowledgeCircular]);

  const renderCircular = useCallback(({ item }: { item: Circular }) => (
    <CircularCard
      circular={item}
      onPress={() => handleCircularPress(item)}
      onAcknowledge={() => handleAcknowledge(item)}
    />
  ), [handleCircularPress, handleAcknowledge]);

  if (isLoading && circulars.length === 0 && !refreshing) {
    return (
      <ListTemplate
        headerProps={{
          title: 'Circulars',
          showBack: true,
          onBack: () => navigation.goBack(),
        }}
        hideStudentSelector
      >
        <Spinner fullScreen message="Loading circulars..." />
      </ListTemplate>
    );
  }

  return (
    <ListTemplate
      headerProps={{
        title: 'Circulars',
        showBack: true,
        onBack: () => navigation.goBack(),
      }}
      hideStudentSelector
    >
      <View style={styles.container}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search circulars..."
          style={styles.searchBar}
        />

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <Chip
            label={`All (${circulars.length})`}
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          {todayCount > 0 && (
            <Chip
              label={`New (${todayCount})`}
              selected={activeFilter === 'today'}
              onPress={() => setActiveFilter('today')}
            />
          )}
          <Chip
            label={`Pending (${pendingCount})`}
            selected={activeFilter === 'pending'}
            onPress={() => setActiveFilter('pending')}
          />
          <Chip
            label={`Done (${acknowledgedCount})`}
            selected={activeFilter === 'acknowledged'}
            onPress={() => setActiveFilter('acknowledged')}
          />
        </View>

        <FlatList
          data={filteredCirculars}
          keyExtractor={(item) => item.id}
          renderItem={renderCircular}
          ListEmptyComponent={
            <EmptyState
              icon="circular"
              title={activeFilter === 'today' ? 'No New Circulars' : activeFilter === 'pending' ? 'No Pending Circulars' : activeFilter === 'acknowledged' ? 'No Acknowledged Circulars' : 'No Circulars'}
              description={activeFilter === 'today' ? 'No circulars received today.' : activeFilter === 'pending' ? 'All circulars have been acknowledged.' : activeFilter === 'acknowledged' ? 'No circulars acknowledged yet.' : 'There are no circulars to display at the moment.'}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </View>
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
});
