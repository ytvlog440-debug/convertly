import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initGA } from './lib/analytics'
import './styles/index.css'

// Initialize Google Analytics 4 (production-only, lazy-loaded, DNT-compliant)
initGA()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register PWA Service Worker in production/supporting environments
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
