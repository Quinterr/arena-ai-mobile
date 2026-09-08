import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '../../src/components/Icon';
import { Badge, Card, Divider, LabAvatar, Meter, SectionTitle, Tap, Txt } from '../../src/components/ui';
import { byId, ranked } from '../../src/data/models';
import { TOOL_LABEL, runSession, type AgentSession, type RunController, type Step, type ToolKind } from '../../src/lib/agent';
import { useApp } from '../../src/store/app';
import { radius } from '../../src/theme';

const TOOL_ICON: Record<ToolKind, IconName> = {
  plan: 'stack',
  search: 'search',
  bash: 'terminal',
  write: 'code',
  read: 'eye',
  image: 'image',
  test: 'shield',
  note: 'sparkles',
  summary: 'check',
};

export default function AgentRun() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, t, state, upsertAgentSession, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const controller = useRef<RunController | null>(null);
  const started = useRef(false);

  const session = state.agentSessions.find((s) => s.id === id);
  const [steer, setSteer] = useState('');
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const model = byId(session?.modelId ?? '');
  const agentRank = model ? ranked('agent').findIndex((m) => m.id === model.id) + 1 : 0;

  // start the run once
  useEffect(() => {
    if (!session || started.current) return;
    if (session.status !== 'running') return;
    started.current = true;
    if (session.steps.some((s) => s.status !== 'pending')) {
      // The app was closed mid-run: the sandbox session is gone, so close it out.
      upsertAgentSession({
        ...session,
        status: 'stopped',
        endedAt: session.endedAt ?? Date.now(),
        steps: session.steps.map((s) => (s.status === 'running' ? { ...s, status: 'done' } : s)),
      });
      return;
    }
    controller.current = runSession(
      session,
      model!,
      (next) => upsertAgentSession(next),
      () => buzz('success'),
    );
    return () => controller.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    if (session?.status !== 'running') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session?.status]);

  if (!session || !model) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt dim>Session not found</Txt>
      </View>
    );
  }

  const doneCount = session.steps.filter((s) => s.status === 'done' || s.status === 'failed').length;
  const elapsed = Math.max(0, ((session.endedAt ?? now) - session.startedAt) / 1000);
  const running = session.status === 'running';

  const sendSteer = () => {
    const clean = steer.trim();
    if (!clean || !controller.current) return;
    controller.current.steer(clean);
    setSteer('');
    buzz('medium');
  };

  const setOutcome = (outcome: AgentSession['outcome']) => {
    buzz('success');
    upsertAgentSession({ ...session, outcome });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* header */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: theme.stroke,
          backgroundColor: theme.bgElevated,
        }}
      >
        <Tap onPress={() => router.back()}>
          <View style={{ padding: 6 }}>
            <Icon name="chevron-left" size={22} color={theme.text} />
          </View>
        </Tap>
        <LabAvatar lab={model.lab} size={30} />
        <View style={{ flex: 1 }}>
          <Txt size={14} weight="700" numberOfLines={1}>
            {model.name}
          </Txt>
          <Txt size={10.5} faint numberOfLines={1}>
            {session.category} · {agentRank > 0 ? `#${agentRank} Agent Arena` : 'Agent Mode'}
          </Txt>
        </View>
        {running ? (
          <Tap
            onPress={() => {
              controller.current?.stop();
              buzz('warning');
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: `${theme.bad}18`,
              }}
            >
              <Icon name="x" size={13} color={theme.bad} />
              <Txt size={12.5} weight="700" color={theme.bad}>
                {t('agent_stop')}
              </Txt>
            </View>
          </Tap>
        ) : (
          <Badge
            text={session.status === 'stopped' ? t('agent_stopped') : t('agent_done')}
            color={theme.textDim}
            bg={theme.chip}
          />
        )}
      </View>

      <ScrollView
        ref={scroller}
        contentContainerStyle={{ padding: 14, paddingBottom: 26, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* task */}
        <Card tone="alt" style={{ gap: 10 }}>
          <Txt size={14.5} style={{ lineHeight: 20 }}>
            {session.task}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {[
              { label: t('agent_elapsed'), value: `${elapsed.toFixed(0)}s` },
              { label: t('agent_steps'), value: `${doneCount}/${session.steps.length}` },
              { label: t('agent_tokens'), value: `${(session.tokens / 1000).toFixed(1)}K` },
              { label: t('agent_cost'), value: `$${session.cost.toFixed(2)}` },
            ].map((s) => (
              <View key={s.label}>
                <Txt size={14} weight="800" mono>
                  {s.value}
                </Txt>
                <Txt size={9.5} faint>
                  {s.label}
                </Txt>
              </View>
            ))}
          </View>
          <Meter value={doneCount} max={session.steps.length} color={running ? theme.accent : theme.good} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={state.user ? 'refresh' : 'wifi-off'} size={11} color={theme.textFaint} />
            <Txt size={10.5} faint>
              {state.user ? `${t('signed_in_as')} ${state.user.name}` : t('offline_copy')}
            </Txt>
          </View>
        </Card>

        {/* plan */}
        <View>
          <SectionTitle title={t('agent_plan')} icon="stack" />
          <Card style={{ gap: 9 }}>
            {session.plan.map((p, i) => {
              const stepDone = doneCount > i + 1;
              return (
                <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: stepDone ? `${theme.good}22` : theme.chip,
                    }}
                  >
                    {stepDone ? (
                      <Icon name="check" size={11} color={theme.good} strokeWidth={3} />
                    ) : (
                      <Txt size={9.5} faint weight="800">
                        {i + 1}
                      </Txt>
                    )}
                  </View>
                  <Txt size={12.5} dim={!stepDone} style={{ flex: 1 }} numberOfLines={2}>
                    {p}
                  </Txt>
                </View>
              );
            })}
          </Card>
        </View>

        {/* timeline */}
        <View>
          <SectionTitle title={t('agent_tools')} icon="terminal" />
          <View style={{ gap: 8 }}>
            {session.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                expanded={open[step.id] ?? step.status !== 'done'}
                onToggle={() => setOpen((o) => ({ ...o, [step.id]: !(o[step.id] ?? step.status !== 'done') }))}
              />
            ))}
          </View>
        </View>

        {/* deliverables + outcome */}
        {!running && (
          <>
            <View>
              <SectionTitle title={t('agent_deliverables')} icon="stack" />
              <Card padded={false} style={{ padding: 4 }}>
                {session.deliverables.map((d, i) => (
                  <View
                    key={d.name}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 11,
                      paddingHorizontal: 12,
                      borderTopWidth: i ? StyleSheet.hairlineWidth * 2 : 0,
                      borderTopColor: theme.strokeSoft,
                    }}
                  >
                    <Icon
                      name={d.kind === 'image' ? 'image' : d.kind === 'report' ? 'message' : 'code'}
                      size={15}
                      color={theme.accent}
                    />
                    <Txt size={13} weight="700" style={{ flex: 1 }}>
                      {d.name}
                    </Txt>
                    <Txt size={11} faint>
                      {d.detail}
                    </Txt>
                  </View>
                ))}
              </Card>
            </View>

            <Card style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="trophy" size={16} color={theme.accent} />
                <Txt size={14} weight="800" style={{ flex: 1 }}>
                  {t('agent_outcome_q')}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(
                  [
                    ['confirmed', t('agent_confirmed'), theme.good],
                    ['partial', t('agent_partial'), theme.warn],
                    ['failed', t('agent_failed'), theme.bad],
                  ] as const
                ).map(([value, label, color]) => {
                  const active = session.outcome === value;
                  return (
                    <Tap key={value} style={{ flex: 1 }} onPress={() => setOutcome(value)}>
                      <View
                        style={{
                          paddingVertical: 11,
                          borderRadius: radius.md,
                          alignItems: 'center',
                          backgroundColor: active ? `${color}22` : theme.chip,
                          borderWidth: StyleSheet.hairlineWidth * 2,
                          borderColor: active ? color : 'transparent',
                        }}
                      >
                        <Txt size={12.5} weight="800" color={active ? color : theme.textDim}>
                          {label}
                        </Txt>
                      </View>
                    </Tap>
                  );
                })}
              </View>
              <Divider />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="pulse" size={13} color={theme.textFaint} />
                <Txt size={11} faint style={{ flex: 1, lineHeight: 16 }}>
                  {t('agent_signal_note')}
                </Txt>
              </View>
              <Tap onPress={() => router.push(`/model/${model.id}`)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: radius.md,
                    backgroundColor: theme.chip,
                  }}
                >
                  <Icon name="trophy" size={15} color={theme.textDim} />
                  <Txt size={13} weight="700" dim>
                    {model.name} · Agent Arena #{agentRank}
                  </Txt>
                </View>
              </Tap>
            </Card>
          </>
        )}
      </ScrollView>

      {/* steer bar */}
      {running && (
        <View
          style={{
            padding: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopWidth: StyleSheet.hairlineWidth * 2,
            borderTopColor: theme.stroke,
            backgroundColor: theme.bgElevated,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.chip,
              borderRadius: radius.lg,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="wand" size={15} color={theme.textFaint} />
            <TextInput
              value={steer}
              onChangeText={setSteer}
              placeholder={t('agent_steer')}
              placeholderTextColor={theme.textFaint}
              onSubmitEditing={sendSteer}
              style={{ flex: 1, color: theme.text, fontSize: 14.5, outlineStyle: 'none' } as any}
            />
          </View>
          <Tap onPress={sendSteer} disabled={!steer.trim()}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: steer.trim() ? theme.accent : theme.chip,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="send" size={18} color={steer.trim() ? '#fff' : theme.textFaint} />
            </View>
          </Tap>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function StepCard({ step, expanded, onToggle }: { step: Step; expanded: boolean; onToggle: () => void }) {
  const { theme } = useApp();
  const color =
    step.status === 'failed' ? theme.bad : step.status === 'running' ? theme.accent : step.status === 'done' ? theme.good : theme.textFaint;

  return (
    <Card
      padded={false}
      style={{
        padding: 12,
        gap: expanded && step.output ? 10 : 0,
        opacity: step.status === 'pending' ? 0.5 : 1,
        borderColor: step.status === 'running' ? `${theme.accent}66` : theme.stroke,
      }}
    >
      <Tap onPress={onToggle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${color}1A`,
            }}
          >
            <Icon name={TOOL_ICON[step.kind]} size={14} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={13.5} weight="700" numberOfLines={1}>
              {step.title}
            </Txt>
            <Txt size={10.5} faint numberOfLines={1} mono>
              {TOOL_LABEL[step.kind]}
              {step.meta ? ` · ${step.meta}` : ''}
            </Txt>
          </View>
          {step.status === 'running' ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : step.status === 'done' ? (
            <Icon name="check" size={15} color={theme.good} strokeWidth={2.6} />
          ) : step.status === 'failed' ? (
            <Icon name="x" size={15} color={theme.bad} strokeWidth={2.6} />
          ) : (
            <Icon name="clock" size={14} color={theme.textFaint} />
          )}
        </View>
      </Tap>

      {expanded && step.output ? (
        <View
          style={{
            backgroundColor: theme.scheme === 'dark' ? '#0B0B10' : '#F5F5F9',
            borderRadius: radius.sm,
            padding: 11,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: theme.strokeSoft,
          }}
        >
          <Txt
            size={11.5}
            mono
            color={step.status === 'failed' ? theme.bad : theme.scheme === 'dark' ? '#B9C4E8' : '#3A3F5C'}
            style={{ lineHeight: 17 }}
          >
            {step.output}
          </Txt>
        </View>
      ) : null}
    </Card>
  );
}
