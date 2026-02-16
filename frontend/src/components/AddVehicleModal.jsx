import React, { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import Modal from './Modal'
import { useAppContext } from '../context/AppContext'
import ApiService from '../services/api'

const AddVehicleModal = ({ isOpen, onClose }) => {
  const { vehiclesData, setVehiclesData, showToast, refreshData } = useAppContext()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    driver: '',
    phone: '',
    licensePlate: '',
    status: 'active',
    capacity: 5000,
    fuel: 100,
    route: 'Route A'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.id || !formData.driver || !formData.phone) {
      showToast(t('addVehicle.fillAllFields') || 'Barcha majburiy maydonlarni to\'ldiring', 'warning')
      return
    }

    if (vehiclesData.find(v => v.id === formData.id)) {
      showToast(t('addVehicle.idExists') || 'Bu ID allaqachon mavjud', 'danger')
      return
    }

    setLoading(true)

    try {
      // API orqali yangi mashina qo'shish
      const result = await ApiService.createVehicle({
        vehicleId: formData.id.toUpperCase(),
        driver: formData.driver,
        phone: formData.phone,
        licensePlate: formData.licensePlate,
        latitude: 39.6650, // Default Samarqand koordinatalari
        longitude: 66.9600
      })

      if (result.success) {
        showToast(t('addVehicle.vehicleAdded') || `Yangi mashina #${formData.id} muvaffaqiyatli qo'shildi`, 'success')
        
        // Ma'lumotlarni yangilash
        await refreshData()
        
        // Formani tozalash
        setFormData({
          id: '',
          driver: '',
          phone: '',
          licensePlate: '',
          status: 'active',
          capacity: 5000,
          fuel: 100,
          route: 'Route A'
        })
        
        onClose()
      } else {
        showToast(result.error || 'Mashina qo\'shishda xatolik', 'error')
      }
    } catch (error) {
      console.error('❌ Error creating vehicle:', error)
      showToast('Mashina qo\'shishda xatolik yuz berdi', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('addVehicle.title')} size="large">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vehicleId">{t('addVehicle.vehicleId')} *</label>
            <input
              type="text"
              id="vehicleId"
              required
              placeholder={t('addVehicle.vehicleIdPlaceholder')}
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleDriver">{t('addVehicle.driverName')} *</label>
            <input
              type="text"
              id="vehicleDriver"
              required
              placeholder={t('addVehicle.driverPlaceholder')}
              value={formData.driver}
              onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehiclePhone">{t('addVehicle.phone')} *</label>
            <input
              type="tel"
              id="vehiclePhone"
              required
              placeholder={t('addVehicle.phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleLicense">{t('addVehicle.licensePlate')}</label>
            <input
              type="text"
              id="vehicleLicense"
              placeholder={t('addVehicle.licensePlaceholder')}
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleStatus">{t('addVehicle.status')}</label>
            <select
              id="vehicleStatus"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">{t('vehicles.active')}</option>
              <option value="moving">{t('vehicles.moving')}</option>
              <option value="inactive">{t('vehicles.inactive')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="vehicleCapacity">{t('addVehicle.capacity')}</label>
            <input
              type="number"
              id="vehicleCapacity"
              min="1000"
              max="10000"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleFuel">{t('addVehicle.fuel')}</label>
            <input
              type="number"
              id="vehicleFuel"
              min="0"
              max="100"
              value={formData.fuel}
              onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleRoute">{t('addVehicle.route')}</label>
            <select
              id="vehicleRoute"
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
            >
              <option value="Route A">{t('addVehicle.routeA')}</option>
              <option value="Route B">{t('addVehicle.routeB')}</option>
              <option value="Route C">{t('addVehicle.routeC')}</option>
              <option value="Route D">{t('addVehicle.routeD')}</option>
            </select>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Qo'shilmoqda...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> {t('addVehicle.addButton')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddVehicleModal

