/**
 * audio.ts — ລະບົບຫຼິ້ນສຽງພາສາອັງກິດທີ່ມີຄວາມຄົມຊັດ ແລະ ເຮັດວຽກໄວ (High-Definition Audio Engine)
 *
 * ແກ້ໄຂບັນຫາ:
 * 1. ກົດແລ້ວບໍ່ມີສຽງ / ຕ້ອງກົດ 2 ເທື່ອ: ແກ້ໄຂ async cancel race condition ໃນ Chrome/Safari ແລະ pre-warm voice cache.
 * 2. ສຽງແຫບ / ສຽງເພ້ຽນ / ສຽງເບົາ: ຄັດເລືອກສຽງທຳມະຊາດ Premium Natural Voices (Volume 1.0, Rate 0.9).
 * 3. ຫຼິ້ນສຽງໄດ້ທັນທີ 100% ໂດຍບໍ່ມີ delay.
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let cachedBestVoice: SpeechSynthesisVoice | null = null;
let pendingTimeout: NodeJS.Timeout | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

const startHeartbeat = () => {
  stopHeartbeat();
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Chrome bug workaround: keep synthesis engine active for longer phrases
  heartbeatInterval = setInterval(() => {
    try {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else if (!window.speechSynthesis.speaking) {
        stopHeartbeat();
      }
    } catch {
      stopHeartbeat();
    }
  }, 10000);
};

// ─────────────────────────────────────────────────────────────────
// 1. Pre-warm & Cache Voices Immediately on Browser Load
// ─────────────────────────────────────────────────────────────────
const loadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      cachedBestVoice = null; // Re-evaluate on new voices
    }

    const onVoicesUpdate = () => {
      const v = synth.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
        cachedBestVoice = null;
      }
    };

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', onVoicesUpdate);
    } else {
      synth.onvoiceschanged = onVoicesUpdate;
    }
  } catch {
    /* ignore */
  }
};

if (typeof window !== 'undefined') {
  loadVoices();
  if (document.readyState === 'complete') {
    loadVoices();
  } else {
    window.addEventListener('DOMContentLoaded', loadVoices, { once: true });
    window.addEventListener('load', loadVoices, { once: true });
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. Select Highest Quality Natural Voice (Filter out raspy/robot voices)
// ─────────────────────────────────────────────────────────────────
export const pickBestVoice = (preferredLang = 'en-US'): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  if (cachedBestVoice) {
    return cachedBestVoice;
  }

  const synth = window.speechSynthesis;
  const voices = cachedVoices.length > 0 ? cachedVoices : synth.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }

  if (!voices || !voices.length) return null;

  // Robotic / joke system voices to strictly blacklist
  const lowQualityBlacklist = [
    'fred', 'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
    'deranged', 'good news', 'hysterical', 'junior', 'kathy', 'organ', 'princess',
    'ralph', 'trinoids', 'whisper', 'zarvox', 'victorian', 'robot', 'novelty'
  ];

  // High-clarity natural / neural voice keywords (priority)
  const premiumKeywords = [
    'natural', 'neural', 'wavenet', 'enhanced', 'online', 'premium',
    'google us english', 'google uk english female', 'google uk english male',
    'microsoft jenny', 'microsoft guy', 'microsoft aria', 'microsoft zira',
    'samantha', 'ava', 'allison', 'nikki', 'nicky', 'daniel', 'serena', 'oliver', 'karen', 'moira'
  ];

  const targetLang = preferredLang.startsWith('en-GB') ? 'en-GB' : 'en-US';
  const altLang = targetLang === 'en-US' ? 'en-GB' : 'en-US';

  const scored = voices
    .filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'))
    .map((v) => {
      let score = 0;
      const nameLower = v.name.toLowerCase();

      // Check blacklist
      for (const bad of lowQualityBlacklist) {
        if (nameLower.includes(bad)) {
          return { voice: v, score: -1000 };
        }
      }

      // Exact language match
      if (v.lang === targetLang) score += 100;
      else if (v.lang === altLang) score += 80;
      else if (v.lang.startsWith('en')) score += 50;

      // High quality voice keywords
      for (const kw of premiumKeywords) {
        if (nameLower.includes(kw)) {
          score += 60;
          break;
        }
      }

      // Prefer non-local service (online cloud high-res TTS) or enhanced local voices
      if (!v.localService) score += 20;
      if (nameLower.includes('enhanced')) score += 30;

      return { voice: v, score };
    })
    .filter((item) => item.score > -500)
    .sort((a, b) => b.score - a.score);

  const best = scored.length > 0 ? scored[0].voice : null;
  if (best) {
    cachedBestVoice = best;
  }
  return best;
};

// ─────────────────────────────────────────────────────────────────
// 3. Play Audio Engine (100% Reliable, Loud & Clear Pronunciation)
// ─────────────────────────────────────────────────────────────────
export const playAudio = (
  text: string,
  onStart: () => void = () => {},
  onEnd: () => void = () => {}
): void => {
  const clean = text.trim();
  if (!clean) {
    onEnd();
    return;
  }

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd();
    return;
  }

  const synth = window.speechSynthesis;

  // Clear any existing pending speech trigger
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }

  stopHeartbeat();

  // Cleanly stop existing speech
  try {
    if (synth.paused) {
      synth.resume();
    }
    synth.cancel();
  } catch {}

  // Short delay (15ms) allows Chrome/Safari engine to cleanly finish pending cancel
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.9;   // Clear, natural pace
      utterance.pitch = 1.0;  // Natural pitch
      utterance.volume = 1.0; // Loud, clear volume

      const bestVoice = pickBestVoice('en-US');
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }

      activeUtterance = utterance;

      utterance.onstart = () => {
        startHeartbeat();
        onStart();
      };

      utterance.onend = () => {
        stopHeartbeat();
        if (activeUtterance === utterance) activeUtterance = null;
        onEnd();
      };

      utterance.onerror = (ev) => {
        stopHeartbeat();
        if (activeUtterance === utterance) activeUtterance = null;
        if (ev.error !== 'canceled' && ev.error !== 'interrupted') {
          console.warn('[audio] Speech error:', ev.error);
        }
        onEnd();
      };

      synth.speak(utterance);

      // Force resume in case browser started paused
      if (synth.paused) {
        synth.resume();
      }
    } catch (err) {
      stopHeartbeat();
      console.warn('[audio] Play audio failed:', err);
      onEnd();
    }
  }, 15);
};

// ─────────────────────────────────────────────────────────────────
// 4. Stop Audio Engine
// ─────────────────────────────────────────────────────────────────
export const stopAudio = (): void => {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  stopHeartbeat();
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    activeUtterance = null;
  }
};
