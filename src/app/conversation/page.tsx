'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { conversationsData, ConversationScenario } from '@/data/conversations';
import { playAudio, stopAudio } from '@/utils/audio';
import {
  AiChatMessage,
  Suggestion,
  ScenarioSelection,
  ConversationHeader,
  ChatMessageList,
  ChatInputArea,
} from '@/components/conversation';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export default function ConversationPage() {
  // Scenario Selection
  const [selectedScenario, setSelectedScenario] = useState<ConversationScenario | null>(null);

  // AI Interactive Chat States
  const [aiChatHistory, setAiChatHistory] = useState<AiChatMessage[]>([]);
  const [userInputText, setUserInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showLaoTranslation, setShowLaoTranslation] = useState(true);

  // Audio & Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);

  // Refs to avoid stale closures & handle lifecycle cleanly
  const selectedScenarioRef = useRef<ConversationScenario | null>(null);
  const aiChatHistoryRef = useRef<AiChatMessage[]>([]);
  const isAiLoadingRef = useRef<boolean>(false);
  const autoPlayAudioRef = useRef<boolean>(true);
  const userInputTextRef = useRef<string>('');

  // Speech Recognition instance & transcripts
  const recognitionInstanceRef = useRef<ISpeechRecognition | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    selectedScenarioRef.current = selectedScenario;
  }, [selectedScenario]);

  useEffect(() => {
    aiChatHistoryRef.current = aiChatHistory;
  }, [aiChatHistory]);

  useEffect(() => {
    isAiLoadingRef.current = isAiLoading;
  }, [isAiLoading]);

  useEffect(() => {
    autoPlayAudioRef.current = autoPlayAudio;
  }, [autoPlayAudio]);

  useEffect(() => {
    userInputTextRef.current = userInputText;
  }, [userInputText]);

  // ─────────────────────────────────────────────────────────────────
  // SEND USER MESSAGE TO AI BACKEND
  // ─────────────────────────────────────────────────────────────────
  const sendUserMessageToAi = useCallback(
    async (messageText: string, currentScenario?: ConversationScenario) => {
      const activeScenario = currentScenario || selectedScenarioRef.current;
      const cleanText = messageText.trim();
      if (!cleanText || !activeScenario) return;

      const userMsg: AiChatMessage = {
        id: `user_${Date.now()}`,
        speaker: 'User',
        speakerName: 'You',
        text: cleanText,
        timestamp: Date.now(),
      };

      const updatedHistory = [...aiChatHistoryRef.current, userMsg];
      setAiChatHistory(updatedHistory);
      aiChatHistoryRef.current = updatedHistory;
      setUserInputText('');
      userInputTextRef.current = '';
      currentTranscriptRef.current = '';
      setIsAiLoading(true);
      isAiLoadingRef.current = true;
      setAiSuggestions([]);

      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/ai-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: activeScenario.id,
            scenarioTitle: activeScenario.title_en,
            speakerName: 'AI Partner',
            messages: updatedHistory.map((m) => ({ speaker: m.speaker, text: m.text })),
            userLevel: activeScenario.level,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        const aiMsg: AiChatMessage = {
          id: `ai_${Date.now()}`,
          speaker: 'AI',
          speakerName: data.speakerName || 'AI Partner',
          text: data.reply || "That's great! Could you tell me more?",
          meaning_lao: data.meaning_lao,
          feedback: data.feedback,
          timestamp: Date.now(),
        };

        const nextHistory = [...aiChatHistoryRef.current, aiMsg];
        setAiChatHistory(nextHistory);
        aiChatHistoryRef.current = nextHistory;

        if (data.suggestions && Array.isArray(data.suggestions)) {
          setAiSuggestions(data.suggestions);
        }

        if (autoPlayAudioRef.current && aiMsg.text) {
          playAudio(aiMsg.text);
        }
      } catch (err) {
        console.error('Failed to get AI response:', err);
      } finally {
        setIsAiLoading(false);
        isAiLoadingRef.current = false;
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────
  // START SCENARIO WITH DYNAMIC AI INITIATION
  // ─────────────────────────────────────────────────────────────────
  const startScenario = useCallback(
    async (scenario: ConversationScenario) => {
      stopAudio();
      setSelectedScenario(scenario);
      selectedScenarioRef.current = scenario;
      setAiChatHistory([]);
      aiChatHistoryRef.current = [];
      setUserInputText('');
      userInputTextRef.current = '';
      currentTranscriptRef.current = '';
      setAiSuggestions([]);
      setIsAiLoading(true);
      isAiLoadingRef.current = true;

      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/ai-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            scenarioTitle: scenario.title_en,
            speakerName: 'AI Partner',
            messages: [],
            userLevel: scenario.level,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        const now = Date.now();

        const initialAiMsg: AiChatMessage = {
          id: `ai_${now}`,
          speaker: 'AI',
          speakerName: data.speakerName || 'AI Partner',
          text: data.reply || `Welcome to ${scenario.title_en}! How can I help you today?`,
          meaning_lao: data.meaning_lao,
          feedback: data.feedback,
          timestamp: now,
        };

        setAiChatHistory([initialAiMsg]);
        aiChatHistoryRef.current = [initialAiMsg];
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setAiSuggestions(data.suggestions);
        }

        if (autoPlayAudioRef.current && initialAiMsg.text) {
          playAudio(initialAiMsg.text);
        }
      } catch (err) {
        console.error('Failed to initialize AI scenario:', err);
      } finally {
        setIsAiLoading(false);
        isAiLoadingRef.current = false;
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────
  // SPEECH RECOGNITION SETUP & CONTROLS
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as IWindowWithSpeech;
      const hasSupport = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
      setIsRecognitionSupported(hasSupport);
    }

    return () => {
      stopAudio();
      if (recognitionInstanceRef.current) {
        try {
          recognitionInstanceRef.current.onend = null;
          recognitionInstanceRef.current.onerror = null;
          recognitionInstanceRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Scroll to bottom of chat automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, isAiLoading]);

  // Start speech recognition
  const handleStartRecording = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as IWindowWithSpeech;
    const SpeechRecognitionConstructor =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsRecognitionSupported(false);
      return;
    }

    stopAudio();
    currentTranscriptRef.current = '';
    setUserInputText('');
    userInputTextRef.current = '';

    // Abort previous instance if any to ensure clean fresh state
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.onend = null;
        recognitionInstanceRef.current.onerror = null;
        recognitionInstanceRef.current.abort();
      } catch {}
      recognitionInstanceRef.current = null;
    }

    try {
      const rec = new SpeechRecognitionConstructor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i] && event.results[i][0]) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        const clean = transcript.trim();
        if (clean) {
          currentTranscriptRef.current = clean;
          setUserInputText(clean);
          userInputTextRef.current = clean;
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition status/error:', event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };

      rec.onend = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
      };

      rec.start();
      recognitionInstanceRef.current = rec;
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, []);

  // Stop speech recognition and send captured transcript
  const handleStopRecording = useCallback(() => {
    const rec = recognitionInstanceRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {}
    }
    setIsRecording(false);
    isRecordingRef.current = false;

    // Send the captured spoken text
    setTimeout(() => {
      const textToSend =
        currentTranscriptRef.current.trim() || userInputTextRef.current.trim();
      setUserInputText('');
      userInputTextRef.current = '';
      currentTranscriptRef.current = '';
      if (textToSend) {
        sendUserMessageToAi(textToSend);
      }
    }, 120);
  }, [sendUserMessageToAi]);

  const repeatLine = (text: string) => {
    stopAudio();
    playAudio(text);
  };

  const handleBack = () => {
    stopAudio();
    setSelectedScenario(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {!selectedScenario ? (
        <ScenarioSelection
          scenarios={conversationsData}
          onSelectScenario={startScenario}
        />
      ) : (
        <div className="space-y-4 animate-scale-up">
          {/* Top Navigation & Status Bar */}
          <ConversationHeader
            scenario={selectedScenario}
            showLaoTranslation={showLaoTranslation}
            autoPlayAudio={autoPlayAudio}
            onBack={handleBack}
            onToggleLaoTranslation={() => setShowLaoTranslation((prev) => !prev)}
            onToggleAutoPlayAudio={() => setAutoPlayAudio((prev) => !prev)}
          />

          {/* Main Practice Layout */}
          <div className="w-full">
            <div className="flex flex-col h-[75vh] rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
              <ChatMessageList
                messages={aiChatHistory}
                isAiLoading={isAiLoading}
                showLaoTranslation={showLaoTranslation}
                onPlayAudio={repeatLine}
                chatEndRef={chatEndRef}
              />

              <ChatInputArea
                userInputText={userInputText}
                onUserInputChange={setUserInputText}
                onSendMessage={sendUserMessageToAi}
                aiSuggestions={aiSuggestions}
                isAiLoading={isAiLoading}
                isRecording={isRecording}
                isRecognitionSupported={isRecognitionSupported}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                inputRef={inputRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
