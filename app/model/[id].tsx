import React, { useMemo } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { Badge, Card, Divider, LabAvatar, Meter, SectionTitle, Sparkline, Tap, Txt } from '../../src/components/ui';
import {
  CATEGORY_META,
  byId,
  history,
  ranked,
  scoreFor,
  type Category,
} from '../../src/data/models';
import { fmtCompact, fmtMoney, fmtPct } from '../../src/lib/format';
import { titleFor } from '../../src/lib/responder';
import { uid, useApp } from '../../src/store/app';
import { labColors, radius } from '../../src/theme';

const CATS: Category[] = ['text', 'agent', 'webdev', 'image', 'vision'];

export default function ModelDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, t, state, toggleWatch, upsertChat, buzz, personalRanking } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const model = byId(id ?? '');

  const ranks = useMemo(() => {
    if (!model) return [];
    return CATS.filter((c) => model.modalities.includes(c)).map((c) => ({
      cat: c,
      rank: ranked(c).findIndex((m) => m.id === model.id) + 1,
      total: ranked(c).length,
      score: scoreFor(model, c),
    }));
  }, [model]);

  if (!model) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt dim>Model not found</Txt>
      </View>
    );
  }

  const watched = state.watchlist.includes(model.id);
  const mySessions = state.agentSessions.filter((s) => s.modelId === model.id);
  const myConfirmed = mySessions.filter((s) => s.outcome === 'confirmed').length;
  const color = labColors[model.lab] ?? theme.accent;
  const personal = personalRanking.find((p) => p.id === model.id);

  const signals: { label: string; value: number; max: number; fmt: string; good: boolean }[] = [
    { label: 'Confirmed success', value: model.success ?? 0, max: 24, fmt: fmtPct(model.success), good: true },
    { label: 'Steerability', value: model.steerability ?? 0, max: 18, fmt: fmtPct(model.steerability), good: true },
    { label: 'Net improvement', value: model.agentNet ?? 0, max: 16, fmt: fmtPct(model.agentNet), good: true },
    {
      label: 'Tool hallucination',
      value: model.hallucination !== undefined ? 30 - model.hallucination : 0,
      max: 30,
      fmt: model.hallucination !== undefined ? `${model.hallucination.toFixed(2)}%` : '—',
      good: false,
    },
    { label: 'Speed', value: model.speed, max: 1, fmt: `${Math.round(model.speed * 100)}/100`, good: true },
  ];

  const startChat = () => {
    buzz('medium');
    const prompt = `What are you best at compared to other models?`;
    const chat = {
      id: uid(),
      title: titleFor(prompt),
      modelId: model.id,
      messages: [{ id: uid(), role: 'user' as const, text: prompt, ts: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsertChat(chat);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 12,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Tap onPress={() => router.back()}>
          <View style={{ padding: 7, borderRadius: 999, backgroundColor: theme.chip }}>
            <Icon name="chevron-left" size={18} color={theme.text} />
          </View>
        </Tap>
        <View style={{ flex: 1 }} />
        <Tap
          onPress={() => {
            buzz('light');
            toggleWatch(model.id);
          }}
        >
          <View style={{ padding: 8, borderRadius: 999, backgroundColor: theme.chip }}>
            <Icon name={watched ? 'star-filled' : 'star'} size={17} color={watched ? theme.warn : theme.textDim} />
          </View>
        </Tap>
        <Tap
          onPress={() =>
            Share.share({
              message: `${model.name} — Arena Elo ${model.elo} (${model.lab}). Ranked #${ranks[0]?.rank} in ${ranks[0]?.cat}.`,
            }).catch(() => {})
          }
        >
          <View style={{ padding: 8, borderRadius: 999, backgroundColor: theme.chip }}>
            <Icon name="share" size={16} color={theme.textDim} />
          </View>
        </Tap>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <LabAvatar lab={model.lab} size={52} />
          <View style={{ flex: 1 }}>
            <Txt size={22} weight="800">
              {model.name}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 }}>
              <Txt size={12.5} dim>
                {model.lab}
              </Txt>
              <Badge
                text={model.license.toUpperCase()}
                color={/proprietary/i.test(model.license) ? theme.textDim : theme.good}
                bg={/proprietary/i.test(model.license) ? theme.chip : `${theme.good}1A`}
              />
            </View>
          </View>
        </View>

        <Txt size={14} dim style={{ lineHeight: 20 }}>
          {model.blurb}
        </Txt>

        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt size={11} faint weight="800" style={{ textTransform: 'uppercase', letterSpacing: 0.7 }}>
                {t('arena_score')}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Txt size={34} weight="800" mono>
                  {model.elo}
                </Txt>
                <Txt size={13} faint mono>
                  ±{model.ci}
                </Txt>
              </View>
              <Txt size={11.5} faint>
                {fmtCompact(model.votes)} {t('votes')}
              </Txt>
            </View>
            <Sparkline data={history(model.id, 16, model.elo)} width={130} height={54} color={color} />
          </View>

          <Divider />

          <View style={{ gap: 9 }}>
            {ranks.map((r) => (
              <View key={r.cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name={CATEGORY_META[r.cat].icon as any} size={14} color={theme.textFaint} />
                <Txt size={13} dim style={{ flex: 1, textTransform: 'capitalize' }}>
                  {r.cat}
                </Txt>
                <Txt size={13} weight="800" mono color={r.rank <= 3 ? theme.accent : undefined}>
                  #{r.rank}
                </Txt>
                <Txt size={11} faint mono style={{ width: 42, textAlign: 'right' }}>
                  /{r.total}
                </Txt>
              </View>
            ))}
          </View>
        </Card>

        <View>
          <SectionTitle title={t('strengths')} icon="pulse" />
          <Card style={{ gap: 13 }}>
            {signals.map((s) => (
              <View key={s.label} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Txt size={12.5} dim style={{ flex: 1 }}>
                    {s.label}
                  </Txt>
                  <Txt size={12.5} weight="700" mono>
                    {s.fmt}
                  </Txt>
                </View>
                <Meter
                  value={Math.max(0, s.value)}
                  max={s.max}
                  color={s.good ? (s.value > s.max * 0.5 ? theme.good : theme.accent) : theme.warn}
                />
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionTitle title="Specs" icon="shield" />
          <Card padded={false} style={{ padding: 4 }}>
            {[
              [t('price_in'), fmtMoney(model.priceIn)],
              [t('price_out'), fmtMoney(model.priceOut)],
              [t('context'), model.context ?? '—'],
              ['Cost / task (P50)', fmtMoney(model.costPerTask)],
              [t('license'), model.license],
              ['Agent sessions', model.sessions ? fmtCompact(model.sessions) : '—'],
            ].map(([k, v], i) => (
              <View
                key={k as string}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  borderTopWidth: i ? StyleSheet.hairlineWidth * 2 : 0,
                  borderTopColor: theme.strokeSoft,
                }}
              >
                <Txt size={13} dim style={{ flex: 1 }}>
                  {k}
                </Txt>
                <Txt size={13} weight="700" mono>
                  {v}
                </Txt>
              </View>
            ))}
          </Card>
        </View>

        {mySessions.length > 0 ? (
          <Card tone="alt" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="terminal" size={18} color={theme.lime} />
            <View style={{ flex: 1 }}>
              <Txt size={13} weight="700">
                {t('agent_sessions')}
              </Txt>
              <Txt size={11.5} faint>
                {myConfirmed}/{mySessions.length} {t('agent_confirmed').toLowerCase()}
              </Txt>
            </View>
            <Txt size={19} weight="800" mono color={theme.lime}>
              {mySessions.length}
            </Txt>
          </Card>
        ) : null}

        {personal ? (
          <Card tone="alt" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="user" size={18} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Txt size={13} weight="700">
                {t('your_ranking')}
              </Txt>
              <Txt size={11.5} faint>
                {personal.battles} {t('battles_played').toLowerCase()}
              </Txt>
            </View>
            <Txt size={19} weight="800" mono color={theme.accent}>
              {personal.rating}
            </Txt>
          </Card>
        ) : null}

        <View style={{ gap: 9 }}>
          <Tap onPress={startChat}>
            <View
              style={{
                backgroundColor: theme.accent,
                borderRadius: radius.md,
                paddingVertical: 14,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Icon name="message" size={17} color="#fff" />
              <Txt size={15} weight="800" color="#fff">
                {t('chat_with')}
              </Txt>
            </View>
          </Tap>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Tap style={{ flex: 1 }} onPress={() => router.push(`/battle?model=${model.id}`)}>
              <View
                style={{
                  backgroundColor: theme.chip,
                  borderRadius: radius.md,
                  paddingVertical: 13,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Icon name="swords" size={16} color={theme.textDim} />
                <Txt size={13.5} weight="700" dim>
                  {t('battle_this')}
                </Txt>
              </View>
            </Tap>
            <Tap style={{ flex: 1 }} onPress={() => router.push(`/compare?a=${model.id}`)}>
              <View
                style={{
                  backgroundColor: theme.chip,
                  borderRadius: radius.md,
                  paddingVertical: 13,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Icon name="scale" size={16} color={theme.textDim} />
                <Txt size={13.5} weight="700" dim>
                  {t('compare')}
                </Txt>
              </View>
            </Tap>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
