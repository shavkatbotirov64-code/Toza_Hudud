import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'

// Keep only error logs by default.
// Set VITE_VERBOSE_LOGS=true to re-enable verbose browser logs.
const verboseLogsEnabled = import.meta.env.VITE_VERBOSE_LOGS === 'true'
if (!verboseLogsEnabled && typeof window !== 'undefined' && typeof console !== 'undefined') {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
  console.debug = () => {}
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
)
