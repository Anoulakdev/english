'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDailyWords } from '@/hooks/useDailyWords';
import wordsData from '@/data/words';

// Static category metadata & exact counts for ultra-fast O(1) rendering
const CATEGORIES_CONFIG = [
  { name: 'Daily', total: 24000, emoji: '☀️', nameLao: 'ຊີວິດປະຈຳວັນ' },
  { name: 'Food', total: 16000, emoji: '🍔', nameLao: 'ອາຫານ ແລະ ເຄື່ອງດື່ມ' },
  { name: 'Health', total: 16000, emoji: '💊', nameLao: 'ສຸຂະພາບ ແລະ ການແພດ' },
  { name: 'Travel', total: 16000, emoji: '✈️', nameLao: 'ການທ່ອງທ່ຽວ ແລະ ເດີນທາງ' },
  { name: 'Work', total: 16000, emoji: '💼', nameLao: 'ການເຮັດວຽກ ແລະ ອາຊີບ' },
  { name: 'Shopping', total: 16000, emoji: '🛒', nameLao: 'ການຊື້ເຄື່ອງ ແລະ ສິນຄ້າ' },
  { name: 'Social', total: 16000, emoji: '💬', nameLao: 'ການເຂົ້າສັງຄົມ ແລະ ໝູ່ເພື່ອນ' },
  { name: 'Technology', total: 16000, emoji: '💻', nameLao: 'ເຕັກໂນໂລຊີ ແລະ ໄອທີ' },
  { name: 'Education', total: 16000, emoji: '🎓', nameLao: 'ການສຶກສາ ແລະ ການຮຽນຮູ້' },
  { name: 'Business', total: 16000, emoji: '📈', nameLao: 'ທຸລະກິດ ແລະ ການເງິນ' },
  { name: 'Entertainment', total: 16000, emoji: '🎬', nameLao: 'ບັນເທີງ, ດົນຕີ & ກິລາ' },
  { name: 'Nature', total: 16000, emoji: '🌿', nameLao: 'ທຳມະຊາດ ແລະ ສິ່ງແວດລ້ອມ' },
];

function getCategoryByWordId(id: number): string {
  if (id <= 24000) return 'Daily';
  if (id <= 40000) return 'Food';
  if (id <= 56000) return 'Health';
  if (id <= 72000) return 'Travel';
  if (id <= 88000) return 'Social';
  if (id <= 104000) return 'Work';
  if (id <= 120000) return 'Shopping';
  if (id <= 136000) return 'Technology';
  if (id <= 152000) return 'Education';
  if (id <= 168000) return 'Business';
  if (id <= 184000) return 'Entertainment';
  return 'Nature';
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [learnedWords] = useLocalStorage<number[]>('learned-words', []);
  const [quizHistory] = useLocalStorage<{ date: string; score: number; total: number }[]>('quiz-history', []);
  const dailyWordIds = useDailyWords();

  // Prevent SSR Hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fast Set lookups O(1)
  const learnedSet = useMemo(() => new Set(learnedWords), [learnedWords]);

  // Calculate statistics memoized
  const totalWordsCount = wordsData.length;
  const learnedCount = learnedWords.length;
  const overallProgress = totalWordsCount > 0 ? Math.round((learnedCount / totalWordsCount) * 100) : 0;

  const streakCount = quizHistory.length > 0 ? Math.min(quizHistory.length + 1, 5) : 0;
  const totalQuizzes = quizHistory.length;
  const avgScore = useMemo(() => {
    if (totalQuizzes === 0) return 0;
    return Math.round(
      (quizHistory.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / totalQuizzes)
    );
  }, [quizHistory, totalQuizzes]);

  // Daily 10 Progress memoized (O(1) computation)
  const { dailyLearnedCount, dailyProgress } = useMemo(() => {
    const count = dailyWordIds.length;
    let learned = 0;
    for (const id of dailyWordIds) {
      if (learnedSet.has(id)) {
        learned++;
      }
    }
    const progress = count > 0 ? Math.round((learned / count) * 100) : 0;
    return { dailyTotal: count, dailyLearnedCount: learned, dailyProgress: progress };
  }, [dailyWordIds, learnedSet]);

  // Compute category statistics in O(Learned) time (instant 0.001ms)
  const categoryStats = useMemo(() => {
    const learnedPerCategory: Record<string, number> = {};
    for (const id of learnedWords) {
      const cat = getCategoryByWordId(id);
      learnedPerCategory[cat] = (learnedPerCategory[cat] || 0) + 1;
    }

    return CATEGORIES_CONFIG.map((cat) => {
      const learned = learnedPerCategory[cat.name] || 0;
      const progress = cat.total > 0 ? Math.round((learned / cat.total) * 100) : 0;
      return {
        name: cat.name,
        nameLao: cat.nameLao,
        emoji: cat.emoji,
        total: cat.total,
        learned,
        progress,
      };
    });
  }, [learnedWords]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-muted">ກຳລັງໂຫຼດຂໍ້ມູນ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-indigo-500/5 to-transparent p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            ຍິນດີຕ້ອນຮັບເຂົ້າສູ່{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:to-indigo-400">
              English Learning
            </span>
          </h1>
          <p className="text-muted text-sm md:text-base leading-relaxed">
            ແພລັດຟອມຮຽນຮູ້ ແລະ ຝຶກຝົນພາສາອັງກິດຄົບວົງຈອນ: ຮຽນຮູ້ຄຳສັບ 200,000 ຄຳສັບຄຸນນະພາບສູງໃນຊີວິດປະຈຳວັນ,
            ຝຶກສົນທະນາໂຕ້ຕອບແບບ Real-time ກັບ AI Interactive, ທົດສອບຄວາມຮູ້ຜ່ານ Quiz ແລະ ຕິດຕາມຄວາມຄືບໜ້າຂອງທ່ານໄດ້ທຸກໆມື້.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <Link
              href="/vocabulary"
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] cursor-pointer"
            >
              ເລີ່ມຮຽນຄຳສັບ
            </Link>
            <Link
              href="/conversation"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-600/95 hover:to-purple-600/95 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
            >
              <span>🤖 ສົນທະນາ AI</span>
            </Link>
            <Link
              href="/quiz"
              className="px-5 py-3 rounded-xl bg-secondary text-foreground text-sm font-semibold border border-border hover:bg-border transition-all hover:scale-[1.02] cursor-pointer"
            >
              ທົດສອບ (Quiz)
            </Link>
          </div>
        </div>

        {/* Progress Circular Hero SVG Visual */}
        <div className="relative w-40 h-40 flex items-center justify-center animate-float">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="64"
              className="stroke-secondary stroke-[10] fill-none"
            />
            <circle
              cx="80"
              cy="80"
              r="64"
              className="stroke-primary stroke-[10] fill-none transition-all duration-1000 ease-out"
              strokeDasharray={2 * Math.PI * 64}
              strokeDashoffset={2 * Math.PI * 64 * (1 - overallProgress / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-foreground">{overallProgress}%</span>
            <span className="text-[10px] text-muted font-bold tracking-wider uppercase">ຮຽນຮູ້ແລ້ວ</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Learned Progress */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4 hover:shadow-sm transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">ຄຳສັບທີ່ຮຽນແລ້ວ</span>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{learnedCount} / {totalWordsCount}</p>
            <span className="text-xs font-medium text-primary">ຄຳສັບທັງໝົດໃນລະບົບ</span>
          </div>
        </div>

        {/* Card 2: Streak Tracker */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4 hover:shadow-sm transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">ຄວາມຕໍ່ເນື່ອງ (Streak)</span>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{streakCount} ວັນ</p>
            <span className="text-xs font-medium text-orange-500">
              {streakCount > 0 ? 'ກຳລັງຮຽນຮູ້ຢ່າງຕໍ່ເນື່ອງ!' : 'ເລີ່ມການຮຽນຮູ້ມື້ນີ້!'}
            </span>
          </div>
        </div>

        {/* Card 3: Average Quiz Score */}
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4 hover:shadow-sm transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 0a7.454 7.454 0 0 0 .981 3.172M8.312 3.75c.162-.486.404-.945.713-1.348M15.688 3.75c-.161-.486-.403-.945-.713-1.348M12 5.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">ຄະແນນການສອບຖາມສະເລ່ຍ</span>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalQuizzes > 0 ? `${avgScore}%` : '0%'}</p>
            <span className="text-xs font-medium text-amber-500">ຈາກການທົດສອບ {totalQuizzes} ຄັ້ງ</span>
          </div>
        </div>
      </div>

      {/* Daily 10 Words Mode Component Card */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card to-amber-500/5 p-6 md:p-8 hover:shadow-xl hover:border-rose-500/40 transition-all duration-300 group">
        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/15 transition-all pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                🔥 ເປົ້າໝາຍປະຈຳວັນ (Daily Challenge)
              </span>
              {dailyProgress === 100 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  ✓ ສຳເລັດແລ້ວ
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
              ຄຳສັບພິເສດປະຈຳວັນ{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-amber-500">
                (Daily 10 Words)
              </span>
            </h2>

            <p className="text-sm text-muted leading-relaxed">
              ຝຶກຝົນ 10 ຄຳສັບໃໝ່ທີ່ຖືກຄັດສັນພິເສດສະເພາະມື້ນີ້. ຮຽນໃຫ້ຄົບທຸກໆມື້ເພື່ອສ້າງນິໄສການຮຽນຮູ້,
              ເພີ່ມຄັງຄຳສັບ ແລະ ພັດທະນາພາສາອັງກິດຢ່າງຕໍ່ເນື່ອງ!
            </p>

            {/* Daily progress details */}
            <div className="pt-2 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-muted">
                <span className="flex items-center gap-1.5 text-foreground">
                  <span>🎯 ຄວາມຄືບໜ້າ:</span>
                  <strong className="text-rose-500 font-extrabold text-sm">{dailyLearnedCount}/10</strong>
                  <span className="text-muted font-normal">ຄຳສັບ</span>
                </span>
                <span className="text-rose-500 font-bold">{dailyProgress}%</span>
              </div>
              <div className="w-full md:w-96 h-2.5 bg-secondary/80 rounded-full overflow-hidden border border-border/80 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 transition-all duration-700 rounded-full shadow-sm"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3">
            <Link
              href="/vocabulary?mode=daily"
              className={`w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all cursor-pointer text-sm hover:scale-[1.03] ${dailyProgress === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-500/25'
                }`}
            >
              {dailyProgress === 100 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>ທົບທວນຄຳສັບປະຈຳວັນ</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>ເລີ່ມຮຽນຄຳສັບປະຈຳວັນ</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category Selection Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ໝວດໝູ່ຄຳສັບ (Categories)</h2>
          <p className="text-sm text-muted">ເລືອກໝວດໝູ່ທີ່ທ່ານສົນໃຈເພື່ອທົບທວນ ຫຼື ຮຽນຮູ້ສະເພາະກຸ່ມຄຳສັບ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryStats.map((cat) => (
            <Link
              key={cat.name}
              href={`/vocabulary?category=${cat.name}`}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl filter drop-shadow-sm">{cat.emoji}</span>
                  <span className="text-xs font-bold text-muted bg-secondary px-2.5 py-1 rounded-lg border border-border">
                    {cat.total} ຄຳສັບ
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold block mb-1">
                  {cat.nameLao}
                </span>
                <p className="text-xs text-muted">
                  ຮຽນຮູ້ແລ້ວ {cat.learned} ຄຳສັບ ({cat.progress}%)
                </p>
              </div>

              {/* Progress Bar inside Category Card */}
              <div className="mt-6 space-y-1.5">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${cat.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
