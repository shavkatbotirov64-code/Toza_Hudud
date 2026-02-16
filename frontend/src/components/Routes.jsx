import React from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'

const Routes = () => {
  const { showToast, routesData, updateRoute } = useAppContext()
  const { t } = useTranslation()

  const generateOptimizedRoutes = () => {
    showToast(t('routes.optimizing'), 'info')
    setTimeout(() => {
      showToast(t('routes.optimized'), 'success')
    }, 2000)
  }

  return (
    <div id="routesTab" className="tab-content active">
      <div className="section-header">
        <h3><i className="fas fa-route"></i> {t('routes.title')}</h3>
        <button className="btn btn-primary" onClick={generateOptimizedRoutes}>
          <i className="fas fa-magic"></i> {t('routes.optimize')}
        </button>
      </div>

      <div className="routes-container">
        {routesData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#666',
            fontSize: '16px'
          }}>
            <i className="fas fa-route" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
            <p>Hozircha faol marshrutlar yo'q</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Quti to'lganda mashina avtomatik yo'naladi va marshrut bu yerda ko'rinadi
            </p>
          </div>
        ) : (
          routesData.map((route) => (
          <div key={route.id} className={`route-card ${route.isActive ? 'active-route' : ''}`}>
            <div className="route-header">
              <div className="route-info">
                <div className="route-icon">
                  <i className={`fas ${route.isActive ? 'fa-truck-moving' : 'fa-route'}`}></i>
                </div>
                <div className="route-details">
                  <div className="route-title">
                    {route.name}
                    {route.isActive && <span className="active-badge">Faol</span>}
                  </div>
                  <div className="route-meta">
                    <span><i className="fas fa-truck"></i> {route.vehicle}</span>
                    <span><i className="fas fa-road"></i> {route.distance}</span>
                    <span><i className="fas fa-clock"></i> {route.estimatedTime}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="route-progress">
              <div className="progress-info">
                <span>{t('routes.progress')}</span>
                <span>{route.progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ 
                  width: `${route.progress}%`,
                  backgroundColor: route.isActive ? '#10b981' : '#3b82f6'
                }}></div>
              </div>
            </div>

            <div className="route-bins">
              {route.bins.map((binId) => (
                <span key={binId} className="bin-tag">
                  {binId}
                </span>
              ))}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  )
}

export default Routes

