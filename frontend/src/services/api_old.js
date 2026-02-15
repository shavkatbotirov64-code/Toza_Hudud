const API_BASE_URL = 'http://localhost:3002/api'

// Global error handler for API calls
const handleApiError = (error, context = '') => {
  console.error(`🚨 API Error in ${context}:`, error)
  
  // Create detailed error object
  const errorDetails = {
    message: error.message || 'Unknown API error',
    status: error.status || 0,
    context: context,
    timestamp: new Date().toISOString(),
    url: error.url || 'unknown'
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.table(errorDetails)
  }

  return errorDetails
}

class ApiService {
  // Test connection
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        return { success: false, error: 'Connection failed' }
      }
    } catch (error) {
      console.error('API Connection Error:', error)
      return { success: false, error: error.message }
    }
  }

  // Bins API
  async getBins() {
    try {
      const response = await fetch(`${API_BASE_URL}/bins`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      console.error('Get Bins Error:', error)
      return { success: false, error: error.message }
    }
  }

  async createBin(binData) {
    const context = 'createBin'
    try {
      console.log('🔄 Sending bin data to API:', binData)
      const response = await fetch(`${API_BASE_URL}/bins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(binData)
      })
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response text:', errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          console.error('❌ Parsed error data:', errorData)
          
          // Create detailed error with status
          const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
          error.status = response.status
          error.url = response.url
          error.details = errorData
          
          handleApiError(error, context)
          throw error
        } catch (parseError) {
          const error = new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
          error.status = response.status
          error.url = response.url
          
          handleApiError(error, context)
          throw error
        }
      }
      
      const data = await response.json()
      console.log('✅ Success response:', data)
      return { success: true, data }
    } catch (error) {
      const errorDetails = handleApiError(error, context)
      return { success: false, error: error.message, details: errorDetails }
    }
  }

  async updateBin(id, binData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bins/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(binData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Update Bin Error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteBin(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/bins/${id}`, {
        method: 'DELETE'
      })
      return { success: true }
    } catch (error) {
      console.error('Delete Bin Error:', error)
      return { success: false, error: error.message }
    }
  }

  // Vehicles API
  async getVehicles() {
    const context = 'getVehicles'
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async createVehicle(vehicleData) {
    const context = 'createVehicle'
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
          error.status = response.status
          error.details = errorData
          throw error
        } catch (parseError) {
          const error = new Error(`HTTP error! status: ${response.status}`)
          error.status = response.status
          throw error
        }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async updateVehicle(id, vehicleData) {
    const context = 'updateVehicle'
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
          error.status = response.status
          error.details = errorData
          throw error
        } catch (parseError) {
          const error = new Error(`HTTP error! status: ${response.status}`)
          error.status = response.status
          throw error
        }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async deleteVehicle(id) {
    const context = 'deleteVehicle'
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return { success: true }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  // Alerts API
  async getAlerts() {
    const context = 'getAlerts'
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async createAlert(alertData) {
    const context = 'createAlert'
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
          error.status = response.status
          error.details = errorData
          throw error
        } catch (parseError) {
          const error = new Error(`HTTP error! status: ${response.status}`)
          error.status = response.status
          throw error
        }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async updateAlert(id, alertData) {
    const context = 'updateAlert'
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`)
          error.status = response.status
          error.details = errorData
          throw error
        } catch (parseError) {
          const error = new Error(`HTTP error! status: ${response.status}`)
          error.status = response.status
          throw error
        }
      }
      
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async deleteAlert(id) {
    const context = 'deleteAlert'
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return { success: true }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  // Data transformation methods
  transformBinData(backendBin) {
    return {
      id: backendBin.code, // Use code as frontend ID
      address: backendBin.address,
      district: backendBin.district,
      location: [parseFloat(backendBin.latitude) || 0, parseFloat(backendBin.longitude) || 0],
      status: parseFloat(backendBin.fillLevel) || 0,
      lastUpdate: backendBin.lastUpdate ? new Date(backendBin.lastUpdate).toLocaleTimeString('uz-UZ') : 'N/A',
      lastCleaned: backendBin.lastCleaned ? new Date(backendBin.lastCleaned).toLocaleDateString('uz-UZ') : 'N/A',
      capacity: backendBin.capacity,
      type: backendBin.type,
      sensorId: backendBin.sensorId,
      online: backendBin.isOnline,
      installDate: backendBin.createdAt ? new Date(backendBin.createdAt).toLocaleDateString('uz-UZ') : 'N/A',
      // Keep original backend data for API calls
      _backendId: backendBin.id,
      _backendData: backendBin
    }
  }

  transformVehicleData(backendVehicle) {
    return {
      id: backendVehicle.licensePlate,
      driver: backendVehicle.driverName,
      status: backendVehicle.status,
      cleaned: backendVehicle.binsCollected || 0,
      location: backendVehicle.currentLocation || 'Unknown',
      coordinates: [backendVehicle.latitude || 41.284, backendVehicle.longitude || 69.279],
      capacity: backendVehicle.capacity,
      fuel: backendVehicle.fuelLevel || 0,
      speed: backendVehicle.speed || 0,
      route: backendVehicle.currentRoute || 'N/A',
      phone: backendVehicle.driverPhone || 'N/A',
      licensePlate: backendVehicle.licensePlate,
      lastService: backendVehicle.lastMaintenance ? new Date(backendVehicle.lastMaintenance).toLocaleDateString('uz-UZ') : 'N/A',
      currentBins: [], // This would need additional API call
      _backendId: backendVehicle.id,
      _backendData: backendVehicle
    }
  }

  transformAlertData(backendAlert) {
    return {
      id: backendAlert.id,
      type: backendAlert.severity === 'critical' ? 'danger' : backendAlert.severity === 'high' ? 'warning' : 'info',
      title: backendAlert.title,
      message: backendAlert.message,
      time: backendAlert.createdAt ? this.getTimeAgo(new Date(backendAlert.createdAt)) : 'N/A',
      location: backendAlert.location || 'Unknown',
      read: backendAlert.isRead || false,
      priority: backendAlert.severity,
      _backendData: backendAlert
    }
  }

  getTimeAgo(date) {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Hozir'
    if (diffMins < 60) return `${diffMins} daqiqa oldin`
    if (diffHours < 24) return `${diffHours} soat oldin`
    return `${diffDays} kun oldin`
  }

  // Telegram Bot API methods
  async getTelegramBotInfo() {
    const context = 'getTelegramBotInfo'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/bot-info`)
      const response = await fetch(`${API_BASE_URL}/telegram/bot-info`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Bot info response:', data)
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || 'Bot ma\'lumotlarini olishda xatolik')
      }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async setTelegramWebhook(url) {
    const context = 'setTelegramWebhook'
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/set-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || 'Webhook o\'rnatishda xatolik')
      }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async sendTelegramBroadcast(text) {
    const context = 'sendTelegramBroadcast'
    try {
      // Demo uchun - real loyihada userIds ro'yxati bo'ladi
      const userIds = [123456789, 987654321] // Mock user IDs
      
      const response = await fetch(`${API_BASE_URL}/telegram/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userIds })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { success: true, data: data }
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramStats() {
    const context = 'getTelegramStats'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/stats`)
      
      // Timeout bilan fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 soniya timeout
      
      const response = await fetch(`${API_BASE_URL}/telegram/stats`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Stats response:', data)
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || 'Statistikani olishda xatolik')
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stats API timeout')
      }
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramMessages() {
    const context = 'getTelegramMessages'
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_BASE_URL}/telegram/messages`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || 'Xabarlarni olishda xatolik')
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Messages API timeout')
      }
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramFeedback() {
    const context = 'getTelegramFeedback'
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_BASE_URL}/telegram/feedback`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        return { success: true, data: data.data }
      } else {
        throw new Error(data.error || 'Fikrlarni olishda xatolik')
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Feedback API timeout')
      }
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  // Yangi Telegram API metodlari
  async getTelegramBotInfo() {
    const context = 'getTelegramBotInfo'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/bot-info`)
      const response = await fetch(`${API_BASE_URL}/telegram/bot-info`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramStats() {
    const context = 'getTelegramStats'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/stats`)
      const response = await fetch(`${API_BASE_URL}/telegram/stats`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramReports(limit = 10) {
    const context = 'getTelegramReports'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/reports?limit=${limit}`)
      const response = await fetch(`${API_BASE_URL}/telegram/reports?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramFeedbacks(limit = 10) {
    const context = 'getTelegramFeedbacks'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/feedbacks?limit=${limit}`)
      const response = await fetch(`${API_BASE_URL}/telegram/feedbacks?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async getTelegramUsers(limit = 50) {
    const context = 'getTelegramUsers'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/users?limit=${limit}`)
      const response = await fetch(`${API_BASE_URL}/telegram/users?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async sendTelegramBroadcast(message) {
    const context = 'sendTelegramBroadcast'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/broadcast`)
      const response = await fetch(`${API_BASE_URL}/telegram/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }

  async setTelegramWebhook(url) {
    const context = 'setTelegramWebhook'
    try {
      console.log('Calling:', `${API_BASE_URL}/telegram/webhook`)
      const response = await fetch(`${API_BASE_URL}/telegram/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, context)
      return { success: false, error: error.message }
    }
  }
}

export default new ApiService()