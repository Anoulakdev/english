'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Suggestion } from './types';

export interface ChatInputAreaProps {
  userInputText: string;
  onUserInputChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  aiSuggestions: Suggestion[];
  isAiLoading: boolean;
  isRecording: boolean;
  isRecognitionSupported: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording?: () => void;
  micError?: string | null;
  onClearMicError?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ChatInputArea({
  userInputText,
  onUserInputChange,
  onSendMessage,
  aiSuggestions,
  isAiLoading,
  isRecording,
  isRecognitionSupported,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  micError,
  onClearMicError,
  inputRef,
}: ChatInputAreaProps) {
  // Recording timer state
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Pointer event tracking for conflict-free Tap & Hold
  const pointerStartTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldModeRef = useRef<boolean>(false);
  const wasRecordingOnPointerDownRef = useRef<boolean>(false);

  // Handle timer & mobile keyboard dismissal during active recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      setRecordingSeconds(0);
      // Dismiss mobile virtual keyboard so full conversation is visible
      inputRef?.current?.blur();

      // Haptic feedback for tactile feel on mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {}
      }

      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch {}
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, inputRef]);

  // Format recording timer: 00:05
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit typed text
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInputText.trim() || isAiLoading) return;
    onSendMessage(userInputText);
  };

  // ─────────────────────────────────────────────────────────────────
  // POINTER EVENT HANDLERS FOR MIC BUTTON
  // Resolves touch/mouse conflict completely:
  // - Tap (< 400ms): Toggles recording ON; tap again stops & sends.
  // - Hold (> 400ms): Holds to talk; releasing stops & sends.
  // ─────────────────────────────────────────────────────────────────
  const handleMicPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isAiLoading || !isRecognitionSupported) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    pointerStartTimeRef.current = Date.now();
    wasRecordingOnPointerDownRef.current = isRecording;
    isHoldModeRef.current = false;

    if (!isRecording) {
      onStartRecording();

      // Detect hold-to-talk
      holdTimerRef.current = setTimeout(() => {
        isHoldModeRef.current = true;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch {}
        }
      }, 400);
    }
  };

  const handleMicPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isAiLoading || !isRecognitionSupported) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldModeRef.current) {
      // Released after a long press -> finish and send
      isHoldModeRef.current = false;
      onStopRecording();
    } else {
      // Short tap (< 400ms)
      if (wasRecordingOnPointerDownRef.current) {
        // Was already recording when user tapped -> finish and send
        onStopRecording();
      } else {
        // Was idle -> stay in recording mode (Tap-to-Talk)
      }
    }
  };

  const handleMicPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isHoldModeRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Cancel recording without sending
  const handleCancelClick = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
    if (onCancelRecording) {
      onCancelRecording();
    } else {
      onStopRecording();
    }
  };

  // Send recorded transcript
  const handleSendRecordedClick = () => {
    onStopRecording();
  };

  const hasText = userInputText.trim().length > 0;

  return (
    <div className="p-3 sm:p-4 border-t border-border bg-card/95 backdrop-blur-md space-y-2.5">
      {/* Microphone Error Notification Banner */}
      {micError && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs animate-scale-up">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 shrink-0 text-rose-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <span className="truncate font-medium">{micError}</span>
          </div>
          {onClearMicError && (
            <button
              type="button"
              onClick={onClearMicError}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors shrink-0 cursor-pointer"
              title="ປິດການແຈ້ງເຕືອນ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Suggested Quick Replies Pills (Shown when idle & not loading) */}
      {!isRecording && aiSuggestions.length > 0 && !isAiLoading && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
            💡 ຄຳຕອບແນະນຳ:
          </span>
          {aiSuggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage(sug.text)}
              className="px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/15 border border-primary/20 hover:border-primary/40 text-foreground text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 group active:scale-95"
              title={sug.meaning_lao}
            >
              <span>{sug.text}</span>
              <span className="text-[10px] text-muted group-hover:text-primary transition-colors">
                ({sug.meaning_lao})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTIVE RECORDING STUDIO BAR (Mobile-First Transformation)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isRecording ? (
        <div className="flex flex-col gap-2.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-card to-primary/10 border-2 border-rose-500/35 shadow-lg shadow-rose-500/5 animate-scale-up">
          {/* Top Status Bar: REC badge, Soundwave visualizer, Timer */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2.5">
              {/* Pulsing REC badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold tracking-wider shadow-sm shadow-rose-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>REC</span>
              </div>

              {/* Animated Soundwave Equalizer */}
              <div className="flex items-center gap-1 h-6 px-1" title="ໄມກຳລັງເຮັດວຽກ">
                <span className="w-1 bg-rose-500 rounded-full animate-soundwave-1" />
                <span className="w-1 bg-rose-500 rounded-full animate-soundwave-2" />
                <span className="w-1 bg-rose-500 rounded-full animate-soundwave-3" />
                <span className="w-1 bg-rose-500 rounded-full animate-soundwave-4" />
                <span className="w-1 bg-rose-500 rounded-full animate-soundwave-5" />
              </div>

              {/* Live Timer */}
              <span className="font-mono font-bold text-xs text-rose-500 tracking-wider">
                {formatDuration(recordingSeconds)}
              </span>
            </div>

            {/* Instruction Cue */}
            <div className="text-[11px] text-muted flex items-center gap-1">
              <span className="hidden xs:inline">ເວົ້າພາສາອັງກິດໄດ້ເລີຍ</span>
              <span className="text-[10px] text-muted-foreground">(Speak English)</span>
            </div>
          </div>

          {/* Real-time Spoken Transcript Box */}
          <div className="min-h-[44px] px-3.5 py-2 rounded-xl bg-background/80 border border-border/80 flex items-center justify-between gap-2">
            <div className="flex-1 overflow-hidden">
              {userInputText.trim() ? (
                <p className="text-sm font-semibold text-foreground tracking-wide break-words line-clamp-2">
                  “{userInputText}”
                </p>
              ) : (
                <p className="text-xs text-muted italic flex items-center gap-1.5 animate-pulse">
                  <span>🎙️</span>
                  <span>ກຳລັງຟັງ... ເວົ້າພາສາອັງກິດຂອງທ່ານ (Listening...)</span>
                </p>
              )}
            </div>
            {userInputText.trim() && (
              <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded bg-primary/10 shrink-0">
                Live
              </span>
            )}
          </div>

          {/* Mobile Ergonomic Action Controls: Cancel | Stop/Mic | Send */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1">
            {/* Cancel / Discard Button */}
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-12 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer transition-all active:scale-95 shrink-0"
              title="ຍົກເລີກການອັດສຽງ (Cancel)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              <span>ຍົກເລີກ</span>
            </button>

            {/* Center Mic Button: Tap to Finish */}
            <button
              type="button"
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerCancel={handleMicPointerCancel}
              className="h-12 px-4 sm:px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer ring-4 ring-rose-500/20 animate-pulse shrink-0 touch-none select-none"
              title="ແຕະເພື່ອສຳເລັດ (Tap to finish)"
            >
              <div className="w-3.5 h-3.5 rounded bg-white" />
              <span>ສຳເລັດ</span>
            </button>

            {/* Send Button: Immediate submission to AI */}
            <button
              type="button"
              onClick={handleSendRecordedClick}
              disabled={!hasText && isAiLoading}
              className={`flex items-center justify-center gap-1.5 px-4 sm:px-5 h-12 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-md ${
                hasText
                  ? 'bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/25'
                  : 'bg-secondary text-muted border border-border opacity-80'
              }`}
              title="ສົ່ງ (Send)"
            >
              <span>ສົ່ງ</span>
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
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* IDLE CHAT INPUT ROW (Typing & Ready to Record)               */
        /* ───────────────────────────────────────────────────────────── */
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Text Input Field */}
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={userInputText}
              onChange={(e) => onUserInputChange(e.target.value)}
              placeholder="ພິມ ຫຼື ແຕະໄມເພື່ອເວົ້າພາສາອັງກິດ..."
              disabled={isAiLoading}
              className="w-full px-4 py-3 sm:py-3.5 text-sm rounded-2xl border border-border bg-secondary/30 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            />
          </div>

          {/* Action Buttons: Send & Mic */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Send Button (Visible when text has been typed) */}
            {hasText && (
              <button
                type="submit"
                disabled={isAiLoading}
                className="min-w-[48px] min-h-[48px] sm:w-11 sm:h-11 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs flex items-center justify-center shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer shrink-0"
                title="ສົ່ງ (Send)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
              </button>
            )}

            {/* Microphone Button (Optimized touch target, Tap-to-Talk & Hold-to-Talk) */}
            <button
              type="button"
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerCancel={handleMicPointerCancel}
              disabled={isAiLoading || !isRecognitionSupported}
              className={`min-w-[48px] min-h-[48px] sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center select-none touch-none transition-all duration-200 cursor-pointer shrink-0 ${
                !isRecognitionSupported
                  ? 'bg-secondary/40 text-muted/50 border border-border cursor-not-allowed'
                  : hasText
                  ? 'bg-secondary/60 hover:bg-secondary text-muted hover:text-foreground border border-border'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 active:scale-95 shadow-sm shadow-primary/10'
              }`}
              title={
                !isRecognitionSupported
                  ? 'Browser ຂອງທ່ານບໍ່ຮອງຮັບ Speech Recognition (ແນະນຳ Chrome ຫຼື Safari)'
                  : 'ແຕະ 1 ເທື່ອເພື່ອເລີ່ມເວົ້າ (Tap to talk)'
              }
            >
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
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
