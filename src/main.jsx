import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Force-clear stale SW caches when app version changes.
// Bump APP_VERSION whenever a deploy breaks due to stale SW.
const APP_VERSION = '3';
(function clearStaleSWCache() {
  if (!('serviceWorker' in navigator)) return;
  if (sessionStorage.getItem('appV') === APP_VERSION) return;
  // Mark first so we don't loop if reload fails
  sessionStorage.setItem('appV', APP_VERSION);
  navigator.serviceWorker.getRegistrations()
    .then(regs => Promise.all(regs.map(r => r.unregister())))
    .then(() => ('caches' in window) ? caches.keys() : [])
    .then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => location.reload())
    .catch(() => {}); // silent fail — app still works without SW
})();

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          fontFamily: 'Crimson Pro, Georgia, serif',
          maxWidth: 600,
          margin: '60px auto',
          padding: '32px',
          background: '#F5ECD7',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(26,18,8,0.15)',
          color: '#1A1208'
        }}>
          <h2 style={{ fontFamily: 'IM Fell English, serif', color: '#C4522A', marginBottom: 16 }}>
            Ошибка загрузки
          </h2>
          <pre style={{
            background: '#1B2A6B',
            color: '#fff',
            padding: 16,
            borderRadius: 8,
            fontSize: '0.85rem',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {String(this.state.error)}
            {this.state.error?.stack ? '\n\n' + this.state.error.stack : ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 24px',
              background: '#C4522A',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: 'Crimson Pro, serif'
            }}
          >
            Перезагрузить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
