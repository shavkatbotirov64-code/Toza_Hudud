import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'

const Reports = () => {
  const { showToast } = useAppContext()
  const { t } = useTranslation()
  const [period, setPeriod] = useState('today')

  const changeReportPeriod = (newPeriod) => {
    setPeriod(newPeriod)
    const periodText = {
      today: t('reports.daily'),
      week: t('reports.weekly'), 
      month: t('reports.monthly'),
      year: t('reports.yearly')
    }[newPeriod] || newPeriod
    showToast(`${periodText} ${t('reports.reportLoading')}`, 'info')
  }

  return (
    <div id="reportsTab" className="tab-content active">
      <div className="reports-dashboard">
        <div className="reports-header">
          <h3><i className="fas fa-chart-bar"></i> {t('reports.title')}</h3>
          <div className="report-period">
            <button
              className={`period-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => changeReportPeriod('today')}
            >
              {t('reports.daily')}
            </button>
            <button
              className={`period-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => changeReportPeriod('week')}
            >
              {t('reports.weekly')}
            </button>
            <button
              className={`period-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => changeReportPeriod('month')}
            >
              {t('reports.monthly')}
            </button>
            <button
              className={`period-btn ${period === 'year' ? 'active' : ''}`}
              onClick={() => changeReportPeriod('year')}
            >
              {t('reports.yearly')}
            </button>
          </div>
        </div>
        <div className="reports-grid">
          <div className="metric-card success">
            <div className="metric-header">
              <div className="metric-title">{t('reports.cleanedBins')}</div>
            </div>
            <div className="metric-value">856</div>
            <div className="metric-change change-up">+12.3% {t('reports.comparedToPrevious')}</div>
          </div>
          <div className="metric-card warning">
            <div className="metric-header">
              <div className="metric-title">{t('reports.avgFillLevel')}</div>
            </div>
            <div className="metric-value">65%</div>
            <div className="metric-change">-2.1% {t('reports.comparedToPrevious')}</div>
          </div>
          <div className="metric-card danger">
            <div className="metric-header">
              <div className="metric-title">{t('reports.alerts')}</div>
            </div>
            <div className="metric-value">18</div>
            <div className="metric-change change-up">+5 {t('reports.comparedToPrevious')}</div>
          </div>
          <div className="metric-card info">
            <div className="metric-header">
              <div className="metric-title">{t('reports.vehicleUsage')}</div>
            </div>
            <div className="metric-value">92%</div>
            <div className="metric-change change-up">+3.2% {t('reports.comparedToPrevious')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports

