import React, { useState, useEffect, useRef } from 'react'
import LoadingScreen from './components/LoadingScreen'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Bins from './components/Bins'
import Vehicles from './components/Vehicles'
import LiveMapSimple from './components/LiveMapSimple'
import Routes from './components/Routes'
import Reports from './components/Reports'
import Alerts from './components/Alerts'
import Settings from './components/Settings'
import TelegramBot from './components/TelegramBot'
import Sensors from './components/Sensors'
import ToastContainer from './components/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

const TAB_SEQUENCE = [
  'dashboard',
  'bins',
  'vehicles',
  'liveMap',
  'routes',
  'reports',
  'alerts',
  'sensors',
  'telegram',
  'settings'
]

function AppContent() {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [displayTab, setDisplayTab] = useState('dashboard')
  const [tabTransitionPhase, setTabTransitionPhase] = useState('idle')
  const [tabTransitionDirection, setTabTransitionDirection] = useState('forward')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const swapTimerRef = useRef(null)
  const settleTimerRef = useRef(null)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }, [])

  useEffect(() => {
    if (currentTab === displayTab) return

    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current)
    }
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current)
    }

    const currentIndex = TAB_SEQUENCE.indexOf(displayTab)
    const nextIndex = TAB_SEQUENCE.indexOf(currentTab)
    const isForward = nextIndex === -1 || currentIndex === -1 || nextIndex >= currentIndex

    setTabTransitionDirection(isForward ? 'forward' : 'backward')
    setTabTransitionPhase('exit')

    swapTimerRef.current = setTimeout(() => {
      setDisplayTab(currentTab)
      setTabTransitionPhase('enter')

      settleTimerRef.current = setTimeout(() => {
        setTabTransitionPhase('idle')
      }, 320)
    }, 130)
  }, [currentTab, displayTab])

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current)
      }
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current)
      }
    }
  }, [])

  const handleLogin = (username, password) => {
    // Simple authentication - just check if username is "admin"
    if (username.toLowerCase() === 'admin') {
      localStorage.setItem('isAuthenticated', 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ 
              color: '#333', 
              marginBottom: '10px',
              fontSize: '28px',
              fontWeight: '600'
            }}>
              🗑️ Toza Hudud
            </h1>
            <p style={{ 
              color: '#666', 
              margin: '0',
              fontSize: '16px'
            }}>
              Admin Panel
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target)
            const username = formData.get('username')
            const password = formData.get('password')
            
            if (handleLogin(username, password)) {
              // Success handled in handleLogin
            } else {
              alert('Noto\'g\'ri login ma\'lumotlari. Username: admin')
            }
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500'
              }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="admin"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500'
              }}>
                Parol
              </label>
              <input
                type="password"
                name="password"
                placeholder="Istalgan parol"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Kirish
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666',
            textAlign: 'center'
          }}>
            <strong>Username:</strong> admin<br />
            <strong>Parol:</strong> istalgan
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = (tab = currentTab) => {
    switch (tab) {
      case 'dashboard':
        return <Dashboard />
      case 'bins':
        return <Bins />
      case 'vehicles':
        return <Vehicles />
      case 'liveMap':
        return <LiveMapSimple expanded />
      case 'routes':
        return <Routes />
      case 'reports':
        return <Reports />
      case 'alerts':
        return <Alerts />
      case 'sensors':
        return <Sensors />
      case 'telegram':
        return <TelegramBot />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header currentTab={currentTab} onLogout={handleLogout} />
          <main className="content">
            <ErrorBoundary>
              <div
                className={`tab-transition tab-transition--${tabTransitionPhase} tab-transition--${tabTransitionDirection}`}
              >
                {renderTabContent(displayTab)}
              </div>
            </ErrorBoundary>
          </main>
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}

function App() {
  return <AppContent />
}

export default App
