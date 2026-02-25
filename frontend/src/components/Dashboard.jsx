import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import LiveMapSimple from './LiveMapSimple'
import SensorDataPanel from './SensorDataPanel'

ChartJS.register(ArcElement, Tooltip, Legend)

const Dashboard = () => {
  const { 
    binsData, 
    vehiclesData, 
    activityData, 
    showToast, 
    apiConnected, 
    loading, 
    refreshData 
  } = useAppContext()
  const { t } = useTranslation()
  const [chartPeriod, setChartPeriod] = useState('today')

  // Calculate statistics
  const totalBins = binsData.length
  const fullBins = binsData.filter(bin => bin.status >= 90).length
  const activeBins = binsData.filter(bin => bin.online).length
  const activeBinsPercent = totalBins > 0 ? Math.round((activeBins / totalBins) * 100) : 0
  
  const totalVehicles = vehiclesData.length
  const activeVehicles = vehiclesData.filter(vehicle => vehicle.status === 'moving' || vehicle.status === 'active').length
  
  const todayCleaned = vehiclesData.reduce((sum, vehicle) => sum + vehicle.cleaned, 0)

  const calculateStatusDistribution = () => {
    const empty = binsData.filter(bin => bin.status < 30).length
    const half = binsData.filter(bin => bin.status >= 30 && bin.status < 70).length
    const warning = binsData.filter(bin => bin.status >= 70 && bin.status < 90).length
    const full = binsData.filter(bin => bin.status >= 90).length
    return [empty, half, warning, full]
  }

  const chartData = {
    labels: [t('dashboard.emptyBins'), t('dashboard.halfBins'), t('dashboard.warningBins'), t('dashboard.fullBins')],
    datasets: [{
      data: calculateStatusDistribution(),
      backgroundColor: ['#10b981', '#eab308', '#f59e0b', '#ef4444'],
      borderWidth: 2,
      borderColor: 'var(--bg-card)',
      hoverOffset: 20
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--text-primary)',
          padding: 20,
          usePointStyle: true,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} ta`
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 2000
    }
  }

  return (
    <div id="dashboardTab" className="tab-content active">
      {loading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="loading-spinner" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
            <div>{t('dashboard.loading')}</div>
          </div>
        </div>
      )}

      {/* API Connection Status */}
      <div className="api-status" style={{
        padding: '10px 15px',
        marginBottom: '20px',
        borderRadius: '8px',
        backgroundColor: apiConnected ? '#d1fae5' : '#fef3c7',
        border: `1px solid ${apiConnected ? '#10b981' : '#f59e0b'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className={`fas fa-${apiConnected ? 'check-circle' : 'exclamation-triangle'}`} 
             style={{ color: apiConnected ? '#10b981' : '#f59e0b' }}></i>
          <span style={{ color: apiConnected ? '#065f46' : '#92400e' }}>
            {apiConnected ? t('dashboard.apiConnected') : t('dashboard.demoMode')}
          </span>
        </div>
        <button 
          className="btn btn-sm btn-primary" 
          onClick={refreshData}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i> {t('dashboard.refresh')}
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-trash"></i>
            </div>
            <div className="stat-trend trend-up">
              <i className="fas fa-arrow-up"></i>
              <span>+5.2%</span>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{totalBins}</h3>
            <p className="stat-label">{t('dashboard.totalBins')}</p>
          </div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${activeBinsPercent}%` }}></div>
            </div>
            <span>{activeBinsPercent}% {t('dashboard.onlineShort')}</span>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{fullBins}</h3>
            <p className="stat-label">{t('dashboard.fullBins')}</p>
          </div>
          <div className="stat-badges">
            <span className="badge danger">2</span>
            <span className="badge warning">5</span>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-trend trend-up">
              <i className="fas fa-arrow-up"></i>
              <span>+12.3%</span>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{todayCleaned.toLocaleString()}</h3>
            <p className="stat-label">{t('dashboard.todayCleaned')}</p>
          </div>
          <div className="stat-footer">
            <span className="stat-change">{t('dashboard.comparedToPrevious')}</span>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-header">
            <div className="stat-icon">
              <i className="fas fa-truck"></i>
            </div>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{activeVehicles}/{totalVehicles}</h3>
            <p className="stat-label">{t('dashboard.activeVehicles')}</p>
          </div>
          <div className="stat-status">
            <div className="status-indicator online"></div>
            <span>{activeVehicles} {t('dashboard.activeShort')}</span>
          </div>
        </div>
      </div>

      {/* Map Row - full width map */}
      <div className="content-row map-row">
        <LiveMapSimple />
      </div>

      {/* ESP32 Sensor Data Panel */}
      <SensorDataPanel />

      {/* Quick Stats and Charts */}
      <div className="content-row">
        <div className="content-card chart-card">
          <div className="card-header">
            <h3><i className="fas fa-chart-pie"></i> {t('dashboard.binStatus')}</h3>
            <select 
              className="chart-filter" 
              value={chartPeriod}
              onChange={(e) => {
                setChartPeriod(e.target.value)
                const periodText = e.target.value === 'today' ? t('time.today') : 
                                 e.target.value === 'week' ? t('time.week') : t('time.month')
                showToast(`${periodText} ${t('dashboard.statisticsShowing')}`, 'info')
              }}
            >
              <option value="today">{t('time.today')}</option>
              <option value="week">{t('time.week')}</option>
              <option value="month">{t('time.month')}</option>
            </select>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: '300px' }}>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="content-card metrics-card">
          <div className="card-header">
            <h3><i className="fas fa-tachometer-alt"></i> {t('dashboard.systemMetrics')}</h3>
          </div>
          <div className="card-body">
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-bolt"></i>
                  <span>{t('dashboard.systemLoad')}</span>
                </div>
                <div className="metric-value">
                  <div className="progress-bar small">
                    <div className="progress-fill success" style={{ width: '65%' }}></div>
                  </div>
                  <span>65%</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-wifi"></i>
                  <span>{t('dashboard.onlineBins')}</span>
                </div>
                <div className="metric-value">
                  <div className="progress-bar small">
                    <div className="progress-fill warning" style={{ width: `${activeBinsPercent}%` }}></div>
                  </div>
                  <span>{activeBinsPercent}%</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-clock"></i>
                  <span>{t('dashboard.avgResponseTime')}</span>
                </div>
                <div className="metric-value">
                  <span className="metric-number">2.4</span>
                  <span className="metric-unit">{t('dashboard.minuteShort')}</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">
                  <i className="fas fa-check-circle"></i>
                  <span>{t('dashboard.successRate')}</span>
                </div>
                <div className="metric-value">
                  <div className="progress-bar small">
                    <div className="progress-fill success" style={{ width: '98%' }}></div>
                  </div>
                  <span>98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

