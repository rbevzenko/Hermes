import { useCallback, useEffect, useRef } from 'react';

export function useGreekSpeech() {
  const utteranceRef = useRef(null);

  // Cancel speech when component unmounts
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Strip article (ο/η/το) for cleaner pronunciation
    const word = text.replace(/^(ο|η|το)\s+/i, '').trim();

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'el-GR';
    utterance.rate = 0.85;
    utterance.pitch = 1;

    // Pick a Greek voice if available
    const voices = window.speechSynthesis.getVoices();
    const greekVoice = voices.find(v => v.lang.startsWith('el'));
    if (greekVoice) utterance.voice = greekVoice;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return { speak, stop, isSupported };
}
