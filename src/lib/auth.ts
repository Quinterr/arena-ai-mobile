/**
 * Google sign-in.
 *
 * Uses the OAuth 2.0 + PKCE flow through `expo-auth-session`, which opens the
 * system authentication sheet (ASWebAuthenticationSession on iOS, Custom Tabs
 * on Android) — the platform-native, secure way to sign in. There is no
 * in-app WebView anywhere in the app.
 *
 * Drop your client IDs into app.json → expo.extra.google (or the matching
 * EXPO_PUBLIC_GOOGLE_* env vars) and the real flow turns on automatically.
 * Without them the app falls back to a local demo account so every feature
 * stays reachable.
 */
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export type Account = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: 'google' | 'demo';
  since: number;
};

type ClientIds = { web?: string; ios?: string; android?: string };

function clientIds(): ClientIds {
  const extra = (Constants.expoConfig?.extra as { google?: ClientIds } | undefined)?.google ?? {};
  return {
    web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || extra.web,
    ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || extra.ios,
    android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || extra.android,
  };
}

export function isConfigured(): boolean {
  const ids = clientIds();
  const relevant = Platform.select({ ios: ids.ios, android: ids.android, default: ids.web });
  return Boolean(relevant && !relevant.startsWith('REPLACE_ME'));
}

const AVATARS = [
  'https://api.dicebear.com/7.x/thumbs/png?seed=arena',
  'https://api.dicebear.com/7.x/thumbs/png?seed=frontier',
];

export function demoAccount(): Account {
  return {
    id: `demo-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Arena Explorer',
    email: 'explorer@demo.arena.ai',
    picture: AVATARS[0],
    provider: 'demo',
    since: Date.now(),
  };
}

async function fetchProfile(accessToken: string): Promise<Account> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo ${res.status}`);
  const p = (await res.json()) as { sub: string; name?: string; email?: string; picture?: string };
  return {
    id: p.sub,
    name: p.name ?? p.email?.split('@')[0] ?? 'Arena user',
    email: p.email ?? '',
    picture: p.picture,
    provider: 'google',
    since: Date.now(),
  };
}

/**
 * Returns a `signIn()` that resolves with an Account, plus whether real
 * Google credentials are wired up.
 */
export function useGoogleSignIn() {
  const ids = useMemo(clientIds, []);
  const configured = isConfigured();

  const [, , promptAsync] = Google.useAuthRequest({
    clientId: ids.web ?? 'unconfigured.apps.googleusercontent.com',
    iosClientId: ids.ios,
    androidClientId: ids.android,
    webClientId: ids.web,
    scopes: ['openid', 'profile', 'email'],
  });

  const signIn = useCallback(async (): Promise<Account> => {
    if (!configured) {
      // Demo mode: no client IDs configured, keep the product usable.
      await new Promise((r) => setTimeout(r, 650));
      return demoAccount();
    }
    const result = await promptAsync();
    if (result?.type !== 'success') throw new Error(result?.type ?? 'cancelled');
    const token = result.authentication?.accessToken;
    if (!token) throw new Error('no access token');
    return fetchProfile(token);
  }, [configured, promptAsync]);

  return { signIn, configured };
}
