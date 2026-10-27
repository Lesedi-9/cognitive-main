import React, { useState } from 'react';
import { getSupabaseClient } from '../services/supabase';
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  backendMode?: string;
  recovery?: boolean;
  onSuccess?: (user: any) => void;
  onRecoveryDone?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError("Local Mode: Supabase is not configured, cannot authenticate.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        onClose();
      } else {
        const saPhoneRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
        const cleanPhone = phone.replace(/\s/g, '');
        
        if (!saPhoneRegex.test(cleanPhone)) {
          setError('Please enter a valid South African phone number (e.g., +27 82 123 4567).');
          setLoading(false);
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone_number: cleanPhone } },
        });

        if (signUpError) throw signUpError;
        setIsVerifying(true);
        setMessage('Account created! Please check your email for the 6-digit verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase!.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'signup',
      });

      if (error) throw error;

      setMessage('Account fully verified! Logging you in...');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e1e24] border border-[#2e2e38] rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-extrabold text-white text-center mb-6">
          {isVerifying ? 'Verify Your Email' : isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {error && <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">{error}</div>}
        {message && <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">{message}</div>}

        {!isVerifying ? (
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[#121212] border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[#121212] border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@example.com" />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Phone Number (South Africa)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-[#121212] border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+27 82 123 4567" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full pl-9 pr-10 py-2.5 bg-[#121212] border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CHANGED TEXT HERE */}
            <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center mb-6">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-300">We sent a 6-digit code to <strong className="text-white">{email}</strong>. Enter it below.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 text-center">Email Verification Code</label>
              <input type="text" required value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} className="w-full px-3 py-3 bg-[#121212] border border-slate-600 rounded-xl text-white text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="000000" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg">
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>
        )}

        {!isVerifying && (
          <p className="text-center text-xs text-slate-400 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }} className="text-blue-500 font-bold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};