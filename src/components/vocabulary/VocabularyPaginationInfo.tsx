import React from 'react';

interface VocabularyPaginationInfoProps {
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function VocabularyPaginationInfo({
  startIndex,
  endIndex,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
}: VocabularyPaginationInfoProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
      <p>
        ສະແດງ <span className="font-semibold text-foreground">{startIndex + 1}</span> -{' '}
        <span className="font-semibold text-foreground">{endIndex}</span> ຈາກທັງໝົດ{' '}
        <span className="font-semibold text-foreground">{totalItems.toLocaleString()}</span> ຄຳສັບ
      </p>

      <div className="flex items-center gap-2">
        <span>ສະແດງຕໍ່ໜ້າ:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value={12}>12</option>
          <option value={24}>24</option>
          <option value={48}>48</option>
          <option value={96}>96</option>
        </select>
      </div>
    </div>
  );
}
