import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { mockBins, mockVehicles, mockActivities, mockAlerts } from '../data/mockData'
import ApiService from '../services/api'
import { io } from 'socket.io-client'

const AppContext = createContext()

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })
  const [language, setLanguage] = useState(() => {
    // localStorage'dan tilni olish
    const savedLanguage = localStorage.getItem('language')
    
    // Agar saqlangan til mavjud va qo'llab-quvvatlanadigan tillardan biri bo'lsa
    if (savedLanguage && ['uz', 'ru', 'en'].includes(savedLanguage)) {
      return savedLanguage
    }
    
    // Default o'zbek tili
    return 'uz'
  })
  
  // Data states - start with empty arrays, will be populated from API
  const [binsData, setBinsData] = useState([
    // Xarita uchun default quti - bu "Qutilar" bo'limida ham ko'rinadi
    {
      id: 'ESP32-IBN-SINO',
      _backendId: null,
      address: 'Ibn Sino ko\'chasi 17A, Samarqand',
      district: 'Samarqand',
      location: [39.6742637, 66.9737814], // Ibn Sino ko'chasi 17A
      status: 15, // Bo'sh
      lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      lastCleaned: 'Hech qachon',
      capacity: 120,
      type: 'standard',
      sensorId: 'ESP32-IBN-SINO',
      online: true,
      installDate: new Date().toLocaleDateString('uz-UZ'),
      fillLevel: 15,
      batteryLevel: 100,
    }
  ])
  const [vehiclesData, setVehiclesData] = useState(() => {
    // localStorage'dan mashinalar holatini yuklash
    try {
      const savedVehicles = localStorage.getItem('vehiclesData')
      if (savedVehicles) {
        const parsed = JSON.parse(savedVehicles)
        console.log('🚛 localStorage dan mashinalar yuklandi:', parsed.length)
        return parsed
      }
    } catch (error) {
      console.error('❌ localStorage dan yuklashda xatolik:', error)
    }
    // Default bo'sh array
    return []
  })
  
  // Marshrutlar holati - "Marshrutlar" bo'limida ham, xaritada ham ko'rinadi
  // Faqat real-time faol marshrutlar ko'rsatiladi
  const [routesData, setRoutesData] = useState([])
  
  // Quti holati - FULL yoki EMPTY
  const [binStatus, setBinStatus] = useState('EMPTY')
  
  // Marshrutni yangilash
  const updateRoute = (routeId, updates) => {
    setRoutesData(prev => prev.map(route =>
      route.id === routeId ? { ...route, ...updates } : route
    ))
  }
  
  // Mashina holatini yangilash helper function
  const updateVehicleState = (vehicleId, updates) => {
    setVehiclesData(prev => prev.map(vehicle =>
      vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle
    ))
    
    // Backend'ga ham yuborish (async, kutmaymiz)
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
  
  // Marshrut yaratish helper function
  const createRoute = async (vehicle, bin) => {
    console.log(`🛣️ Creating route for ${vehicle.id} to ${bin.id}`)
    console.log(`📍 Vehicle current position: [${vehicle.position[0]}, ${vehicle.position[1]}]`)
    console.log(`📍 Bin location: [${bin.location[0]}, ${bin.location[1]}]`)
    
    // OSRM API dan marshrut olish
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${vehicle.position[1]},${vehicle.position[0]};${bin.location[1]},${bin.location[0]}?overview=full&geometries=geojson`
      const response = await fetch(url)
      const data = await response.json()
      
      let route = [vehicle.position, bin.location]
      let distance = 'Noma\'lum'
      let duration = 'Noma\'lum'
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        const coordinates = routeData.geometry.coordinates
        route = coordinates.map(coord => [coord[1], coord[0]])
        distance = `${(routeData.distance / 1000).toFixed(2)} km`
        duration = `${(routeData.duration / 60).toFixed(0)} daqiqa`
        
        console.log(`✅ OSRM route found: ${route.length} points, ${distance}, ${duration}`)
        console.log(`📍 Route starts from: [${route[0][0]}, ${route[0][1]}]`)
      } else {
        console.log(`⚠️ OSRM failed, using direct route`)
      }
      
      // Yangi marshrut yaratish
      const newRoute = {
        id: `ROUTE-${Date.now()}`,
        name: `${vehicle.driver} → ${bin.address}`,
        vehicle: vehicle.id,
        bins: [bin.id],
        progress: 0,
        distance: distance,
        estimatedTime: duration,
        isActive: true,
        path: route
      }
      
      // Mashina holatini yangilash
      updateVehicleState(vehicle.id, {
        isPatrolling: false,
        routePath: route,
        currentPathIndex: 0
      })
      
      // Marshrutni qo'shish
      setRoutesData(prev => [...prev, newRoute])
      
      console.log(`✅ Route created: ${newRoute.id}`)
    } catch (error) {
      console.error('❌ Error creating route:', error)
    }
  }
  
  const [activityData, setActivityData] = useState([]) // Bo'sh array - API dan yuklanadi
  const [alertsData, setAlertsData] = useState([])
  const [toasts, setToasts] = useState([])
  
  // API states
  const [apiConnected, setApiConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', language)
    localStorage.setItem('language', language)
  }, [language])

  // Mashinalar holatini localStorage'ga saqlash
  useEffect(() => {
    if (vehiclesData.length > 0) {
      try {
        localStorage.setItem('vehiclesData', JSON.stringify(vehiclesData))
        console.log('💾 Mashinalar holati saqlandi:', vehiclesData.length)
      } catch (error) {
        console.error('❌ localStorage ga saqlashda xatolik:', error)
      }
    }
  }, [vehiclesData])

  // Load data from API
  const loadDataFromAPI = async () => {
    console.log('🔄 Loading data from API...')
    
    try {
      // Test API connection first
      const connectionTest = await ApiService.testConnection()
      console.log('🔗 API Connection Test:', connectionTest)
      
      if (connectionTest.success) {
        setApiConnected(true)
        console.log('✅ API connected successfully')
        
        // Load bins
        const binsResult = await ApiService.getBins()
        console.log('📦 Bins Result:', binsResult)
        console.log('📦 Bins Result Data:', binsResult.data)
        console.log('📦 Bins Result Data Type:', typeof binsResult.data)
        
        try {
          if (binsResult.success && binsResult.data) {
            let binsArray = binsResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof binsResult.data === 'object' && !Array.isArray(binsResult.data) && binsResult.data.data) {
              binsArray = binsResult.data.data
              console.log('📦 Using nested data array:', binsArray)
            }
            
            console.log('📦 BinsArray:', binsArray)
            console.log('📦 BinsArray length:', binsArray?.length)
            console.log('📦 BinsArray is Array:', Array.isArray(binsArray))
            
            if (Array.isArray(binsArray) && binsArray.length > 0) {
              console.log('📦 Processing bins array:', binsArray.length, 'items')
              console.log('📦 First bin raw data:', binsArray[0])
              
              const transformedBins = binsArray.map((bin, index) => {
                try {
                  console.log(`📦 Transforming bin ${index + 1}:`, bin)
                  const transformed = ApiService.transformBinData(bin)
                  console.log(`✅ Bin ${index + 1} transformed:`, transformed)
                  return transformed
                } catch (error) {
                  console.error(`❌ Error transforming bin ${index + 1}:`, error)
                  console.error('❌ Bin data:', bin)
                  return null
                }
              }).filter(bin => bin !== null) // Remove failed transformations
              
              console.log('📦 Transformed Bins:', transformedBins)
              console.log('📦 Setting binsData with', transformedBins.length, 'bins')
              
              if (transformedBins.length > 0) {
                setBinsData(transformedBins)
                console.log('✅ BinsData set successfully')
              } else {
                console.warn('⚠️ No bins could be transformed')
              }
            } else {
              console.log('📦 No bins data or empty array')
              console.log('📦 BinsArray:', binsArray)
            }
          } else {
            console.log('📦 API call failed or no data')
            console.log('📦 binsResult.success:', binsResult.success)
            console.log('📦 binsResult.data:', binsResult.data)
          }
        } catch (error) {
          console.error('❌ Error processing bins data:', error)
          console.error('❌ Error stack:', error.stack)
          showToast('Qutilar ma\'lumotini yuklashda xatolik', 'error')
        }
        
        // Load vehicles
        const vehiclesResult = await ApiService.getVehicles()
        console.log('🚛 Vehicles Result:', vehiclesResult)
        
        try {
          if (vehiclesResult.success && vehiclesResult.data) {
            let vehiclesArray = vehiclesResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof vehiclesResult.data === 'object' && !Array.isArray(vehiclesResult.data) && vehiclesResult.data.data) {
              vehiclesArray = vehiclesResult.data.data
              console.log('🚛 Using nested data array:', vehiclesArray)
            }
            
            if (Array.isArray(vehiclesArray) && vehiclesArray.length > 0) {
              console.log('🚛 Processing vehicles array:', vehiclesArray.length, 'items')
              
              // Har xil patrol marshrutlari
              const patrolRoutes = [
                // Marshrut 1 - Shimoliy hudud
                [
                  [39.6650, 66.9600], [39.6700, 66.9650], [39.6750, 66.9700],
                  [39.6720, 66.9750], [39.6680, 66.9720], [39.6650, 66.9680],
                  [39.6650, 66.9600]
                ],
                // Marshrut 2 - Janubiy hudud
                [
                  [39.6780, 66.9850], [39.6730, 66.9800], [39.6680, 66.9750],
                  [39.6720, 66.9700], [39.6760, 66.9650], [39.6800, 66.9700],
                  [39.6780, 66.9850]
                ],
                // Marshrut 3 - Sharqiy hudud
                [
                  [39.6600, 66.9900], [39.6650, 66.9950], [39.6700, 67.0000],
                  [39.6650, 66.9950], [39.6600, 66.9900]
                ],
                // Marshrut 4 - G'arbiy hudud
                [
                  [39.6800, 66.9500], [39.6750, 66.9550], [39.6700, 66.9600],
                  [39.6750, 66.9550], [39.6800, 66.9500]
                ]
              ]
              
              // Backend'dan holat yuklash
              const transformedVehicles = await Promise.all(vehiclesArray.map(async (vehicle, index) => {
                try {
                  console.log(`🚛 Transforming vehicle ${index + 1}:`, vehicle)
                  const transformed = ApiService.transformVehicleData(vehicle)
                  
                  // Backend'dan holatni olish
                  try {
                    const API_URL = import.meta.env.VITE_API_URL || 'https://tozahudud-production-d73f.up.railway.app'
                    const stateResponse = await fetch(`${API_URL}/vehicles/${transformed.id}/status`)
                    const stateData = await stateResponse.json()
                    
                    if (stateData.success && stateData.data) {
                      console.log(`📥 Backend state loaded for ${transformed.id}:`, stateData.data)
                      
                      // Backend'dan kelgan holatni merge qilish
                      transformed.position = [stateData.data.latitude, stateData.data.longitude]
                      transformed.isPatrolling = stateData.data.isPatrolling !== undefined ? stateData.data.isPatrolling : true
                      transformed.hasCleanedOnce = stateData.data.hasCleanedOnce || false
                      transformed.patrolIndex = stateData.data.patrolIndex || 0
                      transformed.status = stateData.data.status || 'moving'
                      
                      // ✨ YANGI: Patrol route bo'sh bo'lsa, waypoints yaratish
                      if (stateData.data.patrolRoute && Array.isArray(stateData.data.patrolRoute) && stateData.data.patrolRoute.length > 0) {
                        transformed.patrolRoute = stateData.data.patrolRoute
                      } else {
                        // Patrol route bo'sh - waypoints yaratish
                        console.log(`⚠️ ${transformed.id}: patrolRoute bo'sh, waypoints yaratilmoqda...`)
                        const binLocation = binsData.length > 0 ? binsData[0].location : [39.6742637, 66.9737814]
                        const MAX_DISTANCE = 0.005 // ~500m
                        const waypoints = []
                        for (let i = 0; i < 4; i++) {
                          const randomLat = binLocation[0] + (Math.random() - 0.5) * MAX_DISTANCE * 2
                          const randomLon = binLocation[1] + (Math.random() - 0.5) * MAX_DISTANCE * 2
                          waypoints.push([randomLat, randomLon])
                        }
                        transformed.patrolWaypoints = waypoints
                        transformed.patrolRoute = [] // Bo'sh - LiveMapSimple'da yaratiladi
                        console.log(`✅ ${transformed.id}: ${waypoints.length} waypoints yaratildi`)
                      }
                      
                      if (stateData.data.currentRoute) {
                        transformed.routePath = stateData.data.currentRoute
                      }
                      
                      console.log(`✅ Vehicle ${transformed.id} state loaded from backend`)
                    } else {
                      console.log(`⚠️ No backend state for ${transformed.id}, using defaults`)
                      // Default patrol marshrut berish
                      const patrolIndex = index % patrolRoutes.length
                      transformed.patrolWaypoints = patrolRoutes[patrolIndex]
                      transformed.isPatrolling = true
                      transformed.currentWaypointIndex = 0
                    }
                  } catch (stateError) {
                    console.error(`❌ Failed to load state from backend for ${transformed.id}:`, stateError)
                    
                    // Fallback: localStorage'dan yuklash
                    const savedVehicles = JSON.parse(localStorage.getItem('vehiclesData') || '[]')
                    const savedVehicle = savedVehicles.find(v => v.id === transformed.id)
                    
                    if (savedVehicle) {
                      console.log(`♻️ Fallback: Loading ${transformed.id} from localStorage`)
                      transformed.position = savedVehicle.position || transformed.position
                      transformed.patrolRoute = savedVehicle.patrolRoute || []
                      transformed.patrolIndex = savedVehicle.patrolIndex || 0
                      transformed.isPatrolling = savedVehicle.isPatrolling !== undefined ? savedVehicle.isPatrolling : true
                      transformed.routePath = savedVehicle.routePath || null
                      transformed.currentPathIndex = savedVehicle.currentPathIndex || 0
                      transformed.cleaned = savedVehicle.cleaned || 0
                    } else {
                      // Default patrol marshrut berish
                      const patrolIndex = index % patrolRoutes.length
                      transformed.patrolWaypoints = patrolRoutes[patrolIndex]
                      transformed.isPatrolling = true
                      transformed.currentWaypointIndex = 0
                    }
                  }
                  
                  return transformed
                } catch (error) {
                  console.error(`❌ Error transforming vehicle ${index + 1}:`, error)
                  console.error('❌ Vehicle data:', vehicle)
                  return null
                }
              }))
              
              const validVehicles = transformedVehicles.filter(vehicle => vehicle !== null)
              console.log('🚛 Transformed Vehicles:', validVehicles)
              
              if (validVehicles.length > 0) {
                setVehiclesData(validVehicles)
              } else {
                console.warn('⚠️ No vehicles could be transformed')
              }
            } else {
              console.log('🚛 No vehicles data or empty array')
              console.log('🚛 VehiclesArray:', vehiclesArray)
            }
          } else {
            console.log('🚛 API call failed or no data')
          }
        } catch (error) {
          console.error('❌ Error processing vehicles data:', error)
          showToast('Transport vositalarini yuklashda xatolik', 'error')
        }
        
        // Load alerts
        const alertsResult = await ApiService.getAlerts()
        console.log('🚨 Alerts Result:', alertsResult)
        
        try {
          if (alertsResult.success && alertsResult.data) {
            let alertsArray = alertsResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof alertsResult.data === 'object' && !Array.isArray(alertsResult.data) && alertsResult.data.data) {
              alertsArray = alertsResult.data.data
              console.log('🚨 Using nested data array:', alertsArray)
            }
            
            if (Array.isArray(alertsArray) && alertsArray.length > 0) {
              console.log('🚨 Processing alerts array:', alertsArray.length, 'items')
              
              const transformedAlerts = alertsArray.map((alert, index) => {
                try {
                  console.log(`🚨 Transforming alert ${index + 1}:`, alert)
                  return ApiService.transformAlertData(alert)
                } catch (error) {
                  console.error(`❌ Error transforming alert ${index + 1}:`, error)
                  console.error('❌ Alert data:', alert)
                  return null
                }
              }).filter(alert => alert !== null) // Remove failed transformations
              
              console.log('🚨 Transformed Alerts:', transformedAlerts)
              
              if (transformedAlerts.length > 0) {
                setAlertsData(transformedAlerts)
              } else {
                console.warn('⚠️ No alerts could be transformed')
              }
            } else {
              console.log('🚨 No alerts data or empty array')
              console.log('🚨 AlertsArray:', alertsArray)
            }
          } else {
            console.log('🚨 API call failed or no data')
          }
        } catch (error) {
          console.error('❌ Error processing alerts data:', error)
          showToast('Ogohlantirishlarni yuklashda xatolik', 'error')
        }
        
        // Load activities
        const activitiesResult = await ApiService.getActivities(50)
        console.log('📋 Activities Result:', activitiesResult)
        
        try {
          if (activitiesResult.success && activitiesResult.data) {
            let activitiesArray = activitiesResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof activitiesResult.data === 'object' && !Array.isArray(activitiesResult.data) && activitiesResult.data.data) {
              activitiesArray = activitiesResult.data.data
              console.log('📋 Using nested data array:', activitiesArray)
            }
            
            if (Array.isArray(activitiesArray) && activitiesArray.length > 0) {
              console.log('📋 Processing activities array:', activitiesArray.length, 'items')
              setActivityData(activitiesArray)
              console.log('✅ Activities loaded successfully')
            } else {
              console.log('📋 No activities data or empty array')
            }
          } else {
            console.log('📋 API call failed or no data')
          }
        } catch (error) {
          console.error('❌ Error processing activities data:', error)
          showToast('Faoliyatlarni yuklashda xatolik', 'error')
        }
        
        showToast('Ma\'lumotlar muvaffaqiyatli yuklandi', 'success')
      } else {
        setApiConnected(false)
        console.warn('⚠️ API ga ulanib bo\'lmadi')
        showToast('API ga ulanib bo\'lmadi. Iltimos, backend ishga tushganini tekshiring.', 'warning')
      }
    } catch (error) {
      console.error('❌ API yuklash xatosi:', error)
      setApiConnected(false)
      showToast('Ma\'lumotlarni yuklashda xatolik. Backend ishlamayapti.', 'error')
    } finally {
      setLoading(false)
      console.log('🏁 Data loading completed')
    }
  }

  // Initial data load
  useEffect(() => {
    loadDataFromAPI()
  }, [])

  // Auto refresh every 30 seconds if API is connected - FAQAT FULL bo'lmagan qutilar uchun
  useEffect(() => {
    if (!apiConnected) return

    const interval = setInterval(() => {
      // Agar biror quti FULL bo'lsa, refresh qilmaymiz
      const hasFullBin = binsData.some(bin => bin.status >= 90)
      if (hasFullBin) {
        console.log('⏸️ Auto-refresh paused: Quti FULL holatida')
        return
      }
      
      console.log('🔄 Auto-refreshing data...')
      loadDataFromAPI()
    }, 30000)

    return () => clearInterval(interval)
  }, [apiConnected, binsData])

  // WebSocket - Real-time ESP32 ma'lumot olish (Global - barcha sahifalarda ishlaydi)
  useEffect(() => {
    console.log('🔧 AppContext: WebSocket initializing...')
    
    // WebSocket ulanish
    const socket = io('https://tozahudud-production-d73f.up.railway.app', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('✅ AppContext WebSocket connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('❌ AppContext WebSocket disconnected')
    })

    // ESP32 dan yangi ma'lumot kelganda
    socket.on('sensorData', (data) => {
      console.log(`📡 AppContext: REAL-TIME ESP32 SIGNAL:`, data)
      console.log(`📡 Distance: ${data.distance} sm`)
      console.log(`📡 BinId: ${data.binId}`)
      
      // Qutini FULL holatiga o'tkazish
      setBinStatus('FULL')
      setBinsData(prev => prev.map(bin => 
        bin.id === data.binId ? {
          ...bin,
          status: 95, // Qizil rang
          fillLevel: 95,
          distance: data.distance,
          lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          timestamp: data.timestamp
        } : bin
      ))
      
      // hasCleanedOnce ni reset qilish - yangi FULL signal uchun
      setVehiclesData(prev => prev.map(vehicle => ({
        ...vehicle,
        hasCleanedOnce: false
      })))
      
      console.log('🔴 AppContext: BIN STATUS: FULL (Qizil) - Real-time!')
      showToast(`Quti ${data.binId} to'ldi! Mashina yuborilmoqda...`, 'warning')
    })

    // Quti holati o'zgarganda
    socket.on('binStatus', ({ binId, status }) => {
      console.log(`🗑️ AppContext: REAL-TIME BIN STATUS: ${binId} = ${status}`)
      
      setBinStatus(status)
      
      if (status === 'FULL') {
        setBinsData(prev => prev.map(bin =>
          bin.id === binId ? { ...bin, status: 95, fillLevel: 95 } : bin
        ))
        console.log('🔴 AppContext: Bin marked as FULL')
        
        // Eng yaqin mashinani topish va marshrut yaratish
        const fullBin = binsData.find(b => b.id === binId)
        if (fullBin) {
          // MUHIM: setVehiclesData callback ishlatib real-time vehiclesData olish
          setVehiclesData(currentVehicles => {
            if (currentVehicles.length === 0) return currentVehicles
            
            console.log('🔍 Current vehicles count:', currentVehicles.length)
            
            // Har bir mashina uchun masofa hisoblash
            const distances = currentVehicles.map(vehicle => {
              if (!vehicle.isPatrolling || vehicle.hasCleanedOnce) {
                console.log(`⏭️ Skipping ${vehicle.id}: isPatrolling=${vehicle.isPatrolling}, hasCleanedOnce=${vehicle.hasCleanedOnce}`)
                return { vehicle, distance: Infinity }
              }
              
              console.log(`📍 ${vehicle.id} current position: [${vehicle.position[0]}, ${vehicle.position[1]}]`)
              
              const lat1 = vehicle.position[0]
              const lon1 = vehicle.position[1]
              const lat2 = fullBin.location[0]
              const lon2 = fullBin.location[1]
              
              const R = 6371 // Earth radius in km
              const dLat = (lat2 - lat1) * Math.PI / 180
              const dLon = (lon2 - lon1) * Math.PI / 180
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                        Math.sin(dLon/2) * Math.sin(dLon/2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
              const distance = R * c
              
              return { vehicle, distance }
            })
            
            // Eng yaqin mashinani tanlash
            const closest = distances.reduce((min, curr) => 
              curr.distance < min.distance ? curr : min
            )
            
            if (closest.distance !== Infinity) {
              console.log(`✅ Closest vehicle: ${closest.vehicle.id} (${closest.distance.toFixed(2)} km)`)
              console.log(`📍 Will start route from: [${closest.vehicle.position[0]}, ${closest.vehicle.position[1]}]`)
              createRoute(closest.vehicle, fullBin)
            } else {
              console.log('❌ No available vehicles')
            }
            
            return currentVehicles // State'ni o'zgartirmaslik
          })
        }
      } else if (status === 'EMPTY') {
        setBinsData(prev => prev.map(bin =>
          bin.id === binId ? { ...bin, status: 15, fillLevel: 15 } : bin
        ))
        console.log('🟢 AppContext: Bin marked as EMPTY')
      }
    })

    // ✨ YANGI: Mashina pozitsiyasi real-time yangilanganda
    socket.on('vehiclePositionUpdate', (data) => {
      console.log(`📥 Real-time position update: ${data.vehicleId} → [${data.latitude}, ${data.longitude}]`)
      
      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId ? {
          ...vehicle,
          position: [data.latitude, data.longitude]
        } : vehicle
      ))
    })

    // ✨ YANGI: Mashina holati real-time yangilanganda
    socket.on('vehicleStateUpdate', (data) => {
      console.log(`📥 Real-time state update: ${data.vehicleId}`, data)
      
      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId ? {
          ...vehicle,
          isPatrolling: data.isPatrolling !== undefined ? data.isPatrolling : vehicle.isPatrolling,
          hasCleanedOnce: data.hasCleanedOnce !== undefined ? data.hasCleanedOnce : vehicle.hasCleanedOnce,
          patrolIndex: data.patrolIndex !== undefined ? data.patrolIndex : vehicle.patrolIndex,
          status: data.status || vehicle.status,
          patrolRoute: data.patrolRoute || vehicle.patrolRoute,
          routePath: data.currentRoute || vehicle.routePath
        } : vehicle
      ))
    })

    // Cleanup
    return () => {
      console.log('🔌 AppContext: WebSocket disconnecting...')
      socket.disconnect()
    }
  }, [])

  const showToast = (message, type = 'info', duration = 5000) => {
    // Generate unique ID using timestamp + random number to avoid duplicates
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => {
      // Prevent duplicate messages
      const existingToast = prev.find(t => t.message === message && t.type === type)
      if (existingToast) {
        return prev // Don't add duplicate
      }
      return [...prev, toast]
    })
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const refreshData = () => {
    setLoading(true)
    loadDataFromAPI()
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        binsData,
        setBinsData,
        binStatus,
        setBinStatus,
        vehiclesData,
        setVehiclesData,
        updateVehicleState,
        routesData,
        setRoutesData,
        updateRoute,
        activityData,
        setActivityData,
        alertsData,
        setAlertsData,
        apiConnected,
        loading,
        refreshData,
        showToast,
        toasts,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

