import React from 'react';
import { QuizAttempt } from './types';

interface QuizHistoryProps {
  history: QuizAttempt[];
  onClearHistory: () => void;
}

export function QuizHistory({ history, onClearHistory }: QuizHistoryProps) {
  const averageScorePercent =
    history.length > 0
      ? Math.round(
          history.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / history.length
        )
      : 0;

  return (
    <div className="lg:col-span-5 rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-primary/5 flex flex-col justify-between space-y-6 relative overflow-hidden">
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border/70">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              📜
            </span>
            <span>ປະຫວັດການທົດສອບ</span>
          </h2>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
            >
              ລ້າງປະຫວັດ
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
            {history.map((attempt, idx) => {
              const percent = Math.round((attempt.score / attempt.total) * 100);

              let bgScoreClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
              if (percent >= 80) {
                bgScoreClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
              } else if (percent >= 50) {
                bgScoreClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
              }

              return (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 rounded-xl border border-border bg-secondary/30"
                >
                  <div>
                    <span className="text-xs font-semibold text-muted">{attempt.date}</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      ໝວດ: {attempt.category === 'All' ? 'ທັງໝົດ' : attempt.category}
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border text-sm font-extrabold ${bgScoreClass}`}>
                    {attempt.score}/{attempt.total} ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state history */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted mb-3 border border-border">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.2"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="text-xs font-bold text-muted">ຍັງບໍ່ມີປະຫວັດການທົດສອບເທື່ອ</p>
            <p className="text-[11px] text-muted max-w-xs mt-1">
              ຄະແນນການທົດສອບຂອງທ່ານ ຈະຖືກບັນທຶກຢູ່ບ່ອນນີ້ຫຼັງຈາກສອບຖາມສຳເລັດ
            </p>
          </div>
        )}
      </div>

      {/* Score Summary Metrics */}
      {history.length > 0 && (
        <div className="border-t border-border pt-4 bg-secondary/10 p-3 rounded-xl border border-dashed">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">
            ສະຫຼຸບຜົນງານທັງໝົດ:
          </span>
          <div className="flex justify-between items-center text-xs text-muted font-semibold">
            <span>ຈຳນວນຄັ້ງສອບຖາມ: {history.length} ຄັ້ງ</span>
            <span>
              ອັດຕາການຕອບຖືກສະເລ່ຍ:{' '}
              <strong className="text-primary font-bold">{averageScorePercent}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
