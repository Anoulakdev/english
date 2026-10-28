import { useEffect, useState, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TOTAL_WORDS_COUNT } from '@/data/wordsMeta';

export function useDailyWords() {
  const [dailyWordIds, setDailyWordIds] = useLocalStorage<number[]>('daily-word-ids', []);
  const [dailyDate, setDailyDate] = useLocalStorage<string>('daily-word-date', '');
  const [learnedWords] = useLocalStorage<number[]>('learned-words', []);
  const [mounted, setMounted] = useState(false);

  const learnedWordsRef = useRef<number[]>(learnedWords);
  useEffect(() => {
    learnedWordsRef.current = learnedWords;
  }, [learnedWords]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (dailyDate !== todayStr || dailyWordIds.length === 0) {
      const learnedSet = new Set(learnedWordsRef.current);
      const totalWords = TOTAL_WORDS_COUNT;
      const selectedIdSet = new Set<number>();
      let attempts = 0;

      // 1. Fast O(1) random ID sampling (1..200000) for 10 unlearned words without loading 91MB JSON
      while (selectedIdSet.size < 10 && attempts < 200) {
        attempts++;
        const candidateId = Math.floor(Math.random() * totalWords) + 1;
        if (!learnedSet.has(candidateId) && !selectedIdSet.has(candidateId)) {
          selectedIdSet.add(candidateId);
        }
      }

      // 2. Fallback if user learned almost everything
      if (selectedIdSet.size < 10) {
        attempts = 0;
        while (selectedIdSet.size < 10 && attempts < 100) {
          attempts++;
          const candidateId = Math.floor(Math.random() * totalWords) + 1;
          if (!selectedIdSet.has(candidateId)) {
            selectedIdSet.add(candidateId);
          }
        }
      }

      setDailyWordIds(Array.from(selectedIdSet));
      setDailyDate(todayStr);
    }
  }, [mounted, dailyDate, dailyWordIds.length, setDailyWordIds, setDailyDate]);

  return dailyWordIds;
}
