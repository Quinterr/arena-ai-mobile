/**
 * Arena mobile design system.
 * Dark-first palette, tuned for OLED phones.
 */
export type Scheme = 'light' | 'dark';

const palette = {
  violet: '#7B61FF',
  violetSoft: '#A594FF',
  cyan: '#39D3FF',
  lime: '#B8FF4F',
  amber: '#FFB020',
  rose: '#FF5C7A',
  green: '#31D97B',
};

export const labColors: Record<string, string> = {
  Anthropic: '#D97757',
  OpenAI: '#10A37F',
  Google: '#4285F4',
  Meta: '#0866FF',
  Moonshot: '#6C5CE7',
  'Z.ai': '#00B8A9',
  SpaceXAI: '#8E8E93',
  Alibaba: '#FF6A00',
  DeepSeek: '#4D6BFE',
  MiniMax: '#FF4D8D',
  Xiaomi: '#FF6900',
  Tencent: '#12B7F5',
  Nvidia: '#76B900',
  Mistral: '#FF7000',
  Upstage: '#8256FF',
  Thinky: '#C3B1FF',
  Baidu: '#2932E1',
};

const dark = {
  scheme: 'dark' as Scheme,
  bg: '#08080B',
  bgElevated: '#101015',
  surface: '#14141A',
  surfaceAlt: '#1B1B23',
  stroke: '#26262F',
  strokeSoft: '#1D1D25',
  text: '#F5F5F7',
  textDim: '#A0A0AE',
  textFaint: '#6C6C7C',
  accent: palette.violet,
  accentSoft: '#2A2140',
  onAccent: '#FFFFFF',
  a: '#39D3FF',
  b: '#FF9F45',
  good: palette.green,
  bad: palette.rose,
  warn: palette.amber,
  chip: '#1A1A22',
  overlay: 'rgba(4,4,8,0.72)',
  ...palette,
};

const light = {
  ...dark,
  scheme: 'light' as Scheme,
  bg: '#FBFBFD',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2F7',
  stroke: '#E3E3EA',
  strokeSoft: '#EDEDF2',
  text: '#0B0B12',
  textDim: '#5B5B66',
  textFaint: '#8A8A96',
  accentSoft: '#EDE9FF',
  chip: '#F1F1F6',
  overlay: 'rgba(255,255,255,0.75)',
};

export type Theme = typeof dark;

export const themes: Record<Scheme, Theme> = { dark, light };

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const space = (n: number) => n * 4;

export const font = {
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  mono: {
    fontSize: 13,
    fontFamily: undefined as string | undefined,
    fontVariant: ['tabular-nums'] as const,
  },
};
