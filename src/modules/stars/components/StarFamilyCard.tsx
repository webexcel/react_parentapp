import React from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Text, Icon, colors, spacing} from '../../../design-system';
import {useStarSummary} from '../hooks/useStars';
import {STAR_COLOR, STAR_DARK, STAR_SOFT} from './starsUi';

export interface StarFamilyChild {
  id: string;
  name: string;
  photo?: string | null;
  /** Same avatar colours the dashboard uses on its other cards. */
  color: {bg: string; text: string};
}

interface Props {
  students: StarFamilyChild[];
  onPressStudent: (studentId: string) => void;
  /** Bumped by the dashboard on focus / pull-to-refresh to refetch. */
  refreshKey?: number;
}

// Dashboard card for parents with 2+ children: one column per child with
// their stars this year, this week and their rank — like the Homework and
// Attendance cards. Each column loads its own child's summary.
export const StarFamilyCard: React.FC<Props> = ({students, onPressStudent, refreshKey}) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.label}>Star Rewards</Text>
      <View style={styles.badge}>
        <Icon name="star" size={14} color={STAR_COLOR} />
      </View>
    </View>
    <View style={styles.grid}>
      {students.map((s, i) => (
        <ChildColumn key={s.id} student={s} first={i === 0} refreshKey={refreshKey} onPress={() => onPressStudent(s.id)} />
      ))}
    </View>
  </View>
);

const ChildColumn: React.FC<{
  student: StarFamilyChild;
  first: boolean;
  refreshKey?: number;
  onPress: () => void;
}> = ({student, first, refreshKey, onPress}) => {
  const {summary, isLoading, refetch} = useStarSummary(student.id);

  React.useEffect(() => {
    if (refreshKey) refetch();
  }, [refreshKey, refetch]);

  const on = !!summary?.enabled && !!summary.totals;
  const rank = summary?.rank;
  const firstName = student.name?.split(/\s+/)[0] || student.name;

  return (
    <TouchableOpacity style={[styles.column, first && styles.columnFirst]} onPress={onPress} activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={on ? `${student.name}: ${summary!.totals!.year} stars` : `${student.name}: stars`}>
      <View style={[styles.avatar, {backgroundColor: student.color.bg, borderColor: student.color.text}]}>
        {student.photo ? (
          <Image source={{uri: student.photo}} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarText, {color: student.color.text}]}>
            {student.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{firstName}</Text>
      {on ? (
        <>
          <Text style={styles.total}>{summary!.totals!.year} ★</Text>
          <Text style={styles.sub} numberOfLines={1}>
            +{summary!.totals!.week} wk{rank && rank.stars > 0 ? ` · #${rank.rank}` : ''}
          </Text>
        </>
      ) : (
        <Text style={styles.sub}>{isLoading ? '…' : '–'}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: STAR_SOFT,
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md},
  label: {fontSize: 14, fontWeight: '500', color: STAR_DARK},
  badge: {width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center'},
  grid: {flexDirection: 'row', justifyContent: 'space-around'},
  column: {
    alignItems: 'center', flex: 1, paddingHorizontal: spacing.xs,
    borderLeftWidth: 1, borderLeftColor: '#FDE68A',
  },
  columnFirst: {borderLeftWidth: 0},
  avatar: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs, borderWidth: 1, padding: 3,
  },
  avatarImage: {width: 36, height: 36, borderRadius: 18},
  avatarText: {fontSize: 14, fontWeight: '700'},
  name: {fontSize: 11, fontWeight: '600', color: colors.textSecondary},
  total: {fontSize: 18, fontWeight: '800', color: STAR_DARK, marginTop: 2},
  sub: {fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginTop: 1},
});
