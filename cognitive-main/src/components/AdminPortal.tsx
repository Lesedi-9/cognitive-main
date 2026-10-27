import React, { useState, useEffect, useCallback } from 'react';
import { User, LearningSession, InteractionEvent, SystemSettings, LearningModule } from '../types';
import {
  getSystemSettings,
  saveSystemSettings,
  getModules,
} from '../services/storage';
import {
  BackendStatus,
  listUsers,
  listSessions,
  listEvents,
  deleteAccount,
  requestPasswordReset,
  adminSetLocalPassword,
} from '../services/auth';
import { probeBackend, BackendProbe, SUPABASE_SQL_SCHEMA, SUPABASE_PROJECT_REF, SUPABASE_URL } from '../services/supabase';
import { checkPassword } from '../services/validation';
import {
  Users, KeyRound, Trash2, Download, Database, Sliders, Activity, CheckCircle2, AlertCircle,
  FileSpreadsheet, Shield, GraduationCap, Copy, Check, Search, RefreshCw,
  ExternalLink, X
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
  backend: BackendStatus;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, backend }) => {
  const isCloud = backend.mode === 'cloud';
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'telemetry' | 'system' | 'supabase'>('users');

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [events, setEvents] = useState<InteractionEvent[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getSystemSettings());
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Password / reset modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // User deletion confirm (Deprecated in favor of window.confirm, but kept for safety)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Supabase health
  const [probe, setProbe] = useState<BackendProbe>(backend.probe);
  const [checkingTables, setCheckingTables] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleCheckTables = async () => {
    setCheckingTables(true);
    setProbe(await probeBackend());
    setCheckingTables(false);
  };

  useEffect(() => {
    if (activeTab === 'supabase') handleCheckTables();
  }, [activeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [u, s, e] = await Promise.all([listUsers(), listSessions(), listEvents()]);
      setUsers(u);
      setSessions(s);
      setEvents(e);
      setSettings(getSystemSettings());
      setModules(getModules());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const localPwCheck = checkPassword(newPassword, { email: editingUser?.email, name: editingUser?.name });

    const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setPasswordMessage(null);
    try {
      if (isCloud) {
        await requestPasswordReset(editingUser.email);
        setPasswordMessage({ ok: true, text: `Reset link emailed to ${editingUser.email}.` });
      } else {
        await adminSetLocalPassword(editingUser.id, newPassword);
        setPasswordMessage({ ok: true, text: `Password updated for ${editingUser.name}.` });
      }
      setTimeout(() => {
        setEditingUser(null);
        setNewPassword('');
        setPasswordMessage(null);
      }, 1600);
    } catch (err: any) {
      // Show the ACTUAL error from Supabase
      setPasswordMessage({ ok: false, text: err.message || 'Failed to reset password.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      setActionError('You cannot delete the currently authenticated administrator account.');
      return;
    }
    try {
      await deleteAccount(userId);
      setActionError(null);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete account.');
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemSettings(settings);
    alert('Cognitive adaptation thresholds and parameters updated.');
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- CSV GENERATION UTILS ---
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUserRoster = () => {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Institution', 'Student ID', 'Date Joined'];
    const rows = users.map(u => [
      u.id, u.name, u.email, u.role, u.institution || 'N/A', u.studentId || 'N/A', new Date(u.createdAt).toLocaleDateString()
    ]);
    downloadCsv('User_Roster_Report.csv', headers, rows);
  };

  const exportScoresPerformance = () => {
    const headers = ['Session ID', 'User Name', 'User Email', 'Module Title', 'Accuracy (%)', 'Avg Latency (s)', 'Cognitive Load (CLI)', 'Predicted State', 'Date'];
    const rows = sessions.map(s => {
      const user = users.find(u => u.id === s.userId);
      const totalQ = s.responses.length;
      const correctQ = s.responses.filter(r => r.isCorrect).length;
      const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
      const latency = ((s.finalMetrics?.averageResponseTimeMs || 0) / 1000).toFixed(1);
      return [
        s.id, user?.name || 'Unknown', user?.email || 'Unknown', s.moduleTitle, accuracy, latency,
        s.finalMetrics?.cognitiveLoadIndex || 0, (s.finalMetrics?.predictedState || 'N/A').replace('_', ' '),
        new Date(s.startedAt).toLocaleDateString()
      ];
    });
    downloadCsv('Cognitive_Performance_Scores.csv', headers, rows);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      
      {/* MODAL: Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-2">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-6">Update credentials for <strong className="text-slate-900">{editingUser.name}</strong>.</p>
            
            {passwordMessage && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-bold ${passwordMessage.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              {!isCloud && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg">
                {isCloud ? 'Send Reset Email' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Banner & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              IES ADMIN ENGINE
            </span>
            <span className="text-xs text-slate-500 font-semibold">Institutional Governance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            System Control & Research Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage real academic accounts, monitor live cognitive interaction telemetry, download analytical reports, and configure Supabase.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Real Data</span>
        </button>
      </div>

      {(loadError || actionError) && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{loadError || actionError}</span>
        </div>
      )}
      {loading && <div className="text-xs text-slate-500 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading data{isCloud ? ' from Supabase' : ''}…</div>}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Users className="w-4 h-4" /> <span>User Management ({users.length})</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Download className="w-4 h-4" /> <span>Download Reports</span>
        </button>
        <button onClick={() => setActiveTab('telemetry')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'telemetry' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Activity className="w-4 h-4" /> <span>Live Telemetry Stream ({events.length})</span>
        </button>
        <button onClick={() => setActiveTab('system')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'system' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Sliders className="w-4 h-4" /> <span>Adaptive Heuristic Controls</span>
        </button>
        <button onClick={() => setActiveTab('supabase')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'supabase' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Database className="w-4 h-4" /> <span>Supabase Database Hub</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registered System Users</h3>
              <p className="text-xs text-slate-500">Reset credentials or remove accounts. Passwords are never visible.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name, email, ID..." className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Institution / ID</th>
                    <th className="py-3 px-4">Sessions</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">No users match the search criteria.</td></tr>
                  ) : (
                    filteredUsers.map(u => {
                      const userSessionCount = sessions.filter(s => s.userId === u.id).length;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'}`}>
                              {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <GraduationCap className="w-2.5 h-2.5" />}
                              <span>{u.role}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800">{u.institution || 'Higher Education'}</div>
                            <div className="text-slate-400 text-[11px]">{u.studentId || u.department || 'N/A'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{userSessionCount}</td>
                          <td className="py-3.5 px-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setEditingUser(u); setNewPassword(''); setPasswordMessage(null); }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Reset password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              {u.id !== currentUser.id && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to permanently delete ${u.name}? This action cannot be undone.`)) {
                                      handleDeleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ... (Keep the rest of the AdminPortal tabs: reports, telemetry, system, supabase exactly as they are) ... */}
      
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Academic & Empirical Research Reports</h3>
            <p className="text-xs text-slate-500">Download real, un-synthesized datasets collected from student interactions for academic defense and institutional reporting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Users className="w-5 h-5" /></div>
                <h4 className="font-bold text-slate-900 text-base">User Roster & Demographics</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Export a structured CSV containing all registered students and administrators, including their institutions, roles, student IDs, and registration dates.</p>
              </div>
              <button onClick={exportUserRoster} className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Download className="w-4 h-4" /> <span>Download User Roster CSV</span>
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5" /></div>
                <h4 className="font-bold text-slate-900 text-base">Cognitive Scores & Performance</h4>
                <p className="text-xs text-slate-600 leading-relaxed">Export session-level data including module names, student accuracy percentages, average response latencies, and final Cognitive Load Index (CLI) scores.</p>
              </div>
              <button onClick={exportScoresPerformance} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
                <Download className="w-4 h-4" /> <span>Download Performance CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live Cognitive Interaction Telemetry Stream</h3>
            <p className="text-xs text-slate-500">Real-time audit log of student behavioural micro-interactions.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No telemetry events logged yet. Once students begin solving curriculum problems, sub-second interaction logs will stream here.</div>
            ) : (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Time Spent</th>
                      <th className="py-3 px-4">Cognitive Load</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {[...events].reverse().slice(0, 100).map(evt => (
                      <tr key={evt.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold font-sans">{users.find(u => u.id === evt.userId)?.name || evt.userId}</td>
                        <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">{evt.eventType}</span></td>
                        <td className="py-2.5 px-4 text-slate-600">{(evt.timeSpentMs / 1000).toFixed(1)}s</td>
                        <td className="py-2.5 px-4 text-blue-600 font-bold">{evt.cognitiveLoadEstimate !== undefined ? `${evt.cognitiveLoadEstimate}/100` : '—'}</td>
                        <td className="py-2.5 px-4 text-slate-700 font-sans max-w-xs truncate" title={evt.details}>{evt.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cognitive Load Heuristic Parameters</h3>
            <p className="text-xs text-slate-500">Configure the sensitivity thresholds that govern dynamic scaffolding and pacing in the learning engine.</p>
          </div>
          <form onSubmit={handleSaveThresholds} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Response Latency Hesitation Alert Cutoff (Milliseconds)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="5000" max="45000" step="1000" value={settings.responseTimeHesitationThresholdMs} onChange={e => setSettings({ ...settings, responseTimeHesitationThresholdMs: Number(e.target.value) })} className="flex-1 accent-blue-600" />
                  <span className="text-xs font-mono font-bold text-slate-900 w-16 text-right">{(settings.responseTimeHesitationThresholdMs / 1000).toFixed(1)}s</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Threshold after which lingering on a question is classified as elevated cognitive conflict.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consecutive Error Limit for Automatic Scaffolding</label>
                <input type="number" min="1" max="5" value={settings.highErrorThresholdCount} onChange={e => setSettings({ ...settings, highErrorThresholdCount: Number(e.target.value) })} className="w-32 px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono" />
                <p className="text-[11px] text-slate-400 mt-1">Number of incorrect choices before sub-goal scaffolding hints are forcibly presented.</p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div><span className="text-xs font-bold text-slate-800 block">Constructivist Dynamic Scaffolding</span><span className="text-[11px] text-slate-500">Automatically display step-by-step guidance on detected overload.</span></div>
                <input type="checkbox" checked={settings.autoScaffoldEnabled} onChange={e => setSettings({ ...settings, autoScaffoldEnabled: e.target.checked })} className="w-4 h-4 accent-blue-600 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div><span className="text-xs font-bold text-slate-800 block">Adaptive Difficulty Scaling</span><span className="text-[11px] text-slate-500">Promote fluent students to stretch challenges automatically.</span></div>
                <input type="checkbox" checked={settings.adaptiveDifficultyScaling} onChange={e => setSettings({ ...settings, adaptiveDifficultyScaling: e.target.checked })} className="w-4 h-4 accent-blue-600 cursor-pointer" />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">Save Threshold Parameters</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Supabase Database Hub</h3>
              <p className="text-xs text-slate-500">
                {probe.configured ? (<>Project <span className="font-mono font-bold text-blue-600">{SUPABASE_PROJECT_REF}</span> · <span className="font-mono">{SUPABASE_URL}</span></>) : (<>No project configured. Copy <span className="font-mono">.env.example</span> to <span className="font-mono">.env</span> and add your keys.</>)}
              </p>
            </div>
            {probe.configured && (
              <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-2xs transition-all">
                <span>Open Supabase SQL Editor</span> <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Database className="w-4 h-4" /></div>
                <div><h4 className="text-sm font-bold text-slate-900">Connection & Schema Health</h4><p className="text-[11px] text-slate-500">{probe.message}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isCloud ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>{isCloud ? 'Cloud mode active' : 'Local mode'}</span>
                <button type="button" onClick={handleCheckTables} disabled={checkingTables} className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${checkingTables ? 'animate-spin' : ''}`} /> <span>{checkingTables ? 'Checking...' : 'Re-check'}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([['profiles', 'Accounts & roles', probe.tables.profiles],['study_sessions', 'Module session scores', probe.tables.sessions],['telemetry_events', 'Sub-second telemetry', probe.tables.events]] as const).map(([name, desc, ok]) => (
                <div key={name} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div><div className="text-[11px] font-bold text-slate-700 font-mono">{name}</div><div className="text-[10px] text-slate-400">{desc}</div></div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{ok ? 'Active' : 'Missing'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};