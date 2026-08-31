'use client';

import React, { useState, useMemo, memo } from 'react';
import { playAudio } from '@/utils/audio';

interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  category: string;
  example_lao?: string;
}

interface WordCardProps {
  wordItem: Word;
  isLearned: boolean;
  onToggleLearned: () => void;
}

// Match a word optionally including apostrophe-joined parts (e.g. "don't", "I'm")
const WORD_REGEX = /[A-Za-z]+(?:'[A-Za-z]+)?/;

function WordCardComponent({ wordItem, isLearned, onToggleLearned }: WordCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingExample, setIsSpeakingExample] = useState(false);
  const [speakingWordIndex, setSpeakingWordIndex] = useState<number | null>(null);

  const speakExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudio(wordItem.example, () => setIsSpeakingExample(true), () => setIsSpeakingExample(false));
  };

  // Click a single word inside the example sentence to hear its pronunciation.
  const speakExampleWord = (word: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = word.replace(/[^A-Za-z']/g, '');
    if (!clean) return;
    playAudio(clean, () => setSpeakingWordIndex(index), () => setSpeakingWordIndex(null));
  };

  // Split the example into word / non-word tokens memoized
  const exampleTokens = useMemo(() => {
    return wordItem.example.split(/([A-Za-z]+(?:'[A-Za-z]+)?)/).filter((t) => t !== '');
  }, [wordItem.example]);

  const renderClickableExample = () => {
    return exampleTokens.map((token, i) => {
      if (WORD_REGEX.test(token)) {
        const isWordSpeaking = speakingWordIndex === i;
        return (
          <span
            key={i}
            onClick={(e) => speakExampleWord(token, i, e)}
            title="ຟັງຄຳນີ້ (Listen to this word)"
            className={`cursor-pointer underline decoration-dotted decoration-primary/40 underline-offset-2 hover:text-primary hover:decoration-primary transition-colors ${
              isWordSpeaking ? 'text-primary font-semibold' : ''
            }`}
          >
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50';
      case 'travel':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/50';
      case 'work':
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/50';
      case 'social':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/50';
      case 'health':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50';
      case 'shopping':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800';
    }
  };

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card toggling
    playAudio(wordItem.word, () => setIsSpeaking(true), () => setIsSpeaking(false));
  };

  return (
    <div
      className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 shadow-sm ${
        isLearned
          ? 'bg-slate-50/50 dark:bg-slate-950/20 border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-500/5'
          : 'bg-card border-border hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20 hover:-translate-y-0.5'
      }`}
    >
      {/* Learned Overlay Indicator */}
      {isLearned && (
        <span className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </span>
      )}

      <div>
        {/* Category & Pronounce controls */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(wordItem.category)}`}>
            {wordItem.category}
          </span>
          
          <button
            onClick={speak}
            className={`p-2 rounded-lg bg-secondary hover:bg-border transition-colors border border-border cursor-pointer group-hover:scale-105 ${
              isSpeaking ? 'text-primary ring-2 ring-primary/20' : 'text-muted hover:text-foreground'
            }`}
            title="ຟັງການອອກສຽງ (Listen pronunciation)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
          </button>
        </div>

        {/* Word Display */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold tracking-tight text-foreground select-all">
            {wordItem.word}
          </h3>
        </div>

        {/* Lao Meaning Card */}
        <div className="mb-5 p-4 rounded-xl border bg-primary/5 border-primary/20 dark:bg-primary/10">
          <div>
            <span className="text-xs font-semibold text-primary block mb-1">ຄວາມໝາຍ (Lao):</span>
            <p className="text-lg font-bold text-foreground">{wordItem.meaning}</p>
          </div>
        </div>

        {/* Example Sentence */}
        <div className="mb-6 space-y-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-muted block">ຕົວຢ່າງປະໂຫຍກ (Example):</span>
              <button
                onClick={speakExample}
                className={`p-1.5 rounded-lg bg-secondary/80 hover:bg-border transition-colors border border-border cursor-pointer ${
                  isSpeakingExample ? 'text-primary ring-2 ring-primary/20' : 'text-muted hover:text-foreground'
                }`}
                title="ຟັງປະໂຫຍກຕົວຢ່າງ (Listen example sentence)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className={`w-3 h-3 ${isSpeakingExample ? 'animate-bounce' : ''}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm italic text-foreground/80 leading-relaxed bg-secondary/20 p-2.5 rounded-lg border border-border/40">
              &quot;{renderClickableExample()}&quot;
            </p>
          </div>
          {wordItem.example_lao && (
            <div className="animate-scale-up">
              <span className="text-xs font-semibold text-primary block mb-1">ຄວາມໝາຍຕົວຢ່າງ (Lao):</span>
              <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                {wordItem.example_lao}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLearned();
        }}
        className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border flex items-center justify-center gap-2 cursor-pointer ${
          isLearned
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
            : 'bg-primary text-primary-foreground border-transparent hover:bg-primary/95 hover:shadow-sm'
        }`}
      >
        {isLearned ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            ຮຽນແລ້ວ (Learned)
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            ໝາຍວ່າຮຽນແລ້ວ (Mark Learned)
          </>
        )}
      </button>
    </div>
  );
}

const WordCard = memo(WordCardComponent);
export default WordCard;

