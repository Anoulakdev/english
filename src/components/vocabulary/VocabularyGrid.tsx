import React from 'react';
import { Word } from '@/data/words';
import WordCard from '@/components/WordCard';
import { VocabularyEmptyState } from './VocabularyEmptyState';

interface VocabularyGridProps {
  words: Word[];
  learnedWords: number[];
  onToggleLearned: (id: number) => void;
  onResetFilters: () => void;
}

export function VocabularyGrid({
  words,
  learnedWords,
  onToggleLearned,
  onResetFilters,
}: VocabularyGridProps) {
  if (words.length === 0) {
    return <VocabularyEmptyState onResetFilters={onResetFilters} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {words.map((item) => (
        <WordCard
          key={item.id}
          wordItem={item}
          isLearned={learnedWords.includes(item.id)}
          onToggleLearned={() => onToggleLearned(item.id)}
        />
      ))}
    </div>
  );
}
