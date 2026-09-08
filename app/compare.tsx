import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../src/components/Icon';
import { ModelPicker } from '../src/components/ModelPicker';
import { Badge, Card, LabAvatar, Radar, SectionTitle, Tap, Txt } from '../src/components/ui';
import { byId, type Model } from '../src/data/models';
import { fmtMoney } from '../src/lib/format';
import { useApp } from '../src/store/app';
import { radius } from '../src/theme';

const AXES = ['Quality', 'Agentic', 'Speed', 'Value', 'Reliability'];

function axisValues(m: Model): number[] {
  return [
    Math.max(0.05, Math.min(1, (m.elo - 1390) / 130)),
    Math.max(0.05, Math.min(1, ((m.agentNet ?? -6) + 8) / 26)),
    m.speed,
    Math.max(0.05, Math.min(1, 1 - Math.log10((m.priceIn ?? 3) * 10 + 1) / 2.2)),
    Math.max(0.05, Math.min(1, 1 - (m.hallucination ?? 1) / 6)),
  ];
}

export default function Compare() {
  const { theme, t, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ a?: string; b?: string }>();

  const [a, setA] = useState<Model>(byId(params.a ?? 'claude-fable-5') ?? byId('claude-fable-5')!);
  const [b, setB] = useState<Model>(byId(params.b ?? 'gpt-5-6-sol-xhigh') ?? byId('gpt-5-6-sol-xhigh')!);
  const [picker, setPicker] = useState<false | 'a' | 'b'>(false);
  const [reqs, setReqs] = useState(120);

  const monthly = (m: Model) => {
    const inTok = 2200;
    const outTok = 900;
    const cost =
      ((m.priceIn ?? 2) * inTok + (m.priceOut ?? 8) * outTok) / 1_000_000;
    return cost * reqs * 30;
  };

  const rows = useMemo(
    () => [
      { label: 'Arena Elo', a: a.elo, b: b.elo, better: 'high' as const, fmt: (v: number) => `${v}` },
      {
        label: 'Agent net',
        a: a.agentNet ?? 0,
        b: b.agentNet ?? 0,
        better: 'high' as const,
        fmt: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`,
      },
      { label: t('price_in'), a: a.priceIn ?? 0, b: b.priceIn ?? 0, better: 'low' as const, fmt: fmtMoney },
      { label: t('price_out'), a: a.priceOut ?? 0, b: b.priceOut ?? 0, better: 'low' as const, fmt: fmtMoney },
      {
        label: 'Speed',
        a: a.speed * 100,
        b: b.speed * 100,
        better: 'high' as const,
        fmt: (v: number) => `${Math.round(v)}`,
      },
      {
        label: 'Hallucination',
        a: a.hallucination ?? 0,
        b: b.hallucination ?? 0,
        better: 'low' as const,
        fmt: (v: number) => `${v.toFixed(2)}%`,
      },
      {
        label: `Cost ${t('per_month')}`,
        a: monthly(a),
        b: monthly(b),
        better: 'low' as const,
        fmt: (v: number) => `$${v.toFixed(0)}`,
      },
    ],
    [a, b, reqs, t],
  );

  const wins = rows.reduce(
    (acc, r) => {
      const aWins = r.better === 'high' ? r.a > r.b : r.a < r.b;
      if (r.a === r.b) return acc;
      return aWins ? { ...acc, a: acc.a + 1 } : { ...acc, b: acc.b + 1 };
    },
    { a: 0, b: 0 },
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Icon name="scale" size={20} color={theme.accent} />
        <Txt size={20} weight="800" style={{ flex: 1 }}>
          {t('compare')}
        </Txt>
        <Tap onPress={() => router.back()}>
          <View style={{ padding: 7, borderRadius: 999, backgroundColor: theme.chip }}>
            <Icon name="x" size={16} color={theme.textDim} />
          </View>
        </Tap>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: insets.bottom + 30, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { m: a, side: 'a' as const, color: theme.a, w: wins.a },
            { m: b, side: 'b' as const, color: theme.b, w: wins.b },
          ].map(({ m, side, color, w }) => (
            <Tap key={side} style={{ flex: 1 }} onPress={() => setPicker(side)}>
              <Card style={{ gap: 8, borderColor: `${color}55` }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <LabAvatar lab={m.lab} size={28} />
                  <Badge text={side.toUpperCase()} color={color} bg={`${color}1A`} />
                </View>
                <Txt size={14} weight="700" numberOfLines={2}>
                  {m.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Txt size={11.5} faint style={{ flex: 1 }}>
                    {m.lab}
                  </Txt>
                  <Txt size={12} weight="800" color={color} mono>
                    {w}
                  </Txt>
                  <Icon name="chevron-down" size={13} color={theme.textFaint} />
                </View>
              </Card>
            </Tap>
          ))}
        </View>

        <Card style={{ alignItems: 'center', gap: 10 }}>
          <Radar
            size={250}
            labels={AXES}
            series={[
              { color: theme.a, values: axisValues(a) },
              { color: theme.b, values: axisValues(b) },
            ]}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {AXES.map((label, i) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.textFaint }} />
                <Txt size={11} faint>
                  {label}
                </Txt>
              </View>
            ))}
          </View>
        </Card>

        <View>
          <SectionTitle title="Head to head" icon="chart" />
          <Card padded={false} style={{ padding: 4 }}>
            {rows.map((r, i) => {
              const aWins = r.a !== r.b && (r.better === 'high' ? r.a > r.b : r.a < r.b);
              const bWins = r.a !== r.b && !aWins;
              return (
                <View
                  key={r.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    borderTopWidth: i ? StyleSheet.hairlineWidth * 2 : 0,
                    borderTopColor: theme.strokeSoft,
                  }}
                >
                  <Txt size={13} weight={aWins ? '800' : '500'} color={aWins ? theme.a : theme.textDim} mono style={{ width: 76 }}>
                    {r.fmt(r.a)}
                  </Txt>
                  <Txt size={12} faint style={{ flex: 1, textAlign: 'center' }}>
                    {r.label}
                  </Txt>
                  <Txt
                    size={13}
                    weight={bWins ? '800' : '500'}
                    color={bWins ? theme.b : theme.textDim}
                    mono
                    style={{ width: 76, textAlign: 'right' }}
                  >
                    {r.fmt(r.b)}
                  </Txt>
                </View>
              );
            })}
          </Card>
        </View>

        <View>
          <SectionTitle title={t('cost_calculator')} icon="bolt" />
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Txt size={13} dim style={{ flex: 1 }}>
                {t('requests_per_day')}
              </Txt>
              <Txt size={15} weight="800" mono>
                {reqs}
              </Txt>
            </View>
            <Slider
              value={reqs}
              min={10}
              max={2000}
              onChange={(v) => {
                if (Math.abs(v - reqs) > 25) buzz('light');
                setReqs(Math.round(v / 10) * 10);
              }}
            />
            <Txt size={11} faint>
              Assumes 2.2K input + 0.9K output tokens per request, 30 days.
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { m: a, color: theme.a },
                { m: b, color: theme.b },
              ].map(({ m, color }) => (
                <View
                  key={m.id}
                  style={{
                    flex: 1,
                    backgroundColor: `${color}12`,
                    borderRadius: radius.md,
                    padding: 12,
                    borderWidth: StyleSheet.hairlineWidth * 2,
                    borderColor: `${color}44`,
                  }}
                >
                  <Txt size={11.5} faint numberOfLines={1}>
                    {m.name}
                  </Txt>
                  <Txt size={22} weight="800" mono color={color}>
                    ${monthly(m).toFixed(0)}
                  </Txt>
                  <Txt size={10.5} faint>
                    {t('per_month')}
                  </Txt>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>

      <ModelPicker
        visible={picker !== false}
        onClose={() => setPicker(false)}
        selectedId={picker === 'a' ? a.id : b.id}
        exclude={picker === 'a' ? [b.id] : [a.id]}
        onPick={(m) => (picker === 'a' ? setA(m) : setB(m))}
      />
    </View>
  );
}

function Slider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { theme } = useApp();
  const [width, setWidth] = useState(1);
  const widthRef = useRef(1);
  const valueRef = useRef(value);
  valueRef.current = value;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        onChange(min + (Math.max(0, Math.min(widthRef.current, x)) / widthRef.current) * (max - min));
      },
      onPanResponderMove: (_, g) => {
        const pct = Math.max(0, Math.min(1, (valueRef.current - min) / (max - min) + g.dx / widthRef.current / 60));
        onChange(min + pct * (max - min));
      },
    }),
  ).current;

  const pct = (value - min) / (max - min);
  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        widthRef.current = e.nativeEvent.layout.width;
      }}
      style={{ height: 32, justifyContent: 'center' }}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.surfaceAlt }}>
        <View style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: theme.accent }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: Math.max(0, pct * width - 11),
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: theme.bgElevated,
          borderWidth: 2,
          borderColor: theme.accent,
        }}
      />
    </View>
  );
}
