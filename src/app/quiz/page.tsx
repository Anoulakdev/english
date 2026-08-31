'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import QuizCard from '@/components/QuizCard';
import wordsData, { Word, CATEGORY_RANGES, CATEGORIES_LIST } from '@/data/words';
import {
  QuizAttempt,
  QuizGameState,
  QuizSetup,
  QuizHistory,
  QuizResults,
} from '@/components/quiz';

function shuffleArray<T>(arr: T[]): T[] {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function Quiz() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<QuizGameState>('setup');

  // Quiz parameters
  const [quizSize, setQuizSize] = useState<number>(10);
  const [quizCategory, setQuizCategory] = useState<string>('All');

  // Game session state
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[][]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);

  // Persistent localStorage history
  const [quizHistory, setQuizHistory] = useLocalStorage<QuizAttempt[]>('quiz-history', []);

  // Prevent SSR hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Categories list static (0ms execution)
  const categoriesList = CATEGORIES_LIST;

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-muted">ກຳລັງໂຫຼດ...</p>
      </div>
    );
  }

  // Helper to generate options (1 correct, 3 random unique distractors sampled directly in O(1))
  const generateOptionsForWord = (targetWord: Word, pool: Word[]): string[] => {
    const correctMeaning = targetWord.meaning;
    const distractors: string[] = [];
    const poolLen = pool.length;
    let attempts = 0;

    while (distractors.length < 3 && attempts < 60) {
      attempts++;
      const randIdx = Math.floor(Math.random() * poolLen);
      const candidateMeaning = pool[randIdx]?.meaning;
      if (
        candidateMeaning &&
        candidateMeaning !== correctMeaning &&
        !distractors.includes(candidateMeaning)
      ) {
        distractors.push(candidateMeaning);
      }
    }

    // Fallback to global dataset if category has few items
    if (distractors.length < 3) {
      const totalWords = wordsData.length;
      while (distractors.length < 3 && attempts < 100) {
        attempts++;
        const randIdx = Math.floor(Math.random() * totalWords);
        const candidateMeaning = wordsData[randIdx]?.meaning;
        if (
          candidateMeaning &&
          candidateMeaning !== correctMeaning &&
          !distractors.includes(candidateMeaning)
        ) {
          distractors.push(candidateMeaning);
        }
      }
    }

    return shuffleArray([correctMeaning, ...distractors]);
  };

  const handleStartQuiz = () => {
    // 1. Filter words by category in O(1) time using precomputed slice ranges
    let pool: Word[];
    if (quizCategory !== 'All' && CATEGORY_RANGES[quizCategory]) {
      const [start, end] = CATEGORY_RANGES[quizCategory];
      pool = wordsData.slice(start, end);
    } else {
      pool = wordsData;
    }

    if (pool.length < 4) {
      alert('ມີຄຳສັບໃນໝວດໝູ່ນີ້ໜ້ອຍເກີນໄປທີ່ຈະເຮັດ Quiz (ຕ້ອງການຢ່າງໜ້ອຍ 4 ຄຳສັບ)');
      return;
    }

    // 2. Select random N words from pool in O(K) time
    const poolLen = pool.length;
    const selectedCount = Math.min(quizSize, poolLen);
    const selectedIndices = new Set<number>();
    const selectedWords: Word[] = [];

    while (selectedIndices.size < selectedCount) {
      const randIdx = Math.floor(Math.random() * poolLen);
      if (!selectedIndices.has(randIdx)) {
        selectedIndices.add(randIdx);
        selectedWords.push(pool[randIdx]);
      }
    }

    // 3. Generate options lists for each selected word
    const generatedOptions = selectedWords.map((word) =>
      generateOptionsForWord(word, pool)
    );

    // 4. Update state & change game view
    setSessionWords(selectedWords);
    setSessionOptions(generatedOptions);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectWords([]);
    setGameState('playing');
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectWords((prev) => [...prev, sessionWords[currentIndex]]);
    }

    // Move to next question or end game
    if (currentIndex + 1 < sessionWords.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Save attempt to local storage history
      const newAttempt: QuizAttempt = {
        date: new Date().toLocaleString('lo-LA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        score: isCorrect ? correctCount + 1 : correctCount,
        total: sessionWords.length,
        category: quizCategory,
      };

      setQuizHistory((prev) => [newAttempt, ...prev]);
      setGameState('results');
    }
  };

  const handleClearHistory = () => {
    if (confirm('ທ່ານຕ້ອງການລຶບປະຫວັດການສອບຖາມທັງໝົດແທ້ບໍ່?')) {
      setQuizHistory([]);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* 1. SETUP STATE */}
      {gameState === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <QuizSetup
            categories={categoriesList}
            selectedCategory={quizCategory}
            onCategoryChange={setQuizCategory}
            quizSize={quizSize}
            onQuizSizeChange={setQuizSize}
            onStartQuiz={handleStartQuiz}
          />
          <QuizHistory
            history={quizHistory}
            onClearHistory={handleClearHistory}
          />
        </div>
      )}

      {/* 2. PLAYING GAME STATE */}
      {gameState === 'playing' && sessionWords.length > 0 && (
        <QuizCard
          wordItem={sessionWords[currentIndex]}
          options={sessionOptions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={sessionWords.length}
          onAnswerSubmit={handleAnswerSubmit}
        />
      )}

      {/* 3. RESULTS DISPLAY STATE */}
      {gameState === 'results' && (
        <QuizResults
          correctCount={correctCount}
          totalQuestions={sessionWords.length}
          incorrectWords={incorrectWords}
          onReplay={handleStartQuiz}
          onNewSetup={() => setGameState('setup')}
        />
      )}
    </div>
  );
}
