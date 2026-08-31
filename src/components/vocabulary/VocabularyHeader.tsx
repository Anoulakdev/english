import React from 'react';
import Link from 'next/link';

interface VocabularyHeaderProps {
  isDailyMode: boolean;
  totalItems: number;
  onShuffle: () => void;
}

export function VocabularyHeader({
  isDailyMode,
  totalItems,
  onShuffle,
}: VocabularyHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          {isDailyMode ? 'ຄຳສັບປະຈຳວັນ (Daily 10 Words)' : 'ຄັງຄຳສັບທັງໝົດ (Vocabulary List)'}
        </h1>
        <p className="text-sm text-muted mt-1">
          {isDailyMode
            ? 'ທົບທວນ ແລະ ຮຽນຮູ້ 10 ຄຳສັບທີ່ຄັດສັນພິເສດສຳລັບມື້ນີ້'
            : `ຄົ້ນຫາ, ກັ່ນຕອງ ແລະ ໝາຍຄຳສັບທີ່ທ່ານຮຽນຮູ້ແລ້ວ (ພົບ ${totalItems.toLocaleString()} ຄຳສັບ)`}
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {isDailyMode && (
          <Link
            href="/"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-border text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            ກັບຄືນໜ້າຫຼັກ
          </Link>
        )}

        <button
          type="button"
          onClick={onShuffle}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-border text-foreground border border-border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Shuffle words order"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
          ສະຫຼັບຄຳສັບ (Shuffle)
        </button>
      </div>
    </div>
  );
}
