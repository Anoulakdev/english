import React, { useRef } from 'react';
import { Suggestion } from './types';

interface ChatInputAreaProps {
  userInputText: string;
  onUserInputChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  aiSuggestions: Suggestion[];
  isAiLoading: boolean;
  isRecording: boolean;
  isRecognitionSupported: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
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
  inputRef,
}: ChatInputAreaProps) {
  const pressTimerRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInputText.trim() || isAiLoading) return;
    onSendMessage(userInputText);
  };

  const handlePointerDown = () => {
    if (isAiLoading) return;
    pressTimerRef.current = Date.now();
    isHoldingRef.current = false;
    if (!isRecording) {
      onStartRecording();
    }
  };

  const handlePointerUp = () => {
    if (isAiLoading) return;
    const duration = Date.now() - pressTimerRef.current;
    if (duration > 350) {
      // Long press (Hold-to-Talk) -> Stop and send on release
      isHoldingRef.current = true;
      if (isRecording) {
        onStopRecording();
      }
    }
  };

  const handleClick = () => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      return;
    }
    const duration = Date.now() - pressTimerRef.current;
    // If it was already recording and clicked again -> stop and send
    if (duration <= 350 && isRecording) {
      onStopRecording();
    }
  };

  const hasText = userInputText.trim().length > 0;

  return (
    <div className="p-4 border-t border-border bg-card space-y-3">
      {/* Suggested Quick Replies Pills */}
      {aiSuggestions.length > 0 && !isAiLoading && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
            💡 ຄຳຕອບແນະນຳ:
          </span>
          {aiSuggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage(sug.text)}
              className="px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/15 border border-primary/20 hover:border-primary/40 text-foreground text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 group"
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

      {/* WhatsApp Style Chat Input & Actions Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Text Input */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={userInputText}
            onChange={(e) => onUserInputChange(e.target.value)}
            placeholder={
              isRecording
                ? '🔴 ກຳລັງຟັງ... (ກົດຄ້າງເພື່ອເວົ້າ, ປ່ອຍມືເພື່ອສົ່ງ)'
                : 'ພິມ ຫຼື ກົດໄມເພື່ອເວົ້າພາສາອັງກິດ...'
            }
            disabled={isAiLoading}
            className={`w-full px-4 py-3 text-sm rounded-2xl border transition-all text-foreground ${
              isRecording
                ? 'border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20'
                : 'border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            }`}
          />
        </div>

        {/* Action Buttons: WhatsApp Style (Mic & Send buttons) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Send Button (Always visible when text is typed) */}
          {hasText && (
            <button
              type="submit"
              disabled={isAiLoading}
              className="w-11 h-11 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs flex items-center justify-center shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer shrink-0"
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

          {/* Microphone Button (Supports both Click-to-Talk and Hold-to-Talk) */}
          {isRecognitionSupported && (
            <button
              type="button"
              onMouseDown={handlePointerDown}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchEnd={handlePointerUp}
              onClick={handleClick}
              disabled={isAiLoading}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center select-none touch-none transition-all duration-200 cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/40 ring-4 ring-rose-500/30 animate-pulse'
                  : hasText
                  ? 'bg-secondary/60 hover:bg-secondary text-muted hover:text-foreground border border-border'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 active:scale-95'
              }`}
              title={
                isRecording
                  ? 'ກຳລັງຟັງ... (ປ່ອຍມື ຫຼື ກົດອີກຄັ້ງເພື່ອສົ່ງ)'
                  : 'ກົດ ຫຼື ກົດຄ້າງເພື່ອເວົ້າ (Click or Hold to talk)'
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className={`w-5 h-5 ${isRecording ? 'text-white' : ''}`}
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
      </form>

      {/* Live recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-rose-500 font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>🔴 ກຳລັງຟັງ... (ກົດຄ້າງເພື່ອເວົ້າ, ປ່ອຍມື ຫຼື ກົດອີກຄັ້ງເພື່ອສົ່ງ)</span>
        </div>
      )}
    </div>
  );
}
