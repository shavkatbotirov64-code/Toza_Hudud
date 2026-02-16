import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import api from '../services/api'
import { calculateDistance } from '../utils/vehicleHelpers'
import VehicleManager from '../utils/VehicleManager'
import 'leaflet/dist/leaflet.css'

const LiveMapSimple = () => {
  const { t } = useTranslation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const binMarkersRef = useRef([]) // Barcha quti markerlari
  const vehicleMarkersRef = useRef([]) // Barcha mashina markerlari
  const routeLinesRef = useRef([]) // Barcha marshrut chiziqlari
  const vehicleIntervalsRef = useRef({}) // Har bir mashina uchun interval
  const vehicleManagerRef = useRef(null) // VehicleManager instance
  const animationIntervalRef = useRef(null) // VEH-001 animatsiya interval
  const animation2IntervalRef = useRef(null) // VEH-002 animatsiya interval
  const { showToast, binsData, setBinsData, binStatus, setBinStatus, vehiclesData, updateVehicleState, routesData, updateRoute } = useAppContext() // AppContext dan quti va mashina ma'lumotlari
  
  // Birinchi quti (ESP32-IBN-SINO)
  const binData = binsData[0] || {
    id: 'ESP32-IBN-SINO',
    location: [39.6742637, 66.9737814],
    address: 'Ibn Sino ko\'chasi 17A, Samarqand',
    status: 15,
    capacity: 120
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
      const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
      
      console.log(`🗺️ OSRM API: Marshrut hisoblanmoqda...`)
      console.log(`📍 Start: [${startLat}, ${startLon}]`)
      console.log(`📍 End: [${endLat}, ${endLon}]`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const coordinates = route.geometry.coordinates
        
        // GeoJSON format [lon, lat] dan Leaflet format [lat, lon] ga o'zgartirish
        const leafletCoordinates = coordinates.map(coord => [coord[1], coord[0]])
        
        // Nuqtalarni simplify qilish - har 3-nuqtadan bittasini olish (aniqroq)
        // Bu mashinani ko'chalar bo'ylab aniqroq harakatlantiradi
        const simplifiedCoordinates = leafletCoordinates.filter((coord, index) => {
          // Birinchi va oxirgi nuqtalarni doim qoldirish
          if (index === 0 || index === leafletCoordinates.length - 1) return true
          // Har 3-nuqtadan bittasini olish (5 o'rniga 3 - aniqroq)
          return index % 3 === 0
        })
        
        const distanceKm = (route.distance / 1000).toFixed(2)
        const durationMin = (route.duration / 60).toFixed(1)
        
        console.log(`✅ Marshrut topildi!`)
        console.log(`📏 Masofa: ${distanceKm} km`)
        console.log(`⏱️ Vaqt: ${durationMin} daqiqa`)
        console.log(`📊 Original nuqtalar: ${leafletCoordinates.length}`)
        console.log(`📊 Simplified nuqtalar: ${simplifiedCoordinates.length}`)
        
        return {
          success: true,
          path: simplifiedCoordinates,
          distance: distanceKm,
          duration: durationMin
        }
      } else {
        console.warn('⚠️ OSRM: Marshrut topilmadi, backup ishlatiladi')
        return { success: false }
      }
    } catch (error) {
      console.error('❌ OSRM API xatolik:', error)
      return { success: false }
    }
  }

  // Patrol marshruti yaratish - OSRM API orqali (Mashina 1)
  useEffect(() => {
    if (!vehicleState) return // Mashina mavjud emas
    
    if (vehicleState.isPatrolling && vehicleState.patrolRoute.length === 0) {
      console.log('🗺️ VEH-001 Patrol marshruti yaratilmoqda (OSRM API)...')
      
      const buildPatrolRoute = async () => {
        const waypoints = vehicleState.patrolWaypoints
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
        
        console.log(`✅ VEH-001 Patrol marshruti tayyor: ${fullRoute.length} nuqta`)
        
        updateVehicleState('VEH-001', {
          patrolRoute: fullRoute,
          position: fullRoute[0] || vehicleState.position
        })
      }
      
      buildPatrolRoute()
    }
  }, [vehicleState?.isPatrolling, vehicleState?.patrolRoute?.length])

  // Patrol marshruti yaratish - OSRM API orqali (Mashina 2)
  useEffect(() => {
    if (!vehicle2State) return // Mashina mavjud emas
    
    if (vehicle2State.isPatrolling && vehicle2State.patrolRoute.length === 0) {
      console.log('🗺️ VEH-002 Patrol marshruti yaratilmoqda (OSRM API)...')
      
      const buildPatrolRoute = async () => {
        const waypoints = vehicle2State.patrolWaypoints
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
        
        console.log(`✅ VEH-002 Patrol marshruti tayyor: ${fullRoute.length} nuqta`)
        
        updateVehicleState('VEH-002', {
          patrolRoute: fullRoute,
          position: fullRoute[0] || vehicle2State.position
        })
      }
      
      buildPatrolRoute()
    }
  }, [vehicle2State?.isPatrolling, vehicle2State?.patrolRoute?.length])

  // Mashina patrol animatsiyasi - OSRM yo'llari bo'ylab harakat (Mashina 1)
  useEffect(() => {
    if (!vehicleState) return // Mashina mavjud emas
    
    if (vehicleState.isPatrolling && vehicleState.patrolRoute.length > 0 && !vehicleState.routePath) {
      const patrolInterval = setInterval(() => {
        const nextIndex = vehicleState.patrolIndex + 1
        
        // Agar marshrut oxiriga yetsa, yangi random marshrut qo'shish (cheksiz davom etish)
        if (nextIndex >= vehicleState.patrolRoute.length) {
          console.log('🔄 VEH-001: Marshrut oxiriga yetdi, yangi random yo\'nalish qo\'shilmoqda...')
          
          // Hozirgi oxirgi nuqtadan yangi random nuqtaga marshrut yaratish
          const currentPos = vehicleState.patrolRoute[vehicleState.patrolRoute.length - 1]
          const randomLat = currentPos[0] + (Math.random() - 0.5) * 0.015 // ±750m atrofida
          const randomLon = currentPos[1] + (Math.random() - 0.5) * 0.015
          
          // Yangi marshrut yaratish va qo'shish
          const extendRoute = async () => {
            const result = await fetchRouteFromOSRM(
              currentPos[0], currentPos[1],
              randomLat, randomLon
            )
            
            if (result.success && result.path.length > 1) {
              console.log(`✅ VEH-001: Yangi yo'nalish qo'shildi (${result.path.length} nuqta)`)
              // Eski marshrut + yangi marshrut (birinchi nuqtani o'tkazib yuborish, chunki u oxirgi nuqta)
              const extendedRoute = [...vehicleState.patrolRoute, ...result.path.slice(1)]
              updateVehicleState('VEH-001', {
                patrolRoute: extendedRoute
                // position va patrolIndex o'zgarmaydi - hozirgi joyda qoladi
              })
            } else {
              // Agar OSRM ishlamasa, oddiy random nuqta qo'shamiz
              const extendedRoute = [...vehicleState.patrolRoute, [randomLat, randomLon]]
              updateVehicleState('VEH-001', {
                patrolRoute: extendedRoute
              })
            }
          }
          
          extendRoute()
        } else {
          // Oddiy harakat - keyingi nuqtaga o'tish
          updateVehicleState('VEH-001', {
            position: vehicleState.patrolRoute[nextIndex],
            patrolIndex: nextIndex
          })
        }
      }, 2500) // 2.5 soniya - sekin va silliq harakat

      return () => clearInterval(patrolInterval)
    }
  }, [vehicleState?.isPatrolling, vehicleState?.patrolRoute?.length, vehicleState?.routePath, vehicleState?.patrolIndex])

  // Mashina patrol animatsiyasi - OSRM yo'llari bo'ylab harakat (Mashina 2)
  useEffect(() => {
    if (!vehicle2State) return // Mashina mavjud emas
    
    if (vehicle2State.isPatrolling && vehicle2State.patrolRoute.length > 0 && !vehicle2State.routePath) {
      const patrolInterval = setInterval(() => {
        const nextIndex = vehicle2State.patrolIndex + 1
        
        // Agar marshrut oxiriga yetsa, yangi random marshrut qo'shish (cheksiz davom etish)
        if (nextIndex >= vehicle2State.patrolRoute.length) {
          console.log('🔄 VEH-002: Marshrut oxiriga yetdi, yangi random yo\'nalish qo\'shilmoqda...')
          
          // Hozirgi oxirgi nuqtadan yangi random nuqtaga marshrut yaratish
          const currentPos = vehicle2State.patrolRoute[vehicle2State.patrolRoute.length - 1]
          const randomLat = currentPos[0] + (Math.random() - 0.5) * 0.015 // ±750m atrofida
          const randomLon = currentPos[1] + (Math.random() - 0.5) * 0.015
          
          // Yangi marshrut yaratish va qo'shish
          const extendRoute = async () => {
            const result = await fetchRouteFromOSRM(
              currentPos[0], currentPos[1],
              randomLat, randomLon
            )
            
            if (result.success && result.path.length > 1) {
              console.log(`✅ VEH-002: Yangi yo'nalish qo'shildi (${result.path.length} nuqta)`)
              // Eski marshrut + yangi marshrut (birinchi nuqtani o'tkazib yuborish, chunki u oxirgi nuqta)
              const extendedRoute = [...vehicle2State.patrolRoute, ...result.path.slice(1)]
              updateVehicleState('VEH-002', {
                patrolRoute: extendedRoute
                // position va patrolIndex o'zgarmaydi - hozirgi joyda qoladi
              })
            } else {
              // Agar OSRM ishlamasa, oddiy random nuqta qo'shamiz
              const extendedRoute = [...vehicle2State.patrolRoute, [randomLat, randomLon]]
              updateVehicleState('VEH-002', {
                patrolRoute: extendedRoute
              })
            }
          }
          
          extendRoute()
        } else {
          // Oddiy harakat - keyingi nuqtaga o'tish
          updateVehicleState('VEH-002', {
            position: vehicle2State.patrolRoute[nextIndex],
            patrolIndex: nextIndex
          })
        }
      }, 2500) // 2.5 soniya - sekin va silliq harakat

      return () => clearInterval(patrolInterval)
    }
  }, [vehicle2State?.isPatrolling, vehicle2State?.patrolRoute?.length, vehicle2State?.routePath, vehicle2State?.patrolIndex])

  // Quti FULL bo'lganda - qaysi mashina yaqin bo'lsa o'sha borsin
  useEffect(() => {
    if (binStatus === 'FULL' && !vehicleState.hasCleanedOnce && !vehicle2State.hasCleanedOnce) {
      console.log('🚛 Quti to\'ldi! Eng yaqin mashinani topish...')
      
      // Har ikkala mashina masofasini hisoblash
      const distance1 = calculateDistance(
        vehicleState.position[0], 
        vehicleState.position[1],
        binData.location[0],
        binData.location[1]
      )
      
      const distance2 = calculateDistance(
        vehicle2State.position[0], 
        vehicle2State.position[1],
        binData.location[0],
        binData.location[1]
      )
      
      console.log(`📏 VEH-001 masofa: ${distance1.toFixed(2)} km`)
      console.log(`📏 VEH-002 masofa: ${distance2.toFixed(2)} km`)
      
      // Eng yaqin mashinani tanlash
      const closerVehicle = distance1 <= distance2 ? 'VEH-001' : 'VEH-002'
      console.log(`✅ Eng yaqin mashina: ${closerVehicle}`)
      
      if (closerVehicle === 'VEH-001' && vehicleState.isPatrolling) {
        console.log('🚛 VEH-001 qutiga yo\'nalmoqda!')
        
        const getRoute = async () => {
          const result = await fetchRouteFromOSRM(
            vehicleState.position[0],
            vehicleState.position[1],
            binData.location[0],
            binData.location[1]
          )
          
          let route = result.success ? result.path : [vehicleState.position, binData.location]
          
          updateVehicleState('VEH-001', {
            isPatrolling: false,
            routePath: route,
            currentPathIndex: 0
          })
          
          // Yangi marshrut yaratish
          const newRoute = {
            id: `ROUTE-${Date.now()}`,
            name: `${vehicleState.driver} → ${binData.address}`,
            vehicle: 'VEH-001',
            bins: [binData.id],
            progress: 0,
            distance: result.success ? `${result.distance} km` : 'Noma\'lum',
            estimatedTime: result.success ? `${result.duration} daqiqa` : 'Noma\'lum',
            isActive: true,
            path: route
          }
          
          // Marshrutni qo'shish
          setRoutesData(prev => [...prev, newRoute])
        }
        
        getRoute()
      } else if (closerVehicle === 'VEH-002' && vehicle2State.isPatrolling) {
        console.log('🚛 VEH-002 qutiga yo\'nalmoqda!')
        
        const getRoute = async () => {
          const result = await fetchRouteFromOSRM(
            vehicle2State.position[0],
            vehicle2State.position[1],
            binData.location[0],
            binData.location[1]
          )
          
          let route = result.success ? result.path : [vehicle2State.position, binData.location]
          
          updateVehicleState('VEH-002', {
            isPatrolling: false,
            routePath: route,
            currentPathIndex: 0
          })
          
          // Yangi marshrut yaratish
          const newRoute = {
            id: `ROUTE-${Date.now()}`,
            name: `${vehicle2State.driver} → ${binData.address}`,
            vehicle: 'VEH-002',
            bins: [binData.id],
            progress: 0,
            distance: result.success ? `${result.distance} km` : 'Noma\'lum',
            estimatedTime: result.success ? `${result.duration} daqiqa` : 'Noma\'lum',
            isActive: true,
            path: route
          }
          
          // Marshrutni qo'shish
          setRoutesData(prev => [...prev, newRoute])
        }
        
        getRoute()
      }
    }
  }, [binStatus, vehicleState.isPatrolling, vehicle2State.isPatrolling, vehicleState.hasCleanedOnce, vehicle2State.hasCleanedOnce])

  // Mashina qutiga borish animatsiyasi (Mashina 1)
  useEffect(() => {
    if (!vehicleState.isPatrolling && vehicleState.routePath) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }

      const startTime = Date.now()

      animationIntervalRef.current = setInterval(() => {
        const nextIndex = vehicleState.currentPathIndex + 1
        
        if (nextIndex >= vehicleState.routePath.length) {
          const endTime = Date.now()
          const durationMinutes = Math.round((endTime - startTime) / 1000 / 60) || 1
          
          console.log('✅ VEH-001 qutiga yetdi!')
          console.log('⏸️ Mashina qutida to\'xtadi - 3 soniya kutilmoqda...')
          
          // Animatsiyani to'xtatish
          clearInterval(animationIntervalRef.current)
          
          // Marshrut progress'ini 100% qilish
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-001' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress: 100 })
          }
          
          // 3 soniya kutish - mashina qutida turadi
          setTimeout(() => {
            console.log('🧹 Tozalash boshlandi!')
            console.log('⏰ Vaqt:', new Date().toLocaleTimeString())
            
            const cleaningData = {
              binId: binData.id,
              vehicleId: vehicleState.id,
              driverName: vehicleState.driver,
              binLocation: binData.address,
              fillLevelBefore: 95,
              fillLevelAfter: 15,
              distanceTraveled: calculateDistance(
                vehicleState.routePath[0][0],
                vehicleState.routePath[0][1],
                binData.location[0],
                binData.location[1]
              ),
              durationMinutes: durationMinutes,
              notes: 'Avtomatik tozalash (ESP32 signali) - VEH-001',
              status: 'completed'
            }
            
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
            
            // Qutini yashil qilish
            console.log('🟢 QUTI YASHIL QILINYAPTI - VEH-001 tomonidan')
            console.log('⏰ Vaqt:', new Date().toLocaleTimeString())
            setBinStatus('EMPTY')
            
            setBinsData(prevBins => prevBins.map(bin =>
              bin.id === binData.id ? {
                ...bin,
                status: 15,
                fillLevel: 15,
                lastCleaned: new Date().toLocaleDateString('uz-UZ') + ' ' + new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
              } : bin
            ))
            
            console.log('✅ BIN STATUS: EMPTY (Yashil) - Tugallandi')
            console.log('🚛 VEH-001 patrolga qaytmoqda...')
            
            // Mashina patrolga qaytadi
            updateVehicleState('VEH-001', {
              isPatrolling: true,
              routePath: null,
              hasCleanedOnce: true,
              currentPathIndex: 0,
              patrolRoute: [],
              patrolIndex: 0,
              cleaned: (vehicleState.cleaned || 0) + 1, // Tozalashlar sonini oshirish
              status: 'moving'
            })
            
            // Marshrutni o'chirish
            const activeRoute = routesData.find(r => r.vehicle === 'VEH-001' && r.isActive)
            if (activeRoute) {
              setRoutesData(prev => prev.filter(r => r.id !== activeRoute.id))
            }
          }, 3000) // 3 soniya tozalash
        } else {
          // Keyingi nuqtaga o'tish
          updateVehicleState('VEH-001', {
            position: vehicleState.routePath[nextIndex],
            currentPathIndex: nextIndex
          })
          
          // Marshrut progress'ini yangilash
          const progress = Math.round((nextIndex / vehicleState.routePath.length) * 100)
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-001' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress })
          }
        }
      }, 2000) // 2 soniya - qutiga borishda sekin va aniq
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [vehicleState.isPatrolling, vehicleState.routePath, vehicleState.currentPathIndex])

  // Mashina qutiga borish animatsiyasi (Mashina 2)
  useEffect(() => {
    if (!vehicle2State.isPatrolling && vehicle2State.routePath) {
      if (animation2IntervalRef.current) {
        clearInterval(animation2IntervalRef.current)
      }

      const startTime = Date.now()

      animation2IntervalRef.current = setInterval(() => {
        const nextIndex = vehicle2State.currentPathIndex + 1
        
        if (nextIndex >= vehicle2State.routePath.length) {
          const endTime = Date.now()
          const durationMinutes = Math.round((endTime - startTime) / 1000 / 60) || 1
          
          console.log('✅ VEH-002 qutiga yetdi!')
          console.log('⏸️ Mashina qutida to\'xtadi - 3 soniya kutilmoqda...')
          
          // Animatsiyani to'xtatish
          clearInterval(animation2IntervalRef.current)
          
          // Marshrut progress'ini 100% qilish
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-002' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress: 100 })
          }
          
          // 3 soniya kutish - mashina qutida turadi
          setTimeout(() => {
            console.log('🧹 Tozalash boshlandi!')
            console.log('⏰ Vaqt:', new Date().toLocaleTimeString())
            
            const cleaningData = {
              binId: binData.id,
              vehicleId: vehicle2State.id,
              driverName: vehicle2State.driver,
              binLocation: binData.address,
              fillLevelBefore: 95,
              fillLevelAfter: 15,
              distanceTraveled: calculateDistance(
                vehicle2State.routePath[0][0],
                vehicle2State.routePath[0][1],
                binData.location[0],
                binData.location[1]
              ),
              durationMinutes: durationMinutes,
              notes: 'Avtomatik tozalash (ESP32 signali) - VEH-002',
              status: 'completed'
            }
            
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
            
            // Qutini yashil qilish
            console.log('🟢 QUTI YASHIL QILINYAPTI - VEH-002 tomonidan')
            console.log('⏰ Vaqt:', new Date().toLocaleTimeString())
            setBinStatus('EMPTY')
            
            setBinsData(prevBins => prevBins.map(bin =>
              bin.id === binData.id ? {
                ...bin,
                status: 15,
                fillLevel: 15,
                lastCleaned: new Date().toLocaleDateString('uz-UZ') + ' ' + new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
              } : bin
            ))
            
            console.log('✅ BIN STATUS: EMPTY (Yashil) - Tugallandi')
            console.log('🚛 VEH-002 patrolga qaytmoqda...')
            
            // Mashina patrolga qaytadi
            updateVehicleState('VEH-002', {
              isPatrolling: true,
              routePath: null,
              hasCleanedOnce: true,
              currentPathIndex: 0,
              patrolRoute: [],
              patrolIndex: 0,
              cleaned: (vehicle2State.cleaned || 0) + 1, // Tozalashlar sonini oshirish
              status: 'moving'
            })
            
            // Marshrutni o'chirish
            const activeRoute = routesData.find(r => r.vehicle === 'VEH-002' && r.isActive)
            if (activeRoute) {
              setRoutesData(prev => prev.filter(r => r.id !== activeRoute.id))
            }
          }, 3000) // 3 soniya tozalash
        } else {
          // Keyingi nuqtaga o'tish
          updateVehicleState('VEH-002', {
            position: vehicle2State.routePath[nextIndex],
            currentPathIndex: nextIndex
          })
          
          // Marshrut progress'ini yangilash
          const progress = Math.round((nextIndex / vehicle2State.routePath.length) * 100)
          const activeRoute = routesData.find(r => r.vehicle === 'VEH-002' && r.isActive)
          if (activeRoute) {
            updateRoute(activeRoute.id, { progress })
          }
        }
      }, 2000) // 2 soniya - qutiga borishda sekin va aniq
    }

    return () => {
      if (animation2IntervalRef.current) {
        clearInterval(animation2IntervalRef.current)
      }
    }
  }, [vehicle2State.isPatrolling, vehicle2State.routePath, vehicle2State.currentPathIndex])

  // Xaritani yaratish
  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current).setView([39.6742637, 66.9737814], 16) // Ibn Sino ko'chasi 17A
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
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

  return (
    <div className="content-card map-card">
      <div className="card-header">
        <h3><i className="fas fa-map-marked-alt"></i> {t('liveMap.title')}</h3>
        <div className="card-actions">
          <button className="btn-icon" onClick={centerMap}>
            <i className="fas fa-crosshairs"></i>
          </button>
        </div>
      </div>
      <div className="card-body">
        <div ref={mapRef} className="live-map" style={{ height: '400px' }}></div>
        <div className="map-legend">
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#555' }}>Qutilar:</div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
            <span>Bo'sh (&lt;90%)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
            <span>To'la (≥90%)</span>
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
