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

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultItem {
  isFinal?: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEvent {
  resultIndex?: number;
  results: {
    [index: number]: SpeechRecognitionResultItem;
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
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
  abort: () => void;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

// ─────────────────────────────────────────────────────────────────
// SPEECH RECOGNITION ACCURACY & CONTEXT-AWARE HELPERS
// ─────────────────────────────────────────────────────────────────
const tokenizeWords = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

// Fix common Web Speech API homophone mistakes for Southeast Asian English learners
const fixCommonHomophones = (text: string): string => {
  return text
    .replace(/\bcheck him\b/gi, 'check in')
    .replace(/\bchecking in\b/gi, 'check in')
    .replace(/\bsee the many\b/gi, 'see the menu')
    .replace(/\bhave the many\b/gi, 'have the menu')
    .replace(/\bcup of copy\b/gi, 'cup of coffee')
    .replace(/\ba copy please\b/gi, 'a coffee please')
    .replace(/\btable for too\b/gi, 'table for two')
    .replace(/\btable for to\b/gi, 'table for two')
    .replace(/\bhow much is dead\b/gi, 'how much is that')
    .replace(/\bhow much is death\b/gi, 'how much is that')
    .replace(/\bhave the built\b/gi, 'have the bill')
    .replace(/\bget the built\b/gi, 'get the bill')
    .replace(/\bpay the built\b/gi, 'pay the bill')
    .replace(/\bwhere is the bat room\b/gi, 'where is the bathroom')
    .replace(/\bwhere is the rest room\b/gi, 'where is the restroom')
    .replace(/\s+/g, ' ')
    .trim();
};

// Score and pick the most contextually accurate alternative from SpeechRecognitionResultItem
const pickBestAlternative = (
  resultItem: SpeechRecognitionResultItem,
  contextWords: Set<string>,
  suggestionPhrases: string[]
): string => {
  if (!resultItem || !resultItem[0]) return '';
  const altCount = Math.min(resultItem.length || 1, 5);
  if (altCount <= 1) {
    return fixCommonHomophones(resultItem[0].transcript || '');
  }

  let bestText = resultItem[0].transcript || '';
  let bestScore = -Infinity;

  for (let k = 0; k < altCount; k++) {
    const alt = resultItem[k];
    if (!alt || !alt.transcript) continue;
    const candidate = fixCommonHomophones(alt.transcript);
    const words = tokenizeWords(candidate);
    if (words.length === 0) continue;

    // Base score favors top acoustic candidate, with small step down for lower ranks
    const conf = typeof alt.confidence === 'number' && alt.confidence > 0 ? alt.confidence : 0.85;
    let score = conf * 100 - k * 6;

    // Bonus for words matching current scenario / AI suggestions / recent dialogue
    let matchedContextWords = 0;
    for (const w of words) {
      if (contextWords.has(w)) {
        matchedContextWords++;
      }
    }
    score += (matchedContextWords / words.length) * 28;

    // Strong bonus if candidate closely matches one of the active AI suggested replies
    const candidateJoined = words.join(' ');
    for (const sug of suggestionPhrases) {
      const sugWords = tokenizeWords(sug);
      const sugJoined = sugWords.join(' ');
      if (candidateJoined === sugJoined) {
        score += 60;
        break;
      }
      if (sugJoined.includes(candidateJoined) || candidateJoined.includes(sugJoined)) {
        score += 22;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestText = candidate;
    }
  }

  return fixCommonHomophones(bestText);
};

// If the full spoken utterance is a near-exact match (e.g. 1 misheard homophone word)
// to one of the active suggested replies on screen, snap to the clean suggested sentence
const refineWithSuggestions = (transcript: string, suggestions: Suggestion[]): string => {
  const fixed = fixCommonHomophones(transcript);
  const spokenWords = tokenizeWords(fixed);
  if (spokenWords.length < 2 || suggestions.length === 0) return fixed;

  let bestSuggestion: string | null = null;
  let bestSimilarity = 0;

  for (const sug of suggestions) {
    const sugWords = tokenizeWords(sug.text);
    if (sugWords.length === 0) continue;

    // Word count must be very close (within 1 word)
    if (Math.abs(sugWords.length - spokenWords.length) > 1) continue;

    const sugSet = new Set(sugWords);
    let overlap = 0;
    for (const w of spokenWords) {
      if (sugSet.has(w)) overlap++;
    }

    // Positional match check
    let positionalMatches = 0;
    const minLen = Math.min(spokenWords.length, sugWords.length);
    for (let i = 0; i < minLen; i++) {
      if (spokenWords[i] === sugWords[i]) {
        positionalMatches++;
      } else if (
        spokenWords[i].length >= 3 &&
        sugWords[i].length >= 3 &&
        spokenWords[i].slice(0, 2) === sugWords[i].slice(0, 2)
      ) {
        // Same initial sound (homophone / accent variation)
        positionalMatches += 0.65;
      }
    }

    const maxLen = Math.max(spokenWords.length, sugWords.length);
    const similarity = Math.max(overlap / maxLen, positionalMatches / maxLen);

    if (similarity >= 0.78 && similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestSuggestion = sug.text;
    }
  }

  return bestSuggestion || fixed;
};

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
  const [micError, setMicError] = useState<string | null>(null);

  // Refs to avoid stale closures & handle lifecycle cleanly
  const selectedScenarioRef = useRef<ConversationScenario | null>(null);
  const aiChatHistoryRef = useRef<AiChatMessage[]>([]);
  const aiSuggestionsRef = useRef<Suggestion[]>([]);
  const isAiLoadingRef = useRef<boolean>(false);
  const autoPlayAudioRef = useRef<boolean>(true);
  const userInputTextRef = useRef<string>('');
  const sessionIdRef = useRef<number>(0);

  // Speech Recognition instance & transcripts
  const recognitionInstanceRef = useRef<ISpeechRecognition | null>(null);
  const committedTranscriptRef = useRef<string>('');
  const currentTranscriptRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const wantsToRecordRef = useRef<boolean>(false);
  const shouldSendOnEndRef = useRef<boolean>(false);
  const startDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tailCaptureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    selectedScenarioRef.current = selectedScenario;
  }, [selectedScenario]);

  useEffect(() => {
    aiChatHistoryRef.current = aiChatHistory;
  }, [aiChatHistory]);

  useEffect(() => {
    aiSuggestionsRef.current = aiSuggestions;
  }, [aiSuggestions]);

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
      if (!cleanText || !activeScenario || isAiLoadingRef.current) return;

      const requestSessionId = sessionIdRef.current;

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

        // Ignore stale response if user already navigated back or switched scenario
        if (sessionIdRef.current !== requestSessionId) return;

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        if (sessionIdRef.current !== requestSessionId) return;

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
        if (sessionIdRef.current !== requestSessionId) return;
        console.error('Failed to get AI response:', err);
        const fallbackReply: AiChatMessage = {
          id: `ai_${Date.now()}`,
          speaker: 'AI',
          speakerName: 'AI Partner',
          text: "I heard you! That's interesting, could you please tell me more?",
          meaning_lao: "ຂ້ອຍໄດ້ຍິນເຈົ້າແລ້ວ! ໜ້າສົນໃຈຫຼາຍ, ເຈົ້າຊ່ວຍບອກຂ້ອຍຕື່ມອີກໜ້ອຍໜຶ່ງໄດ້ບໍ່?",
          timestamp: Date.now(),
        };
        const nextHistory = [...aiChatHistoryRef.current, fallbackReply];
        setAiChatHistory(nextHistory);
        aiChatHistoryRef.current = nextHistory;
      } finally {
        if (sessionIdRef.current === requestSessionId) {
          setIsAiLoading(false);
          isAiLoadingRef.current = false;
        }
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
      sessionIdRef.current += 1;
      const requestSessionId = sessionIdRef.current;

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

        if (sessionIdRef.current !== requestSessionId) return;

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        if (sessionIdRef.current !== requestSessionId) return;

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
        if (sessionIdRef.current !== requestSessionId) return;
        console.error('Failed to initialize AI scenario, using fallback greeting:', err);
        const fallbackMsg: AiChatMessage = {
          id: `ai_${Date.now()}`,
          speaker: 'AI',
          speakerName: 'AI Partner',
          text: `Welcome to ${scenario.title_en}! How can I help you today?`,
          meaning_lao: `ຍິນດີຕ້ອນຮັບສູ່ ${scenario.title_lao}! ຂ້ອຍສາມາດຊ່ວຍຫຍັງເຈົ້າໄດ້ແດ່ໃນມື້ນີ້?`,
          timestamp: Date.now(),
        };
        setAiChatHistory([fallbackMsg]);
        aiChatHistoryRef.current = [fallbackMsg];
      } finally {
        if (sessionIdRef.current === requestSessionId) {
          setIsAiLoading(false);
          isAiLoadingRef.current = false;
        }
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────
  // SPEECH RECOGNITION SETUP & CONTROLS
  // ─────────────────────────────────────────────────────────────────
  const clearAllSpeechTimers = useCallback(() => {
    if (startDelayTimeoutRef.current) {
      clearTimeout(startDelayTimeoutRef.current);
      startDelayTimeoutRef.current = null;
    }
    if (tailCaptureTimeoutRef.current) {
      clearTimeout(tailCaptureTimeoutRef.current);
      tailCaptureTimeoutRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as IWindowWithSpeech;
      const hasSupport = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
      setIsRecognitionSupported(hasSupport);
    }

    return () => {
      stopAudio();
      clearAllSpeechTimers();
      wantsToRecordRef.current = false;
      if (recognitionInstanceRef.current) {
        try {
          recognitionInstanceRef.current.onend = null;
          recognitionInstanceRef.current.onerror = null;
          recognitionInstanceRef.current.onresult = null;
          recognitionInstanceRef.current.abort();
        } catch {}
      }
    };
  }, [clearAllSpeechTimers]);

  // Scroll to bottom of chat automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, isAiLoading]);

  // Safely finalize recognition and send captured transcript
  const finalizeAndSendTranscript = useCallback(() => {
    clearAllSpeechTimers();
    wantsToRecordRef.current = false;
    shouldSendOnEndRef.current = false;

    // Detach & close any lingering recognition instance so late events cannot leak
    const rec = recognitionInstanceRef.current;
    if (rec) {
      recognitionInstanceRef.current = null;
      try {
        rec.onend = null;
        rec.onerror = null;
        rec.onresult = null;
        rec.abort();
      } catch {}
    }

    setIsRecording(false);
    isRecordingRef.current = false;

    const rawText =
      currentTranscriptRef.current.trim() ||
      committedTranscriptRef.current.trim() ||
      userInputTextRef.current.trim();
    const finalRefinedText = refineWithSuggestions(rawText, aiSuggestionsRef.current);

    setUserInputText('');
    userInputTextRef.current = '';
    currentTranscriptRef.current = '';
    committedTranscriptRef.current = '';

    if (finalRefinedText) {
      sendUserMessageToAi(finalRefinedText);
    } else {
      setMicError(
        'ບໍ່ໄດ້ຍິນສຽງເວົ້າ ກະລຸນາເວົ້າໃກ້ໄມໂຄຣໂຟນ ແລະ ລອງໃໝ່ອີກຄັ້ງ (No speech detected, please try again)'
      );
    }
  }, [clearAllSpeechTimers, sendUserMessageToAi]);

  // Start speech recognition
  const handleStartRecording = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as IWindowWithSpeech;
    const SpeechRecognitionConstructor =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsRecognitionSupported(false);
      setMicError(
        'Browser ຂອງທ່ານບໍ່ຮອງຮັບ Speech Recognition (ແນະນຳໃຫ້ໃຊ້ Google Chrome ຫຼື Safari)'
      );
      return;
    }

    setMicError(null);
    clearAllSpeechTimers();

    // Check if TTS was actively playing so we can give the speaker 90ms to stop echoing into the mic
    const wasTtsSpeaking =
      typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.speaking;
    stopAudio();

    wantsToRecordRef.current = true;
    shouldSendOnEndRef.current = false;
    committedTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    setUserInputText('');
    userInputTextRef.current = '';

    // Abort previous instance if any to ensure clean fresh state
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.onend = null;
        recognitionInstanceRef.current.onerror = null;
        recognitionInstanceRef.current.onresult = null;
        recognitionInstanceRef.current.abort();
      } catch {}
      recognitionInstanceRef.current = null;
    }

    setIsRecording(true);
    isRecordingRef.current = true;

    // Build vocabulary context from scenario, suggestions, and recent AI turn
    const buildContextData = () => {
      const suggestionPhrases = aiSuggestionsRef.current.map((s) => s.text);
      const contextWords = new Set<string>();
      for (const phrase of suggestionPhrases) {
        for (const w of tokenizeWords(phrase)) contextWords.add(w);
      }
      if (selectedScenarioRef.current?.title_en) {
        for (const w of tokenizeWords(selectedScenarioRef.current.title_en)) {
          contextWords.add(w);
        }
      }
      const lastAiMsg = aiChatHistoryRef.current.slice(-1)[0];
      if (lastAiMsg?.text) {
        for (const w of tokenizeWords(lastAiMsg.text)) contextWords.add(w);
      }
      return { contextWords, suggestionPhrases };
    };

    const launchRecognitionInstance = () => {
      if (!wantsToRecordRef.current && !shouldSendOnEndRef.current) return;

      try {
        const rec = new SpeechRecognitionConstructor();
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 5;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsRecording(true);
          isRecordingRef.current = true;
          setMicError(null);
        };

        rec.onresult = (event: SpeechRecognitionEvent) => {
          const { contextWords, suggestionPhrases } = buildContextData();
          const segments: string[] = [];

          for (let i = 0; i < event.results.length; i++) {
            const resItem = event.results[i];
            if (!resItem || !resItem[0]) continue;

            const chosen = resItem.isFinal
              ? pickBestAlternative(resItem, contextWords, suggestionPhrases)
              : fixCommonHomophones(resItem[0].transcript || '');

            const cleanSeg = chosen.trim();
            if (!cleanSeg) continue;

            // Prevent Android/mobile Chrome cumulative duplicate bug where segment[i] repeats segment[i-1]
            if (segments.length > 0) {
              const prev = segments[segments.length - 1];
              const prevLower = prev.toLowerCase();
              const curLower = cleanSeg.toLowerCase();
              if (curLower === prevLower) {
                continue;
              }
              if (curLower.startsWith(prevLower + ' ') || curLower.startsWith(prevLower)) {
                segments[segments.length - 1] = cleanSeg;
                continue;
              }
              if (prevLower.startsWith(curLower + ' ')) {
                continue;
              }
            }

            segments.push(cleanSeg);
          }

          const sessionTranscript = segments.join(' ').replace(/\s+/g, ' ').trim();
          const baseCommitted = committedTranscriptRef.current.trim();
          const combined = [baseCommitted, sessionTranscript]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (combined) {
            const refined = refineWithSuggestions(combined, aiSuggestionsRef.current);
            currentTranscriptRef.current = refined;
            setUserInputText(refined);
            userInputTextRef.current = refined;
          }
        };

        rec.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition status/error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            wantsToRecordRef.current = false;
            shouldSendOnEndRef.current = false;
            setIsRecording(false);
            isRecordingRef.current = false;
            setMicError(
              'ກະລຸນາອະນຸຍາດການໃຊ້ໄມໂຄຣໂຟນ (Please allow microphone access in browser settings)'
            );
          } else if (event.error === 'network') {
            wantsToRecordRef.current = false;
            setMicError('ມີບັນຫາການເຊື່ອມຕໍ່ກັບບໍລິການ Speech Recognition');
            if (shouldSendOnEndRef.current) {
              finalizeAndSendTranscript();
            } else {
              setIsRecording(false);
              isRecordingRef.current = false;
            }
          }
          // Ignore 'no-speech' and 'aborted' during active hold so user can pause and keep speaking
        };

        rec.onend = () => {
          // If user already released button and wants to send, finalize immediately!
          if (shouldSendOnEndRef.current) {
            finalizeAndSendTranscript();
            return;
          }

          // If user is STILL holding the mic button (or in locked mode) and browser ended after a pause,
          // preserve what was spoken so far and seamlessly restart recognition!
          if (wantsToRecordRef.current) {
            if (currentTranscriptRef.current.trim()) {
              committedTranscriptRef.current = currentTranscriptRef.current.trim();
            }
            try {
              launchRecognitionInstance();
              return;
            } catch {}
          }

          setIsRecording(false);
          isRecordingRef.current = false;
        };

        rec.start();
        recognitionInstanceRef.current = rec;
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        wantsToRecordRef.current = false;
        setIsRecording(false);
        isRecordingRef.current = false;
        setMicError('ບໍ່ສາມາດເປີດໄມໂຄຣໂຟນໄດ້ ກະລຸນາກວດສອບສິດການໃຊ້ງານ');
      }
    };

    if (wasTtsSpeaking) {
      startDelayTimeoutRef.current = setTimeout(() => {
        startDelayTimeoutRef.current = null;
        launchRecognitionInstance();
      }, 90);
    } else {
      launchRecognitionInstance();
    }
  }, [clearAllSpeechTimers, finalizeAndSendTranscript]);

  // Stop speech recognition and send captured transcript
  const handleStopRecording = useCallback(() => {
    if (startDelayTimeoutRef.current) {
      clearTimeout(startDelayTimeoutRef.current);
      startDelayTimeoutRef.current = null;
    }

    const rec = recognitionInstanceRef.current;
    if (!rec || !isRecordingRef.current) {
      finalizeAndSendTranscript();
      return;
    }

    // Keep mic open for 280ms after button release so trailing syllables in the hardware audio buffer
    // are not cut off when using Hold-to-Speak!
    if (tailCaptureTimeoutRef.current) clearTimeout(tailCaptureTimeoutRef.current);
    tailCaptureTimeoutRef.current = setTimeout(() => {
      tailCaptureTimeoutRef.current = null;
      wantsToRecordRef.current = false;
      shouldSendOnEndRef.current = true;

      const activeRec = recognitionInstanceRef.current;
      if (!activeRec) {
        finalizeAndSendTranscript();
        return;
      }

      try {
        activeRec.stop();
      } catch {
        finalizeAndSendTranscript();
        return;
      }

      // Allow up to 1400ms for cloud STT to return the final sentence-rescored result (isFinal: true)
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = setTimeout(() => {
        if (shouldSendOnEndRef.current) {
          finalizeAndSendTranscript();
        }
      }, 1400);
    }, 280);
  }, [finalizeAndSendTranscript]);

  // Cancel speech recognition without sending
  const handleCancelRecording = useCallback(() => {
    clearAllSpeechTimers();
    wantsToRecordRef.current = false;
    shouldSendOnEndRef.current = false;

    const rec = recognitionInstanceRef.current;
    if (rec) {
      recognitionInstanceRef.current = null;
      try {
        rec.onend = null;
        rec.onerror = null;
        rec.onresult = null;
        rec.abort();
      } catch {}
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    committedTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    setUserInputText('');
    userInputTextRef.current = '';
  }, [clearAllSpeechTimers]);

  const repeatLine = (text: string) => {
    stopAudio();
    playAudio(text);
  };

  const handleBack = () => {
    sessionIdRef.current += 1;
    handleCancelRecording();
    stopAudio();
    setIsAiLoading(false);
    isAiLoadingRef.current = false;
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
                onCancelRecording={handleCancelRecording}
                micError={micError}
                onClearMicError={() => setMicError(null)}
                inputRef={inputRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
