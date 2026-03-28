import { useState } from 'react';
import { VOCABULARY } from '../data/vocabulary';

const THEMES = ['all', ...new Set(VOCABULARY.map(w => w.theme))];
const COUNTS = [10, 20, 50, 100, 'all'];

export default function SessionModal({ onStart, onClose, defaultMode }) {
  const [theme, setTheme] = useState('all');
  const [level, setLevel] = useState('all');
  const [count, setCount] = useState(20);
  const [direction, setDirection] = useState('gr-ru');
  const [timer, setTimer] = useState(false);

  const handleStart = () => {
    let pool = VOCABULARY;
    if (theme !== 'all') pool = pool.filter(w => w.theme === theme);
    if (level !== 'all') pool = pool.filter(w => w.level === parseInt(level));

    // Shuffle
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const words = count === 'all' ? shuffled : shuffled.slice(0, parseInt(count));

    if (words.length === 0) {
      alert('Нет слов по выбранным фильтрам');
      return;
    }

    onStart({ words, direction, timer });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Настройки сессии">
      <div className="modal">
        <h2>Начать сессию</h2>

        <div className="modal-field">
          <label>Режим</label>
          <div style={{ padding: '0.3rem 0', color: 'var(--indigo)', fontFamily: 'IM Fell English, serif', fontSize: '1.1rem' }}>
            {{ flashcard: '🃏 Карточки', quiz: '❓ Тест', dictation: '🎧 Диктант' }[defaultMode] || defaultMode}
          </div>
        </div>

        <div className="modal-field">
          <label>Тема</label>
          <select value={theme} onChange={e => setTheme(e.target.value)} aria-label="Выбрать тему">
            <option value="all">Все темы</option>
            {[...new Set(VOCABULARY.map(w => w.theme))].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="modal-field">
          <label>Уровень</label>
          <div className="option-group">
            {[['all', 'Все'], ['1', '1'], ['2', '2'], ['3', '3']].map(([val, lbl]) => (
              <button key={val} className={`option-btn ${level === val ? 'selected' : ''}`} onClick={() => setLevel(val)}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-field">
          <label>Количество слов</label>
          <div className="option-group">
            {COUNTS.map(c => (
              <button key={c} className={`option-btn ${count === c ? 'selected' : ''}`} onClick={() => setCount(c)}>
                {c === 'all' ? 'Все' : c}
              </button>
            ))}
          </div>
        </div>

        {(defaultMode === 'quiz' || defaultMode === 'flashcard') && (
          <div className="modal-field">
            <label>Направление</label>
            <div className="option-group">
              <button className={`option-btn ${direction === 'gr-ru' ? 'selected' : ''}`} onClick={() => setDirection('gr-ru')}>
                Гр → Рус
              </button>
              <button className={`option-btn ${direction === 'ru-gr' ? 'selected' : ''}`} onClick={() => setDirection('ru-gr')}>
                Рус → Гр
              </button>
            </div>
          </div>
        )}

        {defaultMode === 'quiz' && (
          <div className="modal-field">
            <label>Таймер</label>
            <div className="option-group">
              <button className={`option-btn ${!timer ? 'selected' : ''}`} onClick={() => setTimer(false)}>Без таймера</button>
              <button className={`option-btn ${timer ? 'selected' : ''}`} onClick={() => setTimer(true)}>10 секунд</button>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ flex: 1 }}>
            Начать →
          </button>
        </div>
      </div>
    </div>
  );
}
