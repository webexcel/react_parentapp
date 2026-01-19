import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ScreenHeader, ScreenHeaderProps } from '../../organisms/ScreenHeader';
import { StudentCardSelector, Student } from '../../organisms/StudentCardSelector';

export interface ListTemplateProps {
  headerProps: ScreenHeaderProps;
  students?: Student[];
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
  children: React.ReactNode;
  hideStudentSelector?: boolean;
}

export const ListTemplate: React.FC<ListTemplateProps> = ({
  headerProps,
  students = [],
  selectedStudentId = '',
  onSelectStudent,
  children,
  hideStudentSelector = false,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />
      <ScreenHeader {...headerProps} />
      {!hideStudentSelector && students.length > 0 && onSelectStudent && (
        <StudentCardSelector
          students={students}
          selectedId={selectedStudentId}
          onSelect={onSelectStudent}
        />
      )}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
  },
});
