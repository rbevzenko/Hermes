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
  const [theme, setTheme]       = useState('all');
  const [level, setLevel]       = useState('all');
  const [count, setCount]       = useState(20);
  const [direction, setDir]     = useState('gr-ru');
  const [timer, setTimer]       = useState(false);

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
    <button
      onClick={() => set(val)}
      style={{
        padding: '6px 14px', borderRadius: 6, border: '1.5px solid',
        borderColor: cur === val ? 'var(--indigo)' : 'var(--parchment-dark)',
        background: cur === val ? 'var(--indigo)' : 'transparent',
        color: cur === val ? '#fff' : 'var(--ink)',
        cursor: 'pointer', fontFamily: 'Crimson Pro, serif', fontSize: '0.95rem',
      }}
    >{label}</button>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'IM Fell English, serif', color: 'var(--terracotta)', marginBottom: 20 }}>
          {{ flashcard:'🃏 Карточки', quiz:'❓ Тест', dictation:'🎧 Диктант' }[mode]}
        </h2>

        <label style={lbl}>Тема</label>
        <select value={theme} onChange={e => setTheme(e.target.value)} style={sel}>
          <option value="all">Все темы</option>
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={lbl}>Уровень</label>
        <div style={row}>
          {[['all','Все'],['1','1'],['2','2'],['3','3']].map(([v,l]) =>
            <Opt key={v} val={v} cur={level} set={setLevel} label={l} />)}
        </div>

        <label style={lbl}>Слов в сессии</label>
        <div style={row}>
          {[10,20,50,100,'all'].map(c =>
            <Opt key={c} val={c} cur={count} set={setCount} label={c === 'all' ? 'Все' : c} />)}
        </div>

        {mode !== 'dictation' && <>
          <label style={lbl}>Направление</label>
          <div style={row}>
            <Opt val="gr-ru" cur={direction} set={setDir} label="Гр → Рус" />
            <Opt val="ru-gr" cur={direction} set={setDir} label="Рус → Гр" />
          </div>
        </>}

        {mode === 'quiz' && <>
          <label style={lbl}>Таймер</label>
          <div style={row}>
            <Opt val={false} cur={timer} set={setTimer} label="Без таймера" />
            <Opt val={true}  cur={timer} set={setTimer} label="10 секунд" />
          </div>
        </>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose} style={btnBase}>Отмена</button>
          <button className="btn-primary"   onClick={start}   style={{ ...btnBase, flex: 1 }}>Начать →</button>
        </div>
      </div>
    </div>
  );
}

const lbl    = { display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--indigo)', marginTop: 16, marginBottom: 6 };
const row    = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const sel    = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid var(--parchment-dark)', fontFamily: 'Crimson Pro, serif', fontSize: '1rem', background: 'var(--parchment)' };
const btnBase = { padding: '10px 20px', borderRadius: 6, fontSize: '1rem', cursor: 'pointer', border: 'none', fontFamily: 'Crimson Pro, serif' };

/* ── Welcome screen ───────────────────────────────────────── */
function Welcome({ mode, onStart, known }) {
  const info = {
    flashcard: { icon: '🃏', title: 'Карточки',  desc: 'Переворачивайте карточки и оценивайте своё знание слова.' },
    quiz:      { icon: '❓', title: 'Тест',       desc: 'Выберите правильный перевод из 4 вариантов.' },
    dictation: { icon: '🎧', title: 'Диктант',    desc: 'Читайте по-русски — пишите по-гречески.' },
  };
  const { icon, title, desc } = info[mode] || {};
  return (
    <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 12 }}>{icon}</div>
      <h2 style={{ fontFamily: 'IM Fell English, serif', fontSize: '2.2rem', color: 'var(--terracotta)', marginBottom: 12 }}>{title}</h2>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: 32 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
        <div><div style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--olive)' }}>{known}</div><div style={{ fontSize: '0.85rem', color: '#888' }}>знаю</div></div>
        <div><div style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--indigo)' }}>{VOCABULARY.length - known}</div><div style={{ fontSize: '0.85rem', color: '#888' }}>осталось</div></div>
        <div><div style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--terracotta)' }}>{VOCABULARY.length}</div><div style={{ fontSize: '0.85rem', color: '#888' }}>всего</div></div>
      </div>
      <button className="btn-primary" onClick={onStart} style={{ ...btnBase, fontSize: '1.2rem', padding: '12px 40px' }}>
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
      <div className="main">
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
