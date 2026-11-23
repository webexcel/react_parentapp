import React, {useEffect, useState} from 'react';
import {View, ScrollView, StyleSheet, ActivityIndicator, Image} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {ListTemplate, Text, Icon, EmptyState, colors, spacing, borderRadius} from '../../../design-system';
import {mcqApi, mcqErrorMessage} from '../services/mcqApi';
import {McqExamResult} from '../types/mcq.types';
import {OptionRow, formatDuration, optionsOf} from '../components/mcqUi';

// Finish page: why the test ended, the score, and every question with the
// student's answer vs the correct one. Unanswered questions say "Not answered".

const BANNER = {
  SUBMITTED: {icon: 'check' as const, title: 'Test submitted', color: colors.success, bg: colors.successLight},
  TIME_UP: {icon: 'timer' as const, title: 'Time is over', color: colors.warning, bg: colors.warningLight},
  LEFT_APP: {icon: 'warning' as const, title: 'Test closed', color: colors.error, bg: colors.errorLight},
  IN_PROGRESS: {icon: 'info' as const, title: 'In progress', color: colors.primary, bg: colors.primarySoft},
};

export const McqResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {adno, paperId, paperName} = route.params as {adno: string; paperId: number; paperName?: string};
  const [result, setResult] = useState<McqExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mcqApi
      .result(adno, paperId)
      .then(setResult)
      .catch(err => setError(mcqErrorMessage(err, 'Unable to load the result.')));
  }, [adno, paperId]);

  const s = result?.summary;
  const published = !!s?.results_published;
  const banner = s ? BANNER[s.status] || BANNER.SUBMITTED : null;

  return (
    <ListTemplate
      headerProps={{title: 'Test Result', subtitle: result?.qus_paper_name || paperName, showBack: true, onBack: () => navigation.goBack()}}
      hideStudentSelector>
      {!result && !error ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !s || !banner ? (
        <EmptyState icon="quiz" title="Result not available" description={error || ''} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Why it ended */}
          <View style={[styles.banner, {backgroundColor: banner.bg, borderColor: banner.color}]}>
            <Icon name={banner.icon} size={28} color={banner.color} />
            <View style={{flex: 1, marginLeft: spacing.md}}>
              <Text variant="body" bold style={{color: banner.color}}>{banner.title}</Text>
              {s.status === 'LEFT_APP' && !!s.close_reason && (
                <Text variant="bodySmall" style={{color: banner.color}}>Reason: {s.close_reason}</Text>
              )}
            </View>
          </View>

          {/* Score — only once the teacher publishes results */}
          {published ? (
            <View style={styles.scoreCard}>
              <Text variant="caption" color="secondary">{result.sub_name}</Text>
              <Text variant="h1" style={styles.score}>{s.correct}<Text variant="h3" color="secondary"> / {s.total}</Text></Text>
              <View style={styles.statsRow}>
                <Stat label="Correct" value={s.correct ?? 0} color={colors.success} />
                <Stat label="Wrong" value={s.wrong ?? 0} color={colors.error} />
                <Stat label="Not answered" value={s.not_answered} color={colors.textSecondary} />
              </View>
              <Text variant="caption" color="secondary" style={{marginTop: spacing.sm}}>
                Time taken: {formatDuration(s.time_taken_seconds)}
              </Text>
            </View>
          ) : (
            <View style={styles.scoreCard}>
              <Icon name="lock" size={28} color={colors.textSecondary} />
              <Text variant="body" semibold center style={{marginTop: spacing.sm}}>
                Your answers have been saved
              </Text>
              <Text variant="bodySmall" color="secondary" center style={{marginTop: spacing.xs}}>
                Your teacher will share the results.
              </Text>
              <View style={styles.statsRow}>
                <Stat label="Answered" value={s.attended} color={colors.primary} />
                <Stat label="Not answered" value={s.not_answered} color={colors.textSecondary} />
              </View>
              <Text variant="caption" color="secondary" style={{marginTop: spacing.sm}}>
                Time taken: {formatDuration(s.time_taken_seconds)}
              </Text>
            </View>
          )}

          {/* Answers */}
          {result.questions.map((q, i) => {
            const picked = Number(q.attend) || 0;
            const correct = Number(q.correct_ans) || 0;
            const status = !picked ? 'Not answered' : !published ? 'Answered' : picked === correct ? 'Correct' : 'Wrong';
            const statusColor = !picked ? colors.textSecondary : !published ? colors.primary : picked === correct ? colors.success : colors.error;
            return (
              <View key={q.qus_id} style={styles.qCard}>
                <View style={styles.qHead}>
                  <Text variant="body" semibold style={{flex: 1}}>{i + 1}. {q.qus_name}</Text>
                  <View style={[styles.tag, {borderColor: statusColor}]}>
                    <Text variant="caption" bold style={{color: statusColor}}>{status}</Text>
                  </View>
                </View>
                {!!q.qus_image && <Image source={{uri: q.qus_image}} style={styles.qImage} resizeMode="contain" />}
                {optionsOf(q).map((opt, j) => {
                  const n = j + 1;
                  // Hidden results: show only what the student chose.
                  const tone = !published
                    ? (n === picked ? 'selected' : 'idle')
                    : n === correct ? 'correct' : n === picked ? 'wrong' : 'idle';
                  const note = n === picked ? 'Your answer' : published && n === correct && !picked ? 'Correct answer' : undefined;
                  return <OptionRow key={j} index={j} text={opt} isImage={q.qus_type === 'img'} tone={tone} note={note} />;
                })}
                {!!q.exp && (
                  <Text variant="bodySmall" color="secondary" style={styles.exp}>💡 {q.exp}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </ListTemplate>
  );
};

const Stat: React.FC<{label: string; value: number; color: string}> = ({label, value, color}) => (
  <View style={styles.stat}>
    <Text variant="h3" style={{color}}>{value}</Text>
    <Text variant="caption" color="secondary">{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  content: {padding: spacing.base, paddingBottom: spacing.xl},
  banner: {flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md},
  scoreCard: {backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.base, alignItems: 'center', marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border},
  score: {marginVertical: spacing.xs},
  statsRow: {flexDirection: 'row', alignSelf: 'stretch', marginTop: spacing.sm},
  stat: {flex: 1, alignItems: 'center'},
  qCard: {backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.base, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border},
  qHead: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md},
  tag: {borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2},
  qImage: {width: '100%', height: 160, marginBottom: spacing.md},
  exp: {marginTop: spacing.xs, fontStyle: 'italic'},
});
