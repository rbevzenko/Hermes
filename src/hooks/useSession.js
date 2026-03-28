import { useState, useRef, useCallback } from 'react';
import { useSessionHistory } from './useStorage';

export function useSession() {
  const [history, setHistory] = useSessionHistory();
  const [session, setSession] = useState(null);
  const startTimeRef = useRef(null);

  const startSession = useCallback((mode, words) => {
    startTimeRef.current = Date.now();
    setSession({
      startTime: Date.now(),
      mode,
      words,
      currentIndex: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
      streak: 0,
      maxStreak: 0,
      wordResults: [],
    });
  }, []);

  const recordAnswer = useCallback((wordId, isCorrect) => {
    setSession(prev => {
      if (!prev) return null;
      const streak = isCorrect ? prev.streak + 1 : 0;
      return {
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        streak,
        maxStreak: Math.max(prev.maxStreak, streak),
        wordResults: [...prev.wordResults, { wordId, isCorrect, timestamp: Date.now() }],
      };
    });
  }, []);

  const skipWord = useCallback(() => {
    setSession(prev => prev ? { ...prev, skipped: prev.skipped + 1, streak: 0 } : null);
  }, []);

  const nextWord = useCallback(() => {
    setSession(prev => {
      if (!prev) return null;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const endSession = useCallback(() => {
    if (!session) return;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const summary = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      mode: session.mode,
      duration,
      correct: session.correct,
      incorrect: session.incorrect,
      skipped: session.skipped,
      maxStreak: session.maxStreak,
      totalWords: session.words.length,
    };
    setHistory(prev => [summary, ...prev].slice(0, 100));
    setSession(null);
  }, [session, setHistory]);

  const accuracy = session && (session.correct + session.incorrect) > 0
    ? Math.round((session.correct / (session.correct + session.incorrect)) * 100)
    : null;

  return { session, startSession, recordAnswer, skipWord, nextWord, endSession, accuracy };
}
