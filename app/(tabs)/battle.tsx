import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon } from '../../src/components/Icon';
import { Markdown } from '../../src/components/Markdown';
import { Badge, Card, LabAvatar, Tap, Txt } from '../../src/components/ui';
import { BATTLE_PROMPTS } from '../../src/data/prompts';
import { MODELS, byId, type Model } from '../../src/data/models';
import { stream, synthesize } from '../../src/lib/responder';
import { expected } from '../../src/lib/elo';
import { uid, useApp } from '../../src/store/app';
import { radius } from '../../src/theme';

type Phase = 'idle' | 'answering' | 'voting' | 'revealed';
type Side = 'a' | 'b';
type Result = 'a' | 'b' | 'tie' | 'bad';

function pickPair(seedId?: string): [Model, Model] {
  const pool = MODELS.filter((m) => m.modalities.includes('text'));
  const a = seedId ? byId(seedId) ?? pool[0] : pool[Math.floor(Math.random() * pool.length)];
  let b = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while ((b.id === a.id || Math.abs(b.elo - a.elo) > 45) && guard++ < 40) {
    b = pool[Math.floor(Math.random() * pool.length)];
  }
  return Math.random() > 0.5 ? [a, b] : [b, a];
}

export default function Battle() {
  const { theme, t, state, addVote, buzz, personalRanking } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ model?: string }>();

  const [pair, setPair] = useState<[Model, Model]>(() => pickPair(params.model));
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [texts, setTexts] = useState<[string, string]>(['', '']);
  const [result, setResult] = useState<Result | null>(null);
  const [activePrompt, setActivePrompt] = useState('');
  const cancels = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (params.model) {
      setPair(pickPair(params.model));
      setPhase('idle');
    }
  }, [params.model]);

  useEffect(() => () => cancels.current.forEach((c) => c()), []);

  const start = useCallback(
    (raw?: string) => {
      const p = (raw ?? prompt).trim() || BATTLE_PROMPTS[Math.floor(Math.random() * BATTLE_PROMPTS.length)];
      cancels.current.forEach((c) => c());
      cancels.current = [];
      const nextPair = pickPair(params.model);
      setPair(nextPair);
      setActivePrompt(p);
      setTexts(['', '']);
      setResult(null);
      setPhase('answering');
      buzz('medium');

      let done = 0;
      nextPair.forEach((m, i) => {
        const full = synthesize(p, m, i);
        const cancel = stream(
          full,
          (soFar) => setTexts((prev) => (i === 0 ? [soFar, prev[1]] : [prev[0], soFar])),
          {
            speed: 0.8 + m.speed * 1.4,
            onDone: () => {
              done += 1;
              if (done === 2) {
                setPhase('voting');
                buzz('light');
              }
            },
          },
        );
        cancels.current.push(cancel);
      });
    },
    [prompt, buzz, params.model],
  );

  const vote = (r: Result) => {
    if (phase !== 'voting') return;
    buzz('success');
    setResult(r);
    setPhase('revealed');
    addVote({
      id: uid(),
      prompt: activePrompt,
      aId: pair[0].id,
      bId: pair[1].id,
      result: r,
      ts: Date.now(),
    });
  };

  const crowdOdds = useMemo(() => {
    const e = expected(pair[0].elo, pair[1].elo);
    return Math.round(e * 100);
  }, [pair]);

  const battles = state.votes.length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Txt size={24} weight="800">
              {t('battle_title')}
            </Txt>
            <Txt size={13} faint style={{ marginTop: 2 }}>
              {t('battle_sub')}
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt size={20} weight="800" color={theme.accent} mono>
              {battles}
            </Txt>
            <Txt size={10.5} faint>
              {t('battles_played')}
            </Txt>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* prompt bar */}
        <Card style={{ padding: 12 }}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder={t('battle_prompt_ph')}
            placeholderTextColor={theme.textFaint}
            multiline
            style={{ color: theme.text, fontSize: 15, minHeight: 44, outlineStyle: 'none' } as any}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Tap onPress={() => start()} style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: theme.accent,
                  borderRadius: radius.pill,
                  paddingVertical: 11,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                <Icon name="swords" size={16} color="#fff" />
                <Txt size={14} weight="800" color="#fff">
                  {t('battle_start')}
                </Txt>
              </View>
            </Tap>
            <Tap
              onPress={() => {
                const p = BATTLE_PROMPTS[Math.floor(Math.random() * BATTLE_PROMPTS.length)];
                setPrompt(p);
                start(p);
              }}
            >
              <View
                style={{
                  backgroundColor: theme.chip,
                  borderRadius: radius.pill,
                  paddingVertical: 11,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon name="sparkles" size={15} color={theme.textDim} />
                <Txt size={13} weight="700" dim>
                  {t('battle_random')}
                </Txt>
              </View>
            </Tap>
          </View>
        </Card>

        {phase === 'idle' ? (
          <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 34, gap: 10 }}>
            <Icon name="swords" size={30} color={theme.textFaint} />
            <Txt size={14} dim style={{ textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 }}>
              {t('swipe_hint')}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
              {BATTLE_PROMPTS.slice(0, 3).map((p) => (
                <Tap key={p} onPress={() => start(p)}>
                  <View
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: radius.pill,
                      backgroundColor: theme.surface,
                      borderWidth: StyleSheet.hairlineWidth * 2,
                      borderColor: theme.stroke,
                      maxWidth: 260,
                    }}
                  >
                    <Txt size={11.5} dim numberOfLines={1}>
                      {p}
                    </Txt>
                  </View>
                </Tap>
              ))}
            </View>
          </Card>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="message" size={14} color={theme.textFaint} />
              <Txt size={12.5} dim style={{ flex: 1 }} numberOfLines={2}>
                {activePrompt}
              </Txt>
            </View>

            {(['a', 'b'] as Side[]).map((side, i) => (
              <SwipeCard
                key={`${activePrompt}-${side}-${pair[i].id}`}
                side={side}
                enabled={phase === 'voting'}
                onDecide={(winner) => vote(winner)}
              >
                <Card
                  style={{
                    borderColor:
                      phase === 'revealed' && result === side
                        ? theme.good
                        : side === 'a'
                        ? `${theme.a}44`
                        : `${theme.b}44`,
                    borderWidth: phase === 'revealed' && result === side ? 2 : StyleSheet.hairlineWidth * 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 9,
                        backgroundColor: side === 'a' ? `${theme.a}22` : `${theme.b}22`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Txt size={12} weight="800" color={side === 'a' ? theme.a : theme.b}>
                        {side.toUpperCase()}
                      </Txt>
                    </View>
                    <Txt size={13} weight="700" dim style={{ flex: 1 }}>
                      {phase === 'revealed' ? pair[i].name : side === 'a' ? t('model_a') : t('model_b')}
                    </Txt>
                    {phase === 'revealed' && <LabAvatar lab={pair[i].lab} size={24} />}
                    {phase === 'revealed' && result === side && (
                      <Badge text="WINNER" color={theme.good} bg={`${theme.good}1F`} />
                    )}
                  </View>
                  {texts[i] ? <Markdown text={texts[i]} size={14.5} /> : <Txt faint size={13}>{t('thinking')}</Txt>}
                </Card>
              </SwipeCard>
            ))}

            {phase === 'voting' && (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <VoteButton label={t('vote_a')} color={theme.a} onPress={() => vote('a')} />
                  <VoteButton label={t('vote_b')} color={theme.b} onPress={() => vote('b')} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <VoteButton label={t('vote_tie')} ghost onPress={() => vote('tie')} />
                  <VoteButton label={t('vote_bad')} ghost onPress={() => vote('bad')} />
                </View>
              </View>
            )}

            {phase === 'revealed' && (
              <Card tone="alt" style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="trophy" size={16} color={theme.accent} />
                  <Txt size={14} weight="800" style={{ flex: 1 }}>
                    {t('revealed')}
                  </Txt>
                  <Badge
                    text={`${crowdOdds}% crowd → A`}
                    color={theme.textDim}
                    bg={theme.chip}
                  />
                </View>
                {pair.map((m, i) => (
                  <Tap key={m.id} onPress={() => router.push(`/model/${m.id}`)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <LabAvatar lab={m.lab} size={30} />
                      <View style={{ flex: 1 }}>
                        <Txt size={13.5} weight="700">
                          {i === 0 ? 'A · ' : 'B · '}
                          {m.name}
                        </Txt>
                        <Txt size={11} faint>
                          {m.lab} · Elo {m.elo} · {m.license}
                        </Txt>
                      </View>
                      <Txt size={12} weight="800" color={theme.accent} mono>
                        {personalRanking.find((p) => p.id === m.id)?.rating ?? '—'}
                      </Txt>
                      <Icon name="chevron-right" size={15} color={theme.textFaint} />
                    </View>
                  </Tap>
                ))}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Tap
                    onPress={() =>
                      Share.share({
                        message: `I judged a blind AI battle on Arena: ${
                          result === 'tie' ? 'a tie between' : result === 'bad' ? 'both flopped —' : 'winner is'
                        } ${result === 'b' ? pair[1].name : pair[0].name}${
                          result === 'a' || result === 'b' ? ` over ${result === 'a' ? pair[1].name : pair[0].name}` : ''
                        }. Prompt: “${activePrompt}”`,
                      }).catch(() => {})
                    }
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 11,
                        borderRadius: radius.pill,
                        backgroundColor: theme.chip,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      <Icon name="share" size={15} color={theme.textDim} />
                      <Txt size={13} weight="700" dim>
                        {t('share_card')}
                      </Txt>
                    </View>
                  </Tap>
                <Tap style={{ flex: 1 }} onPress={() => start(BATTLE_PROMPTS[Math.floor(Math.random() * BATTLE_PROMPTS.length)])}>
                  <View
                    style={{
                      backgroundColor: theme.accent,
                      borderRadius: radius.pill,
                      paddingVertical: 11,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    <Icon name="refresh" size={15} color="#fff" />
                    <Txt size={14} weight="800" color="#fff">
                      {t('next_battle')}
                    </Txt>
                  </View>
                </Tap>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function VoteButton({
  label,
  color,
  ghost,
  onPress,
}: {
  label: string;
  color?: string;
  ghost?: boolean;
  onPress: () => void;
}) {
  const { theme } = useApp();
  return (
    <Tap onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          paddingVertical: 12,
          borderRadius: radius.md,
          alignItems: 'center',
          backgroundColor: ghost ? theme.chip : `${color}1F`,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: ghost ? theme.stroke : `${color}66`,
        }}
      >
        <Txt size={13.5} weight="800" color={ghost ? theme.textDim : color}>
          {label}
        </Txt>
      </View>
    </Tap>
  );
}

/** Swipe right = this side wins, swipe left = the other side wins. */
function SwipeCard({
  children,
  side,
  enabled,
  onDecide,
}: {
  children: React.ReactNode;
  side: Side;
  enabled: boolean;
  onDecide: (winner: Side) => void;
}) {
  const { theme, buzz } = useApp();
  const x = useRef(new Animated.Value(0)).current;
  const [hint, setHint] = useState<'win' | 'lose' | null>(null);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => enabled && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          x.setValue(g.dx);
          setHint(g.dx > 40 ? 'win' : g.dx < -40 ? 'lose' : null);
        },
        onPanResponderRelease: (_, g) => {
          const other: Side = side === 'a' ? 'b' : 'a';
          if (g.dx > 90) {
            buzz('success');
            Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }).start();
            onDecide(side);
          } else if (g.dx < -90) {
            buzz('warning');
            Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }).start();
            onDecide(other);
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
          }
          setHint(null);
        },
      }),
    [enabled, side, onDecide, x, buzz],
  );

  const rotate = x.interpolate({ inputRange: [-220, 0, 220], outputRange: ['-4deg', '0deg', '4deg'] });

  return (
    <View>
      <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: x }, { rotate }] }}>
        {children}
      </Animated.View>
      {hint && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 12,
            [hint === 'win' ? 'left' : 'right']: 14,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: hint === 'win' ? `${theme.good}22` : `${theme.bad}22`,
            borderWidth: 1,
            borderColor: hint === 'win' ? theme.good : theme.bad,
          }}
        >
          <Txt size={12} weight="800" color={hint === 'win' ? theme.good : theme.bad}>
            {hint === 'win' ? 'WIN' : 'NOPE'}
          </Txt>
        </View>
      )}
    </View>
  );
}
