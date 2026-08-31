'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDailyWords } from '@/hooks/useDailyWords';
import wordsData, { Word, CATEGORY_RANGES, CATEGORIES_LIST } from '@/data/words';
import {
  StatusFilter,
  VocabularyHeader,
  VocabularyFilters,
  VocabularyPaginationInfo,
  VocabularyPaginationControls,
  VocabularyGrid,
} from '@/components/vocabulary';

function VocabularyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params
  const categoryParam = searchParams.get('category') || 'All';
  const modeParam = searchParams.get('mode'); // 'daily' or null
  const isDailyMode = modeParam === 'daily';

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Local storage state
  const [learnedWords, setLearnedWords] = useLocalStorage<number[]>('learned-words', []);
  const dailyWordIds = useDailyWords();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Prevent SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync category state with search parameter
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setCurrentPage(1);
    }
  }, [categoryParam]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, statusFilter, modeParam]);

  // Fast Set lookups O(1)
  const learnedSet = useMemo(() => new Set(learnedWords), [learnedWords]);

  const handleToggleLearned = useCallback((id: number) => {
    setLearnedWords((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return Array.from(s);
    });
  }, [setLearnedWords]);

  const handleShuffle = useCallback(() => {
    setShuffleSeed((prev) => prev + 1);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStatusFilter('all');
    setCurrentPage(1);
    if (modeParam) {
      router.push('/vocabulary');
    } else {
      router.replace('/vocabulary');
    }
  }, [modeParam, router]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Categories list memoized (static 0ms)
  const categoriesList = CATEGORIES_LIST;

  // Filter application memoized (Fast indexed slicing & non-blocking search)
  const filteredWords = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();

    // 1. Determine base pool efficiently
    let pool: Word[];
    if (isDailyMode) {
      pool = dailyWordIds.map((id) => wordsData[id - 1]).filter(Boolean) as Word[];
    } else if (selectedCategory !== 'All' && CATEGORY_RANGES[selectedCategory]) {
      const [start, end] = CATEGORY_RANGES[selectedCategory];
      pool = wordsData.slice(start, end);
    } else {
      pool = wordsData;
    }

    // 2. Filter criteria
    const result = pool.filter((item) => {
      // Search Query
      if (
        q &&
        !item.word.toLowerCase().includes(q) &&
        !item.meaning.toLowerCase().includes(q)
      ) {
        return false;
      }

      // Status Filter
      const isLearned = learnedSet.has(item.id);
      if (statusFilter === 'learned' && !isLearned) return false;
      if (statusFilter === 'unlearned' && isLearned) return false;

      return true;
    });

    // 3. Apply deterministic shuffle if requested based on shuffleSeed
    if (shuffleSeed > 0) {
      const shuffled = [...result];
      let seed = shuffleSeed;
      for (let i = shuffled.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    return result;
  }, [deferredSearchQuery, selectedCategory, statusFilter, isDailyMode, dailyWordIds, learnedSet, shuffleSeed]);

  // Pagination calculation
  const totalItems = filteredWords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedWords = useMemo(
    () => filteredWords.slice(startIndex, endIndex),
    [filteredWords, startIndex, endIndex]
  );

  const dailyLearnedCount = useMemo(
    () => filteredWords.filter((w) => learnedSet.has(w.id)).length,
    [filteredWords, learnedSet]
  );

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-muted">ກຳລັງໂຫຼດ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <VocabularyHeader
        isDailyMode={isDailyMode}
        totalItems={totalItems}
        onShuffle={handleShuffle}
      />

      {/* Control Panel (Filters & Search) */}
      <VocabularyFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categoriesList={categoriesList}
        isDailyMode={isDailyMode}
        dailyLearnedCount={dailyLearnedCount}
      />

      {/* Top Pagination Info Bar (Only shown if items exist and not in daily mode) */}
      {totalItems > 0 && !isDailyMode && (
        <VocabularyPaginationInfo
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(newSize) => {
            setItemsPerPage(newSize);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Grid of Word Cards or Empty State */}
      <VocabularyGrid
        words={paginatedWords}
        learnedWords={learnedWords}
        onToggleLearned={handleToggleLearned}
        onResetFilters={handleResetFilters}
      />

      {/* Bottom Pagination Controls (Only shown if more than 1 page and not in daily mode) */}
      {!isDailyMode && (
        <VocabularyPaginationControls
          currentPage={validCurrentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default function Vocabulary() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="mt-4 text-sm text-muted font-semibold">ກຳລັງໂຫຼດຂໍ້ມູນຄຳສັບ...</p>
        </div>
      }
    >
      <VocabularyContent />
    </Suspense>
  );
}
