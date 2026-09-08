/**
 * On-device answer synthesiser.
 *
 * The demo has no network dependency: every "model" answers from a
 * persona-driven template engine, so Chat and Battle Mode work offline,
 * on a plane, with zero API keys — and no WebView anywhere.
 *
 * Swap `synthesize` for a real streaming fetch to go live.
 */
import type { Model } from '../data/models';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ----------------------------------------------------------------- persona */

type Layout = 'numbered' | 'bullets' | 'prose' | 'headers';

type Persona = {
  opener: string[];
  closer: string[];
  layout: Layout;
  verbosity: number; // 0.5 slim … 1.3 dense
  hedge: boolean;
};

const LAB_STYLE: Record<string, Persona> = {
  Anthropic: {
    opener: ["Here's how I'd approach it.", 'Let me think this through with you.', 'Good question — the honest answer has two layers.'],
    closer: ['Happy to go deeper on any of these — tell me which part matters most.', 'If you share your constraints I can tighten this considerably.'],
    layout: 'headers',
    verbosity: 1.25,
    hedge: true,
  },
  OpenAI: {
    opener: ['Short answer first, then the details.', 'Quick version, then the reasoning.'],
    closer: ['Want me to turn this into code or a checklist?', 'Say the word and I will draft the next step.'],
    layout: 'numbered',
    verbosity: 1.0,
    hedge: false,
  },
  Google: {
    opener: ['Quick take:', 'In short:'],
    closer: ['I can expand any bullet into a full walkthrough.', 'Ask me to zoom in anywhere.'],
    layout: 'bullets',
    verbosity: 0.75,
    hedge: false,
  },
  Moonshot: {
    opener: ['Let me structure this properly.', 'Three angles matter here.'],
    closer: ['Tell me your constraints and I will tighten the plan.', 'I kept it concrete — ask for the long form if useful.'],
    layout: 'headers',
    verbosity: 1.1,
    hedge: false,
  },
  'Z.ai': {
    opener: ['Direct answer:', 'Straight to it:'],
    closer: ['Ask for a reference implementation if useful.', 'That should be enough to start.'],
    layout: 'numbered',
    verbosity: 0.85,
    hedge: false,
  },
  SpaceXAI: {
    opener: ['Alright — no fluff.', "Here's the version nobody tells you."],
    closer: ['That is the fastest path. Ship it.', 'Do that and stop reading blog posts about it.'],
    layout: 'bullets',
    verbosity: 0.6,
    hedge: false,
  },
  Alibaba: {
    opener: ['Overview first, then specifics.', 'Two layers: the principle and the practice.'],
    closer: ['I can answer in another language if you prefer.', 'Tell me the target audience and I will adapt the tone.'],
    layout: 'headers',
    verbosity: 1.05,
    hedge: true,
  },
  DeepSeek: {
    opener: ['Reasoning through it step by step.', 'Let me decompose the problem.'],
    closer: ['Complexity and edge cases are noted above.', 'The failure modes are the interesting part — ask if you want them enumerated.'],
    layout: 'numbered',
    verbosity: 1.15,
    hedge: false,
  },
  Meta: {
    opener: ["Here's a way to think about it.", 'Picture it like this.'],
    closer: ['Want a version with more personality?', 'I can rewrite this in a different register.'],
    layout: 'prose',
    verbosity: 0.95,
    hedge: true,
  },
  MiniMax: {
    opener: ['Compact answer:', 'Summary up front:'],
    closer: ['Ping me for the extended breakdown.'],
    layout: 'bullets',
    verbosity: 0.7,
    hedge: false,
  },
};

const FALLBACK: Persona = {
  opener: ['Here goes.', 'My take:'],
  closer: ['Let me know if you want another angle.'],
  layout: 'bullets',
  verbosity: 0.9,
  hedge: false,
};

/* ------------------------------------------------------------------ topics */

type Topic = {
  keys: string[];
  points: string[];
  code?: { lang: string; body: string };
  quote?: string;
  kicker?: string;
};

const TOPICS: Record<string, Topic> = {
  quantum: {
    keys: ['quantum', 'entangle', 'physics', 'квант'],
    points: [
      'Two particles can be prepared so that their outcomes are linked no matter how far apart they end up.',
      'Nothing travels between them — you only learn what the pair was doing all along, and the correlations are stronger than any classical dice could produce.',
      'Measure one and you instantly know the other, but you cannot use that to send a message, because each individual result still looks like random noise.',
      'The magic is in the statistics of many measurements, not in any single spooky signal.',
    ],
    kicker: 'Analogy that survives scrutiny: two gloves in two boxes, except the gloves decide which hand they are only when you open a box — and they always agree.',
  },
  travel: {
    keys: ['tokyo', 'itinerary', 'travel', 'trip', 'маршрут', 'путешеств'],
    points: [
      'Day 1 — Yanaka and Nezu: cemetery cherry lanes, a 100-year-old sento, then Kayaba coffee. Skip Asakusa before 4pm.',
      'Day 2 — Kiyosumi-Shirakawa for coffee roasters and the Fukagawa Edo museum, then a night walk under the Sumida bridges.',
      'Day 3 — Take the Keio line to Takao-san at dawn, back by noon, spend the evening in a Nakameguro standing bar.',
      'Book nothing except the one kaiseki dinner. Tokyo punishes tight schedules and rewards wandering.',
    ],
    kicker: 'Rule of thumb: anything with an English queue system was optimised for tourists, not for food.',
  },
  migration: {
    keys: ['jquery', 'migration', 'legacy', 'refactor', 'миграц'],
    points: [
      'Do not rewrite. Mount React into one DOM node the jQuery app already owns, and let the two coexist.',
      'Move the leaf widgets first — the ones that read props and emit events, with no global state.',
      'Introduce a thin event bus so jQuery can dispatch to React and back without either side importing the other.',
      'Kill jQuery only when the last selector is gone; the dependency is cheap, the half-migration is not.',
    ],
    code: {
      lang: 'tsx',
      body: `// bridge.ts — the whole migration strategy in 12 lines
import { createRoot } from 'react-dom/client';

export function mountIsland(selector: string, node: React.ReactNode) {
  const host = document.querySelector(selector);
  if (!host) return () => {};
  const root = createRoot(host);
  root.render(node);
  return () => root.unmount();
}`,
    },
  },
  pricing: {
    keys: ['pricing', 'saas', 'price model', 'monetis', 'monetiz', 'цена', 'тариф'],
    points: [
      'Charge per outcome, not per seat: solo founders have no seats to add, so seat pricing caps you at $1 per customer.',
      'Three tiers, and make the middle one obviously correct. The cheap tier exists to make the middle feel safe.',
      'Annual discount at 2 months, not 4 — you are buying retention, not cash.',
      'At 500 users, a $2 price increase beats any funnel optimisation you can ship this quarter.',
    ],
    kicker: 'Test it with 20 new signups before touching existing customers. Grandfathering is cheaper than churn.',
  },
  sql: {
    keys: ['postgres', 'sql', 'index', 'query', 'slower', 'запрос'],
    points: [
      'An index only helps when the planner believes it is selective — after adding one, statistics often go stale and it flips to a bitmap heap scan.',
      'Check `rows` estimated vs actual in the plan. If they differ by more than 10x, the planner is guessing badly.',
      'Random page cost matters: on SSDs, 1.1 is usually closer to reality than the default 4.0.',
      'If the table is wide, an index-only scan needs a covering index plus a fresh visibility map.',
    ],
    code: {
      lang: 'sql',
      body: `ANALYZE orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM orders
WHERE customer_id = $1
  AND created_at > now() - interval '30 days';`,
    },
  },
  ci: {
    keys: ['ci', 'tests pass locally', 'flaky', 'tuesday', 'тест'],
    points: [
      'Tuesday means time, and time means a date-dependent test, a weekly cron, or a cache that expires on a schedule.',
      'Print the CI clock, timezone and locale at the start of the run. Half of these bugs die right there.',
      'Freeze time in tests. A fixed clock is not a workaround, it is correct testing.',
      'If it survives all that, look at the runner image tag — someone is rebuilding it weekly.',
    ],
  },
  rag: {
    keys: ['rag', 'long-context', 'long context', 'retrieval', 'контекст'],
    points: [
      'Long context wins when the corpus is small, stable and fits: no infrastructure, no chunking bugs, perfect recall.',
      'RAG wins on cost and freshness. You pay for 4K tokens instead of 400K, and you can update one document without re-sending everything.',
      'Hybrid is the honest default: retrieve aggressively, then hand the model far more context than a classic top-5.',
      'The real failure mode is neither — it is that your chunks lost the structure the answer depended on.',
    ],
    kicker: 'Measure recall@k on your own questions before choosing. Every published benchmark used somebody else’s corpus.',
  },
  regex: {
    keys: ['regex', 'регуляр'],
    points: [
      'Months and day ranges are regular; calendars are not. You can reject month 13 and day 32, never Feb 30.',
      'Validate the shape with the pattern, then validate the value by parsing it.',
    ],
    code: {
      lang: 'js',
      body: `const ISO = /^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/;

export function isIsoDate(s) {
  if (!ISO.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return d.toISOString().slice(0, 10) === s; // kills 2026-02-30
}`,
    },
  },
  spec: {
    keys: ['spec', 'strava', 'product', 'idea', 'спек', 'продукт'],
    points: [
      'Core loop: finish a session, log it in one tap, see the streak and one friend’s reaction. Everything else is optional.',
      'The social object is the session, not the book. Books are too slow to create a feed.',
      'Metric that matters: sessions per active user per week. Pages read is vanity.',
      'Cut for v1: clubs, challenges, reviews. Ship the loop, then let the community demand the rest.',
    ],
  },
  counter: {
    keys: ['strongest argument against', 'counter', 'disagree', 'возраж'],
    points: [
      'The strongest objection is that my answer optimised for a tidy explanation rather than your actual constraints.',
      'I assumed you control the tradeoff. If someone else owns the deadline, reversibility beats correctness every time.',
      'I also treated the common case as the important case. In production the tail is what pages you at 3am.',
    ],
  },
  writing: {
    keys: ['haiku', 'poem', 'write a', 'draft', 'напиши', 'письмо', 'email'],
    points: [],
    quote: 'Server fans exhale —\nblue lights count the empty chairs,\nsomeone’s build turns green.',
    kicker: 'I can go colder and more technical, or warmer and more human — say which.',
  },
  decline: {
    keys: ['declining a meeting', 'polite but firm', 'decline'],
    points: [],
    quote:
      'Thanks for the invite. I don’t think I’ll add much live on this one — could you send the agenda and I’ll reply in writing today? Happy to jump on a call if my notes raise questions.',
    kicker: 'Firmness comes from offering a concrete alternative, not from a longer apology.',
  },
  landing: {
    keys: ['landing', 'website', 'hero section', 'лендинг', 'сайт'],
    points: [
      'One promise above the fold, one action, one proof. Everything else scrolls.',
      'Ship the hero as static markup — no framework needed for the first paint.',
      'Social proof beats feature lists at this stage; a single real quote outperforms six icons.',
    ],
    code: {
      lang: 'tsx',
      body: `export default function Hero() {
  return (
    <section className="hero">
      <h1>Notes that write themselves while you talk</h1>
      <p>Record, and get a structured summary before you close the laptop.</p>
      <a className="cta" href="#start">Start free — no card</a>
      <figure>
        <blockquote>"Cut my meeting admin from 40 minutes to 4."</blockquote>
        <figcaption>Dana R., product lead</figcaption>
      </figure>
    </section>
  );
}`,
    },
  },
  dashboard: {
    keys: ['dashboard', 'chart', 'csv', 'дашборд', 'график'],
    points: [
      'Parse once, aggregate in memory, render from a derived series — never chart the raw rows.',
      'Pick one primary metric per screen. A dashboard with six equal charts answers no question.',
      'Interactivity that pays for itself: date range, one grouping dimension, and drill-through to rows.',
    ],
    code: {
      lang: 'ts',
      body: `const byMonth = groupBy(rows, r => r.date.slice(0, 7));

const series = Object.entries(byMonth)
  .map(([month, rs]) => ({ month, revenue: sum(rs, r => r.total) }))
  .sort((a, b) => a.month.localeCompare(b.month));`,
    },
  },
  game: {
    keys: ['game', 'snake', 'игр'],
    points: [
      'Fixed timestep loop, integer grid, and input buffered to one turn per tick — that removes 90% of snake bugs.',
      'Collision check before the move commits, so the head never renders inside a wall.',
      'Neon look is two things: a dark background and an additive glow on a 2px stroke.',
    ],
    code: {
      lang: 'ts',
      body: `function tick() {
  const dir = inputQueue.shift() ?? heading;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (hitsWall(head) || hitsSelf(head)) return gameOver();
  heading = dir;
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) spawnFood();
  else snake.pop();
}`,
    },
  },
  fullstack: {
    keys: ['fullstack', 'full-stack', 'habit tracker', 'auth', 'postgres schema'],
    points: [
      'Schema first: users, habits, entries (one row per habit per day, unique index on the pair).',
      'Auth: sessions in an httpOnly cookie beats JWT-in-localStorage for a solo project.',
      'Compute streaks in SQL with a window function; never loop in application code over a year of rows.',
    ],
    code: {
      lang: 'sql',
      body: `CREATE TABLE entries (
  id         bigserial PRIMARY KEY,
  habit_id   bigint NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  day        date   NOT NULL,
  UNIQUE (habit_id, day)
);

CREATE INDEX entries_habit_day ON entries (habit_id, day DESC);`,
    },
  },
  image: {
    keys: ['image', 'photo', 'background', 'картинк', 'фото', 'edit this'],
    points: [
      'Three passes: subject mask, 2px edge feather, then a backdrop sampled from the subject’s midtones so the composite does not look pasted.',
      'Keep the original resolution until the last step — every resize eats hair and fur detail.',
      'Match the light direction, or the eye will read it as fake even if the mask is perfect.',
    ],
    kicker: 'Attach the file and I will return four variations at 2048px.',
  },
  design: {
    keys: ['screenshot', 'design to code', 'pricing page', 'макет'],
    points: [
      'Extract the type scale and spacing rhythm first; getting those two right makes the rest converge fast.',
      'Build the card as one component with a `featured` variant instead of three near-identical components.',
      'Use CSS grid with `auto-fit` so the tiers reflow on phones without a media query.',
    ],
    code: {
      lang: 'tsx',
      body: `export function PricingTier({ name, price, featured, features }: Tier) {
  return (
    <article data-featured={featured} className="tier">
      <h3>{name}</h3>
      <p className="price">\${price}<span>/mo</span></p>
      <ul>{features.map(f => <li key={f}>{f}</li>)}</ul>
      <button>{featured ? 'Start free trial' : 'Choose ' + name}</button>
    </article>
  );
}`,
    },
  },
};

const GENERIC = [
  'Start from the constraint that actually binds — usually latency, cost, or a human deadline.',
  'Write the smallest version that can fail loudly, then grow it.',
  'Measure before optimising: one profile beats ten opinions.',
  'Keep the interface stable and let the implementation churn.',
  'Leave a written trace so the next person (probably you) can undo it.',
  'Name the thing you are not going to do. Scope is a decision, not an accident.',
  'Prefer boring technology in the critical path and interesting technology at the edges.',
];

function detectTopic(prompt: string): Topic | null {
  const p = prompt.toLowerCase();
  let best: { topic: Topic; score: number } | null = null;
  for (const topic of Object.values(TOPICS)) {
    const score = topic.keys.reduce((n, k) => (p.includes(k) ? n + k.length : n), 0);
    if (score && (!best || score > best.score)) best = { topic, score };
  }
  return best?.topic ?? null;
}

/* --------------------------------------------------------------- synthesis */

export function synthesize(prompt: string, model: Model, variant = 0): string {
  const persona = LAB_STYLE[model.lab] ?? FALLBACK;
  const rnd = rng(hash(`${prompt}|${model.id}|${variant}`));
  const topic = detectTopic(prompt);
  const quality = Math.min(1, Math.max(0.2, (model.elo - 1400) / 110));
  const budget = Math.max(2, Math.round((2 + quality * 3) * persona.verbosity + rnd()));

  const pool = topic?.points.length ? topic.points : GENERIC;
  const chosen = (topic?.points.length ? pool.slice(0, budget) : shuffle(pool, rnd).slice(0, budget)).map(
    (s) => s,
  );

  const out: string[] = [persona.opener[Math.floor(rnd() * persona.opener.length)]];

  if (topic?.quote) {
    out.push(`\n> ${topic.quote}`);
  }

  if (chosen.length) {
    if (persona.layout === 'numbered') {
      out.push(`\n${chosen.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
    } else if (persona.layout === 'bullets') {
      out.push(`\n${chosen.map((s) => `• ${s}`).join('\n')}`);
    } else if (persona.layout === 'headers') {
      out.push(
        `\n${chosen
          .map((s) => {
            const m = s.match(/^(.{6,56}?)\s*([—:,])\s*(.+)$/);
            if (!m) return s;
            return `**${m[1].trim()}**${m[2] === ',' ? ' —' : ` ${m[2]}`} ${m[3]}`;
          })
          .join('\n\n')}`,
      );
    } else {
      out.push(`\n${chosen.join(' ')}`);
    }
  }

  if (topic?.code && quality > 0.35) {
    out.push(`\n\`\`\`${topic.code.lang}\n${topic.code.body}\n\`\`\``);
  }

  if (topic?.kicker) out.push(`\n${topic.kicker}`);

  if (persona.hedge && quality > 0.55) {
    out.push(
      `\n**Where this could be wrong.** I assumed the ordinary case. If your situation is unusual in one specific way, tell me which — the second point is the one that flips first.`,
    );
  }

  if (!topic && quality > 0.7) {
    out.push(
      `\n**Counterpoint.** The tidy version above assumes you control the constraints. If you don't, optimise for reversibility instead of correctness.`,
    );
  }

  out.push(`\n${persona.closer[Math.floor(rnd() * persona.closer.length)]}`);
  return out.join('\n');
}

/** Simulated streaming — returns a cancel function. */
export function stream(
  text: string,
  onChunk: (soFar: string) => void,
  opts: { speed?: number; onDone?: () => void } = {},
): () => void {
  const speed = opts.speed ?? 1;
  const tokens = text.match(/\S+\s*/g) ?? [text];
  let i = 0;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout>;

  const step = () => {
    if (cancelled) return;
    const take = 1 + Math.floor(Math.random() * 3);
    i = Math.min(tokens.length, i + take);
    onChunk(tokens.slice(0, i).join(''));
    if (i >= tokens.length) {
      opts.onDone?.();
      return;
    }
    timer = setTimeout(step, (14 + Math.random() * 46) / speed);
  };
  timer = setTimeout(step, 220 / speed);

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}

export function titleFor(prompt: string): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || 'New chat';
}
