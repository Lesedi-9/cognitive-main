import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelInfo, streaks, memoryVault, liveLoad, loadZone, calibration, fingerprint, achievements, sessionXp, questionIndex,
} from '../src/services/progress.ts';
import { EXTRA_MODULES } from '../src/services/extraModules.ts';
import type { LearningSession, QuestionResponse } from '../src/types.ts';

const modules = EXTRA_MODULES;
const DAY = 86_400_000;

const resp = (questionId: string, isCorrect: boolean, extra: Partial<QuestionResponse> = {}): QuestionResponse => ({
  questionId, selectedOptionIndex: 0, isCorrect, responseTimeMs: 12000, hesitationCount: 0, attemptsCount: 1,
  hintUsed: false, cognitiveLoadScore: 40, ...extra,
});

const session = (id: string, at: number, responses: QuestionResponse[], moduleId = 'mod-meta-110'): LearningSession => ({
  id, userId: 'u', userEmail: 'u@x.com', userName: 'U', moduleId, moduleTitle: 'M', startedAt: new Date(at).toISOString(),
  completedAt: new Date(at).toISOString(), status: 'completed', currentQuestionIndex: 0, activeDifficulty: 'introductory',
  totalDwellTimeMs: 0, responses, adaptationHistory: [], finalMetrics: { averageResponseTimeMs: 0, errorFrequencyRate: 0, totalHesitations: 0, cognitiveLoadIndex: 30, engagementScore: 90, predictedState: 'optimal_flow', recommendedScaffold: 'standard' },
});

test('levels grow monotonically and report progress inside a level', () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(60).level, 2);
  assert.ok(levelInfo(500).level > levelInfo(100).level);
  const l = levelInfo(100);
  assert.ok(l.pct >= 0 && l.pct <= 100);
});

test('streaks count consecutive days and survive an unfinished today', () => {
  const now = new Date(2026, 5, 10, 15).getTime();
  const s = [session('a', now - 2 * DAY, []), session('b', now - DAY, [])];
  assert.deepEqual(streaks(s, new Date(now)), { current: 2, best: 2, activeToday: false });
  s.push(session('c', now, []));
  assert.equal(streaks(s, new Date(now)).current, 3);
  assert.equal(streaks([session('x', now - 5 * DAY, [])], new Date(now)).current, 0);
});

test('memory vault: misses are due now, mastered answers are scheduled later', () => {
  const t = Date.now() - 2 * DAY;
  const s = [session('1', t, [resp('q-meta-1', true), resp('q-meta-2', false)])];
  const v = memoryVault(s, modules, Date.now());
  const q1 = v.find(i => i.question.id === 'q-meta-1')!;
  const q2 = v.find(i => i.question.id === 'q-meta-2')!;
  assert.equal(q2.due, true);   // missed -> box 0 -> due immediately
  assert.equal(q1.box, 1);      // correct once -> 1 day interval, 2 days ago -> due
  assert.equal(q1.due, true);
  const fresh = memoryVault([session('2', Date.now(), [resp('q-meta-1', true)])], modules);
  assert.equal(fresh[0].due, false);
});

test('a later correct answer promotes a missed question', () => {
  const s = [
    session('1', Date.now() - 3 * DAY, [resp('q-meta-1', false)]),
    session('2', Date.now() - 2 * DAY, [resp('q-meta-1', true)]),
  ];
  const item = memoryVault(s, modules)[0];
  assert.equal(item.box, 1);
  assert.equal(item.misses, 1);
});

test('live load rises with time and hesitation and maps to zones', () => {
  assert.ok(liveLoad(1000, 20, 0, false) < liveLoad(40000, 20, 0, false));
  assert.ok(liveLoad(10000, 20, 3, false) > liveLoad(10000, 20, 0, false));
  assert.equal(loadZone(10).label, 'Calm');
  assert.equal(loadZone(90).label, 'Overload');
});

test('calibration needs 3+ ratings and rewards matching confidence to accuracy', () => {
  assert.equal(calibration([resp('a', true, { confidence: 3 })]), null);
  const good = calibration([resp('a', true, { confidence: 3 }), resp('b', true, { confidence: 3 }), resp('c', false, { confidence: 1 })])!;
  const bad = calibration([resp('a', false, { confidence: 3 }), resp('b', false, { confidence: 3 }), resp('c', false, { confidence: 3 })])!;
  assert.ok(good.score > bad.score);
});

test('fingerprint has five bounded axes; achievements unlock from behaviour', () => {
  assert.equal(fingerprint([], modules), null);
  const s = [session('1', Date.now(), [resp('q-meta-1', true), resp('q-meta-2', true), resp('q-meta-3', true)])];
  const fp = fingerprint(s, modules)!;
  assert.equal(fp.axes.length, 5);
  fp.axes.forEach(a => assert.ok(a.value >= 0 && a.value <= 100));
  const got = Object.fromEntries(achievements(s, modules).map(a => [a.id, a.unlocked]));
  assert.equal(got.first, true);
  assert.equal(got.perfect, true);
  assert.equal(got.calm, true);
  assert.equal(got.streak7, false);
});

test('session xp rewards accuracy, speed, independence and flawless runs', () => {
  const qi = questionIndex(modules);
  const perfect = sessionXp(session('1', 0, [resp('q-meta-1', true, { responseTimeMs: 5000 }), resp('q-meta-2', true, { responseTimeMs: 5000 }), resp('q-meta-3', true)]), qi);
  const poor = sessionXp(session('2', 0, [resp('q-meta-1', false), resp('q-meta-2', false), resp('q-meta-3', false)]), qi);
  assert.ok(perfect.total > poor.total);
  assert.equal(perfect.perfect, 30);
  assert.equal(poor.perfect, 0);
});
