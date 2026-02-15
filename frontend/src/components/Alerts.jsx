import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useTranslation } from '../hooks/useTranslation'
import ApiService from '../services/api'

const Alerts = () => {
  const { alertsData, setAlertsData, showToast, apiConnected, refreshData } = useAppContext()
  const { handleAsyncError } = useErrorHandler()
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all')

  const filteredAlerts = alertsData.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'unread') return !alert.read
    return alert.type === filter
  })

  const markAsRead = async (alertId) => {
    if (apiConnected) {
      await handleAsyncError(async () => {
        const result = await ApiService.updateAlert(alertId, { isRead: true })
        if (result.success) {
          setAlertsData(prev => prev.map(alert =>
            alert.id === alertId ? { ...alert, read: true } : alert
          ))
          showToast(t('alerts.markAsRead'), 'success')
          refreshData()
        } else {
          throw new Error(result.error || t('alerts.markError'))
        }
      }, 'MarkAlertAsRead')
    } else {
      // Mock mode
      setAlertsData(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      ))
      showToast(t('alerts.markAsReadDemo'), 'success')
    }
  }

  const clearAllAlerts = async () => {
    if (!window.confirm(t('alerts.clearAllConfirm'))) return
    
    if (apiConnected) {
      await handleAsyncError(async () => {
        // Delete all alerts from backend
        const deletePromises = alertsData.map(alert => 
          ApiService.deleteAlert ? ApiService.deleteAlert(alert.id) : Promise.resolve()
        )
        await Promise.all(deletePromises)
        
        setAlertsData([])
        showToast(t('alerts.allCleared'), 'success')
        refreshData()
      }, 'ClearAllAlerts')
    } else {
      // Mock mode
      setAlertsData([])
      showToast(t('alerts.allClearedDemo'), 'success')
    }
  }

  const getIconClass = (type) => {
    switch (type) {
      case 'danger':
        return 'fa-exclamation-circle'
      case 'warning':
        return 'fa-exclamation-triangle'
      case 'info':
        return 'fa-info-circle'
      default:
        return 'fa-bell'
    }
  }

  return (
    <div id="alertsTab" className="tab-content active">
      <div className="section-header">
        <h3><i className="fas fa-bell"></i> {t('alerts.title')}</h3>
        <button className="btn btn-danger" onClick={clearAllAlerts}>
          <i className="fas fa-trash"></i> {t('alerts.clearAll')}
        </button>
      </div>

      <div className="alerts-container">
        <div className="alert-filters">
          <button
            className={`filter-badge ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{ 
              background: filter === 'all' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-secondary)',
              color: filter === 'all' ? 'white' : 'var(--text-secondary)',
              border: filter === 'all' ? 'none' : '1px solid var(--border-color)'
            }}
          >
            {t('alerts.all')} ({alertsData.length})
          </button>
          <button
            className={`filter-badge ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
            style={{ 
              background: filter === 'unread' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--bg-secondary)',
              color: filter === 'unread' ? 'white' : 'var(--text-secondary)',
              border: filter === 'unread' ? 'none' : '1px solid var(--border-color)'
            }}
          >
            {t('alerts.unread')} ({alertsData.filter(a => !a.read).length})
          </button>
          <button
            className={`filter-badge filter-badge-danger ${filter === 'danger' ? 'active' : ''}`}
            onClick={() => setFilter('danger')}
            style={{ 
              background: filter === 'danger' ? 'linear-gradient(135deg, var(--danger), #f87171)' : 'var(--bg-secondary)',
              color: filter === 'danger' ? 'white' : 'var(--text-secondary)',
              border: filter === 'danger' ? 'none' : '1px solid var(--border-color)'
            }}
          >
            {t('alerts.critical')} ({alertsData.filter(a => a.type === 'danger').length})
          </button>
          <button
            className={`filter-badge filter-badge-warning ${filter === 'warning' ? 'active' : ''}`}
            onClick={() => setFilter('warning')}
            style={{ 
              background: filter === 'warning' ? 'linear-gradient(135deg, var(--warning), #fbbf24)' : 'var(--bg-secondary)',
              color: filter === 'warning' ? 'white' : 'var(--text-secondary)',
              border: filter === 'warning' ? 'none' : '1px solid var(--border-color)'
            }}
          >
            {t('alerts.warning')} ({alertsData.filter(a => a.type === 'warning').length})
          </button>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <i className="fas fa-bell-slash" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
            <p>{t('alerts.noAlerts')}</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${!alert.read ? 'unread' : ''}`}>
              <div className={`alert-icon ${alert.type}`}>
                <i className={`fas ${getIconClass(alert.type)}`}></i>
              </div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  <span><i className="fas fa-map-marker-alt"></i> {alert.location}</span>
                  <span><i className="fas fa-clock"></i> {alert.time}</span>
                </div>
              </div>
              <div className="alert-actions">
                {!alert.read && (
                  <button className="btn-icon" onClick={() => markAsRead(alert.id)}>
                    <i className="fas fa-check"></i>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Alerts

