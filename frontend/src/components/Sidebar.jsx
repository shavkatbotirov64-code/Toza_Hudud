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
    { id: 'sensors', icon: 'fa-microchip', text: 'Esp32 Xabarlari' },
    { id: 'telegram', icon: 'fa-paper-plane', text: t('nav.telegram') },
    { id: 'settings', icon: 'fa-cog', text: t('nav.settings') }
  ], [t])

  const handleLogout = () => {
    if (window.confirm(t('sidebar.logoutConfirm') || 'Chiqishni tasdiqlaysizmi?')) {
      localStorage.removeItem('isAuthenticated')
      window.location.reload()
    }
  }

  const createWaterRipple = (event) => {
    const navButton = event.currentTarget
    if (!navButton) return

    const buttonRect = navButton.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'nav-item-water-ripple'

    const clickX = Number.isFinite(event.clientX)
      ? event.clientX - buttonRect.left
      : buttonRect.width / 2
    const clickY = Number.isFinite(event.clientY)
      ? event.clientY - buttonRect.top
      : buttonRect.height / 2

    const rippleSize = Math.max(buttonRect.width, buttonRect.height) * 1.9

    ripple.style.left = `${clickX}px`
    ripple.style.top = `${clickY}px`
    ripple.style.setProperty('--ripple-size', `${rippleSize}px`)

    const layers = ['core', 'ring-primary', 'ring-secondary', 'ring-tertiary', 'highlight']
    layers.forEach((layer) => {
      const layerElement = document.createElement('span')
      layerElement.className = `nav-item-water-layer ${layer}`
      ripple.appendChild(layerElement)
    })

    for (let index = 0; index < 7; index += 1) {
      const droplet = document.createElement('span')
      droplet.className = 'nav-item-water-droplet'
      const angle = Math.round((360 / 7) * index + Math.random() * 18 - 9)
      const distance = Math.round(rippleSize * (0.2 + Math.random() * 0.18))
      const delay = (Math.random() * 0.18).toFixed(2)
      const scale = (0.75 + Math.random() * 0.55).toFixed(2)
      droplet.style.setProperty('--droplet-angle', `${angle}deg`)
      droplet.style.setProperty('--droplet-distance', `${distance}px`)
      droplet.style.setProperty('--droplet-delay', `${delay}s`)
      droplet.style.setProperty('--droplet-scale', scale)
      ripple.appendChild(droplet)
    }

    navButton.appendChild(ripple)
    window.setTimeout(() => {
      ripple.remove()
    }, 1300)
  }

  const handleNavItemClick = (itemId, event) => {
    createWaterRipple(event)
    setCurrentTab(itemId)
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
            onClick={(event) => handleNavItemClick(item.id, event)}
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
