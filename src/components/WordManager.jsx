import { useState, useMemo, useRef } from 'react';
import { VOCABULARY } from '../data/vocabulary';
import { useLocalStorage } from '../hooks/useStorage';

const THEMES = [...new Set(VOCABULARY.map(w => w.theme))].sort();
const POS_OPTIONS = ['сущ. м.р.', 'сущ. ж.р.', 'сущ. ср.р.', 'глагол', 'прил.', 'нареч.', 'предлог', 'мест.', 'числ.', 'союз', 'межд.'];

const EMPTY_FORM = { greek: '', ru: '', pos: 'сущ. м.р.', theme: THEMES[0], level: 1, example: '', exampleRu: '' };

export default function WordManager({ wordStatus, setWordStatus }) {
  const [customWords, setCustomWords] = useLocalStorage('greek_custom_words', []);
  const [search, setSearch] = useState('');
  const [filterTheme, setFilterTheme] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef(null);
  const PAGE_SIZE = 50;

  const allWords = useMemo(() => [
    ...VOCABULARY,
    ...customWords.map(w => ({ ...w, custom: true })),
  ], [customWords]);

  const filtered = useMemo(() => {
    return allWords.filter(w => {
      if (filterTheme !== 'all' && w.theme !== filterTheme) return false;
      if (filterLevel !== 'all' && w.level !== parseInt(filterLevel)) return false;
      if (filterStatus !== 'all') {
        const s = wordStatus[w.id] || 'new';
        if (s !== filterStatus) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return w.greek.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allWords, filterTheme, filterLevel, filterStatus, search, wordStatus]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const handleFilterTheme = (e) => { setFilterTheme(e.target.value); setPage(1); };

  const handleFormChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!form.greek.trim() || !form.ru.trim()) return;
    const newWord = {
      ...form,
      id: `custom_${Date.now()}`,
      level: parseInt(form.level),
    };
    setCustomWords(prev => [...prev, newWord]);
    setForm(EMPTY_FORM);
    setShowAddForm(false);
  };

  const handleDeleteCustom = (id) => {
    setCustomWords(prev => prev.filter(w => w.id !== id));
  };

  const handleExport = () => {
    const data = {
      wordStatus,
      customWords,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greek_vocab_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.customWords) setCustomWords(data.customWords);
        if (data.wordStatus) {
          Object.entries(data.wordStatus).forEach(([id, status]) => {
            setWordStatus(id, status);
          });
        }
        alert('Данные импортированы!');
      } catch {
        alert('Ошибка чтения файла');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const statusLabel = { known: '🟢 Знаю', learning: '🟡 Учу', difficult: '🔴 Сложное', new: '◯ Новое' };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontFamily: 'IM Fell English, serif', fontSize: '2rem', color: 'var(--terracotta)' }}>
          Словарь ({filtered.length} / {allWords.length})
        </h2>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport} title="Экспортировать данные">
            ↓ Экспорт
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} title="Импортировать данные">
            ↑ Импорт
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(f => !f)}>
            {showAddForm ? '✕ Отмена' : '+ Добавить слово'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card p-4 mb-4 animate-fade-in">
          <h3 style={{ fontFamily: 'IM Fell English, serif', marginBottom: '1rem', color: 'var(--indigo)' }}>
            Новое слово
          </h3>
          <form onSubmit={handleAddWord}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Греческое *</label>
                <input value={form.greek} onChange={e => handleFormChange('greek', e.target.value)} placeholder="ο άνθρωπος" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Перевод *</label>
                <input value={form.ru} onChange={e => handleFormChange('ru', e.target.value)} placeholder="человек" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Часть речи</label>
                <select value={form.pos} onChange={e => handleFormChange('pos', e.target.value)}>
                  {POS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Тема</label>
                <select value={form.theme} onChange={e => handleFormChange('theme', e.target.value)}>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Уровень</label>
                <select value={form.level} onChange={e => handleFormChange('level', e.target.value)}>
                  <option value={1}>1 — Начальный</option>
                  <option value={2}>2 — Средний</option>
                  <option value={3}>3 — Продвинутый</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Пример (гр.)</label>
                <input value={form.example} onChange={e => handleFormChange('example', e.target.value)} placeholder="Ο άνθρωπος είναι καλός." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>Пример (рус.)</label>
                <input value={form.exampleRu} onChange={e => handleFormChange('exampleRu', e.target.value)} placeholder="Человек хороший." />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4">Добавить</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <div>
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Поиск..."
              aria-label="Поиск слов"
            />
          </div>
          <div>
            <select value={filterTheme} onChange={handleFilterTheme} aria-label="Фильтр по теме">
              <option value="all">Все темы</option>
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(1); }} aria-label="Фильтр по уровню">
              <option value="all">Все уровни</option>
              <option value="1">Уровень 1</option>
              <option value="2">Уровень 2</option>
              <option value="3">Уровень 3</option>
            </select>
          </div>
          <div>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} aria-label="Фильтр по статусу">
              <option value="all">Все статусы</option>
              <option value="known">🟢 Знаю</option>
              <option value="learning">🟡 Учу</option>
              <option value="difficult">🔴 Сложные</option>
              <option value="new">◯ Новые</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card mb-4" style={{ overflowX: 'auto' }}>
        <table className="word-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Греческий</th>
              <th>Русский</th>
              <th>Ч.р.</th>
              <th>Тема</th>
              <th>Ур.</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((w, idx) => {
              const s = wordStatus[w.id] || 'new';
              return (
                <tr key={w.id}>
                  <td style={{ color: '#aaa', fontSize: '0.8rem' }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="greek-text" style={{ fontWeight: 500 }}>{w.greek}</td>
                  <td>{w.ru}</td>
                  <td style={{ color: '#888', fontSize: '0.85rem' }}>{w.pos}</td>
                  <td style={{ fontSize: '0.85rem' }}>{w.theme}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: 3, background: 'var(--parchment-dark)', fontSize: '0.8rem' }}>
                      {w.level}
                    </span>
                  </td>
                  <td>
                    <select
                      value={s}
                      onChange={e => setWordStatus(w.id, e.target.value)}
                      style={{ width: 'auto', fontSize: '0.85rem', padding: '0.2rem 0.4rem' }}
                      aria-label={`Статус слова ${w.greek}`}
                    >
                      <option value="new">◯ Новое</option>
                      <option value="known">🟢 Знаю</option>
                      <option value="learning">🟡 Учу</option>
                      <option value="difficult">🔴 Сложное</option>
                    </select>
                  </td>
                  <td>
                    {w.custom && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteCustom(w.id)}
                        title="Удалить"
                        style={{ padding: '0.15rem 0.4rem', color: 'var(--terracotta)' }}
                        aria-label={`Удалить слово ${w.greek}`}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center p-4 text-muted">Ничего не найдено</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
          <span style={{ fontSize: '0.9rem' }}>Стр. {page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
        </div>
      )}
    </div>
  );
}
