import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppProvider, useApp } from '../src/store/app';

/**
 * On a phone the app fills the screen. In a desktop browser (the Expo web
 * build) we letterbox it into a phone-sized frame so the layout is honest
 * about what it was designed for.
 */
function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { theme } = useApp();
  const wide = Platform.OS === 'web' && width > 760;

  if (!wide) return <>{children}</>;

  const frameHeight = Math.min(920, height - 48);
  return (
    <View style={{ flex: 1, backgroundColor: '#050508', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 34, alignItems: 'center', gap: 4 }}>
        <Text style={{ color: '#6C6C7C', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 }}>
          Arena Mobile · React Native preview
        </Text>
        <Text style={{ color: '#3E3E4C', fontSize: 11 }}>
          Same code runs on iOS and Android through Expo — no WebView involved.
        </Text>
      </View>
      <View
        style={{
          width: 402,
          height: frameHeight,
          borderRadius: 46,
          overflow: 'hidden',
          backgroundColor: theme.bg,
          borderWidth: 10,
          borderColor: '#17171E',
          boxShadow: '0 30px 90px rgba(123,97,255,0.18)',
        } as any}
      >
        {children}
      </View>
    </View>
  );
}

function Navigator() {
  const { theme, scheme, state } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {state.ready ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="model/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="compare" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <DeviceFrame>
            <Navigator />
          </DeviceFrame>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
