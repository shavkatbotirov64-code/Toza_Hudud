// API Service - Backend bilan bog'lanish
// ALWAYS use production backend (no local backend)
const API_BASE_URL = 'https://tozahudud-production-d73f.up.railway.app'
const DISPATCH_API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3003'  // Local dispatch backend
  : 'https://newmap-backend-production.up.railway.app'  // Production dispatch backend (Railway'ga deploy qilgandan keyin)

export interface Bin {
  id: string
  location: [number, number]
  address: string
  status: number
  capacity: number
}

export interface Vehicle {
  id: string
  driver: string
  status: string
  coordinates: [number, number]
  speed: number
}

class ApiService {
  async getBins() {
    try {
      const response = await fetch(`${API_BASE_URL}/bins`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching bins:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  async getVehicles() {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Cleaning History API
  async createCleaning(cleaningData: {
    binId: string
    vehicleId: string
    driverName: string
    binLocation: string
    fillLevelBefore: number
    fillLevelAfter: number
    distanceTraveled: number
    durationMinutes: number
    notes?: string
    status?: string
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleaningData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error creating cleaning:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Dispatch API - Eng yaqin mashinani topish va yo'naltirish
  async dispatchVehicleToBin(data: {
    binId: string
    binLocation: [number, number]
    binAddress: string
    vehicles: Array<{
      id: string
      driver: string
      position: [number, number]
      isPatrolling: boolean
    }>
  }) {
    try {
      const response = await fetch(`${DISPATCH_API_URL}/dispatch/send-to-bin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error dispatching vehicle:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}

export default new ApiService()

// Qutilarni olish
export const fetchBins = async (): Promise<Bin[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bins`)
    if (!response.ok) throw new Error('Failed to fetch bins')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching bins:', error)
    // Fallback to mock data
    return []
  }
}

// Mashinalarni olish
export const fetchVehicles = async (): Promise<Vehicle[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`)
    if (!response.ok) throw new Error('Failed to fetch vehicles')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    // Fallback to mock data
    return []
  }
}
