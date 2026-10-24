import React, { useEffect, useMemo, useState } from 'react';
import { Logo } from './Logo';
import { HumanVerification } from './HumanVerification';
import { User } from '../types';
import {
  signIn, signUp, requestPasswordReset, completePasswordRecovery, resetLocalPasswordWithCode, AuthError, BackendMode,
} from '../services/auth';
import { checkPassword } from '../services/validation';
import {
  X, Lock, Mail, User as UserIcon, Building, IdCard, AlertCircle, Eye, EyeOff, Check, Circle,
  Loader2, MailCheck, ShieldCheck, Activity, Brain, KeyRound, ArrowLeft, Copy, Download,
} from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot' | 'recovery' | 'localreset';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  backendMode: BackendMode;
  recovery?: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onRecoveryDone?: () => void;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'];

const inputBase =
  'w-full py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-shadow';

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }> = ({ label, icon, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
    <span className="relative block">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>
      {children}
    </span>
    {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
  </label>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen, initialMode, backendMode, recovery = false, onClose, onSuccess, onRecoveryDone,
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institution, setInstitution] = useState('Higher Education Academy');
  const [humanVerified, setHumanVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [issued, setIssued] = useState<{ user: User; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  // NEW: Remember Me state (defaults to true)
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isOpen) setMode(recovery ? 'recovery' : initialMode);
  }, [isOpen, initialMode, recovery]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
    setHumanVerified(false);
  };

  const pwCheck = useMemo(() => checkPassword(password, { email, name }), [password, email, name]);
  const needsPolicy = mode === 'signup' || mode === 'recovery' || mode === 'localreset';
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode !== 'recovery' && mode !== 'localreset' && !humanVerified) {
      setError('Please complete the security check.');
      return;
    }
    if (needsPolicy) {
      if (!pwCheck.valid) { setError(pwCheck.problem ?? 'Password does not meet the security requirements.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        // PASS rememberMe to the signIn function
        onSuccess(await signIn(email, password, rememberMe));
      } else if (mode === 'signup') {
        const result = await signUp({ name, email, password, studentId, institution });
        if ('user' in result && result.recoveryCode) setIssued({ user: result.user, code: result.recoveryCode });
        else if ('user' in result) onSuccess(result.user);
        else {
          setNotice({
            title: 'Check your inbox',
            body: `We sent a verification link to ${email.trim().toLowerCase()}. Confirm your address, then sign in.`,
          });
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else if (mode === 'localreset') {
        await resetLocalPasswordWithCode(email, recoveryInput, password);
        setNotice({ title: 'Password updated', body: 'Your password was changed. Sign in with the new one.' });
        setRecoveryInput('');
        switchMode('login');
        setNotice({ title: 'Password updated', body: 'Your password was changed. Sign in with the new one.' });
      } else if (mode === 'forgot') {
        await requestPasswordReset(email);
        setNotice({
          title: 'Reset link sent',
          body: 'If an account exists for that address, a password-reset link is on its way.',
        });
        setMode('login');
      } else {
        await completePasswordRecovery(password);
        setNotice({ title: 'Password updated', body: 'Your new password is active. You are now signed in.' });
        onRecoveryDone?.();
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof AuthError || err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles: Record<Mode, { h: string; sub: string; cta: string }> = {
    login:    { h: 'Welcome back',            sub: 'Sign in to continue your adaptive learning journey.', cta: 'Sign in' },
    signup:   { h: 'Create your account',     sub: 'Join the cohort. Your learning signals shape your path.', cta: 'Create account' },
    forgot:   { h: 'Reset your password',     sub: 'Enter your email and we will send a secure reset link.', cta: 'Send reset link' },
    localreset: { h: 'Reset with recovery code', sub: 'Enter the recovery code you saved when you created your account.', cta: 'Reset password' },
    recovery: { h: 'Choose a new password',   sub: 'Pick a strong password you have not used elsewhere.', cta: 'Update password' },
  };
  const t = titles[mode];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={t.h}>
      <div className="relative w-full max-w-4xl max-h-[94vh] flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Brand panel */}
        <aside className="hidden md:flex w-[38%] flex-col justify-between p-8 text-white bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative"><Logo size="md" variant="light" showSubtitle={false} /></div>
          <div className="relative space-y-6">
            <h2 className="font-display text-2xl font-bold leading-snug">Learning that adapts to how you think.</h2>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3"><Activity className="w-4 h-4 mt-0.5 text-teal-300 shrink-0" />Response latency and hesitation become real-time instructional signals.</li>
              <li className="flex gap-3"><Brain className="w-4 h-4 mt-0.5 text-teal-300 shrink-0" />Scaffolding adjusts to your live cognitive load.</li>
              <li className="flex gap-3"><ShieldCheck className="w-4 h-4 mt-0.5 text-teal-300 shrink-0" />Passwords are hashed - never stored or shown in plain text.</li>
            </ul>
          </div>
          <p className="relative text-[11px] text-slate-400">
            {backendMode === 'cloud' ? 'Secured by Supabase Auth with row-level security.' : 'Local mode - data stays on this device.'}
          </p>
        </aside>

        {/* Form panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-6 pt-5 flex items-center justify-between">
            <div className="md:hidden"><Logo size="sm" showSubtitle={false} /></div>
            <span className="hidden md:block" />
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 sm:px-10 pb-8 pt-2 overflow-y-auto flex-1">
            {issued && (
              <div className="space-y-4">
                <h1 className="font-display text-2xl font-bold text-slate-900">Save your recovery code</h1>
                <p className="text-sm text-slate-600">This is the only way to reset your password in local mode. It is shown <strong>once</strong> and is not stored in readable form.</p>
                <div className="font-mono text-xl tracking-wider text-center py-4 rounded-xl bg-slate-900 text-teal-300 select-all">{issued.code}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { navigator.clipboard.writeText(issued.code); setCopied(true); }}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer">
                    <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button type="button" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`CognitiveAdapt recovery code for ${issued.user.email}: ${issued.code}\n`], { type: 'text/plain' })); a.download = 'cognitiveadapt-recovery-code.txt'; a.click(); }}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
                <button type="button" onClick={() => { const u = issued.user; setIssued(null); onSuccess(u); }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl cursor-pointer">I have saved it - continue</button>
              </div>
            )}
            {!issued && (mode === 'forgot' || mode === 'localreset') && (
              <button type="button" onClick={() => switchMode('login')} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
            )}
            {!issued && <><h1 className="font-display text-2xl font-bold text-slate-900">{t.h}</h1>
            <p className="text-sm text-slate-500 mt-1 mb-5">{t.sub}</p></>}

            {!issued && (mode === 'login' || mode === 'signup') && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-5" role="tablist">
                {(['login', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            {backendMode === 'local' && mode === 'signup' && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <strong>Local mode.</strong> Supabase isn't connected, so accounts are stored on this device only.
                The <strong>first account created becomes the administrator</strong>.
              </div>
            )}

            {notice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex gap-2.5">
                <MailCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <div><div className="font-semibold">{notice.title}</div><div className="text-xs mt-0.5">{notice.body}</div></div>
              </div>
            )}

            {error && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" /><span>{error}</span>
              </div>
            )}

            {!issued && <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Full name" icon={<UserIcon className="w-4 h-4" />}>
                      <input type="text" required autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Alex Henderson" maxLength={60} className={`${inputBase} pl-10 pr-3`} />
                    </Field>
                    <Field label="Student ID (optional)" icon={<IdCard className="w-4 h-4" />}>
                      <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)}
                        placeholder="STU-89210" maxLength={20} className={`${inputBase} pl-10 pr-3`} />
                    </Field>
                  </div>
                  <Field label="Institution" icon={<Building className="w-4 h-4" />}>
                    <input type="text" value={institution} onChange={e => setInstitution(e.target.value)}
                      placeholder="Higher Education Academy" maxLength={120} className={`${inputBase} pl-10 pr-3`} />
                  </Field>
                </>
              )}

              {mode !== 'recovery' && (
                <Field label="Email address" icon={<Mail className="w-4 h-4" />}>
                  <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@university.edu" className={`${inputBase} pl-10 pr-3`} />
                </Field>
              )}

              {mode === 'localreset' && (
                <Field label="Recovery code" icon={<KeyRound className="w-4 h-4" />}>
                  <input type="text" required autoComplete="off" value={recoveryInput} onChange={e => setRecoveryInput(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={24} className={`${inputBase} pl-10 pr-3 font-mono uppercase`} />
                </Field>
              )}

              {mode !== 'forgot' && (
                <Field label={mode === 'recovery' || mode === 'localreset' ? 'New password' : 'Password'} icon={<Lock className="w-4 h-4" />}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={needsPolicy ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    maxLength={64}
                    className={`${inputBase} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
              )}

              {needsPolicy && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <span key={i} className={`h-1.5 rounded-full transition-colors ${pwCheck.score >= i ? STRENGTH_COLORS[pwCheck.score] : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 w-12 text-right">{STRENGTH_LABELS[pwCheck.score]}</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                    {pwCheck.rules.map(r => (
                      <li key={r.id} className={`flex items-center gap-1.5 text-[11px] ${r.passed && password ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {r.passed && password ? <Check className="w-3 h-3 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                  {password && !pwCheck.valid && pwCheck.rules.every(r => r.passed) && pwCheck.problem && (
                    <p className="text-[11px] text-rose-700">{pwCheck.problem}</p>
                  )}
                </div>
              )}

              {needsPolicy && (
                <Field label="Confirm password" icon={<KeyRound className="w-4 h-4" />}>
                  <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••••" maxLength={64}
                    className={`${inputBase} pl-10 pr-3 ${mismatch ? 'border-rose-400 focus:ring-rose-400/40 focus:border-rose-400' : ''}`} />
                  {mismatch && <span className="block text-[11px] text-rose-600 mt-1">Passwords do not match.</span>}
                </Field>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between mt-1">
                  {/* NEW: Remember Me Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600">Remember me</span>
                  </label>
                  
                  <button type="button" onClick={() => switchMode(backendMode === 'cloud' ? 'forgot' : 'localreset')} className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer">
                    Forgot password?
                  </button>
                </div>
              )}

              {mode !== 'recovery' && mode !== 'localreset' && <HumanVerification verified={humanVerified} onVerifyChange={setHumanVerified} />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.cta}
              </button>
            </form>}
          </div>
        </div>
      </div>
    </div>
  );
};