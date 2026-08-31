import React from 'react';
import { StatusFilter } from './types';

interface VocabularyFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoriesList: string[];
  isDailyMode: boolean;
  dailyLearnedCount?: number;
}

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'ທັງໝົດ' },
  { id: 'unlearned', label: 'ຍັງບໍ່ໄດ້ຮຽນ' },
  { id: 'learned', label: 'ຮຽນແລ້ວ' },
];

export function VocabularyFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCategory,
  onCategoryChange,
  categoriesList,
  isDailyMode,
  dailyLearnedCount = 0,
}: VocabularyFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Control Panel (Filters & Search) */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Box */}
          <div className="relative md:col-span-6">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="ຄົ້ນຫາຄຳສັບ ຫຼື ຄວາມໝາຍ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-secondary/50 focus:bg-card focus:border-primary focus:outline-none transition-all text-sm text-foreground"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex bg-secondary p-1 rounded-xl border border-border md:col-span-6 overflow-hidden">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => onStatusFilterChange(status.id)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === status.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Slider (Only visible if not in Daily 10 Mode) */}
        {!isDailyMode && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-[10px] font-bold uppercase text-muted tracking-wider block mb-2">
              ກັ່ນຕອງຕາມໝວດໝູ່ (Category):
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-2 px-2">
              {categoriesList.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryChange(cat)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 snap-start ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
                        : 'bg-card border-border hover:bg-secondary text-muted hover:text-foreground'
                    }`}
                  >
                    {cat === 'All' ? 'ທັງໝົດ (All)' : cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info indicator in Daily Mode */}
      {isDailyMode && (
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-4 h-4 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <span>
            ກຳລັງເປີດໂໝດ &quot;ຄຳສັບປະຈຳວັນ&quot;. ຕົວຊ່ວຍກັ່ນຕອງໝວດໝູ່ຖືກປິດຕົ່ວຄາວ. ທ່ານຮຽນຮູ້ໄປແລ້ວ{' '}
            {dailyLearnedCount} ຈາກ 10 ຄຳສັບ.
          </span>
        </div>
      )}
    </div>
  );
}
