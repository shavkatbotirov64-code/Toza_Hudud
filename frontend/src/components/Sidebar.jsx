import React, { useMemo } from 'react'
import { useTranslation } from '../hooks/useTranslation'

const Sidebar = ({ currentTab, setCurrentTab, collapsed, setCollapsed }) => {
  const { t } = useTranslation()

  const navItems = useMemo(() => [
    { id: 'dashboard', icon: 'fa-chart-line', text: t('nav.dashboard') },
    { id: 'bins', icon: 'fa-trash-alt', text: t('nav.bins') },
    { id: 'vehicles', icon: 'fa-truck', text: t('nav.vehicles') },
    { id: 'liveMap', icon: 'fa-map-marked-alt', text: 'Jonli Xarita' },
    { id: 'routes', icon: 'fa-route', text: t('nav.routes') },
    { id: 'reports', icon: 'fa-chart-bar', text: t('nav.reports') },
    { id: 'alerts', icon: 'fa-bell', text: t('nav.alerts') },
    { id: 'sensors', icon: 'fa-microchip', text: 'ESP32 Sensors' },
    { id: 'telegram', icon: 'fa-paper-plane', text: t('nav.telegram') },
    { id: 'settings', icon: 'fa-cog', text: t('nav.settings') }
  ], [t])

  const handleLogout = () => {
    if (window.confirm(t('sidebar.logoutConfirm') || 'Chiqishni tasdiqlaysizmi?')) {
      localStorage.removeItem('isAuthenticated')
      window.location.reload()
    }
  }

  return (
    <aside id="sidebar" className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="logo-icon">
            <img src="/logo.png" alt="Toza Hudud AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="logo-text">
            <h1 className={collapsed ? 'logo-text-hidden' : ''}>Toza Hudud AI</h1>
            <p className={collapsed ? 'logo-text-hidden' : ''}>Smart Waste Management</p>
          </div>
        </div>
        <button 
          id="toggleSidebar" 
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(item.id)}
            data-tab={item.id}
          >
            <div className="nav-icon">
              <i className={`fas ${item.icon}`}></i>
            </div>
            <span className="nav-text">{item.text}</span>
            {item.badge !== undefined && (
              <span className={`nav-badge ${item.badgeClass || ''}`}>
                {item.badge}
              </span>
            )}
            {currentTab === item.id && <div className="nav-indicator"></div>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
          </div>
          <div className="user-info">
            <p className="user-name">Admin User</p>
            <p className="user-role">Super Admin</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
