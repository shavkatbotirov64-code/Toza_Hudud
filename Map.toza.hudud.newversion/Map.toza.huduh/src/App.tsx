import { useEffect, useState } from 'react'
import { 
  FiUser, 
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiAlertTriangle
} from 'react-icons/fi'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import { useLanguage } from './contexts/LanguageContext'
import Login from './components/Login'
import Settings from './components/Settings'
import LiveMap from './components/LiveMap'

function App() {
  const { isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapFilter, setMapFilter] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<any>(null)
  const [driverStatus, setDriverStatus] = useState('working')

  if (!isAuthenticated) {
    return <Login />
  }

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  const getStatusColor = (status: number) => {
    if (status >= 90) return '#ef4444'
    if (status >= 70) return '#f59e0b'
    if (status >= 50) return '#eab308'
    if (status >= 30) return '#84cc16'
    return '#22c55e'
  }

  const handleStatusChange = (newStatus: string) => {
    setDriverStatus(newStatus)
    
    let message = ''
    if (newStatus === 'working') message = t('workStarted')
    else if (newStatus === 'onBreak') message = t('onBreakStatus')
    else if (newStatus === 'offDuty') message = t('workEnded')
    
    alert(t('statusUpdated') + ': ' + message)
  }

  const handleEmergency = () => {
    if (confirm(t('vehicleBreakdown') + '?')) {
      alert(t('callingAdmin'))
    }
  }

  // Filter containers - harita komponentidan olinadi
  const [bins, setBins] = useState([])
  
  let filteredContainers = bins
  if (mapFilter === 'full') {
    filteredContainers = bins.filter(bin => bin.status >= 90)
  } else if (mapFilter === 'warning') {
    filteredContainers = bins.filter(bin => bin.status >= 70 && bin.status < 90)
  } else if (mapFilter === 'empty') {
    filteredContainers = bins.filter(bin => bin.status < 30)
  }

  if (searchQuery.trim()) {
    filteredContainers = filteredContainers.filter(bin =>
      bin.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'dark' ? '#1f2937' : '#f9fafb',
      color: theme === 'dark' ? '#f9fafb' : '#1f2937'
    }}>
      {/* Top Bar */}
      <div style={{
        background: theme === 'dark' ? '#111827' : 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            padding: '8px'
          }}
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Driver Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            <FiUser />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Akmaljon Karimov</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>VEH-001</div>
          </div>
        </div>

        {/* Status Selector */}
        <select
          value={driverStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            padding: '8px 12px',
            border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: theme === 'dark' ? '#374151' : 'white',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="working">{t('working')}</option>
          <option value="onBreak">{t('onBreak')}</option>
          <option value="offDuty">{t('offDuty')}</option>
        </select>

        {/* Language */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'uz' | 'ru')}
          style={{
            padding: '8px 12px',
            border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: theme === 'dark' ? '#374151' : 'white',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="uz">🇺🇿</option>
          <option value="ru">🇷🇺</option>
        </select>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            padding: '8px 12px',
            border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: theme === 'dark' ? '#374151' : 'white',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Emergency Button */}
        <button
          onClick={handleEmergency}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            background: '#ef4444',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiAlertTriangle /> SOS
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '8px 12px',
            border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: theme === 'dark' ? '#374151' : 'white',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          <FiSettings />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            padding: '8px 12px',
            border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: theme === 'dark' ? '#374151' : 'white',
            color: theme === 'dark' ? '#f9fafb' : '#1f2937',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          <FiLogOut />
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: '320px',
            background: theme === 'dark' ? '#111827' : 'white',
            borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Search */}
            <div style={{ padding: '16px' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: theme === 'dark' ? '#374151' : 'white',
                    color: theme === 'dark' ? '#f9fafb' : '#1f2937',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Filters */}
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: t('all'), icon: '🌍' },
                { value: 'full', label: t('full'), icon: '🔴' },
                { value: 'warning', label: t('warning'), icon: '🟡' },
                { value: 'empty', label: t('empty'), icon: '🟢' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setMapFilter(filter.value)}
                  style={{
                    padding: '6px 12px',
                    border: mapFilter === filter.value ? '2px solid #3b82f6' : `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    background: mapFilter === filter.value ? '#eff6ff' : (theme === 'dark' ? '#374151' : 'white'),
                    color: mapFilter === filter.value ? '#3b82f6' : (theme === 'dark' ? '#f9fafb' : '#6b7280'),
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: '1 1 auto'
                  }}
                >
                  {filter.icon} {filter.label}
                </button>
              ))}
            </div>

            {/* Container List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', opacity: 0.7 }}>
                {filteredContainers.length} {t('containers')} {t('left')}
              </div>
              {filteredContainers.map(bin => (
                <div
                  key={bin.id}
                  onClick={() => setSelectedContainer(bin)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: theme === 'dark' ? '#1f2937' : '#f9fafb',
                    border: selectedContainer?.id === bin.id ? '2px solid #3b82f6' : `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{bin.id}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: getStatusColor(bin.status),
                      color: 'white'
                    }}>
                      {bin.status}%
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>
                    📍 {bin.address}
                  </div>
                  <div style={{
                    height: '6px',
                    background: theme === 'dark' ? '#374151' : '#e5e7eb',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${bin.status}%`,
                      background: getStatusColor(bin.status),
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yandex Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <LiveMap compact={false} />
        </div>
      </div>
    </div>
  )
}

export default App
