import React, {useCallback, useMemo, useState} from 'react';
import {View, SectionList, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {ListTemplate, Text, Icon, EmptyState, colors, spacing, borderRadius} from '../../../design-system';
import {AppAlert} from '../../../design-system/molecules/AppAlert';
import {useModuleAccessGuard, useMenuStudents, useMenuAccess} from '../../../core/menu';
import {ROUTES} from '../../../core/constants/routes';
import {useMcqTests} from '../hooks/useMcqTests';
import {McqTest, McqTestState} from '../types/mcq.types';
import {formatDate, STATE_STYLE} from '../components/mcqUi';

// The selected child's MCQ tests: today's can be started, finished ones open
// their result, upcoming / missed ones are shown for information.
export const McqTestsScreen: React.FC = () => {
  useModuleAccessGuard('mcq');
  const navigation = useNavigation<any>();
  const {getMenuLabel} = useMenuAccess();
  const {students, selectedStudentId, selectStudent} = useMenuStudents('mcq');
  const {adno, tests, isLoading, error, refetch} = useMcqTests(selectedStudentId);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (adno) refetch();
    }, [adno, refetch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    const today = tests.filter(t => t.state === 'AVAILABLE' || t.state === 'IN_PROGRESS');
    const upcoming = tests.filter(t => t.state === 'UPCOMING').reverse(); // soonest first
    const done = tests.filter(t => !['AVAILABLE', 'IN_PROGRESS', 'UPCOMING'].includes(t.state));
    return [
      {title: 'Today', data: today},
      {title: 'Upcoming', data: upcoming},
      {title: 'Completed & past', data: done},
    ].filter(s => s.data.length > 0);
  }, [tests]);

  const openTest = (t: McqTest) => {
    const params = {adno, paperId: t.qus_paper_id, paperName: t.qus_paper_name};
    if (t.state === 'AVAILABLE') {
      AppAlert.alert(
        `Start "${t.qus_paper_name}"?`,
        `${t.qus_count} question${t.qus_count === 1 ? '' : 's'} · ${t.duration_min} minute${t.duration_min === 1 ? '' : 's'}\n\n` +
          '• The timer starts as soon as you begin and cannot be paused.\n' +
          '• The test finishes automatically when the time runs out.\n' +
          '• Leaving this screen or the app (Home, another app, a call) ends the test immediately.\n' +
          '• You can take this test only once.',
        [
          {text: 'Not now', style: 'cancel'},
          {text: 'Start test', onPress: () => navigation.navigate(ROUTES.MCQ_EXAM, params)},
        ],
      );
      return;
    }
    // An unfinished attempt: the server closes it (left the exam) and the
    // exam screen forwards to the result.
    if (t.state === 'IN_PROGRESS') {
      navigation.navigate(ROUTES.MCQ_EXAM, params);
      return;
    }
    if (t.result) navigation.navigate(ROUTES.MCQ_RESULT, params);
  };

  const renderTest = ({item}: {item: McqTest}) => {
    const st = STATE_STYLE[item.state as McqTestState];
    const tappable = item.state === 'AVAILABLE' || item.state === 'IN_PROGRESS' || !!item.result;
    return (
      <TouchableOpacity style={styles.card} activeOpacity={tappable ? 0.7 : 1} disabled={!tappable} onPress={() => openTest(item)}>
        <View style={[styles.iconWrap, {backgroundColor: st.bg}]}>
          <Icon name="quiz" size={24} color={st.color} />
        </View>
        <View style={styles.body}>
          <Text variant="body" semibold numberOfLines={2}>{item.qus_paper_name}</Text>
          <Text variant="caption" color="secondary" style={styles.meta}>
            {item.sub_name} · {item.qus_count} Qs · {item.duration_min} min · {formatDate(item.qus_date)}
          </Text>
          <View style={styles.row}>
            <View style={[styles.badge, {backgroundColor: st.bg}]}>
              <Text variant="caption" style={{color: st.color, fontWeight: '700'}}>{st.label}</Text>
            </View>
            {item.retake && (
              <View style={[styles.badge, styles.retakeBadge]}>
                <Text variant="caption" style={{color: '#6A1B9A', fontWeight: '700'}}>Retake</Text>
              </View>
            )}
            {item.result?.results_published && item.result.correct !== undefined && (
              <Text variant="caption" semibold style={styles.score}>
                Score {item.result.correct}/{item.result.total}
              </Text>
            )}
          </View>
        </View>
        {item.state === 'AVAILABLE' ? (
          <View style={styles.startBtn}>
            <Text variant="caption" color="white" bold>START</Text>
          </View>
        ) : tappable ? (
          <Icon name="chevronRight" size={22} color={colors.textSecondary} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ListTemplate
      headerProps={{title: getMenuLabel('mcq'), showBack: true, onBack: () => navigation.goBack()}}
      students={students}
      selectedStudentId={selectedStudentId || ''}
      onSelectStudent={selectStudent}>
      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState icon="quiz" title="Unable to load tests" description="Please check your connection and try again." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={t => String(t.qus_paper_id)}
          renderItem={renderTest}
          renderSectionHeader={({section}) => (
            <Text variant="label" color="secondary" style={styles.section}>{section.title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState icon="quiz" title="No tests yet" description="Tests assigned by the teacher will appear here." />
          }
        />
      )}
    </ListTemplate>
  );
};

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  list: {padding: spacing.base, paddingBottom: spacing.xl, flexGrow: 1},
  section: {marginTop: spacing.sm, marginBottom: spacing.sm, textTransform: 'uppercase'},
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md},
  body: {flex: 1},
  meta: {marginTop: 2},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs},
  badge: {borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2},
  score: {marginLeft: spacing.sm},
  retakeBadge: {backgroundColor: '#F3E5F5', marginLeft: spacing.xs},
  startBtn: {backgroundColor: colors.primary, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, marginLeft: spacing.sm},
});
