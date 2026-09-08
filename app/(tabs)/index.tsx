import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ModelPicker } from '../../src/components/ModelPicker';
import { Badge, Card, LabAvatar, SectionTitle, Tap, Txt } from '../../src/components/ui';
import { SUGGESTIONS } from '../../src/data/prompts';
import { byId } from '../../src/data/models';
import { timeAgo } from '../../src/lib/format';
import { titleFor } from '../../src/lib/responder';
import { uid, useApp, type Chat } from '../../src/store/app';
import { radius } from '../../src/theme';

export default function ChatHome() {
  const { theme, t, lang, state, setSettings, upsertChat, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [picker, setPicker] = useState(false);
  const [dual, setDual] = useState(false);

  const model = byId(state.settings.defaultModelId) ?? byId('claude-fable-5')!;
  const rival = useMemo(() => {
    const pool = ['gpt-5-6-sol-xhigh', 'gemini-3-8-flash-high', 'kimi-k3-max', 'glm-5-3-max'].filter(
      (id) => id !== model.id,
    );
    return byId(pool[0])!;
  }, [model.id]);

  const send = (prompt: string) => {
    const clean = prompt.trim();
    if (!clean) return;
    buzz('medium');
    const chat: Chat = {
      id: uid(),
      title: titleFor(clean),
      modelId: model.id,
      secondaryModelId: dual ? rival.id : undefined,
      messages: [{ id: uid(), role: 'user', text: clean, ts: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsertChat(chat);
    setText('');
    router.push(`/chat/${chat.id}`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: theme.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="bolt" size={17} color="#fff" fill="#fff" />
          </View>
          <Txt size={19} weight="800" style={{ flex: 1 }}>
            Arena
          </Txt>
          <Tap onPress={() => router.push('/compare')}>
            <View style={{ padding: 8, borderRadius: 999, backgroundColor: theme.chip }}>
              <Icon name="scale" size={17} color={theme.textDim} />
            </View>
          </Tap>
          <Tap onPress={() => router.push('/you')}>
            <View style={{ padding: 8, borderRadius: 999, backgroundColor: theme.chip }}>
              <Icon name="settings" size={17} color={theme.textDim} />
            </View>
          </Tap>
        </View>

        {/* hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 26, paddingBottom: 18 }}>
          <Txt size={34} weight="800" style={{ lineHeight: 38 }}>
            {t('hero_title')}
          </Txt>
          <Txt size={14.5} dim style={{ marginTop: 8, lineHeight: 20 }}>
            {t('hero_sub')}
          </Txt>
        </View>

        {/* composer */}
        <View style={{ paddingHorizontal: 16 }}>
          <Card style={{ padding: 12, borderColor: theme.stroke }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('ask_anything')}
              placeholderTextColor={theme.textFaint}
              multiline
              style={
                {
                  color: theme.text,
                  fontSize: 16,
                  minHeight: 62,
                  maxHeight: 160,
                  textAlignVertical: 'top',
                  outlineStyle: 'none',
                } as any
              }
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
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
                  <Txt size={12.5} weight="700" numberOfLines={1} style={{ maxWidth: 132 }}>
                    {model.name}
                  </Txt>
                  <Icon name="chevron-down" size={13} color={theme.textFaint} />
                </View>
              </Tap>

              <Tap
                onPress={() => {
                  buzz('light');
                  setDual((d) => !d);
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: radius.pill,
                    backgroundColor: dual ? theme.accentSoft : theme.chip,
                    borderWidth: StyleSheet.hairlineWidth * 2,
                    borderColor: dual ? theme.accent : 'transparent',
                  }}
                >
                  <Icon name="swords" size={14} color={dual ? theme.accent : theme.textFaint} />
                  <Txt size={12.5} weight="700" color={dual ? theme.accent : theme.textFaint}>
                    {t('dual_mode')}
                  </Txt>
                </View>
              </Tap>

              <View style={{ flex: 1 }} />

              <Tap onPress={() => send(text)} disabled={!text.trim()}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: text.trim() ? theme.accent : theme.chip,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="arrow-up" size={19} color={text.trim() ? '#fff' : theme.textFaint} strokeWidth={2.4} />
                </View>
              </Tap>
            </View>
            {dual && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <Icon name="sparkles" size={13} color={theme.textFaint} />
                <Txt size={11.5} faint style={{ flex: 1 }}>
                  {t('dual_hint')} — {model.name} vs {rival.name}
                </Txt>
              </View>
            )}
          </Card>
        </View>

        {/* suggestions */}
        <View style={{ marginTop: 26, paddingHorizontal: 16 }}>
          <SectionTitle title={t('suggestions')} icon="sparkles" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {SUGGESTIONS.map((s) => (
            <Tap key={s.id} onPress={() => send(s.prompt)}>
              <Card style={{ width: 168, height: 132, justifyContent: 'space-between' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: theme.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={s.icon as any} size={17} color={theme.accent} />
                </View>
                <View>
                  <Txt size={14} weight="700">
                    {lang === 'ru' ? s.titleRu : s.titleEn}
                  </Txt>
                  <Txt size={11.5} faint style={{ marginTop: 3, lineHeight: 15 }} numberOfLines={2}>
                    {lang === 'ru' ? s.subRu : s.subEn}
                  </Txt>
                </View>
              </Card>
            </Tap>
          ))}
        </ScrollView>

        {/* recent chats */}
        <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
          <SectionTitle title={t('recent_chats')} icon="clock" />
          {state.chats.length === 0 ? (
            <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 26 }}>
              <Icon name="message" size={22} color={theme.textFaint} />
              <Txt size={13} faint style={{ marginTop: 8 }}>
                {t('no_chats')}
              </Txt>
            </Card>
          ) : (
            <View style={{ gap: 8 }}>
              {state.chats.slice(0, 6).map((c) => {
                const m = byId(c.modelId);
                return (
                  <Tap key={c.id} onPress={() => router.push(`/chat/${c.id}`)}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
                      {m && <LabAvatar lab={m.lab} size={32} />}
                      <View style={{ flex: 1 }}>
                        <Txt size={14} weight="700" numberOfLines={1}>
                          {c.title}
                        </Txt>
                        <Txt size={11.5} faint numberOfLines={1}>
                          {m?.name} · {c.messages.length} · {timeAgo(c.updatedAt, lang)}
                        </Txt>
                      </View>
                      {c.secondaryModelId ? <Badge text="DUAL" color={theme.accent} bg={theme.accentSoft} /> : null}
                      <Icon name="chevron-right" size={16} color={theme.textFaint} />
                    </Card>
                  </Tap>
                );
              })}
            </View>
          )}
        </View>

        <Txt size={11} faint style={{ paddingHorizontal: 16, marginTop: 22, lineHeight: 16 }}>
          {t('disclaimer')}
        </Txt>
      </ScrollView>

      <ModelPicker
        visible={picker}
        onClose={() => setPicker(false)}
        selectedId={model.id}
        onPick={(m) => setSettings({ defaultModelId: m.id })}
      />
    </KeyboardAvoidingView>
  );
}
