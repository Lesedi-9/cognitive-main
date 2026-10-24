import { User, LearningSession, InteractionEvent } from '../types';
import {
  getSupabaseClient, probeBackend, BackendProbe, setActiveCloudUser, fetchProfile, fetchAllProfiles,
  fetchSessions, fetchEvents, adminDeleteUser, touchLastLogin, flushLocalToCloud,
} from './supabase';
import {
  getUsers, saveUser, deleteUser as deleteLocalUser, getLocalCredentials, setLocalCredential,
  getCurrentUserId, setCurrentUserId, clearCurrentUserId, getSessions, getInteractionEvents,
  mergeSessions, LocalCredential,
} from './storage';
import { checkPassword, normalizeEmail, validateEmail, validateName, validateStudentId } from './validation';

export type BackendMode = 'cloud' | 'local';

export interface BackendStatus {
  mode: BackendMode;
  probe: BackendProbe;
}

let mode: BackendMode = 'local';
export const getBackendMode = () => mode;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export class AuthError extends Error {}

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';
const PBKDF2_ITERATIONS = 310_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array((hex.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new AuthError('Secure hashing is unavailable. Open the app at http://localhost:3000 (not a network IP).');
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return toHex(bits);
}

async function makeCredential(password: string): Promise<LocalCredential> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toHex(salt), hash: await derive(password, salt, PBKDF2_ITERATIONS), iterations: PBKDF2_ITERATIONS };
}

/** Constant-time comparison of two hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Client-side brute-force throttle: 5 failures -> 30 s lockout (per email). */
const failures = new Map<string, { count: number; until: number }>();
function assertNotLocked(email: string) {
  const f = failures.get(email);
  if (f && f.until > Date.now()) {
    throw new AuthError(`Too many failed attempts. Try again in ${Math.ceil((f.until - Date.now()) / 1000)}s.`);
  }
}
function recordFailure(email: string) {
  const f = failures.get(email) ?? { count: 0, until: 0 };
  f.count += 1;
  if (f.count >= 5) { f.until = Date.now() + 30_000; f.count = 0; }
  failures.set(email, f);
}

/* -------------------------------------------------------------------------- */
/*  Boot                                                                       */
/* -------------------------------------------------------------------------- */

/** Pre-hardening builds kept plaintext passwords in the profile. Hash them and drop the defaults. */
async function migrateLegacyLocalAccounts() {
  type Legacy = User & { passwordHash?: string };
  const users = getUsers() as Legacy[];
  if (!users.some(u => u.passwordHash !== undefined)) return;
  const kept: Legacy[] = [];
  for (const u of users) {
    if (u.passwordHash === undefined) { kept.push(u); continue; }
    if (u.id === 'usr-admin-01') continue; // well-known default admin: remove
    if (!getLocalCredentials()[u.id]) setLocalCredential(u.id, await makeCredential(u.passwordHash));
    const { passwordHash: _drop, ...clean } = u;
    kept.push(clean as Legacy);
  }
  localStorage.setItem('cogadapt_users', JSON.stringify(kept));
}

export async function initAuth(): Promise<{ status: BackendStatus; user: User | null }> {
  const probe = await probeBackend();
  mode = probe.configured && probe.reachable && probe.schemaReady ? 'cloud' : 'local';
  const status: BackendStatus = { mode, probe };

  if (mode === 'local') {
    await migrateLegacyLocalAccounts();
    // Check sessionStorage first (for non-remembered logins), then fallback to storage helper
    const id = sessionStorage.getItem('cogadapt_current_user') || getCurrentUserId();
    const user = id ? getUsers().find(u => u.id === id) ?? null : null;
    
    if (!user) {
       clearCurrentUserId();
       sessionStorage.removeItem('cogadapt_current_user');
    }
    setActiveCloudUser(null);
    return { status, user };
  }

  const sb = getSupabaseClient()!;
  const { data } = await sb.auth.getSession();
  if (!data.session) return { status, user: null };
  try {
    const user = await fetchProfile(data.session.user.id);
    if (!user) { await sb.auth.signOut(); return { status, user: null }; }
    await activateCloudUser(user);
    return { status, user };
  } catch {
    return { status, user: null };
  }
}

async function activateCloudUser(user: User) {
  setActiveCloudUser(user.id);
  void touchLastLogin(user.id);
  await flushLocalToCloud(user.id, getSessions(), getInteractionEvents());
  if (user.role === 'student') {
    try { mergeSessions(await fetchSessions(user.id)); } catch { /* offline: cached data is fine */ }
  }
}

/* -------------------------------------------------------------------------- */
/*  Sign up / in / out                                                         */
/* -------------------------------------------------------------------------- */

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  institution?: string;
}

export type SignUpResult = { user: User; recoveryCode?: string } | { needsEmailConfirmation: true };

const RECOVERY_KEY = 'cogadapt_local_recovery';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const readRecovery = (): Record<string, LocalCredential> => {
  try { return JSON.parse(localStorage.getItem(RECOVERY_KEY) ?? '{}'); } catch { return {}; }
};
function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return [0, 4, 8, 12].map(i => chars.slice(i, i + 4).join('')).join('-');
}
const normalizeCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim().replace(/\s+/g, ' ');
  const problem =
    validateName(name) ?? validateEmail(email) ?? validateStudentId(input.studentId ?? '') ??
    checkPassword(input.password, { email, name }).problem;
  if (problem) throw new AuthError(problem);

  const institution = input.institution?.trim().slice(0, 120) || 'Higher Education Academy';
  const studentId = input.studentId?.trim() || undefined;

  if (mode === 'cloud') {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.auth.signUp({
      email,
      password: input.password,
      options: { data: { name, student_id: studentId ?? '', institution, department: 'Cognitive Science & Computer Science' } },
    });
    if (error) throw new AuthError(error.message);
    if (data.user && data.user.identities?.length === 0) {
      throw new AuthError('An account with this email already exists. Please sign in.');
    }
    if (!data.session || !data.user) return { needsEmailConfirmation: true };
    const user = await fetchProfile(data.user.id);
    if (!user) throw new AuthError('Account created but the profile could not be loaded. Run supabase/schema.sql.');
    await activateCloudUser(user);
    return { user };
  }

  // ---- local mode ----
  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email)) {
    throw new AuthError('An account with this email already exists. Please sign in.');
  }
  const isFirst = users.length === 0;
  const now = new Date().toISOString();
  const user: User = {
    id: `usr-${crypto.randomUUID()}`,
    name,
    email,
    role: isFirst ? 'admin' : 'student',
    studentId: isFirst ? undefined : studentId ?? `STU-${Math.floor(100000 + Math.random() * 900000)}`,
    institution,
    department: isFirst ? 'Academic Administration & Research' : 'Cognitive Science & Computer Science',
    createdAt: now,
    lastLoginAt: now,
  };
  setLocalCredential(user.id, await makeCredential(input.password));
  const recoveryCode = generateRecoveryCode();
  const rec = readRecovery();
  rec[user.id] = await makeCredential(normalizeCode(recoveryCode));
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(rec));
  saveUser(user);
  setCurrentUserId(user.id);
  return { user, recoveryCode };
}

// UPDATED: Added rememberMe parameter
export async function signIn(emailRaw: string, password: string, rememberMe: boolean = true): Promise<User> {
  const email = normalizeEmail(emailRaw);
  const emailProblem = validateEmail(email);
  if (emailProblem) throw new AuthError(emailProblem);
  if (!password) throw new AuthError('Enter your password.');
  assertNotLocked(email);

  if (mode === 'cloud') {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (/confirm/i.test(error.message)) throw new AuthError('Please confirm your email address first - check your inbox for the verification link.');
      recordFailure(email);
      throw new AuthError(/invalid login/i.test(error.message) ? GENERIC_LOGIN_ERROR : error.message);
    }
    const user = await fetchProfile(data.user.id);
    if (!user) {
      await sb.auth.signOut();
      throw new AuthError('No profile found for this account. Ask an administrator to check the database setup.');
    }
    
    // Supabase defaults to localStorage. If they don't want to be remembered, 
    // we can add a listener to sign them out on tab close.
    if (!rememberMe) {
      window.addEventListener('beforeunload', () => {
        const client = getSupabaseClient();
        client?.auth.signOut();
      }, { once: true });
    }

    failures.delete(email);
    await activateCloudUser(user);
    return user;
  }

  const user = getUsers().find(u => u.email.toLowerCase() === email);
  const cred = user ? getLocalCredentials()[user.id] : undefined;
  const candidate = await derive(password, cred ? fromHex(cred.salt) : new Uint8Array(16), cred?.iterations ?? PBKDF2_ITERATIONS);
  if (!user || !cred || !safeEqual(candidate, cred.hash)) {
    recordFailure(email);
    throw new AuthError(GENERIC_LOGIN_ERROR);
  }
  
  failures.delete(email);
  const updated = { ...user, lastLoginAt: new Date().toISOString() };
  saveUser(updated);
  
  // Local Mode: Determine where to store the session
  if (rememberMe) {
    setCurrentUserId(updated.id);
    sessionStorage.removeItem('cogadapt_current_user');
  } else {
    sessionStorage.setItem('cogadapt_current_user', updated.id);
  }
  
  return updated;
}

export async function signOut(): Promise<void> {
  if (mode === 'cloud') await getSupabaseClient()?.auth.signOut();
  clearCurrentUserId();
  sessionStorage.removeItem('cogadapt_current_user'); // Clear session storage too
  setActiveCloudUser(null);
}

/* -------------------------------------------------------------------------- */
/*  Password recovery                                                          */
/* -------------------------------------------------------------------------- */

export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  const problem = validateEmail(email);
  if (problem) throw new AuthError(problem);
  const sb = getSupabaseClient();
  if (mode !== 'cloud' || !sb) throw new AuthError('Use your recovery code to reset your password in local mode.');
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) throw new AuthError(error.message);
}

export function onPasswordRecovery(cb: () => void): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') cb(); });
  return () => data.subscription.unsubscribe();
}

export async function completePasswordRecovery(password: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new AuthError('Supabase is not configured.');
  const problem = checkPassword(password).problem;
  if (problem) throw new AuthError(problem);
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw new AuthError(error.message);
}

export async function resetLocalPasswordWithCode(emailRaw: string, code: string, password: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  assertNotLocked('recovery:' + email);
  const user = getUsers().find(u => u.email.toLowerCase() === email);
  const rec = user ? readRecovery()[user.id] : undefined;
  const candidate = await derive(normalizeCode(code), rec ? fromHex(rec.salt) : new Uint8Array(16), rec?.iterations ?? PBKDF2_ITERATIONS);
  if (!user || !rec || !safeEqual(candidate, rec.hash)) {
    recordFailure('recovery:' + email);
    throw new AuthError('Email or recovery code is incorrect.');
  }
  const problem = checkPassword(password, { email, name: user.name }).problem;
  if (problem) throw new AuthError(problem);
  setLocalCredential(user.id, await makeCredential(password));
  failures.delete('recovery:' + email);
}

export async function adminSetLocalPassword(userId: string, password: string): Promise<void> {
  if (mode !== 'local') throw new AuthError('In cloud mode, use "Send reset email" instead.');
  const target = getUsers().find(u => u.id === userId);
  if (!target) throw new AuthError('User not found.');
  const problem = checkPassword(password, { email: target.email, name: target.name }).problem;
  if (problem) throw new AuthError(problem);
  setLocalCredential(userId, await makeCredential(password));
}

/* -------------------------------------------------------------------------- */
/*  Data access for the admin portal / dashboards                              */
/* -------------------------------------------------------------------------- */

export async function listUsers(): Promise<User[]> {
  return mode === 'cloud' ? fetchAllProfiles() : getUsers();
}

export async function listSessions(): Promise<LearningSession[]> {
  return mode === 'cloud' ? fetchSessions() : getSessions();
}

export async function listEvents(): Promise<InteractionEvent[]> {
  return mode === 'cloud' ? fetchEvents() : getInteractionEvents();
}

export async function listUserSessions(userId: string): Promise<LearningSession[]> {
  if (mode === 'cloud') {
    try { mergeSessions(await fetchSessions(userId)); } catch { /* fall back to cache */ }
  }
  return getSessions().filter(s => s.userId === userId);
}

export async function deleteAccount(userId: string): Promise<void> {
  if (mode === 'cloud') await adminDeleteUser(userId);
  else deleteLocalUser(userId);
}