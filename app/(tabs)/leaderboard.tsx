import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { Badge, Card, DeltaBadge, LabAvatar, Pill, Segmented, Sparkline, Tap, Txt } from '../../src/components/ui';
import {
  CATEGORY_META,
  MODELS,
  UPDATED_AT,
  history,
  ranked,
  scoreFor,
  type Category,
  type Model,
} from '../../src/data/models';
import { fmtCompact, fmtMoney, fmtPct } from '../../src/lib/format';
import { useApp } from '../../src/store/app';
import { labColors, radius } from '../../src/theme';

type Sort = 'rank' | 'price' | 'speed' | 'open';

export default function Leaderboard() {
  const { theme, t, lang, state, setSettings, toggleWatch, sync, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('rank');
  const [mode, setMode] = useState<'models' | 'labs'>('models');
  const [syncing, setSyncing] = useState(false);

  const cat = state.settings.category;
  const meta = CATEGORY_META[cat];

  const list = useMemo(() => {
    let rows = ranked(cat);
    const needle = q.trim().toLowerCase();
    if (needle) rows = rows.filter((m) => `${m.name} ${m.lab}`.toLowerCase().includes(needle));
    if (sort === 'price') rows = [...rows].sort((a, b) => (a.priceIn ?? 99) - (b.priceIn ?? 99));
    if (sort === 'speed') rows = [...rows].sort((a, b) => b.speed - a.speed);
    if (sort === 'open') rows = rows.filter((m) => !/proprietary/i.test(m.license));
    return rows;
  }, [cat, q, sort]);

  const labRows = useMemo(() => {
    const rows = ranked(cat);
    const map = new Map<string, { lab: string; best: number; count: number; avg: number }>();
    rows.forEach((m, i) => {
      const cur = map.get(m.lab) ?? { lab: m.lab, best: i + 1, count: 0, avg: 0 };
      cur.count += 1;
      cur.avg += scoreFor(m, cat);
      cur.best = Math.min(cur.best, i + 1);
      map.set(m.lab, cur);
    });
    return [...map.values()]
      .map((r) => ({ ...r, avg: r.avg / r.count }))
      .sort((a, b) => a.best - b.best);
  }, [cat]);

  const doSync = async () => {
    setSyncing(true);
    buzz('light');
    await sync();
    setSyncing(false);
    buzz('success');
  };

  const rankOf = (m: Model) => ranked(cat).findIndex((x) => x.id === m.id) + 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 12, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Txt size={24} weight="800" style={{ flex: 1 }}>
            {t('leaderboard')}
          </Txt>
          <Tap onPress={() => router.push('/compare')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.chip, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill }}>
              <Icon name="scale" size={15} color={theme.textDim} />
              <Txt size={12.5} weight="700" dim>
                {t('compare')}
              </Txt>
            </View>
          </Tap>
        </View>

        <Segmented<Category>
          value={cat}
          onChange={(c) => setSettings({ category: c })}
          scroll
          options={[
            { value: 'text', label: t('category_text'), icon: 'message' },
            { value: 'agent', label: t('category_agent'), icon: 'terminal' },
            { value: 'webdev', label: t('category_webdev'), icon: 'code' },
            { value: 'image', label: t('category_image'), icon: 'image' },
            { value: 'vision', label: t('category_vision'), icon: 'eye' },
          ]}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.chip,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              height: 40,
            }}
          >
            <Icon name="search" size={15} color={theme.textFaint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('search_models')}
              placeholderTextColor={theme.textFaint}
              style={{ flex: 1, color: theme.text, fontSize: 14, outlineStyle: 'none' } as any}
            />
            {q ? (
              <Tap onPress={() => setQ('')}>
                <Icon name="x" size={14} color={theme.textFaint} />
              </Tap>
            ) : null}
          </View>
          <Tap onPress={doSync}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: theme.chip,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={syncing ? 'clock' : 'refresh'} size={16} color={syncing ? theme.accent : theme.textDim} />
            </View>
          </Tap>
        </View>
      </View>

      <FlatList
        data={mode === 'models' ? list : []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 8 }}>
            <Card tone="alt" style={{ gap: 10 }}>
              <Txt size={13} dim style={{ lineHeight: 19 }}>
                {lang === 'ru' ? meta.blurbRu : meta.blurbEn}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View>
                  <Txt size={16} weight="800" mono>
                    {meta.total}
                  </Txt>
                  <Txt size={10.5} faint>
                    {cat === 'agent' ? t('sessions') : t('votes')}
                  </Txt>
                </View>
                <View>
                  <Txt size={16} weight="800" mono>
                    {ranked(cat).length}
                  </Txt>
                  <Txt size={10.5} faint>
                    {t('models').toLowerCase()}
                  </Txt>
                </View>
                <View style={{ flex: 1 }} />
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name={syncing ? 'clock' : 'wifi-off'} size={12} color={theme.textFaint} />
                    <Txt size={10.5} faint>
                      {syncing ? t('syncing') : t('offline_copy')}
                    </Txt>
                  </View>
                  <Txt size={11} dim weight="700">
                    {UPDATED_AT[cat]}
                  </Txt>
                </View>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
              <Pill label={t('models')} active={mode === 'models'} onPress={() => setMode('models')} small />
              <Pill label={t('labs')} active={mode === 'labs'} onPress={() => setMode('labs')} small />
              <View style={{ width: 8 }} />
              {(['rank', 'price', 'speed', 'open'] as Sort[]).map((s) => (
                <Pill
                  key={s}
                  small
                  label={t(`sort_${s}` as any)}
                  active={sort === s}
                  onPress={() => setSort(s)}
                />
              ))}
            </View>

            {mode === 'labs' && (
              <View style={{ gap: 8 }}>
                {labRows.map((r, i) => (
                  <Card key={r.lab} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
                    <Txt size={15} weight="800" mono faint style={{ width: 22 }}>
                      {i + 1}
                    </Txt>
                    <LabAvatar lab={r.lab} size={32} />
                    <View style={{ flex: 1 }}>
                      <Txt size={14.5} weight="700">
                        {r.lab}
                      </Txt>
                      <Txt size={11.5} faint>
                        {r.count} {t('models').toLowerCase()} · best #{r.best}
                      </Txt>
                    </View>
                    <View style={{ width: 74, height: 26 }}>
                      <Sparkline data={history(r.lab, 12, r.avg)} color={labColors[r.lab]} />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const watched = state.watchlist.includes(item.id);
          const score = scoreFor(item, cat);
          return (
            <Tap onPress={() => router.push(`/model/${item.id}`)} onLongPress={() => toggleWatch(item.id)}>
              <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <View style={{ width: 26, alignItems: 'center' }}>
                  <Txt size={15} weight="800" mono color={index < 3 ? theme.accent : undefined}>
                    {index + 1}
                  </Txt>
                  <DeltaBadge delta={item.delta} />
                </View>
                <LabAvatar lab={item.lab} size={34} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt size={14} weight="700" numberOfLines={1}>
                    {item.name}
                  </Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt size={11} faint numberOfLines={1} style={{ maxWidth: 120 }}>
                      {item.lab}
                    </Txt>
                    {!/proprietary/i.test(item.license) && <Badge text="OPEN" color={theme.good} bg={`${theme.good}1A`} />}
                    <Txt size={11} faint>
                      {fmtMoney(item.priceIn)}/M
                    </Txt>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Txt size={15} weight="800" mono>
                    {cat === 'agent' ? fmtPct(score, 1) : score}
                  </Txt>
                  <Txt size={10} faint>
                    {fmtCompact(cat === 'agent' ? item.sessions ?? 0 : item.votes)}
                  </Txt>
                </View>
                <View style={{ width: 56, height: 24 }}>
                  <Sparkline data={history(item.id, 12, cat === 'agent' ? 1450 + score * 4 : score)} width={56} height={24} />
                </View>
                <Tap
                  onPress={() => {
                    buzz('light');
                    toggleWatch(item.id);
                  }}
                >
                  <Icon
                    name={watched ? 'star-filled' : 'star'}
                    size={17}
                    color={watched ? theme.warn : theme.textFaint}
                  />
                </Tap>
              </Card>
            </Tap>
          );
        }}
        ListEmptyComponent={
          mode === 'models' ? (
            <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 30, gap: 8 }}>
              <Icon name="search" size={22} color={theme.textFaint} />
              <Txt dim size={13}>
                Nothing matches “{q}”
              </Txt>
            </Card>
          ) : null
        }
      />
    </View>
  );
}
