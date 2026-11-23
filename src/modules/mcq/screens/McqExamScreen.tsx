import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  AppState,
  AppStateStatus,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Text, Icon, Button, colors, spacing, borderRadius} from '../../../design-system';
import {AppAlert} from '../../../design-system/molecules/AppAlert';
import {ROUTES} from '../../../core/constants/routes';
import {mcqApi, mcqErrorCode, mcqErrorMessage} from '../services/mcqApi';
import {McqFinishReason, McqStartedExam} from '../types/mcq.types';
import {OptionRow, formatClock, optionsOf} from '../components/mcqUi';

// The timed test. Rules (also shown before starting):
//  • Countdown at the top comes from the server (remaining_seconds); at 0 the
//    test is finished as TIME_UP and the result page opens.
//  • Each answer is saved to the server immediately.
//  • Leaving — app to background (Home, another app, a call, screen off) or
//    navigating away (hardware back) — finishes the test as LEFT_APP with an
//    automatic reason. The server also closes an attempt the app never
//    reported (killed), so it cannot be resumed.

const REASON_BACKGROUND = 'App minimized or switched to another app';
const REASON_LEFT_SCREEN = 'Left the exam screen';
const WARN_SECONDS = 60;

type Phase = 'loading' | 'running' | 'finishing' | 'done';

export const McqExamScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {adno, paperId, paperName} = route.params as {adno: string; paperId: number; paperName?: string};

  const [phase, setPhase] = useState<Phase>('loading');
  const [exam, setExam] = useState<McqStartedExam | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(0);

  // Refs so listeners registered once always see the current state.
  const phaseRef = useRef<Phase>('loading');
  const endAtRef = useRef(0);
  const leavingAllowedRef = useRef(false);
  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const params = {adno, paperId, paperName};

  /** Leave this screen without the "end the test?" guard. */
  const leave = useCallback(
    (to: 'result' | 'back') => {
      leavingAllowedRef.current = true;
      if (to === 'result') navigation.replace(ROUTES.MCQ_RESULT, params);
      else navigation.goBack();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, adno, paperId],
  );

  // Finish once; retried until the server confirms (needed when the request
  // was cut off while the app was in the background).
  const finish = useCallback(
    async (reason: McqFinishReason, closeReason?: string) => {
      if (phaseRef.current !== 'running') return;
      setPhaseBoth('finishing');
      for (let attempt = 0; ; attempt++) {
        try {
          await mcqApi.finish(adno, paperId, reason, closeReason);
          setPhaseBoth('done');
          leave('result');
          return;
        } catch (err) {
          const code = mcqErrorCode(err);
          if (code || (err as any)?.response?.status === 404) {
            // Already finished / not found on the server — show what it has.
            setPhaseBoth('done');
            leave('result');
            return;
          }
          if (attempt >= 2) {
            await new Promise<void>(resolve =>
              AppAlert.alert('Could not submit', mcqErrorMessage(err, 'Check your internet connection.'), [
                {text: 'Retry', onPress: () => resolve()},
              ]),
            );
            attempt = -1;
          } else {
            await new Promise<void>(r => setTimeout(() => r(), 1500));
          }
        }
      }
    },
    [adno, paperId, leave],
  );

  // ── start ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await mcqApi.start(adno, paperId);
        if (cancelled) return;
        endAtRef.current = Date.now() + data.remaining_seconds * 1000;
        setRemaining(data.remaining_seconds);
        setExam(data);
        setAnswers(data.answers || {});
        setPhaseBoth('running');
      } catch (err) {
        if (cancelled) return;
        setPhaseBoth('done');
        if (mcqErrorCode(err) === 'ALREADY_ATTEMPTED') {
          leave('result');
          return;
        }
        AppAlert.alert('Cannot start the test', mcqErrorMessage(err, 'Please try again.'), [
          {text: 'OK', onPress: () => leave('back')},
        ]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── countdown ──
  useEffect(() => {
    if (phase !== 'running') return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) finish('TIME_UP');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  // ── leaving the app ends the test ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      // 'background' = Home, app switch, incoming call, screen off. ('inactive'
      // alone is iOS control centre / notification pull — not leaving.)
      if (next === 'background' && phaseRef.current === 'running') {
        finish('LEFT_APP', REASON_BACKGROUND);
      }
    });
    return () => sub.remove();
  }, [finish]);

  // ── leaving the screen (hardware back, any navigation) ends the test ──
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (leavingAllowedRef.current) return;
      e.preventDefault();
      if (phaseRef.current === 'finishing') return; // already on its way to the result
      if (phaseRef.current !== 'running') {
        leavingAllowedRef.current = true;
        navigation.dispatch(e.data.action);
        return;
      }
      AppAlert.alert('End the test?', 'If you leave now the test is finished and cannot be taken again.', [
        {text: 'Stay', style: 'cancel'},
        {text: 'End test', style: 'destructive', onPress: () => finish('LEFT_APP', REASON_LEFT_SCREEN)},
      ]);
    });
    return unsub;
  }, [navigation, finish]);

  const choose = (qusId: number, option: number) => {
    if (phaseRef.current !== 'running') return;
    const value = answers[qusId] === String(option) ? '' : String(option); // tap again to clear
    setAnswers(prev => ({...prev, [qusId]: value}));
    mcqApi.answer(adno, paperId, qusId, value).catch(err => {
      // Time over / already closed on the server → go to the result.
      if (mcqErrorCode(err) === 'FINISHED') finish('TIME_UP');
    });
  };

  const confirmFinish = () => {
    const total = exam?.questions.length || 0;
    const unanswered = (exam?.questions || []).filter(q => !answers[q.qus_id]).length;
    AppAlert.alert(
      'Finish the test?',
      unanswered
        ? `${unanswered} of ${total} question${total === 1 ? '' : 's'} not answered. They will be marked as not answered.`
        : 'All questions are answered.',
      [
        {text: 'Review', style: 'cancel'},
        {text: 'Finish', onPress: () => finish('SUBMITTED')},
      ],
    );
  };

  if (phase === 'loading' || !exam) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="body" color="secondary" style={{marginTop: spacing.md}}>
          {phase === 'loading' ? 'Starting the test…' : 'Please wait…'}
        </Text>
      </SafeAreaView>
    );
  }

  const q = exam.questions[index];
  const total = exam.questions.length;
  const answeredCount = exam.questions.filter(x => !!answers[x.qus_id]).length;
  const low = remaining <= WARN_SECONDS;
  const isLast = index === total - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Top bar: paper + countdown */}
      <View style={styles.topBar}>
        <View style={{flex: 1}}>
          <Text variant="body" color="white" bold numberOfLines={1}>{exam.qus_paper_name}</Text>
          <Text variant="caption" color="white" style={{opacity: 0.85}}>
            {exam.sub_name} · {answeredCount}/{total} answered
          </Text>
        </View>
        <View style={[styles.timer, low && styles.timerLow]}>
          <Icon name="timer" size={18} color={low ? colors.white : colors.primaryDark} />
          <Text variant="body" bold style={{color: low ? colors.white : colors.primaryDark, marginLeft: 4}}>
            {formatClock(remaining)}
          </Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {width: `${((index + 1) / total) * 100}%`}]} />
      </View>

      {/* Question palette */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paletteWrap} contentContainerStyle={styles.palette}>
        {exam.questions.map((x, i) => (
          <TouchableOpacity
            key={x.qus_id}
            onPress={() => setIndex(i)}
            style={[styles.dot, answers[x.qus_id] ? styles.dotAnswered : null, i === index && styles.dotCurrent]}>
            <Text variant="caption" bold style={{color: answers[x.qus_id] || i === index ? colors.white : colors.textSecondary}}>
              {i + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Question */}
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.body}>
        <Text variant="caption" color="secondary" bold>QUESTION {index + 1} OF {total}</Text>
        <Text variant="h3" style={styles.question}>{q.qus_name}</Text>
        {!!q.qus_image && <Image source={{uri: q.qus_image}} style={styles.qImage} resizeMode="contain" />}
        {optionsOf(q).map((opt, i) => (
          <OptionRow
            key={i}
            index={i}
            text={opt}
            isImage={q.qus_type === 'img'}
            tone={answers[q.qus_id] === String(i + 1) ? 'selected' : 'idle'}
            onPress={() => choose(q.qus_id, i + 1)}
          />
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.footer}>
        <Button title="Previous" variant="outline" onPress={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} style={styles.footerBtn} />
        {isLast ? (
          <Button title="Finish" onPress={confirmFinish} loading={phase === 'finishing'} style={styles.footerBtn} />
        ) : (
          <Button title="Next" onPress={() => setIndex(i => Math.min(total - 1, i + 1))} style={styles.footerBtn} />
        )}
      </View>
      {!isLast && (
        <TouchableOpacity onPress={confirmFinish} style={styles.finishLink}>
          <Text variant="caption" color="secondary" semibold>Finish test now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundLight},
  container: {flex: 1, backgroundColor: colors.backgroundLight},
  topBar: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.base, paddingVertical: spacing.md},
  timer: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2},
  timerLow: {backgroundColor: colors.error},
  progressTrack: {height: 4, backgroundColor: colors.primarySoft},
  progressFill: {height: 4, backgroundColor: colors.primaryDark},
  paletteWrap: {flexGrow: 0, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border},
  palette: {paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm},
  dot: {width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white},
  dotAnswered: {backgroundColor: colors.success, borderColor: colors.success},
  dotCurrent: {backgroundColor: colors.primary, borderColor: colors.primaryDark},
  body: {padding: spacing.base, paddingBottom: spacing.xl},
  question: {marginTop: spacing.sm, marginBottom: spacing.base},
  qImage: {width: '100%', height: 180, marginBottom: spacing.base, borderRadius: borderRadius.lg, backgroundColor: colors.white},
  footer: {flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border},
  footerBtn: {flex: 1},
  finishLink: {alignItems: 'center', paddingVertical: spacing.sm, backgroundColor: colors.white},
});
