'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { playAudio } from '@/utils/audio';

interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  category: string;
  example_lao?: string;
}

interface QuizCardProps {
  wordItem: Word;
  options: string[];
  currentIndex: number;
  totalQuestions: number;
  onAnswerSubmit: (isCorrect: boolean) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Daily: '☀️',
  Work: '💼',
  Travel: '✈️',
  Food: '🍔',
  Technology: '💻',
  Business: '📈',
  Education: '🎓',
  Health: '🏥',
  Shopping: '🛍️',
  Social: '💬',
  Entertainment: '🎮',
  Nature: '🌿',
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizCard({
  wordItem,
  options,
  currentIndex,
  totalQuestions,
  onAnswerSubmit,
}: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingExample, setIsSpeakingExample] = useState(false);

  const cleanMeaning = (text: string) =>
    text
      .replace(/\([A-Za-z0-9\s/_\-.,']+\)/g, '')
      .replace(/[A-Za-z0-9]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || text;

  const speak = useCallback(() => {
    playAudio(wordItem.word, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, [wordItem.word]);

  const speakExample = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      playAudio(
        wordItem.example,
        () => setIsSpeakingExample(true),
        () => setIsSpeakingExample(false)
      );
    },
    [wordItem.example]
  );

  // Reset local state when the word item changes
  useEffect(() => {
    setSelectedOption(null);
    setIsCorrect(null);
    setIsSpeaking(false);
  }, [wordItem]);

  // Auto-speak on question load (helpful for learning!)
  useEffect(() => {
    speak();
  }, [speak]);

  const handleOptionClick = useCallback(
    (option: string) => {
      if (selectedOption !== null) return; // Answered already

      setSelectedOption(option);
      const correct = option === wordItem.meaning;
      setIsCorrect(correct);
    },
    [selectedOption, wordItem.meaning]
  );

  const handleNextClick = useCallback(() => {
    if (isCorrect !== null) {
      onAnswerSubmit(isCorrect);
    }
  }, [isCorrect, onAnswerSubmit]);

  // Keyboard navigation support: 1-4 or A-D to choose, Enter to next, Space to pronounce
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        speak();
        return;
      }

      if (selectedOption === null) {
        if (['Digit1', 'KeyA'].includes(e.code) && options[0]) {
          e.preventDefault();
          handleOptionClick(options[0]);
        } else if (['Digit2', 'KeyB'].includes(e.code) && options[1]) {
          e.preventDefault();
          handleOptionClick(options[1]);
        } else if (['Digit3', 'KeyC'].includes(e.code) && options[2]) {
          e.preventDefault();
          handleOptionClick(options[2]);
        } else if (['Digit4', 'KeyD'].includes(e.code) && options[3]) {
          e.preventDefault();
          handleOptionClick(options[3]);
        }
      } else {
        if (e.code === 'Enter') {
          e.preventDefault();
          handleNextClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, options, speak, handleOptionClick, handleNextClick]);

  const categoryIcon = CATEGORY_ICONS[wordItem.category] || '📚';
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-primary/5 space-y-6 relative overflow-hidden transition-all duration-300">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-primary/15 via-indigo-500/10 to-transparent rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-purple-500/10 via-primary/5 to-transparent rounded-full blur-3xl" />

      {/* Top Header & Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <span>{categoryIcon}</span>
            <span>{wordItem.category}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-foreground px-2.5 py-1 rounded-lg bg-secondary border border-border/80">
              {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-[11px] font-bold text-muted">
              ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-2 bg-secondary/80 rounded-full overflow-hidden p-0.5 border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary rounded-full transition-all duration-500 shadow-sm shadow-primary/25"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Word Question Showcase */}
      <div className="flex flex-col items-center text-center py-4 px-2 rounded-2xl bg-secondary/30 border border-border/60 relative">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
          <span>✨</span>
          <span>ຄຳສັບນີ້ໝາຍຄວາມວ່າແນວໃດ?</span>
          <span>✨</span>
        </span>

        <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4 tracking-tight drop-shadow-sm">
          {wordItem.word}
        </h2>

        {/* Speak Pronunciation Button */}
        <button
          type="button"
          onClick={speak}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer ${
            isSpeaking
              ? 'bg-primary text-primary-foreground border-transparent ring-4 ring-primary/20 scale-105 shadow-md shadow-primary/20'
              : 'bg-card border-border hover:bg-secondary text-muted hover:text-foreground hover:border-border'
          }`}
          title="ຟັງການອອກສຽງ (Space)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.2"
            stroke="currentColor"
            className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
            />
          </svg>
          <span>{isSpeaking ? 'ກຳລັງອ່ານ...' : 'ຟັງການອອກສຽງ'}</span>
        </button>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isOptionCorrect = option === wordItem.meaning;
          const letter = OPTION_LETTERS[idx] || `${idx + 1}`;

          let btnClass =
            'bg-secondary/40 border-border/80 hover:bg-secondary hover:border-primary/40 hover:scale-[1.01] text-foreground';
          let letterClass =
            'bg-card text-muted border-border/80 group-hover:text-foreground group-hover:border-primary/30';

          if (selectedOption !== null) {
            if (isOptionCorrect) {
              // Highlight correct answer in Green
              btnClass =
                'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold scale-[1.02] shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20';
              letterClass = 'bg-emerald-500 text-white border-emerald-500';
            } else if (isSelected) {
              // Highlight selected incorrect answer in Red
              btnClass =
                'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold scale-[0.99] shadow-md shadow-rose-500/10';
              letterClass = 'bg-rose-500 text-white border-rose-500';
            } else {
              // Fade out other answers
              btnClass = 'bg-card/40 border-border/40 opacity-40 text-muted';
              letterClass = 'bg-secondary/40 text-muted border-transparent';
            }
          }

          const displayOption = cleanMeaning(option);

          return (
            <button
              key={idx}
              type="button"
              disabled={selectedOption !== null}
              onClick={() => handleOptionClick(option)}
              className={`w-full py-4 px-4.5 rounded-2xl border text-left font-medium transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden ${btnClass}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-8 h-8 rounded-xl border text-xs font-black flex items-center justify-center shrink-0 transition-all ${letterClass}`}
                >
                  {letter}
                </span>
                <span className="text-sm sm:text-base font-semibold leading-snug break-words">
                  {displayOption}
                </span>
              </div>

              {/* Status Icons on Selection */}
              {selectedOption !== null && isOptionCorrect && (
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-scale-up">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
              )}

              {selectedOption !== null && isSelected && !isOptionCorrect && (
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-scale-up">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer feedback and Next button */}
      {selectedOption !== null && (
        <div className="animate-scale-up border-t border-border/80 pt-5 space-y-4">
          {/* Result Feedback Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isCorrect ? '🎉' : '❌'}</span>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold leading-tight">
                  {isCorrect ? 'ເກັ່ງຫຼາຍ! ຕອບຖືກຕ້ອງ' : 'ຕອບຜິດ! ຄວາມໝາຍທີ່ຖືກຕ້ອງຄື:'}
                </h4>
                {!isCorrect && (
                  <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                    👉 {cleanMeaning(wordItem.meaning)}
                  </p>
                )}
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-card/80 border border-border shrink-0">
              {isCorrect ? '+1 ຄະແນນ' : '+0'}
            </span>
          </div>

          {/* Context Example Sentences Card */}
          <div className="rounded-2xl bg-secondary/40 p-4 sm:p-5 border border-border/80 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                  <span>📖</span>
                  <span>ຕົວຢ່າງການໃຊ້ງານ (Example Context):</span>
                </span>
                <button
                  type="button"
                  onClick={speakExample}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSpeakingExample
                      ? 'bg-primary text-primary-foreground border-transparent ring-2 ring-primary/20 scale-105'
                      : 'bg-card border-border hover:bg-secondary text-muted hover:text-foreground'
                  }`}
                  title="ຟັງປະໂຫຍກຕົວຢ່າງ"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.2"
                    stroke="currentColor"
                    className={`w-3.5 h-3.5 ${isSpeakingExample ? 'animate-bounce' : ''}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                    />
                  </svg>
                  <span>{isSpeakingExample ? 'ກຳລັງອ່ານ...' : 'ຟັງປະໂຫຍກ'}</span>
                </button>
              </div>
              <p className="text-sm font-medium text-foreground italic bg-card/60 p-3 rounded-xl border border-border/60">
                &quot;{wordItem.example}&quot;
              </p>
            </div>

            {wordItem.example_lao && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-xs font-bold text-primary block mb-1">
                  ຄວາມໝາຍຕົວຢ່າງ (Lao):
                </span>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed bg-card/60 p-3 rounded-xl border border-border/60">
                  {wordItem.example_lao}
                </p>
              </div>
            )}
          </div>

          {/* Action Next Button */}
          <button
            type="button"
            onClick={handleNextClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] hover:bg-right text-primary-foreground font-extrabold text-base sm:text-lg transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <span>
              {currentIndex + 1 === totalQuestions ? 'ເບິ່ງຜົນຄະແນນ (View Results)' : 'ຂໍ້ຕໍ່ໄປ (Next Question)'}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

