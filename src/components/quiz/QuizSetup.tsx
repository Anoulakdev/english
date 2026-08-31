'use client';

import React from 'react';

interface QuizSetupProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  quizSize: number;
  onQuizSizeChange: (size: number) => void;
  onStartQuiz: () => void;
}

const CATEGORY_META: Record<string, { icon: string; labelLao: string }> = {
  All: { icon: '✨', labelLao: 'ທັງໝົດ' },
  Daily: { icon: '☀️', labelLao: 'ຊີວິດປະຈຳວັນ' },
  Work: { icon: '💼', labelLao: 'ການເຮັດວຽກ' },
  Travel: { icon: '✈️', labelLao: 'ການທ່ອງທ່ຽວ' },
  Food: { icon: '🍔', labelLao: 'ອາຫານ & ເຄື່ອງດື່ມ' },
  Technology: { icon: '💻', labelLao: 'ເຕັກໂນໂລຊີ' },
  Business: { icon: '📈', labelLao: 'ທຸລະກິດ' },
  Education: { icon: '🎓', labelLao: 'ການສຶກສາ' },
  Health: { icon: '🏥', labelLao: 'ສຸຂະພາບ' },
  Shopping: { icon: '🛍️', labelLao: 'ການຊື້ເຄື່ອງ' },
  Social: { icon: '💬', labelLao: 'ການພົວພັນສັງຄົມ' },
  Entertainment: { icon: '🎮', labelLao: 'ບັນເທີງ' },
  Nature: { icon: '🌿', labelLao: 'ທຳມະຊາດ' },
};

const QUIZ_SIZE_CONFIGS = [
  { size: 5, time: '~2 ນາທີ', badge: 'ດ່ວນ', desc: 'ທົດສອບໄວ', icon: '⚡' },
  { size: 10, time: '~5 ນາທີ', badge: 'ແນະນຳ ⭐', desc: 'ມາດຕະຖານ', icon: '🎯' },
  { size: 20, time: '~10 ນາທີ', badge: 'ທ້າທາຍ 🔥', desc: 'ຝຶກຝົນເຂັ້ມຂຸ້ນ', icon: '🔥' },
  { size: 30, time: '~15 ນາທີ', badge: 'ມາຣາທອນ 🏆', desc: 'ທົດສອບຂັ້ນສູງ', icon: '🏆' },
];

export function QuizSetup({
  categories,
  selectedCategory,
  onCategoryChange,
  quizSize,
  onQuizSizeChange,
  onStartQuiz,
}: QuizSetupProps) {
  return (
    <div className="lg:col-span-7 rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-primary/5 space-y-7 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-primary/15 via-indigo-500/10 to-transparent rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-purple-500/10 via-primary/5 to-transparent rounded-full blur-3xl" />

      {/* Header with Icon Badge */}
      <div className="relative flex items-center justify-between gap-4 pb-5 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 p-0.5 shadow-lg shadow-primary/25 shrink-0 flex items-center justify-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              ເລີ່ມຕົ້ນການທົດສອບ <span className="text-primary">(Quiz Challenge)</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
              ທົດສອບຄວາມຈຳ ແລະ ຄວາມເຂົ້າໃຈຄຳສັບພາສາອັງກິດ ດ້ວຍ 4 ຕົວເລືອກ ພ້ອມສຽງອ່ານ ແລະ ຕົວຢ່າງ
            </p>
          </div>
        </div>
      </div>

      {/* Select Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            <span>ເລືອກໝວດໝູ່ຄຳສັບ (Category):</span>
          </label>
          <span className="text-[11px] text-muted font-medium">
            {categories.length} ໝວດໝູ່ໃຫ້ເລືອກ
          </span>
        </div>

        {/* Full Category Select Dropdown */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl border border-border bg-secondary/40 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all text-sm font-semibold text-foreground appearance-none cursor-pointer"
          >
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const laoText = meta ? ` (${meta.labelLao})` : '';
              return (
                <option key={cat} value={cat} className="bg-card text-foreground py-2">
                  {meta?.icon ? `${meta.icon} ` : ''}
                  {cat === 'All' ? 'ທັງໝົດ (All Categories)' : `${cat}${laoText}`}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Select Quiz Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
            <span>ຈຳນວນຄຳຖາມ (Questions Count):</span>
          </label>
          <span className="text-[11px] font-semibold text-primary">
            ເລືອກ: {quizSize} ຂໍ້
          </span>
        </div>

        {/* Interactive Size Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUIZ_SIZE_CONFIGS.map((config) => {
            const isSelected = quizSize === config.size;
            return (
              <button
                key={config.size}
                type="button"
                onClick={() => onQuizSizeChange(config.size)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 group ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20 scale-[1.02]'
                    : 'bg-secondary/40 border-border/80 hover:bg-secondary/80 hover:border-border hover:scale-[1.01]'
                }`}
              >
                {/* Active Corner Checkmark */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-base">{config.icon}</span>
                  <span
                    className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted group-hover:text-foreground'
                    }`}
                  >
                    {config.badge}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {config.size}
                    </span>
                    <span className="text-xs font-bold text-muted">ຂໍ້</span>
                  </div>
                  <span className="text-[11px] text-muted block mt-0.5 font-medium">
                    {config.time}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature / Tips Preview Card */}
      <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            🔊
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">ສຽງອ່ານຊັດເຈນ</p>
            <p className="text-[10px] text-muted">ຟັງການອອກສຽງ AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            💡
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">ຕົວຢ່າງປະໂຫຍກ</p>
            <p className="text-[10px] text-muted">ພ້ອມຄຳແປພາສາລາວ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            📊
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">ບັນທຶກຄະແນນ</p>
            <p className="text-[10px] text-muted">ເບິ່ງປະຫວັດການສອບ</p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        type="button"
        onClick={onStartQuiz}
        className="w-full py-4.5 px-6 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] hover:bg-right text-primary-foreground font-extrabold text-base sm:text-lg transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-4 h-4 ml-0.5"
          >
            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
        </div>
        <span>ເລີ່ມຕົ້ນການທົດສອບດຽວນີ້</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className="w-5 h-5 group-hover:translate-x-1 transition-transform"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );
}

