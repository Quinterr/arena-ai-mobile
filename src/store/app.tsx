import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { themes, type Scheme, type Theme } from '../theme';
import { translate, type Key, type Lang } from '../i18n';
import { MODELS, type Category } from '../data/models';
import * as elo from '../lib/elo';
import type { Account } from '../lib/auth';
import type { AgentSession } from '../lib/agent';

export type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  modelId?: string;
  ts: number;
  streaming?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  modelId: string;
  secondaryModelId?: string;
  messages: Msg[];
  createdAt: number;
  updatedAt: number;
};

export type Vote = {
  id: string;
  prompt: string;
  aId: string;
  bId: string;
  result: 'a' | 'b' | 'tie' | 'bad';
  ts: number;
};

type Settings = {
  themePref: 'system' | 'light' | 'dark';
  lang: Lang;
  haptics: boolean;
  defaultModelId: string;
  category: Category;
};

type State = {
  ready: boolean;
  settings: Settings;
  user: Account | null;
  agentSessions: AgentSession[];
  chats: Chat[];
  votes: Vote[];
  personalElo: Record<string, number>;
  watchlist: string[];
  lastSync: number;
  lastVisit: number;
  streakDays: number;
};

const DEFAULTS: State = {
  ready: false,
  user: null,
  agentSessions: [],
  settings: {
    themePref: 'dark',
    lang: 'en',
    haptics: true,
    defaultModelId: 'claude-fable-5',
    category: 'text',
  },
  chats: [],
  votes: [],
  personalElo: {},
  watchlist: ['gpt-5-6-sol-xhigh', 'glm-5-3-max'],
  lastSync: Date.now(),
  lastVisit: Date.now(),
  streakDays: 1,
};

type Action =
  | { type: 'hydrate'; payload: Partial<State> }
  | { type: 'signIn'; user: Account }
  | { type: 'signOut' }
  | { type: 'upsertAgent'; session: AgentSession }
  | { type: 'deleteAgent'; id: string }
  | { type: 'settings'; payload: Partial<Settings> }
  | { type: 'upsertChat'; chat: Chat }
  | { type: 'deleteChat'; id: string }
  | { type: 'vote'; vote: Vote }
  | { type: 'toggleWatch'; id: string }
  | { type: 'sync' }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, ready: true };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'signIn':
      return { ...state, user: action.user };
    case 'signOut':
      return { ...state, user: null };
    case 'upsertAgent': {
      const rest = state.agentSessions.filter((s) => s.id !== action.session.id);
      return { ...state, agentSessions: [action.session, ...rest].slice(0, 40) };
    }
    case 'deleteAgent':
      return { ...state, agentSessions: state.agentSessions.filter((s) => s.id !== action.id) };
    case 'upsertChat': {
      const rest = state.chats.filter((c) => c.id !== action.chat.id);
      return { ...state, chats: [action.chat, ...rest].slice(0, 60) };
    }
    case 'deleteChat':
      return { ...state, chats: state.chats.filter((c) => c.id !== action.id) };
    case 'vote': {
      const { aId, bId, result } = action.vote;
      const next = { ...state.personalElo };
      const ra = next[aId] ?? elo.START;
      const rb = next[bId] ?? elo.START;
      if (result === 'a' || result === 'b' || result === 'tie') {
        const s = result === 'a' ? 1 : result === 'b' ? 0 : 0.5;
        const [na, nb] = elo.update(ra, rb, s);
        next[aId] = na;
        next[bId] = nb;
      } else {
        next[aId] = Math.round(ra - 6);
        next[bId] = Math.round(rb - 6);
      }
      return { ...state, votes: [action.vote, ...state.votes].slice(0, 400), personalElo: next };
    }
    case 'toggleWatch':
      return {
        ...state,
        watchlist: state.watchlist.includes(action.id)
          ? state.watchlist.filter((x) => x !== action.id)
          : [...state.watchlist, action.id],
      };
    case 'sync':
      return { ...state, lastSync: Date.now() };
    case 'reset':
      return { ...DEFAULTS, ready: true, lastSync: Date.now() };
    default:
      return state;
  }
}

const STORAGE_KEY = 'arena.state.v1';

type Ctx = {
  state: State;
  theme: Theme;
  scheme: Scheme;
  t: (k: Key) => string;
  lang: Lang;
  setSettings: (p: Partial<Settings>) => void;
  upsertChat: (c: Chat) => void;
  signIn: (u: Account) => void;
  signOut: () => void;
  upsertAgentSession: (s: AgentSession) => void;
  deleteAgentSession: (id: string) => void;
  deleteChat: (id: string) => void;
  addVote: (v: Vote) => void;
  toggleWatch: (id: string) => void;
  sync: () => Promise<void>;
  reset: () => void;
  buzz: (kind?: 'light' | 'medium' | 'success' | 'warning') => void;
  personalRanking: { id: string; rating: number; battles: number }[];
  agreement: number | null;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULTS);
  const system = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = raw ? (JSON.parse(raw) as Partial<State>) : {};
        const last = saved.lastVisit ?? Date.now();
        const daysSince = Math.floor((Date.now() - last) / 86400000);
        dispatch({
          type: 'hydrate',
          payload: {
            ...saved,
            settings: { ...DEFAULTS.settings, ...(saved.settings ?? {}) },
            lastVisit: Date.now(),
            streakDays:
              daysSince === 1 ? (saved.streakDays ?? 1) + 1 : daysSince > 1 ? 1 : saved.streakDays ?? 1,
          },
        });
      } catch {
        dispatch({ type: 'hydrate', payload: {} });
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    const { ready, ...persist } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persist)).catch(() => {});
  }, [state]);

  const scheme: Scheme =
    state.settings.themePref === 'system' ? ((system ?? 'dark') as Scheme) : state.settings.themePref;
  const theme = themes[scheme];
  const lang = state.settings.lang;

  const buzz = useCallback(
    (kind: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
      if (!state.settings.haptics || Platform.OS === 'web') return;
      if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else
        Haptics.impactAsync(
          kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
        );
    },
    [state.settings.haptics],
  );

  const personalRanking = useMemo(() => {
    const battles: Record<string, number> = {};
    state.votes.forEach((v) => {
      battles[v.aId] = (battles[v.aId] ?? 0) + 1;
      battles[v.bId] = (battles[v.bId] ?? 0) + 1;
    });
    return Object.entries(state.personalElo)
      .map(([id, rating]) => ({ id, rating, battles: battles[id] ?? 0 }))
      .sort((a, b) => b.rating - a.rating);
  }, [state.personalElo, state.votes]);

  const agreement = useMemo(() => {
    const decided = state.votes.filter((v) => v.result === 'a' || v.result === 'b');
    if (!decided.length) return null;
    let match = 0;
    decided.forEach((v) => {
      const a = MODELS.find((m) => m.id === v.aId);
      const b = MODELS.find((m) => m.id === v.bId);
      if (!a || !b) return;
      const crowdWinner = a.elo >= b.elo ? 'a' : 'b';
      if (crowdWinner === v.result) match++;
    });
    return Math.round((match / decided.length) * 100);
  }, [state.votes]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      theme,
      scheme,
      lang,
      t: (k: Key) => translate(lang, k),
      setSettings: (p) => dispatch({ type: 'settings', payload: p }),
      upsertChat: (c) => dispatch({ type: 'upsertChat', chat: c }),
      signIn: (u) => dispatch({ type: 'signIn', user: u }),
      signOut: () => dispatch({ type: 'signOut' }),
      upsertAgentSession: (s) => dispatch({ type: 'upsertAgent', session: s }),
      deleteAgentSession: (id) => dispatch({ type: 'deleteAgent', id }),
      deleteChat: (id) => dispatch({ type: 'deleteChat', id }),
      addVote: (v) => dispatch({ type: 'vote', vote: v }),
      toggleWatch: (id) => dispatch({ type: 'toggleWatch', id }),
      sync: async () => {
        await new Promise((r) => setTimeout(r, 900));
        dispatch({ type: 'sync' });
      },
      reset: () => dispatch({ type: 'reset' }),
      buzz,
      personalRanking,
      agreement,
    }),
    [state, theme, scheme, lang, buzz, personalRanking, agreement],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
