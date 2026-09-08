import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { Icon } from '../../src/components/Icon';
import { Markdown } from '../../src/components/Markdown';
import { ModelPicker } from '../../src/components/ModelPicker';
import { Badge, Card, LabAvatar, Tap, Txt } from '../../src/components/ui';
import { byId } from '../../src/data/models';
import { stream, synthesize } from '../../src/lib/responder';
import { uid, useApp, type Chat, type Msg } from '../../src/store/app';
import { radius } from '../../src/theme';

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, t, state, upsertChat, buzz } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const cancels = useRef<(() => void)[]>([]);

  const chat = state.chats.find((c) => c.id === id);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState<false | 'primary' | 'secondary'>(false);
  const [copied, setCopied] = useState<string | null>(null);

  const model = byId(chat?.modelId ?? '') ?? byId('claude-fable-5')!;
  const second = chat?.secondaryModelId ? byId(chat.secondaryModelId) : undefined;

  const answer = useCallback(
    (currentChat: Chat, prompt: string) => {
      setBusy(true);
      const targets = [byId(currentChat.modelId)!, currentChat.secondaryModelId ? byId(currentChat.secondaryModelId)! : null].filter(
        Boolean,
      ) as NonNullable<ReturnType<typeof byId>>[];

      const placeholders: Msg[] = targets.map((m) => ({
        id: uid(),
        role: 'assistant',
        text: '',
        modelId: m.id,
        ts: Date.now(),
        streaming: true,
      }));

      let working: Chat = {
        ...currentChat,
        messages: [...currentChat.messages, ...placeholders],
        updatedAt: Date.now(),
      };
      upsertChat(working);

      let done = 0;
      targets.forEach((m, i) => {
        const full = synthesize(prompt, m, currentChat.messages.length);
        const cancel = stream(
          full,
          (soFar) => {
            working = {
              ...working,
              messages: working.messages.map((msg) =>
                msg.id === placeholders[i].id ? { ...msg, text: soFar } : msg,
              ),
              updatedAt: Date.now(),
            };
            upsertChat(working);
          },
          {
            speed: 0.6 + m.speed,
            onDone: () => {
              working = {
                ...working,
                messages: working.messages.map((msg) =>
                  msg.id === placeholders[i].id ? { ...msg, streaming: false } : msg,
                ),
              };
              upsertChat(working);
              done += 1;
              if (done === targets.length) {
                setBusy(false);
                buzz('success');
              }
            },
          },
        );
        cancels.current.push(cancel);
      });
    },
    [upsertChat, buzz],
  );

  // kick off the first answer when the chat only has the opening user message
  useEffect(() => {
    if (!chat) return;
    if (chat.messages.length === 1 && chat.messages[0].role === 'user') {
      answer(chat, chat.messages[0].text);
    }
    return () => {
      cancels.current.forEach((c) => c());
      cancels.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id]);

  if (!chat) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Txt dim>Chat not found</Txt>
      </View>
    );
  }

  const send = () => {
    const clean = draft.trim();
    if (!clean || busy) return;
    buzz('medium');
    const withUser: Chat = {
      ...chat,
      messages: [...chat.messages, { id: uid(), role: 'user', text: clean, ts: Date.now() }],
      updatedAt: Date.now(),
    };
    upsertChat(withUser);
    setDraft('');
    answer(withUser, clean);
  };

  const stop = () => {
    cancels.current.forEach((c) => c());
    cancels.current = [];
    upsertChat({ ...chat, messages: chat.messages.map((m) => ({ ...m, streaming: false })) });
    setBusy(false);
  };

  const regenerate = () => {
    const lastUser = [...chat.messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const trimmed: Chat = {
      ...chat,
      messages: chat.messages.slice(0, chat.messages.findIndex((m) => m.id === lastUser.id) + 1),
    };
    upsertChat(trimmed);
    answer(trimmed, lastUser.text);
  };

  const copy = async (msg: Msg) => {
    await Clipboard.setStringAsync(msg.text);
    setCopied(msg.id);
    buzz('success');
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
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
        <Tap onPress={() => setPicker('primary')} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <LabAvatar lab={model.lab} size={30} />
            <View style={{ flex: 1 }}>
              <Txt size={14.5} weight="700" numberOfLines={1}>
                {model.name}
                {second ? ` + ${second.name}` : ''}
              </Txt>
              <Txt size={11} faint numberOfLines={1}>
                {chat.title}
              </Txt>
            </View>
            <Icon name="chevron-down" size={15} color={theme.textFaint} />
          </View>
        </Tap>
        <Tap onPress={regenerate} disabled={busy}>
          <View style={{ padding: 7, borderRadius: 999, backgroundColor: theme.chip }}>
            <Icon name="refresh" size={16} color={theme.textDim} />
          </View>
        </Tap>
      </View>

      <ScrollView
        ref={scroller}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 14, paddingBottom: 24, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {chat.messages.map((m) => {
          if (m.role === 'user') {
            return (
              <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '86%' }}>
                <View
                  style={{
                    backgroundColor: theme.accent,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: radius.lg,
                    borderBottomRightRadius: 6,
                  }}
                >
                  <Txt color="#fff" size={15} style={{ lineHeight: 21 }}>
                    {m.text}
                  </Txt>
                </View>
              </View>
            );
          }
          const mm = byId(m.modelId ?? '');
          const isSecond = second && m.modelId === second.id;
          return (
            <Card
              key={m.id}
              style={{
                borderColor: isSecond ? `${theme.b}55` : theme.stroke,
                borderLeftWidth: second ? 3 : StyleSheet.hairlineWidth * 2,
                borderLeftColor: second ? (isSecond ? theme.b : theme.a) : theme.stroke,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {mm && <LabAvatar lab={mm.lab} size={24} />}
                <Txt size={12.5} weight="700" dim style={{ flex: 1 }}>
                  {mm?.name}
                </Txt>
                {m.streaming ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color={theme.textFaint} />
                    <Txt size={11} faint>
                      {t('thinking')}
                    </Txt>
                  </View>
                ) : (
                  <Tap onPress={() => copy(m)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name={copied === m.id ? 'check' : 'copy'} size={14} color={copied === m.id ? theme.good : theme.textFaint} />
                      <Txt size={11} faint>
                        {copied === m.id ? t('copied') : t('copy')}
                      </Txt>
                    </View>
                  </Tap>
                )}
              </View>
              {m.text ? <Markdown text={m.text} /> : <Txt faint size={13}>…</Txt>}
            </Card>
          );
        })}

        {second && (
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 4 }}>
            <Badge text={`A · ${model.name}`} color={theme.a} bg={`${theme.a}1A`} />
            <Badge text={`B · ${second.name}`} color={theme.b} bg={`${theme.b}1A`} />
          </View>
        )}
      </ScrollView>

      {/* composer */}
      <View
        style={{
          padding: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderTopColor: theme.stroke,
          backgroundColor: theme.bgElevated,
          flexDirection: 'row',
          alignItems: 'flex-end',
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
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('ask_anything')}
            placeholderTextColor={theme.textFaint}
            multiline
            style={{ color: theme.text, fontSize: 15, maxHeight: 110, outlineStyle: 'none' } as any}
          />
        </View>
        <Pressable
          onPress={busy ? stop : send}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: busy ? theme.chip : draft.trim() ? theme.accent : theme.chip,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={busy ? 'x' : 'arrow-up'}
            size={20}
            color={busy ? theme.textDim : draft.trim() ? '#fff' : theme.textFaint}
            strokeWidth={2.3}
          />
        </Pressable>
      </View>

      <ModelPicker
        visible={picker !== false}
        onClose={() => setPicker(false)}
        selectedId={picker === 'secondary' ? chat.secondaryModelId : chat.modelId}
        onPick={(m) =>
          upsertChat(
            picker === 'secondary' ? { ...chat, secondaryModelId: m.id } : { ...chat, modelId: m.id },
          )
        }
      />
    </KeyboardAvoidingView>
  );
}
