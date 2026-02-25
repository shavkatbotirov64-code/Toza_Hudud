import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSelector from './LanguageSelector'

const Header = ({ currentTab, onLogout }) => {
  const { theme, setTheme, showToast } = useAppContext()
  const { t } = useTranslation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('uz-UZ', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('uz-UZ', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'blue', 'green']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    setTheme(nextTheme)
    showToast(`Mavzu "${nextTheme}" mavzuga o'zgartirildi`, 'success')
  }

  const refreshData = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      showToast('Ma\'lumotlar yangilandi', 'success')
    }, 1500)
  }

  const languages = {
    uz: { name: 'O\'zbek', flag: '🇺🇿' },
    ru: { name: 'Русский', flag: '🇷🇺' },
    en: { name: 'English', flag: '🇬🇧' }
  }

  const handleLanguageChange = (lang) => {
    // Language change is now handled in LanguageSelector component
  }

  const titles = {
    dashboard: t('nav.dashboard'),
    bins: t('nav.bins'),
    vehicles: t('nav.vehicles'),
    liveMap: t('liveMap.title'),
    routes: t('nav.routes'),
    reports: t('nav.reports'),
    alerts: t('nav.alerts'),
    sensors: 'Esp32 Paneli',
    telegram: t('nav.telegram'),
    settings: t('nav.settings')
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return 'fa-sun'
      case 'blue':
        return 'fa-palette'
      case 'green':
        return 'fa-leaf'
      default:
        return 'fa-moon'
    }
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Language menu handling is now in LanguageSelector component
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <div className="breadcrumb">
          <span className="breadcrumb-item">{t('nav.dashboard')}</span>
          <i className="fas fa-chevron-right"></i>
          <span className="breadcrumb-item active">{titles[currentTab] || t('header.overview')}</span>
        </div>
        <h2 id="pageTitle">{titles[currentTab] || t('nav.dashboard')}</h2>
        <p id="pageSubtitle" className="header-subtitle">{t('header.subtitle')}</p>
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          <LanguageSelector />

          <button 
            className="header-btn" 
            onClick={toggleTheme}
            title={t('common.settings')}
          >
            <i className={`fas ${getThemeIcon()}`}></i>
          </button>
          
          <button 
            className="header-btn" 
            onClick={refreshData}
            title={t('common.refresh')}
            disabled={refreshing}
          >
            <i className={`fas fa-${refreshing ? 'spinner fa-spin' : 'sync-alt'}`}></i>
          </button>

          <button 
            className="header-btn" 
            onClick={onLogout}
            title="Chiqish"
            style={{ color: '#dc3545' }}
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
          
          <div className="time-display">
            <div className="time">{formatTime(currentTime)}</div>
            <div className="date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
