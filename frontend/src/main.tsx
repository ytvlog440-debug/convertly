import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initGA } from './lib/analytics'
import './styles/index.css'

// Initialize Google Analytics 4 (production-only, lazy-loaded, DNT-compliant) outside critical rendering path
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initGA(), { timeout: 3000 })
  } else {
    setTimeout(() => initGA(), 2000)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Clean up legacy service workers if any were registered previously
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {})
      }
    }).catch(() => {})
  })
}

