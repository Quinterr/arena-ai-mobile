import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MODELS, type Model } from '../data/models';
import { useApp } from '../store/app';
import { radius } from '../theme';
import { fmtCompact } from '../lib/format';
import { Icon } from './Icon';
import { Badge, Card, LabAvatar, Tap, Txt } from './ui';

export function ModelPicker({
  visible,
  onClose,
  onPick,
  selectedId,
  title,
  exclude,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (m: Model) => void;
  selectedId?: string;
  title?: string;
  exclude?: string[];
}) {
  const { theme, t, buzz } = useApp();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MODELS.filter((m) => !exclude?.includes(m.id)).filter(
      (m) => !needle || m.name.toLowerCase().includes(needle) || m.lab.toLowerCase().includes(needle),
    );
  }, [q, exclude]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <View
        style={{
          height: '78%',
          backgroundColor: theme.bgElevated,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: 10,
          paddingBottom: insets.bottom,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderColor: theme.stroke,
        }}
      >
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: theme.stroke }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <Txt size={19} weight="800" style={{ flex: 1 }}>
            {title ?? t('pick_model')}
          </Txt>
          <Tap onPress={onClose}>
            <View style={{ padding: 6, borderRadius: 999, backgroundColor: theme.chip }}>
              <Icon name="x" size={16} color={theme.textDim} />
            </View>
          </Tap>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.chip,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              height: 42,
            }}
          >
            <Icon name="search" size={16} color={theme.textFaint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={t('search_models')}
              placeholderTextColor={theme.textFaint}
              style={{ flex: 1, color: theme.text, fontSize: 15, outlineStyle: 'none' } as any}
            />
          </View>
        </View>

        <FlatList
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
          renderItem={({ item }) => {
            const active = item.id === selectedId;
            return (
              <Tap
                onPress={() => {
                  buzz('medium');
                  onPick(item);
                  onClose();
                }}
              >
                <Card
                  padded={false}
                  style={{
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderColor: active ? theme.accent : theme.stroke,
                    backgroundColor: active ? theme.accentSoft : theme.surface,
                  }}
                >
                  <LabAvatar lab={item.lab} />
                  <View style={{ flex: 1 }}>
                    <Txt size={14.5} weight="700" numberOfLines={1}>
                      {item.name}
                    </Txt>
                    <Txt size={12} faint numberOfLines={1}>
                      {item.lab} · {item.license} · {fmtCompact(item.votes)} votes
                    </Txt>
                  </View>
                  <Badge text={`${item.elo}`} color={theme.accent} bg={theme.accentSoft} />
                  {active && <Icon name="check" size={16} color={theme.accent} />}
                </Card>
              </Tap>
            );
          }}
        />
      </View>
    </Modal>
  );
}
