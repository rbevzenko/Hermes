import { useState, useEffect } from 'react';
import { useAnthropicAI } from '../hooks/useAnthropicAI';

const PRESET_QUESTIONS = [
  'Этимология и история слова',
  'Мнемоника для запоминания',
  'Примеры в предложениях (3 шт.)',
  'Родственные слова в других языках',
  'Грамматические особенности',
];

export default function AIPanel({ word, onClose }) {
  const { askAI, loading, response, error, reset, hasKey } = useAnthropicAI();
  const [activeChip, setActiveChip] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    reset();
    setActiveChip(null);
    setCustomQuestion('');
  }, [word?.id]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleChip = (q) => {
    setActiveChip(q);
    askAI(word, q);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setActiveChip(null);
    askAI(word, customQuestion.trim());
  };

  if (!word) return null;

  return (
    <div className={`ai-panel ${visible ? 'entering' : 'leaving'}`} role="complementary" aria-label="AI помощник">
      <div className="ai-panel-header">
        <h3>🤖 AI помощник</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleClose}
          aria-label="Закрыть панель"
          style={{ color: 'var(--cream)', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          ✕
        </button>
      </div>

      <div className="ai-panel-body">
        {/* Word display */}
        <div className="ai-word-display">
          <div className="greek-text" style={{ fontSize: '1.5rem', color: 'var(--indigo)', fontWeight: 600 }}>
            {word.greek}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>{word.ru} · {word.pos}</div>
        </div>

        {!hasKey && (
          <div style={{
            padding: '0.75rem',
            background: '#fef9e0',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--gold)',
            fontSize: '0.9rem',
            color: '#856a00',
          }}>
            ⚠️ Добавьте API ключ в .env файл:<br />
            <code style={{ fontFamily: 'Courier Prime, monospace', fontSize: '0.85rem' }}>
              VITE_ANTHROPIC_API_KEY=your_key
            </code>
          </div>
        )}

        {/* Preset chips */}
        <div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--indigo)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Готовые вопросы
          </div>
          <div className="ai-chips">
            {PRESET_QUESTIONS.map(q => (
              <button
                key={q}
                className={`ai-chip ${activeChip === q ? 'active' : ''}`}
                onClick={() => handleChip(q)}
                disabled={loading}
                aria-pressed={activeChip === q}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Custom question */}
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customQuestion}
            onChange={e => setCustomQuestion(e.target.value)}
            placeholder="Свой вопрос..."
            disabled={loading}
            style={{ fontSize: '0.9rem' }}
            aria-label="Свой вопрос об этом слове"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !customQuestion.trim()}>
            →
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="ai-loading">
            <span /><span /><span />
            <span style={{ fontFamily: 'Crimson Pro, serif', marginLeft: '0.5rem' }}>Думаю...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: '0.75rem',
            background: '#fde8e2',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--terracotta)',
            fontSize: '0.9rem',
            color: '#8b2f18',
          }}>
            {error}
          </div>
        )}

        {/* Response */}
        {response && !loading && (
          <div className="ai-response animate-fade-in">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
