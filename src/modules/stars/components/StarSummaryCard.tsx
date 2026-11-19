import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text, Icon, colors, spacing} from '../../../design-system';
import {useStarSummary} from '../hooks/useStars';
import {STAR_COLOR, STAR_DARK, STAR_SOFT, scopeText} from './starsUi';

interface Props {
  studentId: string | null | undefined;
  onPress: () => void;
  /** Bumped by the dashboard on focus / pull-to-refresh to refetch. */
  refreshKey?: number;
}

// Dashboard card: the selected child's stars this year, this week and their
// rank. Renders nothing while loading, on error, or when the school has stars
// switched off — the dashboard never shows an empty or broken card.
export const StarSummaryCard: React.FC<Props> = ({studentId, onPress, refreshKey}) => {
  const {summary, refetch} = useStarSummary(studentId);

  React.useEffect(() => {
    if (refreshKey) refetch();
  }, [refreshKey, refetch]);

  if (!summary?.enabled || !summary.totals) return null;
  const {totals, rank, leaderboard} = summary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8} accessibilityRole="button"
      accessibilityLabel={`Star Rewards: ${totals.year} stars`}>
      <View style={styles.iconWrap}>
        <Icon name="star" size={26} color={STAR_COLOR} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>Star Rewards</Text>
        <Text style={styles.total}>{totals.year} ★</Text>
        <Text style={styles.sub} numberOfLines={1}>
          +{totals.week} this week
          {rank && rank.stars > 0 ? ` · #${rank.rank} ${scopeText(leaderboard?.scope, leaderboard?.label)}` : ''}
        </Text>
      </View>
      <Icon name="chevronRight" size={22} color={colors.textSecondary} />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  body: {flex: 1, marginLeft: spacing.md},
  label: {fontSize: 14, fontWeight: '500', color: STAR_DARK},
  total: {fontSize: 24, fontWeight: '800', color: STAR_DARK, marginTop: 2},
  sub: {fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginTop: 2},
});
