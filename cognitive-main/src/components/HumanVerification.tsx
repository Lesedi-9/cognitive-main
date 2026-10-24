import React, { useState } from 'react';
import { ShieldCheck, Loader2, Check } from 'lucide-react';

interface HumanVerificationProps {
  verified: boolean;
  onVerifyChange: (isVerified: boolean) => void;
  id?: string;
}

export const HumanVerification: React.FC<HumanVerificationProps> = ({
  verified,
  onVerifyChange,
  id = 'human-verification'
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    if (verified) {
      onVerifyChange(false);
      return;
    }

    setLoading(true);
    // Realistic verification challenge pause
    setTimeout(() => {
      setLoading(false);
      onVerifyChange(true);
    }, 700);
  };

  return (
    <div
      id={id}
      className={`flex items-center justify-between py-2 px-3 rounded-xl border transition-all duration-200 select-none ${
        verified
          ? 'bg-emerald-50/70 border-emerald-300'
          : 'bg-slate-50 border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer border ${
            verified
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-slate-300 hover:border-blue-500'
          }`}
          aria-label="Verify you are human"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : verified ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : null}
        </button>

        <span
          onClick={handleToggle}
          className={`text-xs font-medium cursor-pointer ${
            verified ? 'text-emerald-900' : 'text-slate-700'
          }`}
        >
          {verified ? 'Human verification confirmed' : 'I am not a robot'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-right">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[10px] font-semibold text-slate-500">Security Guard</span>
      </div>
    </div>
  );
};
