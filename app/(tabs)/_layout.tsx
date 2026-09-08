import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '../../src/components/Icon';
import { useApp } from '../../src/store/app';
import type { Key } from '../../src/i18n';

const TABS: { name: string; icon: IconName; label: Key }[] = [
  { name: 'index', icon: 'message', label: 'tab_chat' },
  { name: 'agent', icon: 'terminal', label: 'tab_agent' },
  { name: 'battle', icon: 'swords', label: 'tab_battle' },
  { name: 'leaderboard', icon: 'trophy', label: 'tab_ranks' },
  { name: 'pulse', icon: 'pulse', label: 'tab_pulse' },
  { name: 'you', icon: 'user', label: 'tab_you' },
];

function TabBar({ state, navigation }: any) {
  const { theme, t, buzz } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.bgElevated,
        borderTopWidth: StyleSheet.hairlineWidth * 2,
        borderTopColor: theme.stroke,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 9,
        paddingHorizontal: 2,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const meta = TABS.find((x) => x.name === route.name);
        if (!meta) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              buzz('light');
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 }}
          >
            <View
              style={{
                paddingHorizontal: 11,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: focused ? theme.accentSoft : 'transparent',
              }}
            >
              <Icon name={meta.icon} size={20} color={focused ? theme.accent : theme.textFaint} strokeWidth={focused ? 2.2 : 1.8} />
            </View>
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: focused ? '800' : '600',
                color: focused ? theme.text : theme.textFaint,
              }}
            >
              {t(meta.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(props) => <TabBar {...props} />}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
