import { User, LearningModule, LearningSession, InteractionEvent, SystemSettings } from '../types';
import { EXTRA_MODULES } from './extraModules';
import { syncSessionToSupabase, syncInteractionToSupabase } from './supabase';

const USERS_KEY = 'cogadapt_users';
const CURRENT_USER_KEY = 'cogadapt_current_user';
const SESSIONS_KEY = 'cogadapt_sessions';
const EVENTS_KEY = 'cogadapt_events';
const MODULES_KEY = 'cogadapt_modules';
const SETTINGS_KEY = 'cogadapt_settings';
const CREDENTIALS_KEY = 'cogadapt_local_credentials';

// Real university-level academic modules for higher education students to engage with
const INITIAL_CURRICULUM_MODULES: LearningModule[] = [
  {
    id: 'mod-cog-101',
    code: 'CS-408',
    title: 'Cognitive Computing & Dynamic Scaffolding',
    academicDiscipline: 'Artificial Intelligence & Cognitive Science',
    description: 'Explores real-time cognitive load detection, working memory limitations (Sweller CLT), and algorithmic scaffolding in adaptive pedagogical environments.',
    estimatedMinutes: 15,
    prerequisites: ['Foundations of AI', 'Human-Computer Interaction'],
    learningOutcomes: [
      'Differentiate between intrinsic, extraneous, and germane cognitive load',
      'Analyze how response latency and hesitation patterns indicate schema acquisition',
      'Design rule-based intervention heuristics for real-time instructional adaptation'
    ],
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-cog-1',
        text: 'According to Cognitive Load Theory (CLT), which instructional adaptation is most effective when a student exhibits high extraneous cognitive load due to complex multi-step problem syntax?',
        targetConcept: 'Cognitive Load Reduction Heuristics',
        difficulty: 'introductory',
        options: [
          'Increase the number of choices to foster exploratory constructivist discovery',
          'Provide worked examples and step-by-step sub-goal scaffolding to minimize split-attention effect',
          'Accelerate the pacing timer to incentivize automaticity and working memory speed',
          'Remove explanatory diagrams and rely purely on formal abstract mathematical notation'
        ],
        correctAnswerIndex: 1,
        explanation: 'Worked examples and sub-goal scaffolding directly mitigate extraneous cognitive load by reducing unguided search in working memory (Sweller et al., 2011).',
        scaffoldHint: 'Consider how working memory has limited capacity: eliminating unguided problem searching frees mental bandwidth.',
        baselineExpectedSeconds: 22
      },
      {
        id: 'q-cog-2',
        text: 'A student reading an interactive data structures proof spends 72 seconds on a single node traversal step with 4 choice modifications before finalizing. What does this behavioral pattern primarily signify?',
        targetConcept: 'Behavioral Hesitation & Working Memory Saturation',
        difficulty: 'intermediate',
        options: [
          'Careless guessing due to disengagement and rapid skimming',
          'Elevated cognitive conflict and hesitation caused by schema ambiguity or mental model friction',
          'Fluent mastery of the conceptual domain requiring immediate difficulty escalation',
          'System networking latency rather than student behavioral dynamics'
        ],
        correctAnswerIndex: 1,
        explanation: 'Prolonged dwell time coupled with multiple choice toggles indicates cognitive hesitation and working memory conflict as the learner actively attempts to reconcile conflicting mental models (Frontiers in Psychology, 2022).',
        scaffoldHint: 'Multiple choice changes combined with long reaction time indicate the student is uncertain between two or more competing options.',
        baselineExpectedSeconds: 25
      },
      {
        id: 'q-cog-3',
        text: 'In an adaptive intelligent tutoring system, how should the model distinguish between a "slip" (execution lapse) and a "misconception" (systemic conceptual error)?',
        targetConcept: 'Error Pattern Discrimination',
        difficulty: 'advanced',
        options: [
          'By assuming all errors are random variance and ignoring consecutive mistake histories',
          'By analyzing latency and error recurrence: slips are typically fast with immediate self-correction, whereas misconceptions repeat consistently across related distractors with high hesitation',
          'By penalizing both equally and forcing the student to restart the entire semester syllabus',
          'By evaluating only final test percentages at the end of the semester rather than real-time telemetry'
        ],
        correctAnswerIndex: 1,
        explanation: 'Slips are characterized by rapid response latency followed by swift self-repair, whereas misconceptions trigger repeated selections of conceptually aligned distractors accompanied by cognitive friction.',
        scaffoldHint: 'Look at both the speed of the error and whether the student selects the same flawed conceptual pattern across retries.',
        baselineExpectedSeconds: 30
      }
    ]
  },
  {
    id: 'mod-algo-202',
    code: 'CS-302',
    title: 'Algorithmic Complexity & Graph Optimization',
    academicDiscipline: 'Computer Science & Engineering',
    description: 'Analysis of asymptotic graph traversal bounds, priority queue relaxation invariants, and dynamic programming state transitions.',
    estimatedMinutes: 20,
    prerequisites: ['Discrete Mathematics', 'Data Structures'],
    learningOutcomes: [
      'Evaluate asymptotic upper bounds for shortest path algorithms',
      'Identify edge relaxation properties in directed acyclic graphs',
      'Optimize memory spatial locality in sparse adjacency structures'
    ],
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-algo-1',
        text: 'In Dijkstra\'s algorithm implemented with a binary min-heap for a graph with |V| vertices and |E| edges, what is the tight asymptotic upper bound of the decrease-key operations throughout the execution?',
        targetConcept: 'Asymptotic Min-Heap Analysis',
        difficulty: 'introductory',
        options: [
          'O(|V| log |V|)',
          'O(|E| log |V|)',
          'O(|E| + |V|)',
          'O(|V|^2)'
        ],
        correctAnswerIndex: 1,
        explanation: 'Each edge can trigger at most one decrease-key operation in the priority queue. In a binary min-heap, each decrease-key takes O(log |V|), yielding a total of O(|E| log |V|) across all edges.',
        scaffoldHint: 'Each of the |E| edges can potentially trigger an update in the binary heap of size |V|.',
        baselineExpectedSeconds: 20
      },
      {
        id: 'q-algo-2',
        text: 'Why does Bellman-Ford require |V| - 1 relaxation iterations across all edges to guarantee shortest paths in graphs with arbitrary edge weights (assuming no negative-weight cycles)?',
        targetConcept: 'Shortest Path Invariants & Relaxations',
        difficulty: 'intermediate',
        options: [
          'Because any simple shortest path in a graph with |V| vertices contains at most |V| - 1 edges',
          'Because graph adjacency matrices have dimensions |V| × (|V| - 1)',
          'Because vertices must be sorted topologically prior to relaxation',
          'Because Dijkstra handles remaining vertices in constant time'
        ],
        correctAnswerIndex: 0,
        explanation: 'A simple shortest path without cycles passes through at most |V| vertices, which contains at most |V| - 1 edges. Each complete relaxation pass guarantees distance propagation by at least one edge along any optimal path.',
        scaffoldHint: 'How many edges can the longest non-repeating path between two vertices contain?',
        baselineExpectedSeconds: 26
      },
      {
        id: 'q-algo-3',
        text: 'Consider Floyd-Warshall dynamic programming algorithm: D[i][j] = min(D[i][j], D[i][k] + D[k][j]). What critical dependency order requires the intermediate vertex loop k to be the outermost loop?',
        targetConcept: 'Optimal Substructure State Transitions',
        difficulty: 'advanced',
        options: [
          'To optimize CPU cache L1 spatial prefetching on standard DRAM architecture',
          'To ensure all shortest paths utilizing intermediate vertices from the subset {1, ..., k-1} are fully finalized before introducing vertex k into candidate paths',
          'Because the inner loops must execute in reverse order for negative edges',
          'Because memory indices i and j cannot be evaluated simultaneously'
        ],
        correctAnswerIndex: 1,
        explanation: 'The inductive invariant of Floyd-Warshall states that at step k, D[i][j] stores the shortest path using only intermediate vertices from {1, 2, ..., k}. For this state transition to hold, all paths using {1, ..., k-1} must be settled first.',
        scaffoldHint: 'Think of the dynamic programming definition: step k builds upon intermediate nodes {1 ... k-1}.',
        baselineExpectedSeconds: 32
      }
    ]
  }
];

const DEFAULT_SETTINGS: SystemSettings = {
  responseTimeHesitationThresholdMs: 15000,
  highErrorThresholdCount: 2,
  autoScaffoldEnabled: true,
  adaptiveDifficultyScaling: true,
  minDwellTimeAlertSec: 3
};

/**
 * Prepares local storage. No demo data and no default accounts are created:
 * real data accumulates as people use the platform.
 */
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(MODULES_KEY)) {
    localStorage.setItem(MODULES_KEY, JSON.stringify(INITIAL_CURRICULUM_MODULES));
  }
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(SESSIONS_KEY)) localStorage.setItem(SESSIONS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(EVENTS_KEY)) localStorage.setItem(EVENTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(SETTINGS_KEY)) localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ==================== LOCAL ACCOUNTS (offline mode only) ====================
// In cloud mode accounts live in Supabase Auth. In local mode the profile is kept
// here and the password is stored ONLY as a salted PBKDF2 hash in a separate key.

export interface LocalCredential {
  salt: string;
  hash: string;
  iterations: number;
}

export function getLocalCredentials(): Record<string, LocalCredential> {
  return readJson<Record<string, LocalCredential>>(CREDENTIALS_KEY, {});
}

export function setLocalCredential(userId: string, cred: LocalCredential | null): void {
  const all = getLocalCredentials();
  if (cred) all[userId] = cred;
  else delete all[userId];
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(all));
}

export function getUsers(): User[] {
  return readJson<User[]>(USERS_KEY, []);
}

export function saveUser(user: User): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function deleteUser(userId: string): boolean {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  setLocalCredential(userId, null);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(getSessions().filter(s => s.userId !== userId)));
  localStorage.setItem(EVENTS_KEY, JSON.stringify(getInteractionEvents().filter(e => e.userId !== userId)));
  if (getCurrentUserId() === userId) clearCurrentUserId();
  return true;
}

/** Only the id of the signed-in local user is persisted - never credentials. */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CURRENT_USER_KEY);
  return v && !v.startsWith('{') ? v : null;
}

export function setCurrentUserId(id: string): void {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

export function clearCurrentUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ==================== LEARNING SESSIONS ====================

export function getSessions(): LearningSession[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SESSIONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSession(session: LearningSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  syncSessionToSupabase(session).catch(() => {});
}

export function getUserSessions(userId: string): LearningSession[] {
  return getSessions().filter(s => s.userId === userId);
}

// ==================== INTERACTION EVENTS ====================

export function getInteractionEvents(): InteractionEvent[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(EVENTS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function logInteractionEvent(event: InteractionEvent): void {
  const events = getInteractionEvents();
  events.push(event);
  // Keep last 2000 events locally to maintain swift performance
  if (events.length > 2000) {
    events.shift();
  }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  syncInteractionToSupabase(event).catch(() => {});
}

// ==================== CURRICULUM MODULES ====================

export function getModules(): LearningModule[] {
  const builtIn = [...INITIAL_CURRICULUM_MODULES, ...EXTRA_MODULES];
  if (typeof window === 'undefined') return builtIn;
  const stored = readJson<LearningModule[] | null>(MODULES_KEY, null);
  if (!stored) return builtIn;
  // Newly shipped built-in modules appear for existing users too.
  const have = new Set(stored.map(m => m.id));
  return [...stored, ...builtIn.filter(m => !have.has(m.id))];
}

export function saveModule(module: LearningModule): void {
  const modules = getModules();
  const idx = modules.findIndex(m => m.id === module.id);
  if (idx >= 0) {
    modules[idx] = module;
  } else {
    modules.push(module);
  }
  localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
}

export function deleteModule(moduleId: string): boolean {
  const modules = getModules();
  const filtered = modules.filter(m => m.id !== moduleId);
  if (filtered.length === modules.length) return false;
  localStorage.setItem(MODULES_KEY, JSON.stringify(filtered));
  return true;
}

// ==================== SYSTEM SETTINGS ====================

export function getSystemSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSystemSettings(settings: SystemSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ==================== REPORT DOWNLOADS ====================

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportStudentPerformanceCsv(sessions: LearningSession[], users: User[]): void {
  const userMap = new Map(users.map(u => [u.id, u]));

  const headers = [
    'Session_ID',
    'Student_ID',
    'Student_Name',
    'Student_Email',
    'Institution',
    'Module_Code',
    'Module_Title',
    'Status',
    'Started_At',
    'Completed_At',
    'Total_Dwell_Seconds',
    'Questions_Answered',
    'Correct_Answers',
    'Accuracy_Percentage',
    'Avg_Response_Time_Ms',
    'Total_Hesitations',
    'Cognitive_Load_Index',
    'Predicted_Cognitive_State',
    'Adaptations_Triggered_Count'
  ];

  const rows = sessions.map(s => {
    const student = userMap.get(s.userId);
    const totalQ = s.responses.length;
    const correctQ = s.responses.filter(r => r.isCorrect).length;
    const accuracy = totalQ > 0 ? ((correctQ / totalQ) * 100).toFixed(1) : '0';
    const metrics = s.finalMetrics;

    return [
      `"${s.id}"`,
      `"${student?.studentId || 'N/A'}"`,
      `"${s.userName.replace(/"/g, '""')}"`,
      `"${s.userEmail}"`,
      `"${student?.institution || 'N/A'}"`,
      `"${s.moduleId}"`,
      `"${s.moduleTitle.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.startedAt}"`,
      `"${s.completedAt || ''}"`,
      (s.totalDwellTimeMs / 1000).toFixed(1),
      totalQ,
      correctQ,
      `${accuracy}%`,
      metrics?.averageResponseTimeMs || 0,
      metrics?.totalHesitations || 0,
      metrics?.cognitiveLoadIndex || 0,
      `"${metrics?.predictedState || 'N/A'}"`,
      s.adaptationHistory.length
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`CognitiveAdapt_Student_Performance_${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

export function exportInteractionTelemetryCsv(events: InteractionEvent[], users: User[]): void {
  const userMap = new Map(users.map(u => [u.id, u]));

  const headers = [
    'Event_ID',
    'Timestamp',
    'User_ID',
    'User_Name',
    'User_Email',
    'Session_ID',
    'Module_ID',
    'Question_ID',
    'Event_Type',
    'Time_Spent_Ms',
    'Cognitive_Load_Estimate',
    'Event_Details'
  ];

  const rows = events.map(e => {
    const student = userMap.get(e.userId);
    return [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.userId}"`,
      `"${(student?.name || 'User').replace(/"/g, '""')}"`,
      `"${student?.email || ''}"`,
      `"${e.sessionId}"`,
      `"${e.moduleId}"`,
      `"${e.questionId || 'N/A'}"`,
      `"${e.eventType}"`,
      e.timeSpentMs,
      e.cognitiveLoadEstimate ?? 'N/A',
      `"${(e.details || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`CognitiveAdapt_Telemetry_Events_${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

export function exportResearchDataJson(users: User[], sessions: LearningSession[], events: InteractionEvent[]): void {
  const modules = getModules();
  const settings = getSystemSettings();

  const fullPayload = {
    exportedAt: new Date().toISOString(),
    system: 'CognitiveAdapt Intelligent Educational System',
    researchScope: 'Behavioural and Cognitive Interaction Analytics in Higher Education',
    dataset: {
      registeredStudentsCount: users.filter(u => u.role === 'student').length,
      administratorsCount: users.filter(u => u.role === 'admin').length,
      users,
      sessions,
      events,
      curriculumModules: modules,
      systemThresholds: settings
    }
  };

  const jsonContent = JSON.stringify(fullPayload, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`CognitiveAdapt_Research_Dataset_${dateStr}.json`, jsonContent, 'application/json');
}


/** Merge sessions fetched from the cloud into the local cache (cloud wins on conflicts). */
export function mergeSessions(remote: LearningSession[]): void {
  if (!remote.length) return;
  const byId = new Map(getSessions().map(s => [s.id, s]));
  remote.forEach(s => byId.set(s.id, s));
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([...byId.values()]));
}
