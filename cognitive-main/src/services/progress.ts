/**
 * Student progress analytics - everything here is DERIVED from the session history,
 * so it works offline, syncs across devices for free, and can never drift out of date.
 */
import type { LearningModule, LearningSession, Question, QuestionResponse } from '../types.ts';

export const REVIEW_MODULE_ID = 'review-vault';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const completed = (sessions: LearningSession[]) => sessions.filter(s => s.status === 'completed');
const DAY = 86_400_000;

export function questionIndex(modules: LearningModule[]): Map<string, { q: Question; module: LearningModule }> {
  const map = new Map<string, { q: Question; module: LearningModule }>();
  modules.forEach(m => m.questions.forEach(q => map.set(q.id, { q, module: m })));
  return map;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/* -------------------------------------------------------------------------- */
/*  XP, levels, ranks                                                          */
/* -------------------------------------------------------------------------- */

export interface XpBreakdown { base: number; accuracy: number; speed: number; independence: number; perfect: number; total: number }

export function sessionXp(s: LearningSession, qi: Map<string, { q: Question }>): XpBreakdown {
  const r = s.responses;
  const correct = r.filter(x => x.isCorrect);
  const fast = correct.filter(x => {
    const base = (qi.get(x.questionId)?.q.baselineExpectedSeconds ?? 20) * 1000;
    return x.responseTimeMs < base * 0.8;
  }).length;
  const independent = correct.filter(x => !x.hintUsed).length;
  const perfect = r.length >= 3 && correct.length === r.length;
  const b: XpBreakdown = {
    base: 40,
    accuracy: correct.length * 12,
    speed: fast * 5,
    independence: independent * 3,
    perfect: perfect ? 30 : 0,
    total: 0,
  };
  b.total = b.base + b.accuracy + b.speed + b.independence + b.perfect;
  return b;
}

export const levelStartXp = (level: number) => 60 * (level - 1) ** 2;

export const RANKS = [
  'Curious Novice', 'Pattern Spotter', 'Concept Climber', 'Schema Builder', 'Insight Seeker',
  'Cognitive Strategist', 'Mastery Architect', 'Mind Cartographer', 'Neural Virtuoso', 'Grand Polymath',
];

export interface LevelInfo { xp: number; level: number; rank: string; into: number; span: number; pct: number }

export function levelInfo(xp: number): LevelInfo {
  const level = Math.floor(Math.sqrt(xp / 60)) + 1;
  const start = levelStartXp(level);
  const span = levelStartXp(level + 1) - start;
  return {
    xp, level, rank: RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))],
    into: xp - start, span, pct: clamp(((xp - start) / span) * 100),
  };
}

export function totalXp(sessions: LearningSession[], modules: LearningModule[]): number {
  const qi = questionIndex(modules);
  return completed(sessions).reduce((acc, s) => acc + sessionXp(s, qi).total, 0);
}

/* -------------------------------------------------------------------------- */
/*  Streaks                                                                    */
/* -------------------------------------------------------------------------- */

export function streaks(sessions: LearningSession[], now = new Date()): { current: number; best: number; activeToday: boolean } {
  const days = new Set(completed(sessions).map(s => dayKey(new Date(s.completedAt ?? s.startedAt))));
  const sorted = [...days].map(k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d).getTime(); }).sort((a, b) => a - b);
  let best = 0, run = 0, prev = -Infinity;
  for (const t of sorted) {
    run = Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const activeToday = days.has(dayKey(now));
  let current = 0;
  for (let t = activeToday ? today : today - DAY; days.has(dayKey(new Date(t))); t -= DAY) current++;
  return { current, best, activeToday };
}

/* -------------------------------------------------------------------------- */
/*  Cognitive fingerprint (radar)                                              */
/* -------------------------------------------------------------------------- */

export interface Fingerprint {
  axes: { key: string; label: string; value: number; hint: string }[];
  calibrationKnown: boolean;
}

const CONF_P = { 1: 0.3, 2: 0.65, 3: 0.95 } as const;

export function calibration(responses: QuestionResponse[]): { score: number; rated: number; meanConfidence: number; accuracy: number } | null {
  const rated = responses.filter(r => r.confidence);
  if (rated.length < 3) return null;
  const meanConfidence = mean(rated.map(r => CONF_P[r.confidence!]));
  const accuracy = mean(rated.map(r => (r.isCorrect ? 1 : 0)));
  return { score: Math.round(100 - Math.abs(meanConfidence - accuracy) * 100), rated: rated.length, meanConfidence, accuracy };
}

export function fingerprint(sessions: LearningSession[], modules: LearningModule[]): Fingerprint | null {
  const rs = completed(sessions).flatMap(s => s.responses);
  if (!rs.length) return null;
  const qi = questionIndex(modules);

  const speed = clamp(mean(rs.map(r => {
    const base = (qi.get(r.questionId)?.q.baselineExpectedSeconds ?? 20) * 1000;
    return clamp((base / Math.max(1, r.responseTimeMs)) * 60, 0, 100);
  })));
  const accuracy = mean(rs.map(r => (r.isCorrect ? 100 : 0)));
  const composure = clamp(100 - mean(rs.map(r => r.hesitationCount)) * 28);

  let afterMiss = 0, recovered = 0;
  completed(sessions).forEach(s => s.responses.forEach((r, i) => {
    if (i > 0 && !s.responses[i - 1].isCorrect) { afterMiss++; if (r.isCorrect) recovered++; }
  }));
  const resilience = afterMiss ? (recovered / afterMiss) * 100 : 75;

  const cal = calibration(rs);

  return {
    calibrationKnown: !!cal,
    axes: [
      { key: 'speed', label: 'Speed', value: Math.round(speed), hint: 'How quickly you answer relative to the expected time.' },
      { key: 'accuracy', label: 'Accuracy', value: Math.round(accuracy), hint: 'Share of questions answered correctly.' },
      { key: 'composure', label: 'Composure', value: Math.round(composure), hint: 'Low hesitation - fewer last-second answer changes.' },
      { key: 'calibration', label: 'Calibration', value: cal ? cal.score : 50, hint: cal ? 'How well your confidence matches your results.' : 'Rate your confidence on questions to unlock this axis.' },
      { key: 'resilience', label: 'Resilience', value: Math.round(resilience), hint: 'How often you bounce back right after a mistake.' },
    ],
  };
}

/** Plain-language archetype from the two strongest axes. */
export function archetype(fp: Fingerprint): { name: string; blurb: string } {
  const v = Object.fromEntries(fp.axes.map(a => [a.key, a.value]));
  const top = [...fp.axes].sort((a, b) => b.value - a.value).slice(0, 2).map(a => a.key).sort().join('+');
  const map: Record<string, { name: string; blurb: string }> = {
    'accuracy+speed': { name: 'The Sprinter', blurb: 'Fast and right. Your next edge is deliberate depth on hard material.' },
    'accuracy+composure': { name: 'The Surgeon', blurb: 'Calm, precise, rarely second-guessing yourself.' },
    'accuracy+resilience': { name: 'The Rebuilder', blurb: 'You learn from every miss and come back stronger.' },
    'accuracy+calibration': { name: 'The Sage', blurb: 'You know what you know - and what you do not.' },
    'composure+speed': { name: 'The Instinctive', blurb: 'Quick, decisive instincts. Double-check the tricky ones.' },
    'resilience+speed': { name: 'The Scrapper', blurb: 'Fast, fearless, and quick to recover.' },
    'calibration+composure': { name: 'The Strategist', blurb: 'Measured, self-aware, and steady under pressure.' },
    'calibration+resilience': { name: 'The Reflector', blurb: 'Honest self-assessment drives your recoveries.' },
    'composure+resilience': { name: 'The Unshakeable', blurb: 'Pressure barely moves you.' },
    'calibration+speed': { name: 'The Calculator', blurb: 'Quick and well aware of your own certainty.' },
  };
  return map[top] ?? { name: v.accuracy >= 70 ? 'The Steady Climber' : 'The Explorer', blurb: 'Your profile is still taking shape - keep going.' };
}

/* -------------------------------------------------------------------------- */
/*  Memory Vault - spaced repetition (Leitner boxes)                           */
/* -------------------------------------------------------------------------- */

const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];

export interface VaultItem {
  question: Question;
  module: LearningModule;
  box: number;
  dueAt: number;
  lastAt: number;
  due: boolean;
  misses: number;
}

export function memoryVault(sessions: LearningSession[], modules: LearningModule[], now = Date.now()): VaultItem[] {
  const qi = questionIndex(modules);
  const events = completed(sessions)
    .flatMap(s => s.responses.map(r => ({ r, at: new Date(s.completedAt ?? s.startedAt).getTime() })))
    .sort((a, b) => a.at - b.at);

  const state = new Map<string, { box: number; lastAt: number; misses: number }>();
  for (const { r, at } of events) {
    const cur = state.get(r.questionId) ?? { box: 0, lastAt: at, misses: 0 };
    if (r.isCorrect) cur.box = Math.min(INTERVAL_DAYS.length - 1, cur.box + 1);
    else { cur.box = 0; cur.misses += 1; }
    cur.lastAt = at;
    state.set(r.questionId, cur);
  }

  const items: VaultItem[] = [];
  state.forEach((st, id) => {
    const hit = qi.get(id);
    if (!hit) return;
    const dueAt = st.lastAt + INTERVAL_DAYS[st.box] * DAY;
    items.push({ question: hit.q, module: hit.module, box: st.box, dueAt, lastAt: st.lastAt, due: dueAt <= now, misses: st.misses });
  });
  return items.sort((a, b) => a.dueAt - b.dueAt);
}

/** A synthetic module so a review round runs through the normal adaptive session flow. */
export function buildReviewModule(items: VaultItem[]): LearningModule {
  const qs = items.slice(0, 6).map(i => i.question);
  return {
    id: REVIEW_MODULE_ID,
    code: 'VAULT',
    title: 'Memory Vault Review',
    academicDiscipline: 'Spaced Repetition',
    description: 'Questions resurfaced at the moment you are most likely to forget them.',
    estimatedMinutes: Math.max(3, qs.length * 2),
    prerequisites: [],
    learningOutcomes: [],
    questions: qs,
    createdAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Live cognitive-load estimate (used while a question is on screen)          */
/* -------------------------------------------------------------------------- */

export function liveLoad(elapsedMs: number, baselineSeconds: number, hesitations: number, hintUsed: boolean): number {
  const ratio = elapsedMs / Math.max(1000, baselineSeconds * 1000);
  const time = ratio <= 0.25 ? ratio * 60 : 15 + Math.min(1.8, ratio - 0.25) * 38;
  return Math.round(clamp(time + hesitations * 17 + (hintUsed ? 6 : 0), 3, 100));
}

export function loadZone(v: number): { label: string; tone: string; tip: string } {
  if (v < 30) return { label: 'Calm', tone: 'teal', tip: 'Plenty of headroom - read carefully before you commit.' };
  if (v < 60) return { label: 'Flow', tone: 'emerald', tip: 'Sweet spot. Keep this rhythm.' };
  if (v < 82) return { label: 'Strained', tone: 'amber', tip: 'Working memory is filling up. Try the scaffold hint.' };
  return { label: 'Overload', tone: 'rose', tip: 'Pause. Re-read the question slowly, or take a reset breath.' };
}

/* -------------------------------------------------------------------------- */
/*  Insights                                                                   */
/* -------------------------------------------------------------------------- */

export interface Insight { kind: 'clock' | 'hint' | 'speed' | 'calibration' | 'trend' | 'weak' | 'streak' | 'strong'; title: string; body: string; tone: 'good' | 'warn' | 'info' }

export function insights(sessions: LearningSession[], modules: LearningModule[]): Insight[] {
  const done = completed(sessions);
  const rs = done.flatMap(s => s.responses);
  if (rs.length < 3) return [];
  const qi = questionIndex(modules);
  const out: Insight[] = [];
  const pct = (xs: QuestionResponse[]) => Math.round(mean(xs.map(r => (r.isCorrect ? 100 : 0))));

  // Time of day
  const timed = done.flatMap(s => s.responses.map(r => ({ r, h: new Date(s.completedAt ?? s.startedAt).getHours() })));
  const buckets: Record<string, QuestionResponse[]> = { 'the morning': [], 'the afternoon': [], 'the evening': [] };
  timed.forEach(({ r, h }) => buckets[h < 12 ? 'the morning' : h < 18 ? 'the afternoon' : 'the evening'].push(r));
  const ranked = Object.entries(buckets).filter(([, v]) => v.length >= 3).map(([k, v]) => [k, pct(v)] as const).sort((a, b) => b[1] - a[1]);
  if (ranked.length >= 2 && ranked[0][1] - ranked[ranked.length - 1][1] >= 10) {
    out.push({ kind: 'clock', tone: 'info', title: `You peak in ${ranked[0][0]}`, body: `${ranked[0][1]}% accuracy in ${ranked[0][0]} versus ${ranked[ranked.length - 1][1]}% in ${ranked[ranked.length - 1][0]}. Schedule hard topics then.` });
  }

  // Hints
  const withHint = rs.filter(r => r.hintUsed), noHint = rs.filter(r => !r.hintUsed);
  if (withHint.length >= 3 && noHint.length >= 3) {
    const a = pct(withHint), b = pct(noHint);
    out.push(a >= b
      ? { kind: 'hint', tone: 'good', title: 'Hints work for you', body: `You score ${a}% with a scaffold hint vs ${b}% without. Using them early is a strength, not a crutch.` }
      : { kind: 'hint', tone: 'info', title: 'You do best unaided', body: `${b}% without hints vs ${a}% with. When you reach for a hint, the question is usually genuinely hard - flag it for review.` });
  }

  // Speed / accuracy
  const fast: QuestionResponse[] = [], slow: QuestionResponse[] = [];
  rs.forEach(r => { const base = (qi.get(r.questionId)?.q.baselineExpectedSeconds ?? 20) * 1000; (r.responseTimeMs < base ? fast : slow).push(r); });
  if (fast.length >= 3 && slow.length >= 3) {
    const f = pct(fast), s = pct(slow);
    if (Math.abs(f - s) >= 12) out.push(f > s
      ? { kind: 'speed', tone: 'good', title: 'Fast means fluent', body: `Answers under the expected time are ${f}% correct vs ${s}% for slower ones - you know it or you don't. Trust your first instinct more.` }
      : { kind: 'speed', tone: 'warn', title: 'Slow down to win', body: `Quick answers are only ${f}% correct vs ${s}% when you take your time. A deliberate extra five seconds pays off.` });
  }

  // Calibration
  const cal = calibration(rs);
  if (cal) {
    const gap = cal.meanConfidence - cal.accuracy;
    out.push(Math.abs(gap) < 0.12
      ? { kind: 'calibration', tone: 'good', title: 'Well calibrated', body: `Your confidence (${Math.round(cal.meanConfidence * 100)}%) tracks your accuracy (${Math.round(cal.accuracy * 100)}%). That self-awareness is the core of metacognition.` }
      : gap > 0
        ? { kind: 'calibration', tone: 'warn', title: 'A touch overconfident', body: `You feel ${Math.round(cal.meanConfidence * 100)}% sure but score ${Math.round(cal.accuracy * 100)}%. Re-read the options before locking in answers you rate "certain".` }
        : { kind: 'calibration', tone: 'info', title: 'Hidden confidence', body: `You score ${Math.round(cal.accuracy * 100)}% but only feel ${Math.round(cal.meanConfidence * 100)}% sure. You know more than you think - trust yourself.` });
  }

  // Trend (cognitive load across sessions)
  const clis = done.filter(s => s.finalMetrics).map(s => s.finalMetrics!.cognitiveLoadIndex);
  if (clis.length >= 4) {
    const recent = mean(clis.slice(-2)), earlier = mean(clis.slice(0, -2));
    const d = Math.round(earlier - recent);
    if (Math.abs(d) >= 6) out.push(d > 0
      ? { kind: 'trend', tone: 'good', title: 'Mental effort is dropping', body: `Your recent sessions carry ${d} fewer cognitive-load points than earlier ones - concepts are becoming automatic.` }
      : { kind: 'trend', tone: 'warn', title: 'Load is climbing', body: `Recent sessions run ${Math.abs(d)} points heavier. Consider a Memory Vault round or a break before new material.` });
  }

  // Weakest / strongest concept
  const byConcept = new Map<string, QuestionResponse[]>();
  rs.forEach(r => { const c = qi.get(r.questionId)?.q.targetConcept; if (c) byConcept.set(c, [...(byConcept.get(c) ?? []), r]); });
  const concepts = [...byConcept.entries()].map(([c, v]) => ({ c, p: pct(v), n: v.length })).sort((a, b) => a.p - b.p);
  if (concepts.length >= 2) {
    const weak = concepts[0], strong = concepts[concepts.length - 1];
    if (weak.p < 70 && weak.p < strong.p) out.push({ kind: 'weak', tone: 'warn', title: 'Focus area', body: `"${weak.c}" is your toughest concept (${weak.p}%). It is queued in your Memory Vault.` });
    if (strong.p >= 80) out.push({ kind: 'strong', tone: 'good', title: 'Signature strength', body: `You have a firm grip on "${strong.c}" (${strong.p}%).` });
  }

  const st = streaks(sessions);
  if (st.current >= 2) out.push({ kind: 'streak', tone: 'good', title: `${st.current}-day streak`, body: st.activeToday ? 'Locked in for today. See you tomorrow!' : 'Complete a session today to keep it alive.' });

  return out.slice(0, 6);
}

/* -------------------------------------------------------------------------- */
/*  Achievements                                                               */
/* -------------------------------------------------------------------------- */

export interface Achievement { id: string; title: string; desc: string; icon: string; unlocked: boolean }

export function achievements(sessions: LearningSession[], modules: LearningModule[]): Achievement[] {
  const done = completed(sessions);
  const rs = done.flatMap(s => s.responses);
  const qi = questionIndex(modules);
  const st = streaks(sessions);
  const cal = calibration(rs);
  const hour = (s: LearningSession) => new Date(s.completedAt ?? s.startedAt).getHours();

  const speedy = rs.filter(r => r.isCorrect && r.responseTimeMs < (qi.get(r.questionId)?.q.baselineExpectedSeconds ?? 20) * 350).length;
  const comeback = done.some(s => s.responses.some((r, i) => i >= 2 && r.isCorrect && !s.responses[i - 1].isCorrect && !s.responses[i - 2].isCorrect));
  const realModules = new Set(done.filter(s => s.moduleId !== REVIEW_MODULE_ID).map(s => s.moduleId));

  const list: [string, string, string, string, boolean][] = [
    ['first', 'First Spark', 'Complete your first session.', 'sparkles', done.length >= 1],
    ['perfect', 'Flawless', 'Finish a session with 100% accuracy.', 'target', done.some(s => s.responses.length >= 3 && s.responses.every(r => r.isCorrect))],
    ['speed', 'Lightning Recall', 'Answer 3 questions correctly in under 35% of the expected time.', 'zap', speedy >= 3],
    ['flow', 'In The Zone', 'Finish a session in flow: load ≤ 35 and accuracy ≥ 80%.', 'waves', done.some(s => (s.finalMetrics?.cognitiveLoadIndex ?? 100) <= 35 && s.responses.filter(r => r.isCorrect).length / Math.max(1, s.responses.length) >= 0.8)],
    ['comeback', 'Comeback Kid', 'Answer correctly right after two misses in a row.', 'rotate', comeback],
    ['calm', 'Unflappable', 'Complete a session without a single hesitation.', 'shield', done.some(s => s.responses.length >= 3 && s.responses.every(r => r.hesitationCount === 0))],
    ['streak3', 'On a Roll', 'Learn 3 days in a row.', 'flame', st.best >= 3],
    ['streak7', 'Unstoppable', 'Learn 7 days in a row.', 'flame', st.best >= 7],
    ['scholar', 'Scholar', 'Answer 25 questions correctly.', 'book', rs.filter(r => r.isCorrect).length >= 25],
    ['vault', 'Vault Keeper', 'Complete a Memory Vault review.', 'vault', done.some(s => s.moduleId === REVIEW_MODULE_ID)],
    ['calibrated', 'Know Thyself', 'Reach 85+ calibration across 10 rated answers.', 'eye', !!cal && cal.rated >= 10 && cal.score >= 85],
    ['explorer', 'Explorer', 'Complete two different modules.', 'compass', realModules.size >= 2],
    ['owl', 'Night Owl', 'Finish a session between 10pm and 4am.', 'moon', done.some(s => hour(s) >= 22 || hour(s) < 4)],
    ['lark', 'Early Bird', 'Finish a session between 5am and 8am.', 'sun', done.some(s => hour(s) >= 5 && hour(s) < 8)],
  ];
  return list.map(([id, title, desc, icon, unlocked]) => ({ id, title, desc, icon, unlocked }));
}
