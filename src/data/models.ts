/**
 * Model catalog.
 *
 * Seeded from the public Arena leaderboards (Text Arena — Sep 2, 2026,
 * Agent Arena — Sep 5, 2026). The app ships this snapshot so the whole
 * leaderboard works offline; `src/lib/api.ts` can swap it for a live feed.
 */

export type Category = 'text' | 'agent' | 'webdev' | 'image' | 'vision';

export type Model = {
  id: string;
  name: string;
  lab: string;
  license: string;
  /** Arena Elo score in the Text Arena */
  elo: number;
  ci: number;
  votes: number;
  /** Agent Arena net-improvement %, undefined when not ranked there */
  agentNet?: number;
  success?: number;
  steerability?: number;
  hallucination?: number;
  sessions?: number;
  costPerTask?: number;
  priceIn?: number;
  priceOut?: number;
  context?: string;
  /** relative speed 0..1 (tok/s, normalised) */
  speed: number;
  /** rank change vs last week, positive = climbed */
  delta: number;
  modalities: Category[];
  blurb: string;
};

export const MODELS: Model[] = [
  { id: 'claude-fable-5-1-max', name: 'Claude Fable 5.1 (Max)', lab: 'Anthropic', license: 'Proprietary', elo: 1504, ci: 11, votes: 2906, agentNet: 15.87, success: 22.45, steerability: 0.58, hallucination: 0.78, sessions: 6796, costPerTask: 4.3, priceIn: 10, priceOut: 50, context: '1M', speed: 0.42, delta: 12, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Long-horizon agentic work with the strongest task-completion signal on Arena.' },
  { id: 'claude-fable-5', name: 'Claude Fable 5', lab: 'Anthropic', license: 'Proprietary', elo: 1507, ci: 5, votes: 27189, agentNet: 10.23, success: 7.37, steerability: 11.89, hallucination: 0.78, sessions: 36204, costPerTask: 2.37, priceIn: 10, priceOut: 50, context: '1M', speed: 0.5, delta: 5, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Top of the Text Arena — dense prose, careful reasoning, wide tool use.' },
  { id: 'claude-opus-5-high', name: 'Claude Opus 5 (High)', lab: 'Anthropic', license: 'Proprietary', elo: 1493, ci: 5, votes: 35174, agentNet: 12.68, success: 13.3, steerability: 16.09, hallucination: 0.73, sessions: 22594, costPerTask: 2.42, priceIn: 5, priceOut: 25, context: '1M', speed: 0.48, delta: 11, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Lands user corrections better than anything else in the arena.' },
  { id: 'claude-opus-5-max', name: 'Claude Opus 5 (Max)', lab: 'Anthropic', license: 'Proprietary', elo: 1488, ci: 6, votes: 17119, agentNet: 11.67, success: 14.89, steerability: 9.7, hallucination: 0.76, sessions: 18112, costPerTask: 3.65, priceIn: 5, priceOut: 25, context: '1M', speed: 0.4, delta: 13, modalities: ['text', 'agent', 'webdev'], blurb: 'Recovers from failed shell commands in the fewest steps.' },
  { id: 'claude-opus-4-6-high', name: 'Claude Opus 4.6 (High)', lab: 'Anthropic', license: 'Proprietary', elo: 1505, ci: 4, votes: 72099, agentNet: 4.65, success: 2.5, steerability: 4.58, hallucination: 0.78, sessions: 36366, priceIn: 5, priceOut: 25, context: '1M', speed: 0.55, delta: 5, modalities: ['text', 'agent', 'vision'], blurb: 'The workhorse: cheap enough to run all day, still near the very top.' },
  { id: 'claude-opus-4-7-high', name: 'Claude Opus 4.7 (High)', lab: 'Anthropic', license: 'Proprietary', elo: 1502, ci: 4, votes: 60103, agentNet: 6.03, success: 3.51, steerability: 5.69, hallucination: 0.7, sessions: 36571, priceIn: 5, priceOut: 25, context: '1M', speed: 0.53, delta: 8, modalities: ['text', 'agent', 'vision'], blurb: 'Balanced reasoning model, strong on refactors and long code review.' },
  { id: 'claude-opus-4-8-high', name: 'Claude Opus 4.8 (High)', lab: 'Anthropic', license: 'Proprietary', elo: 1482, ci: 4, votes: 48727, agentNet: 9.17, success: 5.27, steerability: 12.59, hallucination: 0.24, sessions: 38148, costPerTask: 1.56, priceIn: 5, priceOut: 25, context: '1M', speed: 0.57, delta: 22, modalities: ['text', 'agent', 'webdev'], blurb: 'Lowest tool-hallucination rate among the Anthropic line.' },
  { id: 'claude-sonnet-5-high', name: 'Claude Sonnet 5 (High)', lab: 'Anthropic', license: 'Proprietary', elo: 1470, ci: 5, votes: 28662, agentNet: 7.41, success: 2.8, steerability: 11.52, hallucination: 0.63, sessions: 28662, costPerTask: 0.89, priceIn: 2, priceOut: 10, context: '1M', speed: 0.72, delta: 12, modalities: ['text', 'agent', 'webdev'], blurb: 'Best price/performance in the Anthropic family for agent loops.' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', lab: 'Anthropic', license: 'Proprietary', elo: 1472, ci: 4, votes: 66316, agentNet: 0.5, success: 5.9, steerability: 0.99, hallucination: 0.71, sessions: 39399, costPerTask: 0.67, priceIn: 1.5, priceOut: 7.5, context: '1M', speed: 0.78, delta: -10, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Fast, cheap, still competitive on everyday chat.' },

  { id: 'gpt-5-6-sol-xhigh', name: 'GPT 5.6 Sol (xHigh)', lab: 'OpenAI', license: 'Proprietary', elo: 1483, ci: 5, votes: 23413, agentNet: 9.31, success: 6.68, steerability: 8.88, hallucination: 0.78, sessions: 29730, costPerTask: 1.21, priceIn: 4, priceOut: 20, context: '400K', speed: 0.46, delta: 305, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Least likely to hallucinate tools it does not have. Huge jump this month.' },
  { id: 'gpt-5-6-terra-xhigh', name: 'GPT 5.6 Terra (xHigh)', lab: 'OpenAI', license: 'Proprietary', elo: 1466, ci: 5, votes: 24200, agentNet: 3.04, success: 2.84, steerability: 8.54, hallucination: 0.78, sessions: 17972, costPerTask: 0.46, priceIn: 2, priceOut: 12, context: '400K', speed: 0.62, delta: 15, modalities: ['text', 'agent', 'webdev'], blurb: 'Mid-tier Terra tuning: cheaper reasoning with solid steerability.' },
  { id: 'gpt-5-6-luna-xhigh', name: 'GPT 5.6 Luna (xHigh)', lab: 'OpenAI', license: 'Proprietary', elo: 1451, ci: 6, votes: 19435, agentNet: 2.09, success: 0.83, steerability: 1.83, hallucination: 0.78, sessions: 19435, costPerTask: 0.09, priceIn: 0.2, priceOut: 1.2, context: '400K', speed: 0.92, delta: 8, modalities: ['text', 'agent'], blurb: 'Nine cents a task. The budget option that still reasons.' },
  { id: 'gpt-5-5-high', name: 'GPT 5.5 (High)', lab: 'OpenAI', license: 'Proprietary', elo: 1482, ci: 4, votes: 63547, agentNet: 5.55, success: 1.2, steerability: 5.08, hallucination: 0.78, sessions: 73882, priceIn: 5, priceOut: 30, context: '1.1M', speed: 0.5, delta: -4, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Reliable generalist with the largest context window on the board.' },
  { id: 'gpt-5-5', name: 'GPT 5.5', lab: 'OpenAI', license: 'Proprietary', elo: 1477, ci: 4, votes: 64977, agentNet: 4.39, success: 0.95, steerability: 5.11, hallucination: 0.78, sessions: 79166, costPerTask: 0.56, priceIn: 5, priceOut: 30, context: '1.1M', speed: 0.65, delta: 2, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Default GPT tier — snappy answers, dependable formatting.' },
  { id: 'gpt-5-4-high', name: 'GPT 5.4 (High)', lab: 'OpenAI', license: 'Proprietary', elo: 1477, ci: 4, votes: 60624, agentNet: 2.99, success: 1.14, steerability: 4.16, hallucination: 0.78, sessions: 78359, costPerTask: 0.63, priceIn: 2.5, priceOut: 15, context: '1.1M', speed: 0.6, delta: -6, modalities: ['text', 'agent', 'vision'], blurb: 'Previous flagship, now the value pick for long documents.' },
  { id: 'gpt-5-5-instant', name: 'GPT 5.5 Instant', lab: 'OpenAI', license: 'Proprietary', elo: 1474, ci: 5, votes: 25860, priceIn: 5, priceOut: 30, context: '1.1M', speed: 0.96, delta: 3, modalities: ['text', 'vision'], blurb: 'Sub-second first token. Built for voice and live UX.' },

  { id: 'gemini-3-8-flash-high', name: 'Gemini 3.8 Flash (High)', lab: 'Google', license: 'Proprietary', elo: 1494, ci: 9, votes: 5125, agentNet: 5.47, success: 10.42, steerability: 1.73, hallucination: 0.7, sessions: 10104, costPerTask: 0.22, priceIn: 0.75, priceOut: 3.75, context: '1M', speed: 0.88, delta: 21, modalities: ['text', 'agent', 'webdev', 'vision', 'image'], blurb: 'Preliminary score, already top-10. Absurd quality per dollar.' },
  { id: 'gemini-3-7-flash-high', name: 'Gemini 3.7 Flash (High)', lab: 'Google', license: 'Proprietary', elo: 1491, ci: 8, votes: 5682, agentNet: 0.43, success: 9.54, steerability: 5.98, hallucination: 0.71, sessions: 24413, priceIn: 0.75, priceOut: 3.75, context: '1M', speed: 0.9, delta: 14, modalities: ['text', 'agent', 'vision', 'image'], blurb: 'The everyday Flash: quick, multimodal, dirt cheap.' },
  { id: 'gemini-3-1-pro-preview', name: 'Gemini 3.1 Pro Preview', lab: 'Google', license: 'Proprietary', elo: 1487, ci: 3, votes: 102999, agentNet: -3.73, success: 2.55, steerability: 2.05, hallucination: 0.53, sessions: 84469, costPerTask: 0.31, priceIn: 1, priceOut: 6, context: '1M', speed: 0.58, delta: -3, modalities: ['text', 'agent', 'webdev', 'vision', 'image'], blurb: 'Most-voted model on the board — the crowd knows it well.' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', lab: 'Google', license: 'Proprietary', elo: 1486, ci: 4, votes: 40668, priceIn: 2, priceOut: 12, context: '1M', speed: 0.55, delta: -2, modalities: ['text', 'webdev', 'vision', 'image'], blurb: 'Strong multimodal grounding and chart reading.' },
  { id: 'gemini-3-6-flash-high', name: 'Gemini 3.6 Flash (High)', lab: 'Google', license: 'Proprietary', elo: 1480, ci: 5, votes: 22286, agentNet: -3.58, success: 2.49, steerability: 3.34, hallucination: 0.69, sessions: 18309, costPerTask: 0.37, priceIn: 0.75, priceOut: 3.75, context: '1M', speed: 0.87, delta: 6, modalities: ['text', 'agent', 'vision'], blurb: 'Solid Flash iteration, great for RAG pipelines.' },
  { id: 'gemini-3-5-flash-high', name: 'Gemini 3.5 Flash (High)', lab: 'Google', license: 'Proprietary', elo: 1479, ci: 4, votes: 34180, agentNet: -3.48, success: 1.62, steerability: 7.8, hallucination: 0.11, sessions: 94447, priceIn: 0.75, priceOut: 4.5, context: '1M', speed: 0.89, delta: -1, modalities: ['text', 'agent', 'vision'], blurb: 'Lowest hallucination rate in the Flash line.' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', lab: 'Google', license: 'Proprietary', elo: 1474, ci: 4, votes: 30244, agentNet: -12.11, success: 8.67, steerability: 10.5, hallucination: 1.24, sessions: 83413, priceIn: 0.5, priceOut: 3, context: '1M', speed: 0.94, delta: -9, modalities: ['text', 'vision', 'image'], blurb: 'Great chat model, weaker when handed a shell.' },
  { id: 'gemma-4-31b', name: 'Gemma 4 31B', lab: 'Google', license: 'Apache 2.0', elo: 1402, ci: 6, votes: 56661, agentNet: -23.7, success: 3.41, steerability: 10.7, hallucination: 28.37, sessions: 56661, priceIn: 0.99, priceOut: 1.49, context: '256K', speed: 0.93, delta: -1, modalities: ['text'], blurb: 'Open weights you can actually run. Keep it away from tools.' },

  { id: 'kimi-k3-max', name: 'Kimi K3 (Max)', lab: 'Moonshot', license: 'Kimi K3 license', elo: 1489, ci: 5, votes: 18090, agentNet: 7.96, success: 16.58, steerability: 1.24, hallucination: 0.78, sessions: 97915, costPerTask: 0.81, priceIn: 3, priceOut: 15, context: '512K', speed: 0.6, delta: 12, modalities: ['text', 'agent', 'webdev'], blurb: 'The open-ish challenger: #7 on agents at a fraction of the price.' },
  { id: 'kimi-k2-7-code', name: 'Kimi K2.7 Code', lab: 'Moonshot', license: 'Modified MIT', elo: 1461, ci: 7, votes: 11142, agentNet: 0.75, success: 1.15, steerability: 4.68, hallucination: 0.78, sessions: 11142, priceIn: 0.71, priceOut: 3.5, context: '256K', speed: 0.7, delta: 4, modalities: ['text', 'agent', 'webdev'], blurb: 'Code-specialised sibling with permissive-ish weights.' },
  { id: 'kimi-k2-6', name: 'Kimi K2.6', lab: 'Moonshot', license: 'Modified MIT', elo: 1455, ci: 6, votes: 11279, agentNet: 0.29, success: 5.43, steerability: 7.73, hallucination: 0.78, sessions: 11279, priceIn: 0.95, priceOut: 4, context: '256K', speed: 0.74, delta: 10, modalities: ['text', 'agent'], blurb: 'Previous gen, still a bargain for long-form writing.' },

  { id: 'glm-5-3-max', name: 'GLM 5.3 (Max)', lab: 'Z.ai', license: 'MIT', elo: 1482, ci: 7, votes: 7668, agentNet: 3.8, success: 12.1, steerability: 0.63, hallucination: 0.78, sessions: 53898, costPerTask: 0.46, priceIn: 1.4, priceOut: 4.4, context: '1M', speed: 0.66, delta: 30, modalities: ['text', 'agent', 'webdev'], blurb: 'Fully MIT weights inside the top 25. The open-source high-water mark.' },
  { id: 'glm-5-3-flash', name: 'GLM 5.3 Flash', lab: 'Z.ai', license: 'MIT', elo: 1474, ci: 9, votes: 4672, agentNet: 3.67, success: 14.14, steerability: 0.23, hallucination: 0.78, sessions: 18992, costPerTask: 0.11, priceIn: 0.07, priceOut: 0.25, context: '1M', speed: 0.95, delta: 30, modalities: ['text', 'agent'], blurb: 'Seven cents per million input tokens. Yes, really.' },
  { id: 'glm-5-2-max', name: 'GLM 5.2 (Max)', lab: 'Z.ai', license: 'MIT', elo: 1472, ci: 5, votes: 33966, agentNet: 6.03, success: 8.63, steerability: 4.48, hallucination: 0.78, sessions: 69385, costPerTask: 0.62, priceIn: 1.4, priceOut: 4.4, context: '1M', speed: 0.68, delta: 21, modalities: ['text', 'agent', 'webdev'], blurb: 'Battle-tested open model with a huge agent sample size.' },

  { id: 'grok-4-5', name: 'Grok 4.5', lab: 'SpaceXAI', license: 'Proprietary', elo: 1471, ci: 5, votes: 26158, agentNet: 5.73, success: 6.3, steerability: 6.84, hallucination: 0.78, sessions: 35237, costPerTask: 0.51, priceIn: 2, priceOut: 6, context: '500K', speed: 0.75, delta: 23, modalities: ['text', 'agent', 'vision'], blurb: 'Punchy voice, fast tools, cheap output tokens.' },
  { id: 'grok-4-6-xhigh', name: 'Grok 4.6 (xHigh)', lab: 'SpaceXAI', license: 'Proprietary', elo: 1469, ci: 6, votes: 18119, agentNet: 4.98, success: 7.83, steerability: 3.86, hallucination: 0.78, sessions: 18119, costPerTask: 0.99, priceIn: 2.5, priceOut: 8, context: '500K', speed: 0.64, delta: 28, modalities: ['text', 'agent'], blurb: 'Newest xHigh tier, climbing fast on agentic tasks.' },
  { id: 'grok-4-20-beta1', name: 'Grok 4.20 Beta', lab: 'SpaceXAI', license: 'Proprietary', elo: 1475, ci: 5, votes: 26630, priceIn: 1.25, priceOut: 2.5, context: '1M', speed: 0.7, delta: 17, modalities: ['text', 'vision'], blurb: 'Beta channel — volatile scores, occasional brilliance.' },
  { id: 'grok-build-0-1', name: 'Grok Build 0.1', lab: 'SpaceXAI', license: 'Proprietary', elo: 1430, ci: 6, votes: 74459, agentNet: -12.95, success: 7.43, steerability: 6.74, hallucination: 0.46, sessions: 74459, speed: 0.8, delta: -6, modalities: ['text', 'webdev', 'agent'], blurb: 'App-building preview. Great scaffolds, shaky recovery.' },

  { id: 'qwen3-8-max', name: 'Qwen3.8 Max', lab: 'Alibaba', license: 'Proprietary', elo: 1480, ci: 6, votes: 13346, agentNet: 5.51, success: 10.37, steerability: 4.15, hallucination: 0.28, sessions: 20691, costPerTask: 0.46, priceIn: 2, priceOut: 6, context: '1M', speed: 0.69, delta: 24, modalities: ['text', 'agent', 'webdev', 'vision'], blurb: 'Multilingual monster — strongest non-English scores on Arena.' },
  { id: 'qwen3-8-flash-next', name: 'Qwen3.8 Flash Next', lab: 'Alibaba', license: 'Qwen-community-1.0', elo: 1462, ci: 7, votes: 20296, agentNet: 2.61, success: 12.46, steerability: 1.18, hallucination: 0.39, sessions: 20296, priceIn: 0.16, priceOut: 0.47, context: '1M', speed: 0.97, delta: 18, modalities: ['text', 'agent'], blurb: 'Fastest tokens per second in the catalog.' },
  { id: 'qwen3-8-27b', name: 'Qwen 3.8 27B', lab: 'Alibaba', license: 'Apache 2.0', elo: 1448, ci: 8, votes: 22585, agentNet: 1.03, success: 6.98, steerability: 0.39, hallucination: 0.08, sessions: 22585, costPerTask: 0.35, priceIn: 0.4, priceOut: 3, context: '256K', speed: 0.85, delta: 10, modalities: ['text', 'agent'], blurb: 'Apache-2.0 weights that fit on a single node.' },

  { id: 'deepseek-v4-pro-high', name: 'DeepSeek V4 Pro (High)', lab: 'DeepSeek', license: 'MIT', elo: 1468, ci: 5, votes: 34397, agentNet: 5.43, success: 11.75, steerability: 0.67, hallucination: 0.78, sessions: 34397, costPerTask: 0.23, context: '256K', speed: 0.63, delta: 23, modalities: ['text', 'agent', 'webdev'], blurb: 'MIT-licensed reasoning at 23 cents a task.' },
  { id: 'deepseek-v4-flash-high', name: 'DeepSeek V4 Flash (High)', lab: 'DeepSeek', license: 'MIT', elo: 1459, ci: 6, votes: 57183, agentNet: 3.29, success: 8.46, steerability: 0.02, hallucination: 0.76, sessions: 57183, costPerTask: 0.16, context: '256K', speed: 0.86, delta: 31, modalities: ['text', 'agent'], blurb: 'Cheap, fast, open. The default for high-volume pipelines.' },

  { id: 'muse-spark-1-2-xhigh', name: 'Muse Spark 1.2 (xHigh)', lab: 'Meta', license: 'Proprietary', elo: 1499, ci: 10, votes: 3240, agentNet: 0.46, success: 6.6, steerability: 6.19, hallucination: 0.77, sessions: 20816, costPerTask: 0.29, priceIn: 1.25, priceOut: 4.25, context: '512K', speed: 0.61, delta: 16, modalities: ['text', 'agent', 'vision', 'image'], blurb: 'Meta’s comeback: #5 in text with only 3.2K votes so far.' },
  { id: 'muse-spark-1-1', name: 'Muse Spark 1.1', lab: 'Meta', license: 'Proprietary', elo: 1492, ci: 5, votes: 24064, agentNet: -1.43, success: 5.01, steerability: 5.79, hallucination: 0.77, sessions: 91294, costPerTask: 0.52, priceIn: 1.25, priceOut: 4.25, context: '512K', speed: 0.73, delta: 14, modalities: ['text', 'agent', 'image'], blurb: 'Creative writing favourite with a warm default voice.' },

  { id: 'hy4-preview', name: 'Hy4 Preview', lab: 'Tencent', license: 'Apache 2.0', elo: 1466, ci: 8, votes: 14405, agentNet: 6.92, success: 13.56, steerability: 0.1, hallucination: 0.66, sessions: 14405, costPerTask: 0.27, priceIn: 0.83, priceOut: 2.5, context: '256K', speed: 0.71, delta: 20, modalities: ['text', 'agent', 'image'], blurb: 'Apache 2.0 and #10 on agents. The surprise of the month.' },
  { id: 'minimax-m3', name: 'MiniMax M3', lab: 'MiniMax', license: 'MiniMax Community', elo: 1457, ci: 6, votes: 36707, agentNet: -3.76, success: 8.25, steerability: 5.48, hallucination: 0.39, sessions: 36707, costPerTask: 0.13, priceIn: 0.3, priceOut: 1.2, context: '1M', speed: 0.84, delta: 8, modalities: ['text', 'agent', 'image'], blurb: 'Video-native lab, strong on structured extraction.' },
  { id: 'mimo-v2-5-pro', name: 'Mimo V2.5 Pro', lab: 'Xiaomi', license: 'MIT', elo: 1468, ci: 4, votes: 57649, agentNet: -3.81, success: 5.56, steerability: 2.64, hallucination: 0.36, sessions: 37593, costPerTask: 0.05, priceIn: 0.43, priceOut: 0.87, context: '1.1M', speed: 0.88, delta: 5, modalities: ['text', 'agent'], blurb: 'Five cents a task and MIT weights. Phone-friendly distills too.' },
  { id: 'inkling', name: 'Inkling', lab: 'Thinky', license: 'Apache 2.0', elo: 1441, ci: 7, votes: 40752, agentNet: -7.47, success: 16.01, steerability: 8.29, hallucination: 0.35, sessions: 40752, costPerTask: 0.24, priceIn: 1, priceOut: 4.05, context: '256K', speed: 0.76, delta: -9, modalities: ['text', 'agent'], blurb: 'High task-completion, low net improvement — a fascinating split.' },
  { id: 'mistral-medium-3-5', name: 'Mistral Medium 3.5', lab: 'Mistral', license: 'Modified MIT', elo: 1438, ci: 8, votes: 8793, agentNet: -7.16, success: 14.49, steerability: 0.5, hallucination: 2.08, sessions: 8793, costPerTask: 0.67, priceIn: 0.75, priceOut: 3.75, context: '256K', speed: 0.82, delta: -2, modalities: ['text', 'agent'], blurb: 'European option with excellent French and German.' },
  { id: 'nemotron-3-ultra', name: 'Nemotron 3 Ultra', lab: 'Nvidia', license: 'OpenMDW-1.1', elo: 1425, ci: 9, votes: 12264, agentNet: -14.43, success: 15.71, steerability: 9.71, hallucination: 0.23, sessions: 12264, speed: 0.67, delta: -7, modalities: ['text', 'agent'], blurb: 'Tuned for on-prem GPU fleets rather than leaderboard glory.' },
  { id: 'solar-pro-4', name: 'Solar Pro 4', lab: 'Upstage', license: 'Proprietary', elo: 1420, ci: 12, votes: 5770, agentNet: -9.87, success: 8.6, steerability: 1.32, hallucination: 0.79, sessions: 5770, priceIn: 0.03, priceOut: 0.12, context: '128K', speed: 0.91, delta: -6, modalities: ['text', 'agent'], blurb: 'Cheapest tokens on the board, Korean-first.' },
  { id: 'ernie-5-1', name: 'ERNIE 5.1', lab: 'Baidu', license: 'Proprietary', elo: 1468, ci: 5, votes: 37129, context: '512K', speed: 0.72, delta: 7, modalities: ['text', 'vision', 'image'], blurb: 'Chinese-language leader with strong OCR.' },
];

export const byId = (id: string) => MODELS.find((m) => m.id === id);

export const LABS = Array.from(new Set(MODELS.map((m) => m.lab)));

/** Deterministic pseudo-random history so sparklines are stable across renders. */
export function history(id: string, points = 14, base = 1450): number[] {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 100000;
  const out: number[] = [];
  let v = base - 24;
  for (let i = 0; i < points; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r = (seed / 2147483648) * 2 - 1;
    v += r * 7 + (base - v) * 0.22;
    out.push(Math.round(v * 10) / 10);
  }
  out[points - 1] = base;
  return out;
}

/** Category-specific score, derived from the snapshot signals. */
export function scoreFor(m: Model, cat: Category): number {
  switch (cat) {
    case 'agent':
      return m.agentNet ?? -99;
    case 'webdev':
      return Math.round(m.elo + (m.agentNet ?? 0) * 2.2 - (1 - m.speed) * 12);
    case 'image':
      return Math.round(m.elo - 22 + m.speed * 30);
    case 'vision':
      return Math.round(m.elo - 8 + (m.hallucination !== undefined ? (1 - m.hallucination) * 6 : 0));
    default:
      return m.elo;
  }
}

export function ranked(cat: Category): Model[] {
  return MODELS.filter((m) => m.modalities.includes(cat)).sort(
    (a, b) => scoreFor(b, cat) - scoreFor(a, cat),
  );
}

export const CATEGORY_META: Record<
  Category,
  { icon: string; unit: string; total: string; blurbEn: string; blurbRu: string }
> = {
  text: {
    icon: 'message',
    unit: 'Elo',
    total: '7,999,020',
    blurbEn: 'Overall rankings across math, coding, creative writing and open-ended chat.',
    blurbRu: 'Общий рейтинг: математика, код, творческое письмо и свободный чат.',
  },
  agent: {
    icon: 'terminal',
    unit: 'Net',
    total: '2,285,256',
    blurbEn: 'How well models orchestrate tools: task completion, steerability, bash recovery.',
    blurbRu: 'Как модели управляют инструментами: завершение задач, управляемость, восстановление.',
  },
  webdev: {
    icon: 'code',
    unit: 'Elo',
    total: '1,104,338',
    blurbEn: 'Head-to-head on building real web apps from a single prompt.',
    blurbRu: 'Дуэли на создание реальных веб-приложений с одного промпта.',
  },
  image: {
    icon: 'image',
    unit: 'Elo',
    total: '3,412,907',
    blurbEn: 'Text-to-image and image editing, judged side by side.',
    blurbRu: 'Генерация и редактирование изображений, сравнение бок о бок.',
  },
  vision: {
    icon: 'eye',
    unit: 'Elo',
    total: '892,441',
    blurbEn: 'Reading charts, screenshots, documents and photos.',
    blurbRu: 'Чтение графиков, скриншотов, документов и фото.',
  },
};

export const UPDATED_AT: Record<Category, string> = {
  text: 'Sep 2, 2026',
  agent: 'Sep 5, 2026',
  webdev: 'Sep 4, 2026',
  image: 'Aug 30, 2026',
  vision: 'Sep 1, 2026',
};
