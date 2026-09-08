/** Tiny Elo implementation used for the user's personal ranking. */
export const K = 24;
export const START = 1200;

export function expected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/** score: 1 = a wins, 0 = b wins, 0.5 = tie */
export function update(a: number, b: number, score: number): [number, number] {
  const ea = expected(a, b);
  const na = a + K * (score - ea);
  const nb = b + K * (1 - score - (1 - ea));
  return [Math.round(na), Math.round(nb)];
}
