import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, LearningModule, Question, LearningSession, QuestionResponse } from '../types';
import { getUserSessions, saveSession } from '../services/storage';
import { evaluateCognitiveLoad, aggregateSessionMetrics } from '../services/adaptiveEngine';
import {
  achievements, buildReviewModule, fingerprint, insights, levelInfo, liveLoad, memoryVault,
  sessionXp, streaks, totalXp, XpBreakdown, Achievement, LevelInfo,
} from '../services/progress';
import {
  ProfileHero, FingerprintRadar, InsightsPanel, AchievementsGrid, TrendChart, LiveLoadMeter,
  ConfidencePicker, BreathingReset
} from './student/widgets';
import {
  BookOpen, Activity, Clock, HelpCircle, TrendingUp, Brain, CheckCircle2, XCircle, ArrowRight,
  Sparkles, ChevronRight, Settings, Bookmark, Info, Sliders, ShieldCheck,
  Trash2, Upload, FileText, AlertTriangle, Target, Book, Zap,
  ArrowLeft, Plus, Moon, Sun, Layers, Lightbulb, Gauge, ShieldAlert, GraduationCap, Calculator, Cpu, X,
  ListChecks, FlaskConical, Compass, Keyboard, Wind, ShieldQuestion
} from 'lucide-react';

import { getSupabaseClient } from '../services/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface StudentDashboardProps {
  user: User;
}

type DashboardTab = 'dashboard' | 'curriculum' | 'settings' | 'bookmarks' | 'help';
type ThemeMode = 'dark' | 'light';
type Difficulty = 'introductory' | 'intermediate' | 'advanced';

interface Flashcard { front: string; back: string; }

// ==========================================
// 1. PRE-LOADED CURRICULUM & OFFLINE QUESTIONS
// ==========================================
const curriculumBase = {
  'Mathematics': {
    'Linear Equations': [
      { id: 'math-lin-01', code: 'MATH-101', title: 'Solving Linear Equations', description: 'Isolate variables and solve for x.', academicDiscipline: 'Mathematics', estimatedMinutes: 15, 
        questions: [
          { id: 'm1', text: 'Solve for x: 2x + 4 = 10', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correctAnswerIndex: 1, explanation: 'Subtract 4 from both sides (2x = 6), then divide by 2 (x = 3).', targetConcept: 'Linear Equations', baselineExpectedSeconds: 30, scaffoldHint: 'Isolate x.', type: 'mcq' },
          { id: 'm2', text: 'Solve for y: y/3 = 4', options: ['y = 1.33', 'y = 7', 'y = 12', 'y = 15'], correctAnswerIndex: 2, explanation: 'Multiply both sides by 3 to isolate y. y = 12.', targetConcept: 'Linear Equations', baselineExpectedSeconds: 25, scaffoldHint: 'Undo the division.', type: 'mcq' },
          { id: 'm3', text: 'Explain in your own words why dividing both sides of an equation by zero is undefined.', options: [], correctAnswerIndex: -1, explanation: 'Division by zero is undefined because you cannot multiply any number by zero to get a non-zero number. It breaks the fundamental properties of arithmetic.', targetConcept: 'Equation Rules', baselineExpectedSeconds: 45, scaffoldHint: 'Think about the relationship between multiplication and division.', type: 'short' }
        ] 
      },
      { id: 'math-lin-02', code: 'MATH-102', title: 'Word Problems (Linear)', description: 'Apply linear equations to real-world scenarios.', academicDiscipline: 'Mathematics', estimatedMinutes: 15, 
        questions: [
          { id: 'm4', text: 'A taxi charges a base fee of R20 plus R10 per kilometer. If the total fare is R80, how many kilometers was the trip?', options: ['4 km', '6 km', '8 km', '10 km'], correctAnswerIndex: 1, explanation: '20 + 10k = 80. 10k = 60. k = 6.', targetConcept: 'Applied Linear', baselineExpectedSeconds: 40, scaffoldHint: 'Set up the equation: Base Fee + (Rate * Distance) = Total.', type: 'mcq' }
        ] 
      }
    ],
    'Quadratic Equations': [
      { id: 'math-quad-01', code: 'MATH-201', title: 'The Quadratic Formula', description: 'Evaluate discriminants and roots.', academicDiscipline: 'Mathematics', estimatedMinutes: 15, 
        questions: [
          { id: 'm5', text: 'What is the discriminant of x² - 4x + 4 = 0?', options: ['0', '4', '8', '16'], correctAnswerIndex: 0, explanation: 'b² - 4ac = (-4)² - 4(1)(4) = 16 - 16 = 0.', targetConcept: 'Discriminants', baselineExpectedSeconds: 40, scaffoldHint: 'Use b² - 4ac.', type: 'mcq' },
          { id: 'm6', text: 'Derive the quadratic formula from the standard form ax² + bx + c = 0 using the method of completing the square.', options: [], correctAnswerIndex: -1, explanation: 'Step 1: divide by a. Step 2: move c/a to the right. Step 3: add (b/2a)² to both sides. Step 4: factor left side, combine right side. Step 5: square root both sides and isolate x.', targetConcept: 'Derivation', baselineExpectedSeconds: 120, scaffoldHint: 'Start by factoring out the leading coefficient a.', type: 'essay' }
        ] 
      }
    ]
  },
  'Computer Science': {
    'Algorithms': [
      { id: 'cs-alg-01', code: 'CS-101', title: 'Binary Search & Complexity', description: 'Understand searching algorithms.', academicDiscipline: 'Computer Science', estimatedMinutes: 15, 
        questions: [
          { id: 'c1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswerIndex: 1, explanation: 'Binary search halves the search space each time, resulting in O(log n).', targetConcept: 'Complexity', baselineExpectedSeconds: 20, scaffoldHint: 'It divides the array in half.', type: 'mcq' },
          { id: 'c2', text: 'Why does binary search require the array to be sorted before searching?', options: [], correctAnswerIndex: -1, explanation: 'It relies on comparing the target to the middle element to decide which half to search. This requires the data to be ordered.', targetConcept: 'Algorithm Prerequisites', baselineExpectedSeconds: 40, scaffoldHint: 'If the data is scrambled, how do you know which half to discard?', type: 'short' }
        ] 
      }
    ],
    'Data Structures': [
      { id: 'cs-ds-01', code: 'CS-201', title: 'Stacks and Queues', description: 'Differentiate LIFO and FIFO structures.', academicDiscipline: 'Computer Science', estimatedMinutes: 15, 
        questions: [
          { id: 'c3', text: 'Which data structure follows LIFO?', options: ['Queue', 'Stack', 'Array', 'Tree'], correctAnswerIndex: 1, explanation: 'A Stack is Last-In-First-Out (LIFO).', targetConcept: 'Data Structures', baselineExpectedSeconds: 20, scaffoldHint: 'Think of a stack of plates.', type: 'mcq' }
        ] 
      }
    ]
  },
  'Science': {
    'Physics': [
      { id: 'sci-phys-01', code: 'PHYS-105', title: 'Newton\'s Laws', description: 'Explore force, mass, and acceleration.', academicDiscipline: 'Science', estimatedMinutes: 15, 
        questions: [
          { id: 's1', text: 'What is the formula for Newton\'s Second Law?', options: ['E = mc²', 'F = ma', 'V = IR', 'a² + b² = c²'], correctAnswerIndex: 1, explanation: 'Force equals mass times acceleration.', targetConcept: 'Newton\'s Laws', baselineExpectedSeconds: 15, scaffoldHint: 'Force equals mass times acceleration.', type: 'mcq' },
          { id: 's2', text: 'A 10kg object is pushed with a force of 50N. Calculate the acceleration.', options: [], correctAnswerIndex: -1, explanation: 'Using F = ma, a = F/m. Therefore, a = 50N / 10kg = 5 m/s².', targetConcept: 'Calculation', baselineExpectedSeconds: 45, scaffoldHint: 'Rearrange F = ma to solve for a.', type: 'short' }
        ] 
      }
    ],
    'Biology': [
      { id: 'sci-bio-01', code: 'BIO-110', title: 'Cell Organelles', description: 'The basic building blocks of life.', academicDiscipline: 'Science', estimatedMinutes: 15, 
        questions: [
          { id: 's3', text: 'Which organelle produces ATP?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi'], correctAnswerIndex: 2, explanation: 'Mitochondria are the powerhouse of the cell.', targetConcept: 'Organelles', baselineExpectedSeconds: 15, scaffoldHint: 'Powerhouse of the cell.', type: 'mcq' }
        ] 
      }
    ]
  }
} as Record<string, Record<string, LearningModule[]>>;

// ==========================================
// 2. FALLBACK GENERATOR (If AI API fails)
// ==========================================
const generateLocalMaterial = (text: string, tool: string) => {
  const sentences = text.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|").filter(s => s.length > 30 && s.split(' ').length > 5);
  
  if (tool === 'Flashcard') {
    const cards = sentences.slice(0, 8).map(s => {
      const words = s.split(' ').map(w => w.replace(/[^a-zA-Z0-9]/g, ''));
      const keyword = [...words].sort((a, b) => b.length - a.length).find(w => w.length > 4) || 'concept';
      return { front: `What is the context of "${keyword}"?`, back: s.trim() };
    });
    return { flashcards: cards.length > 0 ? cards : [{ front: "No text found", back: "Please try again." }] };
  } 
  
  if (tool === 'Exam Predictor') {
    const s1 = sentences[0] || "Refer to your notes.";
    const s2 = sentences[1] || "Refer to your notes.";
    const s3 = sentences[2] || "Refer to your notes.";
    
    return { questions: [
      { type: "short", text: `Briefly explain the significance of the following statement from your notes: "${s1.substring(0, 60)}..."`, modelAnswer: s1 },
      { type: "long", text: `Elaborate on this concept found in your text: "${s2.substring(0, 60)}..."`, modelAnswer: s2 },
      { type: "essay", text: `Critically analyze the following idea from your notes: "${s3.substring(0, 60)}..."`, modelAnswer: s3 }
    ]};
  }

  const questions = sentences.slice(0, 5).map((s, i) => {
    const words = s.split(' ').map(w => w.replace(/[^a-zA-Z0-9]/g, ''));
    const keyword = [...words].sort((a, b) => b.length - a.length).find(w => w.length > 4) || 'answer';
    const blanked = s.replace(keyword, '______');
    const options = [keyword, 'Option A', 'Option B', 'Option C'].sort(() => Math.random() - 0.5);
    return {
      type: "mcq", text: `Complete the concept: "${blanked}"`, options: options, correctAnswerIndex: options.indexOf(keyword),
      explanation: `The original text states: "${s.trim()}"`
    };
  });
  return { questions: questions.length > 0 ? questions : [{ type: "mcq", text: "Not enough text to generate questions.", options: ["OK"], correctAnswerIndex: 0, explanation: "Fallback" }] };
};

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  'Mathematics': <Calculator className="w-6 h-6" />,
  'Computer Science': <Cpu className="w-6 h-6" />,
  'Science': <FlaskConical className="w-6 h-6" />
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('app_theme') as ThemeMode) || 'dark');
  const isDark = theme === 'dark';

  const [autoDifficulty, setAutoDifficulty] = useState<Difficulty>('introductory');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [manualDifficulty, setManualDifficulty] = useState<Difficulty>('introductory');

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  const [customModules, setCustomModules] = useState<LearningModule[]>([]);
  const [customFlashcards, setCustomFlashcards] = useState<Flashcard[]>([]);
  const [studyMaterialText, setStudyMaterialText] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [activeTool, setActiveTool] = useState<string>('Quiz');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [studyLabView, setStudyLabView] = useState<'hub' | 'creator'>('hub');

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [essayInput, setEssayInput] = useState('');
  const [hesitationCount, setHesitationCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showScaffoldHint, setShowScaffoldHint] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<{
    isCorrect: boolean; explanation: string; responseTimeMs: number; cliScore: number; adaptationAction?: string;
  } | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);

  // State for the Cognitive Intervention Overlay
  const [showIntervention, setShowIntervention] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    refreshUserSessions();
    const saved = localStorage.getItem('custom_study_modules');
    if (saved) { try { setCustomModules(JSON.parse(saved)); } catch (e) { console.error(e); } }
    const savedCards = localStorage.getItem('custom_flashcards');
    if (savedCards) { try { setCustomFlashcards(JSON.parse(savedCards)); } catch (e) { console.error(e); } }
  }, [user.id]);

  useEffect(() => { localStorage.setItem('app_theme', theme); }, [theme]);

  const refreshUserSessions = () => { setSessions(getUserSessions(user.id)); };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const allResponses = completedSessions.flatMap(s => s.responses);
  const overallAccuracy = allResponses.length > 0 ? Math.round((allResponses.filter(r => r.isCorrect).length / allResponses.length) * 100) : 0;
  const avgLatencySec = allResponses.length > 0 ? parseFloat((allResponses.reduce((acc, r) => acc + r.responseTimeMs, 0) / allResponses.length / 1000).toFixed(1)) : 0;
  const avgCli = allResponses.length > 0 ? Math.round(allResponses.reduce((acc, r) => acc + r.cognitiveLoadScore, 0) / allResponses.length) : 0;

  const speedScore = Math.max(0, Math.min(100, ((40 - avgLatencySec) / 20) * 100));
  const masteryPercentage = Math.min(100, Math.round((overallAccuracy * 0.5) + (speedScore * 0.25) + (avgCli * 0.25)));

  useEffect(() => {
    if (isManualOverride) return; 
    if (masteryPercentage >= 85) {
      if (autoDifficulty === 'introductory') setAutoDifficulty('intermediate');
      else if (autoDifficulty === 'intermediate') setAutoDifficulty('advanced');
    } else if (masteryPercentage <= 40) {
      if (autoDifficulty === 'advanced') setAutoDifficulty('intermediate');
      else if (autoDifficulty === 'intermediate') setAutoDifficulty('introductory');
    }
  }, [masteryPercentage, autoDifficulty, isManualOverride]);

  const currentDifficulty = isManualOverride ? manualDifficulty : autoDifficulty;

  const level = useMemo(() => levelInfo(totalXp(sessions, [])), [sessions]);
  const streak = useMemo(() => streaks(sessions), [sessions]);
  const vault = useMemo(() => memoryVault(sessions, []), [sessions]);
  const dueItems = useMemo(() => vault.filter(v => v.due), [vault]);
  const fp = useMemo(() => fingerprint(sessions, []), [sessions]);
  const insightList = useMemo(() => insights(sessions, []), [sessions]);
  const badges = useMemo(() => achievements(sessions, []), [sessions]);

  useEffect(() => {
    if (activeSession && !submittedFeedback && !sessionFinished) {
      timerRef.current = setInterval(() => { setElapsedSeconds(Math.floor((Date.now() - questionStartTime) / 1000)); }, 500);
    } else if (timerRef.current) { clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession, submittedFeedback, sessionFinished, questionStartTime]);

  // Trigger intervention if they take too long
  useEffect(() => {
    if (activeSession && !submittedFeedback && !showIntervention && activeModule?.questions[currentQuestionIdx]) {
      const baseline = activeModule.questions[currentQuestionIdx].baselineExpectedSeconds || 30;
      if (elapsedSeconds > baseline * 2) {
        setShowIntervention(true);
      }
    }
  }, [elapsedSeconds, activeSession, submittedFeedback, showIntervention, activeModule, currentQuestionIdx]);

  const cleanExtractedText = (raw: string) => {
    return raw.split('\n').filter(line => {
        const t = line.trim();
        if (t.length < 20) return false; 
        if (/^\d+$/.test(t)) return false; 
        if (/\.{3,}\s*\d+$/.test(t)) return false; 
        return true;
      }).join(' ').replace(/\s+/g, ' ').trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMaterialTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsGenerating(true);
    setAiError(null);

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => { setStudyMaterialText(cleanExtractedText(event.target?.result as string)); setIsGenerating(false); };
      reader.readAsText(file);
    } 
    else if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          let pageText = ''; let lastY = -1;
          textContent.items.forEach((item: any) => {
            if (lastY !== item.transform[5]) { pageText += '\n'; lastY = item.transform[5]; }
            pageText += item.str + ' ';
          });
          fullText += pageText + '\n';
        }
        const cleaned = cleanExtractedText(fullText);
        if (cleaned.length < 50) setAiError("Not enough readable text found.");
        else setStudyMaterialText(cleaned);
      } catch (error) { setAiError("Failed to read the PDF."); } finally { setIsGenerating(false); }
    } else { setAiError("Please upload .txt or .pdf"); setIsGenerating(false); }
  };

  const handleGenerateFromText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyMaterialText || studyMaterialText.length < 50) { setAiError("Please provide at least 50 characters of text."); return; }
    
    setIsGenerating(true);
    setAiError(null);
    let parsedData = null;

    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("Supabase is not configured.");
      const safeText = studyMaterialText.slice(0, 5000);

      const { data, error } = await sb.functions.invoke('generate-quiz', {
        body: { 
          studyText: safeText, 
          outputFormat: activeTool === 'Flashcard' ? 'flashcards' : (activeTool === 'Exam Predictor' ? 'exam' : 'quiz'), 
          activeTool,
          difficulty: currentDifficulty,
        },
      });

      if (error) throw new Error("AI API Error");
      if (data?.error) throw new Error(data.error);
      
      parsedData = typeof data === 'string' ? JSON.parse(data.replace(/```json/g, '').replace(/```/g, '').trim()) : data;

    } catch (error) {
      console.warn("Supabase AI failed. Using local fallback generator.", error);
      parsedData = generateLocalMaterial(studyMaterialText, activeTool);
    }

    try {
      if (activeTool === 'Flashcard' && parsedData?.flashcards) {
        const newCards = parsedData.flashcards.map((fc: any) => ({ front: `[${activeTool}] ${fc.front}`, back: fc.back }));
        const updated = [...customFlashcards, ...newCards];
        setCustomFlashcards(updated); localStorage.setItem('custom_flashcards', JSON.stringify(updated));
        setCurrentCardIdx(customFlashcards.length); setIsFlipped(false);
      } else if (parsedData?.questions) {
        const questions: Question[] = parsedData.questions.map((q: any, index: number) => ({
          id: `q-${Date.now()}-${index}`, text: q.text, options: q.options || [], correctAnswerIndex: q.correctAnswerIndex ?? -1,
          explanation: q.explanation || q.modelAnswer || 'No explanation provided.', targetConcept: `${activeTool} Concept`,
          baselineExpectedSeconds: 60, scaffoldHint: 'Review your notes.', type: q.type || 'mcq'
        } as any));

        const newModule: LearningModule = {
          id: `module-${Date.now()}`, code: activeTool.toUpperCase().replace(' ', '-'), title: materialTitle || `${activeTool}: Generated Material`,
          description: `Generated study module from your notes.`, academicDiscipline: 'General',
          estimatedMinutes: Math.ceil(questions.length * 1.5), questions: questions
        };

        const updated = [...customModules, newModule];
        setCustomModules(updated); localStorage.setItem('custom_study_modules', JSON.stringify(updated));
      } else { throw new Error("Invalid format generated."); }

      setStudyMaterialText(''); setMaterialTitle(''); setStudyLabView('hub'); 
    } catch (err) { setAiError("Generation failed. Please try again."); } finally { setIsGenerating(false); }
  };

  const handleDeleteCustomQuiz = (id: string) => {
    if (!window.confirm("Delete this study set?")) return;
    const updated = customModules.filter(m => m.id !== id);
    setCustomModules(updated); localStorage.setItem('custom_study_modules', JSON.stringify(updated));
  };

  const handleDeleteFlashcards = () => {
    if (!window.confirm("Clear all flashcards?")) return;
    setCustomFlashcards([]); localStorage.setItem('custom_flashcards', JSON.stringify([]));
  };

  const handleStartModule = (mod: LearningModule) => {
    const newSessionId = `ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSession: LearningSession = {
      id: newSessionId, userId: user.id, userEmail: user.email, userName: user.name,
      moduleId: mod.id, moduleTitle: mod.title, startedAt: new Date().toISOString(),
      status: 'in_progress', currentQuestionIndex: 0, activeDifficulty: currentDifficulty,
      totalDwellTimeMs: 0, responses: [], adaptationHistory: []
    };
    setActiveModule(mod); setActiveSession(newSession); setCurrentQuestionIdx(0);
    setSelectedOption(null); setEssayInput(''); setHesitationCount(0); setAttemptsCount(1);
    setShowScaffoldHint(false); setSubmittedFeedback(null); setSessionFinished(false);
    setQuestionStartTime(Date.now()); setElapsedSeconds(0); setConfidence(null);
    saveSession(newSession);
  };

  const handleSelectOption = (idx: number) => {
    if (submittedFeedback) return;
    
    if (selectedOption !== null && selectedOption !== idx) {
      const newHesitationCount = hesitationCount + 1;
      setHesitationCount(newHesitationCount);

      // Trigger intervention if they hesitate 3 times
      if (newHesitationCount === 3) {
        setShowIntervention(true);
      }
    }
    setSelectedOption(idx);
  };

  const currentQuestion: Question & { type?: string } | undefined = activeModule?.questions[currentQuestionIdx] as any;
  const handleStartReview = () => { if (dueItems.length) handleStartModule(buildReviewModule(dueItems)); };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !activeSession) return;
    const isMCQ = currentQuestion.type === 'mcq' || !currentQuestion.type;
    if (isMCQ && (selectedOption === null || confidence === null)) return;
    if (!isMCQ && essayInput.length < 5) { alert("Please write a longer answer."); return; }

    const responseTimeMs = Date.now() - questionStartTime;
    const isCorrect = isMCQ ? selectedOption === currentQuestion.correctAnswerIndex : true;
    const assessment = evaluateCognitiveLoad({ question: currentQuestion, responseTimeMs, hesitationCount, attemptsCount, isCorrect, previousResponses: activeSession.responses });

    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id, selectedOptionIndex: selectedOption ?? 0, isCorrect, responseTimeMs,
      hesitationCount, attemptsCount, hintUsed: showScaffoldHint, cognitiveLoadScore: assessment.cognitiveLoadIndex,
      adaptationAction: assessment.suggestedAction, ...(confidence ? { confidence } : {})
    };
    
    const updatedSession = { ...activeSession, responses: [...activeSession.responses, newResponse], totalDwellTimeMs: activeSession.totalDwellTimeMs + responseTimeMs };
    setActiveSession(updatedSession); saveSession(updatedSession);
    setSubmittedFeedback({ isCorrect, explanation: isMCQ ? currentQuestion.explanation : currentQuestion.explanation, responseTimeMs, cliScore: assessment.cognitiveLoadIndex, adaptationAction: assessment.suggestedAction });
  };

  const handleNextQuestion = () => {
    if (!activeModule || !activeSession) return;
    setShowIntervention(false); 
    if (currentQuestionIdx + 1 < activeModule.questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null); setEssayInput(''); setHesitationCount(0); setAttemptsCount(1);
      setShowScaffoldHint(false); setSubmittedFeedback(null); setConfidence(null);
      setQuestionStartTime(Date.now()); setElapsedSeconds(0);
    } else {
      const finalMetrics = aggregateSessionMetrics(activeSession.responses);
      const finalizedSession: LearningSession = { ...activeSession, status: 'completed', completedAt: new Date().toISOString(), finalMetrics };
      saveSession(finalizedSession); setActiveSession(finalizedSession); setSessionFinished(true); refreshUserSessions();
    }
  };

  const fontClass = fontSize === 'large' ? 'text-[17px]' : fontSize === 'x-large' ? 'text-[19px]' : 'text-base';
  const contrastClass = highContrast ? 'contrast-125 saturate-150' : '';

  const bgMain = isDark ? 'bg-[#121212] text-slate-100' : 'bg-slate-50 text-slate-900';
  const bgCard = isDark ? 'bg-[#1e1e24] border-[#2e2e38]' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const navBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const activeNavBg = 'bg-blue-600 text-white shadow-md';
  const inactiveNav = isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100';

  // ---- ACTIVE SESSION VIEW (With Intervention Overlay) ----
  if (activeSession && activeModule && !sessionFinished) {
    const isMCQ = currentQuestion?.type === 'mcq' || !currentQuestion?.type;
    return (
      <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass} relative`}>
        
        {/* COGNITIVE INTERVENTION OVERLAY */}
        {showIntervention && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-[#1e1e24] border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ShieldQuestion className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Cognitive Overload Detected</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our telemetry sensors detected high hesitation and latency. Your working memory is currently overwhelmed. 
                <br/><br/>
                Take a deep breath. We are temporarily pausing the quiz to reset your cognitive load.
              </p>
              
              <div className="bg-[#121212] rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-500">Live Latency</span>
                  <span className="text-rose-400 font-bold">{elapsedSeconds}s</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Hesitations</span>
                  <span className="text-rose-400 font-bold">{hesitationCount} changes</span>
                </div>
              </div>

              <button 
                onClick={() => setShowIntervention(false)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Wind className="w-4 h-4" /> I'm Ready to Continue
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className={`rounded-2xl border p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${bgCard}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 text-[11px] font-bold font-mono border border-blue-800">{activeModule.code}</span>
                <span className={`text-xs font-semibold ${textMuted}`}>{activeModule.academicDiscipline} • <span className="uppercase text-blue-500 font-bold">{activeSession.activeDifficulty}</span></span>
              </div>
              <h2 className={`text-lg font-extrabold tracking-tight ${textTitle}`}>{activeModule.title}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-4 p-2.5 rounded-xl border text-xs font-mono ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Clock className="w-4 h-4 text-blue-500 animate-pulse" /><span>Elapsed: <strong className={textTitle}>{elapsedSeconds}s</strong></span></div>
                <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Activity className="w-4 h-4 text-amber-500" /><span>Hesitations: <strong className={textTitle}>{hesitationCount}</strong></span></div>
                <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Compass className="w-4 h-4 text-indigo-500" /><span>Q {currentQuestionIdx + 1}/{activeModule.questions.length}</span></div>
              </div>
              <button onClick={() => {
                if (window.confirm("Are you sure you want to quit? Your progress will be lost.")) {
                  setActiveSession(null); setActiveModule(null); setSessionFinished(false);
                }
              }} className="text-rose-500 hover:bg-rose-500/10 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30">
                <X className="w-4 h-4" /> Quit
              </button>
            </div>
          </div>
          
          {currentQuestion && (
            <div className={`rounded-2xl border shadow-sm p-6 sm:p-8 space-y-6 ${bgCard}`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Concept: {currentQuestion.targetConcept}</span>
                <span className={`text-xs font-medium ${textMuted}`}>{isMCQ ? 'Select an option' : 'Write your answer below'}</span>
              </div>
              
              {!submittedFeedback && (
                <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                  <LiveLoadMeter value={liveLoad(Date.now() - questionStartTime, currentQuestion.baselineExpectedSeconds || 30, hesitationCount, showScaffoldHint)} />
                  <div className={`hidden md:flex items-center gap-1.5 text-[11px] ${textMuted}`}><Keyboard className="w-3.5 h-3.5" /> 1-4 choose · Enter submit</div>
                </div>
              )}
              
              <p className={`text-lg sm:text-xl font-semibold leading-relaxed whitespace-pre-wrap ${textTitle}`}>{currentQuestion.text}</p>
              
              {isMCQ && (
                <div className="space-y-3 pt-2">
                  {currentQuestion.options?.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === idx;
                    const isSubmitted = submittedFeedback !== null;
                    const isCorrectAnswer = idx === currentQuestion.correctAnswerIndex;
                    let borderClass = isDark ? 'border-[#3e3e4a] bg-[#1e1e24] hover:border-[#5e5e6a]' : 'border-slate-200 hover:border-slate-300 bg-white';
                    if (isSelected) borderClass = 'border-blue-500 bg-blue-900/20 text-blue-200 ring-1 ring-blue-500';
                    if (isSubmitted) {
                      if (isCorrectAnswer) borderClass = 'border-emerald-500 bg-emerald-900/20 text-emerald-200 ring-1 ring-emerald-500';
                      else if (isSelected && !isCorrectAnswer) borderClass = 'border-rose-500 bg-rose-900/20 text-rose-200 ring-1 ring-rose-500';
                      else borderClass = isDark ? 'opacity-50 border-[#2e2e38] bg-[#121212]' : 'opacity-60 border-slate-200 bg-slate-50';
                    }
                    return (
                      <button key={idx} onClick={() => handleSelectOption(idx)} disabled={isSubmitted}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${borderClass}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : isDark ? 'bg-[#2e2e38] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{String.fromCharCode(65 + idx)}</span>
                        <span className="flex-1 leading-normal">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!isMCQ && !submittedFeedback && (
                <div className="space-y-3 pt-2">
                  <textarea value={essayInput} onChange={e => setEssayInput(e.target.value)} rows={6}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-[#3e3e4a] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    placeholder="Type your practical answer here..." />
                </div>
              )}

              {submittedFeedback && (
                <div className={`p-5 rounded-xl border space-y-3 animate-in fade-in duration-150 ${submittedFeedback.isCorrect ? (isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300') : (isDark ? 'bg-rose-900/20 border-rose-700' : 'bg-rose-50 border-rose-300')}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {!isMCQ ? <><CheckCircle2 className="w-5 h-5 text-blue-500" /><span>Answer Submitted</span></> : submittedFeedback.isCorrect ? <><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span>Mastery Confirmed</span></> : <><XCircle className="w-5 h-5 text-rose-500" /><span>Misconception Identified</span></>}
                    </div>
                    <div className={`flex items-center gap-3 text-xs font-mono ${textMuted}`}><span>Latency: {(submittedFeedback.responseTimeMs / 1000).toFixed(1)}s</span><span>CLI: {submittedFeedback.cliScore}/100</span></div>
                  </div>
                  {!isMCQ && <p className={`text-xs font-bold uppercase ${textMuted}`}>Model Answer / Feedback:</p>}
                  <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{submittedFeedback.explanation}</p>
                </div>
              )}

              {!submittedFeedback && selectedOption !== null && isMCQ && <ConfidencePicker value={confidence} onChange={setConfidence} />}
              
              <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                {!submittedFeedback ? (
                  <div className="w-full flex justify-end">
                    <button type="button" onClick={handleSubmitAnswer} disabled={isMCQ ? (selectedOption === null || confidence === null) : essayInput.length < 5}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer">
                      <span>Submit Answer</span><ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex justify-end">
                    <button type="button" onClick={handleNextQuestion} className={`px-6 py-2.5 font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}>
                      <span>{currentQuestionIdx + 1 < activeModule.questions.length ? 'Proceed to Next Concept' : 'Conclude & Compute Analytics'}</span><ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- SESSION FINISHED VIEW ----
  if (sessionFinished && activeSession) {
    return (
      <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`rounded-2xl border p-8 shadow-sm space-y-6 ${bgCard}`}>
            <div className={`flex items-center gap-3 border-b pb-6 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}><Brain className="w-6 h-6" /></div>
              <div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Session Concluded</span>
                <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Diagnostics: {activeSession.moduleTitle}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Accuracy</span><span className={`text-2xl font-extrabold mt-1 block ${textTitle}`}>{Math.round((activeSession.responses.filter(r => r.isCorrect).length / activeSession.responses.length) * 100)}%</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Mean Latency</span><span className={`text-2xl font-extrabold mt-1 block ${textTitle}`}>{((activeSession.finalMetrics?.averageResponseTimeMs || 0) / 1000).toFixed(1)}s</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Cognitive Load</span><span className="text-2xl font-extrabold text-blue-500 mt-1 block">{activeSession.finalMetrics?.cognitiveLoadIndex || 0}/100</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Difficulty</span><span className="text-sm font-extrabold text-indigo-500 uppercase mt-2 block">{activeSession.activeDifficulty}</span></div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => { setActiveSession(null); setActiveModule(null); setSessionFinished(false); refreshUserSessions(); }} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer">Return to Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN TABBED DASHBOARD VIEW ----
  return (
    <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className={`flex flex-wrap gap-2 border-b pb-2 ${navBorder}`}>
          <button onClick={() => { setActiveTab('dashboard'); setStudyLabView('hub'); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard' ? activeNavBg : inactiveNav}`}><BookOpen className="w-4 h-4" /><span>Dashboard</span></button>
          <button onClick={() => setActiveTab('curriculum')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'curriculum' ? activeNavBg : inactiveNav}`}><GraduationCap className="w-4 h-4" /><span>Curriculum</span></button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'settings' ? activeNavBg : inactiveNav}`}><Settings className="w-4 h-4" /><span>Settings</span></button>
          <button onClick={() => setActiveTab('bookmarks')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'bookmarks' ? activeNavBg : inactiveNav}`}><Bookmark className="w-4 h-4" /><span>Bookmarks</span></button>
          <button onClick={() => setActiveTab('help')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'help' ? activeNavBg : inactiveNav}`}><Info className="w-4 h-4" /><span>Help</span></button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {studyLabView === 'hub' && (
              <>
                <ProfileHero name={user.name} level={level} streak={streak} unlocked={badges.filter(b => b.unlocked).length} totalBadges={badges.length} dueCount={dueItems.length} onReview={handleStartReview} />
                
                <div className={`rounded-2xl border p-6 shadow-sm ${bgCard}`}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}><Gauge className="w-4 h-4 text-emerald-500" /> Adaptive Mastery Track</h3>
                      <p className={`text-xs mt-1 ${textMuted}`}>The dog walks as you master speed, accuracy, and cognitive load.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-blue-500">{masteryPercentage}%</span>
                      <p className={`text-[10px] uppercase font-bold ${textMuted}`}>Mastery</p>
                    </div>
                  </div>
                  
                  <div className="relative pt-6 pb-2">
                    <div className={`h-3 w-full rounded-full relative z-0 ${isDark ? 'bg-[#2e2e38]' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${masteryPercentage}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 left-[33%] w-4 h-4 rounded-full border-2 border-white bg-slate-400 z-10" />
                      <div className="absolute top-1/2 -translate-y-1/2 left-[66%] w-4 h-4 rounded-full border-2 border-white bg-slate-400 z-10" />
                      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-4 h-4 rounded-full border-2 border-white bg-slate-400 z-10" />
                    </div>
                    <div className="absolute top-0 transition-all duration-1000 ease-out z-20" style={{ left: `calc(${masteryPercentage}% - 16px)` }}>
                      <div className="text-3xl transform -translate-x-1/2 animate-bounce">🐕</div>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-wider relative">
                      <span className={masteryPercentage >= 0 ? 'text-blue-500' : textMuted}>Introductory</span>
                      <span className={masteryPercentage >= 33 ? 'text-blue-500' : textMuted}>Intermediate</span>
                      <span className={masteryPercentage >= 66 ? 'text-blue-500' : textMuted}>Advanced</span>
                      <span className={masteryPercentage >= 100 ? 'text-emerald-500' : textMuted}>Mastered</span>
                    </div>
                  </div>
                  {isManualOverride && (
                    <div className="mt-4 flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/10 px-3 py-2 rounded-lg w-fit">
                      <ShieldAlert className="w-4 h-4" /> Manual Override Active (Auto-Adaptation Paused)
                    </div>
                  )}
                </div>
                
                <section className={`rounded-3xl p-6 sm:p-8 ${isDark ? 'bg-[#1a1a20]' : 'bg-slate-100'}`}>
                  <h2 className={`text-xl font-bold mb-4 ${textTitle}`}>Quick Tools</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <button onClick={() => { setActiveTool('Flashcard'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Flashcard</h3><p className="text-blue-100 text-xs mt-1">Flip to memorize</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200 opacity-80 group-hover:scale-110 transition-transform"><FileText className="w-12 h-12" /></div>
                    </button>
                    <button onClick={() => { setActiveTool('Quiz'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Quiz</h3><p className="text-purple-100 text-xs mt-1">Practice makes perfect</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-200 opacity-80 group-hover:scale-110 transition-transform"><ListChecks className="w-12 h-12" /></div>
                    </button>
                    <button onClick={() => { setActiveTool('AI Solver'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-300 hover:to-sky-500 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">AI Solver</h3><p className="text-sky-100 text-xs mt-1">Step-by-step explanation</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-200 opacity-80 group-hover:scale-110 transition-transform"><Brain className="w-12 h-12" /></div>
                    </button>
                    <button onClick={() => { setActiveTool('Study Guide'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Study guide</h3><p className="text-amber-100 text-xs mt-1">Summarize with clarity</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-200 opacity-80 group-hover:scale-110 transition-transform"><Book className="w-12 h-12" /></div>
                    </button>
                    <button onClick={() => { setActiveTool('Exam Predictor'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Exam predictor</h3><p className="text-rose-100 text-xs mt-1">Short, Long & Essays</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-200 opacity-80 group-hover:scale-110 transition-transform"><Target className="w-12 h-12" /></div>
                    </button>
                    <button onClick={() => { setActiveTool('Cheat Sheet'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Cheat sheet</h3><p className="text-indigo-100 text-xs mt-1">Crack the exam</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 opacity-80 group-hover:scale-110 transition-transform"><Zap className="w-12 h-12" /></div>
                    </button>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${textTitle}`}>Recent Study Sets</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customFlashcards.length > 0 && (
                      <div className={`rounded-2xl p-5 flex flex-col justify-between min-h-[160px] relative group border ${isDark ? 'bg-[#1e1e24] border-[#2e2e38]' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div><h4 className={`font-bold uppercase tracking-wider text-sm mb-1 ${textTitle}`}>FLASHCARD DECKS</h4><p className={`text-xs ${textMuted}`}>{customFlashcards.length} total cards</p></div>
                        <div className="mt-4"><div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full bg-blue-500 w-1/4 rounded-full" /></div><p className={`text-[10px] mt-2 ${textMuted}`}>Review all decks</p></div>
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={handleDeleteFlashcards} className="p-1.5 text-rose-500 hover:bg-rose-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          <button onClick={() => alert("Scroll down to view your flashcards!")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg">Study</button>
                        </div>
                      </div>
                    )}

                    {customModules.map(mod => (
                      <div key={mod.id} className={`rounded-2xl p-5 flex flex-col justify-between min-h-[160px] relative group border ${isDark ? 'bg-[#1e1e24] border-[#2e2e38]' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{mod.code}</span></div>
                          <h4 className={`font-bold uppercase tracking-wider text-sm line-clamp-2 mt-2 ${textTitle}`}>{mod.title}</h4>
                          <p className={`text-xs mt-1 ${textMuted}`}>{mod.questions.length} questions</p>
                        </div>
                        <div className="mt-4"><div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full bg-purple-500 w-[10%] rounded-full" /></div><p className={`text-[10px] mt-2 ${textMuted}`}>1% mastered</p></div>
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteCustomQuiz(mod.id)} className="p-1.5 text-rose-500 hover:bg-rose-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          <button onClick={() => handleStartModule(mod)} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg">Study</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {customFlashcards.length > 0 && (
                  <div className={`mt-8 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h2 className={`text-xl font-bold mb-6 ${textTitle}`}>Interactive Flashcard Viewer</h2>
                    <div className={`relative p-12 rounded-3xl border text-center min-h-[250px] flex flex-col justify-center items-center cursor-pointer shadow-2xl transition-all ${isDark ? 'bg-gradient-to-br from-[#2C2C35] to-[#1a1a20] border-slate-700 hover:from-[#343440]' : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:from-slate-100'}`} onClick={() => setIsFlipped(!isFlipped)}>
                        <span className={`absolute top-4 right-4 text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${isDark ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>Click to flip</span>
                        <p className={`text-2xl font-semibold leading-relaxed max-w-xl mx-auto ${textTitle}`}>
                          {isFlipped ? customFlashcards[currentCardIdx % customFlashcards.length]?.back : customFlashcards[currentCardIdx % customFlashcards.length]?.front}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-6 max-w-md mx-auto">
                        <button onClick={() => { setCurrentCardIdx(prev => prev - 1); setIsFlipped(false); }} className={`px-6 py-2.5 border rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-[#2C2C35] hover:bg-[#3a3a45] text-white border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'}`}>Previous</button>
                        <span className={`text-xs font-bold ${textMuted}`}>{(currentCardIdx % customFlashcards.length) + 1} / {customFlashcards.length}</span>
                        <button onClick={() => { setCurrentCardIdx(prev => prev + 1); setIsFlipped(false); }} className={`px-6 py-2.5 border rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-[#2C2C35] hover:bg-[#3a3a45] text-white border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'}`}>Next</button>
                      </div>
                  </div>
                )}
              </>
            )}

            {studyLabView === 'creator' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <button onClick={() => setStudyLabView('hub')} className={`flex items-center gap-1 text-sm font-semibold mb-2 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                
                <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl ${bgCard}`}>
                  <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${textTitle}`}>
                    {activeTool === 'Flashcard' ? <Layers className="w-6 h-6 text-blue-500" /> : activeTool === 'Exam Predictor' ? <Target className="w-6 h-6 text-rose-500" /> : <Lightbulb className="w-6 h-6 text-purple-500" />}
                    Generate {activeTool}
                  </h2>
                  <p className={`text-sm mb-6 ${textMuted}`}>
                    {activeTool === 'Exam Predictor' ? 'Generate Short, Long, and Essay questions from your notes.' : 
                     activeTool === 'Flashcard' ? 'Generate key definitions and concepts from your notes.' :
                     `Generate custom ${activeTool} content from your notes.`}
                  </p>

                  <form onSubmit={handleGenerateFromText} className="space-y-5">
                    <div className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors relative ${isDark ? 'border-slate-600 bg-[#121212] hover:bg-[#1a1a20]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                      <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Upload className={`w-8 h-8 mx-auto mb-3 ${textMuted}`} />
                      <span className={`text-sm font-bold block ${textTitle}`}>Upload PDF or TXT file</span>
                      <span className={`text-xs block mt-1 ${textMuted}`}>TOC and headings will be skipped automatically</span>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${textMuted}`}>Set Title</label>
                      <input type="text" value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-slate-600 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900'}`} placeholder={`e.g., ${activeTool} Notes`} />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${textMuted}`}>Your Notes</label>
                      <textarea required rows={8} value={studyMaterialText} onChange={e => setStudyMaterialText(e.target.value)} className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-slate-600 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900'}`} placeholder="Paste your notes here..." />
                    </div>

                    {aiError && (
                      <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${isDark ? 'bg-rose-900/30 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{aiError}</span>
                      </div>
                    )}

                    <button type="submit" disabled={isGenerating} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg">
                      {isGenerating ? <><Activity className="w-4 h-4 animate-spin" /> Processing AI...</> : <><Sparkles className="w-4 h-4" /> Generate {activeTool}</>}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {!selectedSubject ? (
              <>
                <div>
                  <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Curriculum Library</h2>
                  <p className={`text-sm mt-1 ${textMuted}`}>Choose a subject to explore available modules and practical assessments.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(curriculumBase).map(subject => (
                    <button key={subject} onClick={() => setSelectedSubject(subject)} className={`rounded-2xl border p-6 shadow-sm hover:border-blue-500/50 transition-all text-left flex flex-col h-48 justify-between group ${bgCard}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                        {SUBJECT_ICONS[subject] || <Book className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${textTitle}`}>{subject}</h3>
                        <p className={`text-xs mt-1 ${textMuted}`}>{Object.keys(curriculumBase[subject]).length} subtopics available</p>
                      </div>
                      <div className={`absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0`}>
                        <ArrowRight className="w-5 h-5 text-blue-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setSelectedSubject(null)} className={`flex items-center gap-1 text-sm font-semibold mb-2 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  <ArrowLeft className="w-4 h-4" /> Back to Subjects
                </button>
                <div>
                  <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>{selectedSubject}</h2>
                  <p className={`text-sm mt-1 ${textMuted}`}>Select a subtopic to begin your cognitive assessment. Questions will be tailored to your <strong className="uppercase text-blue-500">{currentDifficulty}</strong> level.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(curriculumBase[selectedSubject]).map(([subtopic, mods]) => (
                    mods.map(mod => (
                      <div key={mod.id} className={`rounded-2xl border p-6 shadow-sm hover:border-blue-500/50 transition-all flex flex-col justify-between ${bgCard}`}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>{mod.code}</span>
                          </div>
                          <h4 className={`text-base font-bold ${textTitle}`}>{mod.title}</h4>
                          <p className={`text-xs leading-relaxed line-clamp-2 ${textMuted}`}>{mod.description}</p>
                        </div>
                        <div className={`pt-6 mt-4 border-t flex justify-end ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                          <button onClick={() => handleStartModule(mod)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                            {isGenerating ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <><span>Start</span><ChevronRight className="w-3.5 h-3.5" /></>}
                          </button>
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`rounded-2xl border p-6 shadow-sm space-y-8 animate-in fade-in duration-300 max-w-3xl ${bgCard}`}>
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}>{isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />} Appearance</h3>
              <div className={`mt-4 flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                <div><span className={`text-sm font-bold block ${textTitle}`}>Interface Theme</span><span className={`text-xs ${textMuted}`}>Switch between dark and light mode.</span></div>
                <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'}`}>
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>
            </div>

            <div className={`pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}><Sliders className="w-5 h-5 text-blue-500" /> Manual Difficulty Override</h3>
              <div className="mt-4 flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isManualOverride} onChange={(e) => setIsManualOverride(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className={`ml-3 text-sm font-bold ${textTitle}`}>Override Auto-Adaptation</span>
                </label>
              </div>
              
              {isManualOverride && (
                <div className="mt-4 flex gap-3 animate-in fade-in">
                  {(['introductory', 'intermediate', 'advanced'] as const).map(level => (
                    <button key={level} onClick={() => setManualDifficulty(level)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${manualDifficulty === level ? 'bg-blue-600 text-white border-blue-600' : (isDark ? 'bg-[#121212] text-slate-400 border-[#2e2e38] hover:bg-[#2e2e38]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100')}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</button>
                  ))}
                </div>
              )}
              <p className={`text-xs mt-3 ${textMuted}`}>When off, difficulty scales automatically based on your performance.</p>
            </div>

            <div className={`pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}><ShieldCheck className="w-5 h-5 text-emerald-500" /> Accessibility Options</h3>
              <div className="mt-4 space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                  <div><span className={`text-sm font-bold block ${textTitle}`}>Text Size</span></div>
                  <select value={fontSize} onChange={(e) => setFontSize(e.target.value as any)} className={`px-3 py-1.5 rounded-lg border text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#1e1e24] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                    <option value="normal">Normal (100%)</option><option value="large">Large (115%)</option><option value="x-large">Extra Large (130%)</option>
                  </select>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                  <div><span className={`text-sm font-bold block ${textTitle}`}>High Contrast Mode</span></div>
                  <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 animate-in fade-in duration-300 ${bgCard}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}><Bookmark className="w-5 h-5 text-amber-500" /> Saved Content</h3>
            <div className={`p-8 text-center rounded-xl border border-dashed space-y-2 ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
              <Bookmark className={`w-8 h-8 mx-auto ${textMuted}`} />
              <p className={`text-sm font-semibold ${textTitle}`}>No bookmarks saved yet</p>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className={`rounded-2xl border p-6 shadow-sm space-y-6 animate-in fade-in duration-300 max-w-3xl ${bgCard}`}>
            <div><h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}><Info className="w-5 h-5 text-indigo-500" /> Help & Privacy Policy</h3></div>
            <div className={`space-y-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-100'}`}>
                <h4 className={`font-bold mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>How does the system adapt?</h4>
                <p>Our system uses Cognitive Load Theory. It tracks your response latency, hesitation count (switching options), and accuracy. If the system detects high cognitive load, it will automatically offer a scaffolding hint or reduce the difficulty.</p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`font-bold mb-1 ${textTitle}`}>Privacy & Consent</h4>
                <p>Your interaction data (telemetry) is stored securely and used strictly for academic research to personalise your learning path.</p>
              </div>
            </div>
          </div>
        )}

        {showBreathing && <BreathingReset onClose={() => setShowBreathing(false)} />}
      </div>
    </div>
  );
};