export function fmtInt(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export function fmtMoney(n?: number): string {
  if (n === undefined || n === null) return '—';
  if (n < 1) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function fmtPct(n?: number, digits = 2): string {
  if (n === undefined) return '—';
  const s = n > 0 ? '+' : '';
  return `${s}${n.toFixed(digits)}%`;
}

export function fmtDelta(n: number): string {
  if (n === 0) return '0';
  return `${n > 0 ? '▲' : '▼'}${Math.abs(n)}`;
}

export function timeAgo(ts: number, lang: 'en' | 'ru' = 'en'): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  const units: [number, string, string][] = [
    [60, 's', 'с'],
    [3600, 'm', 'м'],
    [86400, 'h', 'ч'],
    [86400 * 7, 'd', 'д'],
  ];
  if (s < 60) return lang === 'ru' ? 'только что' : 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}${units[1][lang === 'ru' ? 2 : 1]}`;
  if (s < 86400) return `${Math.floor(s / 3600)}${units[2][lang === 'ru' ? 2 : 1]}`;
  return `${Math.floor(s / 86400)}${units[3][lang === 'ru' ? 2 : 1]}`;
}

export const initials = (lab: string) =>
  lab
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
