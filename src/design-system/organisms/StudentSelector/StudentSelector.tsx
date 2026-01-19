import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { StudentChip } from '../../molecules/StudentChip';

export interface Student {
  id: string;
  name: string;
  className?: string;
  photo?: string | null;
}

export interface StudentSelectorProps {
  students: Student[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: object;
}

// Student avatar colors
const avatarColors = [
  { bg: '#DBEAFE', text: '#2563EB' }, // blue
  { bg: '#F3E8FF', text: '#9333EA' }, // purple
  { bg: '#FCE7F3', text: '#DB2777' }, // pink
  { bg: '#D1FAE5', text: '#059669' }, // green
  { bg: '#FEF3C7', text: '#D97706' }, // amber
];

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedId,
  onSelect,
  style,
}) => {
  if (students.length <= 1) {
    return null;
  }

  const getAvatarColor = (index: number) => {
    return avatarColors[index % avatarColors.length];
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {students.map((student, index) => (
          <StudentChip
            key={student.id}
            name={student.name}
            className={student.className}
            photo={student.photo}
            selected={student.id === selectedId}
            color={getAvatarColor(index)}
            onPress={() => onSelect(student.id)}
            style={styles.chip}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
  },
  chip: {
    marginRight: spacing.sm,
  },
});
