import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useApp } from '../store/app';
import { radius } from '../theme';

/**
 * Featherweight markdown renderer — enough for model answers,
 * zero dependencies, zero WebView.
 */
export function Markdown({ text, size = 15 }: { text: string; size?: number }) {
  const { theme } = useApp();
  const blocks = React.useMemo(() => splitBlocks(text), [text]);

  return (
    <View style={{ gap: 8 }}>
      {blocks.map((b, i) => {
        if (b.type === 'code') {
          return (
            <View
              key={i}
              style={{
                backgroundColor: theme.scheme === 'dark' ? '#0C0C11' : '#F4F4F8',
                borderRadius: radius.md,
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: theme.stroke,
                padding: 12,
              }}
            >
              {b.lang ? (
                <Text style={{ color: theme.textFaint, fontSize: 10.5, fontWeight: '800', marginBottom: 6 }}>
                  {b.lang.toUpperCase()}
                </Text>
              ) : null}
              <Text
                style={{
                  color: theme.scheme === 'dark' ? '#C9D5FF' : '#2E3350',
                  fontSize: size - 2,
                  lineHeight: (size - 2) * 1.5,
                  fontFamily: StyleSheet.absoluteFill ? undefined : undefined,
                }}
              >
                {b.content}
              </Text>
            </View>
          );
        }
        if (b.type === 'quote') {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 3, borderRadius: 2, backgroundColor: theme.accent }} />
              <Inline text={b.content} size={size} italic />
            </View>
          );
        }
        return <Inline key={i} text={b.content} size={size} />;
      })}
    </View>
  );
}

function Inline({ text, size, italic }: { text: string; size: number; italic?: boolean }) {
  const { theme } = useApp();
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <Text style={{ color: theme.text, fontSize: size, lineHeight: size * 1.5, fontWeight: '500' }}>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: '800' }}>
              {p.slice(2, -2)}
            </Text>
          );
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return (
            <Text
              key={i}
              style={{
                color: theme.accent,
                backgroundColor: theme.accentSoft,
                fontSize: size - 1.5,
              }}
            >
              {` ${p.slice(1, -1)} `}
            </Text>
          );
        }
        return (
          <Text key={i} style={italic ? { fontStyle: 'italic', color: theme.textDim } : undefined}>
            {p}
          </Text>
        );
      })}
    </Text>
  );
}

type Block = { type: 'text' | 'code' | 'quote'; content: string; lang?: string };

function splitBlocks(src: string): Block[] {
  const out: Block[] = [];
  const chunks = src.split(/```/g);
  chunks.forEach((chunk, idx) => {
    if (idx % 2 === 1) {
      const nl = chunk.indexOf('\n');
      const lang = nl > 0 ? chunk.slice(0, nl).trim() : '';
      out.push({ type: 'code', content: chunk.slice(nl + 1).replace(/\s+$/, ''), lang });
      return;
    }
    chunk
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((para) => {
        if (para.startsWith('>')) out.push({ type: 'quote', content: para.replace(/^>\s?/gm, '') });
        else out.push({ type: 'text', content: para });
      });
  });
  return out;
}
