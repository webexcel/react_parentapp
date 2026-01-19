import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Icon, colors, spacing, borderRadius, shadows } from '../../../design-system';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  {
    icon: 'marks',
    text: 'How is my child performing academically?',
  },
  {
    icon: 'homework',
    text: 'Any pending homework?',
  },
  {
    icon: 'calendar',
    text: 'What are the upcoming events?',
  },
  {
    icon: 'attendance',
    text: 'Show attendance summary',
  },
  {
    icon: 'fees',
    text: 'Any pending fee payments?',
  },
  {
    icon: 'circulars',
    text: 'Latest school announcements?',
  },
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
}) => {
  return (
    <View style={styles.container}>
      <Text variant="bodySmall" color="secondary" style={styles.title}>
        Suggested Questions
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <TouchableOpacity
            key={index}
            style={styles.questionChip}
            onPress={() => onSelectQuestion(question.text)}
            activeOpacity={0.7}
          >
            <Icon name={question.icon as any} size={16} color={colors.primary} />
            <Text variant="caption" style={styles.questionText} numberOfLines={2}>
              {question.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  questionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: 180,
    gap: spacing.sm,
    ...shadows.sm,
  },
  questionText: {
    color: colors.primary,
    flex: 1,
  },
});
