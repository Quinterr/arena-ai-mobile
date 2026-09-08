import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { Badge, Card, Divider, LabAvatar, Meter, SectionTitle, Segmented, Tap, Txt } from '../../src/components/ui';
import { byId } from '../../src/data/models';
import { fmtCompact, timeAgo } from '../../src/lib/format';
import { useApp } from '../../src/store/app';
import { radius } from '../../src/theme';
import type { Lang } from '../../src/i18n';

export default function You() {
  const {
    theme,
    t,
    lang,
    state,
    setSettings,
    reset,
    buzz,
    personalRanking,
    agreement,
    deleteChat,
    signOut,
  } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [wiped, setWiped] = useState(false);

  const messages = useMemo(
    () => state.chats.reduce((n, c) => n + c.messages.filter((m) => m.role === 'user').length, 0),
    [state.chats],
  );

  const favouriteLab = useMemo(() => {
    const tally: Record<string, number> = {};
    state.votes.forEach((v) => {
      const winner = v.result === 'a' ? v.aId : v.result === 'b' ? v.bId : null;
      if (!winner) return;
      const lab = byId(winner)?.lab;
      if (lab) tally[lab] = (tally[lab] ?? 0) + 1;
    });
    const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return best?.[0] ?? null;
  }, [state.votes]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return state.chats.slice(0, 8);
    return state.chats.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.messages.some((m) => m.text.toLowerCase().includes(needle)),
    );
  }, [q, state.chats]);

  const topRating = personalRanking[0]?.rating ?? 1200;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 34, gap: 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Txt size={24} weight="800">
        {t('you_title')}
      </Txt>

      {/* account */}
      {state.user ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {state.user.picture ? (
            <Image
              source={{ uri: state.user.picture }}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: theme.chip }}
            />
          ) : (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: theme.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="user" size={20} color={theme.accent} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Txt size={15.5} weight="800" numberOfLines={1}>
                {state.user.name}
              </Txt>
              {state.user.provider === 'demo' && <Badge text="DEMO" color={theme.warn} bg={`${theme.warn}1A`} />}
            </View>
            <Txt size={11.5} faint numberOfLines={1}>
              {state.user.email}
            </Txt>
          </View>
          <Tap
            onPress={() => {
              signOut();
              buzz('warning');
            }}
          >
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: theme.chip }}>
              <Txt size={12} weight="700" dim>
                {t('sign_out')}
              </Txt>
            </View>
          </Tap>
        </Card>
      ) : (
        <Tap onPress={() => router.push('/signin')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: `${theme.accent}55` }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: theme.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="user" size={19} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14.5} weight="800">
                {t('sign_in')}
              </Txt>
              <Txt size={11.5} faint numberOfLines={2} style={{ lineHeight: 16 }}>
                {t('auth_sub')}
              </Txt>
            </View>
            <Icon name="chevron-right" size={16} color={theme.textFaint} />
          </Card>
        </Tap>
      )}

      {/* stats */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { icon: 'swords', value: `${state.votes.length}`, label: t('battles_played') },
          { icon: 'message', value: `${messages}`, label: t('messages_sent') },
          { icon: 'terminal', value: `${state.agentSessions.length}`, label: t('agent_sessions') },
          { icon: 'shield', value: agreement === null ? '—' : `${agreement}%`, label: t('agreement') },
        ].map((s) => (
          <Card key={s.label} style={{ flex: 1, padding: 11, gap: 5, alignItems: 'flex-start' }}>
            <Icon name={s.icon as any} size={15} color={theme.accent} />
            <Txt size={17} weight="800" mono>
              {s.value}
            </Txt>
            <Txt size={9.5} faint numberOfLines={2}>
              {s.label}
            </Txt>
          </Card>
        ))}
      </View>

      {/* taste profile */}
      <View>
        <SectionTitle title={t('taste_profile')} icon="user" />
        {personalRanking.length === 0 ? (
          <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
            <Icon name="swords" size={22} color={theme.textFaint} />
            <Txt size={12.5} faint style={{ textAlign: 'center', paddingHorizontal: 22, lineHeight: 18 }}>
              {t('taste_empty')}
            </Txt>
            <Tap onPress={() => router.push('/battle')}>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: radius.pill,
                  backgroundColor: theme.accent,
                }}
              >
                <Txt size={13} weight="800" color="#fff">
                  {t('battle_start')}
                </Txt>
              </View>
            </Tap>
          </Card>
        ) : (
          <Card style={{ gap: 14 }}>
            {personalRanking.slice(0, 6).map((row, i) => {
              const m = byId(row.id);
              if (!m) return null;
              const crowdRank = m.elo;
              return (
                <Tap key={row.id} onPress={() => router.push(`/model/${row.id}`)}>
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      <Txt size={12.5} weight="800" faint mono style={{ width: 15 }}>
                        {i + 1}
                      </Txt>
                      <LabAvatar lab={m.lab} size={26} />
                      <Txt size={13.5} weight="700" style={{ flex: 1 }} numberOfLines={1}>
                        {m.name}
                      </Txt>
                      <Txt size={11} faint mono>
                        {row.battles}×
                      </Txt>
                      <Txt size={14} weight="800" mono color={theme.accent}>
                        {row.rating}
                      </Txt>
                    </View>
                    <Meter value={row.rating - 1100} max={Math.max(200, topRating - 1100)} />
                  </View>
                </Tap>
              );
            })}
            <Divider />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="globe" size={15} color={theme.textFaint} />
              <View style={{ flex: 1 }}>
                <Txt size={12.5} weight="700">
                  {t('agreement')}
                </Txt>
                <Txt size={11} faint>
                  {t('agreement_hint')}
                </Txt>
              </View>
              <Txt size={16} weight="800" mono color={theme.accent}>
                {agreement === null ? '—' : `${agreement}%`}
              </Txt>
            </View>
            {favouriteLab && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <LabAvatar lab={favouriteLab} size={26} />
                <Txt size={12.5} dim style={{ flex: 1 }}>
                  {t('favourite_lab')}
                </Txt>
                <Badge text={favouriteLab} color={theme.accent} bg={theme.accentSoft} />
              </View>
            )}
          </Card>
        )}
      </View>

      {/* history */}
      <View>
        <SectionTitle title={t('history')} icon="clock" />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.chip,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            height: 42,
            marginBottom: 10,
          }}
        >
          <Icon name="search" size={15} color={theme.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('search_history')}
            placeholderTextColor={theme.textFaint}
            style={{ flex: 1, color: theme.text, fontSize: 14, outlineStyle: 'none' } as any}
          />
        </View>
        {results.length === 0 ? (
          <Card tone="alt" style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Txt size={12.5} faint>
              {t('no_chats')}
            </Txt>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            {results.map((c) => {
              const m = byId(c.modelId);
              const hit = q
                ? c.messages.find((msg) => msg.text.toLowerCase().includes(q.trim().toLowerCase()))
                : c.messages[c.messages.length - 1];
              return (
                <Tap key={c.id} onPress={() => router.push(`/chat/${c.id}`)} onLongPress={() => deleteChat(c.id)}>
                  <Card style={{ padding: 12, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                      {m && <LabAvatar lab={m.lab} size={24} />}
                      <Txt size={13.5} weight="700" style={{ flex: 1 }} numberOfLines={1}>
                        {c.title}
                      </Txt>
                      <Txt size={10.5} faint>
                        {timeAgo(c.updatedAt, lang)}
                      </Txt>
                    </View>
                    {hit ? (
                      <Txt size={11.5} faint numberOfLines={2} style={{ lineHeight: 16 }}>
                        {hit.text.replace(/\s+/g, ' ').slice(0, 140)}
                      </Txt>
                    ) : null}
                  </Card>
                </Tap>
              );
            })}
          </View>
        )}
      </View>

      {/* settings */}
      <View>
        <SectionTitle title={t('settings')} icon="settings" />
        <Card style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Txt size={12.5} dim weight="700">
              {t('appearance')}
            </Txt>
            <Segmented
              value={state.settings.themePref}
              onChange={(v) => setSettings({ themePref: v })}
              options={[
                { value: 'system', label: t('theme_system'), icon: 'settings' },
                { value: 'light', label: t('theme_light'), icon: 'sun' },
                { value: 'dark', label: t('theme_dark'), icon: 'moon' },
              ]}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Txt size={12.5} dim weight="700">
              {t('language')}
            </Txt>
            <Segmented<Lang>
              value={state.settings.lang}
              onChange={(v) => setSettings({ lang: v })}
              options={[
                { value: 'en', label: 'English', icon: 'globe' },
                { value: 'ru', label: 'Русский', icon: 'globe' },
              ]}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="bolt" size={16} color={theme.textDim} />
            <Txt size={13.5} style={{ flex: 1 }}>
              {t('haptics')}
            </Txt>
            <Switch
              value={state.settings.haptics}
              onValueChange={(v) => {
                setSettings({ haptics: v });
                if (v) buzz('medium');
              }}
              trackColor={{ true: theme.accent, false: theme.stroke }}
              thumbColor="#fff"
            />
          </View>

          <Divider />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="wifi-off" size={16} color={theme.textDim} />
            <View style={{ flex: 1 }}>
              <Txt size={13} weight="700">
                {t('offline_copy')}
              </Txt>
              <Txt size={11} faint>
                {fmtCompact(state.chats.length)} chats · {fmtCompact(state.votes.length)} votes · {timeAgo(state.lastSync, lang)}
              </Txt>
            </View>
            <Badge text="LOCAL" color={theme.good} bg={`${theme.good}1A`} />
          </View>

          <Tap
            onPress={() => {
              reset();
              setWiped(true);
              buzz('warning');
              setTimeout(() => setWiped(false), 1800);
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: radius.md,
                backgroundColor: `${theme.bad}14`,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: `${theme.bad}44`,
              }}
            >
              <Icon name={wiped ? 'check' : 'trash'} size={15} color={wiped ? theme.good : theme.bad} />
              <Txt size={13} weight="700" color={wiped ? theme.good : theme.bad}>
                {wiped ? t('reset_done') : t('reset')}
              </Txt>
            </View>
          </Tap>
        </Card>
      </View>

      <Txt size={11} faint style={{ lineHeight: 16 }}>
        Arena Mobile · v1.0 · {t('disclaimer')}
      </Txt>
    </ScrollView>
  );
}
