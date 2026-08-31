import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import wordsData from '@/data/words';

export function useDailyWords() {
  const [dailyWordIds, setDailyWordIds] = useLocalStorage<number[]>('daily-word-ids', []);
  const [dailyDate, setDailyDate] = useLocalStorage<string>('daily-word-date', '');
  const [learnedWords] = useLocalStorage<number[]>('learned-words', []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (dailyDate !== todayStr || dailyWordIds.length === 0) {
      const learnedSet = new Set(learnedWords);
      const totalWords = wordsData.length;
      const selectedIdSet = new Set<number>();
      let attempts = 0;

      // 1. Fast random sampling for 10 unlearned words
      while (selectedIdSet.size < 10 && attempts < 200) {
        attempts++;
        const randIdx = Math.floor(Math.random() * totalWords);
        const candidate = wordsData[randIdx];
        if (candidate && !learnedSet.has(candidate.id) && !selectedIdSet.has(candidate.id)) {
          selectedIdSet.add(candidate.id);
        }
      }

      // 2. If still < 10 (user learned almost everything), sample any unique words
      if (selectedIdSet.size < 10) {
        attempts = 0;
        while (selectedIdSet.size < 10 && attempts < 100) {
          attempts++;
          const randIdx = Math.floor(Math.random() * totalWords);
          const candidate = wordsData[randIdx];
          if (candidate && !selectedIdSet.has(candidate.id)) {
            selectedIdSet.add(candidate.id);
          }
        }
      }

      setDailyWordIds(Array.from(selectedIdSet));
      setDailyDate(todayStr);
    }
  }, [mounted, dailyDate, dailyWordIds.length, learnedWords, setDailyWordIds, setDailyDate]);

  return dailyWordIds;
}
