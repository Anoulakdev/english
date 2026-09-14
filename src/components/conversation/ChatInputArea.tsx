'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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

// Safe mobile haptic feedback helper
const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
};

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
  // Recording mode: 'idle' | 'holding' (hold-to-talk) | 'locked' (hands-free)
  const [recordMode, setRecordMode] = useState<'idle' | 'holding' | 'locked'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Gesture tracking (Slide to cancel / Slide up to lock)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerStartTimeRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);

  // Synchronize recordMode with external isRecording prop
  useEffect(() => {
    if (!isRecording) {
      setRecordMode('idle');
      setDragOffset({ x: 0, y: 0 });
      setRecordingSeconds(0);
    }
  }, [isRecording]);

  // Recording timer & input blur
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      setRecordingSeconds(0);
      inputRef?.current?.blur(); // Dismiss virtual mobile keyboard

      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
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
  // CANCEL & SEND RECORDING ACTIONS
  // ─────────────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    triggerHaptic(30);
    setRecordMode('idle');
    setDragOffset({ x: 0, y: 0 });
    if (onCancelRecording) {
      onCancelRecording();
    } else {
      onStopRecording();
    }
  }, [onCancelRecording, onStopRecording]);

  const handleFinishAndSend = useCallback(() => {
    triggerHaptic(25);
    setRecordMode('idle');
    setDragOffset({ x: 0, y: 0 });
    onStopRecording();
  }, [onStopRecording]);

  // ─────────────────────────────────────────────────────────────────
  // WHATSAPP-STYLE POINTER GESTURE HANDLERS (Touch & Mouse)
  // - Hold to Talk
  // - Slide Left (< -65px) to Cancel
  // - Slide Up (< -50px) to Lock (Hands-Free)
  // - Quick Tap (< 300ms) toggles Hands-Free Lock
  // ─────────────────────────────────────────────────────────────────
  const handleMicPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isAiLoading || !isRecognitionSupported) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    pointerIdRef.current = e.pointerId;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    pointerStartTimeRef.current = Date.now();
    setDragOffset({ x: 0, y: 0 });

    triggerHaptic(35);

    if (recordMode === 'idle') {
      setRecordMode('holding');
      if (!isRecording) {
        onStartRecording();
      }
    } else if (recordMode === 'locked') {
      // In locked mode, tapping the mic button sends immediately
      handleFinishAndSend();
    }
  };

  const handleMicPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (recordMode !== 'holding') return;

    const dx = e.clientX - pointerStartPosRef.current.x;
    const dy = e.clientY - pointerStartPosRef.current.y;

    // Only allow left drag (clamped -120 to 0) and up drag (clamped -90 to 0)
    const clampedX = Math.min(0, Math.max(-120, dx));
    const clampedY = Math.min(0, Math.max(-90, dy));
    setDragOffset({ x: clampedX, y: clampedY });

    // Gesture: Slide up to Lock hands-free recording (-50px)
    if (dy <= -50) {
      triggerHaptic([20, 35]);
      setRecordMode('locked');
      setDragOffset({ x: 0, y: 0 });
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    // Gesture: Slide left to Cancel (-75px threshold)
    if (dx <= -75) {
      triggerHaptic([30, 45]);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      handleCancel();
    }
  };

  const handleMicPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (recordMode === 'holding') {
      const duration = Date.now() - pointerStartTimeRef.current;
      const dx = dragOffset.x;

      if (dx <= -65) {
        // Cancelled via slide
        handleCancel();
      } else if (duration < 320) {
        // Short tap: switch to hands-free locked mode so user can speak comfortably without holding!
        triggerHaptic(20);
        setRecordMode('locked');
        setDragOffset({ x: 0, y: 0 });
      } else {
        // Released after holding (> 320ms): WhatsApp instant send!
        handleFinishAndSend();
      }
    }
  };

  const handleMicPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (recordMode === 'holding') {
      handleCancel();
    }
  };

  const hasText = userInputText.trim().length > 0;
  const isNearCancel = dragOffset.x <= -45;
  const isNearLock = dragOffset.y <= -35;

  return (
    <div className="relative p-2.5 sm:p-4 border-t border-border bg-card/95 backdrop-blur-md space-y-2 select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Microphone Error Notification Banner                      */}
      {/* ───────────────────────────────────────────────────────────── */}
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
              title="ປິດ (Close)"
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. Suggested Quick Replies (Shown when Idle)                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {recordMode === 'idle' && !isRecording && aiSuggestions.length > 0 && !isAiLoading && (
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
      {/* 3. MAIN INPUT BAR: WhatsApp-Style Unified In-Place Container */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-2 min-h-[52px]">
        {/* ── MODE A: LOCKED HANDS-FREE RECORDING BAR ── */}
        {recordMode === 'locked' ? (
          <div className="flex-1 flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-500/10 via-card to-emerald-500/10 border-2 border-rose-500/30 shadow-md animate-scale-up">
            {/* Left Action: Discard / Trash button */}
            <button
              id="chat-cancel-record-btn"
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer transition-all active:scale-95 shrink-0"
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
              <span className="hidden xs:inline">ຍົກເລີກ</span>
            </button>

            {/* Center Area: Red REC Dot, Timer, Soundwave Visualizer & Live Transcript */}
            <div className="flex-1 flex flex-col justify-center min-w-0 px-1">
              <div className="flex items-center gap-2">
                {/* Red pulsing REC indicator */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold tracking-wider shrink-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-mono">{formatDuration(recordingSeconds)}</span>
                </div>

                {/* WhatsApp-Style Dancing Sound Wave Bars */}
                <div className="flex items-center gap-0.5 sm:gap-1 h-5 overflow-hidden">
                  {[30, 70, 45, 90, 60, 100, 40, 85, 55, 75, 95, 50, 80, 65, 90, 40].map((h, idx) => (
                    <span
                      key={idx}
                      className="w-0.5 sm:w-1 bg-rose-500 rounded-full animate-soundwave-bar"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${(idx * 0.08) % 0.8}s`,
                        animationDuration: hasText ? '0.5s' : '0.9s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Real-time Spoken Transcript Stream */}
              <div className="mt-1 truncate">
                {hasText ? (
                  <span className="text-xs font-semibold text-foreground tracking-wide">
                    “{userInputText}”
                  </span>
                ) : (
                  <span className="text-[11px] text-muted italic animate-pulse">
                    🎙️ ກຳລັງຟັງ... ເວົ້າພາສາອັງກິດ (Listening...)
                  </span>
                )}
              </div>
            </div>

            {/* Right Action: Send Button */}
            <button
              id="chat-finish-send-btn"
              type="button"
              onClick={handleFinishAndSend}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
              title="ສົ່ງຂໍ້ຄວາມ (Send)"
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
        ) : (
          /* ── MODE B: IDLE OR HOLDING (Standard WhatsApp Flow) ── */
          <div className="relative flex-1 flex items-center">
            {/* When Holding: Slide-to-Cancel Bar Overlay */}
            {recordMode === 'holding' ? (
              <div className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-foreground animate-scale-up">
                {/* Left: Red recording blinker & timer */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                    {formatDuration(recordingSeconds)}
                  </span>
                </div>

                {/* Center / Right: Interactive Sliding Cancel Cue */}
                <div
                  className="flex items-center gap-1.5 transition-transform duration-75 text-xs font-semibold text-muted"
                  style={{ transform: `translateX(${dragOffset.x}px)` }}
                >
                  <span
                    className={`transition-colors flex items-center gap-1 ${
                      isNearCancel ? 'text-rose-500 font-bold animate-trash-shake' : 'text-muted'
                    }`}
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
                    <span>{isNearCancel ? 'ປ່ອຍເພື່ອຍົກເລີກ' : 'ເລື່ອນຊ້າຍເພື່ອຍົກເລີກ'}</span>
                  </span>
                  <span className="animate-slide-chevron text-sm">‹‹‹</span>
                </div>
              </div>
            ) : (
              /* Idle: Regular Text Input */
              <form onSubmit={handleSubmit} className="w-full">
                <input
                  id="chat-input-field"
                  ref={inputRef}
                  type="text"
                  value={userInputText}
                  onChange={(e) => onUserInputChange(e.target.value)}
                  placeholder="ພິມຂໍ້ຄວາມ ຫຼື ກົດໄມຄ້າງໄວ້ເພື່ອເວົ້າ..."
                  disabled={isAiLoading}
                  className="w-full px-4 py-3 sm:py-3.5 text-sm rounded-2xl border border-border bg-secondary/30 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                />
              </form>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 4. FLOATING LOCK INDICATOR (WhatsApp "Slide Up to Lock")     */}
        {/* ───────────────────────────────────────────────────────────── */}
        {recordMode === 'holding' && (
          <div
            className={`absolute -top-14 right-2 z-20 flex flex-col items-center gap-1 px-3 py-1.5 rounded-full bg-card border shadow-lg text-xs font-bold transition-all duration-150 ${
              isNearLock
                ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10 scale-110 shadow-emerald-500/30'
                : 'border-border text-muted animate-lock-bounce'
            }`}
          >
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.2"
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-3 h-3 -mt-0.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            </div>
            <span className="text-[10px] whitespace-nowrap">ເລື່ອນຂຶ້ນເພື່ອລັອກ</span>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 5. RIGHT ACTION BUTTON (Mic vs Send)                          */}
        {/* ───────────────────────────────────────────────────────────── */}
        {recordMode !== 'locked' && (
          <div className="relative shrink-0">
            {/* If user typed text and is idle: Show Send Button */}
            {hasText && recordMode === 'idle' ? (
              <button
                id="chat-send-btn"
                type="button"
                onClick={handleSubmit}
                disabled={isAiLoading}
                className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold flex items-center justify-center shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer"
                title="ສົ່ງຂໍ້ຄວາມ (Send)"
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
            ) : (
              /* WhatsApp Microphone Button: Touch & Hold / Tap to Talk */
              <button
                id="mic-record-btn"
                type="button"
                onPointerDown={handleMicPointerDown}
                onPointerMove={handleMicPointerMove}
                onPointerUp={handleMicPointerUp}
                onPointerCancel={handleMicPointerCancel}
                disabled={isAiLoading || !isRecognitionSupported}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center select-none touch-none transition-all duration-200 cursor-pointer ${
                  !isRecognitionSupported
                    ? 'bg-secondary/40 text-muted/50 border border-border cursor-not-allowed'
                    : recordMode === 'holding'
                    ? 'bg-rose-500 text-white scale-110 animate-mic-pulse shadow-xl shadow-rose-500/40 ring-4 ring-rose-500/20'
                    : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 active:scale-95 shadow-sm shadow-primary/10'
                }`}
                title={
                  !isRecognitionSupported
                    ? 'Browser ບໍ່ຮອງຮັບ Speech Recognition'
                    : 'ກົດຄ້າງໄວ້ເພື່ອເວົ້າ ຫຼື ແຕະ 1 ເທື່ອເພື່ອລັອກໄມ (Hold to speak, tap to lock)'
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.2"
                  stroke="currentColor"
                  className={`w-5 h-5 transition-transform duration-200 ${
                    recordMode === 'holding' ? 'scale-110' : ''
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
