import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

// Avatar colors matching the design
const avatarColors = [
  { bg: '#FFF3E0', icon: '#F57C00' }, // orange
  { bg: '#E8F5E9', icon: '#43A047' }, // green
  { bg: '#E8EAF6', icon: '#5C6BC0' }, // indigo/purple
  { bg: '#E3F2FD', icon: '#1E88E5' }, // blue
  { bg: '#FCE4EC', icon: '#E91E63' }, // pink
];

export interface Student {
  id: string;
  name: string;
  className?: string;
  photo?: string | null;
}

export interface StudentCardSelectorProps {
  students: Student[];
  selectedId: string;
  onSelect: (id: string) => void;
  title?: string;
  style?: object;
}

export const StudentCardSelector: React.FC<StudentCardSelectorProps> = ({
  students,
  selectedId,
  onSelect,
  title = 'SELECT STUDENT',
  style,
}) => {
  if (students.length === 0) {
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
        {students.map((student, index) => {
          const isSelected = student.id === selectedId;
          const avatarColor = getAvatarColor(index);

          return (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => onSelect(student.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarContainer, { backgroundColor: avatarColor.bg }]}>
                {student.photo ? (
                  <Image
                    source={{ uri: student.photo }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Icon name="profile" size={32} color={avatarColor.icon} />
                )}
              </View>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Icon name="check" size={12} color={colors.surfaceLight} />
                </View>
              )}
              <Text
                style={[styles.name, isSelected && styles.nameSelected]}
                numberOfLines={1}
              >
                {student.name}
              </Text>
              {student.className && (
                <Text
                  style={[styles.className, isSelected && styles.classNameSelected]}
                  numberOfLines={1}
                >
                  {student.className}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  card: {
    alignItems: 'center',
    width: 80,
    paddingVertical: spacing.sm,
  },
  cardSelected: {
    // No visual change for card itself - selection shown via checkBadge
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  checkBadge: {
    position: 'absolute',
    top: 38,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  nameSelected: {
    color: colors.primary,
  },
  className: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  classNameSelected: {
    color: colors.primary,
  },
});
