import React from 'react';

interface VocabularyEmptyStateProps {
  onResetFilters: () => void;
}

export function VocabularyEmptyState({ onResetFilters }: VocabularyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-3xl bg-card">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">ບໍ່ພົບຄຳສັບທີ່ກົງກັບເງື່ອນໄຂ</h3>
      <p className="text-sm text-muted mb-6 text-center max-w-sm px-4">
        ລອງປ່ຽນຄຳຄົ້ນຫາ, ປ່ຽນໝວດໝູ່ ຫຼື ກັ່ນຕອງສະຖານະໃໝ່ ເພື່ອຄົ້ນຫາຄຳສັບ.
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 text-sm transition-all shadow-sm cursor-pointer"
      >
        ລ້າງການກັ່ນຕອງທັງໝົດ
      </button>
    </div>
  );
}
