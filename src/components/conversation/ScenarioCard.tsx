import React from 'react';
import { ConversationScenario } from '@/data/conversations';
import { ScenarioIcon } from './ScenarioIcon';

interface ScenarioCardProps {
  scenario: ConversationScenario;
  onSelect: (scenario: ConversationScenario) => void;
}

export function getLevelColor(level: string) {
  switch (level) {
    case 'Basic':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50';
    case 'Intermediate':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50';
    case 'Advanced':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300';
  }
}

export function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  return (
    <div className="group flex flex-col justify-between p-6 rounded-3xl border border-border bg-card hover:shadow-xl hover:border-primary/40 dark:hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
      {/* Subtle gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-indigo-500/60 to-purple-600/60 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <ScenarioIcon name={scenario.icon} />
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getLevelColor(scenario.level)}`}>
            {scenario.level}
          </span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {scenario.title_en}
        </h3>
        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-2.5">
          {scenario.title_lao}
        </h4>
        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6 line-clamp-2">
          {scenario.description_lao}
        </p>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-border/60">
        <button
          onClick={() => onSelect(scenario)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ເລີ່ມສົນທະນາກັບ AI (Start AI Chat)
        </button>
      </div>
    </div>
  );
}
