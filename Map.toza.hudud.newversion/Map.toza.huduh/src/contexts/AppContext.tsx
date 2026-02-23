import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'

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
    // Load from localStorage on init - ADMIN PANEL BILAN BIR XIL KEY
    try {
      const saved = localStorage.getItem('vehiclesData') // ADMIN PANEL BILAN BIR XIL
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('🚛 Vehicles loaded from localStorage:', parsed.length)
        return parsed
      }
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error)
    }
    return []
  })
  const [binStatus, setBinStatus] = useState<'EMPTY' | 'FULL'>('EMPTY')
  const binsDataRef = useRef<Bin[]>([])
  const vehiclesDataRef = useRef<Vehicle[]>([])

  const normalizeRoutePath = (routePath: Vehicle['routePath'] | null | undefined): Vehicle['routePath'] | undefined => {
    if (Array.isArray(routePath) && routePath.length === 0) return undefined
    return routePath === null ? undefined : routePath
  }

  const hasRoutePoints = (routePath: Vehicle['routePath'] | null | undefined): boolean => {
    return Array.isArray(routePath) && routePath.length > 0
  }

  useEffect(() => {
    binsDataRef.current = binsData
  }, [binsData])

  useEffect(() => {
    vehiclesDataRef.current = vehiclesData
  }, [vehiclesData])

  // Helper: Create route for vehicle to bin (like admin panel)
  const createRouteForVehicle = async (vehicle: Vehicle, bin: Bin) => {
    console.log(`🛣️ Creating route for ${vehicle.id} to ${bin.id}`)
    
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${vehicle.position[1]},${vehicle.position[0]};${bin.location[1]},${bin.location[0]}?overview=full&geometries=geojson&continue_straight=true`
      const response = await fetch(url)
      const data = await response.json()
      
      let route: [number, number][] = [vehicle.position, bin.location]
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates
        route = coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
        
        console.log(`✅ Route found: ${(routeData.distance / 1000).toFixed(2)} km, ${(routeData.duration / 60).toFixed(1)} min`)
      }
      
      // Update vehicle state
      updateVehicleState(vehicle.id, {
        isPatrolling: false,
        routePath: route,
        currentPathIndex: 0
      })
      
      console.log(`✅ ${vehicle.id} dispatched to bin!`)
    } catch (error) {
      console.error('❌ Error creating route:', error)
    }
  }

  // Update vehicle state helper
  const updateVehicleState = (vehicleId: string, updates: Partial<Vehicle>) => {
    setVehiclesData(prev => prev.map(vehicle =>
      vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle
    ))
    
    // Backend'ga ham yuborish (admin paneldagidek)
    if (updates.isPatrolling !== undefined || updates.hasCleanedOnce !== undefined || 
        updates.patrolIndex !== undefined || updates.status !== undefined) {
      const API_URL = import.meta.env.VITE_API_URL || 'https://tozahudud-production-d73f.up.railway.app'
      fetch(`${API_URL}/vehicles/${vehicleId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPatrolling: updates.isPatrolling,
          hasCleanedOnce: updates.hasCleanedOnce,
          patrolIndex: updates.patrolIndex,
          status: updates.status,
          patrolRoute: updates.patrolRoute,
          currentRoute: updates.routePath
        })
      }).catch(err => console.error('Failed to sync state:', err))
    }
  }

  // Save vehicles to localStorage whenever they change - ADMIN PANEL BILAN BIR XIL KEY
  useEffect(() => {
    if (vehiclesData.length > 0) {
      try {
        localStorage.setItem('vehiclesData', JSON.stringify(vehiclesData)) // ADMIN PANEL BILAN BIR XIL
        console.log('💾 Vehicles saved to localStorage:', vehiclesData.length)
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
          
          setBinsData(transformedBins)
          
          // Update binStatus based on fillLevel FROM BACKEND - ALWAYS sync with backend
          if (transformedBins.length > 0) {
            const firstBin = transformedBins[0]
            console.log('🔍 First bin fillLevel FROM BACKEND:', firstBin.fillLevel)
            console.log('🔍 Current binStatus in frontend:', binStatus)
            
            if (firstBin.fillLevel >= 90) {
              console.log('🔴 Bin is FULL! Setting binStatus to FULL')
              setBinStatus('FULL')
              
              // DISPATCH: Eng yaqin mashinani topish (polling orqali ham)
              if (vehiclesData.length > 0) {
                const vehicleGoingToBin = vehiclesData.find(v => !v.isPatrolling && hasRoutePoints(v.routePath))
                
                if (!vehicleGoingToBin) {
                  console.log('🚛 [POLLING] Finding closest vehicle...')
                  
                  // Faqat patrol qilayotgan va hali tozalamagan mashinalar
                  const patrollingVehicles = vehiclesData.filter(v => v.isPatrolling && !v.hasCleanedOnce)
                  
                  if (patrollingVehicles.length > 0) {
                    const distances = patrollingVehicles.map(vehicle => {
                      const R = 6371
                      const dLat = (firstBin.location[0] - vehicle.position[0]) * Math.PI / 180
                      const dLon = (firstBin.location[1] - vehicle.position[1]) * Math.PI / 180
                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                Math.cos(vehicle.position[0] * Math.PI / 180) * Math.cos(firstBin.location[0] * Math.PI / 180) *
                                Math.sin(dLon/2) * Math.sin(dLon/2)
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                      return { vehicle, distance: R * c }
                    })
                    
                    const closest = distances.reduce((min, curr) => 
                      curr.distance < min.distance ? curr : min
                    )
                    
                    console.log(`✅ [POLLING] Closest vehicle: ${closest.vehicle.id} (${closest.distance.toFixed(2)} km)`)
                    createRouteForVehicle(closest.vehicle, firstBin)
                  } else {
                    console.log('⏭️ [POLLING] No available vehicles (all cleaned or going to bin)')
                  }
                }
              }
            } else {
              // Backend'da fillLevel < 90 bo'lsa, EMPTY qilish
              console.log('🟢 Bin is EMPTY! Setting binStatus to EMPTY')
              setBinStatus('EMPTY')
            }
          }
        }
        
        // Load vehicles - ALWAYS update positions from backend
        const vehiclesResult = await api.getVehicles()
        if (vehiclesResult.success && vehiclesResult.data) {
          let vehiclesArray = Array.isArray(vehiclesResult.data) ? vehiclesResult.data : vehiclesResult.data.data || []
          
          // ✅ ALWAYS update - load fresh positions from backend
          const transformedVehicles: Vehicle[] = vehiclesArray.map((vehicle: any, index: number) => {
            const vehicleId = vehicle.code || vehicle.vehicleId || `VEH-${String(index + 1).padStart(3, '0')}`
            
            // Check if vehicle exists in localStorage
            const existingVehicle = vehiclesData.find(v => v.id === vehicleId)
            
            if (existingVehicle) {
              // ✅ Check if we should update position from backend
              const backendPosition: [number, number] = [parseFloat(vehicle.latitude), parseFloat(vehicle.longitude)]
              const currentPosition = existingVehicle.position
              
              // Calculate distance between backend and current position
              const distance = Math.sqrt(
                Math.pow(backendPosition[0] - currentPosition[0], 2) + 
                Math.pow(backendPosition[1] - currentPosition[1], 2)
              )
              
              // If vehicle is patrolling and distance is small (< 0.01 degrees ~1km), ignore backend position
              // This prevents teleportation during patrol animation
              const shouldUpdatePosition = !existingVehicle.isPatrolling || distance > 0.01
              
              if (shouldUpdatePosition) {
                console.log(`🔄 Updating vehicle ${vehicleId} from backend`)
                console.log(`   Backend position: [${vehicle.latitude}, ${vehicle.longitude}]`)
                console.log(`   Old position: [${currentPosition[0]}, ${currentPosition[1]}]`)
                console.log(`   Distance: ${(distance * 111).toFixed(0)} km`)
              } else {
                console.log(`⏭️ Skipping position update for ${vehicleId} (patrolling, distance: ${(distance * 111).toFixed(0)} m)`)
              }
              
              // Use backend position only if needed
              return {
                ...existingVehicle,
                driver: vehicle.driverName || vehicle.driver || existingVehicle.driver,
                phone: vehicle.phone || existingVehicle.phone,
                cleaned: vehicle.totalCleanings || existingVehicle.cleaned,
                position: shouldUpdatePosition ? backendPosition : existingVehicle.position,
                // ✅ FORCE isPatrolling to true if no routePath (not going to bin)
                isPatrolling: vehicle.isPatrolling !== undefined ? vehicle.isPatrolling : true,
                hasCleanedOnce: vehicle.hasCleanedOnce !== undefined ? vehicle.hasCleanedOnce : false,
                patrolIndex: vehicle.patrolIndex !== undefined ? vehicle.patrolIndex : 0,
                status: 'moving', // ✅ FORCE status to moving
                // ✅ Reset patrol route to empty so it gets rebuilt
                patrolRoute: [],
                routePath: undefined,
                // ✅ Generate patrol waypoints if empty
                patrolWaypoints: existingVehicle.patrolWaypoints && existingVehicle.patrolWaypoints.length > 0 
                  ? existingVehicle.patrolWaypoints 
                  : (() => {
                      const binLocation = binsData.length > 0 ? binsData[0].location : [39.6742637, 66.9737814]
                      const MAX_DISTANCE = 0.005
                      const waypoints: [number, number][] = []
                      for (let i = 0; i < 4; i++) {
                        const randomLat = binLocation[0] + (Math.random() - 0.5) * MAX_DISTANCE * 2
                        const randomLon = binLocation[1] + (Math.random() - 0.5) * MAX_DISTANCE * 2
                        waypoints.push([randomLat, randomLon])
                      }
                      console.log(`   Generated ${waypoints.length} patrol waypoints for ${vehicleId}`)
                      return waypoints
                    })()
              }
            } else {
              // New vehicle - load from backend
              console.log(`➕ New vehicle ${vehicleId} - loading from backend`)
              console.log(`   Position: [${vehicle.latitude}, ${vehicle.longitude}]`)
              
              // ✅ Generate random patrol waypoints (4 points around bin)
              const binLocation = binsData.length > 0 ? binsData[0].location : [39.6742637, 66.9737814]
              const MAX_DISTANCE = 0.005 // ~500m
              
              const patrolWaypoints: [number, number][] = []
              for (let i = 0; i < 4; i++) {
                const randomLat = binLocation[0] + (Math.random() - 0.5) * MAX_DISTANCE * 2
                const randomLon = binLocation[1] + (Math.random() - 0.5) * MAX_DISTANCE * 2
                patrolWaypoints.push([randomLat, randomLon])
              }
              
              console.log(`   Generated ${patrolWaypoints.length} patrol waypoints`)
              
              return {
                id: vehicleId,
                driver: vehicle.driverName || vehicle.driver || `Driver ${index + 1}`,
                phone: vehicle.phone || '+998 90 123 45 67',
                status: vehicle.status || 'moving',
                location: vehicle.location || 'Samarqand',
                position: [parseFloat(vehicle.latitude), parseFloat(vehicle.longitude)] as [number, number],
                cleaned: vehicle.totalCleanings || 0,
                isMoving: true,
                isPatrolling: vehicle.isPatrolling !== undefined ? vehicle.isPatrolling : true,
                routePath: undefined,
                patrolRoute: [],
                patrolIndex: vehicle.patrolIndex || 0,
                currentPathIndex: 0,
                patrolWaypoints: patrolWaypoints,
                hasCleanedOnce: vehicle.hasCleanedOnce || false
              }
            }
          })
          
          console.log('✅ Vehicles loaded:', transformedVehicles.length)
          console.log('🚛 Vehicles data:', JSON.stringify(transformedVehicles, null, 2))
          setVehiclesData(transformedVehicles)
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
    
    // Direct socket.io connection (like admin panel)
    const socket = io('https://tozahudud-production-d73f.up.railway.app', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('✅ Haydovchi WebSocket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('❌ Haydovchi WebSocket disconnected')
    })
    
    // Listen for sensor data updates (ESP32 signals)
    socket.on('sensorData', (sensorData: any) => {
      console.log('📊 Sensor data:', sensorData)
      
      // Update bin status if distance <= 20cm (FULL)
      if (sensorData.distance <= 20) {
        console.log('🔴 Bin is FULL!')
        setBinStatus('FULL')
        
        // MUHIM: hasCleanedOnce ni reset qilish - yangi FULL signal uchun
        setVehiclesData(prev => prev.map(vehicle => ({
          ...vehicle,
          hasCleanedOnce: false
        })))
        
        // Update bin in binsData
        setBinsData(prev => prev.map(bin =>
          bin.sensorId === sensorData.binId || bin.id === sensorData.binId ? {
            ...bin,
            status: 95,
            fillLevel: 95,
            lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
          } : bin
        ))
        
        // DISPATCH: Eng yaqin mashinani topish va yuborish (admin paneldagidek)
        const fullBin = binsDataRef.current.find(b => b.sensorId === sensorData.binId || b.id === sensorData.binId)
        const currentVehicles = vehiclesDataRef.current
        if (fullBin && currentVehicles.length > 0) {
          console.log('🚛 [WEBSOCKET] Finding closest vehicle...')
          
          // Calculate distances - faqat patrol qilayotgan va hali tozalamagan mashinalar
          const distances = currentVehicles.map(vehicle => {
            if (!vehicle.isPatrolling || vehicle.hasCleanedOnce || hasRoutePoints(vehicle.routePath)) return { vehicle, distance: Infinity }
            
            const R = 6371 // Earth radius in km
            const dLat = (fullBin.location[0] - vehicle.position[0]) * Math.PI / 180
            const dLon = (fullBin.location[1] - vehicle.position[1]) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(vehicle.position[0] * Math.PI / 180) * Math.cos(fullBin.location[0] * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distance = R * c
            
            return { vehicle, distance }
          })
          
          // Find closest
          const closest = distances.reduce((min, curr) => 
            curr.distance < min.distance ? curr : min
          )
          
          if (closest.distance !== Infinity) {
            console.log(`✅ [WEBSOCKET] Closest vehicle: ${closest.vehicle.id} (${closest.distance.toFixed(2)} km)`)
            createRouteForVehicle(closest.vehicle, fullBin)
          } else {
            console.log('⏭️ [WEBSOCKET] No available vehicles (all cleaned or going to bin)')
          }
        }
      }
    })
    
    // Listen for bin updates (cleaning, etc.)
    socket.on('binUpdate', (binUpdate: any) => {
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
    })

    // ✨ YANGI: Mashina pozitsiyasi real-time yangilanganda
    socket.on('vehiclePositionUpdate', (data: any) => {
      console.log(`📥 Real-time position update: ${data.vehicleId} → [${data.latitude}, ${data.longitude}]`)
      
      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId ? {
          ...vehicle,
          position: [data.latitude, data.longitude] as [number, number]
        } : vehicle
      ))
    })

    // ✨ YANGI: Mashina holati real-time yangilanganda
    socket.on('vehicleStateUpdate', (data: any) => {
      console.log(`📥 Real-time state update: ${data.vehicleId}`, data)
      
      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId ? {
          ...vehicle,
          isPatrolling: data.isPatrolling !== undefined ? data.isPatrolling : vehicle.isPatrolling,
          hasCleanedOnce: data.hasCleanedOnce !== undefined ? data.hasCleanedOnce : vehicle.hasCleanedOnce,
          patrolIndex: data.patrolIndex !== undefined ? data.patrolIndex : vehicle.patrolIndex,
          status: data.status || vehicle.status,
          patrolRoute: data.patrolRoute !== undefined ? data.patrolRoute : vehicle.patrolRoute,
          routePath: data.currentRoute !== undefined ? normalizeRoutePath(data.currentRoute) : vehicle.routePath
        } : vehicle
      ))
    })
    
    return () => {
      console.log('🔌 Haydovchi WebSocket disconnecting...')
      socket.disconnect()
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
