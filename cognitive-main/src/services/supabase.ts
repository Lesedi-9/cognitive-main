import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, LearningSession, InteractionEvent } from '../types';
import SCHEMA_SQL from '../../supabase/schema.sql?raw';

/* -------------------------------------------------------------------------- */
/*  Configuration (read from .env - never hard-coded)                          */
/* -------------------------------------------------------------------------- */

const ENV_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const ENV_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

const URL_REGEX = /^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/i;

export const SUPABASE_URL = ENV_URL.replace(/\/$/, '');
export const SUPABASE_PROJECT_REF = URL_REGEX.exec(ENV_URL)?.[1] ?? '';
export const SUPABASE_SQL_SCHEMA: string = SCHEMA_SQL;

/** True when a syntactically valid project URL and anon key are present. */
export function isSupabaseConfigured(): boolean {
  return URL_REGEX.test(ENV_URL) && ENV_KEY.split('.').length === 3;
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, ENV_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

/* -------------------------------------------------------------------------- */
/*  Health probe                                                               */
/* -------------------------------------------------------------------------- */

export interface BackendProbe {
  configured: boolean;
  reachable: boolean;
  tables: { profiles: boolean; sessions: boolean; events: boolean };
  schemaReady: boolean;
  message: string;
}

const TABLE_MISSING = /PGRST205|42P01|schema cache|does not exist/i;

export async function probeBackend(): Promise<BackendProbe> {
  const empty = { profiles: false, sessions: false, events: false };
  const sb = getSupabaseClient();
  if (!sb) {
    return {
      configured: false, reachable: false, tables: empty, schemaReady: false,
      message: 'Supabase is not configured. Running in local-only mode.',
    };
  }

  const check = async (table: string) => {
    // A real GET (not HEAD): HEAD responses carry no body, so a missing table would go unnoticed.
    const { error } = await sb.from(table).select('id').limit(1);
    if (!error) return { ok: true, reachable: true };
    if (TABLE_MISSING.test(`${error.code ?? ''} ${error.message}`)) return { ok: false, reachable: true };
    // Any other error (network, bad key...) means we cannot trust the backend.
    return { ok: false, reachable: !/fetch|network|failed/i.test(error.message), error: error.message };
  };

  try {
    const [p, s, e] = await Promise.all([
      check('profiles'), check('study_sessions'), check('telemetry_events'),
    ]);
    const tables = { profiles: p.ok, sessions: s.ok, events: e.ok };
    const reachable = p.reachable && s.reachable && e.reachable;
    const schemaReady = tables.profiles && tables.sessions && tables.events;
    let message: string;
    if (!reachable) message = 'Could not reach Supabase. Check your internet connection and .env values.';
    else if (!schemaReady) message = 'Connected to Supabase, but the database schema has not been installed yet (run supabase/schema.sql).';
    else message = 'Connected to Supabase. Schema installed and row-level security active.';
    return { configured: true, reachable, tables, schemaReady, message };
  } catch (err) {
    return {
      configured: true, reachable: false, tables: empty, schemaReady: false,
      message: `Could not reach Supabase: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Sync status (drives the badge in the navbar)                               */
/* -------------------------------------------------------------------------- */

export type SyncState = 'local' | 'idle' | 'syncing' | 'error';
let syncState: SyncState = 'local';
let syncError: string | null = null;
const listeners = new Set<(s: SyncState, err: string | null) => void>();

function setSync(state: SyncState, err: string | null = null) {
  syncState = state;
  syncError = err;
  listeners.forEach(l => l(state, err));
}

export function onSyncStatus(cb: (s: SyncState, err: string | null) => void): () => void {
  listeners.add(cb);
  cb(syncState, syncError);
  return () => { listeners.delete(cb); };
}

/** Called by the auth layer: the signed-in cloud user (or null for local mode / signed out). */
let activeCloudUserId: string | null = null;
export function setActiveCloudUser(id: string | null) {
  activeCloudUserId = id;
  setSync(id ? 'idle' : 'local');
}

/* -------------------------------------------------------------------------- */
/*  Row mappers                                                                */
/* -------------------------------------------------------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    studentId: r.student_id ?? undefined,
    institution: r.institution ?? undefined,
    department: r.department ?? undefined,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  };
}

const sessionToRow = (s: LearningSession) => ({
  id: s.id,
  user_id: s.userId,
  user_email: s.userEmail,
  user_name: s.userName,
  module_id: s.moduleId,
  module_title: s.moduleTitle,
  started_at: s.startedAt,
  completed_at: s.completedAt ?? null,
  status: s.status,
  current_question_index: s.currentQuestionIndex ?? 0,
  active_difficulty: s.activeDifficulty,
  total_dwell_time_ms: Math.round(s.totalDwellTimeMs || 0),
  responses: s.responses ?? [],
  adaptation_history: s.adaptationHistory ?? [],
  final_metrics: s.finalMetrics ?? null,
});

const rowToSession = (r: any): LearningSession => ({
  id: r.id,
  userId: r.user_id,
  userEmail: r.user_email,
  userName: r.user_name,
  moduleId: r.module_id,
  moduleTitle: r.module_title,
  startedAt: r.started_at,
  completedAt: r.completed_at ?? undefined,
  status: r.status,
  currentQuestionIndex: r.current_question_index ?? 0,
  activeDifficulty: r.active_difficulty,
  totalDwellTimeMs: Number(r.total_dwell_time_ms) || 0,
  responses: r.responses ?? [],
  adaptationHistory: r.adaptation_history ?? [],
  finalMetrics: r.final_metrics ?? undefined,
});

const eventToRow = (e: InteractionEvent) => ({
  id: e.id,
  user_id: e.userId,
  session_id: e.sessionId,
  module_id: e.moduleId,
  question_id: e.questionId ?? null,
  event_type: e.eventType,
  details: e.details ?? null,
  time_spent_ms: Math.round(e.timeSpentMs || 0),
  cognitive_load_estimate: e.cognitiveLoadEstimate ?? null,
  timestamp: e.timestamp,
});

const rowToEvent = (r: any): InteractionEvent => ({
  id: r.id,
  userId: r.user_id,
  sessionId: r.session_id,
  moduleId: r.module_id,
  questionId: r.question_id ?? undefined,
  timestamp: r.timestamp,
  eventType: r.event_type,
  details: r.details ?? '',
  timeSpentMs: r.time_spent_ms ?? 0,
  cognitiveLoadEstimate: r.cognitive_load_estimate == null ? undefined : Number(r.cognitive_load_estimate),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/* -------------------------------------------------------------------------- */
/*  Writes (row-level security guarantees users can only write their own rows) */
/* -------------------------------------------------------------------------- */

async function guarded(userId: string, op: (sb: SupabaseClient) => PromiseLike<{ error: { message: string } | null }>): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !activeCloudUserId || userId !== activeCloudUserId) return false;
  setSync('syncing');
  try {
    const { error } = await op(sb);
    if (error) {
      console.warn('[supabase] sync failed:', error.message);
      setSync('error', error.message);
      return false;
    }
    setSync('idle');
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[supabase] sync failed:', msg);
    setSync('error', msg);
    return false;
  }
}

export const syncSessionToSupabase = (s: LearningSession) =>
  guarded(s.userId, sb => sb.from('study_sessions').upsert(sessionToRow(s)));

export const syncInteractionToSupabase = (e: InteractionEvent) =>
  guarded(e.userId, sb => sb.from('telemetry_events').upsert(eventToRow(e), { onConflict: 'id', ignoreDuplicates: true }));

/** Push anything recorded while offline / before the schema existed. */
export async function flushLocalToCloud(userId: string, sessions: LearningSession[], events: InteractionEvent[]): Promise<void> {
  const mySessions = sessions.filter(s => s.userId === userId);
  const myEvents = events.filter(e => e.userId === userId);
  if (mySessions.length) {
    await guarded(userId, sb => sb.from('study_sessions').upsert(mySessions.map(sessionToRow)));
  }
  for (let i = 0; i < myEvents.length; i += 500) {
    const chunk = myEvents.slice(i, i + 500).map(eventToRow);
    await guarded(userId, sb => sb.from('telemetry_events').upsert(chunk, { onConflict: 'id', ignoreDuplicates: true }));
  }
}

export async function touchLastLogin(userId: string): Promise<void> {
  await guarded(userId, sb => sb.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId));
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchProfile(userId: string): Promise<User | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToUser(data) : null;
}

export async function fetchAllProfiles(): Promise<User[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToUser);
}

/** RLS decides scope: a student gets their own rows, an administrator gets everyone's. */
export async function fetchSessions(userId?: string): Promise<LearningSession[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let q = sb.from('study_sessions').select('*').order('started_at', { ascending: false }).limit(5000);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSession);
}

export async function fetchEvents(): Promise<InteractionEvent[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from('telemetry_events').select('*').order('timestamp', { ascending: false }).limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEvent);
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase is not configured.');
  const { error } = await sb.rpc('admin_delete_user', { target: userId });
  if (error) throw new Error(error.message);
}
