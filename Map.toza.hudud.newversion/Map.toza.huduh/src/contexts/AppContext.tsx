import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { realtimeService } from '../services/realtimeService.js'

interface Bin {
  id: string
  location: [number, number]
  address: string
  status: number
  capacity: number
  fillLevel: number
  _backendId?: string
  district?: string
  lastUpdate?: string
  lastCleaned?: string
  type?: string
  sensorId?: string
  online?: boolean
  installDate?: string
  batteryLevel?: number
}

interface Vehicle {
  id: string
  driver: string
  status: string
  position: [number, number]
  cleaned?: number
  isMoving?: boolean
  isPatrolling?: boolean
  routePath?: [number, number][]
  patrolRoute?: [number, number][]
  patrolIndex?: number
  currentPathIndex?: number
  patrolWaypoints?: [number, number][]
  hasCleanedOnce?: boolean
  phone?: string
  location?: string
}

interface AppContextType {
  binsData: Bin[]
  setBinsData: React.Dispatch<React.SetStateAction<Bin[]>>
  vehiclesData: Vehicle[]
  setVehiclesData: React.Dispatch<React.SetStateAction<Vehicle[]>>
  binStatus: 'EMPTY' | 'FULL'
  setBinStatus: React.Dispatch<React.SetStateAction<'EMPTY' | 'FULL'>>
  updateVehicleState: (vehicleId: string, updates: Partial<Vehicle>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [binsData, setBinsData] = useState<Bin[]>([])
  const [vehiclesData, setVehiclesData] = useState<Vehicle[]>(() => {
    // Load from localStorage on init - ALOHIDA KEY ishlatamiz
    try {
      const saved = localStorage.getItem('newMapVehiclesData') // YANGI KEY
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('🚛 Vehicles loaded from localStorage (NEW MAP):', parsed.length)
        return parsed
      }
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error)
    }
    return []
  })
  const [binStatus, setBinStatus] = useState<'EMPTY' | 'FULL'>('EMPTY')

  // Update vehicle state helper
  const updateVehicleState = (vehicleId: string, updates: Partial<Vehicle>) => {
    setVehiclesData(prev => prev.map(vehicle =>
      vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle
    ))
  }

  // Save vehicles to localStorage whenever they change - ALOHIDA KEY
  useEffect(() => {
    if (vehiclesData.length > 0) {
      try {
        localStorage.setItem('newMapVehiclesData', JSON.stringify(vehiclesData)) // YANGI KEY
        console.log('💾 Vehicles saved to localStorage (NEW MAP):', vehiclesData.length)
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error)
      }
    }
  }, [vehiclesData])

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading data from backend...')
        
        // Load bins
        const binsResult = await api.getBins()
        if (binsResult.success && binsResult.data) {
          let binsArray = Array.isArray(binsResult.data) ? binsResult.data : binsResult.data.data || []
          
          console.log('📦 Raw bins from backend:', JSON.stringify(binsArray, null, 2))
          
          const transformedBins: Bin[] = binsArray.map((bin: any) => {
            console.log('🔍 Processing bin:', bin)
            console.log('🔍 bin.fillLevel:', bin.fillLevel, 'type:', typeof bin.fillLevel)
            
            const fillLevel = parseFloat(bin.fillLevel) || 15
            console.log('🔍 Parsed fillLevel:', fillLevel)
            
            return {
              id: bin.code || bin.id,
              _backendId: bin.id,
              location: [parseFloat(bin.latitude), parseFloat(bin.longitude)] as [number, number],
              address: bin.address || bin.location || 'Unknown',
              status: fillLevel,
              capacity: bin.capacity || 120,
              fillLevel: fillLevel,
              district: bin.district || 'Samarqand',
              lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
              lastCleaned: bin.lastCleaned || 'Hech qachon',
              type: bin.type || 'standard',
              sensorId: bin.sensorId || bin.code,
              online: bin.online !== false,
              installDate: bin.installDate || new Date().toLocaleDateString('uz-UZ'),
              batteryLevel: bin.batteryLevel || 100
            }
          })
          
          console.log('✅ Bins loaded:', transformedBins.length)
          console.log('📦 Bins data:', JSON.stringify(transformedBins, null, 2))
          
          // MUHIM: Quti rangini faqat backend'dan kelgan fillLevel ga qarab belgilash
          // Frontend'da o'zgartirilgan fillLevel'ni e'tiborsiz qoldirish
          setBinsData(transformedBins)
          
          // Update binStatus based on fillLevel FROM BACKEND
          if (transformedBins.length > 0) {
            const firstBin = transformedBins[0]
            console.log('🔍 First bin fillLevel FROM BACKEND:', firstBin.fillLevel)
            if (firstBin.fillLevel >= 90) {
              console.log('🔴 Bin is FULL! Setting binStatus to FULL')
              setBinStatus('FULL')
            } else {
              console.log('🟢 Bin is EMPTY! Setting binStatus to EMPTY')
              setBinStatus('EMPTY')
            }
          }
        }
        
        // Load vehicles
        const vehiclesResult = await api.getVehicles()
        if (vehiclesResult.success && vehiclesResult.data) {
          let vehiclesArray = Array.isArray(vehiclesResult.data) ? vehiclesResult.data : vehiclesResult.data.data || []
          
          // Only update if vehicle count changed (new vehicles added/removed)
          if (vehiclesArray.length !== vehiclesData.length) {
            const transformedVehicles: Vehicle[] = vehiclesArray.map((vehicle: any, index: number) => {
              // Check if vehicle exists in localStorage
              const existingVehicle = vehiclesData.find(v => v.id === (vehicle.code || vehicle.vehicleId || `VEH-${String(index + 1).padStart(3, '0')}`))
              
              if (existingVehicle) {
                // Merge with existing state (preserve position, patrol state, etc.)
                console.log(`🔄 Merging vehicle ${existingVehicle.id} with localStorage state (NEW MAP)`)
                return {
                  ...existingVehicle,
                  driver: vehicle.driverName || vehicle.driver || existingVehicle.driver,
                  phone: vehicle.phone || existingVehicle.phone,
                  cleaned: vehicle.totalCleanings || existingVehicle.cleaned
                }
              } else {
                // New vehicle - create fresh state with UNIQUE ID for new map
                const vehicleId = `NEWMAP-VEH-${String(index + 1).padStart(3, '0')}` // ALOHIDA ID
                const basePos: [number, number] = [39.6542, 66.9597]
                const patrolWaypoints: [number, number][] = [
                  [basePos[0] + (Math.random() - 0.5) * 0.02, basePos[1] + (Math.random() - 0.5) * 0.02],
                  [basePos[0] + (Math.random() - 0.5) * 0.02, basePos[1] + (Math.random() - 0.5) * 0.02],
                  [basePos[0] + (Math.random() - 0.5) * 0.02, basePos[1] + (Math.random() - 0.5) * 0.02],
                  [basePos[0] + (Math.random() - 0.5) * 0.02, basePos[1] + (Math.random() - 0.5) * 0.02]
                ]
                
                return {
                  id: vehicleId, // ALOHIDA ID
                  driver: vehicle.driverName || vehicle.driver || `New Map Driver ${index + 1}`,
                  phone: vehicle.phone || '+998 90 123 45 67',
                  status: vehicle.status || 'moving',
                  location: vehicle.location || 'Samarqand',
                  position: (vehicle.currentLatitude && vehicle.currentLongitude 
                    ? [parseFloat(vehicle.currentLatitude), parseFloat(vehicle.currentLongitude)]
                    : patrolWaypoints[0]) as [number, number],
                  cleaned: vehicle.totalCleanings || 0,
                  isMoving: true,
                  isPatrolling: true,
                  routePath: undefined,
                  patrolRoute: [],
                  patrolIndex: 0,
                  currentPathIndex: 0,
                  patrolWaypoints: patrolWaypoints,
                  hasCleanedOnce: false
                }
              }
            })
            
            console.log('✅ Vehicles loaded:', transformedVehicles.length)
            console.log('🚛 Vehicles data:', JSON.stringify(transformedVehicles, null, 2))
            setVehiclesData(transformedVehicles)
          } else {
            console.log('⏭️ Vehicles count unchanged, skipping update to preserve state')
          }
        }
      } catch (error) {
        console.error('❌ Error loading data:', error)
      }
    }
    
    loadData()
    
    // Refresh data every 5 seconds (more frequent for real-time feel)
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    console.log('🔌 Initializing WebSocket...')
    realtimeService.connect()
    
    // Listen for sensor data updates (ESP32 signals)
    realtimeService.onMapUpdate((data: any) => {
      console.log('📥 WebSocket update received:', data)
      
      if (data.type === 'sensorData' && data.data) {
        const sensorData = data.data
        console.log('📊 Sensor data:', sensorData)
        
        // Update bin status if distance <= 20cm (FULL)
        if (sensorData.distance <= 20) {
          console.log('🔴 Bin is FULL!')
          setBinStatus('FULL')
          
          // Update bin in binsData
          setBinsData(prev => prev.map(bin =>
            bin.sensorId === sensorData.binId || bin.id === sensorData.binId ? {
              ...bin,
              status: 95,
              fillLevel: 95,
              lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
            } : bin
          ))
        }
      }
      
      // Listen for bin updates (cleaning, etc.)
      if (data.type === 'binUpdate' && data.data) {
        const binUpdate = data.data
        console.log('📦 Bin update:', binUpdate)
        
        setBinsData(prev => prev.map(bin =>
          bin.id === binUpdate.binId || bin._backendId === binUpdate.binId ? {
            ...bin,
            status: binUpdate.fillLevel || bin.status,
            fillLevel: binUpdate.fillLevel || bin.fillLevel,
            lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
          } : bin
        ))
        
        // Update binStatus
        if (binUpdate.fillLevel >= 90) {
          setBinStatus('FULL')
        } else {
          setBinStatus('EMPTY')
        }
      }
    })
    
    return () => {
      realtimeService.disconnect()
    }
  }, [])

  const value: AppContextType = {
    binsData,
    setBinsData,
    vehiclesData,
    setVehiclesData,
    binStatus,
    setBinStatus,
    updateVehicleState
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
