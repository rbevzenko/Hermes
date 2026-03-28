import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 300;

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const debouncedSave = useRef(
    debounce((k, v) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        // storage full or unavailable
      }
    }, DEBOUNCE_MS)
  ).current;

  const setAndPersist = useCallback((value) => {
    setState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      debouncedSave(key, next);
      return next;
    });
  }, [key, debouncedSave]);

  return [state, setAndPersist];
}

export function useWordStatus() {
  const [status, setStatus] = useLocalStorage('greek_word_status', {});

  const setWordStatus = useCallback((id, newStatus) => {
    setStatus(prev => ({ ...prev, [id]: newStatus }));
  }, [setStatus]);

  const getWordStatus = useCallback((id) => {
    return status[id] || 'new';
  }, [status]);

  const getStatusCounts = useCallback(() => {
    const counts = { known: 0, learning: 0, difficult: 0, new: 0 };
    Object.values(status).forEach(s => {
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [status]);

  return { status, setWordStatus, getWordStatus, getStatusCounts };
}

export function useSettings() {
  return useLocalStorage('greek_settings', {
    mode: 'flashcard',
    direction: 'gr-ru',
    theme: 'all',
    level: 'all',
    timer: false,
    fontSize: 'normal',
    count: 20,
  });
}

export function useSessionHistory() {
  return useLocalStorage('greek_session_history', []);
}
