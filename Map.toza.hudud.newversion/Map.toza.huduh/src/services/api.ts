// API Service - Backend bilan bog'lanish
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3002/api'
  : 'https://tozahudud-production-00e5.up.railway.app/api'

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
