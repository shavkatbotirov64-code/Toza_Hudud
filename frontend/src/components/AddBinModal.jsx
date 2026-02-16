import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { useAppContext } from '../context/AppContext'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useTranslation } from '../hooks/useTranslation'
import ApiService from '../services/api'

const AddBinModal = ({ isOpen, onClose, binToEdit, apiConnected, onBinAdded }) => {
  const { binsData, setBinsData, showToast, setActivityData } = useAppContext()
  const { handleAsyncError } = useErrorHandler()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    id: '',
    address: '',
    district: '',
    capacity: 120,
    type: 'general',
    lat: 41.311,
    lng: 69.240
  })
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens/closes or binToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (binToEdit) {
        // Edit mode
        setFormData({
          id: binToEdit.id,
          address: binToEdit.address,
          district: binToEdit.district,
          capacity: binToEdit.capacity,
          type: binToEdit.type,
          lat: binToEdit.location[0],
          lng: binToEdit.location[1]
        })
      } else {
        // Add mode - avtomatik unique kod generatsiya qilish
        const generateUniqueCode = () => {
          const timestamp = Date.now().toString().slice(-4) // So'nggi 4 raqam
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0') // 3 raqamli random
          return `BIN-${timestamp}${random}`
        }

        setFormData({
          id: generateUniqueCode(),
          address: '',
          district: '',
          capacity: 120,
          type: 'general',
          lat: 41.311,
          lng: 69.240
        })
      }
    }
  }, [isOpen, binToEdit])

  const formatTime = (date) => {
    return date.toLocaleTimeString('uz-UZ', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('uz-UZ', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.id || !formData.address || !formData.district) {
      showToast(t('addBin.fillAllFields'), 'warning')
      return
    }

    if (formData.address.length < 10) {
      showToast(t('addBin.addressTooShort'), 'warning')
      return
    }

    // Check if ID already exists (only for new bins)
    if (!binToEdit && binsData.find(b => b.id === formData.id)) {
      showToast(t('addBin.idExists') || 'Bu ID allaqachon mavjud', 'danger')
      return
    }

    setLoading(true)

    try {
      if (apiConnected) {
        // API mode
        const binData = {
          code: formData.id.toUpperCase(),
          address: formData.address,
          district: formData.district,
          latitude: parseFloat(formData.lat),
          longitude: parseFloat(formData.lng),
          capacity: parseInt(formData.capacity),
          type: formData.type,
          sensorId: binToEdit ? binToEdit.sensorId : 'SENSOR-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          fillLevel: 0 // Initial fill level
        }

        if (binToEdit) {
          // Update existing bin
          await handleAsyncError(async () => {
            const result = await ApiService.updateBin(binToEdit._backendId, binData)
            if (result.success) {
              showToast(t('addBin.binUpdated'), 'success')
              onBinAdded && onBinAdded() // Refresh data
            } else {
              throw new Error(result.error || t('addBin.updateError') || 'Qutini yangilashda xatolik')
            }
          }, 'UpdateBin')
        } else {
          // Create new bin
          console.log('🔄 Creating bin with data:', binData)
          await handleAsyncError(async () => {
            let result = await ApiService.createBin(binData)
            console.log('📦 Create bin result:', result)
            
            // Agar 409 conflict bo'lsa, yangi kod bilan qayta urinish
            if (!result.success && result.error && result.error.includes('409')) {
              console.log('⚠️ Code conflict detected, generating new code...')
              const timestamp = Date.now().toString().slice(-4)
              const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
              const newCode = `BIN-${timestamp}${random}`
              
              binData.code = newCode
              setFormData(prev => ({ ...prev, id: newCode }))
              
              console.log('🔄 Retrying with new code:', newCode)
              result = await ApiService.createBin(binData)
              console.log('📦 Retry result:', result)
            }
            
            if (result.success) {
              showToast(t('addBin.binAdded'), 'success')
              onBinAdded && onBinAdded() // Refresh data
            } else {
              throw new Error(result.error || t('addBin.createError') || 'Quti qo\'shishda xatolik')
            }
          }, 'CreateBin')
        }
      } else {
        // Mock mode
        const newBin = {
          id: formData.id.toUpperCase(),
          address: formData.address,
          district: formData.district,
          location: [parseFloat(formData.lat), parseFloat(formData.lng)],
          status: binToEdit ? binToEdit.status : 0,
          lastUpdate: formatTime(new Date()),
          lastCleaned: binToEdit ? binToEdit.lastCleaned : formatDate(new Date()) + ' ' + formatTime(new Date()),
          capacity: parseInt(formData.capacity),
          type: formData.type,
          sensorId: binToEdit ? binToEdit.sensorId : 'SENSOR-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          online: binToEdit ? binToEdit.online : true,
          installDate: binToEdit ? binToEdit.installDate : formatDate(new Date())
        }

        if (binToEdit) {
          // Update existing bin
          setBinsData(prev => prev.map(bin => 
            bin.id === binToEdit.id ? newBin : bin
          ))
          showToast(t('addBin.binUpdatedDemo'), 'success')
        } else {
          // Add new bin
          setBinsData(prev => [newBin, ...prev])
          
          setActivityData(prev => [{
            id: `ACT-${Date.now()}`,
            type: 'success',
            title: t('addBin.newBinAdded') || `Yangi quti qo'shildi`,
            description: `${t('addBin.binTitle')} #${newBin.id} ${t('addBin.addedToSystem')}` || `Quti #${newBin.id} tizimga qo'shildi`,
            time: formatTime(new Date()),
            location: newBin.district,
            binId: newBin.id
          }, ...prev])

          showToast(t('addBin.binAddedDemo'), 'success')
        }
      }

      // Reset form and close modal
      setFormData({
        id: '',
        address: '',
        district: '',
        capacity: 120,
        type: 'general',
        lat: 41.311,
        lng: 69.240
      })
      
      onClose()
    } catch (error) {
      // Error already handled by handleAsyncError
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={binToEdit ? t('addBin.editTitle') : t('addBin.title')} 
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {apiConnected && (
          <div className="api-status" style={{
            padding: '10px 15px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
            <span style={{ color: '#065f46' }}>
              {t('addBin.apiConnectedNote')}
            </span>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="binId">{t('addBin.binId')} *</label>
            <input
              type="text"
              id="binId"
              required
              placeholder={t('addBin.binIdPlaceholder')}
              pattern="BIN-[A-Z0-9]{3,}"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={binToEdit} // Can't change ID when editing
            />
            <small className="text-muted">{t('addBin.binIdFormat')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="binAddress">{t('addBin.address')} *</label>
            <input
              type="text"
              id="binAddress"
              required
              placeholder={t('addBin.addressPlaceholder')}
              minLength="10"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <small className="text-muted">{t('addBin.addressMinLength')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="binDistrict">{t('addBin.district')} *</label>
            <select
              id="binDistrict"
              required
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            >
              <option value="">{t('addBin.selectDistrict')}</option>
              <option value="samarqand">{t('districts.samarqand')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="binCapacity">{t('addBin.capacity')} *</label>
            <input
              type="number"
              id="binCapacity"
              required
              min="50"
              max="500"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="binType">{t('addBin.wasteType')}</label>
            <select
              id="binType"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="general">{t('addBin.general')}</option>
              <option value="plastic">{t('addBin.plastic')}</option>
              <option value="organic">{t('addBin.organic')}</option>
              <option value="paper">{t('addBin.paper')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="binLat">{t('addBin.latitude')}</label>
            <input
              type="number"
              id="binLat"
              step="0.0001"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              placeholder="41.311"
            />
          </div>

          <div className="form-group">
            <label htmlFor="binLng">{t('addBin.longitude')}</label>
            <input
              type="number"
              id="binLng"
              step="0.0001"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              placeholder="69.240"
            />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {t('addBin.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> {t('addBin.saving')}
              </>
            ) : (
              <>
                <i className={`fas fa-${binToEdit ? 'save' : 'plus'}`}></i> 
                {binToEdit ? t('addBin.save') : t('addBin.add')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AddBinModal

