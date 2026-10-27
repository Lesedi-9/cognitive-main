import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import campusBg from '../assets/images/campus_learning_bg_1788508725474.jpg';
import { getBackendMode } from '../services/auth';
import {
  Activity,
  Brain,
  Layers,
  Cpu,
  Clock,
  AlertCircle,
  TrendingUp,
  Shield,
  FileSpreadsheet,
  ArrowRight,
  Database,
  CheckCircle2,
  Sliders,
  Sparkles,
  Cloud,
  HardDrive
} from 'lucide-react';

interface HomePageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuth }) => {
  const [mode, setMode] = useState<'cloud' | 'local'>('local');

  useEffect(() => {
    // Determine if we are connected to Supabase or running offline
    setMode(getBackendMode());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-4">
            {/* CLOUD / LOCAL INDICATOR */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              mode === 'cloud' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {mode === 'cloud' ? (
                <><Cloud className="w-3.5 h-3.5" /> Cloud Synced</>
              ) : (
                <><HardDrive className="w-3.5 h-3.5" /> Local Mode</>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <button
              id="nav-login-btn"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              id="nav-signup-btn"
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="relative pt-20 pb-24 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 z-0">
          <img
            src={campusBg}
            alt="Modern University Academic & Digital Learning Environment"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/65 to-slate-950/45" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Higher Education Intelligent Educational System (IES)
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-sm">
              AI-Driven Adaptive Learning Grounded in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-300">Cognitive Behaviour</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-200 font-normal leading-relaxed max-w-3xl mx-auto drop-shadow-xs">
              Moving beyond traditional score-based learning. Our platform captures millisecond response latency, choice hesitation, and error patterns in real-time to deliver constructivist scaffolding and optimize individual cognitive load.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                id="hero-cta-signup"
                onClick={() => onOpenAuth('signup')}
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-cta-admin"
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-xl border border-white/30 backdrop-blur-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-200" />
                <span>Admin & Research Portal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement & Research Gap Section */}
      <section id="problem-gap" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs uppercase tracking-wider font-bold text-blue-600">The Problem Statement & Scholarly Gap</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Why Traditional Digital Learning Fails Modern Higher Education
            </h2>
            <p className="text-slate-600 mt-3 text-base leading-relaxed">
              Standard digital platforms evaluate outcomes (correct vs. incorrect scores), treating all students identically regardless of cognitive pace, mental friction, or learning style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Outcome-Only Blindspot</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Platforms rely on binary test results. A lucky guess receives the same appraisal as deep analytical understanding, while a student who stumbled due to extraneous wording is erroneously classified as incompetent.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Ignored Latency & Hesitation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Response time, option toggling, and distractor hovering provide direct windows into working memory load. Yet existing platforms treat sub-second reaction times and 90-second hesitations identically.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Absence of Real-Time Scaffolding</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Interventions are usually delayed post-exam. Constructivist theory (Sweller, 2011; Plooy et al., 2024) proves that scaffolding must occur dynamically at the exact point of cognitive friction to prevent burnout and disengagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cognitive Behavioural Model Explanation */}
      <section id="cognitive-engine" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-bold text-blue-600">The Scientific Framework</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How Cognitive Behaviour Adapts Instruction
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Grounding adaptive learning algorithms in Cognitive Load Theory (CLT) and interaction telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Response Latency Analytics</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Evaluates reaction times against baseline expected seconds. Identifies guessing (&lt;3s), fluent mastery (0.5x–1.2x), and elevated cognitive struggle (&gt;2.5x).
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Hesitation & Choice Fluctuation</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Monitors switching between candidate answers and distractor lingering to calculate working memory conflict and schema uncertainty.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Dynamic Scaffolding & Pacing</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  When high cognitive load is detected (CLI &gt; 70), the system deconstructs the challenge, presents worked hints, and prevents learner paralysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture & Supabase Integration */}
      <section id="architecture" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs uppercase tracking-wider font-bold text-blue-600">Enterprise Integration</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              System Architecture & Supabase Database
            </h2>
            <p className="text-slate-600 mt-3 text-base leading-relaxed">
              Engineered with a high-performance decoupled architecture designed for institutional higher education reliability and granular research data downloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Supabase Persistence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supabase Auth with row-level security protects accounts, sessions, and telemetry. No project keys? It falls back to a fully offline local mode.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Admin Control Portal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full authority to manage real user accounts, reset passwords, remove accounts, and configure adaptation thresholds.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Research Data Export</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant one-click downloads of student interaction logs in CSV, cognitive metrics summaries, and complete JSON datasets.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Security & Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Human verification challenge protects student signups, with role-based access control (RBAC) separating students and faculty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" variant="light" />
          <div className="text-xs text-center sm:text-right text-slate-500">
            <p>Cognitive-Behavioural Adaptive Learning System for Higher Education</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
