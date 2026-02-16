import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppProvider } from './contexts/AppContext'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>,
)
