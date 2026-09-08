import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';

import { useApp } from '../store/app';
import { labColors, radius } from '../theme';
import { initials } from '../lib/format';
import { Icon, type IconName } from './Icon';

/* ---------------------------------------------------------------- Pressable */

export function Tap({
  children,
  onPress,
  onLongPress,
  style,
  disabled,
  scaleTo = 0.97,
  hitSlop = 4,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  hitSlop?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.45 : 1 }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  children,
  style,
  padded = true,
  tone = 'surface',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'surface' | 'alt' | 'ghost';
}) {
  const { theme } = useApp();
  return (
    <View
      style={[
        {
          backgroundColor:
            tone === 'ghost' ? 'transparent' : tone === 'alt' ? theme.surfaceAlt : theme.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: theme.stroke,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* --------------------------------------------------------------------- Txt */

export function Txt({
  children,
  size = 15,
  weight = '500',
  color,
  dim,
  faint,
  style,
  numberOfLines,
  mono,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: TextStyle['fontWeight'];
  color?: string;
  dim?: boolean;
  faint?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  mono?: boolean;
}) {
  const { theme } = useApp();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: color ?? (faint ? theme.textFaint : dim ? theme.textDim : theme.text),
          fontSize: size,
          fontWeight: weight,
          letterSpacing: size > 22 ? -0.5 : size > 17 ? -0.2 : 0,
        },
        mono && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* -------------------------------------------------------------------- Pill */

export function Pill({
  label,
  icon,
  active,
  onPress,
  tone,
  small,
}: {
  label: string;
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
  tone?: string;
  small?: boolean;
}) {
  const { theme } = useApp();
  const bg = active ? tone ?? theme.accent : theme.chip;
  const fg = active ? '#fff' : theme.textDim;
  return (
    <Tap onPress={onPress} disabled={!onPress} scaleTo={0.94}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: bg,
          paddingHorizontal: small ? 10 : 13,
          paddingVertical: small ? 5 : 8,
          borderRadius: radius.pill,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: active ? 'transparent' : theme.stroke,
        }}
      >
        {icon && <Icon name={icon} size={small ? 13 : 15} color={fg} />}
        <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 12 : 13.5 }}>{label}</Text>
      </View>
    </Tap>
  );
}

/* ------------------------------------------------------------------ Avatar */

export function LabAvatar({ lab, size = 34 }: { lab: string; size?: number }) {
  const color = labColors[lab] ?? '#7B61FF';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: `${color}22`,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: `${color}66`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontWeight: '800', fontSize: size * 0.36 }}>{initials(lab)}</Text>
    </View>
  );
}

/* --------------------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  scroll,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  scroll?: boolean;
}) {
  const { theme, buzz } = useApp();
  const body = (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.chip,
        borderRadius: radius.pill,
        padding: 4,
        gap: 2,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: theme.strokeSoft,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              buzz('light');
              onChange(o.value);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: active ? theme.bgElevated : 'transparent',
              flex: scroll ? undefined : 1,
              justifyContent: 'center',
            }}
          >
            {o.icon && <Icon name={o.icon} size={14} color={active ? theme.text : theme.textFaint} />}
            <Text
              style={{
                color: active ? theme.text : theme.textFaint,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
  if (!scroll) return body;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
      {body}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ Charts */

export function Sparkline({
  data,
  width = 72,
  height = 26,
  color,
  fillTone = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillTone?: boolean;
}) {
  const { theme } = useApp();
  const stroke = color ?? (data[data.length - 1] >= data[0] ? theme.good : theme.bad);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${width - 1},${height} L1,${height} Z`;
  const gid = `sp${Math.round(pts[0][1])}${data.length}`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
          <Stop offset="1" stopColor={stroke} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {fillTone && <Path d={area} fill={`url(#${gid})`} />}
      <Path d={d} stroke={stroke} strokeWidth={1.8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function Meter({
  value,
  max = 1,
  color,
  height = 6,
  track,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const { theme } = useApp();
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ height, backgroundColor: track ?? theme.surfaceAlt, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? theme.accent, borderRadius: height }} />
    </View>
  );
}

export function Radar({
  series,
  labels,
  size = 220,
}: {
  series: { color: string; values: number[] }[];
  labels: string[];
  size?: number;
}) {
  const { theme } = useApp();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;
  const n = labels.length;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * v, cy + Math.sin(a) * r * v] as const;
  };
  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <Polygon
          key={ring}
          points={labels.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke={theme.stroke}
          strokeWidth={1}
        />
      ))}
      {series.map((s, si) => (
        <Polygon
          key={si}
          points={s.values.map((v, i) => point(i, Math.max(0.05, Math.min(1, v))).join(',')).join(' ')}
          fill={`${s.color}33`}
          stroke={s.color}
          strokeWidth={2}
        />
      ))}
      {series.map((s, si) =>
        s.values.map((v, i) => {
          const [x, y] = point(i, Math.max(0.05, Math.min(1, v)));
          return <Circle key={`${si}-${i}`} cx={x} cy={y} r={2.6} fill={s.color} />;
        }),
      )}
    </Svg>
  );
}

/* ------------------------------------------------------------------ Layout */

export function SectionTitle({
  title,
  action,
  onAction,
  icon,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
      {icon && <Icon name={icon} size={16} color={theme.textDim} />}
      <Txt size={13} weight="800" dim style={{ textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>
        {title}
      </Txt>
      {action ? (
        <Tap onPress={onAction}>
          <Txt size={13} weight="700" color={theme.accent}>
            {action}
          </Txt>
        </Tap>
      ) : null}
    </View>
  );
}

export function Divider() {
  const { theme } = useApp();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: theme.strokeSoft }} />;
}

export function Badge({ text, color, bg }: { text: string; color?: string; bg?: string }) {
  const { theme } = useApp();
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 7,
        backgroundColor: bg ?? theme.chip,
      }}
    >
      <Text style={{ fontSize: 10.5, fontWeight: '800', color: color ?? theme.textDim, letterSpacing: 0.3 }}>
        {text}
      </Text>
    </View>
  );
}

export function DeltaBadge({ delta }: { delta: number }) {
  const { theme } = useApp();
  if (!delta) return <Badge text="—" />;
  const up = delta > 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon name={up ? 'trend-up' : 'trend-down'} size={13} color={up ? theme.good : theme.bad} />
      <Text style={{ color: up ? theme.good : theme.bad, fontWeight: '800', fontSize: 12 }}>
        {Math.abs(delta)}
      </Text>
    </View>
  );
}
