import React from 'react';
import {View, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {Text, Icon, colors, spacing, borderRadius} from '../../../design-system';
import {McqExamQuestion, McqTestState} from '../types/mcq.types';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const STATE_STYLE: Record<McqTestState, {label: string; color: string; bg: string}> = {
  AVAILABLE: {label: 'Available today', color: colors.primary, bg: colors.primarySoft},
  UPCOMING: {label: 'Upcoming', color: colors.textSecondary, bg: colors.backgroundLight},
  MISSED: {label: 'Missed', color: colors.textSecondary, bg: colors.backgroundLight},
  IN_PROGRESS: {label: 'Interrupted', color: colors.error, bg: colors.errorLight},
  SUBMITTED: {label: 'Submitted', color: colors.success, bg: colors.successLight},
  TIME_UP: {label: 'Time over', color: colors.warning, bg: colors.warningLight},
  LEFT_APP: {label: 'Closed — left the test', color: colors.error, bg: colors.errorLight},
};

/** 'YYYY-MM-DD' → '16 Nov 2026'. */
export const formatDate = (ymd?: string | null): string => {
  if (!ymd) return '';
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return isNaN(dt.getTime()) ? ymd : dt.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});
};

/** 125 → '02:05'. */
export const formatClock = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** 125 → '2 min 5 s'. */
export const formatDuration = (seconds?: number | null): string => {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min ${s} s` : `${s} s`;
};

export const optionsOf = (q: McqExamQuestion) => [q.opt1, q.opt2, q.opt3, q.opt4];

type OptionTone = 'idle' | 'selected' | 'correct' | 'wrong';

interface OptionRowProps {
  index: number;
  text: string;
  isImage: boolean;
  tone: OptionTone;
  note?: string;
  onPress?: () => void;
}

/** One answer option: letter bubble + text or image. Tappable during the exam. */
export const OptionRow: React.FC<OptionRowProps> = ({index, text, isImage, tone, note, onPress}) => {
  const toneStyle =
    tone === 'selected' ? styles.selected : tone === 'correct' ? styles.correct : tone === 'wrong' ? styles.wrong : null;
  const letterStyle =
    tone === 'selected' ? styles.letterSelected : tone === 'correct' ? styles.letterCorrect : tone === 'wrong' ? styles.letterWrong : null;
  return (
    <TouchableOpacity style={[styles.option, toneStyle]} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.letter, letterStyle]}>
        {tone === 'selected' || tone === 'correct' ? (
          <Icon name="check" size={18} color={colors.white} />
        ) : (
          <Text variant="label" bold style={tone === 'wrong' ? {color: colors.white} : {color: colors.textSecondary}}>
            {OPTION_LETTERS[index]}
          </Text>
        )}
      </View>
      {isImage ? (
        text ? <Image source={{uri: text}} style={styles.image} resizeMode="contain" /> : <Text variant="body" color="muted">No image</Text>
      ) : (
        <Text variant="body" style={styles.text}>{text}</Text>
      )}
      {!!note && <Text variant="caption" bold style={styles.note}>{note}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, marginBottom: spacing.sm,
    borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  selected: {borderColor: colors.primary, backgroundColor: colors.primarySoft},
  correct: {borderColor: colors.success, backgroundColor: colors.successLight},
  wrong: {borderColor: colors.error, backgroundColor: colors.errorLight},
  letter: {width: 32, height: 32, borderRadius: 16, backgroundColor: colors.backgroundLight, alignItems: 'center', justifyContent: 'center'},
  letterSelected: {backgroundColor: colors.primary},
  letterCorrect: {backgroundColor: colors.success},
  letterWrong: {backgroundColor: colors.error},
  text: {flex: 1},
  image: {flex: 1, height: 90},
  note: {color: colors.textSecondary},
});
