import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ScreenHeader, ScreenHeaderProps } from '../../organisms/ScreenHeader';
import { StudentCardSelector, Student } from '../../organisms/StudentCardSelector';
import { useAuth } from '../../../core/auth';

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
  // `students` is already limited to children who have this module. Keep the
  // selector visible whenever the parent has siblings, even if only one of them
  // has the module, so it's always clear whose data is on screen. Hide it only
  // for a parent with a single child.
  const { students: allStudents } = useAuth();
  const hasSiblings = allStudents.length > 1;
  const showSelector = students.length > 1 || (hasSiblings && students.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceLight} />
      <ScreenHeader {...headerProps} />
      {!hideStudentSelector && showSelector && onSelectStudent && (
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
