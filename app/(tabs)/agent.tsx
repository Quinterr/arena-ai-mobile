import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ModelPicker } from '../../src/components/ModelPicker';
import { Badge, Card, LabAvatar, SectionTitle, Tap, Txt } from '../../src/components/ui';
import { MODELS, byId, ranked } from '../../src/data/models';
import { AGENT_TASKS, classify, createSession } from '../../src/lib/agent';
import { timeAgo } from '../../src/lib/format';
import { useApp } from '../../src/store/app';
import { radius } from '../../src/theme';

export default function AgentHome() {
  const { theme, t, lang, state, upsertAgentSession, deleteAgentSession, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState('');
  const [picker, setPicker] = useState(false);
  const [modelId, setModelId] = useState(() => ranked('agent')[0]?.id ?? 'claude-fable-5-1-max');

  const model = byId(modelId) ?? MODELS[0];
  const agentRank = useMemo(() => ranked('agent').findIndex((m) => m.id === model.id) + 1, [model.id]);
  const agentModels = useMemo(() => new Set(ranked('agent').map((m) => m.id)), []);

  const run = (raw?: string) => {
    const clean = (raw ?? task).trim();
    if (!clean) return;
    buzz('medium');
    const session = createSession(clean, model);
    upsertAgentSession(session);
    setTask('');
    router.push(`/agent/${session.id}`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 30, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: `${theme.lime}1F`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="terminal" size={17} color={theme.lime} />
            </View>
            <Txt size={24} weight="800" style={{ flex: 1 }}>
              {t('agent_title')}
            </Txt>
            {!state.user && (
              <Tap onPress={() => router.push('/signin')}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: radius.pill,
                    backgroundColor: theme.chip,
                  }}
                >
                  <Txt size={12.5} weight="700" dim>
                    {t('sign_in')}
                  </Txt>
                </View>
              </Tap>
            )}
          </View>
          <Txt size={13} faint style={{ marginTop: 4 }}>
            {t('agent_sub')}
          </Txt>
        </View>

        {/* composer */}
        <Card style={{ padding: 12, gap: 10 }}>
          <TextInput
            value={task}
            onChangeText={setTask}
            placeholder={t('agent_ph')}
            placeholderTextColor={theme.textFaint}
            multiline
            style={
              {
                color: theme.text,
                fontSize: 15.5,
                minHeight: 76,
                maxHeight: 170,
                textAlignVertical: 'top',
                outlineStyle: 'none',
              } as any
            }
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Tap onPress={() => setPicker(true)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  backgroundColor: theme.chip,
                  paddingLeft: 5,
                  paddingRight: 10,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                }}
              >
                <LabAvatar lab={model.lab} size={22} />
                <Txt size={12.5} weight="700" numberOfLines={1} style={{ maxWidth: 128 }}>
                  {model.name}
                </Txt>
                <Icon name="chevron-down" size={13} color={theme.textFaint} />
              </View>
            </Tap>
            {agentRank > 0 && <Badge text={`#${agentRank} AGENT`} color={theme.accent} bg={theme.accentSoft} />}
            <View style={{ flex: 1 }} />
            <Tap onPress={() => run()} disabled={!task.trim()}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 15,
                  height: 40,
                  borderRadius: radius.pill,
                  backgroundColor: task.trim() ? theme.accent : theme.chip,
                }}
              >
                <Icon name="bolt" size={15} color={task.trim() ? '#fff' : theme.textFaint} />
                <Txt size={13.5} weight="800" color={task.trim() ? '#fff' : theme.textFaint}>
                  {t('agent_run')}
                </Txt>
              </View>
            </Tap>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Icon name="stack" size={12} color={theme.textFaint} />
            <Txt size={10.5} faint style={{ flex: 1 }}>
              {t('agent_capabilities')}
            </Txt>
          </View>
        </Card>

        {/* examples */}
        <View>
          <SectionTitle title={t('agent_task_examples')} icon="sparkles" />
          <View style={{ gap: 8 }}>
            {AGENT_TASKS.slice(0, 4).map((example) => {
              const bp = classify(example);
              return (
                <Tap key={example} onPress={() => run(example)}>
                  <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        backgroundColor: theme.accentSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name={
                          bp.category === 'Coding'
                            ? 'code'
                            : bp.category === 'Research'
                            ? 'search'
                            : bp.category === 'Data analysis'
                            ? 'chart'
                            : bp.category === 'Automation'
                            ? 'refresh'
                            : 'layout'
                        }
                        size={15}
                        color={theme.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={13} numberOfLines={2} style={{ lineHeight: 18 }}>
                        {example}
                      </Txt>
                      <Txt size={10.5} faint style={{ marginTop: 3 }}>
                        {bp.category} · {bp.plan.length} steps
                      </Txt>
                    </View>
                    <Icon name="chevron-right" size={15} color={theme.textFaint} />
                  </Card>
                </Tap>
              );
            })}
          </View>
        </View>

        {/* sessions */}
        <View>
          <SectionTitle title={t('agent_sessions')} icon="clock" />
          {state.agentSessions.length === 0 ? (
            <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
              <Icon name="terminal" size={22} color={theme.textFaint} />
              <Txt size={12.5} faint>
                {t('agent_no_sessions')}
              </Txt>
            </Card>
          ) : (
            <View style={{ gap: 8 }}>
              {state.agentSessions.map((s) => {
                const m = byId(s.modelId);
                const done = s.steps.filter((x) => x.status === 'done' || x.status === 'failed').length;
                return (
                  <Tap
                    key={s.id}
                    onPress={() => router.push(`/agent/${s.id}`)}
                    onLongPress={() => deleteAgentSession(s.id)}
                  >
                    <Card style={{ padding: 12, gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {m && <LabAvatar lab={m.lab} size={28} />}
                        <View style={{ flex: 1 }}>
                          <Txt size={13.5} weight="700" numberOfLines={1}>
                            {s.task}
                          </Txt>
                          <Txt size={10.5} faint>
                            {s.category} · {m?.name} · {timeAgo(s.startedAt, lang)}
                          </Txt>
                        </View>
                        {s.outcome ? (
                          <Badge
                            text={s.outcome === 'confirmed' ? 'DONE' : s.outcome === 'partial' ? 'PARTIAL' : 'FAILED'}
                            color={
                              s.outcome === 'confirmed'
                                ? theme.good
                                : s.outcome === 'partial'
                                ? theme.warn
                                : theme.bad
                            }
                            bg={
                              s.outcome === 'confirmed'
                                ? `${theme.good}1A`
                                : s.outcome === 'partial'
                                ? `${theme.warn}1A`
                                : `${theme.bad}1A`
                            }
                          />
                        ) : (
                          <Badge
                            text={s.status === 'running' ? 'RUNNING' : s.status.toUpperCase()}
                            color={s.status === 'running' ? theme.accent : theme.textDim}
                            bg={s.status === 'running' ? theme.accentSoft : theme.chip}
                          />
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Txt size={10.5} faint mono>
                          {done}/{s.steps.length} {t('agent_steps').toLowerCase()}
                        </Txt>
                        <Txt size={10.5} faint mono>
                          {(s.tokens / 1000).toFixed(1)}K {t('agent_tokens').toLowerCase()}
                        </Txt>
                        <Txt size={10.5} faint mono>
                          ${s.cost.toFixed(2)}
                        </Txt>
                        {s.steers.length > 0 && (
                          <Txt size={10.5} faint mono>
                            {s.steers.length} {t('agent_steered')}
                          </Txt>
                        )}
                      </View>
                    </Card>
                  </Tap>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <ModelPicker
        visible={picker}
        onClose={() => setPicker(false)}
        selectedId={model.id}
        title={t('agent_pick')}
        exclude={MODELS.filter((m) => !agentModels.has(m.id)).map((m) => m.id)}
        onPick={(m) => setModelId(m.id)}
      />
    </KeyboardAvoidingView>
  );
}
