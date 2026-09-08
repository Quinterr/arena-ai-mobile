/**
 * Agent Mode engine.
 *
 * Mirrors what Agent Mode does on arena.ai: the model builds a plan and then
 * works through it with its own tools — web search, sandbox/bash, file edits,
 * image generation — while the user can steer mid-run. Everything is
 * simulated on-device so the mode is fully explorable offline.
 *
 * To go live, replace `buildPlan`/`runStep` with your agent API's event stream;
 * the UI only consumes the `AgentSession` shape below.
 */
import type { Model } from '../data/models';

export type ToolKind = 'plan' | 'search' | 'bash' | 'write' | 'read' | 'image' | 'test' | 'note' | 'summary';

export type StepStatus = 'pending' | 'running' | 'done' | 'failed';

export type Step = {
  id: string;
  kind: ToolKind;
  title: string;
  meta?: string;
  output: string;
  full: string;
  status: StepStatus;
  ms: number;
  tokens: number;
};

export type Deliverable = { name: string; kind: 'file' | 'report' | 'image' | 'link'; detail: string };

export type AgentSession = {
  id: string;
  task: string;
  modelId: string;
  category: string;
  plan: string[];
  steps: Step[];
  deliverables: Deliverable[];
  steers: { text: string; ts: number }[];
  status: 'running' | 'done' | 'stopped';
  outcome?: 'confirmed' | 'partial' | 'failed';
  startedAt: number;
  endedAt?: number;
  tokens: number;
  cost: number;
};

let counter = 0;
const sid = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`;

/* ------------------------------------------------------------- categories */

type Blueprint = {
  category: string;
  keys: string[];
  plan: string[];
  steps: Omit<Step, 'id' | 'output' | 'status' | 'ms' | 'tokens'>[];
  deliverables: Deliverable[];
};

const BLUEPRINTS: Blueprint[] = [
  {
    category: 'Coding',
    keys: ['app', 'website', 'landing', 'build', 'code', 'react', 'api', 'bug', 'fix', 'сайт', 'приложение', 'код'],
    plan: [
      'Scope the requirements and pick a stack',
      'Scaffold the project in the sandbox',
      'Implement the core screens',
      'Install dependencies and run the build',
      'Fix whatever the build complains about',
      'Hand over the files with a short README',
    ],
    steps: [
      {
        kind: 'search',
        title: 'Search the web',
        meta: 'best practices 2026',
        full: `3 results
1. "Vite + React in 2026: the minimal setup"  vite.dev/guide
2. "Container queries are finally boring"      web.dev/cq
3. "Ship static, hydrate later"                patterns.dev/islands`,
      },
      {
        kind: 'bash',
        title: 'Create the project',
        meta: 'npm create vite@latest app -- --template react-ts',
        full: `Scaffolding project in /sandbox/app...

Done. Now run:
  cd app
  npm install
  npm run dev`,
      },
      {
        kind: 'write',
        title: 'Write src/App.tsx',
        meta: '+68 −4',
        full: `@@ src/App.tsx
+export default function App() {
+  const [items, setItems] = useState<Item[]>([]);
+
+  return (
+    <main className="shell">
+      <Header onAdd={item => setItems(x => [item, ...x])} />
+      <List items={items} />
+    </main>
+  );
+}
-export default function App() { return <div>Vite + React</div> }`,
      },
      {
        kind: 'write',
        title: 'Write src/components/List.tsx',
        meta: '+41',
        full: `@@ src/components/List.tsx
+export function List({ items }: { items: Item[] }) {
+  if (!items.length) return <Empty />;
+  return (
+    <ul className="list">
+      {items.map(i => <Row key={i.id} item={i} />)}
+    </ul>
+  );
+}`,
      },
      {
        kind: 'bash',
        title: 'Install dependencies',
        meta: 'npm install',
        full: `added 214 packages in 6s

47 packages are looking for funding`,
      },
      {
        kind: 'test',
        title: 'Run the build',
        meta: 'npm run build',
        full: `vite v6.3.1 building for production...
✓ 41 modules transformed.
dist/index.html                 0.46 kB
dist/assets/index-B7f2.css      3.12 kB
dist/assets/index-D93a.js      142.8 kB │ gzip: 46.1 kB
✓ built in 1.24s`,
      },
    ],
    deliverables: [
      { name: 'app/', kind: 'file', detail: '9 files · 312 lines' },
      { name: 'README.md', kind: 'report', detail: 'Setup and deploy notes' },
    ],
  },
  {
    category: 'Research',
    keys: ['research', 'compare', 'market', 'find', 'look up', 'analys', 'исслед', 'сравни'],
    plan: [
      'Break the question into sub-questions',
      'Search primary sources',
      'Cross-check the numbers',
      'Write the brief with citations',
    ],
    steps: [
      {
        kind: 'search',
        title: 'Search the web',
        meta: 'primary sources',
        full: `5 results
1. Official filing (PDF, 2026-07)        sec.gov/…
2. Vendor pricing page                    …/pricing
3. Independent benchmark, n=1,204         …/bench
4. Community thread with counterexamples  …/thread
5. Press release (treat as marketing)     …/news`,
      },
      {
        kind: 'read',
        title: 'Read 3 sources',
        meta: '18,400 tokens',
        full: `Extracted:
• Headline number: 42% adoption — but the sample is self-selected.
• Independent benchmark puts it at 27% ± 4%.
• Pricing changed in May 2026; older comparisons are stale.`,
      },
      {
        kind: 'bash',
        title: 'Sanity-check the maths',
        meta: 'python3 - <<EOF',
        full: `>>> 1204 * 0.27
325.08
>>> ci = 1.96 * (0.27*0.73/1204) ** 0.5
>>> round(ci * 100, 1)
2.5
Confidence interval tighter than the vendor claims.`,
      },
      {
        kind: 'write',
        title: 'Write brief.md',
        meta: '1,120 words',
        full: `@@ brief.md
+## Bottom line
+The 42% figure is not defensible; 27% ± 2.5% is.
+
+## What we verified
+…
+
+## Sources
+[1] sec.gov filing, 2026-07
+[2] independent benchmark, n=1,204`,
      },
    ],
    deliverables: [
      { name: 'brief.md', kind: 'report', detail: '1,120 words · 6 sources' },
    ],
  },
  {
    category: 'Planning',
    keys: ['plan', 'launch', 'roadmap', 'strategy', 'itinerary', 'organi', 'план', 'запуск'],
    plan: [
      'Clarify the goal and the deadline',
      'Draft the milestone tree',
      'Pressure-test the risky assumptions',
      'Produce the calendar and owner list',
    ],
    steps: [
      {
        kind: 'note',
        title: 'Frame the problem',
        meta: 'no tool needed',
        full: `Goal restated: ship in 6 weeks with one engineer and no paid acquisition.
Binding constraint: engineering hours, not budget.`,
      },
      {
        kind: 'search',
        title: 'Search the web',
        meta: 'comparable launches',
        full: `4 results
1. Post-mortem: "We launched in 5 weeks and it nearly worked"
2. Checklist template (CC-BY)
3. Pricing-page teardown
4. Launch-day incident report — useful failure modes`,
      },
      {
        kind: 'write',
        title: 'Write plan.md',
        meta: '4 milestones · 17 tasks',
        full: `@@ plan.md
+W1–W2  Core flow, no auth, dogfood internally
+W3     Auth + billing (buy, don't build)
+W4     Private beta, 20 users, daily calls
+W5     Fix the top 3 complaints only
+W6     Launch. Freeze scope on Monday.
+
+Risk: W3 slips if the billing vendor review takes >5 days.`,
      },
      {
        kind: 'image',
        title: 'Generate the timeline graphic',
        meta: '1600×900',
        full: `Rendered timeline.png — 4 swimlanes, milestone markers, risk band on W3.`,
      },
    ],
    deliverables: [
      { name: 'plan.md', kind: 'report', detail: '4 milestones · 17 tasks' },
      { name: 'timeline.png', kind: 'image', detail: '1600×900' },
    ],
  },
  {
    category: 'Data analysis',
    keys: ['csv', 'data', 'chart', 'dashboard', 'sql', 'metrics', 'данны', 'график'],
    plan: [
      'Load the dataset and profile it',
      'Clean the obvious problems',
      'Compute the metrics that matter',
      'Chart it and write the findings',
    ],
    steps: [
      {
        kind: 'read',
        title: 'Read sales.csv',
        meta: '48,201 rows',
        full: `columns: date, region, sku, units, total, channel
nulls:   total 0.4%, region 0.0%
dtypes:  date→object (needs parsing)`,
      },
      {
        kind: 'bash',
        title: 'Profile and clean',
        meta: 'python3 clean.py',
        full: `Parsed dates             ✓
Dropped 193 null totals  ✓
Deduped 41 exact rows    ✓
Wrote clean.parquet (2.1 MB)`,
      },
      {
        kind: 'bash',
        title: 'Compute metrics',
        meta: 'python3 metrics.py',
        full: `Revenue YTD        $4,182,905
MoM growth (3mo)   +6.1%, +2.4%, −0.8%
Top SKU            AR-114 (18.2% of revenue)
Warning: EMEA has 3 months of missing data — excluded from growth.`,
      },
      {
        kind: 'image',
        title: 'Render charts',
        meta: '3 charts',
        full: `revenue_by_month.png, mix_by_channel.png, cohort_retention.png`,
      },
    ],
    deliverables: [
      { name: 'findings.md', kind: 'report', detail: '5 findings · 1 caveat' },
      { name: 'charts/', kind: 'image', detail: '3 charts' },
    ],
  },
  {
    category: 'Automation',
    keys: ['automate', 'script', 'cron', 'workflow', 'integrat', 'автоматиз', 'скрипт'],
    plan: [
      'Map the manual steps',
      'Write the script',
      'Dry-run it in the sandbox',
      'Schedule it and add a failure alert',
    ],
    steps: [
      {
        kind: 'write',
        title: 'Write sync.ts',
        meta: '+94',
        full: `@@ sync.ts
+const since = await readCursor();
+const rows = await source.fetchSince(since);
+for (const batch of chunk(rows, 500)) {
+  await target.upsert(batch);
+  await writeCursor(batch.at(-1)!.updatedAt);
+}`,
      },
      {
        kind: 'bash',
        title: 'Dry run',
        meta: 'node sync.ts --dry-run',
        full: `fetched 1,284 rows since 2026-09-01
would upsert 1,284 rows in 3 batches
cursor would advance to 2026-09-08T09:12:00Z
no writes performed (dry run)`,
      },
      {
        kind: 'bash',
        title: 'Schedule it',
        meta: 'crontab',
        full: `*/15 * * * * cd /srv/sync && node sync.ts >> sync.log 2>&1
Installed. Next run in 7 minutes.`,
      },
    ],
    deliverables: [{ name: 'sync.ts', kind: 'file', detail: '94 lines · cron every 15m' }],
  },
];

const FALLBACK = BLUEPRINTS[0];

export function classify(task: string): Blueprint {
  const t = task.toLowerCase();
  let best: { bp: Blueprint; score: number } | null = null;
  for (const bp of BLUEPRINTS) {
    const score = bp.keys.reduce((n, k) => (t.includes(k) ? n + k.length : n), 0);
    if (score && (!best || score > best.score)) best = { bp, score };
  }
  return best?.bp ?? FALLBACK;
}

export const AGENT_TASKS = [
  'Build a landing page for my bakery with a menu and an order form.',
  'Research which vector database fits a 5M-document corpus on a $200/mo budget.',
  'Plan a 6-week launch for a solo-founder SaaS and give me the calendar.',
  'Analyse this sales CSV and tell me which SKU is quietly dying.',
  'Automate the nightly sync between our CRM and Postgres, with alerts.',
];

/* ------------------------------------------------------------------ engine */

function mkStep(base: Omit<Step, 'id' | 'output' | 'status' | 'ms' | 'tokens'>): Step {
  return { ...base, id: sid(), output: '', status: 'pending', ms: 0, tokens: 0 };
}

export function createSession(task: string, model: Model): AgentSession {
  const bp = classify(task);
  const quality = Math.min(1, Math.max(0, ((model.agentNet ?? 0) + 10) / 26));

  const steps = [
    mkStep({
      kind: 'plan',
      title: 'Build a plan',
      meta: `${bp.plan.length} steps`,
      full: bp.plan.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    }),
    ...bp.steps.map((s) => mkStep(s)),
  ];

  // Weaker agents stumble — and then have to recover, exactly the signal the
  // Agent Arena measures with "bash recovery steps".
  if (quality < 0.55) {
    const at = Math.max(2, Math.floor(steps.length / 2));
    steps.splice(
      at,
      0,
      mkStep({
        kind: 'bash',
        title: 'Command failed',
        meta: 'exit code 1',
        full: `Error: ENOENT: no such file or directory, open 'src/config.ts'
    at Object.openSync (node:fs:601:3)

The agent referenced a file it never created.`,
      }),
      mkStep({
        kind: 'bash',
        title: 'Recover',
        meta: `${quality < 0.35 ? 4 : 2} extra steps`,
        full: `ls -la src/
created src/config.ts from the template
re-running the previous command… ok`,
      }),
    );
  }

  steps.push(
    mkStep({
      kind: 'summary',
      title: 'Summarise the run',
      meta: 'handover',
      full: `Done. ${bp.deliverables.map((d) => d.name).join(', ')} are in the sandbox.

What I would do next: ${
        bp.category === 'Coding'
          ? 'wire a real datastore and add one end-to-end test before you deploy.'
          : bp.category === 'Research'
          ? 'interview two practitioners — the public numbers disagree with each other.'
          : 'lock the scope and review the risky milestone on Monday.'
      }`,
    }),
  );

  return {
    id: sid(),
    task,
    modelId: model.id,
    category: bp.category,
    plan: bp.plan,
    steps,
    deliverables: bp.deliverables,
    steers: [],
    status: 'running',
    startedAt: Date.now(),
    tokens: 0,
    cost: 0,
  };
}

export type RunController = {
  stop: () => void;
  steer: (text: string) => void;
};

/**
 * Walks the session's steps, streaming each tool's output.
 * `onUpdate` receives an immutable copy after every tick.
 */
export function runSession(
  initial: AgentSession,
  model: Model,
  onUpdate: (s: AgentSession) => void,
  onDone?: (s: AgentSession) => void,
): RunController {
  let session: AgentSession = { ...initial, steps: initial.steps.map((s) => ({ ...s })) };
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout>;
  let index = 0;

  const speed = 0.55 + model.speed;
  const rate = (model.priceOut ?? 8) / 1_000_000;

  const push = () => onUpdate({ ...session, steps: session.steps.map((s) => ({ ...s })) });

  const finish = () => {
    session = { ...session, status: 'done', endedAt: Date.now() };
    push();
    onDone?.(session);
  };

  const runStep = () => {
    if (cancelled) return;
    if (index >= session.steps.length) return finish();

    const step = session.steps[index];
    step.status = 'running';
    push();

    const lines = step.full.split('\n');
    let line = 0;
    const startedAt = Date.now();

    const tick = () => {
      if (cancelled) return;
      line = Math.min(lines.length, line + 1);
      step.output = lines.slice(0, line).join('\n');
      step.tokens += 40 + Math.round(Math.random() * 90);
      session.tokens += 40 + Math.round(Math.random() * 90);
      session.cost = session.tokens * rate * 6;
      push();

      if (line >= lines.length) {
        step.status = step.title === 'Command failed' ? 'failed' : 'done';
        step.ms = Date.now() - startedAt;
        push();
        index += 1;
        timer = setTimeout(runStep, 260 / speed);
        return;
      }
      timer = setTimeout(tick, (90 + Math.random() * 190) / speed);
    };

    timer = setTimeout(tick, (300 + Math.random() * 300) / speed);
  };

  timer = setTimeout(runStep, 400);

  return {
    stop: () => {
      cancelled = true;
      clearTimeout(timer);
      session = {
        ...session,
        status: 'stopped',
        endedAt: Date.now(),
        steps: session.steps.map((s) => (s.status === 'running' ? { ...s, status: 'done' } : s)),
      };
      push();
      onDone?.(session);
    },
    steer: (text: string) => {
      if (cancelled) return;
      session.steers = [...session.steers, { text, ts: Date.now() }];
      const applied = mkStep({
        kind: 'note',
        title: 'Steering applied',
        meta: 'user correction',
        full: `You: ${text}

Adjusting the plan: dropping the optional step, re-prioritising the rest.`,
      });
      session.steps = [
        ...session.steps.slice(0, index + 1),
        applied,
        ...session.steps.slice(index + 1),
      ];
      push();
    },
  };
}

export const TOOL_LABEL: Record<ToolKind, string> = {
  plan: 'Plan',
  search: 'Web search',
  bash: 'Sandbox',
  write: 'File edit',
  read: 'Read',
  image: 'Image gen',
  test: 'Build',
  note: 'Note',
  summary: 'Summary',
};
