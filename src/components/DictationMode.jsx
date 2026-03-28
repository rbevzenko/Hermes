import { useState, useEffect, useRef, useCallback } from 'react';
import AIPanel from './AIPanel';

// Levenshtein distance with proper Unicode (Greek) character support
function levenshtein(a, b) {
  const al = [...a]; // spread to handle unicode codepoints
  const bl = [...b];
  const m = al.length;
  const n = bl.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (al[i - 1] === bl[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Normalize Greek text: remove diacritics for comparison
function normalizeGreek(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritical marks
    .replace(/[άα]/g, 'α')
    .replace(/[έε]/g, 'ε')
    .replace(/[ήη]/g, 'η')
    .replace(/[ίιϊΐ]/g, 'ι')
    .replace(/[όο]/g, 'ο')
    .replace(/[ύυϋΰ]/g, 'υ')
    .replace(/[ώω]/g, 'ω')
    .trim();
}

function checkAnswer(input, word) {
  const correct = word.greek;

  // Remove article for checking (first word)
  const correctNoArticle = correct.includes(' ')
    ? correct.split(' ').slice(1).join(' ')
    : correct;

  const inputTrimmed = input.trim();

  // Exact match (full with article or without)
  if (inputTrimmed === correct || inputTrimmed === correctNoArticle) {
    return { result: 'exact', distance: 0 };
  }

  // Normalized (ignore accents)
  const normInput = normalizeGreek(inputTrimmed);
  const normCorrect = normalizeGreek(correct);
  const normCorrectNoArticle = normalizeGreek(correctNoArticle);

  if (normInput === normCorrect || normInput === normCorrectNoArticle) {
    return { result: 'close', distance: 0, note: 'Акцент неправильный' };
  }

  // Fuzzy: Levenshtein ≤ 2
  const dist1 = levenshtein(normInput, normCorrect);
  const dist2 = levenshtein(normInput, normCorrectNoArticle);
  const dist = Math.min(dist1, dist2);

  if (dist <= 2) {
    return { result: 'close', distance: dist, note: dist === 0 ? 'Акцент неправильный' : `Опечатка (${dist} символа)` };
  }

  return { result: 'wrong', distance: dist };
}

export default function DictationMode({ words, session, onAnswer, onSkip, onEnd }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // null | {result, distance, note}
  const [hint, setHint] = useState(0); // 0=none, 1=article, 2=first2letters
  const [aiWord, setAiWord] = useState(null);
  const inputRef = useRef(null);

  const currentIndex = session?.currentIndex ?? 0;
  const word = words[currentIndex];
  const total = words.length;

  useEffect(() => {
    setInput('');
    setResult(null);
    setHint(0);
    inputRef.current?.focus();
  }, [currentIndex]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!word || result) return;
    if (!input.trim()) {
      setHint(h => Math.min(h + 1, 2));
      return;
    }
    const check = checkAnswer(input, word);
    setResult(check);
    onAnswer(word.id, check.result !== 'wrong');
  }, [word, input, result, onAnswer]);

  const handleNext = useCallback(() => {
    if (!result) {
      onSkip();
      return;
    }
    onAnswer(word.id, result.result !== 'wrong');
  }, [result, word, onAnswer, onSkip]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' && result) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [result, handleNext]);

  if (!word) {
    return (
      <div className="text-center p-6 animate-fade-in">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
        <h2 style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '1rem' }}>
          Диктант завершён!
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

  // Build hint text
  let hintText = '';
  if (hint >= 1) {
    const parts = word.greek.split(' ');
    hintText = parts.length > 1 ? parts[0] + ' ' : '';
  }
  if (hint >= 2) {
    const parts = word.greek.split(' ');
    const wordPart = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
    const chars = [...wordPart];
    const revealed = chars.slice(0, 2).join('');
    const masked = chars.slice(2).map(() => '_').join('');
    hintText += revealed + masked;
  }

  const resultConfig = result ? {
    exact: { className: 'exact', icon: '✅', label: 'Точно!' },
    close: { className: 'close', icon: '🟡', label: result.note || 'Близко!' },
    wrong: { className: 'wrong', icon: '❌', label: `Неверно. Правильно: ${word.greek}` },
  }[result.result] : null;

  return (
    <div className="dictation-container animate-fade-in">
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
      </div>

      {/* Card */}
      <div className="dictation-card">
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '0.5rem' }}>
          {word.theme} · Уровень {word.level}
        </div>
        <div className="dictation-ru-word">{word.ru}</div>
        <div style={{ color: '#999', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {word.pos}
        </div>

        {/* Hint display */}
        {hint > 0 && (
          <div className="hint-text">{hintText}</div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <input
            ref={inputRef}
            className="dictation-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Введите по-гречески..."
            disabled={!!result}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Введите греческое слово"
          />
          {!result && (
            <div className="flex justify-center gap-3 mt-4">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setHint(h => Math.min(h + 1, 2))}
                disabled={hint >= 2}
                aria-label="Показать подсказку"
              >
                💡 Подсказка {hint > 0 && `(${hint}/2)`}
              </button>
              <button type="submit" className="btn btn-primary">
                Проверить <span className="kbd">Enter</span>
              </button>
            </div>
          )}
        </form>

        {/* Result */}
        {result && resultConfig && (
          <div className={`dictation-result ${resultConfig.className} animate-fade-in`}>
            <strong>{resultConfig.icon} {resultConfig.label}</strong>
            {result.result !== 'exact' && (
              <div style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}>
                <span style={{ fontFamily: 'Courier Prime, monospace' }}>{word.greek}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Example sentence (shown after answer) */}
      {result && (
        <div className="card p-4 mt-2 animate-fade-in" style={{ textAlign: 'center' }}>
          <div style={{ fontStyle: 'italic', color: 'var(--indigo)' }}>{word.example}</div>
          <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.25rem' }}>{word.exampleRu}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-4">
        <button className="btn btn-ghost btn-sm" onClick={() => setAiWord(word)} aria-label="Спросить AI">
          🤖 AI
        </button>
        {!result ? (
          <button className="btn btn-ghost btn-sm" onClick={onSkip} aria-label="Пропустить">
            Пропустить →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext} aria-label="Следующее слово">
            Следующее <span className="kbd">→</span>
          </button>
        )}
      </div>

      <div className="text-center mt-2 text-sm text-muted">
        <span className="kbd">Enter</span> проверить &nbsp;
        <span className="kbd">→</span> следующее
      </div>

      {aiWord && <AIPanel word={aiWord} onClose={() => setAiWord(null)} />}
    </div>
  );
}
