export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence?: number;
}

export interface SpeechRecognitionResultItem {
  isFinal?: boolean;
  length: number;
  [key: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionEvent {
  resultIndex?: number;
  results: {
    length: number;
    [key: number]: SpeechRecognitionResultItem;
  };
}

export interface SpeechRecognitionErrorEvent {
  error: string;
}

export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

export interface AiChatMessage {
  id: string;
  speaker: 'AI' | 'User';
  speakerName: string;
  text: string;
  meaning_lao?: string;
  feedback?: string;
  timestamp?: number;
}

export interface Suggestion {
  text: string;
  meaning_lao: string;
}

export type LevelFilter = 'All' | 'Basic' | 'Intermediate' | 'Advanced';
