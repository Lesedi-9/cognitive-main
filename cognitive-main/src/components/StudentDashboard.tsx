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
  ListChecks, FlaskConical, Compass, Keyboard, Wind, ShieldQuestion, Timer, CheckSquare, Square, BookOpenCheck,
  RefreshCw, Download, FileDown, Play, User as UserIcon, Phone, MapPin
} from 'lucide-react';

import mammoth from 'mammoth';
import JSZip from 'jszip';

import { getSupabaseClient } from '../services/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface StudentDashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

type DashboardTab = 'dashboard' | 'curriculum' | 'library' | 'settings' | 'bookmarks' | 'help';
type ThemeMode = 'dark' | 'light';
type Difficulty = 'introductory' | 'intermediate' | 'advanced';

interface Flashcard { front: string; back: string; }

const curriculumBase = {
  'Mathematics': {
    'Linear Equations': [
      {
        id: 'math-lin-01', code: 'MATH-101', title: 'Linear Equations',
        description: 'Solve single-variable equations and understand slope-intercept form.',
        academicDiscipline: 'Mathematics', estimatedMinutes: 15,
        questions: [
          { id: 'm1', text: 'Solve for x: 2x + 4 = 10', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correctAnswerIndex: 1, explanation: 'Subtract 4 from both sides (2x = 6), then divide by 2 (x = 3).', targetConcept: 'Linear Equations', baselineExpectedSeconds: 25, scaffoldHint: 'Isolate x by subtracting 4 first.', type: 'mcq' },
          { id: 'm2', text: 'Solve for x: 3x - 7 = 14', options: ['x = 5', 'x = 6', 'x = 7', 'x = 8'], correctAnswerIndex: 2, explanation: 'Add 7 to both sides (3x = 21), then divide by 3 (x = 7).', targetConcept: 'Linear Equations', baselineExpectedSeconds: 30, scaffoldHint: 'Add 7 to both sides first.', type: 'mcq' },
          { id: 'm3', text: 'Solve for x: x/4 + 2 = 5', options: ['x = 8', 'x = 10', 'x = 12', 'x = 14'], correctAnswerIndex: 2, explanation: 'Subtract 2 (x/4 = 3), then multiply by 4 (x = 12).', targetConcept: 'Fractions in Equations', baselineExpectedSeconds: 35, scaffoldHint: 'Undo the addition first, then the division.', type: 'mcq' },
          { id: 'm4', text: 'Solve for x: 5(x - 2) = 20', options: ['x = 4', 'x = 5', 'x = 6', 'x = 7'], correctAnswerIndex: 2, explanation: 'Divide by 5 (x - 2 = 4), then add 2 (x = 6).', targetConcept: 'Distributive Property', baselineExpectedSeconds: 35, scaffoldHint: 'Divide by 5 first to keep it simple.', type: 'mcq' },
          { id: 'm5', text: 'What is the slope of the line y = 3x - 2?', options: ['3', '-2', '2', '-3'], correctAnswerIndex: 0, explanation: 'In y = mx + b, m is the slope. Here m = 3.', targetConcept: 'Slope', baselineExpectedSeconds: 20, scaffoldHint: 'Slope is the coefficient of x.', type: 'mcq' },
          { id: 'm6', text: 'Solve for x: 2(x + 3) = 3(x - 1)', options: ['x = 6', 'x = 7', 'x = 8', 'x = 9'], correctAnswerIndex: 3, explanation: 'Expand: 2x + 6 = 3x - 3 → 9 = x.', targetConcept: 'Multi-step Equations', baselineExpectedSeconds: 45, scaffoldHint: 'Expand both sides then collect x terms.', type: 'mcq' },
          { id: 'm7', text: 'If 4x + 2y = 20 and x = 3, what is y?', options: ['2', '3', '4', '5'], correctAnswerIndex: 2, explanation: 'Substitute x = 3: 12 + 2y = 20 → 2y = 8 → y = 4.', targetConcept: 'Substitution', baselineExpectedSeconds: 35, scaffoldHint: 'Plug in x first, then solve for y.', type: 'mcq' },
        ]
      }
    ],
    'Fractions & Decimals': [
      {
        id: 'math-frac-01', code: 'MATH-102', title: 'Fractions & Decimals',
        description: 'Add, multiply, simplify, and convert fractions and decimals.',
        academicDiscipline: 'Mathematics', estimatedMinutes: 12,
        questions: [
          { id: 'mf1', text: 'What is 1/2 + 1/3?', options: ['2/5', '3/5', '5/6', '2/6'], correctAnswerIndex: 2, explanation: 'Use a common denominator of 6: 3/6 + 2/6 = 5/6.', targetConcept: 'Adding Fractions', baselineExpectedSeconds: 25, scaffoldHint: 'Find a common denominator.', type: 'mcq' },
          { id: 'mf2', text: 'Convert 0.75 to a fraction.', options: ['1/2', '3/4', '2/3', '7/8'], correctAnswerIndex: 1, explanation: '0.75 = 75/100, which simplifies to 3/4.', targetConcept: 'Decimal Conversion', baselineExpectedSeconds: 20, scaffoldHint: 'Think of 75 out of 100.', type: 'mcq' },
          { id: 'mf3', text: 'What is 2/3 × 3/4?', options: ['1/2', '2/3', '5/7', '6/7'], correctAnswerIndex: 0, explanation: 'Multiply numerators and denominators: 6/12 = 1/2.', targetConcept: 'Multiplying Fractions', baselineExpectedSeconds: 25, scaffoldHint: 'Multiply across then simplify.', type: 'mcq' },
          { id: 'mf4', text: 'What is 0.25 + 0.5?', options: ['0.65', '0.75', '0.85', '0.55'], correctAnswerIndex: 1, explanation: '0.25 + 0.50 = 0.75.', targetConcept: 'Adding Decimals', baselineExpectedSeconds: 15, scaffoldHint: 'Align the decimal points.', type: 'mcq' },
          { id: 'mf5', text: 'Which is larger: 3/5 or 4/7?', options: ['3/5', '4/7', 'Equal', 'Cannot determine'], correctAnswerIndex: 0, explanation: '3/5 = 0.6, 4/7 ≈ 0.571. So 3/5 is larger.', targetConcept: 'Comparing Fractions', baselineExpectedSeconds: 30, scaffoldHint: 'Convert both to decimals.', type: 'mcq' },
          { id: 'mf6', text: 'Simplify 12/18.', options: ['2/3', '3/4', '4/6', '6/9'], correctAnswerIndex: 0, explanation: 'The greatest common divisor is 6, so 12/18 = 2/3.', targetConcept: 'Simplifying', baselineExpectedSeconds: 25, scaffoldHint: 'Find the largest number that divides both.', type: 'mcq' },
        ]
      }
    ],
    'Geometry Basics': [
      {
        id: 'math-geom-01', code: 'MATH-103', title: 'Geometry Basics',
        description: 'Area, perimeter, angles, and the Pythagorean theorem.',
        academicDiscipline: 'Mathematics', estimatedMinutes: 12,
        questions: [
          { id: 'mg1', text: 'What is the area of a rectangle with length 5 and width 3?', options: ['8', '15', '16', '30'], correctAnswerIndex: 1, explanation: 'Area = length × width = 5 × 3 = 15.', targetConcept: 'Rectangle Area', baselineExpectedSeconds: 15, scaffoldHint: 'Multiply length by width.', type: 'mcq' },
          { id: 'mg2', text: 'What is the sum of interior angles of a triangle?', options: ['90°', '180°', '270°', '360°'], correctAnswerIndex: 1, explanation: 'The sum of a triangle\'s interior angles is always 180°.', targetConcept: 'Triangle Angles', baselineExpectedSeconds: 15, scaffoldHint: 'It\'s a fixed value for every triangle.', type: 'mcq' },
          { id: 'mg3', text: 'A circle has a radius of 4. What is its diameter?', options: ['2', '4', '8', '16'], correctAnswerIndex: 2, explanation: 'Diameter = 2 × radius = 8.', targetConcept: 'Circles', baselineExpectedSeconds: 15, scaffoldHint: 'Diameter is twice the radius.', type: 'mcq' },
          { id: 'mg4', text: 'The Pythagorean theorem states a² + b² = ?', options: ['c', 'c²', '2c', 'ab'], correctAnswerIndex: 1, explanation: 'For a right triangle, a² + b² = c² where c is the hypotenuse.', targetConcept: 'Pythagorean Theorem', baselineExpectedSeconds: 20, scaffoldHint: 'It relates the squares of the sides.', type: 'mcq' },
          { id: 'mg5', text: 'What is the perimeter of a square with side length 6?', options: ['12', '18', '24', '36'], correctAnswerIndex: 2, explanation: 'Perimeter = 4 × side = 4 × 6 = 24.', targetConcept: 'Perimeter', baselineExpectedSeconds: 15, scaffoldHint: 'A square has 4 equal sides.', type: 'mcq' },
          { id: 'mg6', text: 'If a right triangle has legs 3 and 4, what is the hypotenuse?', options: ['5', '6', '7', '25'], correctAnswerIndex: 0, explanation: 'c² = 3² + 4² = 9 + 16 = 25, so c = 5.', targetConcept: 'Pythagorean Theorem', baselineExpectedSeconds: 30, scaffoldHint: 'Square the legs, add, then take the square root.', type: 'mcq' },
        ]
      }
    ]
  },
  'Computer Science': {
    'Algorithms': [
      {
        id: 'cs-alg-01', code: 'CS-101', title: 'Algorithms',
        description: 'Searching, sorting, and complexity analysis.',
        academicDiscipline: 'Computer Science', estimatedMinutes: 15,
        questions: [
          { id: 'c1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswerIndex: 1, explanation: 'Binary search halves the search space each time, giving O(log n).', targetConcept: 'Complexity', baselineExpectedSeconds: 20, scaffoldHint: 'Think about how many times you can halve an array.', type: 'mcq' },
          { id: 'c2', text: 'Which sorting algorithm is typically fastest on average?', options: ['Bubble sort', 'Selection sort', 'Quick sort', 'Insertion sort'], correctAnswerIndex: 2, explanation: 'Quick sort averages O(n log n), while the others are typically O(n²).', targetConcept: 'Sorting', baselineExpectedSeconds: 30, scaffoldHint: 'Look for the algorithm with O(n log n) average complexity.', type: 'mcq' },
          { id: 'c3', text: 'What data structure does BFS (breadth-first search) use?', options: ['Stack', 'Queue', 'Heap', 'Tree'], correctAnswerIndex: 1, explanation: 'BFS explores level by level, using a queue (FIFO).', targetConcept: 'Graph Traversal', baselineExpectedSeconds: 25, scaffoldHint: 'Which structure gives FIFO behavior?', type: 'mcq' },
          { id: 'c4', text: 'What is the time complexity of linear search?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswerIndex: 2, explanation: 'Linear search may inspect every element, so it\'s O(n).', targetConcept: 'Complexity', baselineExpectedSeconds: 20, scaffoldHint: 'Worst case you check every element.', type: 'mcq' },
          { id: 'c5', text: 'What is the worst-case complexity of Quick sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'], correctAnswerIndex: 2, explanation: 'With poor pivot choices, Quick sort degrades to O(n²).', targetConcept: 'Complexity', baselineExpectedSeconds: 30, scaffoldHint: 'Think about a sorted input with a bad pivot.', type: 'mcq' },
          { id: 'c6', text: 'Which algorithm finds the shortest path in a weighted graph?', options: ['BFS', 'DFS', 'Dijkstra', 'Kruskal'], correctAnswerIndex: 2, explanation: 'Dijkstra\'s algorithm computes shortest paths in weighted graphs.', targetConcept: 'Graph Algorithms', baselineExpectedSeconds: 30, scaffoldHint: 'It\'s named after a famous Dutch computer scientist.', type: 'mcq' },
          { id: 'c7', text: 'What is dynamic programming primarily used for?', options: ['Sorting', 'Optimizing overlapping subproblems', 'Randomization', 'Hashing'], correctAnswerIndex: 1, explanation: 'DP caches solutions to overlapping subproblems to avoid recomputation.', targetConcept: 'Dynamic Programming', baselineExpectedSeconds: 35, scaffoldHint: 'Think of memoization.', type: 'mcq' },
        ]
      }
    ],
    'Data Structures': [
      {
        id: 'cs-ds-01', code: 'CS-102', title: 'Data Structures',
        description: 'Stacks, queues, trees, heaps, and arrays.',
        academicDiscipline: 'Computer Science', estimatedMinutes: 12,
        questions: [
          { id: 'cd1', text: 'Which data structure uses FIFO (First In, First Out)?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctAnswerIndex: 1, explanation: 'A queue removes the earliest added element first.', targetConcept: 'Queues', baselineExpectedSeconds: 20, scaffoldHint: 'Think of a line at a store.', type: 'mcq' },
          { id: 'cd2', text: 'A stack uses which order?', options: ['FIFO', 'LIFO', 'Random', 'Priority'], correctAnswerIndex: 1, explanation: 'Stacks use Last In, First Out.', targetConcept: 'Stacks', baselineExpectedSeconds: 20, scaffoldHint: 'Think of a stack of plates.', type: 'mcq' },
          { id: 'cd3', text: 'What is the time complexity to access an array element by index?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswerIndex: 0, explanation: 'Array access by index is constant time.', targetConcept: 'Arrays', baselineExpectedSeconds: 25, scaffoldHint: 'Indexing is a direct pointer arithmetic.', type: 'mcq' },
          { id: 'cd4', text: 'Which data structure is best for implementing a priority queue?', options: ['Array', 'Linked list', 'Heap', 'Stack'], correctAnswerIndex: 2, explanation: 'A binary heap gives O(log n) insert and extract-min operations.', targetConcept: 'Heaps', baselineExpectedSeconds: 30, scaffoldHint: 'Think of a partially ordered tree.', type: 'mcq' },
          { id: 'cd5', text: 'In a binary search tree, what is the in-order traversal order?', options: ['Root, left, right', 'Left, root, right', 'Left, right, root', 'Right, root, left'], correctAnswerIndex: 1, explanation: 'In-order visits left subtree, then root, then right subtree.', targetConcept: 'BST Traversal', baselineExpectedSeconds: 35, scaffoldHint: 'In-order returns sorted values.', type: 'mcq' },
          { id: 'cd6', text: 'What is the maximum number of children a node in a binary tree can have?', options: ['1', '2', '3', '4'], correctAnswerIndex: 1, explanation: 'Binary means at most two children per node.', targetConcept: 'Binary Trees', baselineExpectedSeconds: 15, scaffoldHint: '"Binary" implies two.', type: 'mcq' },
        ]
      }
    ],
    'Programming Logic': [
      {
        id: 'cs-logic-01', code: 'CS-103', title: 'Programming Logic',
        description: 'Loops, conditionals, functions, and recursion.',
        academicDiscipline: 'Computer Science', estimatedMinutes: 12,
        questions: [
          { id: 'cl1', text: 'What does a "for" loop do?', options: ['Repeats code until a condition is false', 'Runs once', 'Defines a function', 'Creates a variable'], correctAnswerIndex: 0, explanation: 'A for loop iterates while its condition holds.', targetConcept: 'Loops', baselineExpectedSeconds: 20, scaffoldHint: 'It is iterative.', type: 'mcq' },
          { id: 'cl2', text: 'What is a variable?', options: ['A fixed constant', 'A named storage location', 'A function', 'A loop'], correctAnswerIndex: 1, explanation: 'Variables store values under a name.', targetConcept: 'Variables', baselineExpectedSeconds: 20, scaffoldHint: 'It has a name and a value.', type: 'mcq' },
          { id: 'cl3', text: 'What does an "if" statement do?', options: ['Loops', 'Executes code conditionally', 'Defines a class', 'Returns a value'], correctAnswerIndex: 1, explanation: 'An if statement branches based on a condition.', targetConcept: 'Conditionals', baselineExpectedSeconds: 20, scaffoldHint: 'It decides whether to run code.', type: 'mcq' },
          { id: 'cl4', text: 'What is a function?', options: ['A variable', 'A reusable block of code', 'A loop', 'A class'], correctAnswerIndex: 1, explanation: 'Functions group reusable logic with a name.', targetConcept: 'Functions', baselineExpectedSeconds: 20, scaffoldHint: 'It can be called multiple times.', type: 'mcq' },
          { id: 'cl5', text: 'What is recursion?', options: ['A function calling itself', 'A loop', 'An error', 'A variable'], correctAnswerIndex: 0, explanation: 'Recursion is when a function calls itself, usually on a smaller input.', targetConcept: 'Recursion', baselineExpectedSeconds: 25, scaffoldHint: 'Base case stops it.', type: 'mcq' },
          { id: 'cl6', text: 'What does "return" do in a function?', options: ['Starts a loop', 'Outputs a value from the function', 'Declares a variable', 'Prints to console'], correctAnswerIndex: 1, explanation: 'return exits the function and provides its result.', targetConcept: 'Functions', baselineExpectedSeconds: 20, scaffoldHint: 'It hands back a result.', type: 'mcq' },
        ]
      }
    ],
    'System Architecture': [
      {
        id: 'cs-sys-01', code: 'CS-104', title: 'System Architecture',
        description: 'Understand how the app handles cloud connectivity and data persistence.',
        academicDiscipline: 'Computer Science', estimatedMinutes: 5,
        questions: [
          { 
            id: 'sys1', 
            text: 'What happens when the CognitiveAdapt system loses connection to the Supabase cloud database?', 
            options: [
              'The app crashes and the user loses all progress.', 
              'The system switches to Local Mode, saving data to the browser and using an offline NLP generator.', 
              'The system forces a logout and permanently deletes the account.', 
              'It blocks the screen and waits indefinitely for the connection to return.'
            ], 
            correctAnswerIndex: 1, 
            explanation: 'If the cloud is unreachable, the system gracefully falls back to Local Mode. It uses localStorage for data persistence and a deterministic offline text-parser to generate questions, ensuring the student is never blocked.', 
            targetConcept: 'Cloud vs Local Fallback', 
            baselineExpectedSeconds: 20, 
            scaffoldHint: 'Think about how the app ensures you can keep studying even if your Wi-Fi drops.', 
            type: 'mcq' 
          },
          { 
            id: 'sys2', 
            text: 'In Cloud Mode, which technology is responsible for securely managing user authentication and passwords?', 
            options: [
              'Browser localStorage', 
              'Google Gemini API', 
              'Supabase Auth', 
              'A local PBKDF2 hash file'
            ], 
            correctAnswerIndex: 2, 
            explanation: 'Supabase Auth handles secure sign-ups, logins, and OTP (One-Time Password) email verification.', 
            targetConcept: 'Cloud Security', 
            baselineExpectedSeconds: 15, 
            scaffoldHint: 'It is the backend-as-a-service provider we use.', 
            type: 'mcq' 
          }
        ]
      }
    ]
  },
  'Science': {
    "Physics: Newton's Laws": [
      {
        id: 'sci-phys-01', code: 'PHYS-105', title: "Physics: Newton's Laws",
        description: 'Force, mass, acceleration, and inertia.',
        academicDiscipline: 'Science', estimatedMinutes: 12,
        questions: [
          { id: 'sp1', text: "What is the formula for Newton's Second Law?", options: ['E = mc²', 'F = ma', 'V = IR', 'a² + b² = c²'], correctAnswerIndex: 1, explanation: 'Force equals mass times acceleration.', targetConcept: "Newton's Laws", baselineExpectedSeconds: 15, scaffoldHint: 'Force is equal to mass multiplied by acceleration.', type: 'mcq' },
          { id: 'sp2', text: "Newton's First Law is also known as the law of what?", options: ['Motion', 'Inertia', 'Gravity', 'Acceleration'], correctAnswerIndex: 1, explanation: 'An object at rest stays at rest unless acted upon — the law of inertia.', targetConcept: 'Inertia', baselineExpectedSeconds: 20, scaffoldHint: 'It describes resistance to change in motion.', type: 'mcq' },
          { id: 'sp3', text: 'For every action, there is an equal and opposite what?', options: ['Force', 'Reaction', 'Acceleration', 'Mass'], correctAnswerIndex: 1, explanation: "Newton's Third Law: for every action there is an equal and opposite reaction.", targetConcept: "Newton's Third Law", baselineExpectedSeconds: 15, scaffoldHint: 'It pairs with the word "action".', type: 'mcq' },
          { id: 'sp4', text: 'What is the SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctAnswerIndex: 1, explanation: 'Force is measured in newtons (N).', targetConcept: 'Units', baselineExpectedSeconds: 20, scaffoldHint: 'Named after the same scientist.', type: 'mcq' },
          { id: 'sp5', text: 'If a 10 kg object accelerates at 2 m/s², what is the force?', options: ['5 N', '12 N', '20 N', '100 N'], correctAnswerIndex: 2, explanation: 'F = ma = 10 × 2 = 20 N.', targetConcept: 'Applying F = ma', baselineExpectedSeconds: 30, scaffoldHint: 'Multiply mass by acceleration.', type: 'mcq' },
          { id: 'sp6', text: 'What is inertia?', options: ['Resistance to change in motion', 'A force', 'An acceleration', 'A mass'], correctAnswerIndex: 0, explanation: 'Inertia is an object\'s resistance to changes in its state of motion.', targetConcept: 'Inertia', baselineExpectedSeconds: 25, scaffoldHint: 'It is about resisting change.', type: 'mcq' },
        ]
      }
    ],
    'Chemistry: Atomic Structure': [
      {
        id: 'sci-chem-01', code: 'CHEM-101', title: 'Chemistry: Atomic Structure',
        description: 'Protons, neutrons, electrons, and atomic number.',
        academicDiscipline: 'Science', estimatedMinutes: 12,
        questions: [
          { id: 'sc1', text: 'What is the charge of an electron?', options: ['Positive', 'Negative', 'Neutral', 'Variable'], correctAnswerIndex: 1, explanation: 'Electrons carry a negative charge.', targetConcept: 'Subatomic Particles', baselineExpectedSeconds: 15, scaffoldHint: 'Opposite of a proton.', type: 'mcq' },
          { id: 'sc2', text: 'What is the charge of a proton?', options: ['Positive', 'Negative', 'Neutral', 'Variable'], correctAnswerIndex: 0, explanation: 'Protons carry a positive charge.', targetConcept: 'Subatomic Particles', baselineExpectedSeconds: 15, scaffoldHint: 'Opposite of an electron.', type: 'mcq' },
          { id: 'sc3', text: 'Where are neutrons located in an atom?', options: ['In the electron cloud', 'In the nucleus', 'Outside the atom', 'In the orbitals'], correctAnswerIndex: 1, explanation: 'Neutrons and protons form the nucleus.', targetConcept: 'Atomic Structure', baselineExpectedSeconds: 20, scaffoldHint: 'They sit next to protons.', type: 'mcq' },
          { id: 'sc4', text: 'What does the atomic number represent?', options: ['Number of neutrons', 'Number of protons', 'Number of electrons', 'Total particles'], correctAnswerIndex: 1, explanation: 'The atomic number is the number of protons in the nucleus.', targetConcept: 'Atomic Number', baselineExpectedSeconds: 25, scaffoldHint: 'It uniquely identifies an element.', type: 'mcq' },
          { id: 'sc5', text: 'Which subatomic particle has no charge?', options: ['Proton', 'Electron', 'Neutron', 'Photon'], correctAnswerIndex: 2, explanation: 'Neutrons are electrically neutral.', targetConcept: 'Subatomic Particles', baselineExpectedSeconds: 15, scaffoldHint: 'Its name hints at neutral.', type: 'mcq' },
          { id: 'sc6', text: 'An atom with 11 protons and 12 neutrons has a mass number of what?', options: ['11', '12', '23', '1'], correctAnswerIndex: 2, explanation: 'Mass number = protons + neutrons = 11 + 12 = 23.', targetConcept: 'Mass Number', baselineExpectedSeconds: 25, scaffoldHint: 'Add the nucleons together.', type: 'mcq' },
        ]
      }
    ],
    'Biology: Cell Structure': [
      {
        id: 'sci-bio-01', code: 'BIO-101', title: 'Biology: Cell Structure',
        description: 'Organelles and their functions.',
        academicDiscipline: 'Science', estimatedMinutes: 12,
        questions: [
          { id: 'sb1', text: 'What is the "powerhouse" of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'], correctAnswerIndex: 1, explanation: 'Mitochondria produce ATP, the cell\'s energy currency.', targetConcept: 'Organelles', baselineExpectedSeconds: 15, scaffoldHint: 'It generates energy.', type: 'mcq' },
          { id: 'sb2', text: 'What controls the cell\'s activities?', options: ['Cell membrane', 'Nucleus', 'Cytoplasm', 'Vacuole'], correctAnswerIndex: 1, explanation: 'The nucleus contains DNA and directs cellular activity.', targetConcept: 'Nucleus', baselineExpectedSeconds: 15, scaffoldHint: 'It holds the genetic material.', type: 'mcq' },
          { id: 'sb3', text: 'What is the function of the cell membrane?', options: ['Energy production', 'Regulating what enters and exits', 'Protein synthesis', 'Storage'], correctAnswerIndex: 1, explanation: 'The membrane is selectively permeable, controlling traffic in and out.', targetConcept: 'Cell Membrane', baselineExpectedSeconds: 20, scaffoldHint: 'It is a gatekeeper.', type: 'mcq' },
          { id: 'sb4', text: 'Where does protein synthesis occur?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi'], correctAnswerIndex: 1, explanation: 'Ribosomes translate mRNA into proteins.', targetConcept: 'Ribosomes', baselineExpectedSeconds: 25, scaffoldHint: 'The site of translation.', type: 'mcq' },
          { id: 'sb5', text: 'Which structure is found in plant cells but not animal cells?', options: ['Nucleus', 'Mitochondria', 'Cell wall', 'Ribosome'], correctAnswerIndex: 2, explanation: 'Plant cells have a rigid cell wall; animal cells do not.', targetConcept: 'Plant vs Animal Cells', baselineExpectedSeconds: 20, scaffoldHint: 'It gives structural support.', type: 'mcq' },
          { id: 'sb6', text: 'What is the main function of the vacuole?', options: ['Energy production', 'Storage', 'Protein synthesis', 'Digestion'], correctAnswerIndex: 1, explanation: 'Vacuoles store water, nutrients, and waste.', targetConcept: 'Vacuoles', baselineExpectedSeconds: 20, scaffoldHint: 'It is a container.', type: 'mcq' },
        ]
      }
    ]
  }
} as Record<string, Record<string, LearningModule[]>>;

const generateLocalMaterial = (text: string, tool: string, config: any = {}) => {
  if (!text || text.trim().length < 50) {
    throw new Error("Not enough text provided. Please paste at least a paragraph.");
  }

  const cleanText = text.replace(/(\s+\d+\.?\s*$)/gm, '').replace(/^(TOPIC|CHAPTER|SECTION|UNIT|PART)\s*\d+.*$/gim, ''); 
  
  let sentences = cleanText.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
  
  sentences = sentences.map(s => s.trim()).filter(s => {
    return s.length > 15 && s.split(' ').length > 3; 
  });

  if (sentences.length === 0) {
    sentences = cleanText.split('\n').map(s => s.trim()).filter(s => s.length > 10);
  }

  if (sentences.length === 0) {
    throw new Error("Could not extract readable sentences from the text. Try a different file or paste text manually.");
  }

  sentences = sentences.sort(() => Math.random() - 0.5);

  if (tool === 'Flashcard') {
    const cards = sentences.slice(0, Math.min(10, sentences.length)).map(s => {
      const words = s.split(' ').map(w => w.replace(/[^a-zA-Z0-9]/g, ''));
      const keyword = [...words].sort((a, b) => b.length - a.length).find(w => w.length > 5) || 'concept';
      return { front: `What can you recall about "${keyword}"?`, back: s };
    });
    return { flashcards: cards };
  } 

  const numQuestions = Math.min(config.questions || 5, sentences.length);
  const difficulty = config.difficulty || 'introductory';
  const questions = [];

  for (let i = 0; i < numQuestions; i++) {
    const s = sentences[i];
    const words = s.split(' ').filter(w => w.length > 4);
    if (words.length === 0) continue;
    
    const longWord = [...words].sort((a, b) => b.length - a.length)[0];
    const cleanWord = longWord.replace(/[^a-zA-Z0-9]/g, '');
    
    if (difficulty === 'introductory' || difficulty === 'intermediate') {
      const blanked = s.replace(cleanWord, '______');
      const distractors = ["analysis", "structure", "process", "system", "concept", "element"].filter(w => w.toLowerCase() !== cleanWord.toLowerCase()).slice(0, 3);
      const options = [cleanWord, ...distractors].sort(() => Math.random() - 0.5);
      
      questions.push({ 
        type: "mcq", 
        text: `Fill in the blank: "${blanked}"`, 
        options, 
        correctAnswerIndex: options.indexOf(cleanWord), 
        explanation: `The correct answer is "${cleanWord}". Original text: "${s}"`, 
        scaffoldHint: "Look at the surrounding words for grammatical and contextual clues." 
      });
    } else {
      questions.push({ 
        type: "mcq", 
        text: `Which of the following best summarizes the following statement: "${s.substring(0, 100)}..."`, 
        options: [
          "It describes a key theoretical concept.", 
          "It provides a historical context.", 
          "It outlines a practical procedure.", 
          "It highlights a potential limitation."
        ], 
        correctAnswerIndex: 0, 
        explanation: `The statement focuses on a core concept. Full text: "${s}"`, 
        scaffoldHint: "Consider the primary focus of the sentence." 
      });
    }
  }
  
  if (questions.length === 0) {
     throw new Error("Could not generate questions from the provided text.");
  }
  
  return { questions };
};

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

const isCurriculumModule = (mod: LearningModule): boolean => {
  for (const subject of Object.values(curriculumBase)) {
    for (const subtopic of Object.values(subject)) {
      if (subtopic.some(m => m.id === mod.id)) return true;
    }
  }
  return false;
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onUpdateUser }) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('app_theme') as ThemeMode) || 'dark');
  const isDark = theme === 'dark';

  const [isManualOverride, setIsManualOverride] = useState(false);
  const [manualDifficulty, setManualDifficulty] = useState<Difficulty>('introductory');

  const [hasCalibrated, setHasCalibrated] = useState<boolean>(() => localStorage.getItem(`cognitive_calibrated_${user.id}`) === 'true');
  const [lastCalibration, setLastCalibration] = useState<Difficulty | null>(null);
  const [calibrationScore, setCalibrationScore] = useState<number | null>(() => {
    const saved = localStorage.getItem(`calibration_score_${user.id}`);
    return saved ? Number(saved) : null;
  });

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Profile State (Validation)
  const [profileName, setProfileName] = useState(user.name || '');
  const [profilePhone, setProfilePhone] = useState((user as any).phone || localStorage.getItem(`profile_phone_${user.id}`) || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

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
  const [showFlashcardViewer, setShowFlashcardViewer] = useState(false);
  const [showTour, setShowTour] = useState(false);

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

  const [libraryFilter, setLibraryFilter] = useState<'All' | 'Flashcard sets' | 'Practice tests'>('All');
  const [viewingPastSession, setViewingPastSession] = useState<{module: LearningModule, session: LearningSession} | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    refreshUserSessions();
    const saved = localStorage.getItem(`custom_study_modules_${user.id}`);
    if (saved) { try { setCustomModules(JSON.parse(saved)); } catch (e) { console.error(e); } }
    const savedCards = localStorage.getItem(`custom_flashcards_${user.id}`);
    if (savedCards) { try { setCustomFlashcards(JSON.parse(savedCards)); } catch (e) { console.error(e); } }
    
    if (!localStorage.getItem(`tour_seen_${user.id}`)) {
      setShowTour(true);
    }
  }, [user.id]);

  useEffect(() => { localStorage.setItem('app_theme', theme); }, [theme]);

  const refreshUserSessions = () => { setSessions(getUserSessions(user.id)); };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    
    if (profileName.trim().length < 2) {
      setProfileError('Name must be at least 2 characters long.');
      return;
    }
    
    const saPhoneRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
    const cleanPhone = profilePhone.replace(/\s/g, ''); 

    if (cleanPhone && !saPhoneRegex.test(cleanPhone)) {
      setProfileError('Please enter a valid South African phone number (e.g., +27 82 123 4567).');
      return;
    }

    localStorage.setItem(`profile_phone_${user.id}`, profilePhone);
    
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('profiles').update({ full_name: profileName }).eq('id', user.id);
    }
    
    onUpdateUser({ ...user, name: profileName });
    
    setProfileSuccess('Profile details saved successfully!');
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  const handleDeleteAccount = () => {
    if (window.confirm("WARNING: Are you sure you want to delete your account? All your tests, flashcards, and progress will be permanently erased.")) {
      localStorage.removeItem(`custom_study_modules_${user.id}`);
      localStorage.removeItem(`custom_flashcards_${user.id}`);
      localStorage.removeItem(`cognitive_calibrated_${user.id}`);
      localStorage.removeItem(`calibration_score_${user.id}`);
      localStorage.removeItem(`profile_phone_${user.id}`);
      localStorage.removeItem(`tour_seen_${user.id}`);
      localStorage.removeItem(`app_theme`);
      window.location.reload();
    }
  };

  const downloadBackup = () => {
    const data = {
      sessions,
      customModules,
      customFlashcards,
      profile: { name: user.name, phone: profilePhone }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${user.name.replace(/\s+/g, '_')}_Backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calibrateFromSession = (session: LearningSession) => {
    const total = session.responses.length;
    if (total === 0) return;
    const correct = session.responses.filter(r => r.isCorrect).length;
    const scorePct = (correct / total) * 100;
    
    let newDiff: Difficulty = 'introductory';
    if (scorePct >= 67) newDiff = 'advanced';
    else if (scorePct >= 34) newDiff = 'intermediate';

    setLastCalibration(newDiff);
    setCalibrationScore(scorePct);
    setHasCalibrated(true);
    
    localStorage.setItem(`cognitive_calibrated_${user.id}`, 'true');
    localStorage.setItem(`calibration_score_${user.id}`, scorePct.toString());
  };

  const dismissCalibrationPrompt = () => {
    setHasCalibrated(true);
    localStorage.setItem(`cognitive_calibrated_${user.id}`, 'true');
  };

  const resetCalibration = () => {
    setHasCalibrated(false);
    setLastCalibration(null);
    setCalibrationScore(null);
    localStorage.removeItem(`cognitive_calibrated_${user.id}`);
    localStorage.removeItem(`calibration_score_${user.id}`);
  };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const allResponses = completedSessions.flatMap(s => s.responses);
  const overallAccuracy = allResponses.length > 0 ? Math.round((allResponses.filter(r => r.isCorrect).length / allResponses.length) * 100) : 0;
  const avgLatencySec = allResponses.length > 0 ? parseFloat((allResponses.reduce((acc, r) => acc + r.responseTimeMs, 0) / allResponses.length / 1000).toFixed(1)) : 0;
  const avgCli = allResponses.length > 0 ? Math.round(allResponses.reduce((acc, r) => acc + r.cognitiveLoadScore, 0) / allResponses.length) : 0;

  const speedScore = Math.max(0, Math.min(100, ((40 - avgLatencySec) / 20) * 100));
  
  // FIX: Mastery Track calculation
  let calculatedMastery = 0;
  if (allResponses.length > 0) {
    calculatedMastery = Math.min(100, Math.round((overallAccuracy * 0.5) + (speedScore * 0.25) + ((100 - avgCli) * 0.25)));
    
    if (calibrationScore !== null) {
      if (completedSessions.length <= 2) {
        calculatedMastery = Math.round(calibrationScore);
      } else {
        calculatedMastery = Math.round((calibrationScore * 0.4) + (calculatedMastery * 0.6));
      }
    }
  }
  
  const masteryPercentage = calculatedMastery;

  const derivedDifficulty: Difficulty = masteryPercentage >= 67 ? 'advanced' : masteryPercentage >= 34 ? 'intermediate' : 'introductory';
  const currentDifficulty: Difficulty = isManualOverride ? manualDifficulty : derivedDifficulty;

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
    if (activeSession && !submittedFeedback && !showIntervention && activeModule?.questions?.[currentQuestionIdx]) {
      const baseline = activeModule.questions[currentQuestionIdx].baselineExpectedSeconds || 30;
      if (elapsedSeconds > baseline * 2) {
        setShowIntervention(true);
      }
    }
  }, [elapsedSeconds, activeSession, submittedFeedback, showIntervention, activeModule, currentQuestionIdx]);

  const cleanExtractedText = (raw: string) => {
    return raw.split('\n').filter(line => {
        const t = line.trim();
        if (t.length < 15) return false;
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
      setAiError(`Failed to read the file. Please ensure it is not corrupted.`);
    } finally { setIsGenerating(false); }
  };

  const generateMaterial = async (text: string, tool: string, config = examConfig, isEasier = false) => {
    setIsGenerating(true);
    setAiError(null);
    setShowExamSetup(false);
    let parsedData = null;

    const safeConfig = {
        questions: Math.max(1, Math.min(20, Number(config.questions) || 10)),
        timer: Math.max(1, Number(config.timer) || 30),
        difficulty: isEasier ? 'introductory' : currentDifficulty
    };

    try {
      const sb = getSupabaseClient();
      if (!sb) throw new Error("Supabase is not configured.");

      console.log("Starting AI generation...");

      const invokePromise = sb.functions.invoke('generate-quiz', {
        body: { studyText: text.slice(0, 5000), outputFormat: 'quiz', activeTool: tool, difficulty: safeConfig.difficulty, config: safeConfig },
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timed out.")), 20000); // 20 SEC TIMEOUT
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      if (error) throw new Error(`Connection Error: Could not reach AI service.`);
      if (data?.error) throw new Error(`AI Error: ${data.error}`);
      parsedData = typeof data === 'string' ? JSON.parse(data.replace(/```json/g, '').replace(/```/g, '').trim()) : data;
      console.log("AI generation successful.");

    } catch (error: any) {
      console.warn("Supabase AI failed or timed out. Using local fallback.", error);
      try {
        parsedData = generateLocalMaterial(text, tool, safeConfig);
      } catch (localError: any) {
        setAiError(localError.message || "Local generation failed.");
        setIsGenerating(false);
        return;
      }
    }

    try {
      if (tool === 'Flashcard' && parsedData?.flashcards) {
        const newCards = parsedData.flashcards.map((fc: any) => ({ front: `[Flashcard] ${fc.front}`, back: fc.back }));
        const updated = [...customFlashcards, ...newCards];
        setCustomFlashcards(updated); localStorage.setItem(`custom_flashcards_${user.id}`, JSON.stringify(updated));
        
        const startIndex = customFlashcards.length;
        setCurrentCardIdx(startIndex); 
        setIsFlipped(false);
        setShowFlashcardViewer(true);

      } else if (parsedData?.questions && parsedData.questions.length > 0) {
        const questions: Question[] = parsedData.questions.map((q: any, index: number) => ({
          id: `q-${Date.now()}-${index}`, text: q.text || "Missing", options: q.options || [], correctAnswerIndex: q.correctAnswerIndex ?? -1,
          explanation: q.explanation || 'No explanation.', targetConcept: `${tool} Concept`,
          baselineExpectedSeconds: 60, scaffoldHint: q.scaffoldHint || 'Think about the core concepts.', type: q.type || 'mcq'
        } as any));

        const newModule: LearningModule = {
          id: `module-${Date.now()}`, code: isEasier ? 'RETEST-EASY' : tool.toUpperCase().replace(' ', '-'),
          title: materialTitle || `${tool}: Generated Material`, description: `Generated module.`, academicDiscipline: 'General',
          estimatedMinutes: Math.ceil(questions.length * 1.5), questions: questions, sourceText: text, createdAt: new Date().toISOString()
        } as any;

        const updated = [...customModules, newModule];
        setCustomModules(updated); localStorage.setItem(`custom_study_modules_${user.id}`, JSON.stringify(updated));
        if (tool === 'Practice Test' || isEasier) handleStartModule(newModule, safeConfig.timer);
      } else { throw new Error("AI did not return valid questions."); }
      setStudyMaterialText(''); setMaterialTitle(''); setStudyLabView('hub');
    } catch (err: any) { setAiError(err.message || "Generation failed."); } finally { setIsGenerating(false); }
  };

  const handleGenerateFromText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyMaterialText || studyMaterialText.length < 50) { setAiError("Provide at least 50 characters."); return; }
    if (activeTool === 'Practice Test') { setShowExamSetup(true); return; }
    generateMaterial(studyMaterialText, activeTool);
  };

  const handleStartModule = (mod: LearningModule, timerMins: number = 0) => {
    if (!mod.questions || mod.questions.length === 0) { alert("No questions available for this module."); return; }
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
    setLastCalibration(null);
    setTimeRemaining(timerMins > 0 ? timerMins * 60 : null);
    saveSession(newSession);
  };

  const handleResumeSession = (mod: LearningModule, session: LearningSession) => {
    setActiveModule(mod);
    setActiveSession(session);
    setCurrentQuestionIdx(session.responses.length);
    setSelectedOption(null);
    setEssayInput('');
    setHesitationCount(0);
    setAttemptsCount(1);
    setShowScaffoldHint(false);
    setSubmittedFeedback(null);
    setSessionFinished(false);
    setQuestionStartTime(Date.now());
    setElapsedSeconds(0);
    setConfidence(null);
    setLastCalibration(null);
    setTimeRemaining(null);
    setViewingPastSession(null);
  };

  const handleDeleteModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      const updatedModules = customModules.filter(m => m.id !== moduleId);
      setCustomModules(updatedModules);
      localStorage.setItem(`custom_study_modules_${user.id}`, JSON.stringify(updatedModules));
      
      const updatedSessions = sessions.filter(s => s.moduleId !== moduleId);
      setSessions(updatedSessions);
    }
  };

  const handleDeleteFlashcards = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete your entire flashcard deck? This action cannot be undone.")) {
      setCustomFlashcards([]);
      localStorage.removeItem(`custom_flashcards_${user.id}`);
    }
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

  const currentQuestion: Question & { type?: string } | undefined = activeModule?.questions?.[currentQuestionIdx] as any;

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

      if (isCurriculumModule(activeModule) && finalizedSession.responses.length > 0) {
        calibrateFromSession(finalizedSession);
      }

      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  };

  const downloadReport = (module: LearningModule, session: LearningSession) => {
    let csv = `Question,Selected Answer,Correct Answer,Is Correct,Response Time (s),Cognitive Load\n`;
    
    session.responses.forEach((res, i) => {
      const q = module.questions[i];
      if (!q) return;
      
      const selectedAns = q.options[res.selectedOptionIndex] || 'N/A';
      const correctAns = q.options[q.correctAnswerIndex] || 'N/A';
      
      const cleanText = (str: string) => `"${str.replace(/"/g, '""')}"`;
      
      csv += `${cleanText(q.text)},${cleanText(selectedAns)},${cleanText(correctAns)},${res.isCorrect ? 'Yes' : 'No'},${(res.responseTimeMs / 1000).toFixed(1)},${res.cognitiveLoadScore}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${module.title.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // --- VIEWING PAST SESSION (LIBRARY) ---
  if (viewingPastSession) {
    const { module, session } = viewingPastSession;
    const scorePct = Math.round((session.responses.filter(r => r.isCorrect).length / session.responses.length) * 100);

    return (
      <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <button onClick={() => setViewingPastSession(null)} className={`flex items-center gap-1 text-sm font-semibold mb-2 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </button>

          <div className={`rounded-2xl border p-8 shadow-sm space-y-6 ${bgCard}`}>
            <div className={`flex items-center gap-3 border-b pb-6 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}><Brain className="w-6 h-6" /></div>
              <div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Session Report</span>
                <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>{module.title}</h2>
                <p className={`text-xs ${textMuted}`}>{new Date(session.completedAt || Date.now()).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Score</span><span className={`text-3xl font-extrabold mt-1 block ${scorePct >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{scorePct}%</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Results</span><span className={`text-3xl font-extrabold mt-1 block ${textTitle}`}>{session.responses.filter(r => r.isCorrect).length}/{session.responses.length}</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Mean Latency</span><span className={`text-3xl font-extrabold mt-1 block ${textTitle}`}>{((session.finalMetrics?.averageResponseTimeMs || 0) / 1000).toFixed(1)}s</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Cog. Load</span><span className="text-3xl font-extrabold text-blue-500 mt-1 block">{(session.finalMetrics?.cognitiveLoadIndex || 0).toFixed(2)}</span></div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => downloadReport(module, session)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer">
                <FileDown className="w-4 h-4" /> Download CSV Report
              </button>
              <button type="button" onClick={() => {
                const sourceText = (module as any).sourceText;
                if (!sourceText) {
                  alert("Source text is missing for this module. Cannot generate a new test.");
                  return;
                }
                setViewingPastSession(null);
                setTimeout(() => {
                  generateMaterial(sourceText, 'Practice Test', examConfig, false);
                }, 100);
              }} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-4 h-4" /> Generate New Test
              </button>
            </div>

            <div className="mt-8 space-y-6">
              <h3 className={`text-lg font-bold border-b pb-2 ${textTitle} ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>Review Answers</h3>
              {session.responses.map((res, i) => {
                const q = module.questions[i];
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
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING SCREEN OVERLAY ---
  if (isGenerating && !activeSession) {
    const isFlashcardGen = activeTool === 'Flashcard';
    return (
      <div className={`min-h-screen ${bgMain} flex flex-col items-center justify-center space-y-6`}>
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          {isFlashcardGen ? (
            <Layers className="w-10 h-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          ) : (
            <Brain className="w-10 h-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          )}
        </div>
        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>
            {isFlashcardGen ? "Crafting your flashcards..." : "Generating your test..."}
          </h2>
          <p className={`text-sm ${textMuted}`}>
            {isFlashcardGen ? "Extracting key concepts and building your study deck." : "Analyzing text and crafting questions based on your mastery level."}
          </p>
        </div>
      </div>
    );
  }

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
                {isCurriculumModule(activeModule) && (
                  <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 text-[10px] font-bold border border-indigo-800">CALIBRATION</span>
                )}
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
              
              {/* HINT BUTTON AND DISPLAY */}
              {currentQuestion.scaffoldHint && (
                <div className="mt-2 mb-4">
                  {!showScaffoldHint ? (
                    <button
                      type="button"
                      onClick={() => setShowScaffoldHint(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-amber-500/20"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Need a hint?
                    </button>
                  ) : (
                    <div className={`p-3 rounded-xl border flex items-start gap-2 animate-in fade-in duration-200 ${isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
                      <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      <p className={`text-xs font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        <strong className="font-bold">Hint:</strong> {currentQuestion.scaffoldHint}
                      </p>
                    </div>
                  )}
                </div>
              )}

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

            {lastCalibration && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border-indigo-700' : 'bg-indigo-50 border-indigo-200'}`}>
                <Target className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>Difficulty recalibrated</p>
                  <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Your assessed level is now <strong className="uppercase">{lastCalibration}</strong>. Future curriculum tests will reflect this level automatically.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Score</span><span className={`text-3xl font-extrabold mt-1 block ${scorePct >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{scorePct}%</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Results</span><span className={`text-3xl font-extrabold mt-1 block ${textTitle}`}>{activeSession.responses.filter(r => r.isCorrect).length}/{activeSession.responses.length}</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Mean Latency</span><span className={`text-3xl font-extrabold mt-1 block ${textTitle}`}>{((activeSession.finalMetrics?.averageResponseTimeMs || 0) / 1000).toFixed(1)}s</span></div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}><span className={`text-[11px] uppercase font-bold block ${textMuted}`}>Cog. Load</span><span className="text-3xl font-extrabold text-blue-500 mt-1 block">{(activeSession.finalMetrics?.cognitiveLoadIndex || 0).toFixed(2)}</span></div>
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

            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <button onClick={() => { setActiveSession(null); setActiveModule(null); setSessionFinished(false); refreshUserSessions(); }} className={`w-full sm:w-auto px-6 py-2.5 font-bold text-sm rounded-xl shadow-xs cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}>Return to Dashboard</button>

              <div className="flex gap-3 w-full sm:w-auto">
                {needsRetake && (
                  <button onClick={() => {
                    const sourceText = (activeModule as any).sourceText;
                    if (sourceText) {
                      setActiveSession(null); setActiveModule(null); setSessionFinished(false);
                      generateMaterial(sourceText, 'Practice Test', examConfig, true);
                    } else {
                      alert("Source text not found for retake.");
                    }
                  }} className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer animate-pulse">
                    <Sparkles className="w-4 h-4" /> Easier Test
                  </button>
                )}

                <button onClick={() => {
                  const sourceText = (activeModule as any).sourceText;
                  if (sourceText) {
                    setActiveSession(null); setActiveModule(null); setSessionFinished(false);
                    generateMaterial(sourceText, 'Practice Test', examConfig, false);
                  } else {
                    alert("Source text not found for new test.");
                  }
                }} className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                  <RefreshCw className="w-4 h-4" /> Generate New Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN TABBED DASHBOARD VIEW ----
  return (
    <div className={`min-h-screen ${bgMain} ${fontClass} ${contrastClass}`}>

      {showTour && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-lg w-full rounded-3xl p-8 shadow-2xl ${bgCard} animate-in zoom-in-95 duration-200`}>
            <h2 className={`text-2xl font-extrabold mb-2 flex items-center gap-2 ${textTitle}`}><Sparkles className="text-amber-500 w-6 h-6" /> Welcome to CognitiveAdapt</h2>
            <p className={`text-sm mb-6 ${textMuted}`}>Here is a quick tour of how to use the system.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0"><Target className="w-4 h-4" /></div>
                <div><h4 className={`text-sm font-bold ${textTitle}`}>1. Take a Curriculum Test</h4><p className={`text-xs ${textMuted}`}>Start with any subject to calibrate your baseline difficulty.</p></div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0"><Brain className="w-4 h-4" /></div>
                <div><h4 className={`text-sm font-bold ${textTitle}`}>2. Mastery Track</h4><p className={`text-xs ${textMuted}`}>The dog walks as you master speed, accuracy, and cognitive load. Your difficulty scales automatically.</p></div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>
                <div><h4 className={`text-sm font-bold ${textTitle}`}>3. Generate Custom Tools</h4><p className={`text-xs ${textMuted}`}>Upload any PDF or pasted notes to generate custom flashcards or practice tests.</p></div>
              </div>
            </div>

            <button onClick={() => { setShowTour(false); localStorage.setItem(`tour_seen_${user.id}`, 'true'); }} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center">
              Got it, let's start!
            </button>
          </div>
        </div>
      )}

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

      {showFlashcardViewer && customFlashcards.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl flex justify-between items-center mb-6">
            <h2 className="text-white text-xl font-bold flex items-center gap-2"><Layers className="text-blue-500" /> Flashcard Review</h2>
            <button onClick={() => setShowFlashcardViewer(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <div className="w-full max-w-2xl space-y-8">
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full min-h-[300px] cursor-pointer rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-2xl ${isFlipped ? 'bg-indigo-600 text-white' : 'bg-[#1e1e24] border border-[#2e2e38] text-white hover:bg-[#25252d]'}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4">
                {isFlipped ? 'Answer' : 'Question'}
              </span>
              <p className="text-xl sm:text-2xl font-bold leading-relaxed">
                {isFlipped ? customFlashcards[currentCardIdx]?.back : customFlashcards[currentCardIdx]?.front}
              </p>
              <p className="text-xs opacity-50 mt-8 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Click to flip</p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setCurrentCardIdx(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
                disabled={currentCardIdx === 0}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-slate-400 font-mono font-bold">
                {currentCardIdx + 1} / {customFlashcards.length}
              </span>
              <button
                onClick={() => { setCurrentCardIdx(prev => Math.min(customFlashcards.length - 1, prev + 1)); setIsFlipped(false); }}
                disabled={currentCardIdx === customFlashcards.length - 1}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
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
                <ProfileHero name={user.name} level={level} streak={streak} unlocked={badges.filter(b => b.unlocked).length} totalBadges={badges.length} />
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
                      <span className={masteryPercentage >= 34 ? 'text-blue-500' : textMuted}>Intermediate</span>
                      <span className={masteryPercentage >= 67 ? 'text-blue-500' : textMuted}>Advanced</span>
                      <span className={masteryPercentage >= 100 ? 'text-emerald-500' : textMuted}>Mastered</span>
                    </div>
                  </div>
                  {hasCalibrated && (
                    <div className={`mt-4 pt-4 border-t flex items-center gap-2 text-xs ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                      <span className={textMuted}>Current calibrated level:</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider">{currentDifficulty}</span>
                    </div>
                  )}
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
                  <p className={`text-sm mt-1 ${textMuted}`}>Choose a subject to explore available modules. Completing any curriculum test <strong className="text-indigo-500">automatically calibrates your difficulty</strong> — this is optional, and you can always override it in Settings.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(curriculumBase).map(subject => (
                    <button key={subject} onClick={() => setSelectedSubject(subject)} className={`rounded-2xl border p-6 shadow-sm hover:border-blue-500/50 transition-all text-left flex flex-col h-48 justify-between group relative ${bgCard}`}>
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
                  <p className={`text-sm mt-1 ${textMuted}`}>Select a subtopic to begin. Questions will be tailored to your <strong className="uppercase text-blue-500">{currentDifficulty}</strong> level.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(curriculumBase[selectedSubject]).map(([subtopic, mods]) => (
                    mods.map(mod => (
                      <div key={mod.id} className={`rounded-2xl border p-6 shadow-sm hover:border-blue-500/50 transition-all flex flex-col justify-between ${bgCard}`}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>{mod.code}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>{mod.questions.length} Qs</span>
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
            <div>
              <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Your Library</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Flashcard sets', 'Practice tests'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setLibraryFilter(filter as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${libraryFilter === filter ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-transparent border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {(() => {
                const allItems = [
                  ...(libraryFilter === 'All' || libraryFilter === 'Practice tests' ? customModules.map(m => ({ type: 'test', item: m, date: new Date((m as any).createdAt || Date.now()) })) : []),
                  ...(libraryFilter === 'All' || libraryFilter === 'Flashcard sets' ? (customFlashcards.length > 0 ? [{ type: 'flashcard', item: { title: 'Flashcard Deck' }, date: new Date() }] : []) : [])
                ].sort((a, b) => b.date.getTime() - a.date.getTime());

                if (allItems.length === 0) {
                   return (
                    <div className={`p-12 text-center rounded-2xl border border-dashed ${isDark ? 'bg-[#1a1a20] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                      <BookOpenCheck className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
                      <p className={`font-bold ${textTitle}`}>Your library is empty</p>
                      <p className={`text-xs mt-1 ${textMuted}`}>Generate study material from the Dashboard to see it here.</p>
                    </div>
                  );
                }

                const groups: Record<string, typeof allItems> = {};
                const now = Date.now();
                allItems.forEach(item => {
                  const diffHours = (now - item.date.getTime()) / (1000 * 60 * 60);
                  let label = "Older";
                  if (diffHours < 1) label = "Just now";
                  else if (diffHours < 24) label = "An hour ago";
                  else if (diffHours < 24 * 7) label = "This week";

                  if (!groups[label]) groups[label] = [];
                  groups[label].push(item);
                });

                return Object.entries(groups).map(([label, items]) => (
                  <div key={label} className="space-y-3">
                    <h3 className={`text-sm font-bold ${textMuted}`}>{label}</h3>
                    {items.map((item, idx) => {
                      if (item.type === 'test') {
                        const mod = item.item as LearningModule;
                        const inProgressSession = sessions.find(s => s.moduleId === mod.id && s.status === 'in_progress');
                        const pastSession = completedSessions.find(s => s.moduleId === mod.id);
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (inProgressSession) {
                                handleResumeSession(mod, inProgressSession);
                              } else if (pastSession) {
                                setViewingPastSession({ module: mod, session: pastSession });
                              } else {
                                handleStartModule(mod);
                              }
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${bgCard} ${inProgressSession ? 'border-amber-500/50 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'hover:border-blue-500/50'}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <ListChecks className={`w-4 h-4 ${inProgressSession ? 'text-amber-500' : 'text-blue-500'}`} />
                                <h4 className={`font-bold ${textTitle}`}>{mod.title}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {inProgressSession && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full animate-pulse">
                                    <Play className="w-3 h-3" /> Resume
                                  </span>
                                )}
                                <button
                                  onClick={(e) => handleDeleteModule(mod.id, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete test"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className={`text-xs ${textMuted}`}>
                              Created from uploaded file {(mod as any).sourceText ? 'Notes' : 'Text'}
                            </p>
                            {pastSession && !inProgressSession && (
                              <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                  Score: {Math.round((pastSession.responses.filter(r => r.isCorrect).length / pastSession.responses.length) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={idx}
                            onClick={() => { setActiveTab('dashboard'); setIsFlipped(false); setCurrentCardIdx(0); setShowFlashcardViewer(true); }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${bgCard} hover:border-blue-500/50`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                <h4 className={`font-bold ${textTitle}`}>Flashcard Deck</h4>
                              </div>
                              <button
                                onClick={(e) => handleDeleteFlashcards(e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete all flashcards"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className={`text-xs ${textMuted}`}>
                              {customFlashcards.length} cards total
                            </p>
                          </div>
                        );
                      }
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`rounded-2xl border p-6 shadow-sm space-y-8 animate-in fade-in duration-300 max-w-3xl ${bgCard}`}>
            
            {/* Profile / Details Section */}
            <div>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}><UserIcon className="w-5 h-5 text-blue-500" /> Profile Details</h3>
              <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
                {profileError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold rounded-xl">{profileError}</div>}
                {profileSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold rounded-xl">{profileSuccess}</div>}
                
                <div className={`flex flex-col sm:flex-row gap-4`}>
                  <div className="flex-1">
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Full Name (Min 2 chars)</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-slate-600 text-white' : 'bg-white border-slate-300'}`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className={`block text-xs font-bold mb-1 ${textMuted}`}>Phone Number (South Africa)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+27 82 123 4567" className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-[#121212] border-slate-600 text-white' : 'bg-white border-slate-300'}`} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer">
                  Save
                </button>
              </form>
            </div>

            <div className={`pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
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
              <p className={`text-xs mt-3 ${textMuted}`}>When off, difficulty scales dynamically based on your Mastery Track.</p>
            </div>

            <div className={`pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${textTitle}`}><Target className="w-5 h-5 text-indigo-500" /> Dynamic Skill Tracking</h3>
              <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-[#121212] border-[#2e2e38]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold ${textTitle}`}>Current Test Difficulty</p>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>{hasCalibrated ? 'Based on your evolving Mastery Track score.' : 'Take a curriculum test to calibrate your starting point.'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">{currentDifficulty}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button onClick={() => { setActiveTab('curriculum'); setSelectedSubject(null); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Take Assessment
                </button>
                <button onClick={resetCalibration} className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
                  <Trash2 className="w-3.5 h-3.5" /> Reset Calibration
                </button>
              </div>
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

            <div className={`pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 text-rose-500`}><ShieldAlert className="w-5 h-5" /> Data & Account</h3>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button onClick={downloadBackup} className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
                  <Download className="w-3.5 h-3.5" /> Download Data Backup
                </button>
                <button onClick={handleDeleteAccount} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account
                </button>
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