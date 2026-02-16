import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import { useAppContext } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

interface LiveMapProps {
  compact?: boolean
}

interface Bin {
  id: string
  location: [number, number]
  address: string
  status: number
  capacity: number
  fillLevel?: number
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
}

interface Route {
  id: string
  name: string
  vehicle: string
  bins: string[]
  progress: number
  distance: string
  estimatedTime: string
  isActive: boolean
  path: [number, number][]
}

const LiveMap = ({ compact = false }: LiveMapProps) => {
  const { language } = useLanguage()
  const { binsData, vehiclesData, binStatus, setBinStatus, setBinsData, updateVehicleState } = useAppContext()
  
  // Suppress unused variable warnings
  void compact
  void language
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const binMarkersRef = useRef<L.Marker[]>([])
  const vehicleMarkersRef = useRef<L.Marker[]>([])
  const routeLinesRef = useRef<L.Polyline[]>([])
  
  const [routesData, setRoutesData] = useState<Route[]>([])
  const [loading, setLoading] = useState(false) // Start with false
  const [mapReady, setMapReady] = useState(false)

  // Helper: Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Helper: Update route
  const updateRoute = (routeId: string, updates: Partial<Route>) => {
    setRoutesData(prev => prev.map(route =>
      route.id === routeId ? { ...route, ...updates } : route
    ))
  }

  // Fetch route from OSRM API
  const fetchRouteFromOSRM = async (
    startLat: number, 
    startLon: number, 
    endLat: number, 
    endLon: number
  ) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&continue_straight=true`
      
      console.log(`🗺️ OSRM API: Calculating route...`)
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const coordinates = route.geometry.coordinates
        const leafletCoordinates: [number, number][] = coordinates.map((coord: number[]) => [coord[1], coord[0]])
        const simplifiedCoordinates = leafletCoordinates.filter((_coord, index) => {
          if (index === 0 || index === leafletCoordinates.length - 1) return true
          return index % 3 === 0
        })
        
        const distanceKm = (route.distance / 1000).toFixed(2)
        const durationMin = (route.duration / 60).toFixed(1)
        
        console.log(`✅ Route found: ${distanceKm} km, ${durationMin} min`)
        
        return {
          success: true,
          path: simplifiedCoordinates,
          distance: distanceKm,
          duration: durationMin
        }
      } else {
        console.warn('⚠️ OSRM: Route not found')
        return { success: false }
      }
    } catch (error) {
      console.error('❌ OSRM API error:', error)
      return { success: false }
    }
  }

  // Build patrol routes for vehicles
  useEffect(() => {
    vehiclesData.forEach(vehicle => {
      if (vehicle.isPatrolling && vehicle.patrolRoute && vehicle.patrolRoute.length === 0 && vehicle.patrolWaypoints) {
        console.log(`🗺️ Building patrol route for ${vehicle.id}...`)
        
        const buildPatrolRoute = async () => {
          const waypoints = vehicle.patrolWaypoints!
          let fullRoute: [number, number][] = []
          
          for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i]
            const end = waypoints[i + 1]
            
            const result = await fetchRouteFromOSRM(start[0], start[1], end[0], end[1])
            
            if (result.success && result.path) {
              fullRoute = [...fullRoute, ...result.path]
            } else {
              fullRoute = [...fullRoute, start, end]
            }
          }
          
          console.log(`✅ Patrol route ready for ${vehicle.id}: ${fullRoute.length} points`)
          
          updateVehicleState(vehicle.id, {
            patrolRoute: fullRoute,
            position: fullRoute[0] || vehicle.position
          })
        }
        
        buildPatrolRoute()
      }
    })
  }, [vehiclesData.map(v => `${v.id}-${v.isPatrolling}-${v.patrolRoute?.length}`).join(',')])

  // Patrol animation for all vehicles
  useEffect(() => {
    const intervals: { [key: string]: ReturnType<typeof setInterval> } = {}
    
    vehiclesData.forEach(vehicle => {
      if (vehicle.isPatrolling && vehicle.patrolRoute && vehicle.patrolRoute.length > 0 && !vehicle.routePath) {
        intervals[vehicle.id] = setInterval(() => {
          const nextIndex = (vehicle.patrolIndex || 0) + 1
          
          // If reached end of route, extend with new random destination
          if (nextIndex >= vehicle.patrolRoute!.length) {
            console.log(`🔄 ${vehicle.id}: Extending patrol route...`)
            
            const currentPos = vehicle.patrolRoute![vehicle.patrolRoute!.length - 1]
            const randomLat = currentPos[0] + (Math.random() - 0.5) * 0.025
            const randomLon = currentPos[1] + (Math.random() - 0.5) * 0.025
            
            const extendRoute = async () => {
              const result = await fetchRouteFromOSRM(
                currentPos[0], currentPos[1],
                randomLat, randomLon
              )
              
              if (result.success && result.path && result.path.length > 1) {
                console.log(`✅ ${vehicle.id}: Extended route (${result.path.length} points)`)
                const extendedRoute = [...vehicle.patrolRoute!, ...result.path.slice(1)]
                updateVehicleState(vehicle.id, {
                  patrolRoute: extendedRoute
                })
              } else {
                const extendedRoute = [...vehicle.patrolRoute!, [randomLat, randomLon] as [number, number]]
                updateVehicleState(vehicle.id, {
                  patrolRoute: extendedRoute
                })
              }
            }
            
            extendRoute()
          } else {
            // Move to next point
            updateVehicleState(vehicle.id, {
              position: vehicle.patrolRoute![nextIndex],
              patrolIndex: nextIndex
            })
          }
        }, 2500) // 2.5 seconds per point
      }
    })
    
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval))
    }
  }, [vehiclesData.map(v => `${v.id}-${v.isPatrolling}-${v.patrolRoute?.length}-${v.routePath ? 'route' : 'no'}-${v.patrolIndex}`).join(',')])

  // When bin becomes FULL, send closest vehicle
  useEffect(() => {
    console.log('🔍 Checking bin status:', binStatus)
    console.log('🔍 Vehicles count:', vehiclesData.length)
    console.log('🔍 Vehicles data:', vehiclesData.map(v => ({
      id: v.id,
      isPatrolling: v.isPatrolling,
      hasRoutePath: !!v.routePath,
      hasCleanedOnce: v.hasCleanedOnce
    })))
    
    if (binStatus === 'FULL' && vehiclesData.length > 0) {
      const binData = binsData[0]
      
      if (!binData) {
        console.log('❌ No bin data available')
        return
      }
      
      // Check if any vehicle is already going to bin or has cleaned
      const hasAnyGoingToBin = vehiclesData.some(v => !v.isPatrolling && v.routePath)
      const hasAnyCleanedOnce = vehiclesData.some(v => v.hasCleanedOnce)
      
      console.log('🔍 hasAnyGoingToBin:', hasAnyGoingToBin)
      console.log('🔍 hasAnyCleanedOnce:', hasAnyCleanedOnce)
      
      if (hasAnyGoingToBin || hasAnyCleanedOnce) {
        console.log('⏭️ Vehicle already assigned or cleaned, skipping')
        return
      }
      
      console.log('🚛 Bin is FULL! Finding closest vehicle...')
      
      // Calculate distances for all patrolling vehicles
      const distances = vehiclesData
        .filter(v => v.isPatrolling)
        .map(vehicle => ({
          vehicle,
          distance: calculateDistance(
            vehicle.position[0],
            vehicle.position[1],
            binData.location[0],
            binData.location[1]
          )
        }))
      
      console.log('🔍 Patrolling vehicles:', distances.length)
      console.log('🔍 Distances:', distances.map(d => ({ id: d.vehicle.id, distance: d.distance.toFixed(2) })))
      
      if (distances.length === 0) {
        console.log('❌ No patrolling vehicles available')
        return
      }
      
      // Find closest vehicle
      const closest = distances.reduce((prev, curr) => 
        curr.distance < prev.distance ? curr : prev
      )
      
      console.log(`✅ Closest vehicle: ${closest.vehicle.id} (${closest.distance.toFixed(2)} km)`)
      
      // Send vehicle to bin
      const getRoute = async () => {
        const result = await fetchRouteFromOSRM(
          closest.vehicle.position[0],
          closest.vehicle.position[1],
          binData.location[0],
          binData.location[1]
        )
        
        const route = result.success && result.path ? result.path : [closest.vehicle.position, binData.location]
        
        updateVehicleState(closest.vehicle.id, {
          isPatrolling: false,
          routePath: route,
          currentPathIndex: 0
        })
        
        // Create route
        const newRoute: Route = {
          id: `ROUTE-${Date.now()}`,
          name: `${closest.vehicle.driver} → ${binData.address}`,
          vehicle: closest.vehicle.id,
          bins: [binData.id],
          progress: 0,
          distance: result.success ? `${result.distance} km` : 'Unknown',
          estimatedTime: result.success ? `${result.duration} min` : 'Unknown',
          isActive: true,
          path: route
        }
        
        setRoutesData(prev => [...prev, newRoute])
        
        console.log(`🚀 ${closest.vehicle.id} dispatched to bin!`)
      }
      
      getRoute()
    }
  }, [binStatus]) // Only depend on binStatus, not vehiclesData

  // Vehicle going to bin animation
  useEffect(() => {
    const intervals: { [key: string]: ReturnType<typeof setInterval> } = {}
    
    vehiclesData.forEach(vehicle => {
      if (!vehicle.isPatrolling && vehicle.routePath) {
        const startTime = Date.now()
        
        intervals[vehicle.id] = setInterval(() => {
          const nextIndex = (vehicle.currentPathIndex || 0) + 1
          
          if (nextIndex >= vehicle.routePath!.length) {
            // Vehicle reached bin
            console.log(`✅ ${vehicle.id} reached bin!`)
            console.log('⏸️ Waiting 3 seconds before cleaning...')
            
            clearInterval(intervals[vehicle.id])
            
            // Update route progress to 100%
            const activeRoute = routesData.find(r => r.vehicle === vehicle.id && r.isActive)
            if (activeRoute) {
              updateRoute(activeRoute.id, { progress: 100 })
            }
            
            // Wait 3 seconds, then clean
            setTimeout(() => {
              console.log('🧹 Cleaning started!')
              
              // Calculate distance traveled
              const distanceTraveled = calculateDistance(
                vehicle.routePath![0][0],
                vehicle.routePath![0][1],
                binsData[0].location[0],
                binsData[0].location[1]
              )
              
              // Calculate duration in minutes
              const endTime = Date.now()
              const durationMinutes = Math.round((endTime - startTime) / 1000 / 60) || 1
              
              // Create cleaning data
              const cleaningData = {
                binId: binsData[0].id,
                vehicleId: vehicle.id,
                driverName: vehicle.driver,
                binLocation: binsData[0].address,
                fillLevelBefore: 95,
                fillLevelAfter: 15,
                distanceTraveled: distanceTraveled,
                durationMinutes: durationMinutes,
                notes: `Avtomatik tozalash (ESP32 signali) - ${vehicle.id}`,
                status: 'completed'
              }
              
              // Call backend API to create cleaning record
              api.createCleaning(cleaningData)
                .then(result => {
                  if (result.success) {
                    console.log('✅ Tozalash yozuvi yaratildi:', result.data)
                  } else {
                    console.error('❌ Tozalash yozuvi yaratishda xatolik:', result.error)
                  }
                })
                .catch(error => {
                  console.error('❌ API xatolik:', error)
                })
              
              // Suppress unused variable warning
              void startTime
              
              // Clean bin
              console.log('🟢 Bin cleaned - turning green')
              setBinStatus('EMPTY')
              
              setBinsData(prev => prev.map(bin =>
                bin.id === binsData[0].id ? {
                  ...bin,
                  status: 15,
                  fillLevel: 15
                } : bin
              ))
              
              console.log(`✅ ${vehicle.id} returning to patrol...`)
              
              // Return to patrol
              updateVehicleState(vehicle.id, {
                isPatrolling: true,
                routePath: undefined,
                hasCleanedOnce: true,
                currentPathIndex: 0,
                patrolRoute: [],
                patrolIndex: 0,
                cleaned: (vehicle.cleaned || 0) + 1,
                status: 'moving'
              })
              
              // Remove route
              if (activeRoute) {
                setRoutesData(prev => prev.filter(r => r.id !== activeRoute.id))
              }
            }, 3000) // 3 seconds cleaning time
          } else {
            // Move to next point
            updateVehicleState(vehicle.id, {
              position: vehicle.routePath![nextIndex],
              currentPathIndex: nextIndex
            })
            
            // Update route progress
            const progress = Math.round((nextIndex / vehicle.routePath!.length) * 100)
            const activeRoute = routesData.find(r => r.vehicle === vehicle.id && r.isActive)
            if (activeRoute) {
              updateRoute(activeRoute.id, { progress })
            }
          }
        }, 2000) // 2 seconds per point when going to bin
      }
    })
    
    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval))
    }
  }, [vehiclesData.map(v => `${v.id}-${v.isPatrolling}-${v.routePath ? 'route' : 'no'}-${v.currentPathIndex}`).join(',')])

  // Initialize map - wait for ref to be ready
  useEffect(() => {
    if (!mapReady) {
      console.log('⏳ Waiting for map container to be ready...')
      return
    }
    
    console.log('🔄 Map initialization effect triggered')
    console.log('📍 mapRef.current:', mapRef.current)
    console.log('📍 mapInstanceRef.current:', mapInstanceRef.current)
    
    if (!mapRef.current) {
      console.log('❌ Map ref not ready')
      setLoading(false)
      return
    }
    
    if (mapInstanceRef.current) {
      console.log('⚠️ Map already initialized')
      setLoading(false)
      return
    }

    // Wait for container to have proper dimensions
    const initMap = () => {
      if (!mapRef.current) {
        console.log('❌ Map ref lost during init')
        setLoading(false)
        return
      }
      
      const container = mapRef.current
      const rect = container.getBoundingClientRect()
      
      console.log('📐 Container dimensions:', rect.width, 'x', rect.height)
      
      if (rect.height === 0 || rect.width === 0) {
        console.log('⚠️ Container dimensions are 0, retrying...')
        setTimeout(initMap, 100)
        return
      }
      
      try {
        console.log('🗺️ Creating Leaflet map...')
        const map = L.map(container, {
          center: [39.6742637, 66.9737814],
          zoom: 16,
          zoomControl: true,
          attributionControl: true
        })
        mapInstanceRef.current = map

        console.log('🗺️ Adding tile layer...')
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)
        
        console.log('✅ Map initialized successfully')
        
        // Force map to recalculate size
        setTimeout(() => {
          if (map) {
            map.invalidateSize()
            console.log('🔄 Map size invalidated')
          }
        }, 100)
        
        // Set loading to false after map is ready
        setLoading(false)
        console.log('✅ Loading state set to false')
      } catch (error) {
        console.error('❌ Map initialization error:', error)
        setLoading(false)
      }
    }
    
    setTimeout(initMap, 100)

    return () => {
      if (mapInstanceRef.current) {
        console.log('🗑️ Removing map')
        try {
          mapInstanceRef.current.remove()
        } catch (error) {
          console.error('Error removing map:', error)
        }
        mapInstanceRef.current = null
      }
    }
  }, [mapReady]) // Depend on mapReady

  // Update markers on map
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Remove old markers
    binMarkersRef.current.forEach(marker => map.removeLayer(marker))
    vehicleMarkersRef.current.forEach(marker => map.removeLayer(marker))
    routeLinesRef.current.forEach(line => map.removeLayer(line))
    
    binMarkersRef.current = []
    vehicleMarkersRef.current = []
    routeLinesRef.current = []

    // Add bin markers
    binsData.forEach(bin => {
      const binColor = bin.status >= 90 ? '#ef4444' : '#10b981'
      const binIcon = L.divIcon({
        html: `<div style="background: ${binColor}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })

      const marker = L.marker(bin.location, { icon: binIcon })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>${bin.id}</h4>
            <p><strong>Address:</strong> ${bin.address}</p>
            <p><strong>Status:</strong> ${bin.status}%</p>
            <p><strong>Capacity:</strong> ${bin.capacity}L</p>
          </div>
        `)
      
      binMarkersRef.current.push(marker)
    })

    // Add vehicle markers
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
    
    vehiclesData.forEach((vehicle, index) => {
      const vehicleColor = vehicle.isMoving ? colors[index % colors.length] : '#6b7280'
      
      const vehicleIcon = L.divIcon({
        html: `<div style="background: ${vehicleColor}; width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); border: 2px solid white;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
          </svg>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44]
      })

      const marker = L.marker(vehicle.position, { icon: vehicleIcon })
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>${vehicle.id}</h4>
            <p><strong>Driver:</strong> ${vehicle.driver}</p>
            <p><strong>Status:</strong> ${vehicle.status === 'moving' ? 'Moving' : vehicle.status === 'active' ? 'Active' : 'Inactive'}</p>
            <p><strong>Cleaned:</strong> ${vehicle.cleaned || 0}</p>
          </div>
        `)
      
      vehicleMarkersRef.current.push(marker)

      // Add route line if vehicle is going to bin
      if (vehicle.routePath && vehicle.routePath.length > 0) {
        const routeLine = L.polyline(vehicle.routePath, {
          color: colors[index % colors.length],
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 4'
        }).addTo(map)
        
        routeLinesRef.current.push(routeLine)
      }
    })

  }, [binsData, vehiclesData])

  const centerMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([39.6742637, 66.9737814], 16)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        background: '#f9fafb'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading map...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        background: '#fff'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          <i className="fas fa-map-marked-alt" style={{ marginRight: '8px' }}></i>
          Live Map
        </h3>
        <button 
          onClick={centerMap}
          style={{
            padding: '8px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <i className="fas fa-crosshairs" style={{ marginRight: '6px' }}></i>
          Center
        </button>
      </div>
      
      <div 
        ref={(el) => {
          mapRef.current = el
          if (el && !mapReady) {
            console.log('✅ Map container ref is ready!')
            setMapReady(true)
          }
        }}
        className="leaflet-container" 
        style={{ 
          flex: 1, 
          width: '100%', 
          minHeight: '500px',
          position: 'relative',
          background: '#e5e7eb'
        }}
      ></div>
      
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#555', fontSize: '12px' }}>Bins:</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
              <span>Empty (&lt;90%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
              <span>Full (≥90%)</span>
            </div>
          </div>
        </div>
        
        <div>
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#555', fontSize: '12px' }}>Vehicles:</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {vehiclesData.slice(0, 3).map((vehicle, index) => {
              const colors = ['#3b82f6', '#f59e0b', '#10b981']
              return (
                <div key={vehicle.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <div style={{ width: '16px', height: '16px', background: colors[index], borderRadius: '4px' }}></div>
                  <span>{vehicle.id}</span>
                </div>
              )
            })}
            {vehiclesData.length > 3 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: '16px', height: '16px', background: '#8b5cf6', borderRadius: '4px' }}></div>
                <span>+{vehiclesData.length - 3} more</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMap
