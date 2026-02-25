import React, { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'

const HEALTH_PRIORITY = {
  critical: 0,
  warning: 1,
  healthy: 2
}

const toPercent = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return null
  return Math.max(0, Math.min(100, Math.round(numericValue)))
}

const Alerts = () => {
  const { binsData } = useAppContext()
  const { t } = useTranslation()

  const devices = useMemo(() => {
    return (binsData || [])
      .map((bin, index) => {
        const sensorId = bin?.sensorId || (bin?.id ? `ESP32-${bin.id}` : `ESP32-${index + 1}`)
        const battery = toPercent(bin?.batteryLevel)
        const fillLevel = toPercent(bin?.fillLevel ?? bin?.status)
        const isOnline = typeof bin?.online === 'boolean' ? bin.online : false
        const hasLocation = Array.isArray(bin?.location) && bin.location.length >= 2
        const latitude = hasLocation ? Number(bin.location[0]) : null
        const longitude = hasLocation ? Number(bin.location[1]) : null
        const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

        const batteryCritical = battery !== null && battery <= 20
        const batteryWarning = battery !== null && battery <= 40
        const fillCritical = fillLevel !== null && fillLevel >= 90
        const fillWarning = fillLevel !== null && fillLevel >= 70

        let health = 'healthy'
        if (!isOnline || batteryCritical || fillCritical) {
          health = 'critical'
        } else if (batteryWarning || fillWarning) {
          health = 'warning'
        }

        return {
          sensorId,
          binId: bin?.id || t('alerts.notLinked'),
          battery,
          fillLevel,
          isOnline,
          health,
          lastUpdate: bin?.lastUpdate || t('alerts.unknown'),
          locationText: hasValidCoordinates
            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : t('alerts.unknown')
        }
      })
      .sort((firstDevice, secondDevice) => {
        const firstPriority = HEALTH_PRIORITY[firstDevice.health] ?? 99
        const secondPriority = HEALTH_PRIORITY[secondDevice.health] ?? 99
        if (firstPriority !== secondPriority) return firstPriority - secondPriority
        return firstDevice.sensorId.localeCompare(secondDevice.sensorId)
      })
  }, [binsData, t])

  const stats = useMemo(() => {
    const totalDevices = devices.length
    const onlineDevices = devices.filter((device) => device.isOnline).length
    const criticalDevices = devices.filter((device) => device.health === 'critical').length
    const batteryValues = devices
      .map((device) => device.battery)
      .filter((battery) => battery !== null)
    const averageBattery = batteryValues.length
      ? Math.round(batteryValues.reduce((sum, battery) => sum + battery, 0) / batteryValues.length)
      : null

    return {
      totalDevices,
      onlineDevices,
      criticalDevices,
      averageBattery
    }
  }, [devices])

  const getBatteryColor = (battery) => {
    if (battery === null) return '#94a3b8'
    if (battery <= 20) return '#ef4444'
    if (battery <= 40) return '#f59e0b'
    return '#10b981'
  }

  const getFillColor = (fillLevel) => {
    if (fillLevel === null) return '#94a3b8'
    if (fillLevel >= 90) return '#ef4444'
    if (fillLevel >= 70) return '#f59e0b'
    if (fillLevel >= 30) return '#eab308'
    return '#10b981'
  }

  const getHealthLabel = (health) => {
    if (health === 'critical') return t('alerts.critical')
    if (health === 'warning') return t('alerts.warning')
    return t('alerts.healthy')
  }

  return (
    <div id="alertsTab" className="tab-content active">
      <div className="section-header">
        <div className="header-left">
          <h3><i className="fas fa-microchip"></i> {t('alerts.title')}</h3>
          <p>{t('alerts.subtitle')}</p>
        </div>
      </div>

      <div className="esp32-status-grid">
        <div className="esp32-status-stat">
          <div className="esp32-status-stat-icon total">
            <i className="fas fa-microchip"></i>
          </div>
          <div className="esp32-status-stat-content">
            <h4>{stats.totalDevices}</h4>
            <p>{t('alerts.totalDevices')}</p>
          </div>
        </div>

        <div className="esp32-status-stat">
          <div className="esp32-status-stat-icon online">
            <i className="fas fa-wifi"></i>
          </div>
          <div className="esp32-status-stat-content">
            <h4>{stats.onlineDevices}</h4>
            <p>{t('alerts.onlineDevices')}</p>
          </div>
        </div>

        <div className="esp32-status-stat">
          <div className="esp32-status-stat-icon battery">
            <i className="fas fa-battery-three-quarters"></i>
          </div>
          <div className="esp32-status-stat-content">
            <h4>{stats.averageBattery !== null ? `${stats.averageBattery}%` : '--'}</h4>
            <p>{t('alerts.avgBattery')}</p>
          </div>
        </div>

        <div className="esp32-status-stat">
          <div className="esp32-status-stat-icon critical">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="esp32-status-stat-content">
            <h4>{stats.criticalDevices}</h4>
            <p>{t('alerts.criticalDevices')}</p>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body">
          {devices.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <i
                className="fas fa-microchip"
                style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}
              ></i>
              <p>{t('alerts.noDevices')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('alerts.deviceId')}</th>
                    <th>{t('alerts.binId')}</th>
                    <th>{t('alerts.battery')}</th>
                    <th>{t('alerts.fillLevel')}</th>
                    <th>{t('alerts.connectivity')}</th>
                    <th>{t('alerts.health')}</th>
                    <th>{t('alerts.lastUpdate')}</th>
                    <th>{t('alerts.location')}</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={`${device.sensorId}-${device.binId}`}>
                      <td>
                        <div className="esp32-status-device-id">{device.sensorId}</div>
                      </td>
                      <td>{device.binId}</td>
                      <td>
                        <div className="esp32-status-progress-cell">
                          <div className="esp32-status-progress-label">
                            {device.battery !== null ? `${device.battery}%` : '--'}
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${device.battery ?? 0}%`,
                                background: getBatteryColor(device.battery)
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="esp32-status-progress-cell">
                          <div className="esp32-status-progress-label">
                            {device.fillLevel !== null ? `${device.fillLevel}%` : '--'}
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${device.fillLevel ?? 0}%`,
                                background: getFillColor(device.fillLevel)
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`esp32-status-connectivity ${device.isOnline ? 'online' : 'offline'}`}>
                          <i className={`fas fa-${device.isOnline ? 'wifi' : 'times-circle'}`}></i>
                          {device.isOnline ? t('alerts.online') : t('alerts.offline')}
                        </span>
                      </td>
                      <td>
                        <span className={`esp32-status-health-badge ${device.health}`}>
                          {getHealthLabel(device.health)}
                        </span>
                      </td>
                      <td>{device.lastUpdate}</td>
                      <td className="esp32-status-location">{device.locationText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Alerts
