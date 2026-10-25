import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, LearningModule, Question, LearningSession, QuestionResponse } from '../types';
import { getUserSessions, saveSession } from '../services/storage';
import {
  achievements, buildReviewModule, fingerprint, insights, levelInfo, liveLoad,
  sessionXp, totalXp, XpBreakdown, Achievement, LevelInfo,
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
  ListChecks, FlaskConical, Compass, Keyboard, Wind, ShieldQuestion, Timer, CheckSquare, Square, BookOpenCheck
} from 'lucide-react';

import mammoth from 'mammoth';
import JSZip from 'jszip';

import { getSupabaseClient } from '../services/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface StudentDashboardProps {
  user: User;
}

type DashboardTab = 'dashboard' | 'curriculum' | 'library' | 'settings' | 'bookmarks' | 'help';
type ThemeMode = 'dark' | 'light';
type Difficulty = 'introductory' | 'intermediate' | 'advanced';

interface Flashcard { front: string; back: string; }

const curriculumBase = {
  'Mathematics': {
    'Linear Equations': [
      { id: 'math-lin-01', code: 'MATH-101', title: 'Solving Linear Equations', description: 'Isolate variables and solve for x.', academicDiscipline: 'Mathematics', estimatedMinutes: 15, 
        questions: [
          { id: 'm1', text: 'Solve for x: 2x + 4 = 10', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correctAnswerIndex: 1, explanation: 'Subtract 4 from both sides (2x = 6), then divide by 2 (x = 3).', targetConcept: 'Linear Equations', baselineExpectedSeconds: 30, scaffoldHint: 'Isolate x by subtracting 4 first.', type: 'mcq' }
        ] 
      }
    ]
  },
  'Computer Science': {
    'Algorithms': [
      { id: 'cs-alg-01', code: 'CS-101', title: 'Binary Search & Complexity', description: 'Understand searching algorithms.', academicDiscipline: 'Computer Science', estimatedMinutes: 15, 
        questions: [
          { id: 'c1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswerIndex: 1, explanation: 'Binary search halves the search space each time.', targetConcept: 'Complexity', baselineExpectedSeconds: 20, scaffoldHint: 'Think about how many times you can divide an array in half.', type: 'mcq' }
        ] 
      }
    ]
  },
  'Science': {
    'Physics': [
      { id: 'sci-phys-01', code: 'PHYS-105', title: 'Newton\'s Laws', description: 'Explore force, mass, and acceleration.', academicDiscipline: 'Science', estimatedMinutes: 15, 
        questions: [
          { id: 's1', text: 'What is the formula for Newton\'s Second Law?', options: ['E = mc²', 'F = ma', 'V = IR', 'a² + b² = c²'], correctAnswerIndex: 1, explanation: 'Force equals mass times acceleration.', targetConcept: 'Newton\'s Laws', baselineExpectedSeconds: 15, scaffoldHint: 'Force is equal to mass multiplied by acceleration.', type: 'mcq' }
        ] 
      }
    ]
  }
} as Record<string, Record<string, LearningModule[]>>;

// BULLETPROOF FALLBACK GENERATOR
const generateLocalMaterial = (text: string, tool: string, config: any = {}) => {
  const cleanText = text.replace(/(\s+\d+\.?\s*$)/gm, '').replace(/^(TOPIC|CHAPTER|SECTION|UNIT|PART)\s*\d+.*$/gim, ''); 
  let rawSentences = cleanText.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
  
  let sentences = rawSentences.filter(s => {
    const trimmed = s.trim();
    return trimmed.length > 40 && trimmed.split(' ').length > 6 && !(trimmed === trimmed.toUpperCase()); 
  });

  sentences = sentences.sort(() => Math.random() - 0.5);

  if (sentences.length === 0) {
    return { questions: [{ type: "mcq", text: "Not enough readable text found.", options: ["OK"], correctAnswerIndex: 0, explanation: "Please try a different document.", scaffoldHint: "Try uploading a longer document." }] };
  }

  if (tool === 'Flashcard') {
    const cards = sentences.slice(0, 8).map(s => {
      const words = s.split(' ').map(w => w.replace(/[^a-zA-Z0-9]/g, ''));
      const keyword = [...words].sort((a, b) => b.length - a.length).find(w => w.length > 5) || 'concept';
      return { front: `Explain the concept of "${keyword}".`, back: s.trim() };
    });
    return { flashcards: cards };
  } 

  const numQuestions = Math.min(config.questions || 5, sentences.length);
  const difficulty = config.difficulty || 'introductory';
  const questions = [];
  
  for (let i = 0; i < numQuestions; i++) {
    const s = sentences[i];
    
    if (difficulty === 'introductory') {
      const words = s.split(' ');
      const longWord = [...words].sort((a, b) => b.length - a.length).find(w => w.length > 5) || words[Math.floor(words.length/2)];
      const blanked = s.replace(longWord, '______');
      const distractors = ["concept", "algorithm", "process", "system"].filter(w => w !== longWord).slice(0, 3);
      const options = [longWord, ...distractors].sort(() => Math.random() - 0.5);
      
      questions.push({ 
        type: "mcq", text: `Complete the sentence: "${blanked}"`, options, correctAnswerIndex: options.indexOf(longWord), explanation: s, scaffoldHint: "Look at the surrounding words for context clues." 
      });
    } else {
      questions.push({ 
        type: "mcq", text: `What is the significance of the following statement: "${s.substring(0, 80)}..."`, 
        options: ["It is a core concept", "It is irrelevant", "It is a contradiction", "It is a minor detail"], 
        correctAnswerIndex: 0, explanation: s, scaffoldHint: "Consider the main theme of the text." 
      });
    }
  }
  return { questions };
};

// BULLETPROOF CLI CALCULATOR
const calculateCLI = (timeTaken: number, baseline: number, hesitations: number, isCorrect: boolean) => {
  let score = 10;
  if (!isCorrect) score += 40; 
  if (timeTaken > baseline * 1.5) score += 20; 
  if (timeTaken > baseline * 2.5) score += 20; 
  if (hesitations > 0) score += (hesitations * 10); 
  return Math.min(100, score);
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
  const [activeTool, setActiveTool] = useState<string>('Practice Test');
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
    isCorrect: boolean; explanation: string; responseTimeMs: number; cliScore: number; adaptiveAction?: string;
  } | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);

  const [showExamSetup, setShowExamSetup] = useState(false);
  const [examConfig, setExamConfig] = useState({ questions: 10, timer: 30 });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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

  // BULLETPROOF STREAK CALCULATOR
  const streak = useMemo(() => {
    if (completedSessions.length === 0) return { current: 0, best: 0, activeToday: false };
    const dates = [...new Set(completedSessions.map(s => new Date(s.startedAt).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let current = 0;
    if (dates.includes(today) || dates.includes(yesterday)) {
      current = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = (new Date(dates[i-1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
        if (diff === 1) current++;
        else break;
      }
    }
    return { current, best: Math.max(current, dates.length), activeToday: dates.includes(today) };
  }, [completedSessions]);

  // BULLETPROOF MEMORY VAULT CALCULATOR
  const vault = useMemo(() => {
    const wrongQuestions: Record<string, { front: string; back: string; due: boolean }> = {};
    allResponses.forEach((r, i) => {
      if (!r.isCorrect) {
        wrongQuestions[r.questionId] = { front: `Review Question ${i+1}`, back: r.explanation || 'Re-read your notes.', due: true };
      }
    });
    return Object.values(wrongQuestions);
  }, [allResponses]);

  const dueItems = useMemo(() => vault.filter(v => v.due), [vault]);

  const level = useMemo(() => levelInfo(totalXp(sessions, [])), [sessions]);
  const fp = useMemo(() => fingerprint(sessions, []), [sessions]);
  const insightList = useMemo(() => insights(sessions, []), [sessions]);
  const badges = useMemo(() => achievements(sessions, []), [sessions]);

  useEffect(() => {
    if (activeSession && !submittedFeedback && !sessionFinished) {
      timerRef.current = setInterval(() => { setElapsedSeconds(Math.floor((Date.now() - questionStartTime) / 1000)); }, 500);
    } else if (timerRef.current) { clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession, submittedFeedback, sessionFinished, questionStartTime]);

  useEffect(() => {
    if (activeSession && !sessionFinished && timeRemaining !== null) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current!);
            handleNextQuestion(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [activeSession, sessionFinished, timeRemaining]);

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

    try {
      if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => { setStudyMaterialText(cleanExtractedText(event.target?.result as string)); setIsGenerating(false); };
        reader.readAsText(file);
      } 
      else if (file.name.endsWith('.pdf')) {
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
      }
      else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const cleaned = cleanExtractedText(result.value);
        if (cleaned.length < 50) setAiError("Not enough readable text found in Word document.");
        else setStudyMaterialText(cleaned);
      }
      else if (file.name.endsWith('.pptx')) {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
        slideFiles.sort((a, b) => parseInt(a.match(/slide(\d+)\.xml/)![1]) - parseInt(b.match(/slide(\d+)\.xml/)![1]));
        let fullText = '';
        for (const slide of slideFiles) {
          const content = await zip.file(slide)!.async('string');
          const textMatches = content.match(/<a:t>(.*?)<\/a:t>/g) || [];
          fullText += textMatches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ') + ' \n';
        }
        const cleaned = cleanExtractedText(fullText);
        if (cleaned.length < 50) setAiError("Not enough readable text found in PowerPoint slides.");
        else setStudyMaterialText(cleaned);
      }
      else { setAiError("Please upload .txt, .pdf, .docx, or .pptx"); }
    } catch (error: any) {
      setAiError(`Failed to read the file: ${error.message}`);
    } finally { setIsGenerating(false); }
  };

  const generateMaterial = async (text: string, tool: string, config = examConfig, isEasier = false) => {
    setIsGenerating(true);
    setAiError(null);
    let parsedData = null;

    const safeConfig = {
        questions: Math.max(1, Math.min(20, Number(config.questions) || 10)),
        timer: Math.max(1, Number(config.timer) || 30),
        difficulty: isEasier ? 'introductory' : currentDifficulty
    };

    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("Supabase is not configured.");
      const { data, error } = await sb.functions.invoke('generate-quiz', {
        body: { studyText: text.slice(0, 5000), outputFormat: 'quiz', activeTool: tool, difficulty: safeConfig.difficulty, config: safeConfig },
      });

      if (error) throw new Error(`Supabase Error: ${error.message}`);
      if (data?.error) throw new Error(`AI Error: ${data.error}`);
      parsedData = typeof data === 'string' ? JSON.parse(data.replace(/```json/g, '').replace(/```/g, '').trim()) : data;

    } catch (error: any) {
      console.warn("Supabase AI failed. Using local fallback.", error);
      parsedData = generateLocalMaterial(text, tool, safeConfig);
    }

    try {
      if (tool === 'Flashcard' && parsedData?.flashcards) {
        const newCards = parsedData.flashcards.map((fc: any) => ({ front: `[Flashcard] ${fc.front}`, back: fc.back }));
        const updated = [...customFlashcards, ...newCards];
        setCustomFlashcards(updated); localStorage.setItem('custom_flashcards', JSON.stringify(updated));
        setCurrentCardIdx(customFlashcards.length); setIsFlipped(false);
      } else if (parsedData?.questions && parsedData.questions.length > 0) {
        const questions: Question[] = parsedData.questions.map((q: any, index: number) => ({
          id: `q-${Date.now()}-${index}`, text: q.text || "Missing", options: q.options || [], correctAnswerIndex: q.correctAnswerIndex ?? -1,
          explanation: q.explanation || 'No explanation.', targetConcept: `${tool} Concept`,
          baselineExpectedSeconds: 60, scaffoldHint: q.scaffoldHint || 'Think about the core concepts.', type: q.type || 'mcq'
        } as any));

        const newModule: LearningModule = {
          id: `module-${Date.now()}`, code: isEasier ? 'RETEST-EASY' : tool.toUpperCase().replace(' ', '-'), 
          title: materialTitle || `${tool}: Generated Material`, description: `Generated module.`, academicDiscipline: 'General',
          estimatedMinutes: Math.ceil(questions.length * 1.5), questions: questions, sourceText: text
        } as any;

        const updated = [...customModules, newModule];
        setCustomModules(updated); localStorage.setItem('custom_study_modules', JSON.stringify(updated));
        if (tool === 'Practice Test' || isEasier) handleStartModule(newModule, safeConfig.timer);
      } else { throw new Error("AI did not return valid questions."); }
      setStudyMaterialText(''); setMaterialTitle(''); setStudyLabView('hub'); setShowExamSetup(false);
    } catch (err: any) { setAiError(err.message || "Generation failed."); } finally { setIsGenerating(false); }
  };

  const handleGenerateFromText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyMaterialText || studyMaterialText.length < 50) { setAiError("Provide at least 50 characters."); return; }
    if (activeTool === 'Practice Test') { setShowExamSetup(true); return; }
    generateMaterial(studyMaterialText, activeTool);
  };

  const handleStartModule = (mod: LearningModule, timerMins: number = 0) => {
    if (!mod.questions || mod.questions.length === 0) { alert("No questions."); return; }
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
    setTimeRemaining(timerMins > 0 ? timerMins * 60 : null);
    saveSession(newSession);
  };

  const handleSelectOption = (idx: number) => {
    if (submittedFeedback) return;
    if (selectedOption !== null && selectedOption !== idx) {
      setHesitationCount(prev => prev + 1);
      const el = document.getElementById('hesitation-counter');
      if (el) { el.classList.add('scale-125', 'text-amber-500'); setTimeout(() => el.classList.remove('scale-125', 'text-amber-500'), 300); }
      if (hesitationCount + 1 === 3) setShowIntervention(true);
    }
    setSelectedOption(idx);
  };

  const currentQuestion: Question & { type?: string } | undefined = activeModule?.questions[currentQuestionIdx] as any;
  const handleStartReview = () => { if (dueItems.length) handleStartModule(buildReviewModule(dueItems as any)); };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !activeSession) return;
    if (selectedOption === null || confidence === null) return;

    const responseTimeMs = Date.now() - questionStartTime;
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    
    const cliScore = calculateCLI(responseTimeMs / 1000, currentQuestion.baselineExpectedSeconds || 30, hesitationCount, isCorrect);

    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id, selectedOptionIndex: selectedOption, isCorrect, responseTimeMs,
      hesitationCount, attemptsCount, hintUsed: showScaffoldHint, cognitiveLoadScore: cliScore,
      adaptationAction: isCorrect ? 'Maintain difficulty' : 'Provide scaffold', ...(confidence ? { confidence } : {})
    };
    
    const updatedSession = { ...activeSession, responses: [...activeSession.responses, newResponse], totalDwellTimeMs: activeSession.totalDwellTimeMs + responseTimeMs };
    setActiveSession(updatedSession); saveSession(updatedSession);
    setSubmittedFeedback({ isCorrect, explanation: currentQuestion.explanation, responseTimeMs, cliScore, adaptiveAction: isCorrect ? 'Maintain' : 'Scaffold' });
  };

  const handleNextQuestion = () => {
    if (!activeModule || !activeSession) return;
    setShowIntervention(false); 
    if (currentQuestionIdx + 1 < activeModule.questions.length && (!timeRemaining || timeRemaining > 0)) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null); setEssayInput(''); setHesitationCount(0); setAttemptsCount(1);
      setShowScaffoldHint(false); setSubmittedFeedback(null); setConfidence(null);
      setQuestionStartTime(Date.now()); setElapsedSeconds(0);
    } else {
      const finalMetrics = { averageResponseTimeMs: activeSession.responses.reduce((a,b)=>a+b.responseTimeMs,0)/activeSession.responses.length, cognitiveLoadIndex: activeSession.responses.reduce((a,b)=>a+b.cognitiveLoadScore,0)/activeSession.responses.length, predictedState: 'flow' as any };
      const finalizedSession: LearningSession = { ...activeSession, status: 'completed', completedAt: new Date().toISOString(), finalMetrics };
      saveSession(finalizedSession); setActiveSession(finalizedSession); setSessionFinished(true); refreshUserSessions();
      if (countdownRef.current) clearInterval(countdownRef.current);
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

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  if (activeSession && activeModule && !sessionFinished) {
    const isMCQ = currentQuestion?.type === 'mcq' || !currentQuestion?.type;
    return (
      <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass} relative`}>
        {showIntervention && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-[#1e1e24] border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><ShieldQuestion className="w-10 h-10 text-amber-500" /></div>
              <h2 className="text-2xl font-extrabold text-white">Cognitive Overload Detected</h2>
              <p className="text-sm text-slate-400 leading-relaxed">Our telemetry sensors detected high hesitation and latency. Your working memory is currently overwhelmed. <br/><br/>Take a deep breath. We are temporarily pausing the quiz to reset your cognitive load.</p>
              <div className="bg-[#121212] rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-2"><span className="text-slate-500">Live Latency</span><span className="text-rose-400 font-bold">{elapsedSeconds}s</span></div>
                <div className="flex items-center justify-between text-xs font-mono"><span className="text-slate-500">Hesitations</span><span className="text-rose-400 font-bold">{hesitationCount} changes</span></div>
              </div>
              <button onClick={() => setShowIntervention(false)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"><Wind className="w-4 h-4" /> I'm Ready to Continue</button>
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
                {timeRemaining !== null && (
                  <>
                    <div className={`flex items-center gap-1.5 ${timeRemaining < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}><Timer className="w-4 h-4" /><span>Time: <strong className={timeRemaining < 60 ? 'text-rose-500' : textTitle}>{formatTime(timeRemaining)}</strong></span></div>
                    <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  </>
                )}
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Clock className="w-4 h-4 text-blue-500 animate-pulse" /><span>Elapsed: <strong className={textTitle}>{elapsedSeconds}s</strong></span></div>
                <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div id="hesitation-counter" className={`flex items-center gap-1.5 transition-all duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Activity className="w-4 h-4 text-amber-500" /><span>Hesitations: <strong className={textTitle}>{hesitationCount}</strong></span></div>
                <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}><Compass className="w-4 h-4 text-indigo-500" /><span>Q {currentQuestionIdx + 1}/{activeModule.questions.length}</span></div>
              </div>
              <button onClick={() => { if (window.confirm("Are you sure you want to quit?")) { setActiveSession(null); setActiveModule(null); setSessionFinished(false); if(countdownRef.current) clearInterval(countdownRef.current); } }} className="text-rose-500 hover:bg-rose-500/10 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30"><X className="w-4 h-4" /> Quit</button>
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
                <div className="space-y-3 pt-2"><textarea value={essayInput} onChange={e => setEssayInput(e.target.value)} rows={6} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-[#3e3e4a] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} placeholder="Type your practical answer here..." /></div>
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
                  <div className="w-full flex justify-end"><button type="button" onClick={handleSubmitAnswer} disabled={isMCQ ? (selectedOption === null || confidence === null) : essayInput.length < 5} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"><span>Submit Answer</span><ArrowRight className="w-4 h-4" /></button></div>
                ) : (
                  <div className="w-full flex justify-end"><button type="button" onClick={handleNextQuestion} className={`px-6 py-2.5 font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}><span>{currentQuestionIdx + 1 < activeModule.questions.length ? 'Proceed to Next Concept' : 'Conclude & Compute Analytics'}</span><ArrowRight className="w-4 h-4" /></button></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- SESSION FINISHED / RESULTS VIEW ----
  if (sessionFinished && activeSession && activeModule) {
    const isExam = activeModule.code === 'PRACTICE-TEST';
    const scorePct = Math.round((activeSession.responses.filter(r => r.isCorrect).length / activeSession.responses.length) * 100);
    const needsRetake = isExam && scorePct < 50;

    return (
      <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className={`rounded-2xl border p-8 shadow-sm space-y-6 ${bgCard}`}>
            <div className={`flex items-center gap-3 border-b pb-6 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}><Brain className="w-6 h-6" /></div>
              <div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Session Concluded</span>
                <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Diagnostics: {activeSession.moduleTitle}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Score</span><span className={`text-3xl font-extrabold mt-1 block ${scorePct >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{scorePct}%</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Results</span><span className={`text-3xl font-extrabold mt-1 block ${textTitle}`}>{activeSession.responses.filter(r => r.isCorrect).length}/{activeSession.responses.length}</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Mean Latency</span><span className={`text-3xl font-extrabold mt-1 block ${textTitle}`}>{((activeSession.finalMetrics?.averageResponseTimeMs || 0) / 1000).toFixed(1)}s</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Cog. Load</span><span className="text-3xl font-extrabold text-blue-500 mt-1 block">{activeSession.finalMetrics?.cognitiveLoadIndex || 0}</span></div>
            </div>

            <div className="mt-8 space-y-6">
              <h3 className={`text-lg font-bold border-b pb-2 ${textTitle} ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>Review Answers</h3>
              {activeSession.responses.map((res, i) => {
                const q = activeModule.questions[i];
                if (!q) return null;
                return (
                  <div key={i} className={`p-5 rounded-xl border ${isDark ? 'bg-[#1a1a20] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex gap-3">
                      <span className={`font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{i + 1}.</span>
                      <div className="space-y-3 flex-1">
                        <p className={`font-semibold ${textTitle}`}>{q.text}</p>
                        <div className="space-y-2">
                          {q.options?.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctAnswerIndex;
                            const isUserChoice = optIdx === res.selectedOptionIndex;
                            let bgClass = 'bg-transparent';
                            let textClass = textMuted;
                            if (isCorrect) { bgClass = 'bg-emerald-500/10'; textClass = 'text-emerald-500 font-bold'; }
                            else if (isUserChoice && !isCorrect) { bgClass = 'bg-rose-500/10'; textClass = 'text-rose-500 line-through'; }
                            
                            return (
                              <div key={optIdx} className={`flex items-start gap-2 p-2 rounded-lg ${bgClass}`}>
                                {isCorrect ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500" /> : isUserChoice ? <XCircle className="w-4 h-4 mt-0.5 text-rose-500" /> : <div className="w-4 h-4" />}
                                <span className={`text-sm ${textClass}`}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className={`text-xs p-3 rounded-lg border ${isDark ? 'bg-[#121212] border-[#2e2e38] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                          <strong className="text-blue-500">Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`flex items-center justify-between pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <button onClick={() => { setActiveSession(null); setActiveModule(null); setSessionFinished(false); refreshUserSessions(); }} className={`px-6 py-2.5 font-bold text-sm rounded-xl shadow-xs cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}>Return to Dashboard</button>
              
              {needsRetake && (
                <button onClick={() => {
                  const sourceText = (activeModule as any).sourceText;
                  if (sourceText) {
                    setActiveSession(null); setActiveModule(null); setSessionFinished(false);
                    generateMaterial(sourceText, 'Practice Test', examConfig, true);
                  } else {
                    alert("Source text not found for retake.");
                  }
                }} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer animate-pulse">
                  <Sparkles className="w-4 h-4" /> Generate Easier Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN TABBED DASHBOARD VIEW ----
  return (
    <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass}`}>
      
      {/* EXAM SETUP MODAL */}
      {showExamSetup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-3xl p-8 shadow-2xl ${bgCard} animate-in zoom-in-95 duration-200`}>
            <h2 className={`text-2xl font-extrabold mb-2 ${textTitle}`}>Your test has been generated</h2>
            <p className={`text-sm mb-6 ${textMuted}`}>Customize "{materialTitle || 'Practice Test'}"</p>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Number of Questions</label>
                <input type="number" value={examConfig.questions} onChange={e => setExamConfig({...examConfig, questions: Number(e.target.value)})} className={`w-full bg-transparent text-lg font-bold outline-none ${textTitle}`} min="1" max="20" />
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Timer (minutes)</label>
                <input type="number" value={examConfig.timer} onChange={e => setExamConfig({...examConfig, timer: Number(e.target.value)})} className={`w-full bg-transparent text-lg font-bold outline-none ${textTitle}`} min="1" max="120" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button onClick={() => generateMaterial(studyMaterialText, 'Practice Test', examConfig)} disabled={isGenerating} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center">
                {isGenerating ? "Generating..." : "Take this test"}
              </button>
              <button onClick={() => setShowExamSetup(false)} className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className={`flex flex-wrap gap-2 border-b pb-2 ${navBorder}`}>
          <button onClick={() => { setActiveTab('dashboard'); setStudyLabView('hub'); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard' ? activeNavBg : inactiveNav}`}><BookOpen className="w-4 h-4" /><span>Dashboard</span></button>
          <button onClick={() => setActiveTab('curriculum')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'curriculum' ? activeNavBg : inactiveNav}`}><GraduationCap className="w-4 h-4" /><span>Curriculum</span></button>
          <button onClick={() => setActiveTab('library')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'library' ? activeNavBg : inactiveNav}`}><BookOpenCheck className="w-4 h-4" /><span>Library</span></button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'settings' ? activeNavBg : inactiveNav}`}><Settings className="w-4 h-4" /><span>Settings</span></button>
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
                </div>
                
                <section className={`rounded-3xl p-6 sm:p-8 ${isDark ? 'bg-[#1a1a20]' : 'bg-slate-100'}`}>
                  <h2 className={`text-xl font-bold mb-4 ${textTitle}`}>Quick Tools</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => { setActiveTool('Flashcard'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Flashcard</h3><p className="text-blue-100 text-xs mt-1">Flip to memorize</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200 opacity-80 group-hover:scale-110 transition-transform"><FileText className="w-10 h-10" /></div>
                    </button>
                    <button onClick={() => { setActiveTool('Practice Test'); setStudyLabView('creator'); }} className="relative overflow-hidden group bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 transition-all rounded-2xl p-6 flex flex-col justify-between items-start text-left h-32 shadow-lg cursor-pointer">
                      <div><h3 className="text-white font-bold text-xl">Practice Test</h3><p className="text-purple-100 text-xs mt-1">Adaptive questions & essays</p></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-200 opacity-80 group-hover:scale-110 transition-transform"><ListChecks className="w-10 h-10" /></div>
                    </button>
                  </div>
                </section>

                <AchievementsGrid items={badges} />
              </>
            )}

            {studyLabView === 'creator' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <button onClick={() => setStudyLabView('hub')} className={`flex items-center gap-1 text-sm font-semibold mb-2 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl ${bgCard}`}>
                  <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${textTitle}`}>
                    {activeTool === 'Flashcard' ? <Layers className="w-6 h-6 text-blue-500" /> : <Lightbulb className="w-6 h-6 text-purple-500" />}
                    Generate {activeTool}
                  </h2>
                  <form onSubmit={handleGenerateFromText} className="space-y-5 mt-6">
                    <div className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors relative ${isDark ? 'border-slate-600 bg-[#121212] hover:bg-[#1a1a20]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                      <input type="file" accept=".txt,.pdf,.docx,.pptx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Upload className={`w-8 h-8 mx-auto mb-3 ${textMuted}`} />
                      <span className={`text-sm font-bold block ${textTitle}`}>Upload PDF, TXT, DOCX, or PPTX</span>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${textMuted}`}>Set Title</label>
                      <input type="text" value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-slate-600 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900'}`} placeholder={`e.g., ${activeTool} Notes`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 uppercase tracking-wider ${textMuted}`}>Your Notes</label>
                      <textarea required rows={6} value={studyMaterialText} onChange={e => setStudyMaterialText(e.target.value)} className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-slate-600 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900'}`} placeholder="Paste your notes here..." />
                    </div>
                    {aiError && <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${isDark ? 'bg-rose-900/30 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700'}`}><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{aiError}</span></div>}
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

        {activeTab === 'library' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Your Library</h2>
                <p className={`text-sm mt-1 ${textMuted}`}>All your generated study sets, flashcards, and practice tests.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customFlashcards.length > 0 && (
                <div className={`rounded-2xl p-6 shadow-sm border ${bgCard}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                    <button onClick={handleDeleteFlashcards} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h4 className={`font-bold text-lg mb-1 ${textTitle}`}>Flashcard Deck</h4>
                  <p className={`text-xs ${textMuted}`}>{customFlashcards.length} cards total</p>
                  <button onClick={() => { setActiveTab('dashboard'); setIsFlipped(false); setCurrentCardIdx(0); setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100); }} className="mt-6 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-lg transition-colors">Study Deck</button>
                </div>
              )}
              
              {customModules.map(mod => (
                <div key={mod.id} className={`rounded-2xl p-6 shadow-sm border ${bgCard}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-700`}>
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <button onClick={() => handleDeleteCustomQuiz(mod.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h4 className={`font-bold text-lg mb-1 line-clamp-1 ${textTitle}`}>{mod.title}</h4>
                  <p className={`text-xs ${textMuted}`}>{mod.questions.length} questions</p>
                  <div className="flex gap-2 mt-6">
                    <button onClick={() => handleStartModule(mod)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors">Start Test</button>
                  </div>
                </div>
              ))}

              {customModules.length === 0 && customFlashcards.length === 0 && (
                <div className={`col-span-full p-12 text-center rounded-2xl border border-dashed ${isDark ? 'bg-[#1a1a20] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                  <BookOpenCheck className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
                  <p className={`font-bold ${textTitle}`}>Your library is empty</p>
                  <p className={`text-xs mt-1 ${textMuted}`}>Generate study material from the Dashboard to see it here.</p>
                </div>
              )}
            </div>
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
      </div>
    </div>
  );
};