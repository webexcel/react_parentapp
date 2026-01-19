import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ListTemplate,
  SearchBar,
  EmptyState,
  Spinner,
  spacing,
} from '../../../design-system';
import { ROUTES } from '../../../core/constants';
import { useCirculars } from '../hooks/useCirculars';
import { CircularCard } from '../components/CircularCard';
import { Circular } from '../types/circular.types';

export const CircularsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { circulars, isLoading, refetch } = useCirculars();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredCirculars = useMemo(() => {
    return circulars.filter((circular) => {
      const matchesSearch =
        circular.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circular.content.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [circulars, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCircularPress = useCallback((circular: Circular) => {
    navigation.navigate(ROUTES.CIRCULAR_DETAIL, { circular });
  }, [navigation]);

  const renderCircular = useCallback(({ item }: { item: Circular }) => (
    <CircularCard circular={item} onPress={() => handleCircularPress(item)} />
  ), [handleCircularPress]);

  if (isLoading && !refreshing) {
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
        <FlatList
          data={filteredCirculars}
          keyExtractor={(item) => item.id}
          renderItem={renderCircular}
          ListEmptyComponent={
            <EmptyState
              icon="circular"
              title="No Circulars"
              description="There are no circulars to display at the moment."
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
    marginBottom: spacing.base,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
});
