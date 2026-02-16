import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useTranslation } from '../hooks/useTranslation'
import VehicleDetailModal from './VehicleDetailModal'
import AddVehicleModal from './AddVehicleModal'
import ApiService from '../services/api'

const Vehicles = () => {
  const { vehiclesData, setVehiclesData, showToast, apiConnected, refreshData } = useAppContext()
  const { handleAsyncError } = useErrorHandler()
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showVehicleDetail, setShowVehicleDetail] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [selectedPhone, setSelectedPhone] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteVehicle = async (vehicle) => {
    if (!vehicle._backendId) {
      showToast('Bu mashinani o\'chirib bo\'lmaydi (backend ID yo\'q)', 'warning')
      return
    }

    setDeleting(true)
    try {
      const result = await ApiService.deleteVehicle(vehicle._backendId)
      
      if (result.success) {
        showToast(`Mashina ${vehicle.id} muvaffaqiyatli o'chirildi`, 'success')
        await refreshData()
        setDeleteConfirm(null)
      } else {
        showToast(result.error || 'Mashinani o\'chirishda xatolik', 'error')
      }
    } catch (error) {
      console.error('❌ Error deleting vehicle:', error)
      showToast('Mashinani o\'chirishda xatolik yuz berdi', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredVehicles = vehiclesData.filter(vehicle => {
    if (filter === 'all') return true
    return vehicle.status === filter
  })

  const getStatusClass = (status) => {
    if (status === 'moving') return 'moving'
    if (status === 'active') return 'online'
    return 'offline'
  }

  const getStatusText = (status) => {
    if (status === 'moving') return t('status.moving')
    if (status === 'active') return t('status.active')
    return t('vehicles.inactive')
  }

  return (
    <div id="vehiclesTab" className="tab-content active">
      <div className="section-header">
        <div className="header-left">
          <h3><i className="fas fa-truck"></i> {t('vehicles.title')}</h3>
          <p>{vehiclesData.length} {t('vehicles.monitoring')}</p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => setShowAddVehicle(true)}>
            <i className="fas fa-plus"></i> {t('vehicles.addVehicle')}
          </button>
        </div>
      </div>

      <div className="vehicles-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('vehicles.all')}
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            {t('vehicles.active')}
          </button>
          <button
            className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            {t('vehicles.inactive')}
          </button>
          <button
            className={`filter-btn ${filter === 'moving' ? 'active' : ''}`}
            onClick={() => setFilter('moving')}
          >
            {t('vehicles.moving')}
          </button>
        </div>
      </div>

      <div className="vehicles-grid">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="vehicle-card">
            <div className="vehicle-header">
              <div className="vehicle-icon">
                <i className="fas fa-truck"></i>
              </div>
              <div className="vehicle-info">
                <div className="vehicle-title">{vehicle.id}</div>
                <div className="vehicle-driver">{vehicle.driver}</div>
              </div>
              <span className={`vehicle-status ${getStatusClass(vehicle.status)}`}>
                {getStatusText(vehicle.status)}
              </span>
            </div>

            <div className="vehicle-stats">
              <div className="vehicle-stat">
                <div className="stat-label">{t('vehicles.cleaned')}</div>
                <div className="stat-value">{vehicle.cleaned}</div>
              </div>
            </div>

            <div className="vehicle-location">
              <i className="fas fa-map-marker-alt"></i>
              <span>{vehicle.location}</span>
            </div>

            <div className="vehicle-actions">
              <button className="btn btn-primary" onClick={() => {
                setSelectedVehicle(vehicle)
                setShowVehicleDetail(true)
              }}>
                <i className="fas fa-info"></i> {t('vehicles.details')}
              </button>
              <button className="btn btn-secondary" onClick={() => {
                // Telefon raqamini modal oynada ko'rsatish
                if (vehicle.phone && vehicle.phone !== 'Noma\'lum') {
                  setSelectedPhone({
                    driver: vehicle.driver,
                    phone: vehicle.phone,
                    vehicleId: vehicle.id
                  })
                  setShowPhoneModal(true)
                } else {
                  showToast('Haydovchi telefon raqami mavjud emas', 'warning')
                }
              }}>
                <i className="fas fa-phone"></i> {t('vehicles.call')}
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => setDeleteConfirm(vehicle)}
                style={{ marginLeft: 'auto' }}
              >
                <i className="fas fa-trash"></i> O'chirish
              </button>
            </div>
          </div>
        ))}
      </div>

      <VehicleDetailModal 
        isOpen={showVehicleDetail} 
        onClose={() => {
          setShowVehicleDetail(false)
          setSelectedVehicle(null)
        }} 
        vehicle={selectedVehicle} 
      />
      <AddVehicleModal 
        isOpen={showAddVehicle} 
        onClose={() => setShowAddVehicle(false)} 
      />
      
      {/* Telefon raqami modal */}
      {showPhoneModal && selectedPhone && (
        <div className="modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><i className="fas fa-phone"></i> Haydovchi bilan bog'lanish</h3>
              <button className="modal-close" onClick={() => setShowPhoneModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <i className="fas fa-user" style={{ fontSize: '48px', color: 'var(--primary)', marginBottom: '15px' }}></i>
                <h4 style={{ margin: '10px 0', color: 'var(--text-primary)' }}>{selectedPhone.driver}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Transport vositasi: {selectedPhone.vehicleId}</p>
              </div>
              
              <div style={{ 
                background: 'var(--card-bg)', 
                padding: '20px', 
                borderRadius: '12px', 
                border: '2px solid var(--primary)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '5px' }}>
                  📞 Telefon raqami
                </div>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}>
                  {selectedPhone.phone}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPhone.phone).then(() => {
                      showToast('Telefon raqami nusxalandi', 'success')
                    }).catch(() => {
                      showToast('Nusxalashda xatolik', 'error')
                    })
                  }}
                >
                  <i className="fas fa-copy"></i> Nusxalash
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    window.open(`tel:${selectedPhone.phone}`)
                  }}
                >
                  <i className="fas fa-phone"></i> Qo'ng'iroq qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* O'chirish tasdiqlash modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Mashinani o'chirish</h3>
              <button className="modal-close" onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
                <strong>{deleteConfirm.id}</strong> mashinasini o'chirishni xohlaysizmi?
              </p>
              <p style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Haydovchi: {deleteConfirm.driver}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Bekor qilish
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDeleteVehicle(deleteConfirm)}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> O'chirilmoqda...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash"></i> O'chirish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vehicles

