import React from 'react'
import { useTranslation } from '../hooks/useTranslation'
import Modal from './Modal'

const BinDetailModal = ({ isOpen, onClose, bin }) => {
  const { t } = useTranslation()
  
  if (!bin) return null

  const getStatusColor = (status) => {
    if (status >= 90) return '#ef4444'
    if (status >= 70) return '#f59e0b'
    if (status >= 30) return '#eab308'
    return '#10b981'
  }

  const getStatusText = (status) => {
    if (status >= 90) return t('status.full')
    if (status >= 70) return t('binDetail.almostFull')
    if (status >= 30) return t('status.half')
    return t('status.empty')
  }

  const color = getStatusColor(bin.status)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('binDetail.binTitle')} #${bin.id}`} size="large">
      <div className="modal-grid">
        <div className="modal-section">
          <h3><i className="fas fa-info-circle"></i> {t('binDetail.basicInfo')}</h3>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <p className="info-label">{t('bins.address')}</p>
                <p className="info-value">{bin.address}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--secondary)' }}>
                <i className="fas fa-layer-group"></i>
              </div>
              <div>
                <p className="info-label">{t('binDetail.district')}</p>
                <p className="info-value">{bin.district}</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <i className="fas fa-weight"></i>
              </div>
              <div>
                <p className="info-label">{t('binDetail.capacity')}</p>
                <p className="info-value">{bin.capacity}L</p>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                <i className="fas fa-trash"></i>
              </div>
              <div>
                <p className="info-label">{t('binDetail.wasteType')}</p>
                <p className="info-value">{bin.type}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3><i className="fas fa-chart-line"></i> {t('binDetail.statusInfo')}</h3>
          <div className="status-card">
            <div className="status-header">
              <span>{t('bins.fillLevel')}</span>
              <span className="status-percent" style={{ color }}>{bin.status}%</span>
            </div>
            <div className="progress-bar" style={{ margin: '10px 0' }}>
              <div className="progress-fill" style={{ width: `${bin.status}%`, background: color }}></div>
            </div>
            <div className="status-details">
              <div className="status-item">
                <span>{t('bins.status')}:</span>
                <strong style={{ color }}>{getStatusText(bin.status)}</strong>
              </div>
              <div className="status-item">
                <span>{t('binDetail.online')}:</span>
                <span className={bin.online ? 'text-success' : 'text-danger'}>
                  {bin.online ? t('common.yes') : t('common.no')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3><i className="fas fa-clock"></i> {t('binDetail.timeInfo')}</h3>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">{t('bins.lastUpdate')}:</span>
              <span className="info-value">{bin.lastUpdate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('binDetail.lastCleaned')}:</span>
              <span className="info-value">{bin.lastCleaned}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('binDetail.installDate')}:</span>
              <span className="info-value">{bin.installDate}</span>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3><i className="fas fa-cog"></i> {t('binDetail.technicalInfo')}</h3>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">{t('binDetail.sensorId')}:</span>
              <span className="info-value">{bin.sensorId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('binDetail.coordinates')}:</span>
              <span className="info-value">
                {bin.location && Array.isArray(bin.location) && bin.location.length >= 2
                  ? `${parseFloat(bin.location[0]).toFixed(4)}, ${parseFloat(bin.location[1]).toFixed(4)}`
                  : bin.latitude && bin.longitude
                  ? `${parseFloat(bin.latitude).toFixed(4)}, ${parseFloat(bin.longitude).toFixed(4)}`
                  : t('binDetail.noData')
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
        <button className="btn btn-primary" onClick={() => {
          onClose()
          // Navigate to map or show on map
        }}>
          <i className="fas fa-map"></i> {t('binDetail.showOnMap')}
        </button>
      </div>
    </Modal>
  )
}

export default BinDetailModal

