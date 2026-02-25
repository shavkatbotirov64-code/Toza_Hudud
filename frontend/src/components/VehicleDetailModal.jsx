import React from 'react'
import { useTranslation } from '../hooks/useTranslation'
import Modal from './Modal'

const VehicleDetailModal = ({ isOpen, onClose, vehicle }) => {
  const { t } = useTranslation()
  
  if (!vehicle) return null

  const safeVehicle = {
    id: vehicle.id || '---',
    driver: vehicle.driver || "Noma'lum",
    phone: vehicle.phone || "Noma'lum",
    licensePlate: vehicle.licensePlate || "Noma'lum",
    route: vehicle.route || "Noma'lum",
    status: vehicle.status || 'inactive',
    cleaned: Number.isFinite(Number(vehicle.cleaned)) ? Number(vehicle.cleaned) : 0,
    capacity: Number.isFinite(Number(vehicle.capacity)) ? Number(vehicle.capacity) : 0,
    lastService: vehicle.lastService || "Ma'lumot yo'q",
    location: vehicle.location || "Noma'lum",
    currentBins: Array.isArray(vehicle.currentBins) ? vehicle.currentBins : []
  }
  
  const getStatusText = (status) => {
    if (status === 'moving') return t('status.moving')
    if (status === 'active') return t('status.active')
    return t('vehicles.inactive')
  }

  const getStatusColor = (status) => {
    if (status === 'moving') return '#3b82f6'
    if (status === 'active') return '#10b981'
    return '#94a3b8'
  }

  const handleShowOnMap = () => {
    onClose()

    if (!safeVehicle.id || safeVehicle.id === '---' || typeof window === 'undefined') return

    window.dispatchEvent(
      new CustomEvent('navigateToTab', {
        detail: {
          tab: 'liveMap',
          mapTarget: {
            type: 'vehicle',
            id: safeVehicle.id
          }
        }
      })
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('vehicleDetail.vehicleTitle')} #${safeVehicle.id}`} size="large">
      <div className="modal-grid">
        <div className="modal-section">
          <h3><i className="fas fa-info-circle"></i> {t('vehicleDetail.basicInfo')}</h3>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                <i className="fas fa-user"></i>
              </div>
              <div>
                <p className="info-label">{t('vehicleDetail.driver')}</p>
                <p className="info-value">{safeVehicle.driver}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--secondary)' }}>
                <i className="fas fa-phone"></i>
              </div>
              <div>
                <p className="info-label">{t('vehicleDetail.phone')}</p>
                <p className="info-value">{safeVehicle.phone}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <i className="fas fa-id-card"></i>
              </div>
              <div>
                <p className="info-label">{t('vehicleDetail.licensePlate')}</p>
                <p className="info-value">{safeVehicle.licensePlate}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <i className="fas fa-route"></i>
              </div>
              <div>
                <p className="info-label">{t('vehicleDetail.route')}</p>
                <p className="info-value">{safeVehicle.route}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3><i className="fas fa-chart-line"></i> {t('vehicleDetail.statusInfo')}</h3>
          <div className="status-card">
            <div className="status-header">
              <span>{t('vehicleDetail.status')}</span>
              <span className="status-percent" style={{ color: getStatusColor(safeVehicle.status) }}>
                {getStatusText(safeVehicle.status)}
              </span>
            </div>
            <div className="status-details">
              <div className="status-item">
                <span>{t('vehicleDetail.todayCleaned')}:</span>
                <strong>{safeVehicle.cleaned} {t('vehicleDetail.pieces')}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3><i className="fas fa-tachometer-alt"></i> {t('vehicleDetail.technicalInfo')}</h3>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">{t('vehicleDetail.capacity')}:</span>
              <span className="info-value">{safeVehicle.capacity.toLocaleString()}L</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('vehicleDetail.lastService')}:</span>
              <span className="info-value">{safeVehicle.lastService}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('vehicleDetail.location')}:</span>
              <span className="info-value">{safeVehicle.location}</span>
            </div>
          </div>
        </div>

        {safeVehicle.currentBins.length > 0 && (
          <div className="modal-section">
            <h3><i className="fas fa-trash"></i> {t('vehicleDetail.currentBins')}</h3>
            <div className="route-bins">
              {safeVehicle.currentBins.map(binId => (
                <span key={binId} className="bin-tag">
                  {binId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
        <button className="btn btn-primary" onClick={handleShowOnMap}>
          <i className="fas fa-map"></i> {t('vehicleDetail.showOnMap')}
        </button>
        <button className="btn btn-primary" onClick={() => {
          if (!safeVehicle.phone || safeVehicle.phone === "Noma'lum") return
          window.open(`tel:${safeVehicle.phone}`)
        }}>
          <i className="fas fa-phone"></i> {t('vehicleDetail.makeCall')}
        </button>
      </div>
    </Modal>
  )
}

export default VehicleDetailModal
