import React from 'react';
import { ConversationScenario } from '@/data/conversations';
import { ScenarioIcon } from './ScenarioIcon';
import { getLevelColor } from './ScenarioCard';

interface ConversationHeaderProps {
  scenario: ConversationScenario;
  showLaoTranslation: boolean;
  autoPlayAudio: boolean;
  onBack: () => void;
  onToggleLaoTranslation: () => void;
  onToggleAutoPlayAudio: () => void;
}

export function ConversationHeader({
  scenario,
  showLaoTranslation,
  autoPlayAudio,
  onBack,
  onToggleLaoTranslation,
  onToggleAutoPlayAudio,
}: ConversationHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
      {/* Back Button & Scenario Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-border hover:bg-secondary text-muted hover:text-foreground transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          ກັບຄືນ
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary hidden sm:block">
            <ScenarioIcon name={scenario.icon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground leading-tight flex items-center gap-2">
              {scenario.title_en}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLevelColor(scenario.level)}`}>
                {scenario.level}
              </span>
            </h2>
            <span className="text-xs text-primary font-semibold block">
              {scenario.title_lao}
            </span>
          </div>
        </div>
      </div>

      {/* Toggles: Lao Translation & Auto Play Audio */}
      <div className="flex items-center gap-2">
        {/* Lao Translation Toggle */}
        <button
          onClick={onToggleLaoTranslation}
          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            showLaoTranslation
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
              : 'bg-card border-border text-muted hover:text-foreground'
          }`}
          title={showLaoTranslation ? 'ເຊື່ອງຄຳແປລາວ' : 'ສະແດງຄຳແປລາວ'}
        >
          🇱🇦 {showLaoTranslation ? 'ແປ: ເປີດ' : 'ແປ: ປິດ'}
        </button>

        {/* Auto Play Audio Toggle */}
        <button
          onClick={onToggleAutoPlayAudio}
          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            autoPlayAudio
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-card border-border text-muted hover:text-foreground'
          }`}
          title={autoPlayAudio ? 'ປິດສຽງອັດຕະໂນມັດ' : 'ເປີດສຽງອັດຕະໂນມັດ'}
        >
          🔊 {autoPlayAudio ? 'ສຽງ: ເປີດ' : 'ສຽງ: ປິດ'}
        </button>
      </div>
    </div>
  );
}
