/**
 * Input validation + password policy.
 * Every rule is a regular expression so it is easy to audit and to unit test.
 */

export const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
export const NAME_REGEX = /^\p{L}[\p{L}\p{M}'’.\- ]{1,59}$/u;
export const STUDENT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9\-_/]{2,19}$/;

/** Individual password rules, shown live as a checklist while typing. */
export const PASSWORD_RULES = [
  { id: 'length',  label: '8–64 characters',                   test: /^.{8,64}$/ },
  { id: 'lower',   label: 'One lowercase letter (a–z)',        test: /[a-z]/ },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',        test: /[A-Z]/ },
  { id: 'digit',   label: 'One number (0–9)',                  test: /\d/ },
  { id: 'special', label: 'One special character (!@#$%…)',    test: /[^A-Za-z0-9\s]/ },
  { id: 'nospace', label: 'No spaces',                         test: /^\S*$/ },
  { id: 'repeat',  label: 'No character repeated 3+ times',    test: /^(?!.*(.)\1\1)/s },
] as const;

/** The full policy as a single expression (all rules above, combined). */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?!.*(.)\1\1)\S{8,64}$/s;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'qwerty123', 'qwertyuiop',
  'letmein123', 'welcome123', 'admin123', 'iloveyou1', 'abc12345', '12345678',
  '123456789', 'changeme', 'p@ssw0rd', 'p@ssword1', 'godfather',
]);

export interface PasswordCheck {
  valid: boolean;
  /** 0 (empty) – 4 (strong) */
  score: 0 | 1 | 2 | 3 | 4;
  rules: { id: string; label: string; passed: boolean }[];
  /** First human-readable problem, or null when valid. */
  problem: string | null;
}

export function checkPassword(password: string, context: { email?: string; name?: string } = {}): PasswordCheck {
  const rules = PASSWORD_RULES.map(r => ({ id: r.id, label: r.label, passed: r.test.test(password) }));
  const passedCount = rules.filter(r => r.passed).length;

  let problem: string | null = null;
  const firstFailed = rules.find(r => !r.passed);
  if (firstFailed) problem = `Password requirement not met - ${firstFailed.label}.`;

  if (!problem && COMMON_PASSWORDS.has(password.toLowerCase())) {
    problem = 'That password is too common. Choose something less predictable.';
  }

  if (!problem) {
    const localPart = (context.email || '').split('@')[0].toLowerCase();
    if (localPart.length >= 4 && password.toLowerCase().includes(localPart)) {
      problem = 'Password must not contain your email address.';
    }
    const nameParts = (context.name || '').toLowerCase().split(/\s+/).filter(p => p.length >= 4);
    if (!problem && nameParts.some(p => password.toLowerCase().includes(p))) {
      problem = 'Password must not contain your name.';
    }
  }

  const valid = problem === null && PASSWORD_REGEX.test(password);

  let score: PasswordCheck['score'] = 0;
  if (password.length > 0) {
    const bonus = (password.length >= 12 ? 1 : 0) + (password.length >= 16 ? 1 : 0);
    const raw = Math.floor(((passedCount / rules.length) * 3)) + bonus;
    score = Math.max(1, Math.min(4, valid ? Math.max(raw, 2) : Math.min(raw, 2))) as PasswordCheck['score'];
  }

  return { valid, score, rules, problem };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const e = normalizeEmail(email);
  if (!e) return 'Email address is required.';
  if (e.length > 254 || !EMAIL_REGEX.test(e)) return 'Enter a valid email address (e.g. name@university.edu).';
  return null;
}

export function validateName(name: string): string | null {
  const n = name.trim().replace(/\s+/g, ' ');
  if (!NAME_REGEX.test(n)) return 'Enter your full name (letters, spaces, hyphens and apostrophes only).';
  return null;
}

export function validateStudentId(id: string): string | null {
  if (!id.trim()) return null; // optional
  return STUDENT_ID_REGEX.test(id.trim()) ? null : 'ID must be 3–20 characters: letters, numbers, - _ /';
}
