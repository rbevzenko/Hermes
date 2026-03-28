import { useState, useMemo } from 'react';
import { VOCABULARY } from '../data/vocabulary';

function PieChart({ known, learning, difficult, total }) {
  const newCount = Math.max(0, total - known - learning - difficult);
  const segments = [
    { value: known, color: '#5A6B1A', label: 'Знаю' },
    { value: learning, color: '#B8860B', label: 'Учу' },
    { value: difficult, color: '#C4522A', label: 'Сложное' },
    { value: newCount, color: '#C9B888', label: 'Новые' },
  ].filter(s => s.value > 0);

  if (total === 0) return <div className="text-muted text-center">Нет данных</div>;

  let cumulative = 0;
  const svgSegments = segments.map(s => {
    const ratio = s.value / total;
    const start = cumulative;
    cumulative += ratio;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const r = 80;
    const cx = 90, cy = 90;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = ratio > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    return { ...s, path };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Круговая диаграмма статуса слов">
        {svgSegments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#FAF6EE" strokeWidth="2" />
        ))}
        <text x="90" y="88" textAnchor="middle" fontFamily="IM Fell English, serif" fontSize="22" fill="#1A1208">{total}</text>
        <text x="90" y="108" textAnchor="middle" fontFamily="Crimson Pro, serif" fontSize="11" fill="#888">всего</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: s.color, display: 'inline-block', flexShrink: 0 }} />
            <span>{s.label}: <strong>{s.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '130px', paddingBottom: '28px', position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, height: 1, background: 'var(--parchment-dark)' }} />
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
          <div
            title={`${d.label}: ${d.value}`}
            style={{
              width: '100%',
              height: `${Math.max((d.value / max) * 96, d.value > 0 ? 3 : 0)}px`,
              background: 'var(--indigo)',
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.4s ease',
            }}
          />
          <div style={{
            fontSize: '0.6rem',
            color: '#888',
            transform: 'rotate(-40deg)',
            transformOrigin: 'top center',
            position: 'absolute',
            bottom: 0,
            whiteSpace: 'nowrap',
          }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Statistics({ wordStatus, sessionHistory, onResetProgress }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const counts = useMemo(() => {
    const c = { known: 0, learning: 0, difficult: 0 };
    Object.values(wordStatus).forEach(s => { if (s in c) c[s]++; });
    return c;
  }, [wordStatus]);

  const last14Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessionHistory.filter(s => s.date === dateStr);
      const value = daySessions.reduce((sum, s) => sum + (s.correct || 0), 0);
      const label = d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }).replace(' ', '\u00A0');
      return { label, value };
    });
  }, [sessionHistory]);

  const themeStats = useMemo(() => {
    const byTheme = {};
    VOCABULARY.forEach(w => {
      if (!byTheme[w.theme]) byTheme[w.theme] = { total: 0, known: 0 };
      byTheme[w.theme].total++;
      if (wordStatus[w.id] === 'known') byTheme[w.theme].known++;
    });
    return Object.entries(byTheme)
      .map(([theme, d]) => ({ theme, total: d.total, known: d.known, pct: Math.round((d.known / d.total) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [wordStatus]);

  const totalSessions = sessionHistory.length;
  const totalTime = sessionHistory.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalMinutes = Math.round(totalTime / 60);
  const maxStreak = sessionHistory.reduce((m, s) => Math.max(m, s.maxStreak || 0), 0);
  const totalAnswered = sessionHistory.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
  const totalCorrect = sessionHistory.reduce((sum, s) => sum + (s.correct || 0), 0);
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '1.5rem' }}>
        Статистика
      </h2>

      <div className="stats-grid">
        {[
          { value: counts.known, label: '🟢 Знаю' },
          { value: counts.learning, label: '🟡 Учу' },
          { value: counts.difficult, label: '🔴 Сложные' },
          { value: maxStreak, label: '🔥 Макс. серия' },
          { value: totalMinutes, label: '⏱ Минут учёбы' },
          { value: `${overallAccuracy}%`, label: '🎯 Точность' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-4">
        <h3 style={{ fontFamily: 'IM Fell English, serif', marginBottom: '1rem', color: 'var(--indigo)' }}>
          Распределение слов
        </h3>
        <PieChart known={counts.known} learning={counts.learning} difficult={counts.difficult} total={VOCABULARY.length} />
      </div>

      <div className="card p-6 mb-4">
        <h3 style={{ fontFamily: 'IM Fell English, serif', marginBottom: '1rem', color: 'var(--indigo)' }}>
          Правильных ответов за 14 дней
        </h3>
        <BarChart data={last14Days} />
      </div>

      <div className="card p-6 mb-4" style={{ overflowX: 'auto' }}>
        <h3 style={{ fontFamily: 'IM Fell English, serif', marginBottom: '1rem', color: 'var(--indigo)' }}>
          Прогресс по темам
        </h3>
        <table className="word-table">
          <thead>
            <tr><th>Тема</th><th>Всего</th><th>Знаю</th><th>Прогресс</th></tr>
          </thead>
          <tbody>
            {themeStats.map(t => (
              <tr key={t.theme}>
                <td>{t.theme}</td>
                <td>{t.total}</td>
                <td>{t.known}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--parchment-dark)', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
                      <div style={{ height: '100%', width: `${t.pct}%`, background: 'var(--olive)', borderRadius: 4 }} />
                    </div>
                    <span style={{ minWidth: '3ch', fontSize: '0.85rem' }}>{t.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalSessions > 0 && (
        <div className="card p-6 mb-4" style={{ overflowX: 'auto' }}>
          <h3 style={{ fontFamily: 'IM Fell English, serif', marginBottom: '1rem', color: 'var(--indigo)' }}>
            История сессий ({totalSessions})
          </h3>
          <table className="word-table">
            <thead>
              <tr><th>Дата</th><th>Режим</th><th>Правильно</th><th>Серия</th><th>Время</th></tr>
            </thead>
            <tbody>
              {sessionHistory.slice(0, 20).map(s => (
                <tr key={s.id}>
                  <td>{s.date}</td>
                  <td>{{ flashcard: '🃏 Карточки', quiz: '❓ Тест', dictation: '🎧 Диктант' }[s.mode] || s.mode}</td>
                  <td>{s.correct}/{s.totalWords}</td>
                  <td>🔥 {s.maxStreak}</td>
                  <td>{Math.round((s.duration || 0) / 60)} мин</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-4 mb-4">
        {!showConfirm ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(true)} style={{ color: 'var(--terracotta)' }}>
            🗑 Сбросить прогресс
          </button>
        ) : (
          <div style={{ padding: '1rem', background: '#fde8e2', borderRadius: 'var(--radius)', display: 'inline-block' }}>
            <p style={{ marginBottom: '0.75rem', color: '#8b2f18' }}>Вы уверены? Это удалит весь прогресс!</p>
            <div className="flex gap-3 justify-center">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>Отмена</button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--terracotta)' }}
                onClick={() => { onResetProgress(); setShowConfirm(false); }}
              >
                Удалить всё
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
