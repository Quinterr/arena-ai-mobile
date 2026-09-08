import type { Lang } from '../i18n';

export type Suggestion = {
  id: string;
  titleEn: string;
  titleRu: string;
  subEn: string;
  subRu: string;
  icon: string;
  prompt: string;
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'image',
    titleEn: 'Edit an image',
    titleRu: 'Отредактировать фото',
    subEn: 'Upload an image and edit it with AI',
    subRu: 'Загрузи картинку и измени её с ИИ',
    icon: 'image',
    prompt: 'Remove the background from this photo and put the subject on a soft gradient.',
  },
  {
    id: 'landing',
    titleEn: 'Create a landing page',
    titleRu: 'Сделать лендинг',
    subEn: 'Create a sleek, modern landing page',
    subRu: 'Современный аккуратный лендинг',
    icon: 'layout',
    prompt: 'Create a sleek modern landing page for an AI note-taking app.',
  },
  {
    id: 'dashboard',
    titleEn: 'Build a dashboard',
    titleRu: 'Собрать дашборд',
    subEn: 'Turn data into interactive charts',
    subRu: 'Превратить данные в графики',
    icon: 'chart',
    prompt: 'Build a dashboard that turns a CSV of sales data into interactive charts.',
  },
  {
    id: 'game',
    titleEn: 'Make a game',
    titleRu: 'Сделать игру',
    subEn: 'Build a playable game',
    subRu: 'Играбельная мини-игра',
    icon: 'game',
    prompt: 'Make a playable snake game with a neon retro look.',
  },
  {
    id: 'design',
    titleEn: 'Design to code',
    titleRu: 'Дизайн в код',
    subEn: 'Upload an image and have AI build it',
    subRu: 'Загрузи макет — ИИ соберёт код',
    icon: 'wand',
    prompt: 'Turn this screenshot of a pricing page into responsive React components.',
  },
  {
    id: 'fullstack',
    titleEn: 'Build a fullstack app',
    titleRu: 'Фулстек-приложение',
    subEn: 'Create a templated full-stack app',
    subRu: 'Приложение с бэком из шаблона',
    icon: 'stack',
    prompt: 'Build a full-stack habit tracker with auth and a Postgres schema.',
  },
];

export const BATTLE_PROMPTS = [
  'Explain quantum entanglement to a curious 12-year-old in under 120 words.',
  'Write a haiku about a server room at 3am.',
  'I have 200 lines of legacy jQuery. What is the safest migration path to React?',
  'Design a pricing model for a solo-founder SaaS with 500 users.',
  'Debug: my Postgres query got 40x slower after adding an index. Why?',
  'Draft a polite but firm message declining a meeting that should be an email.',
  'What is the strongest argument against your own previous answer?',
  'Summarise the trade-offs between RAG and long-context prompting.',
  'Give me a 3-day Tokyo itinerary that avoids every tourist trap.',
  'Write a regex that matches ISO dates but rejects Feb 30. Explain the limits.',
  'My tests pass locally but fail in CI only on Tuesdays. Where do I start?',
  'Turn this idea into a product spec: "Strava, but for reading books".',
];

export const localize = (lang: Lang, en: string, ru: string) => (lang === 'ru' ? ru : en);
