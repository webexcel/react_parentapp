import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { StudentSelector, Student } from '../../organisms/StudentSelector';

export interface DashboardTemplateProps {
  header: React.ReactNode;
  students?: Student[];
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  header,
  students = [],
  selectedStudentId = '',
  onSelectStudent,
  children,
  refreshing = false,
  onRefresh,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />
      <View style={styles.headerContainer}>{header}</View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {students.length > 0 && onSelectStudent && (
          <StudentSelector
            students={students}
            selectedId={selectedStudentId}
            onSelect={onSelectStudent}
          />
        )}
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  headerContainer: {
    backgroundColor: colors.surfaceLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
});
