# Λεξιλόγιο — Greek Vocabulary Trainer

A Mediterranean-styled Greek vocabulary trainer with 2500 words, three training modes, and AI-powered explanations.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Adding Anthropic API Key

1. Copy `.env.example` to `.env`
2. Get your API key at https://console.anthropic.com/
3. Add it to `.env`: `VITE_ANTHROPIC_API_KEY=sk-ant-...`
4. Restart the dev server

Without a key the app works fully — only the AI panel shows a warning.

## Keyboard Shortcuts

### Flashcards
| Key | Action |
|-----|--------|
| `Space` | Flip card |
| `→` | Next word |
| `←` | Previous word |
| `1` | Mark as "Know" |
| `2` | Mark as "Learning" |
| `3` | Mark as "Difficult" |

### Quiz
| Key | Action |
|-----|--------|
| `1`–`4` | Select answer option |
| `→` / `Enter` | Next question |

### Dictation
| Key | Action |
|-----|--------|
| `Enter` | Check answer |
| `→` | Next word |

## Adding Custom Words

Go to **📚 Слова** → click **+ Добавить слово** → fill form → **Добавить**.
Custom words are stored in localStorage and can be exported/imported as JSON.

## Tech Stack

React 18 + Vite · Pure CSS · localStorage · Claude API

## License

MIT