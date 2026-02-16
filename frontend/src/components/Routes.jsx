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
        {routesData.map((route) => (
          <div key={route.id} className="route-card">
            <div className="route-header">
              <div className="route-info">
                <div className="route-icon">
                  <i className="fas fa-route"></i>
                </div>
                <div className="route-details">
                  <div className="route-title">{route.name}</div>
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
                <div className="progress-fill" style={{ width: `${route.progress}%` }}></div>
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
        ))}
      </div>
    </div>
  )
}

export default Routes

