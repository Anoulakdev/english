import React from 'react';
import Link from 'next/link';
import { Word } from '@/data/words';

interface QuizResultsProps {
  correctCount: number;
  totalQuestions: number;
  incorrectWords: Word[];
  onReplay: () => void;
  onNewSetup: () => void;
}

export function QuizResults({
  correctCount,
  totalQuestions,
  incorrectWords,
  onReplay,
  onNewSetup,
}: QuizResultsProps) {
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const getFeedbackMessage = () => {
    if (correctCount === totalQuestions) {
      return 'ຍອດຢ້ຽມຫຼາຍ! ທ່ານຕອບຖືກທຸກຂໍ້';
    }
    if (correctCount >= totalQuestions * 0.8) {
      return 'ເກັ່ງຫຼາຍ! ຜ່ານເກນຄະແນນດີເລີດ';
    }
    if (correctCount >= totalQuestions * 0.5) {
      return 'ພໍໃຊ້ໄດ້! ພະຍາຍາມຮຽນຮູ້ຕື່ມອີກ';
    }
    return 'ຕ້ອງພະຍາຍາມຕື່ມ! ທົບທວນຄຳສັບແລ້ວລອງໃໝ່';
  };

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-6 md:p-8 shadow-lg text-center space-y-8 animate-scale-up">
      {/* Trophy Header */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20 animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 0a7.454 7.454 0 0 0 .981 3.172M8.312 3.75c.162-.486.404-.945.713-1.348M15.688 3.75c-.161-.486-.403-.945-.713-1.348M12 5.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">ສຳເລັດການທົດສອບ!</h1>
        <p className="text-muted text-sm mt-1">ນີ້ແມ່ນຜົນການສອບເສັງຂອງທ່ານ</p>
      </div>

      {/* Grade Card Summary */}
      <div className="py-6 px-8 rounded-2xl bg-secondary/40 border border-border max-w-sm mx-auto">
        <div className="text-5xl font-extrabold text-primary mb-2">
          {correctCount} / {totalQuestions}
        </div>
        <div className="text-lg font-bold text-foreground">{percentage}% ຖືກຕ້ອງ</div>
        <p className="text-xs text-muted mt-2">{getFeedbackMessage()}</p>
      </div>

      {/* Incorrect words review card if any */}
      {incorrectWords.length > 0 && (
        <div className="text-left border border-border rounded-2xl bg-secondary/10 p-5 space-y-4">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">
            ຄຳສັບທີ່ຄວນທົບທວນ ({incorrectWords.length} ຄຳສັບ):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[220px] overflow-y-auto pr-1">
            {incorrectWords.map((word) => (
              <div
                key={word.id}
                className="p-3 rounded-xl border border-border bg-card flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{word.word}</p>
                  <p className="text-xs text-muted italic mt-0.5 max-w-[200px] truncate">
                    &quot;{word.example}&quot;
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap">
                  {word.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          type="button"
          onClick={onReplay}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
        >
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          ຫຼິ້ນຄືນໃໝ່ (Replay)
        </button>
        <button
          type="button"
          onClick={onNewSetup}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-secondary hover:bg-border text-foreground font-semibold text-sm border border-border transition-all hover:scale-[1.02] cursor-pointer"
        >
          ຕັ້ງຄ່າໃຫມ່ (New Setup)
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-secondary hover:bg-border text-foreground font-semibold text-sm border border-border transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          ກັບຄືນໜ້າຫຼັກ
        </Link>
      </div>
    </div>
  );
}
