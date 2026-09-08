#!/usr/bin/env node
/**
 * Headless smoke test for the Expo web build.
 *
 * Renders the real app bundle inside jsdom (no browser, no Chromium download)
 * and reports React errors plus the text each route produced.
 *
 *   npm run web            # in one terminal
 *   node tools/smoke.mjs   # in another
 */
import { JSDOM } from 'jsdom';

const HOST = process.env.SMOKE_HOST ?? 'http://localhost:3000';
const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/battle', '/leaderboard', '/pulse', '/you', '/compare', '/model/claude-fable-5'];

const BUNDLE = `${HOST}/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=false&transform.engine=hermes&transform.routerRoot=app`;

const html = await (await fetch(HOST)).text();
const bundle = await (await fetch(BUNDLE)).text();
if (bundle.startsWith('{"type":')) {
  console.error('Bundle failed to build:\n', bundle.slice(0, 800));
  process.exit(1);
}

let failed = 0;

for (const route of ROUTES) {
  const dom = new JSDOM(html, { url: HOST + route, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  });
  window.scrollTo = () => {};
  window.WebSocket = class {
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = RO;
  globalThis.ResizeObserver = RO;
  window.IntersectionObserver = RO;

  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.error?.stack ?? e.message).slice(0, 300)));
  window.console = {
    ...console,
    error: (...a) => errors.push(a.map(String).join(' ').slice(0, 300)),
    warn() {},
    log() {},
  };

  try {
    window.eval(bundle);
  } catch (e) {
    errors.push(String(e.stack ?? e).slice(0, 300));
  }
  await new Promise((r) => setTimeout(r, 2500));

  const text = (window.document.getElementById('root')?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const ok = errors.length === 0 && text.length > 40;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${route.padEnd(28)} ${text.length} chars`);
  if (!ok) console.log('   ', errors[0] ?? 'empty render');
  window.close();
}

console.log(failed ? `\n${failed} route(s) failed` : '\nAll routes rendered cleanly');
process.exit(failed ? 1 : 0);
