import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { Badge, Card, DeltaBadge, LabAvatar, Meter, SectionTitle, Sparkline, Tap, Txt } from '../../src/components/ui';
import { MODELS, byId, history, ranked, scoreFor } from '../../src/data/models';
import { fmtCompact, fmtPct, timeAgo } from '../../src/lib/format';
import { useApp } from '../../src/store/app';
import { labColors, radius } from '../../src/theme';

export default function Pulse() {
  const { theme, t, lang, state, sync, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const dayIndex = Math.floor(Date.now() / 86400000);

  const featured = useMemo(() => {
    const top = ranked('text').slice(0, 12);
    return top[dayIndex % top.length];
  }, [dayIndex]);

  const movers = useMemo(() => [...MODELS].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 6), []);

  const fresh = useMemo(
    () => [...MODELS].filter((m) => m.votes < 20000 && m.delta > 8).sort((a, b) => b.elo - a.elo).slice(0, 4),
    [],
  );

  const labs = useMemo(() => {
    const rows = ranked('text');
    const map = new Map<string, { lab: string; points: number; best: number; models: number }>();
    rows.forEach((m, i) => {
      const cur = map.get(m.lab) ?? { lab: m.lab, points: 0, best: i + 1, models: 0 };
      cur.points += Math.max(0, 40 - i);
      cur.models += 1;
      cur.best = Math.min(cur.best, i + 1);
      map.set(m.lab, cur);
    });
    return [...map.values()].sort((a, b) => b.points - a.points).slice(0, 6);
  }, []);

  const watched = state.watchlist.map((id) => byId(id)).filter(Boolean) as typeof MODELS;

  const onRefresh = async () => {
    setRefreshing(true);
    buzz('light');
    await sync();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 30, gap: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
    >
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Txt size={24} weight="800">
              {t('pulse_title')}
            </Txt>
            <Txt size={13} faint style={{ marginTop: 2 }}>
              {t('pulse_sub')} · {timeAgo(state.lastSync, lang)}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.chip, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill }}>
            <Icon name="flame" size={14} color={theme.warn} />
            <Txt size={12.5} weight="800">
              {state.streakDays}
            </Txt>
          </View>
        </View>
      </View>

      {/* model of the day */}
      <View>
        <SectionTitle title={t('model_of_day')} icon="sparkles" />
        <Tap onPress={() => router.push(`/model/${featured.id}`)}>
          <Card
            style={{
              gap: 12,
              borderColor: `${labColors[featured.lab] ?? theme.accent}55`,
              backgroundColor: theme.surface,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LabAvatar lab={featured.lab} size={44} />
              <View style={{ flex: 1 }}>
                <Txt size={17} weight="800" numberOfLines={1}>
                  {featured.name}
                </Txt>
                <Txt size={12} faint>
                  {featured.lab} · {featured.license}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt size={20} weight="800" mono>
                  {featured.elo}
                </Txt>
                <DeltaBadge delta={featured.delta} />
              </View>
            </View>
            <Txt size={13} dim style={{ lineHeight: 19 }}>
              {featured.blurb}
            </Txt>
            <Sparkline data={history(featured.id, 20, featured.elo)} width={280} height={44} color={labColors[featured.lab]} />
          </Card>
        </Tap>
      </View>

      {/* watchlist */}
      <View>
        <SectionTitle title={t('watchlist_alerts')} icon="star" action={t('leaderboard')} onAction={() => router.push('/leaderboard')} />
        {watched.length === 0 ? (
          <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 22, gap: 8 }}>
            <Icon name="star" size={20} color={theme.textFaint} />
            <Txt size={12.5} faint style={{ textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 }}>
              {t('no_watchlist')}
            </Txt>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            {watched.map((m) => {
              const rank = ranked('text').findIndex((x) => x.id === m.id) + 1;
              return (
                <Tap key={m.id} onPress={() => router.push(`/model/${m.id}`)}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
                    <LabAvatar lab={m.lab} size={34} />
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight="700" numberOfLines={1}>
                        {m.name}
                      </Txt>
                      <Txt size={11.5} faint>
                        #{rank} · {m.delta >= 0 ? t('climbed') : t('dropped')} {Math.abs(m.delta)} {t('places')}
                      </Txt>
                    </View>
                    <Sparkline data={history(m.id, 12, m.elo)} />
                    <DeltaBadge delta={m.delta} />
                  </Card>
                </Tap>
              );
            })}
          </View>
        )}
      </View>

      {/* movers */}
      <View>
        <SectionTitle title={t('biggest_movers')} icon="pulse" />
        <View style={{ gap: 8 }}>
          {movers.map((m) => (
            <Tap key={m.id} onPress={() => router.push(`/model/${m.id}`)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: m.delta > 0 ? `${theme.good}18` : `${theme.bad}18`,
                  }}
                >
                  <Icon name={m.delta > 0 ? 'trend-up' : 'trend-down'} size={15} color={m.delta > 0 ? theme.good : theme.bad} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={13.5} weight="700" numberOfLines={1}>
                    {m.name}
                  </Txt>
                  <Txt size={11} faint>
                    {m.lab} · {fmtCompact(m.votes)} {t('votes')}
                  </Txt>
                </View>
                <Txt size={13} weight="800" mono color={m.delta > 0 ? theme.good : theme.bad}>
                  {m.delta > 0 ? '+' : ''}
                  {m.delta}
                </Txt>
              </Card>
            </Tap>
          ))}
        </View>
      </View>

      {/* fresh */}
      {fresh.length > 0 && (
        <View>
          <SectionTitle title="Fresh on Arena" icon="bolt" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {fresh.map((m) => (
              <Tap key={m.id} onPress={() => router.push(`/model/${m.id}`)}>
                <Card style={{ width: 172, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <LabAvatar lab={m.lab} size={26} />
                    <Badge text="NEW" color={theme.accent} bg={theme.accentSoft} />
                  </View>
                  <Txt size={13.5} weight="700" numberOfLines={2}>
                    {m.name}
                  </Txt>
                  <Txt size={11} faint numberOfLines={2} style={{ lineHeight: 15 }}>
                    {m.blurb}
                  </Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt size={14} weight="800" mono>
                      {m.elo}
                    </Txt>
                    <Txt size={10.5} faint>
                      ±{m.ci}
                    </Txt>
                  </View>
                </Card>
              </Tap>
            ))}
          </ScrollView>
        </View>
      )}

      {/* labs */}
      <View>
        <SectionTitle title={t('lab_standings')} icon="trophy" />
        <Card style={{ gap: 13 }}>
          {labs.map((l, i) => (
            <View key={l.lab} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt size={12} weight="800" faint mono style={{ width: 16 }}>
                  {i + 1}
                </Txt>
                <Txt size={13.5} weight="700" style={{ flex: 1 }}>
                  {l.lab}
                </Txt>
                <Txt size={11.5} faint>
                  {l.models} · best #{l.best}
                </Txt>
              </View>
              <Meter value={l.points} max={labs[0].points} color={labColors[l.lab] ?? theme.accent} />
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
