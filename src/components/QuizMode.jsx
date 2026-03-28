import { useState, useEffect, useCallback, useRef } from 'react';
import AIPanel from './AIPanel';

function getDistractors(correctWord, allWords, count = 3) {
  // First: same theme + level
  const sameGroup = allWords.filter(w =>
    w.id !== correctWord.id &&
    w.theme === correctWord.theme &&
    w.level === correctWord.level
  );
  const pool = [...sameGroup];

  // Fallback: same theme
  if (pool.length < count) {
    const sameTheme = allWords.filter(w =>
      w.id !== correctWord.id &&
      w.theme === correctWord.theme &&
      !pool.find(p => p.id === w.id)
    );
    pool.push(...sameTheme);
  }

  // Fallback: random
  if (pool.length < count) {
    const others = allWords.filter(w =>
      w.id !== correctWord.id &&
      !pool.find(p => p.id === w.id)
    );
    pool.push(...others);
  }

  // Shuffle and pick
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const TIMER_SECONDS = 10;

export default function QuizMode({ words, allWords, direction, timerEnabled, session, onAnswer, onSkip, onEnd, getWordStatus }) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [aiWord, setAiWord] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [shakeClass, setShakeClass] = useState('');
  const timerRef = useRef(null);

  const currentIndex = session?.currentIndex ?? 0;
  const word = words[currentIndex];
  const total = words.length;

  // Build options for current word
  useEffect(() => {
    if (!word) return;
    const distractors = getDistractors(word, allWords);
    const all = shuffle([word, ...distractors]);
    setOptions(all);
    setSelected(null);
    setAnswered(false);
    setTimeLeft(TIMER_SECONDS);
    setShakeClass('');
  }, [currentIndex, word?.id]);

  // Timer
  useEffect(() => {
    if (!timerEnabled || answered || !word) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerEnabled, answered, word?.id]);

  const handleTimeout = useCallback(() => {
    setAnswered(true);
    setSelected('__timeout__');
    onAnswer(word?.id, false);
  }, [word, onAnswer]);

  const handleSelect = useCallback((opt) => {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelected(opt.id);
    setAnswered(true);
    const isCorrect = opt.id === word.id;
    onAnswer(word.id, isCorrect);
    if (!isCorrect) {
      setShakeClass('shake');
      setTimeout(() => setShakeClass(''), 500);
    }
  }, [answered, word, onAnswer]);

  const handleNext = useCallback(() => {
    if (!answered) {
      onSkip();
      return;
    }
    onAnswer(word.id, selected === word.id);
  }, [answered, word, selected, onAnswer, onSkip]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (options[idx]) handleSelect(options[idx]);
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (answered) handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, handleSelect, answered, handleNext]);

  if (!word) {
    return (
      <div className="text-center p-6 animate-fade-in">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
        <h2 style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '1rem' }}>
          Тест завершён!
        </h2>
        <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#666' }}>
          Правильно: {session?.correct} / {total}
        </p>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: '#666' }}>
          Макс. серия: {session?.maxStreak}
        </p>
        <button className="btn btn-primary btn-lg" onClick={onEnd}>Завершить</button>
      </div>
    );
  }

  const progress = (currentIndex / total) * 100;
  const isGrRu = direction === 'gr-ru';

  const getOptionClass = (opt) => {
    if (!answered) return 'quiz-option';
    if (opt.id === word.id) return 'quiz-option correct';
    if (opt.id === selected) return 'quiz-option wrong';
    return 'quiz-option';
  };

  const getOptionText = (opt) => isGrRu ? opt.ru : opt.greek;

  return (
    <div className={`quiz-container animate-fade-in ${shakeClass}`}>
      {/* Timer bar */}
      {timerEnabled && (
        <div className="timer-bar">
          <div
            className="timer-bar-fill"
            style={{
              width: `${(timeLeft / TIMER_SECONDS) * 100}%`,
              background: timeLeft <= 3 ? 'var(--terracotta)' : 'var(--indigo)',
            }}
          />
        </div>
      )}

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Stats */}
      <div className="session-bar">
        <span className="session-stat">📄 {currentIndex + 1} / {total}</span>
        <span className="session-stat">✅ {session?.correct ?? 0}</span>
        <span className="session-stat">❌ {session?.incorrect ?? 0}</span>
        <span className="session-stat">🔥 {session?.streak ?? 0}</span>
        {timerEnabled && <span className="session-stat" style={{ color: timeLeft <= 3 ? 'var(--terracotta)' : 'inherit' }}>⏱ {timeLeft}с</span>}
      </div>

      {/* Question card */}
      <div className="quiz-question-card">
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '0.5rem' }}>
          {word.theme} · Уровень {word.level} · {isGrRu ? 'Греческий → Русский' : 'Русский → Греческий'}
        </div>
        <div className="quiz-word">
          {isGrRu ? word.greek : word.ru}
        </div>
        {isGrRu && <div style={{ fontSize: '0.95rem', color: '#999', fontStyle: 'italic' }}>{word.pos}</div>}
      </div>

      {/* Options */}
      <div className="quiz-options">
        {options.map((opt, idx) => (
          <button
            key={opt.id}
            className={getOptionClass(opt)}
            onClick={() => handleSelect(opt)}
            disabled={answered}
            aria-label={`Вариант ${idx + 1}: ${getOptionText(opt)}`}
          >
            <span className="kbd" style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}>{idx + 1}</span>
            {getOptionText(opt)}
          </button>
        ))}
      </div>

      {/* Feedback after answer */}
      {answered && (
        <div className={`mt-4 animate-fade-in`} style={{ textAlign: 'center' }}>
          {selected === word.id ? (
            <div style={{ color: 'var(--olive)', fontSize: '1.1rem', fontWeight: 600 }}>
              ✅ Правильно! {session?.streak > 1 && `🔥 Серия: ${session.streak}`}
            </div>
          ) : (
            <div style={{ color: 'var(--terracotta)', fontSize: '1rem' }}>
              ❌ Верный ответ: <strong>{isGrRu ? word.ru : word.greek}</strong>
              {word.example && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                  {word.example}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-center gap-3 mt-4">
            <button className="btn btn-ghost btn-sm" onClick={() => setAiWord(word)}>
              🤖 Этимология
            </button>
            <button className="btn btn-primary" onClick={handleNext} aria-label="Следующий вопрос">
              Следующий <span className="kbd">→</span>
            </button>
          </div>
        </div>
      )}

      {!answered && (
        <div className="text-center mt-4 text-sm text-muted">
          <span className="kbd">1</span>–<span className="kbd">4</span> выбрать вариант
        </div>
      )}

      {aiWord && <AIPanel word={aiWord} onClose={() => setAiWord(null)} />}
    </div>
  );
}
