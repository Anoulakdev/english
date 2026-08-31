import React from 'react';
import { AiChatMessage } from './types';

interface ChatMessageItemProps {
  message: AiChatMessage;
  showLaoTranslation: boolean;
  onPlayAudio: (text: string) => void;
}

export function ChatMessageItem({
  message,
  showLaoTranslation,
  onPlayAudio,
}: ChatMessageItemProps) {
  const isAi = message.speaker === 'AI';

  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-scale-up`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm relative group ${
          isAi
            ? 'bg-card border border-border text-foreground rounded-tl-none'
            : 'bg-primary text-primary-foreground rounded-tr-none'
        }`}
      >
        {/* Speaker badge & Audio button */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
              isAi ? 'text-primary' : 'text-primary-foreground/80'
            }`}
          >
            {isAi && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {message.speakerName}
          </span>

          {/* Audio Repeat button */}
          <button
            onClick={() => onPlayAudio(message.text)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isAi
                ? 'text-muted hover:text-foreground hover:bg-secondary'
                : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
            }`}
            title="ຟັງສຽງ"
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
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
          </button>
        </div>

        {/* Main English Text */}
        <p className="text-sm sm:text-base font-medium leading-relaxed mb-1">
          {message.text}
        </p>

        {/* Lao Translation (Togglable) */}
        {showLaoTranslation && message.meaning_lao && (
          <p
            className={`text-xs ${
              isAi ? 'text-muted' : 'text-primary-foreground/80'
            } border-t ${isAi ? 'border-border/60' : 'border-primary-foreground/20'} pt-1.5 mt-1.5 leading-relaxed`}
          >
            {message.meaning_lao}
          </p>
        )}

        {/* AI Tutor Feedback / Grammar Tip */}
        {message.feedback && (
          <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-950/20 p-2 rounded-xl flex items-start gap-1.5">
            <span className="shrink-0 font-bold">💡 Tip:</span>
            <span>{message.feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}
