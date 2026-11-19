import React, {useCallback, useEffect, useState} from 'react';
import {View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import {ListTemplate, Text, Icon, EmptyState, colors, spacing, borderRadius} from '../../../design-system';
import {useModuleAccessGuard, useMenuStudents, useMenuAccess} from '../../../core/menu';
import {useStarSummary, useStarLeaderboard} from '../hooks/useStars';
import {starsApi} from '../services/starsApi';
import {StarBoardRow, StarHistoryItem, StarPeriod} from '../types/stars.types';
import {MEDALS, STAR_COLOR, STAR_DARK, STAR_SOFT, describe, scopeText, shortDate} from '../components/starsUi';

type Tab = 'mine' | 'board';
const PERIODS: {key: StarPeriod; label: string}[] = [
  {key: 'week', label: 'This week'},
  {key: 'month', label: 'This month'},
  {key: 'year', label: 'This year'},
];

// Star Rewards for the selected child: their stars (totals, rank, history) and
// the leaderboard the school chose (section / class / school, or off).
export const StarsScreen: React.FC = () => {
  useModuleAccessGuard('stars');
  const navigation = useNavigation<any>();
  const {getMenuLabel} = useMenuAccess();
  const {students, selectedStudentId, selectStudent} = useMenuStudents('stars');
  const route = useRoute<any>();
  const [tab, setTab] = useState<Tab>('mine');

  // Opened from a child's column on the dashboard → show that child.
  useEffect(() => {
    const id = route.params?.studentId;
    if (id && id !== selectedStudentId && students.some(s => s.id === id)) selectStudent(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.studentId]);
  const [period, setPeriod] = useState<StarPeriod>('week');
  const [refreshing, setRefreshing] = useState(false);

  const {adno, summary, isLoading, error, refetch} = useStarSummary(selectedStudentId);
  const boardOn = !!summary?.enabled && summary.leaderboard?.scope !== 'off';
  const board = useStarLeaderboard(selectedStudentId, period, boardOn && tab === 'board');

  // Older stars, loaded page by page after the 10 in the summary.
  const [more, setMore] = useState<StarHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    setMore([]);
    setPage(1);
    setHasMore(true);
  }, [adno]);

  useFocusEffect(
    useCallback(() => {
      if (adno) refetch();
    }, [adno, refetch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setMore([]);
    setPage(1);
    setHasMore(true);
    await Promise.all([refetch(), tab === 'board' ? board.refetch() : Promise.resolve()]);
    setRefreshing(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      // History pages hold 20; page 1 starts with the 10 already shown, so
      // anything already on screen is skipped.
      const res = await starsApi.history(adno, page);
      const shown = new Set([...(summary?.recent || []), ...more].map(r => r.id));
      setMore(m => [...m, ...(res.items || []).filter(r => !shown.has(r.id))]);
      setHasMore(!!res.has_more);
      setPage(page + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />;

  const renderBody = () => {
    if (isLoading && !refreshing) {
      return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }
    if (error) {
      return <EmptyState icon="star" title="Unable to load stars" description="Please check your connection and try again." />;
    }
    if (!summary?.enabled || !summary.totals) {
      return (
        <EmptyState icon="star" title="Star Rewards are not available"
          description="Your school has not switched on Star Rewards for this class yet." />
      );
    }
    const {totals, rank, leaderboard} = summary;
    const history = [...(summary.recent || []), ...more];

    return (
      <ScrollView contentContainerStyle={styles.list} refreshControl={refresh}>
        {/* Hero */}
        <View style={styles.hero}>
          <Icon name="star" size={34} color={STAR_COLOR} />
          <Text style={styles.heroTotal}>{totals.year}</Text>
          <Text style={styles.heroLabel}>stars this year</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>+{totals.week}</Text>
              <Text style={styles.heroStatLabel}>this week</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>+{totals.month}</Text>
              <Text style={styles.heroStatLabel}>this month</Text>
            </View>
            {rank && (
              <>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{rank.stars > 0 ? `#${rank.rank}` : '–'}</Text>
                  <Text style={styles.heroStatLabel}>{scopeText(leaderboard?.scope, leaderboard?.label)} · week</Text>
                </View>
              </>
            )}
          </View>
          {rank && rank.behind_next > 0 && (
            <Text style={styles.heroHint}>Only {rank.behind_next} ★ more to move up this week!</Text>
          )}
          {rank && rank.rank === 1 && rank.stars > 0 && <Text style={styles.heroHint}>Top of the board this week! 🏆</Text>}
        </View>

        {/* Tabs */}
        {boardOn && (
          <View style={styles.tabs}>
            {(['mine', 'board'] as Tab[]).map(t => (
              <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'mine' ? 'My Stars' : 'Leaderboard'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'mine' || !boardOn ? (
          <View>
            <Text variant="label" color="secondary" style={styles.section}>RECENT STARS</Text>
            {history.length === 0 ? (
              <Text variant="bodySmall" color="secondary" style={styles.emptyLine}>
                No stars yet. Finish MCQ tests and do well in class to earn stars!
              </Text>
            ) : (
              history.map(item => <HistoryRow key={item.id} item={item} />)
            )}
            {history.length >= 10 && hasMore && (
              <TouchableOpacity style={styles.moreBtn} onPress={loadMore} disabled={loadingMore}>
                {loadingMore ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Text variant="bodySmall" semibold style={{color: colors.primary}}>Show older stars</Text>}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Leaderboard
            period={period}
            onPeriod={setPeriod}
            loading={board.isLoading}
            rows={board.board?.top || []}
            me={board.board?.me || null}
            title={scopeText(board.board?.scope, board.board?.label)}
          />
        )}
      </ScrollView>
    );
  };

  return (
    <ListTemplate
      headerProps={{title: getMenuLabel('stars'), showBack: true, onBack: () => navigation.goBack()}}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}>
      {renderBody()}
    </ListTemplate>
  );
};

const HistoryRow: React.FC<{item: StarHistoryItem}> = ({item}) => {
  const d = describe(item);
  const minus = item.stars < 0;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, {backgroundColor: minus ? '#FEE2E2' : STAR_SOFT}]}>
        <Icon name={d.icon} size={20} color={minus ? colors.error : STAR_COLOR} />
      </View>
      <View style={styles.rowBody}>
        <Text variant="body" semibold numberOfLines={2}>{d.title}</Text>
        <Text variant="caption" color="secondary">
          {shortDate(item.created_at)}
          {item.source_type === 'MANUAL' && item.awarded_by ? ` · ${item.awarded_by}` : ''}
        </Text>
      </View>
      <Text style={[styles.rowStars, minus && {color: colors.error}]}>{minus ? '' : '+'}{item.stars} ★</Text>
    </View>
  );
};

const Leaderboard: React.FC<{
  period: StarPeriod;
  onPeriod: (p: StarPeriod) => void;
  loading: boolean;
  rows: StarBoardRow[];
  me: {rank: number; stars: number; of: number} | null;
  title: string;
}> = ({period, onPeriod, loading, rows, me, title}) => {
  const meShown = rows.some(r => r.is_me);
  return (
    <View>
      <View style={styles.chips}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.key} style={[styles.chip, period === p.key && styles.chipOn]} onPress={() => onPeriod(p.key)}>
            <Text variant="caption" bold style={{color: period === p.key ? colors.white : colors.textSecondary}}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!!title && <Text variant="label" color="secondary" style={styles.section}>TOP STUDENTS {title.toUpperCase()}</Text>}
      {loading ? (
        <ActivityIndicator style={{marginTop: spacing.lg}} color={colors.primary} />
      ) : rows.length === 0 ? (
        <Text variant="bodySmall" color="secondary" style={styles.emptyLine}>No stars given yet.</Text>
      ) : (
        <>
          {rows.map((r, i) => (
            <View key={`${r.rank}-${i}`} style={[styles.rankRow, r.is_me && styles.rankRowMe, r.rank <= 3 && r.stars > 0 && !r.is_me && styles.rankRowTop]}>
              <Text style={styles.rankNo}>{r.stars <= 0 ? '–' : r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}</Text>
              <View style={styles.rowBody}>
                <Text variant="body" semibold numberOfLines={1}>{r.is_me ? `${r.name} (you)` : r.name}</Text>
                {!!r.section && <Text variant="caption" color="secondary">{r.section}</Text>}
              </View>
              <Text style={styles.rowStars}>{r.stars} ★</Text>
            </View>
          ))}
          {me && !meShown && (
            <View style={[styles.rankRow, styles.rankRowMe, {marginTop: spacing.md}]}>
              <Text style={styles.rankNo}>{me.stars > 0 ? `#${me.rank}` : '–'}</Text>
              <View style={styles.rowBody}>
                <Text variant="body" semibold>You</Text>
                <Text variant="caption" color="secondary">of {me.of} students</Text>
              </View>
              <Text style={styles.rowStars}>{me.stars} ★</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  list: {padding: spacing.base, paddingBottom: spacing.xl, flexGrow: 1},
  hero: {
    backgroundColor: STAR_SOFT, borderRadius: borderRadius.xl, padding: spacing.base, alignItems: 'center',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  heroTotal: {fontSize: 40, fontWeight: '800', color: STAR_DARK, marginTop: spacing.xs},
  heroLabel: {fontSize: 13, color: STAR_DARK, fontWeight: '600'},
  heroRow: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.md},
  heroStat: {alignItems: 'center', paddingHorizontal: spacing.md},
  heroStatValue: {fontSize: 18, fontWeight: '800', color: colors.textPrimary},
  heroStatLabel: {fontSize: 11, color: colors.textSecondary, marginTop: 2},
  heroDivider: {width: 1, height: 28, backgroundColor: '#FDE68A'},
  heroHint: {fontSize: 13, color: STAR_DARK, fontWeight: '600', marginTop: spacing.md, textAlign: 'center'},
  tabs: {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, marginTop: spacing.base,
    borderWidth: 1, borderColor: colors.border, padding: 3,
  },
  tab: {flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center'},
  tabOn: {backgroundColor: colors.primary},
  tabText: {fontSize: 14, fontWeight: '600', color: colors.textSecondary},
  tabTextOn: {color: colors.white},
  section: {marginTop: spacing.lg, marginBottom: spacing.sm},
  emptyLine: {marginTop: spacing.sm},
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rowIcon: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md},
  rowBody: {flex: 1},
  rowStars: {fontSize: 16, fontWeight: '800', color: STAR_COLOR, marginLeft: spacing.sm},
  moreBtn: {alignItems: 'center', paddingVertical: spacing.md},
  chips: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base},
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: {backgroundColor: colors.primary, borderColor: colors.primary},
  rankRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rankRowTop: {borderColor: '#FDE68A', backgroundColor: STAR_SOFT},
  rankRowMe: {borderColor: STAR_COLOR, borderWidth: 2, backgroundColor: STAR_SOFT},
  rankNo: {width: 40, fontSize: 18, fontWeight: '700', color: colors.textSecondary, textAlign: 'center', marginRight: spacing.sm},
});
