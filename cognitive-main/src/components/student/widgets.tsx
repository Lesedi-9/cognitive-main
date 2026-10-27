import React, { useEffect, useState } from 'react';
import {
  Sparkles, Target, Zap, Waves, RotateCcw, Shield, Flame, BookOpen, Eye, Compass, Moon, Sun, Clock,
  Lightbulb, Gauge, TrendingUp, AlertTriangle, Award, Lock, Wind, X, Brain, Trophy,
} from 'lucide-react';
import type { LearningSession, Question, QuestionResponse } from '../../types';
import {
  Achievement, Fingerprint, Insight, LevelInfo, XpBreakdown, archetype, loadZone,
} from '../../services/progress';

/* ---------------------------------------------------------------- Hero */

export const ProfileHero: React.FC<{
  name: string; level: LevelInfo; streak: { current: number; best: number; activeToday: boolean };
  unlocked: number; totalBadges: number;
}> = ({ name, level, streak, unlocked, totalBadges }) => (
  <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 text-white p-6 sm:p-8 shadow-lg">
    <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl" />
    <div className="absolute -bottom-28 left-10 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 flex items-center justify-center font-display text-3xl font-bold text-slate-950 shadow-lg">
              {level.level}
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest bg-slate-950 px-1.5 rounded">LEVEL</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-300 font-semibold">{level.rank}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">Welcome back, {name.split(' ')[0]}</h1>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-300 mb-1.5 font-mono">
            <span>{level.xp} XP</span>
            <span>{level.span - level.into} XP to level {level.level + 1}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400 relative transition-[width] duration-700" style={{ width: `${Math.max(3, level.pct)}%` }}>
              <div className="absolute inset-0 xp-shimmer rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap gap-3">
        <Stat icon={<Flame className="w-4 h-4 text-orange-300" />} value={streak.current} label={streak.current === 1 ? 'day streak' : 'day streak'} sub={streak.activeToday ? 'locked in today' : `best ${streak.best}`} />
        <Stat icon={<Trophy className="w-4 h-4 text-amber-300" />} value={`${unlocked}/${totalBadges}`} label="badges" sub="unlocked" />
      </div>
    </div>
  </section>
);

const Stat: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string; sub: string }> = ({ icon, value, label, sub }) => (
  <div className="min-w-[110px] rounded-2xl p-3.5 bg-white/5 border border-white/10">
    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">{icon}{label}</div>
    <div className="font-display text-2xl font-bold mt-1">{value}</div>
    <div className="text-[11px] text-slate-400">{sub}</div>
  </div>
);

/* ---------------------------------------------------------------- Radar */

export const FingerprintRadar: React.FC<{ fp: Fingerprint | null }> = ({ fp }) => {
  const [hover, setHover] = useState<number | null>(null);
  if (!fp) {
    return <Card title="Cognitive Fingerprint" icon={<Brain className="w-4 h-4" />}>
      <Empty text="Complete a session to reveal your fingerprint - five dimensions of how you learn." />
    </Card>;
  }
  const size = 280, c = size / 2, R = 100, n = fp.axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)] as const;
  };
  const poly = fp.axes.map((a, i) => pt(i, Math.max(6, a.value)).join(',')).join(' ');
  const arch = archetype(fp);
  const active = hover !== null ? fp.axes[hover] : null;

  return (
    <Card title="Cognitive Fingerprint" icon={<Brain className="w-4 h-4" />}>
      <div className="flex flex-col items-center">
        <svg viewBox={`-34 0 ${size + 68} ${size}`} className="w-full max-w-[340px]" role="img" aria-label="Radar chart of your five cognitive dimensions">
          {[0.25, 0.5, 0.75, 1].map(f => (
            <polygon key={f} points={fp.axes.map((_, i) => pt(i, f * 100).join(',')).join(' ')} fill="none" stroke="currentColor" className="text-slate-200" strokeWidth="1" />
          ))}
          {fp.axes.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="currentColor" className="text-slate-200" />; })}
          <g className="anim-radar">
            <polygon points={poly} fill="rgba(15,138,134,0.22)" stroke="#0f8a86" strokeWidth="2.5" strokeLinejoin="round" />
            {fp.axes.map((a, i) => { const [x, y] = pt(i, Math.max(6, a.value)); return <circle key={a.key} cx={x} cy={y} r={hover === i ? 6 : 4} fill="#0f8a86" stroke="#fff" strokeWidth="2" />; })}
          </g>
          {fp.axes.map((a, i) => {
            const [x, y] = pt(i, 128);
            return (
              <g key={a.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-default">
                <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-600" style={{ fontSize: 11, fontWeight: 700 }}>{a.label}</text>
                <text x={x} y={y + 13} textAnchor="middle" dominantBaseline="middle" className="fill-teal-700" style={{ fontSize: 10, fontWeight: 700 }}>{a.value}</text>
              </g>
            );
          })}
        </svg>
        <div className="text-center mt-1 min-h-[64px]">
          {active ? (
            <p className="text-xs text-slate-600 max-w-xs"><strong className="text-slate-900">{active.label}:</strong> {active.hint}</p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Your archetype</p>
              <p className="font-display text-xl font-bold text-slate-900">{arch.name}</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">{arch.blurb}</p>
            </>
          )}
        </div>
        {!fp.calibrationKnown && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">Rate your confidence on each question to unlock accurate Calibration.</p>}
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------- Insights */

const insightIcon = { clock: Clock, hint: Lightbulb, speed: Zap, calibration: Eye, trend: TrendingUp, weak: AlertTriangle, strong: Award, streak: Flame } as const;
const toneCls = { good: 'bg-emerald-50 border-emerald-200 text-emerald-700', warn: 'bg-amber-50 border-amber-200 text-amber-700', info: 'bg-teal-50 border-teal-200 text-teal-700' } as const;

export const InsightsPanel: React.FC<{ items: Insight[] }> = ({ items }) => (
  <Card title="Personal Insights" icon={<Lightbulb className="w-4 h-4" />}>
    {items.length === 0 ? <Empty text="Answer a few questions and your behavioural patterns will surface here - when you peak, how hints help, how well you judge your own certainty." /> : (
      <ul className="space-y-3">
        {items.map((it, i) => {
          const Icon = insightIcon[it.kind];
          return (
            <li key={it.title} className="flex gap-3 anim-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <span className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${toneCls[it.tone]}`}><Icon className="w-4 h-4" /></span>
              <div><p className="text-sm font-bold text-slate-900">{it.title}</p><p className="text-xs text-slate-600 leading-relaxed">{it.body}</p></div>
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

/* ---------------------------------------------------------- Achievements */

const badgeIcon = { sparkles: Sparkles, target: Target, zap: Zap, waves: Waves, rotate: RotateCcw, shield: Shield, flame: Flame, book: BookOpen, eye: Eye, compass: Compass, moon: Moon, sun: Sun } as const;

export const AchievementsGrid: React.FC<{ items: Achievement[] }> = ({ items }) => (
  <Card title="Achievements" icon={<Trophy className="w-4 h-4" />} aside={<span className="text-xs font-bold text-teal-700">{items.filter(i => i.unlocked).length}/{items.length}</span>}>
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
      {items.map(a => {
        const Icon = badgeIcon[a.icon as keyof typeof badgeIcon] ?? Sparkles;
        return (
          <div key={a.id} title={`${a.title} - ${a.desc}`} className={`group relative rounded-2xl border p-3 text-center transition-all ${a.unlocked ? 'bg-gradient-to-b from-teal-50 to-white border-teal-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
            <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center ${a.unlocked ? 'bg-gradient-to-br from-teal-400 to-indigo-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {a.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            </div>
            <p className="text-[11px] font-bold text-slate-800 mt-2 leading-tight">{a.title}</p>
            <p className="text-[9px] text-slate-500 mt-1 leading-snug hidden sm:block">{a.desc}</p>
          </div>
        );
      })}
    </div>
  </Card>
);

/* ----------------------------------------------------------------- Trend */

export const TrendChart: React.FC<{ sessions: LearningSession[] }> = ({ sessions }) => {
  const pts = sessions.filter(s => s.status === 'completed' && s.responses.length)
    .sort((a, b) => +new Date(a.completedAt ?? a.startedAt) - +new Date(b.completedAt ?? b.startedAt)).slice(-12)
    .map(s => ({ acc: (s.responses.filter(r => r.isCorrect).length / s.responses.length) * 100, cli: s.finalMetrics?.cognitiveLoadIndex ?? 0 }));
  const w = 360, h = 130, padL = 26, padB = 18;
  const x = (i: number) => padL + (pts.length === 1 ? (w - padL) / 2 : (i * (w - padL - 8)) / (pts.length - 1));
  const y = (v: number) => 8 + (h - padB - 8) * (1 - v / 100);
  const path = (k: 'acc' | 'cli') => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[k])}`).join(' ');
  return (
    <Card title="Progress Over Time" icon={<TrendingUp className="w-4 h-4" />}
      aside={<span className="flex gap-3 text-[10px] font-semibold text-slate-500"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-600 mr-1 align-middle" />Accuracy<i className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-400 mr-1 align-middle" />Load</span>}>
      {pts.length < 2 ? <Empty text="Finish two sessions to see your accuracy and cognitive load trend." /> : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Accuracy and cognitive load across recent sessions">
          {[0, 50, 100].map(g => <g key={g}><line x1={padL} x2={w} y1={y(g)} y2={y(g)} className="stroke-slate-200" /><text x={0} y={y(g) + 3} className="fill-slate-400" style={{ fontSize: 9 }}>{g}</text></g>)}
          <path d={path('cli')} fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />
          <path d={path('acc')} fill="none" stroke="#0f8a86" strokeWidth="2.5" strokeLinejoin="round" />
          {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.acc)} r="3.5" fill="#0f8a86" stroke="#fff" strokeWidth="1.5"><title>{`Session ${i + 1}: ${Math.round(p.acc)}% accuracy, load ${p.cli}`}</title></circle>)}
        </svg>
      )}
    </Card>
  );
};

/* ------------------------------------------------------ Live load meter */

export const LiveLoadMeter: React.FC<{ value: number }> = ({ value }) => {
  const z = loadZone(value);
  const color = { teal: '#14b8a6', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e' }[z.tone as 'teal'];
  const r = 44, circ = Math.PI * r;
  return (
    <div className="flex items-center gap-4" role="status" aria-live="polite" aria-label={`Live cognitive load ${value} of 100, ${z.label}`}>
      <svg viewBox="0 0 110 62" className="w-28 shrink-0">
        <path d="M11 55 A44 44 0 0 1 99 55" fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
        <path d="M11 55 A44 44 0 0 1 99 55" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .6s ease, stroke .4s' }} />
        <text x="55" y="50" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 22, fontWeight: 800 }}>{value}</text>
      </svg>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1"><Gauge className="w-3 h-3" /> Live cognitive load</p>
        <p className="font-display text-lg font-bold" style={{ color }}>{z.label}</p>
        <p className="text-xs text-slate-500 max-w-[230px] leading-snug">{z.tip}</p>
      </div>
    </div>
  );
};

/* ---------------------------------------------------- Confidence picker */

const CONF = [
  { v: 1 as const, label: 'Guessing', emoji: '🎲', cls: 'border-amber-300 bg-amber-50 text-amber-900 ring-amber-400' },
  { v: 2 as const, label: 'Fairly sure', emoji: '🤔', cls: 'border-teal-300 bg-teal-50 text-teal-900 ring-teal-400' },
  { v: 3 as const, label: 'Certain', emoji: '🎯', cls: 'border-emerald-300 bg-emerald-50 text-emerald-900 ring-emerald-400' },
];

export const ConfidencePicker: React.FC<{ value: 1 | 2 | 3 | null; onChange: (v: 1 | 2 | 3) => void }> = ({ value, onChange }) => (
  <fieldset>
    <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">How sure are you? <span className="font-normal normal-case text-slate-400">(sharpens your Calibration score)</span></legend>
    <div className="grid grid-cols-3 gap-2">
      {CONF.map(c => (
        <button key={c.v} type="button" onClick={() => onChange(c.v)} aria-pressed={value === c.v}
          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${value === c.v ? `${c.cls} ring-2` : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <span className="mr-1">{c.emoji}</span>{c.label}
        </button>
      ))}
    </div>
  </fieldset>
);

export function calibrationVerdict(conf: 1 | 2 | 3 | null, correct: boolean): { text: string; tone: 'good' | 'warn' | 'info' } | null {
  if (!conf) return null;
  if (conf === 3 && !correct) return { tone: 'warn', text: 'Overconfident miss - these are the most valuable mistakes to learn from.' };
  if (conf === 1 && correct) return { tone: 'info', text: 'Lucky or intuitive? You knew more than you thought.' };
  if (conf === 3 && correct) return { tone: 'good', text: 'Confident and correct - well calibrated.' };
  if (conf === 1 && !correct) return { tone: 'good', text: 'You sensed the uncertainty - good self-awareness.' };
  return null;
}

/* ------------------------------------------------------ Breathing reset */

export const BreathingReset: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [left, setLeft] = useState(48);
  useEffect(() => {
    const t = setInterval(() => setLeft(l => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const phase = Math.floor(((48 - left) % 8) / 4) === 0 ? 'Breathe in' : 'Breathe out';
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Breathing reset">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-teal-950 text-white p-8 text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
        <Wind className="w-5 h-5 text-teal-300 mx-auto mb-2" />
        <h3 className="font-display text-xl font-bold">60-second reset</h3>
        <p className="text-xs text-slate-300 mt-1">Slow breathing lowers arousal and frees working memory.</p>
        <div className="my-8 flex items-center justify-center h-44">
          <div className="anim-breathe w-40 h-40 rounded-full bg-gradient-to-br from-teal-300/80 to-indigo-400/70 shadow-[0_0_60px_rgba(45,212,191,0.4)] flex items-center justify-center">
            <span className="font-display font-bold text-slate-950 text-sm">{left > 0 ? phase : 'Ready'}</span>
          </div>
        </div>
        <p className="font-mono text-sm text-teal-200">{left > 0 ? `${left}s` : 'Nicely done'}</p>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm cursor-pointer">{left > 0 ? 'Skip' : 'Back to the question'}</button>
      </div>
    </div>
  );
};

/* ------------------------------------------- Post-session visual summary */

export const SessionTimeline: React.FC<{ responses: QuestionResponse[]; questions: Question[] }> = ({ responses, questions }) => {
  const qmap = new Map(questions.map(q => [q.id, q]));
  const max = Math.max(1, ...responses.map(r => Math.max(r.responseTimeMs / 1000, (qmap.get(r.questionId)?.baselineExpectedSeconds ?? 20))));
  return (
    <div className="space-y-3">
      {responses.map((r, i) => {
        const q = qmap.get(r.questionId); const base = q?.baselineExpectedSeconds ?? 20; const t = r.responseTimeMs / 1000;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 truncate pr-2">Q{i + 1} · {q?.targetConcept ?? 'Concept'}</span>
              <span className={`font-bold ${r.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{r.isCorrect ? 'Correct' : 'Missed'} · {t.toFixed(1)}s</span>
            </div>
            <div className="relative h-3 rounded-full bg-slate-100">
              <div className={`absolute inset-y-0 left-0 rounded-full ${r.isCorrect ? 'bg-teal-500' : 'bg-rose-400'}`} style={{ width: `${(t / max) * 100}%` }} />
              <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-800" style={{ left: `${(base / max) * 100}%` }} title={`Expected ${base}s`} />
            </div>
            <div className="flex gap-2 text-[10px] text-slate-400">
              <span>load {r.cognitiveLoadScore}</span><span>·</span><span>{r.hesitationCount} hesitations</span>{r.hintUsed && <><span>·</span><span>hint used</span></>}
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-slate-400">Dark tick = expected time for that question.</p>
    </div>
  );
};

export const XpSummary: React.FC<{ xp: XpBreakdown; leveledUp: LevelInfo | null; newBadges: Achievement[] }> = ({ xp, leveledUp, newBadges }) => (
  <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-teal-900 text-white p-5 space-y-4 anim-pop">
    <div className="flex items-center justify-between">
      <div><p className="text-xs uppercase tracking-widest text-teal-300 font-semibold">Session reward</p><p className="font-display text-4xl font-bold">+{xp.total} XP</p></div>
      {leveledUp && <div className="text-right anim-pop"><p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">Level up!</p><p className="font-display text-xl font-bold">{leveledUp.level} · {leveledUp.rank}</p></div>}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
      {[['Participation', xp.base], ['Accuracy', xp.accuracy], ['Speed', xp.speed], ['No-hint', xp.independence], ['Flawless', xp.perfect]].map(([l, v]) => (
        <div key={l as string} className={`rounded-xl py-2 ${Number(v) ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}><div className="font-bold text-base">+{v}</div><div className="text-slate-300">{l}</div></div>
      ))}
    </div>
    {newBadges.length > 0 && (
      <div className="pt-3 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold mb-2">Badges unlocked</p>
        <div className="flex flex-wrap gap-2">{newBadges.map(b => <span key={b.id} className="px-3 py-1 rounded-full bg-amber-300/20 border border-amber-300/40 text-amber-100 text-xs font-bold">🏅 {b.title}</span>)}</div>
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------- Primitives */

const Card: React.FC<{ title: string; icon: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, aside, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
    <header className="flex items-center justify-between mb-4">
      <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2"><span className="text-teal-600">{icon}</span>{title}</h3>
      {aside}
    </header>
    {children}
  </section>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-xs text-slate-500 leading-relaxed p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">{text}</p>
);