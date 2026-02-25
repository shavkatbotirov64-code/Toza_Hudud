import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import api from '../services/api'
import VehicleManager from '../utils/VehicleManager'
import 'leaflet/dist/leaflet.css'

const LiveMapSimple = ({ expanded = false }) => {
  const { t } = useTranslation()
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const binMarkersRef = useRef([]) // Barcha quti markerlari
  const vehicleMarkersRef = useRef([]) // Barcha mashina markerlari
  const routeLinesRef = useRef([]) // Barcha marshrut chiziqlari
  const vehicleIntervalsRef = useRef({}) // Har bir mashina uchun interval
  const vehicleManagerRef = useRef(null) // VehicleManager instance
  const animationIntervalRef = useRef(null) // VEH-001 animatsiya interval
  const animation2IntervalRef = useRef(null) // VEH-002 animatsiya interval
  const patrolExtendLockRef = useRef({}) // Bir mashina uchun parallel route extend'ni bloklash
  const lastPatrolTargetRef = useRef({}) // Bir xil random target qayta-qayta tushmasligi uchun
  const lastPatrolAngleRef = useRef({}) // Bir xil yo'nalish takrorlanishini kamaytirish uchun
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { showToast, binsData, setBinsData, binStatus, setBinStatus, vehiclesData, updateVehicleState, routesData, setRoutesData, updateRoute } = useAppContext() // AppContext dan quti va mashina ma'lumotlari

  const MOVEMENT_STEP_METERS = 8
  const MOVEMENT_INTERVAL_MS = 1000
  const ENABLE_FAKE_PATROL = false

  const hasRoutePoints = (routePath) => Array.isArray(routePath) && routePath.length > 0
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

  const densifyRoutePath = (routePath, maxStepMeters = MOVEMENT_STEP_METERS) => {
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
  const normalizeAngle = (angle) => {
    const twoPi = Math.PI * 2
    let normalized = angle % twoPi
    if (normalized < 0) normalized += twoPi
    return normalized
  }
  const angleDiff = (a, b) => {
    const twoPi = Math.PI * 2
    const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b)) % twoPi
    return diff > Math.PI ? twoPi - diff : diff
  }

  const getPatrolAreaCenter = () => {
    const firstBinWithLocation = binsData.find(bin => Array.isArray(bin?.location) && bin.location.length >= 2)
    if (firstBinWithLocation) return firstBinWithLocation.location
    return [39.6742637, 66.9737814]
  }

  const clampToPatrolArea = (point, center, maxOffsetDeg = 0.015) => {
    const [lat, lon] = point
    const [centerLat, centerLon] = center
    const minLat = centerLat - maxOffsetDeg
    const maxLat = centerLat + maxOffsetDeg
    const minLon = centerLon - maxOffsetDeg
    const maxLon = centerLon + maxOffsetDeg
    return [
      Math.min(Math.max(lat, minLat), maxLat),
      Math.min(Math.max(lon, minLon), maxLon)
    ]
  }

  const generateRandomPatrolTarget = (currentPos, vehicleId) => {
    const areaCenter = getPatrolAreaCenter()
    const [lat, lon] = currentPos
    const previousTarget = lastPatrolTargetRef.current[vehicleId]
    const previousAngle = lastPatrolAngleRef.current[vehicleId]

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const distanceDeg = 0.003 + Math.random() * 0.005 // ~0.3km - 0.9km
      const candidate = clampToPatrolArea(
        [lat + Math.cos(angle) * distanceDeg, lon + Math.sin(angle) * distanceDeg],
        areaCenter
      )

      const fromCurrentLat = Math.abs(candidate[0] - lat)
      const fromCurrentLon = Math.abs(candidate[1] - lon)
      const isTooCloseToCurrent = fromCurrentLat < 0.0012 && fromCurrentLon < 0.0012

      const isAlmostSameAsPreviousTarget = previousTarget
        ? Math.abs(candidate[0] - previousTarget[0]) < 0.0008 &&
          Math.abs(candidate[1] - previousTarget[1]) < 0.0008
        : false

      const isRepeatingDirection = previousAngle !== undefined
        ? angleDiff(angle, previousAngle) < 0.55
        : false

      if (!isTooCloseToCurrent && !isAlmostSameAsPreviousTarget && !isRepeatingDirection) {
        return candidate
      }
    }

    return clampToPatrolArea([lat + 0.004, lon + 0.004], areaCenter)
  }

  const extendPatrolRoute = async (vehicleId, vehicleSnapshot) => {
    if (patrolExtendLockRef.current[vehicleId]) return

    patrolExtendLockRef.current[vehicleId] = true

    try {
      const currentPos =
        vehicleSnapshot?.position ||
        vehicleSnapshot?.patrolRoute?.[vehicleSnapshot.patrolRoute.length - 1]

      if (!Array.isArray(currentPos) || currentPos.length < 2) {
        return
      }

      const randomTarget = generateRandomPatrolTarget(currentPos, vehicleId)

      console.log(`🔄 ${vehicleId}: Marshrut oxiriga yetdi, yangi random segment yaratilmoqda...`)

      const result = await fetchRouteFromOSRM(
        currentPos[0], currentPos[1],
        randomTarget[0], randomTarget[1]
      )

      if (result.success && Array.isArray(result.path) && result.path.length > 1) {
        console.log(`✅ ${vehicleId}: Yangi random segment tayyor (${result.path.length} nuqta)`)
        const endPoint = result.path[result.path.length - 1]
        lastPatrolTargetRef.current[vehicleId] = endPoint
        lastPatrolAngleRef.current[vehicleId] = Math.atan2(endPoint[1] - currentPos[1], endPoint[0] - currentPos[0])

        // Route'ni append qilmaymiz; yangi segment bilan almashtiramiz.
        // Bu cheksiz patrulda route'ning cheksiz kattalashib ketishini oldini oladi.
        updateVehicleState(vehicleId, {
          patrolRoute: result.path,
          patrolIndex: 0,
          position: result.path[0] || currentPos
        })
      } else {
        console.warn(`⚠️ ${vehicleId}: OSRM random segment topmadi, fallback ishlatildi`)
        lastPatrolTargetRef.current[vehicleId] = randomTarget
        lastPatrolAngleRef.current[vehicleId] = Math.atan2(randomTarget[1] - currentPos[1], randomTarget[0] - currentPos[0])
        const fallbackPath = densifyRoutePath([currentPos, randomTarget])
        updateVehicleState(vehicleId, {
          patrolRoute: fallbackPath,
          patrolIndex: 0,
          position: fallbackPath?.[0] || currentPos
        })
      }
    } finally {
      patrolExtendLockRef.current[vehicleId] = false
    }
  }
  
  // VehicleManager'ni yaratish
  useEffect(() => {
    vehicleManagerRef.current = new VehicleManager(updateVehicleState, setBinsData, setBinStatus)
    
    return () => {
      if (vehicleManagerRef.current) {
        vehicleManagerRef.current.stopAll()
      }
    }
  }, [])
  
  // Mashina holatlari - vehiclesData'dan
  const vehicleState = vehiclesData.find(v => v.id === 'VEH-001') || vehiclesData[0]
  const vehicle2State = vehiclesData.find(v => v.id === 'VEH-002') || vehiclesData[1]

  // Barcha mashinalar uchun patrol marshruti yaratish - HOZIRCHA O'CHIRILGAN
  // useEffect(() => {
  //   if (!vehicleManagerRef.current) return
  //   vehiclesData.forEach(vehicle => {
  //     if (vehicle.isPatrolling && vehicle.patrolRoute.length === 0 && vehicle.patrolWaypoints) {
  //       vehicleManagerRef.current.buildPatrolRoute(vehicle)
  //     }
  //   })
  // }, [vehiclesData])

  // Barcha mashinalar uchun patrol animatsiyasini boshlash - HOZIRCHA O'CHIRILGAN
  // useEffect(() => {
  //   if (!vehicleManagerRef.current) return
  //   vehiclesData.forEach(vehicle => {
  //     if (vehicle.isPatrolling && vehicle.patrolRoute.length > 0 && !vehicle.routePath) {
  //       vehicleManagerRef.current.startPatrol(vehicle)
  //     } else if (!vehicle.isPatrolling && vehicle.routePath) {
  //       vehicleManagerRef.current.startGoingToBin(vehicle, binData)
  //     }
  //   })
  //   return () => {
  //     if (vehicleManagerRef.current) {
  //       vehicleManagerRef.current.stopAll()
  //     }
  //   }
  // }, [vehiclesData.map(v => `${v.id}-${v.isPatrolling}-${v.patrolRoute.length}-${v.routePath ? 'route' : 'no'}`).join(',')])

  // OpenStreetMap OSRM API dan marshrut olish
  const fetchRouteFromOSRM = async (startLat, startLon, endLat, endLon) => {
    try {
      // Katta transport vositalari uchun - faqat asosiy ko'chalar
      // exclude=motorway - avtomagistrallarni chiqarib tashlash
      // continue_straight=true - to'g'ri yo'lni afzal ko'rish
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&continue_straight=true`
      
      console.log(`ðŸ—ºï¸ OSRM API: Marshrut hisoblanmoqda (asosiy ko'chalar)...`)
      console.log(`ðŸ“ Start: [${startLat}, ${startLon}]`)
      console.log(`ðŸ“ End: [${endLat}, ${endLon}]`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const coordinates = route.geometry.coordinates
        
        // GeoJSON format [lon, lat] dan Leaflet format [lat, lon] ga o'zgartirish
        const leafletCoordinates = coordinates.map(coord => [coord[1], coord[0]])
        const movementReadyPath = densifyRoutePath(leafletCoordinates)
        
        const distanceKm = (route.distance / 1000).toFixed(2)
        const durationMin = (route.duration / 60).toFixed(1)
        
        console.log(`âœ… Marshrut topildi (asosiy ko'chalar)!`)
        console.log(`ðŸ“ Masofa: ${distanceKm} km`)
        console.log(`â±ï¸ Vaqt: ${durationMin} daqiqa`)
        console.log(`ðŸ“Š Original nuqtalar: ${leafletCoordinates.length}`)
        console.log(`ðŸ“Š Movement nuqtalar: ${movementReadyPath.length}`)
        
        return {
          success: true,
          path: movementReadyPath,
          distance: distanceKm,
          duration: durationMin
        }
      } else {
        console.warn('âš ï¸ OSRM: Marshrut topilmadi, backup ishlatiladi')
        return { success: false }
      }
    } catch (error) {
      console.error('âŒ OSRM API xatolik:', error)
      return { success: false }
    }
  }

  // Patrol marshruti yaratish - OSRM API orqali (Mashina 1)
  useEffect(() => {
    if (!ENABLE_FAKE_PATROL) return
    if (!vehicleState) return // Mashina mavjud emas
    
    if (vehicleState.isPatrolling && vehicleState.patrolRoute.length === 0) {
      console.log('ðŸ—ºï¸ VEH-001 Patrol marshruti yaratilmoqda (OSRM API)...')
      
      const buildPatrolRoute = async () => {
        const waypoints = Array.isArray(vehicleState.patrolWaypoints) ? vehicleState.patrolWaypoints : []

        if (waypoints.length < 2) {
          await extendPatrolRoute('VEH-001', vehicleState)
          return
        }

        let fullRoute = []
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const start = waypoints[i]
          const end = waypoints[i + 1]
          
          const result = await fetchRouteFromOSRM(start[0], start[1], end[0], end[1])
          
          if (result.success) {
            fullRoute = [...fullRoute, ...result.path]
          } else {
            fullRoute = [...fullRoute, start, end]
          }
        }
        
        const currentPosition = Array.isArray(vehicleState.position) ? vehicleState.position : null
        let alignedRoute = fullRoute
        if (currentPosition && fullRoute.length > 0) {
          const firstPoint = fullRoute[0]
          const latGap = Math.abs(Number(currentPosition[0]) - Number(firstPoint[0]))
          const lonGap = Math.abs(Number(currentPosition[1]) - Number(firstPoint[1]))
          if (latGap > 0.0008 || lonGap > 0.0008) {
            alignedRoute = [currentPosition, ...fullRoute]
          }
        }

        console.log(`âœ… VEH-001 Patrol marshruti tayyor: ${alignedRoute.length} nuqta`)
        
        updateVehicleState('VEH-001', {
          patrolRoute: alignedRoute,
          position: currentPosition || alignedRoute[0] || vehicleState.position
        })
      }
      
      buildPatrolRoute()
    }
  }, [vehicleState?.isPatrolling, vehicleState?.patrolRoute?.length])

  // Patrol marshruti yaratish - OSRM API orqali (Mashina 2)
  useEffect(() => {
    if (!ENABLE_FAKE_PATROL) return
    if (!vehicle2State) return // Mashina mavjud emas
    
    if (vehicle2State.isPatrolling && vehicle2State.patrolRoute.length === 0) {
      console.log('ðŸ—ºï¸ VEH-002 Patrol marshruti yaratilmoqda (OSRM API)...')
      
      const buildPatrolRoute = async () => {
        const waypoints = Array.isArray(vehicle2State.patrolWaypoints) ? vehicle2State.patrolWaypoints : []

        if (waypoints.length < 2) {
          await extendPatrolRoute('VEH-002', vehicle2State)
          return
        }

        let fullRoute = []
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const start = waypoints[i]
          const end = waypoints[i + 1]
          
          const result = await fetchRouteFromOSRM(start[0], start[1], end[0], end[1])
          
          if (result.success) {
            fullRoute = [...fullRoute, ...result.path]
          } else {
            fullRoute = [...fullRoute, start, end]
          }
        }
        
        const currentPosition = Array.isArray(vehicle2State.position) ? vehicle2State.position : null
        let alignedRoute = fullRoute
        if (currentPosition && fullRoute.length > 0) {
          const firstPoint = fullRoute[0]
          const latGap = Math.abs(Number(currentPosition[0]) - Number(firstPoint[0]))
          const lonGap = Math.abs(Number(currentPosition[1]) - Number(firstPoint[1]))
          if (latGap > 0.0008 || lonGap > 0.0008) {
            alignedRoute = [currentPosition, ...fullRoute]
          }
        }

        console.log(`âœ… VEH-002 Patrol marshruti tayyor: ${alignedRoute.length} nuqta`)
        
        updateVehicleState('VEH-002', {
          patrolRoute: alignedRoute,
          position: currentPosition || alignedRoute[0] || vehicle2State.position
        })
      }
      
      buildPatrolRoute()
    }
  }, [vehicle2State?.isPatrolling, vehicle2State?.patrolRoute?.length])

  // Mashina patrol animatsiyasi - OSRM yo'llari bo'ylab harakat (Mashina 1)
  useEffect(() => {
    if (!ENABLE_FAKE_PATROL) return
    if (!vehicleState) return // Mashina mavjud emas
    
    if (vehicleState.isPatrolling && vehicleState.patrolRoute.length > 0 && !hasRoutePoints(vehicleState.routePath)) {
      const patrolInterval = setInterval(() => {
        const nextIndex = vehicleState.patrolIndex + 1
        
        // Agar marshrut oxiriga yetsa, yangi random marshrut qo'shish (cheksiz davom etish)
        if (nextIndex >= vehicleState.patrolRoute.length) {
          extendPatrolRoute('VEH-001', vehicleState)
        } else {
          // Oddiy harakat - keyingi nuqtaga o'tish
          const nextPosition = vehicleState.patrolRoute[nextIndex]
          updateVehicleState('VEH-001', {
            position: nextPosition,
            patrolIndex: nextIndex
          })
          api.updateVehicleLocation('VEH-001', nextPosition[0], nextPosition[1]).catch(() => {})
        }
      }, MOVEMENT_INTERVAL_MS) // Har soniyada kichik qadam - silliq va realistik harakat

      return () => clearInterval(patrolInterval)
    }
  }, [vehicleState?.isPatrolling, vehicleState?.patrolRoute?.length, vehicleState?.routePath, vehicleState?.patrolIndex])

  // Mashina patrol animatsiyasi - OSRM yo'llari bo'ylab harakat (Mashina 2)
  useEffect(() => {
    if (!ENABLE_FAKE_PATROL) return
    if (!vehicle2State) return // Mashina mavjud emas
    
    if (vehicle2State.isPatrolling && vehicle2State.patrolRoute.length > 0 && !hasRoutePoints(vehicle2State.routePath)) {
      const patrolInterval = setInterval(() => {
        const nextIndex = vehicle2State.patrolIndex + 1
        
        // Agar marshrut oxiriga yetsa, yangi random marshrut qo'shish (cheksiz davom etish)
        if (nextIndex >= vehicle2State.patrolRoute.length) {
          extendPatrolRoute('VEH-002', vehicle2State)
        } else {
          // Oddiy harakat - keyingi nuqtaga o'tish
          const nextPosition = vehicle2State.patrolRoute[nextIndex]
          updateVehicleState('VEH-002', {
            position: nextPosition,
            patrolIndex: nextIndex
          })
          api.updateVehicleLocation('VEH-002', nextPosition[0], nextPosition[1]).catch(() => {})
        }
      }, MOVEMENT_INTERVAL_MS) // Har soniyada kichik qadam - silliq va realistik harakat

      return () => clearInterval(patrolInterval)
    }
  }, [vehicle2State?.isPatrolling, vehicle2State?.patrolRoute?.length, vehicle2State?.routePath, vehicle2State?.patrolIndex])

  // Quti FULL bo'lganda dispatch AppContext'da bajariladi (dublikat dispatch oldini olish)
  // Mashina qutiga borish animatsiyasi (Mashina 1)
  useEffect(() => {
    if (!ENABLE_FAKE_PATROL) return
    if (!vehicleState) return

    if (!vehicleState.isPatrolling && hasRoutePoints(vehicleState.routePath)) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }

      animationIntervalRef.current = setInterval(() => {
        const nextIndex = vehicleState.currentPathIndex + 1
        
        if (nextIndex >= vehicleState.routePath.length) {
          console.log('âœ… VEH-001 qutiga yetdi!')
          console.log('â¸ï¸ Mashina qutida to\'xtadi - backend yakunlash chaqirilmoqda...')
          
          // Animatsiyani to'xtatish
          clearInterval(animationIntervalRef.current)
          
          // Marshrut progress'ini 100% qilish
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-001' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress: 100 })
          }
          
          setTimeout(() => {
            api.completeVehicleCleaning('VEH-001')
              .then(result => {
                if (!result.success) {
                  console.error('âŒ VEH-001 complete-cleaning failed:', result.error)
                }
              })
              .catch(error => {
                console.error('âŒ VEH-001 complete-cleaning API error:', error)
              })
          }, 1000)
        } else {
          // Keyingi nuqtaga o'tish
          const nextPosition = vehicleState.routePath[nextIndex]
          updateVehicleState('VEH-001', {
            position: nextPosition,
            currentPathIndex: nextIndex
          })
          api.updateVehicleLocation('VEH-001', nextPosition[0], nextPosition[1]).catch(() => {})
          
          // Marshrut progress'ini yangilash
          const progress = Math.round((nextIndex / vehicleState.routePath.length) * 100)
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-001' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress })
          }
        }
      }, MOVEMENT_INTERVAL_MS) // Har soniyada kichik qadam - silliq va realistik harakat
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [vehicleState?.id, vehicleState?.isPatrolling, vehicleState?.routePath, vehicleState?.currentPathIndex])

  // Mashina qutiga borish animatsiyasi (Mashina 2)
  useEffect(() => {
    if (!ENABLE_FAKE_PATROL) return
    if (!vehicle2State) return

    if (!vehicle2State.isPatrolling && hasRoutePoints(vehicle2State.routePath)) {
      if (animation2IntervalRef.current) {
        clearInterval(animation2IntervalRef.current)
      }

      animation2IntervalRef.current = setInterval(() => {
        const nextIndex = vehicle2State.currentPathIndex + 1
        
        if (nextIndex >= vehicle2State.routePath.length) {
          console.log('âœ… VEH-002 qutiga yetdi!')
          console.log('â¸ï¸ Mashina qutida to\'xtadi - backend yakunlash chaqirilmoqda...')
          
          // Animatsiyani to'xtatish
          clearInterval(animation2IntervalRef.current)
          
          // Marshrut progress'ini 100% qilish
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-002' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress: 100 })
          }
          
          setTimeout(() => {
            api.completeVehicleCleaning('VEH-002')
              .then(result => {
                if (!result.success) {
                  console.error('âŒ VEH-002 complete-cleaning failed:', result.error)
                }
              })
              .catch(error => {
                console.error('âŒ VEH-002 complete-cleaning API error:', error)
              })
          }, 1000)
        } else {
          // Keyingi nuqtaga o'tish
          const nextPosition = vehicle2State.routePath[nextIndex]
          updateVehicleState('VEH-002', {
            position: nextPosition,
            currentPathIndex: nextIndex
          })
          api.updateVehicleLocation('VEH-002', nextPosition[0], nextPosition[1]).catch(() => {})
          
          // Marshrut progress'ini yangilash
          const progress = Math.round((nextIndex / vehicle2State.routePath.length) * 100)
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-002' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress })
          }
        }
      }, MOVEMENT_INTERVAL_MS) // Har soniyada kichik qadam - silliq va realistik harakat
    }

    return () => {
      if (animation2IntervalRef.current) {
        clearInterval(animation2IntervalRef.current)
      }
    }
  }, [vehicle2State?.id, vehicle2State?.isPatrolling, vehicle2State?.routePath, vehicle2State?.currentPathIndex])

  // Xaritani yaratish
  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current).setView([39.6742637, 66.9737814], 16) // Ibn Sino ko'chasi 17A
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Â© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
      if (animation2IntervalRef.current) {
        clearInterval(animation2IntervalRef.current)
      }
      map.remove()
    }
  }, [])

  // Markerlarni yangilash
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Eski markerlarni o'chirish
    binMarkersRef.current.forEach(marker => map.removeLayer(marker))
    vehicleMarkersRef.current.forEach(marker => map.removeLayer(marker))
    routeLinesRef.current.forEach(line => map.removeLayer(line))
    
    binMarkersRef.current = []
    vehicleMarkersRef.current = []
    routeLinesRef.current = []

    // BARCHA QUTILARNI KO'RSATISH
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
            <p><strong>Manzil:</strong> ${bin.address || bin.location}</p>
            <p><strong>Holat:</strong> ${bin.status}%</p>
            <p><strong>Sig'im:</strong> ${bin.capacity}L</p>
          </div>
        `)
      
      binMarkersRef.current.push(marker)
    })

    // BARCHA MASHINALARNI KO'RSATISH
    vehiclesData.forEach((vehicle, index) => {
      // Har bir mashina uchun turli rang
      const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
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
            <p><strong>Haydovchi:</strong> ${vehicle.driver}</p>
            <p><strong>Holat:</strong> ${vehicle.status === 'moving' ? 'Harakatda' : vehicle.status === 'active' ? 'Faol' : 'Nofaol'}</p>
            <p><strong>Tozalangan:</strong> ${vehicle.cleaned || 0} ta</p>
          </div>
        `)
      
      vehicleMarkersRef.current.push(marker)

      // Marshrut chizig'i (agar bor bo'lsa)
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
      mapInstanceRef.current.setView([39.6742637, 66.9737814], 16) // Ibn Sino ko'chasi 17A
      showToast && showToast('Xarita markazlashtirildi', 'info')
    }
  }

  const toggleFullscreen = () => {
    const container = mapContainerRef.current
    if (!container) return

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      return
    }

    container.requestFullscreen?.().catch(() => {})
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapContainerRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const mapHeight = isFullscreen
    ? 'calc(100vh - 32px)'
    : expanded
      ? 'clamp(520px, 70vh, 900px)'
      : '400px'

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const resizeTimer = setTimeout(() => {
      mapInstanceRef.current.invalidateSize()
    }, 120)

    return () => clearTimeout(resizeTimer)
  }, [expanded, isFullscreen])

  return (
    <div className={`content-card map-card ${expanded ? 'map-card-expanded' : ''}`}>
      <div className="card-header">
        <h3><i className="fas fa-map-marked-alt"></i> {t('liveMap.title')}</h3>
        <div className="card-actions">
          <button className="btn-icon" onClick={centerMap}>
            <i className="fas fa-crosshairs"></i>
          </button>
        </div>
      </div>
      <div className="card-body">
        <div ref={mapContainerRef} className="live-map-container">
          <div ref={mapRef} className="live-map" style={{ height: mapHeight }}></div>
          <button
            type="button"
            className="map-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Kichraytirish' : "To'liq ekran"}
          >
            <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
          </button>
        </div>
        <div className="map-legend">
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#555' }}>Qutilar:</div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
            <span>Bo'sh (&lt;90%)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
            <span>To'la (â‰¥90%)</span>
          </div>
          <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: '600', color: '#555' }}>Mashinalar:</div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '4px' }}></div>
            <span>VEH-001</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '4px' }}></div>
            <span>VEH-002</span>
          </div>
          {vehiclesData.length > 2 && (
            <div className="legend-item">
              <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
              <span>Boshqa mashinalar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveMapSimple

