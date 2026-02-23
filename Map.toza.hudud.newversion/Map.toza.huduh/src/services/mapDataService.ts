// Global map data service - barcha komponentlar uchun bir xil ma'lumot
import { mockBinsData, mockVehiclesData } from '../data/mockData'

interface Bin {
  id: string
  location: [number, number]
  address: string
  status: number
  capacity: number
}

interface Vehicle {
  id: string
  driver: string
  status: string
  coordinates: [number, number]
  speed: number
  targetBin?: string
  cleaned?: number
}

class MapDataService {
  private bins: Bin[] = []
  private vehicles: Vehicle[] = []
  private listeners: Array<(data: { bins: Bin[], vehicles: Vehicle[] }) => void> = []
  private simulationInterval: NodeJS.Timeout | null = null
  private dataUpdateInterval: NodeJS.Timeout | null = null
  private backendUrl = 'http://localhost:3002'
  private broadcastChannel: BroadcastChannel | null = null
  private storageKey = 'toza-hudud-map-data'

  constructor() {
    // Try to load from localStorage first
    const savedData = this.loadFromStorage()
    if (savedData) {
      this.bins = savedData.bins
      this.vehicles = savedData.vehicles
    } else {
      this.bins = [...mockBinsData]
      this.vehicles = [...mockVehiclesData]
    }
    
    // Setup cross-tab communication
    this.setupBroadcastChannel()
    
    // Start simulation and data fetching
    this.startSimulation()
    this.startDataFetching()
  }

  // Setup BroadcastChannel for cross-tab/cross-app communication
  private setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('toza-hudud-sync')
      
      this.broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'DATA_UPDATE') {
          this.bins = event.data.bins
          this.vehicles = event.data.vehicles
          this.notifyListeners()
        }
      }
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error)
    }
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
    return null
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        bins: this.bins,
        vehicles: this.vehicles,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to save to storage:', error)
    }
  }

  // Broadcast data to other tabs/apps
  private broadcastData() {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'DATA_UPDATE',
          bins: this.bins,
          vehicles: this.vehicles
        })
      } catch (error) {
        console.error('Failed to broadcast:', error)
      }
    }
  }

  // Subscribe to data changes
  subscribe(callback: (data: { bins: Bin[], vehicles: Vehicle[] }) => void) {
    this.listeners.push(callback)
    // Immediately send current data
    callback({ bins: this.bins, vehicles: this.vehicles })
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => {
      callback({ bins: this.bins, vehicles: this.vehicles })
    })
  }

  // Fetch data from backend
  async fetchData() {
    try {
      const [binsResponse, vehiclesResponse] = await Promise.all([
        fetch(`${this.backendUrl}/api/bins`),
        fetch(`${this.backendUrl}/api/vehicles`)
      ])
      
      if (binsResponse.ok) {
        const binsData = await binsResponse.json()
        if (binsData.length > 0) {
          this.bins = binsData
        }
      }
      
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json()
        if (vehiclesData.length > 0) {
          this.vehicles = vehiclesData
        }
      }
      
      this.saveToStorage()
      this.broadcastData()
      this.notifyListeners()
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  startDataFetching() {
    this.fetchData()
    this.dataUpdateInterval = setInterval(() => {
      this.fetchData()
    }, 5000)
  }

  // Simulate system behavior
  startSimulation() {
    this.simulationInterval = setInterval(() => {
      // Update bins - gradually fill up
      this.bins = this.bins.map(bin => {
        let newStatus = bin.status + (Math.random() * 3)
        if (newStatus > 100) newStatus = 100
        return { ...bin, status: Math.round(newStatus) }
      })

      // Update vehicles
      this.vehicles = this.vehicles.map(vehicle => {
        // Moving vehicles
        if (vehicle.status === 'moving' && vehicle.targetBin) {
          const target = this.bins.find(b => b.id === vehicle.targetBin)
          if (target) {
            const [lat, lng] = vehicle.coordinates
            const [targetLat, targetLng] = target.location
            
            // Move towards target
            const speed = 0.0005
            const newLat = lat + (targetLat - lat) * speed
            const newLng = lng + (targetLng - lng) * speed
            
            // Check if reached target
            const distance = Math.sqrt(Math.pow(targetLat - newLat, 2) + Math.pow(targetLng - newLng, 2))
            if (distance < 0.001) {
              // Clean the bin
              this.bins = this.bins.map(b => 
                b.id === vehicle.targetBin ? { ...b, status: 0 } : b
              )
              
              return {
                ...vehicle,
                coordinates: [newLat, newLng] as [number, number],
                status: 'active',
                targetBin: undefined,
                cleaned: (vehicle.cleaned || 0) + 1
              }
            }
            
            return {
              ...vehicle,
              coordinates: [newLat, newLng] as [number, number],
              speed: 45 + Math.random() * 10
            }
          }
        }
        
        // Idle vehicles - find full bins
        if (vehicle.status === 'active' && !vehicle.targetBin) {
          const fullBins = this.bins.filter(b => b.status >= 90)
          if (fullBins.length > 0) {
            const [vLat, vLng] = vehicle.coordinates
            let nearestBin: Bin | null = null
            let minDistance = Infinity
            
            fullBins.forEach(bin => {
              const [bLat, bLng] = bin.location
              const dist = Math.sqrt(Math.pow(bLat - vLat, 2) + Math.pow(bLng - vLng, 2))
              if (dist < minDistance) {
                minDistance = dist
                nearestBin = bin
              }
            })
            
            if (nearestBin) {
              return {
                ...vehicle,
                status: 'moving',
                targetBin: nearestBin.id
              }
            }
          }
        }
        
        return vehicle
      })

      this.saveToStorage()
      this.broadcastData()
      this.notifyListeners()
    }, 3000)
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
    }
    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval)
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
  }

  getBins() {
    return this.bins
  }

  getVehicles() {
    return this.vehicles
  }

  // Update bin status (for manual changes)
  updateBin(binId: string, updates: Partial<Bin>) {
    this.bins = this.bins.map(bin => 
      bin.id === binId ? { ...bin, ...updates } : bin
    )
    this.saveToStorage()
    this.broadcastData()
    this.notifyListeners()
    
    // Send to backend
    fetch(`${this.backendUrl}/api/bins/${binId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('Failed to update bin:', err))
  }

  // Update vehicle status (for manual changes)
  updateVehicle(vehicleId: string, updates: Partial<Vehicle>) {
    this.vehicles = this.vehicles.map(vehicle => 
      vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle
    )
    this.saveToStorage()
    this.broadcastData()
    this.notifyListeners()
    
    // Send to backend
    fetch(`${this.backendUrl}/api/vehicles/${vehicleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error('Failed to update vehicle:', err))
  }
}

// Singleton instance
const mapDataService = new MapDataService()

export default mapDataService
