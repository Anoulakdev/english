import React from 'react';
import { AiChatMessage } from './types';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  messages: AiChatMessage[];
  isAiLoading: boolean;
  showLaoTranslation: boolean;
  onPlayAudio: (text: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  messages,
  isAiLoading,
  showLaoTranslation,
  onPlayAudio,
  chatEndRef,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-secondary/10">
      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          showLaoTranslation={showLaoTranslation}
          onPlayAudio={onPlayAudio}
        />
      ))}

      {/* AI Loading Indicator */}
      {isAiLoading && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-card border border-border text-foreground rounded-2xl rounded-tl-none p-4 flex items-center gap-3 shadow-xs">
            <div className="flex gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <span className="text-xs text-muted font-medium">AI ກຳລັງຄິດຄຳຕອບ...</span>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
