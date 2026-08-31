import React, { useState, useEffect, useMemo } from 'react';
import { ConversationScenario } from '@/data/conversations';
import { ScenarioCard } from './ScenarioCard';
import { LevelFilter } from './types';
import { ScenarioPaginationInfo, ScenarioPaginationControls } from './ScenarioPagination';

interface ScenarioSelectionProps {
  scenarios: ConversationScenario[];
  onSelectScenario: (scenario: ConversationScenario) => void;
}

const LEVEL_OPTIONS: LevelFilter[] = ['All', 'Basic', 'Intermediate', 'Advanced'];

export function ScenarioSelection({ scenarios, onSelectScenario }: ScenarioSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<LevelFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Reset to page 1 whenever search query or level filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLevelFilter]);

  const filteredScenarios = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scenarios.filter((scenario) => {
      const matchesSearch =
        !q ||
        scenario.title_en.toLowerCase().includes(q) ||
        scenario.title_lao.toLowerCase().includes(q) ||
        scenario.description_lao.toLowerCase().includes(q);
      const matchesLevel =
        selectedLevelFilter === 'All' || scenario.level === selectedLevelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [scenarios, searchQuery, selectedLevelFilter]);

  // Pagination calculations
  const totalItems = filteredScenarios.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedScenarios = useMemo(
    () => filteredScenarios.slice(startIndex, endIndex),
    [filteredScenarios, startIndex, endIndex]
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          ການສົນທະນາພາສາອັງກິດກັບ{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
            AI Interactive
          </span>
        </h1>
        <p className="text-muted text-sm sm:text-base leading-relaxed">
          ເລືອກສະຖານະການຈຳລອງເພື່ອສົນທະນາອິດສະຫຼະກັບ AI ພ້ອມສຽງອ່ານ, ຄຳແປພາສາລາວ ແລະ ຄຳແນະນຳໄວຍາກອນແບບ Real-time.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="ຄົ້ນຫາບົດສົນທະນາ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
          />
        </div>

        {/* Level Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex p-1 rounded-xl bg-secondary/40 border border-border text-xs">
            {LEVEL_OPTIONS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedLevelFilter === lvl
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {lvl === 'All' ? 'ທັງໝົດ' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pagination Info Bar */}
      {totalItems > 0 && (
        <ScenarioPaginationInfo
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

      {/* Grid of Scenarios */}
      {paginatedScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={onSelectScenario}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-3xl border border-border">
          <p className="text-muted text-sm">ບໍ່ພົບສະຖານະການທີ່ກົງກັບການຄົ້ນຫາ</p>
        </div>
      )}

      {/* Bottom Pagination Controls */}
      <ScenarioPaginationControls
        currentPage={validCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
