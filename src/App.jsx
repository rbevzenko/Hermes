import { useState, useCallback } from 'react';
import { VOCABULARY, THEMES } from './data/vocabulary';
import { useWordStatus, useSessionHistory } from './hooks/useStorage';
import { useSession } from './hooks/useSession';
import FlashCard from './components/FlashCard';
import QuizMode from './components/QuizMode';
import DictationMode from './components/DictationMode';
import Statistics from './components/Statistics';
import WordManager from './components/WordManager';

const MODES = [
  { id: 'flashcard', label: '🃏 Карточки' },
  { id: 'quiz',      label: '❓ Тест' },
  { id: 'dictation', label: '🎧 Диктант' },
  { id: 'words',     label: '📚 Слова' },
  { id: 'stats',     label: '📊 Статистика' },
];

/* ── Session config modal ─────────────────────────────────── */
function SessionModal({ mode, onStart, onClose }) {
  const [theme, setTheme]   = useState('all');
  const [level, setLevel]   = useState('all');
  const [count, setCount]   = useState(20);
  const [direction, setDir] = useState('gr-ru');
  const [timer, setTimer]   = useState(false);

  const start = () => {
    let pool = VOCABULARY;
    if (theme !== 'all') pool = pool.filter(w => w.theme === theme);
    if (level !== 'all') pool = pool.filter(w => w.level === parseInt(level));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const words = count === 'all' ? shuffled : shuffled.slice(0, parseInt(count));
    if (!words.length) { alert('Нет слов по выбранным фильтрам'); return; }
    onStart({ words, direction, timer });
  };

  const Opt = ({ val, cur, set, label }) => (
    <button onClick={() => set(val)} style={{
      padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
      borderColor: cur === val ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
      background: cur === val ? 'rgba(255,255,255,0.2)' : 'transparent',
      color: cur === val ? '#fff' : 'rgba(255,255,255,0.6)',
      cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: '1rem',
      transition: 'all 0.15s',
    }}>{label}</button>
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--indigo)', borderRadius: 16, padding: '32px 28px',
        maxWidth: 460, width: '90%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{
          fontFamily: 'IM Fell English, serif', fontSize: '1.8rem',
          color: '#fff', marginBottom: 24, textAlign: 'center',
        }}>
          {{ flashcard: '🃏 Карточки', quiz: '❓ Тест', dictation: '🎧 Диктант' }[mode]}
        </h2>

        <div style={lbl}>Тема</div>
        <select value={theme} onChange={e => setTheme(e.target.value)} style={sel}>
          <option value="all">Все темы</option>
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={lbl}>Уровень</div>
        <div style={row}>
          {[['all','Все'],['1','1'],['2','2'],['3','3']].map(([v,l]) =>
            <Opt key={v} val={v} cur={level} set={setLevel} label={l} />)}
        </div>

        <div style={lbl}>Слов в сессии</div>
        <div style={row}>
          {[10,20,50,100,'all'].map(c =>
            <Opt key={c} val={c} cur={count} set={setCount} label={c === 'all' ? 'Все' : c} />)}
        </div>

        {mode !== 'dictation' && <>
          <div style={lbl}>Направление</div>
          <div style={row}>
            <Opt val="gr-ru" cur={direction} set={setDir} label="Гр → Рус" />
            <Opt val="ru-gr" cur={direction} set={setDir} label="Рус → Гр" />
          </div>
        </>}

        {mode === 'quiz' && <>
          <div style={lbl}>Таймер</div>
          <div style={row}>
            <Opt val={false} cur={timer} set={setTimer} label="Без таймера" />
            <Opt val={true}  cur={timer} set={setTimer} label="10 секунд" />
          </div>
        </>}

        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button onClick={onClose} style={{
            flex: 0, padding: '12px 20px', borderRadius: 10,
            background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontFamily: 'Crimson Pro, serif', fontSize: '1rem', cursor: 'pointer',
          }}>Отмена</button>
          <button onClick={start} style={{
            flex: 1, padding: '12px 20px', borderRadius: 10,
            background: 'var(--terracotta)', color: '#fff', border: 'none',
            fontFamily: 'Crimson Pro, serif', fontSize: '1.1rem',
            fontWeight: 600, cursor: 'pointer',
          }}>Начать →</button>
        </div>
      </div>
    </div>
  );
}

const lbl = { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginTop: 20, marginBottom: 8 };
const row = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const sel = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)', color: '#fff',
  fontFamily: 'Crimson Pro, serif', fontSize: '1rem',
};

/* ── Welcome screen ───────────────────────────────────────── */
function Welcome({ mode, onStart, known }) {
  const info = {
    flashcard: { title: 'Карточки',  desc: 'Переворачивайте карточки и оценивайте своё знание слова.' },
    quiz:      { title: 'Тест',      desc: 'Выберите правильный перевод из 4 вариантов.' },
    dictation: { title: 'Диктант',   desc: 'Читайте по-русски — пишите по-гречески.' },
  };
  const { title, desc } = info[mode] || {};
  const remaining = VOCABULARY.length - known;

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--indigo)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Omega watermark */}
      <div style={{
        position: 'absolute', bottom: -80, right: -40,
        fontFamily: 'IM Fell English, serif', fontSize: 320,
        color: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        lineHeight: 1, userSelect: 'none',
      }}>Ω</div>

      {/* Title */}
      <div style={{
        fontFamily: 'IM Fell English, serif',
        fontSize: 'clamp(2.4rem, 8vw, 4rem)',
        color: '#fff', marginBottom: 12, lineHeight: 1.1,
      }}>
        {title}
      </div>
      <div style={{
        color: 'rgba(255,255,255,0.55)', fontSize: '1.1rem',
        marginBottom: 48, maxWidth: 380,
      }}>
        {desc}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 48,
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {[
          { val: known,              label: 'знаю',    color: '#22c55e' },
          { val: remaining,          label: 'осталось', color: '#fff' },
          { val: VOCABULARY.length,  label: 'всего',   color: 'rgba(255,255,255,0.5)' },
        ].map(({ val, label, color }, i) => (
          <div key={label} style={{
            padding: '20px 32px', textAlign: 'center',
            borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}>
            <div style={{
              fontFamily: 'IM Fell English, serif',
              fontSize: '2.2rem', color, lineHeight: 1,
            }}>{val}</div>
            <div style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)',
              marginTop: 4, letterSpacing: '0.05em',
            }}>{label}</div>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button onClick={onStart} style={{
        padding: '16px 56px', borderRadius: 12,
        background: 'var(--terracotta)', color: '#fff',
        border: 'none', fontSize: '1.3rem',
        fontFamily: 'Crimson Pro, serif', fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.02em',
        boxShadow: '0 4px 20px rgba(196,82,42,0.4)',
        transition: 'filter 0.15s, transform 0.1s',
      }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={e => e.currentTarget.style.filter = ''}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={e => e.currentTarget.style.transform = ''}
      >
        Начать сессию →
      </button>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────────── */
export default function App() {
  const [activeMode, setActiveMode]     = useState('flashcard');
  const [showModal, setShowModal]       = useState(false);
  const [sessionCfg, setSessionCfg]     = useState(null);
  const [filterLevel, setFilterLevel]   = useState('all');

  const { status: wordStatus, setWordStatus, getWordStatus } = useWordStatus();
  const [sessionHistory]                = useSessionHistory();
  const { session, startSession, recordAnswer, skipWord, nextWord, endSession } = useSession();

  const known = Object.values(wordStatus).filter(s => s === 'known').length;

  const goMode = useCallback(id => {
    if (['flashcard', 'quiz', 'dictation'].includes(id)) {
      setActiveMode(id);
      if (!session) setShowModal(true);
    } else {
      setActiveMode(id);
    }
  }, [session]);

  const handleStart = useCallback(({ words, direction, timer }) => {
    setSessionCfg({ words, direction, timer });
    startSession(activeMode, words);
    setShowModal(false);
  }, [activeMode, startSession]);

  const handleAnswer = useCallback((wordId, isCorrect) => {
    recordAnswer(wordId, isCorrect);
    nextWord();
  }, [recordAnswer, nextWord]);

  const handleSkip = useCallback(() => { skipWord(); nextWord(); }, [skipWord, nextWord]);

  const handleEnd = useCallback(() => { endSession(); setSessionCfg(null); }, [endSession]);

  const handleReset = useCallback(() => {
    if (confirm('Сбросить весь прогресс?')) {
      localStorage.removeItem('greek_word_status');
      localStorage.removeItem('greek_session_history');
      window.location.reload();
    }
  }, []);

  const words = sessionCfg?.words ?? [];

  return (
    <>
      {/* Omega watermark */}
      <div style={{ position: 'fixed', bottom: -60, right: -30, fontFamily: 'IM Fell English, serif', fontSize: 300, color: 'var(--indigo)', opacity: 0.035, pointerEvents: 'none', userSelect: 'none', zIndex: 0, lineHeight: 1 }}>Ω</div>

      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo">Λεξιλόγιο</span>

        <div className="nav-tabs">
          {MODES.map(m => (
            <button key={m.id} className={`nav-tab ${activeMode === m.id ? 'active' : ''}`} onClick={() => goMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['all','1','2','3'].map(l => (
            <button key={l} onClick={() => setFilterLevel(l)} style={{
              width: 28, height: 28, borderRadius: '50%', border: '1.5px solid',
              borderColor: filterLevel === l ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
              background: filterLevel === l ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            }}>{l === 'all' ? '∀' : l}</button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className={activeMode === 'words' || activeMode === 'stats' || (session && activeMode !== 'flashcard') ? 'main' : ''}>
        {activeMode === 'flashcard' && (session
          ? <FlashCard words={words} session={session} onWordStatus={setWordStatus} getWordStatus={getWordStatus} onAnswer={handleAnswer} onSkip={handleSkip} onEnd={handleEnd} />
          : <Welcome mode="flashcard" onStart={() => setShowModal(true)} known={known} />
        )}
        {activeMode === 'quiz' && (session
          ? <QuizMode words={words} allWords={VOCABULARY} direction={sessionCfg?.direction ?? 'gr-ru'} timerEnabled={sessionCfg?.timer ?? false} session={session} onAnswer={handleAnswer} onSkip={handleSkip} onEnd={handleEnd} getWordStatus={getWordStatus} />
          : <Welcome mode="quiz" onStart={() => setShowModal(true)} known={known} />
        )}
        {activeMode === 'dictation' && (session
          ? <DictationMode words={words} session={session} onAnswer={handleAnswer} onSkip={handleSkip} onEnd={handleEnd} />
          : <Welcome mode="dictation" onStart={() => setShowModal(true)} known={known} />
        )}
        {activeMode === 'words' && <WordManager wordStatus={wordStatus} setWordStatus={setWordStatus} />}
        {activeMode === 'stats' && <Statistics wordStatus={wordStatus} sessionHistory={sessionHistory} onResetProgress={handleReset} />}
      </div>

      {showModal && <SessionModal mode={activeMode} onStart={handleStart} onClose={() => setShowModal(false)} />}
    </>
  );
}
