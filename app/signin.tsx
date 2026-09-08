import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '../src/components/Icon';
import { Card, Tap, Txt } from '../src/components/ui';
import { useGoogleSignIn } from '../src/lib/auth';
import { useApp } from '../src/store/app';
import { radius } from '../src/theme';

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.2-.44-4.7H24v9h12.7c-.55 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.4z" />
      <Path fill="#FBBC05" d="M10.4 28.7a14.8 14.8 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

export default function SignIn() {
  const { theme, t, signIn, buzz } = useApp();
  const { signIn: googleSignIn, configured } = useGoogleSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/you'));

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const account = await googleSignIn();
      signIn(account);
      buzz('success');
      close();
    } catch {
      setError(t('auth_failed'));
      buzz('warning');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Tap onPress={close}>
          <View style={{ padding: 8, borderRadius: 999, backgroundColor: theme.chip }}>
            <Icon name="x" size={16} color={theme.textDim} />
          </View>
        </Tap>
      </View>

      <View style={{ alignItems: 'center', marginTop: 26, gap: 12 }}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 20,
            backgroundColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="bolt" size={30} color="#fff" fill="#fff" />
        </View>
        <Txt size={24} weight="800">
          {t('auth_title')}
        </Txt>
        <Txt size={14} dim style={{ textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>
          {t('auth_sub')}
        </Txt>
      </View>

      <Card style={{ marginTop: 26, gap: 13 }}>
        {[
          { icon: 'refresh', label: t('auth_perk_sync') },
          { icon: 'trophy', label: t('auth_perk_credit') },
          { icon: 'terminal', label: t('auth_perk_agent') },
        ].map((p) => (
          <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                backgroundColor: theme.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={p.icon as any} size={14} color={theme.accent} />
            </View>
            <Txt size={13.5} dim style={{ flex: 1 }}>
              {p.label}
            </Txt>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: 22, gap: 10 }}>
        <Tap onPress={go} disabled={busy}>
          <View
            style={{
              height: 52,
              borderRadius: radius.md,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor: '#DADCE0',
            }}
          >
            {busy ? <ActivityIndicator color="#3C4043" /> : <GoogleMark size={19} />}
            <Txt size={15.5} weight="700" color="#3C4043">
              {t('sign_in_google')}
            </Txt>
          </View>
        </Tap>

        <Tap onPress={close}>
          <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={14} weight="700" dim>
              {t('continue_guest')}
            </Txt>
          </View>
        </Tap>
      </View>

      {error ? (
        <Txt size={12.5} color={theme.bad} style={{ textAlign: 'center', marginTop: 4 }}>
          {error}
        </Txt>
      ) : null}

      <View style={{ flex: 1 }} />

      <View style={{ gap: 8, paddingBottom: insets.bottom + 18 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="shield" size={13} color={theme.textFaint} />
          <Txt size={11} faint style={{ flex: 1, lineHeight: 16 }}>
            {t('auth_native_note')}
          </Txt>
        </View>
        {!configured && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="wifi-off" size={13} color={theme.textFaint} />
            <Txt size={11} faint style={{ flex: 1, lineHeight: 16 }}>
              {t('auth_demo_note')}
            </Txt>
          </View>
        )}
      </View>
    </View>
  );
}
