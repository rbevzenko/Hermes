import { useState, useEffect, useCallback } from 'react';
import AIPanel from './AIPanel';

function StatusBadge({ status }) {
  const map = {
    known: { className: 'badge-known', label: '🟢 Знаю' },
    learning: { className: 'badge-learning', label: '🟡 Учу' },
    difficult: { className: 'badge-difficult', label: '🔴 Сложное' },
    new: { className: 'badge-new', label: '◯ Новое' },
  };
  const { className, label } = map[status] || map.new;
  return <span className={`badge ${className}`}>{label}</span>;
}

export default function FlashCard({ words, onWordStatus, getWordStatus, session, onAnswer, onSkip, onEnd }) {
  const [flipped, setFlipped] = useState(false);
  const [aiWord, setAiWord] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);

  const currentIndex = session?.currentIndex ?? 0;
  const word = words[currentIndex];
  const total = words.length;
  const progress = total > 0 ? ((currentIndex) / total) * 100 : 0;

  const flip = useCallback(() => setFlipped(f => !f), []);

  const markStatus = useCallback((status) => {
    if (!word) return;
    onWordStatus(word.id, status);
    onAnswer(word.id, status !== 'difficult');
    setFlipped(false);
    setTimeout(() => {}, 0);
  }, [word, onWordStatus, onAnswer]);

  const handleNext = useCallback(() => {
    setFlipped(false);
    onAnswer(word?.id, true);
  }, [word, onAnswer]);

  const handlePrev = useCallback(() => {
    setFlipped(false);
    onSkip();
  }, [onSkip]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          flip();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case '1':
          markStatus('known');
          break;
        case '2':
          markStatus('learning');
          break;
        case '3':
          markStatus('difficult');
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, handleNext, handlePrev, markStatus]);

  // Reset flip when word changes
  useEffect(() => {
    setFlipped(false);
  }, [currentIndex]);

  if (!word) {
    return (
      <div className="text-center p-6 animate-fade-in">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
        <h2 style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '1rem' }}>
          Сессия завершена!
        </h2>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: '#666' }}>
          Правильно: {session?.correct} / {total} · Серия: {session?.maxStreak}
        </p>
        <button className="btn btn-primary btn-lg" onClick={onEnd}>
          Завершить
        </button>
      </div>
    );
  }

  const wordStatus = getWordStatus(word.id);

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Session stats */}
      <div className="session-bar">
        <span className="session-stat">
          📄 {currentIndex + 1} / {total}
        </span>
        <span className="session-stat">
          ✅ {session?.correct ?? 0}
        </span>
        <span className="session-stat">
          🔥 {session?.streak ?? 0}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <StatusBadge status={wordStatus} />
        </span>
      </div>

      {/* Card */}
      <div className="flashcard-scene" onClick={flip} role="button" aria-label="Нажмите чтобы перевернуть карточку" tabIndex={0} onKeyDown={e => e.key === 'Enter' && flip()}>
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', marginBottom: '0.5rem' }}>
              {word.theme} · Уровень {word.level}
            </div>
            <div className="flashcard-word">{word.greek}</div>
            <div style={{ fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic' }}>{word.pos}</div>
            <div className="flashcard-hint">Пробел или нажмите, чтобы открыть</div>
          </div>

          {/* Back */}
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-translation">{word.ru}</div>
            <div className="flashcard-pos">{word.pos}</div>
            <div className="flashcard-example">
              <div style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.9)' }}>{word.example}</div>
              <div className="flashcard-example-ru">{word.exampleRu}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status buttons */}
      <div className="flex justify-center gap-3 mt-4" style={{ flexWrap: 'wrap' }}>
        <button
          className="btn btn-success"
          onClick={() => markStatus('known')}
          title="Знаю (1)"
          aria-label="Отметить как знаю"
        >
          🟢 Знаю <span className="kbd">1</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => markStatus('learning')}
          title="Учу (2)"
          aria-label="Отметить как учу"
        >
          🟡 Учу <span className="kbd">2</span>
        </button>
        <button
          className="btn btn-primary"
          onClick={() => markStatus('difficult')}
          title="Сложное (3)"
          aria-label="Отметить как сложное"
        >
          🔴 Сложное <span className="kbd">3</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-4">
        <button className="btn btn-ghost" onClick={handlePrev} aria-label="Предыдущее слово">
          ← <span className="kbd">←</span>
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setAiWord(word)}
          aria-label="Спросить AI"
        >
          🤖 Спросить AI
        </button>

        <button className="btn btn-ghost" onClick={handleNext} aria-label="Следующее слово">
          <span className="kbd">→</span> →
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-center mt-4 text-sm text-muted">
        <span className="kbd">Пробел</span> переворот &nbsp;
        <span className="kbd">←</span><span className="kbd">→</span> навигация &nbsp;
        <span className="kbd">1</span><span className="kbd">2</span><span className="kbd">3</span> статус
      </div>

      {/* AI Panel */}
      {aiWord && <AIPanel word={aiWord} onClose={() => setAiWord(null)} />}
    </div>
  );
}
