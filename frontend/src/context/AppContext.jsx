import React, { createContext, useContext, useState, useEffect } from 'react'
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

  const normalizeRoutePath = (routePath) => {
    if (Array.isArray(routePath) && routePath.length === 0) return null
    return routePath
  }

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
  const [vehiclesData, setVehiclesData] = useState([])
  
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
              
              const transformedVehicles = vehiclesArray.map((vehicle, index) => {
                try {
                  console.log(`🚛 Transforming vehicle ${index + 1}:`, vehicle)
                  const transformed = ApiService.transformVehicleData(vehicle)

                  // Statik patrul siklini o'chiramiz:
                  // backend waypoints bo'lsa ishlatamiz, bo'lmasa random patrul current positiondan boshlanadi.
                  const backendWaypoints = Array.isArray(vehicle?.patrolWaypoints)
                    ? vehicle.patrolWaypoints.filter(point => Array.isArray(point) && point.length >= 2)
                    : []
                  transformed.patrolWaypoints = backendWaypoints.length >= 2
                    ? backendWaypoints
                    : [transformed.position]
                  transformed.currentWaypointIndex = transformed.currentWaypointIndex || 0
                  transformed.routePath = normalizeRoutePath(transformed.routePath)
                  
                  return transformed
                } catch (error) {
                  console.error(`❌ Error transforming vehicle ${index + 1}:`, error)
                  console.error('❌ Vehicle data:', vehicle)
                  return null
                }
              }).filter(vehicle => vehicle !== null) // Remove failed transformations
              
              console.log('🚛 Transformed Vehicles:', transformedVehicles)
              
              if (transformedVehicles.length > 0) {
                setVehiclesData((prevVehicles) =>
                  transformedVehicles.map((vehicle) => {
                    const existing = prevVehicles.find((prev) => prev.id === vehicle.id)
                    if (!existing) return vehicle

                    const hasExistingPosition =
                      Array.isArray(existing.position) && existing.position.length >= 2
                    const keepRuntimePosition = hasExistingPosition && (existing.isMoving || existing.isPatrolling)

                    return {
                      ...vehicle,
                      position: keepRuntimePosition ? existing.position : vehicle.position,
                      routePath:
                        Array.isArray(existing.routePath) && existing.routePath.length > 0
                          ? existing.routePath
                          : vehicle.routePath,
                      currentPathIndex: existing.currentPathIndex ?? vehicle.currentPathIndex,
                      patrolRoute:
                        Array.isArray(existing.patrolRoute) && existing.patrolRoute.length > 0
                          ? existing.patrolRoute
                          : vehicle.patrolRoute,
                      patrolIndex: existing.patrolIndex ?? vehicle.patrolIndex,
                      isPatrolling:
                        existing.isPatrolling !== undefined ? existing.isPatrolling : vehicle.isPatrolling,
                      targetBinId: existing.targetBinId ?? vehicle.targetBinId,
                      routeId: existing.routeId ?? vehicle.routeId,
                      hasCleanedOnce:
                        existing.hasCleanedOnce !== undefined ? existing.hasCleanedOnce : vehicle.hasCleanedOnce,
                      patrolWaypoints:
                        Array.isArray(existing.patrolWaypoints) && existing.patrolWaypoints.length > 0
                          ? existing.patrolWaypoints
                          : vehicle.patrolWaypoints,
                    }
                  }),
                )
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

    const toRadians = (value) => (value * Math.PI) / 180
    const distanceMeters = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return 0
      const lat1 = Number(a[0])
      const lon1 = Number(a[1])
      const lat2 = Number(b[0])
      const lon2 = Number(b[1])
      if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return 0

      const R = 6371000
      const dLat = toRadians(lat2 - lat1)
      const dLon = toRadians(lon2 - lon1)
      const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
      return R * c
    }

    const densifyRoutePath = (routePath, maxStepMeters = 8) => {
      if (!Array.isArray(routePath) || routePath.length < 2) return routePath

      const dense = [routePath[0]]
      for (let i = 1; i < routePath.length; i++) {
        const start = routePath[i - 1]
        const end = routePath[i]
        if (!Array.isArray(start) || !Array.isArray(end) || start.length < 2 || end.length < 2) {
          continue
        }

        const segmentMeters = distanceMeters(start, end)
        const steps = Math.max(1, Math.ceil(segmentMeters / maxStepMeters))
        for (let s = 1; s <= steps; s++) {
          const t = s / steps
          const lat = Number(start[0]) + (Number(end[0]) - Number(start[0])) * t
          const lon = Number(start[1]) + (Number(end[1]) - Number(start[1])) * t
          dense.push([lat, lon])
        }
      }

      return dense
    }

    const applyBinUpdate = (payload) => {
      const binKey = payload?.binId || payload?.code || payload?.sensorId || payload?.id
      if (!binKey) return

      const statusText = payload?.status
      const fillFromPayload = Number(payload?.fillLevel)
      const numericStatus = Number(payload?.status)
      const fillLevel = Number.isFinite(fillFromPayload)
        ? fillFromPayload
        : Number.isFinite(numericStatus)
          ? numericStatus
          : statusText === 'FULL'
            ? 95
            : 15

      const lat = Number(payload?.latitude ?? payload?.location?.[0] ?? 39.6742637)
      const lon = Number(payload?.longitude ?? payload?.location?.[1] ?? 66.9737814)
      const location = [lat, lon]
      const resolvedStatus = fillLevel >= 90 ? 'FULL' : 'EMPTY'

      setBinStatus(resolvedStatus)

      setBinsData(prevBins => {
        const nextBins = [...prevBins]
        const index = nextBins.findIndex(bin =>
          bin.id === binKey ||
          bin.sensorId === binKey ||
          (payload?.id && bin._backendId === payload.id)
        )

        const previous = index >= 0 ? nextBins[index] : null
        const merged = {
          ...(previous || {}),
          id: previous?.id || payload?.code || payload?.binId || binKey,
          _backendId: payload?.id || previous?._backendId || null,
          address: payload?.address || payload?.locationName || previous?.address || 'Noma\'lum',
          district: payload?.district || previous?.district || 'Samarqand',
          location: Array.isArray(payload?.location) ? payload.location : location,
          status: fillLevel,
          fillLevel,
          sensorId: payload?.sensorId || payload?.binId || previous?.sensorId || binKey,
          batteryLevel: payload?.batteryLevel ?? previous?.batteryLevel ?? 100,
          online: payload?.isOnline ?? previous?.online ?? true,
          lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          assignedVehicleId: payload?.assignedVehicleId ?? previous?.assignedVehicleId ?? null,
          assignmentStatus: payload?.assignmentStatus ?? previous?.assignmentStatus ?? null,
          assignmentRouteId: payload?.assignmentRouteId ?? previous?.assignmentRouteId ?? null,
          assignmentUpdatedAt: payload?.assignmentUpdatedAt ?? previous?.assignmentUpdatedAt ?? null
        }

        if (index >= 0) {
          nextBins[index] = merged
        } else {
          nextBins.push(merged)
        }
        return nextBins
      })
    }

    const alignRouteWithCurrentPosition = (currentPosition, incomingRoute) => {
      if (!Array.isArray(incomingRoute) || incomingRoute.length === 0) return incomingRoute
      if (!Array.isArray(currentPosition) || currentPosition.length < 2) return incomingRoute

      const firstPoint = incomingRoute[0]
      if (!Array.isArray(firstPoint) || firstPoint.length < 2) return incomingRoute

      const latGap = Math.abs(Number(currentPosition[0]) - Number(firstPoint[0]))
      const lonGap = Math.abs(Number(currentPosition[1]) - Number(firstPoint[1]))
      const isFarFromCurrent = latGap > 0.0008 || lonGap > 0.0008

      if (!isFarFromCurrent) return incomingRoute

      return [currentPosition, ...incomingRoute]
    }

    // ESP32 signal event (source event)
    socket.on('sensorData', (data) => {
      const distance = Number(data?.distance)
      if (!Number.isFinite(distance)) return

      if (distance <= 30) {
        setBinStatus('FULL')
        showToast(`Quti ${data?.binId || 'ESP32'} to'ldi`, 'warning')
      }
    })

    // Backend authoritative bin state
    socket.on('binUpdate', (payload) => {
      console.log('📥 Real-time binUpdate:', payload)
      applyBinUpdate(payload)
    })

    // Quti holati o'zgarganda (legacy fallback)
    socket.on('binStatus', ({ binId, status }) => {
      console.log(`🗑️ AppContext: REAL-TIME BIN STATUS: ${binId} = ${status}`)
      
      setBinStatus(status)
      
      if (status === 'FULL') {
        setBinsData(prev => prev.map(bin =>
          (bin.id === binId || bin.sensorId === binId) ? { ...bin, status: 95, fillLevel: 95 } : bin
        ))
        console.log('🔴 AppContext: Bin marked as FULL')
      } else if (status === 'EMPTY') {
        setBinsData(prev => prev.map(bin =>
          (bin.id === binId || bin.sensorId === binId) ? { ...bin, status: 15, fillLevel: 15 } : bin
        ))
        console.log('🟢 AppContext: Bin marked as EMPTY')
      }
    })

    socket.on('dispatchAssigned', (data) => {
      console.log('📥 Real-time dispatchAssigned:', data)
      const routePath = normalizeRoutePath(data?.routePath)

      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId ? (() => {
          const safeRoutePath = routePath
            ? densifyRoutePath(alignRouteWithCurrentPosition(vehicle.position, routePath))
            : vehicle.routePath

          return {
            ...vehicle,
            isPatrolling: false,
            status: 'moving',
            targetBinId: data.binId || vehicle.targetBinId,
            routePath: safeRoutePath,
            currentPathIndex: 0,
            routeId: data.routeId || data.assignmentId || vehicle.routeId
          }
        })() : vehicle
      ))

      setBinsData(prevBins => prevBins.map(bin =>
        (bin.id === data.binId || bin.sensorId === data.binId) ? {
          ...bin,
          assignedVehicleId: data.vehicleId,
          assignmentStatus: 'ASSIGNED',
          assignmentRouteId: data.routeId || data.assignmentId || null,
          assignmentUpdatedAt: new Date().toISOString()
        } : bin
      ))

      setRoutesData(prev => [
        ...prev.filter(route => route.vehicle !== data.vehicleId),
        {
          id: data.routeId || data.assignmentId || `ROUTE-${Date.now()}`,
          name: `${data.vehicleId} -> ${data.binId}`,
          vehicle: data.vehicleId,
          bins: data.binId ? [data.binId] : [],
          progress: 0,
          distance: Number.isFinite(Number(data.distanceKm)) ? `${Number(data.distanceKm).toFixed(2)} km` : 'Noma\'lum',
          estimatedTime: Number.isFinite(Number(data.estimatedDurationMin)) ? `${Math.round(Number(data.estimatedDurationMin))} daqiqa` : 'Noma\'lum',
          isActive: true,
          path: routePath || []
        }
      ])
    })

    socket.on('vehiclePositionUpdate', (data) => {
      const lat = Number(data?.latitude ?? data?.position?.[0])
      const lon = Number(data?.longitude ?? data?.position?.[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !data?.vehicleId) return

      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId
          ? { ...vehicle, position: [lat, lon] }
          : vehicle
      ))
    })

    // Mashina holati real-time yangilanganda
    socket.on('vehicleStateUpdate', (data) => {
      console.log(`📥 Real-time state update: ${data.vehicleId}`, data)

      const hasNoActiveRoute = data.currentRoute === null || (Array.isArray(data.currentRoute) && data.currentRoute.length === 0)
      setVehiclesData(prev => prev.map(vehicle =>
        vehicle.id === data.vehicleId ? (() => {
          const nextRoutePath = data.currentRoute !== undefined
            ? densifyRoutePath(normalizeRoutePath(data.currentRoute))
            : vehicle.routePath
          const shouldRestartPatrolFromCurrentPosition = data.isPatrolling === true && hasNoActiveRoute

          return {
            ...vehicle,
            isPatrolling: data.isPatrolling !== undefined ? data.isPatrolling : vehicle.isPatrolling,
            hasCleanedOnce: data.hasCleanedOnce !== undefined ? data.hasCleanedOnce : vehicle.hasCleanedOnce,
            patrolIndex: shouldRestartPatrolFromCurrentPosition
              ? 0
              : (data.patrolIndex !== undefined ? data.patrolIndex : vehicle.patrolIndex),
            status: data.status || vehicle.status,
            patrolRoute: shouldRestartPatrolFromCurrentPosition
              ? []
              : (data.patrolRoute !== undefined ? data.patrolRoute : vehicle.patrolRoute),
            routePath: shouldRestartPatrolFromCurrentPosition ? null : nextRoutePath,
            currentPathIndex: shouldRestartPatrolFromCurrentPosition ? 0 : vehicle.currentPathIndex,
            targetBinId: shouldRestartPatrolFromCurrentPosition
              ? null
              : (data.targetBinId !== undefined ? data.targetBinId : vehicle.targetBinId),
            routeId: data.routeId !== undefined ? data.routeId : vehicle.routeId
          }
        })() : vehicle
      ))

      if (data.isPatrolling === true && hasNoActiveRoute) {
        setRoutesData(prevRoutes => prevRoutes.filter(route => route.vehicle !== data.vehicleId))
        setBinsData(prevBins => prevBins.map(bin =>
          bin.assignedVehicleId === data.vehicleId ? {
            ...bin,
            assignedVehicleId: null,
            assignmentStatus: 'UNASSIGNED',
            assignmentUpdatedAt: new Date().toISOString()
          } : bin
        ))
      }
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


