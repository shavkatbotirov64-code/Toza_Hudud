import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'

const Settings = () => {
  const { theme, setTheme, showToast } = useAppContext()
  const { t, language, setLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState('general')

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    showToast(`Mavzu "${newTheme}" ga o'zgartirildi`, 'success')
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    showToast(`Til ${newLanguage === 'uz' ? 'O\'zbek' : newLanguage === 'ru' ? 'Rus' : 'Ingliz'} tiliga o'zgartirildi`, 'success')
  }

  const themes = [
    { id: 'light', name: 'Yorug\'', icon: 'fa-sun', color: '#ffffff' },
    { id: 'dark', name: 'Qorong\'i', icon: 'fa-moon', color: '#1a1a1a' },
    { id: 'blue', name: 'Ko\'k', icon: 'fa-palette', color: '#1e40af' },
    { id: 'green', name: 'Yashil', icon: 'fa-leaf', color: '#059669' }
  ]

  const languages = [
    { id: 'uz', name: 'O\'zbek', flag: '🇺🇿' },
    { id: 'ru', name: 'Русский', flag: '🇷🇺' },
    { id: 'en', name: 'English', flag: '🇬🇧' }
  ]

  return (
    <div className="content-card">
      <div className="card-header">
        <h3><i className="fas fa-cog"></i> {t('nav.settings')}</h3>
      </div>
      <div className="card-body">
        {/* Settings Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fas fa-sliders-h"></i>
            Umumiy
          </button>
          <button 
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <i className="fas fa-palette"></i>
            Ko'rinish
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <i className="fas fa-bell"></i>
            Bildirishnomalar
          </button>
          <button 
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <i className="fas fa-server"></i>
            Tizim
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h4>Umumiy sozlamalar</h4>
              
              {/* Language Settings */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-globe"></i>
                  Til
                </label>
                <div className="language-options">
                  {languages.map(lang => (
                    <button
                      key={lang.id}
                      className={`language-btn ${language === lang.id ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang.id)}
                    >
                      <span className="flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Refresh */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-sync-alt"></i>
                  Avtomatik yangilanish
                </label>
                <div className="setting-control">
                  <select className="form-select">
                    <option value="5">5 soniya</option>
                    <option value="10">10 soniya</option>
                    <option value="30" selected>30 soniya</option>
                    <option value="60">1 daqiqa</option>
                  </select>
                </div>
              </div>

              {/* Date Format */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-calendar"></i>
                  Sana formati
                </label>
                <div className="setting-control">
                  <select className="form-select">
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-mm-dd" selected>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h4>Ko'rinish sozlamalari</h4>
              
              {/* Theme Settings */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-palette"></i>
                  Mavzu
                </label>
                <div className="theme-options">
                  {themes.map(themeOption => (
                    <button
                      key={themeOption.id}
                      className={`theme-btn ${theme === themeOption.id ? 'active' : ''}`}
                      onClick={() => handleThemeChange(themeOption.id)}
                    >
                      <div 
                        className="theme-preview" 
                        style={{ backgroundColor: themeOption.color }}
                      >
                        <i className={`fas ${themeOption.icon}`}></i>
                      </div>
                      <span>{themeOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-bars"></i>
                  Yon panel
                </label>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>Avtomatik yashirish</span>
                </div>
              </div>

              {/* Animation Settings */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-magic"></i>
                  Animatsiyalar
                </label>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>Animatsiyalarni yoqish</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h4>Bildirishnoma sozlamalari</h4>
              
              {/* Push Notifications */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-bell"></i>
                  Push bildirishnomalar
                </label>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>Yoqilgan</span>
                </div>
              </div>

              {/* Email Notifications */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-envelope"></i>
                  Email bildirishnomalar
                </label>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                  <span>O'chirilgan</span>
                </div>
              </div>

              {/* Sound Notifications */}
              <div className="setting-group">
                <label className="setting-label">
                  <i className="fas fa-volume-up"></i>
                  Ovozli bildirishnomalar
                </label>
                <div className="setting-control">
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>Yoqilgan</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-section">
              <h4>Tizim sozlamalari</h4>
              
              {/* System Info */}
              <div className="system-info">
                <div className="info-item">
                  <span className="info-label">Versiya:</span>
                  <span className="info-value">3.0.0</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Oxirgi yangilanish:</span>
                  <span className="info-value">2024-01-13</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tizim holati:</span>
                  <span className="info-value status-online">
                    <i className="fas fa-circle"></i>
                    Faol
                  </span>
                </div>
              </div>

              {/* System Actions */}
              <div className="system-actions">
                <button className="btn btn-primary">
                  <i className="fas fa-download"></i>
                  Ma'lumotlarni eksport qilish
                </button>
                <button className="btn btn-warning">
                  <i className="fas fa-broom"></i>
                  Keshni tozalash
                </button>
                <button className="btn btn-danger">
                  <i className="fas fa-redo"></i>
                  Tizimni qayta yuklash
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings