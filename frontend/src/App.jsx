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
  const [mapFocusTarget, setMapFocusTarget] = useState(null)
  const [tabTransitionPhase, setTabTransitionPhase] = useState('idle')
  const [tabTransitionDirection, setTabTransitionDirection] = useState('forward')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const contentRef = useRef(null)
  const swapTimerRef = useRef(null)
  const settleTimerRef = useRef(null)
  const wheelFrameRef = useRef(null)
  const wheelTargetRef = useRef(0)

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

  useEffect(() => {
    const container = contentRef.current
    if (!container || typeof window === 'undefined') return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      return undefined
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
    const isScrollable = (element) => {
      const style = window.getComputedStyle(element)
      const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY)
      return canScrollY && element.scrollHeight - element.clientHeight > 1
    }
    const canScrollInDirection = (element, deltaY) => {
      if (deltaY > 0) {
        return element.scrollTop + element.clientHeight < element.scrollHeight - 1
      }
      if (deltaY < 0) {
        return element.scrollTop > 1
      }
      return false
    }
    const findInnerScrollable = (startElement) => {
      let node = startElement
      while (node && node !== container) {
        if (node instanceof HTMLElement && isScrollable(node)) {
          return node
        }
        node = node.parentElement
      }
      return null
    }

    const stopAnimation = () => {
      if (wheelFrameRef.current) {
        cancelAnimationFrame(wheelFrameRef.current)
        wheelFrameRef.current = null
      }
    }

    const animate = () => {
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
      const target = clamp(wheelTargetRef.current, 0, maxScroll)
      wheelTargetRef.current = target

      const distance = target - container.scrollTop
      const easing = Math.min(0.24, Math.max(0.12, Math.abs(distance) / 700))
      const nextScroll = container.scrollTop + distance * easing

      container.scrollTop = nextScroll

      if (Math.abs(distance) <= 0.6) {
        container.scrollTop = target
        wheelFrameRef.current = null
        return
      }

      wheelFrameRef.current = requestAnimationFrame(animate)
    }

    const onWheel = (event) => {
      if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaY) < 1) {
        return
      }

      const targetElement = event.target instanceof HTMLElement ? event.target : null
      if (targetElement && targetElement.closest('.leaflet-container, [data-native-scroll="true"]')) {
        return
      }

      const innerScrollable = targetElement ? findInnerScrollable(targetElement) : null
      if (innerScrollable && canScrollInDirection(innerScrollable, event.deltaY)) {
        return
      }

      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
      if (maxScroll <= 0) return

      event.preventDefault()

      if (wheelFrameRef.current === null) {
        wheelTargetRef.current = container.scrollTop
      }

      wheelTargetRef.current = clamp(wheelTargetRef.current + event.deltaY * 0.95, 0, maxScroll)

      if (!wheelFrameRef.current) {
        wheelFrameRef.current = requestAnimationFrame(animate)
      }
    }

    const onScroll = () => {
      if (!wheelFrameRef.current) {
        wheelTargetRef.current = container.scrollTop
      }
    }

    wheelTargetRef.current = container.scrollTop
    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('scroll', onScroll)
      stopAnimation()
    }
  }, [])

  useEffect(() => {
    const handleNavigateToTab = (event) => {
      const requestedTab = event?.detail?.tab
      const requestedMapTarget = event?.detail?.mapTarget

      if (requestedMapTarget) {
        setMapFocusTarget({
          ...requestedMapTarget,
          requestId: Date.now()
        })
      }

      if (requestedTab && TAB_SEQUENCE.includes(requestedTab)) {
        setCurrentTab(requestedTab)
      }
    }

    window.addEventListener('navigateToTab', handleNavigateToTab)

    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab)
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
        return (
          <LiveMapSimple
            expanded
            focusTarget={mapFocusTarget}
            onFocusHandled={() => setMapFocusTarget(null)}
          />
        )
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
          <main className="content" ref={contentRef}>
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
