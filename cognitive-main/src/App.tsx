import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { User } from './types';
import { initializeStorage } from './services/storage';
import { initAuth, signOut, onPasswordRecovery, BackendStatus } from './services/auth';
import { onSyncStatus, SyncState } from './services/supabase';
import { HomePage } from './components/HomePage';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminPortal } from './components/AdminPortal';
import { Logo } from './components/Logo';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [backend, setBackend] = useState<BackendStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);
  // Arriving from a password-reset email puts 'type=recovery' in the URL hash.
  const [recovering, setRecovering] = useState(() => typeof window !== 'undefined' && /type=recovery/.test(window.location.hash));
  const [sync, setSync] = useState<{ state: SyncState; error: string | null }>({ state: 'local', error: null });

  useEffect(() => {
    initializeStorage();
    let cancelled = false;
    initAuth()
      .then(({ status, user }) => {
        if (cancelled) return;
        setBackend(status);
        setCurrentUser(user);
      })
      .finally(() => !cancelled && setBooting(false));
    const offSync = onSyncStatus((state, error) => setSync({ state, error }));
    const offRecovery = onPasswordRecovery(() => setRecovering(true));
    return () => {
      cancelled = true;
      offSync();
      offRecovery();
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setAuthModalMode(null);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  if (booting || !backend) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5">
        <Logo size="lg" variant="light" showSubtitle={false} />
        <Loader2 className="w-5 h-5 text-teal-300 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  // Signed out: marketing home page + authentication dialog
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <HomePage onOpenAuth={mode => setAuthModalMode(mode)} />
        <AuthModal
          isOpen={authModalMode !== null || recovering}
          initialMode={authModalMode || 'login'}
          backendMode={backend.mode}
          recovery={recovering}
          onClose={() => { setAuthModalMode(null); setRecovering(false); }}
          onSuccess={handleLoginSuccess}
          onRecoveryDone={() => setRecovering(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar user={currentUser} onLogout={handleLogout} backendMode={backend.mode} syncState={sync.state} syncError={sync.error} />

      <main className="flex-1 pb-16">
        {currentUser.role === 'admin' ? (
          <AdminPortal currentUser={currentUser} backend={backend} />
        ) : (
          <StudentDashboard user={currentUser} />
        )}
      </main>

      <AuthModal
        isOpen={recovering}
        initialMode="login"
        backendMode={backend.mode}
        recovery
        onClose={() => { setRecovering(false); history.replaceState(null, '', window.location.pathname); }}
        onSuccess={handleLoginSuccess}
        onRecoveryDone={() => { setRecovering(false); history.replaceState(null, '', window.location.pathname); }}
      />

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CognitiveAdapt · Behavioural Adaptive Learning System</span>
          <span className="font-mono text-[11px] text-slate-400">
            {backend.mode === 'cloud' ? 'Cloud mode · Supabase Auth + RLS' : 'Local mode · data stored on this device'}
          </span>
        </div>
      </footer>
    </div>
  );
}
