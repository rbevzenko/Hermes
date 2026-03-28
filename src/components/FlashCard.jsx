import { useState, useEffect, useCallback } from 'react';
import AIPanel from './AIPanel';
import { useGreekSpeech } from '../hooks/useGreekSpeech';

const STATUS_COLORS = {
  known:     { bg: '#22c55e', label: '✓ Знаю',    key: '1' },
  learning:  { bg: '#f59e0b', label: '~ Учу',     key: '2' },
  difficult: { bg: '#ef4444', label: '✗ Сложное', key: '3' },
};

export default function FlashCard({ words, onWordStatus, getWordStatus, session, onAnswer, onSkip, onEnd }) {
  const [flipped, setFlipped] = useState(false);
  const [aiWord, setAiWord]   = useState(null);
  const { speak, isSupported } = useGreekSpeech();

  const currentIndex = session?.currentIndex ?? 0;
  const word  = words[currentIndex];
  const total = words.length;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  const flip = useCallback(() => setFlipped(f => !f), []);

  const markStatus = useCallback((status) => {
    if (!word) return;
    onWordStatus(word.id, status);
    onAnswer(word.id, status !== 'difficult');
    setFlipped(false);
  }, [word, onWordStatus, onAnswer]);

  useEffect(() => {
    setFlipped(false);
    if (word) speak(word.greek);
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ')          { e.preventDefault(); flip(); }
      else if (e.key === '1')     markStatus('known');
      else if (e.key === '2')     markStatus('learning');
      else if (e.key === '3')     markStatus('difficult');
      else if (e.key === 'ArrowRight') { onAnswer(word?.id, true); setFlipped(false); }
      else if (e.key === 'ArrowLeft')  { onSkip(); setFlipped(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, markStatus, onAnswer, onSkip, word]);

  /* ── Session end ─────────────────────────────────────────── */
  if (!word) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--indigo)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem' }}>🏛️</div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontSize: '2.2rem', color: '#fff' }}>
          Сессия завершена!
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>
          Правильно: {session?.correct} / {total} &nbsp;·&nbsp; Серия: {session?.maxStreak}
        </div>
        <button onClick={onEnd} style={{
          marginTop: 8, padding: '14px 40px',
          background: 'var(--terracotta)', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: '1.2rem',
          fontFamily: 'Crimson Pro, serif', cursor: 'pointer',
        }}>
          Завершить
        </button>
      </div>
    );
  }

  const wordStatus = getWordStatus(word.id);

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--indigo)',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Progress bar ── */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.15)' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'var(--terracotta-light)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem',
      }}>
        <span>{currentIndex + 1} / {total}</span>
        <span style={{
          fontSize: '0.8rem', padding: '3px 10px', borderRadius: 12,
          background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',
        }}>
          {word.theme} · ур. {word.level}
        </span>
        <span>✅ {session?.correct ?? 0} &nbsp; 🔥 {session?.streak ?? 0}</span>
      </div>

      {/* ── Card area (tap to flip) ── */}
      <div
        onClick={flip}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && flip()}
        aria-label="Нажмите, чтобы перевернуть"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px', cursor: 'pointer', userSelect: 'none',
          gap: 20,
        }}
      >
        {!flipped ? (
          <>
            <div style={{
              fontFamily: 'IM Fell English, serif',
              fontSize: 'clamp(2.4rem, 8vw, 4rem)',
              color: '#fff', textAlign: 'center', lineHeight: 1.2,
            }}>
              {word.greek}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.45)', fontSize: '1rem',
              fontStyle: 'italic',
            }}>
              {word.pos}
            </div>
            {isSupported && (
              <button
                onClick={e => { e.stopPropagation(); speak(word.greek); }}
                title="Произнести"
                style={{
                  marginTop: 12, background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                  color: 'rgba(255,255,255,0.7)', padding: '6px 16px',
                  fontSize: '1.1rem', cursor: 'pointer',
                }}
              >🔊</button>
            )}
            <div style={{
              marginTop: 16, color: 'rgba(255,255,255,0.35)',
              fontSize: '0.9rem', letterSpacing: '0.05em',
            }}>
              нажмите, чтобы увидеть перевод
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontFamily: 'IM Fell English, serif',
              fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
              color: 'rgba(255,255,255,0.55)', textAlign: 'center',
              lineHeight: 1.2,
            }}>
              {word.greek}
            </div>
            <div style={{
              width: 48, height: 2,
              background: 'rgba(255,255,255,0.25)', borderRadius: 1,
            }} />
            <div style={{
              fontFamily: 'Crimson Pro, serif',
              fontSize: 'clamp(2rem, 7vw, 3.2rem)',
              color: '#fff', textAlign: 'center', lineHeight: 1.3,
              fontWeight: 500,
            }}>
              {word.ru}
            </div>
            {word.example ? (
              <div style={{
                marginTop: 8, color: 'rgba(255,255,255,0.5)',
                fontSize: '1rem', textAlign: 'center', fontStyle: 'italic',
                maxWidth: 480,
              }}>
                {word.example}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* ── Status buttons ── */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
        {Object.entries(STATUS_COLORS).map(([status, { bg, label, key }]) => (
          <button
            key={status}
            onClick={(e) => { e.stopPropagation(); markStatus(status); }}
            style={{
              flex: 1, padding: '16px 8px',
              background: bg, color: '#fff',
              border: 'none', borderRadius: 12,
              fontSize: '1.05rem', fontFamily: 'Crimson Pro, serif',
              fontWeight: 600, cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
              transition: 'filter 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.12)'}
            onMouseLeave={e => e.currentTarget.style.filter = ''}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = ''}
          >
            {label}
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>[{key}]</span>
          </button>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px 20px',
      }}>
        <button
          onClick={() => { onSkip(); setFlipped(false); }}
          style={{
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontFamily: 'Crimson Pro, serif', fontSize: '0.95rem', cursor: 'pointer',
          }}
        >
          ← пропустить
        </button>

        <button
          onClick={() => setAiWord(word)}
          style={{
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
            padding: '8px 14px', fontFamily: 'Crimson Pro, serif',
            fontSize: '0.9rem', cursor: 'pointer',
          }}
        >
          🤖 AI
        </button>
      </div>

      {aiWord && <AIPanel word={aiWord} onClose={() => setAiWord(null)} />}
    </div>
  );
}
