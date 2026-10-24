import React from 'react';
import { Logo } from './Logo';
import { User } from '../types';
import { SyncState } from '../services/supabase';
import { BackendMode } from '../services/auth';
import { LogOut, Shield, GraduationCap, Cloud, CloudOff, HardDrive, Loader2, Sliders } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  backendMode: BackendMode;
  syncState: SyncState;
  syncError: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, backendMode, syncState, syncError }) => {
  const badge =
    backendMode === 'local'
      ? { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: <HardDrive className="w-3 h-3" />, text: 'Local mode', title: 'Data is stored on this device only. Add Supabase keys to .env for cloud sync.' }
      : syncState === 'error'
        ? { cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <CloudOff className="w-3 h-3" />, text: 'Sync issue', title: syncError ?? 'Sync failed' }
        : syncState === 'syncing'
          ? { cls: 'bg-teal-50 text-teal-700 border-teal-200', icon: <Loader2 className="w-3 h-3 animate-spin" />, text: 'Syncing…', title: 'Saving to Supabase' }
          : { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Cloud className="w-3 h-3" />, text: 'Cloud synced', title: 'Connected to Supabase' };

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size="sm" showSubtitle={false} />
          {user.role === 'admin' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sliders className="w-3.5 h-3.5" />
              <span>Admin & Research Portal</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.cls}`} title={badge.title}>
            {badge.icon}
            <span>{badge.text}</span>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center justify-end gap-1">
                {user.role === 'admin' ? (
                  <>
                    <Shield className="w-2.5 h-2.5 text-blue-600" />
                    <span className="text-blue-600 font-semibold">Administrator</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-2.5 h-2.5 text-slate-500" />
                    <span>{user.studentId || 'Student'}</span>
                  </>
                )}
              </span>
            </div>

            <button
              id="user-logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
