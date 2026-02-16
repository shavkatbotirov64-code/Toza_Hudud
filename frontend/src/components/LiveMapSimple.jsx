import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import { io } from 'socket.io-client'
import api from '../services/api'
import 'leaflet/dist/leaflet.css'

const LiveMapSimple = () => {
  const { t } = useTranslation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const binMarkerRef = useRef(null)
  const vehicleMarkerRef = useRef(null)
  const routeLineRef = useRef(null)
  const animationIntervalRef = useRef(null)
  const socketRef = useRef(null) // WebSocket reference
  const { showToast, binsData, setBinsData } = useAppContext() // AppContext dan quti ma'lumotlari
  
  // Birinchi quti (ESP32-IBN-SINO)
  const binData = binsData[0] || {
    id: 'ESP32-IBN-SINO',
    location: [39.6742637, 66.9737814], // Ibn Sino ko'chasi 17A
    address: 'Ibn Sino ko\'chasi 17A, Samarqand',
    status: 15,
    capacity: 120
  }
  
  // Quti holati
  const [binStatus, setBinStatus] = useState('EMPTY') // 'EMPTY' yoki 'FULL'
  
  // Mashina holati
  const [vehicleState, setVehicleState] = useState({
    id: 'VEH-001',
    driver: 'Akmaljon Karimov',
    position: [39.6650, 66.9600], // Boshlang'ich pozitsiya
    isMoving: true, // Doimiy harakat
    isPatrolling: true, // Patrol rejimi
    hasCleanedOnce: false,
    routePath: null,
    currentPathIndex: 0,
    patrolRoute: [ // Samarqand shahar bo'ylab patrol marshruti
      [39.6650, 66.9600], [39.6660, 66.9620], [39.6670, 66.9640],
      [39.6680, 66.9660], [39.6690, 66.9680], [39.6700, 66.9700],
      [39.6710, 66.9720], [39.6720, 66.9740], [39.6730, 66.9760],
      [39.6740, 66.9780], [39.6750, 66.9800], [39.6760, 66.9820],
      [39.6770, 66.9840], [39.6780, 66.9860], [39.6790, 66.9880],
      // Orqaga qaytish
      [39.6780, 66.9860], [39.6770, 66.9840], [39.6760, 66.9820],
      [39.6750, 66.9800], [39.6740, 66.9780], [39.6730, 66.9760],
      [39.6720, 66.9740], [39.6710, 66.9720], [39.6700, 66.9700],
      [39.6690, 66.9680], [39.6680, 66.9660], [39.6670, 66.9640],
      [39.6660, 66.9620], [39.6650, 66.9600]
    ],
    patrolIndex: 0
  })

  // Samarqand ko'chalari - turli marshrut nuqtalari
  const samarqandRoads = [
    {
      name: "Registon atrofi",
      points: [
        [39.6700, 66.9650], [39.6710, 66.9660], [39.6720, 66.9670], 
        [39.6730, 66.9680], [39.6740, 66.9690], [39.6742637, 66.9737814]
      ]
    },
    {
      name: "Amir Temur ko'chasi",
      points: [
        [39.6650, 66.9700], [39.6660, 66.9710], [39.6670, 66.9720],
        [39.6680, 66.9730], [39.6742637, 66.9737814]
      ]
    },
    {
      name: "Mirzo Ulug'bek ko'chasi",
      points: [
        [39.6600, 66.9600], [39.6620, 66.9620], [39.6640, 66.9640],
        [39.6660, 66.9660], [39.6680, 66.9680], [39.6700, 66.9700],
        [39.6720, 66.9720], [39.6742637, 66.9737814]
      ]
    }
  ]

  // Ikki nuqta orasidagi masofani hisoblash (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Yer radiusi (km)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    return distance // km
  }

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
        
        const distanceKm = (route.distance / 1000).toFixed(2)
        const durationMin = (route.duration / 60).toFixed(1)
        
        console.log(`✅ Marshrut topildi!`)
        console.log(`📏 Masofa: ${distanceKm} km`)
        console.log(`⏱️ Vaqt: ${durationMin} daqiqa`)
        console.log(`📊 Nuqtalar soni: ${leafletCoordinates.length}`)
        
        return {
          success: true,
          path: leafletCoordinates,
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

  // WebSocket - Real-time ESP32 ma'lumot olish
  useEffect(() => {
    console.log('🔧 LiveMapSimple component mounted - WebSocket initializing...')
    
    // WebSocket ulanish
    const socket = io('https://tozahudud-production-d73f.up.railway.app', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })
    
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id)
      console.log('✅ Listening for events: sensorData, binStatus')
    })

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
    })
    
    // Test: Barcha eventlarni eshitish
    socket.onAny((eventName, ...args) => {
      console.log(`🔔 WebSocket event received: "${eventName}"`, args)
    })

    // ESP32 dan yangi ma'lumot kelganda
    socket.on('sensorData', (data) => {
      console.log(`📡 REAL-TIME ESP32 SIGNAL:`, data)
      console.log(`📡 Distance: ${data.distance} sm`)
      console.log(`📡 BinId: ${data.binId}`)
      console.log(`📡 Current binData.id: ${binData.id}`)
      
      // Qutini FULL holatiga o'tkazish
      setBinStatus('FULL')
      
      // AppContext dagi qutini yangilash - "Qutilar" bo'limida ham ko'rinadi
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
      setVehicleState(prev => ({
        ...prev,
        hasCleanedOnce: false
      }))
      
      console.log('🔴 BIN STATUS: FULL (Qizil) - Real-time!')
      console.log('🔴 binData.status set to: 95')
    })

    // Quti holati o'zgarganda
    socket.on('binStatus', ({ binId, status }) => {
      console.log(`🗑️ REAL-TIME BIN STATUS: ${binId} = ${status}`)
      setBinStatus(status)
      
      if (status === 'FULL') {
        setBinsData(prev => prev.map(bin =>
          bin.id === binId ? { ...bin, status: 95, fillLevel: 95 } : bin
        ))
        console.log('🔴 Bin marked as FULL from binStatus event')
      } else if (status === 'EMPTY') {
        setBinsData(prev => prev.map(bin =>
          bin.id === binId ? { ...bin, status: 15, fillLevel: 15 } : bin
        ))
        console.log('🟢 Bin marked as EMPTY from binStatus event')
      }
    })

    // Cleanup
    return () => {
      console.log('🔌 WebSocket disconnecting...')
      socket.disconnect()
    }
  }, [])

  // Mashina patrol animatsiyasi - doimiy harakat
  useEffect(() => {
    if (vehicleState.isPatrolling && !vehicleState.routePath) {
      const patrolInterval = setInterval(() => {
        setVehicleState(prev => {
          const nextIndex = (prev.patrolIndex + 1) % prev.patrolRoute.length
          return {
            ...prev,
            position: prev.patrolRoute[nextIndex],
            patrolIndex: nextIndex
          }
        })
      }, 2000) // Har 2 soniyada yangi nuqta

      return () => clearInterval(patrolInterval)
    }
  }, [vehicleState.isPatrolling, vehicleState.routePath])

  // Quti FULL bo'lganda mashina qutiga yo'naladi
  useEffect(() => {
    if (binStatus === 'FULL' && vehicleState.isPatrolling && !vehicleState.hasCleanedOnce) {
      console.log('🚛 Mashina qutiga yo\'nalmoqda!')
      console.log(`📍 Hozirgi pozitsiya: [${vehicleState.position[0]}, ${vehicleState.position[1]}]`)
      
      // Masofani hisoblash
      const distance = calculateDistance(
        vehicleState.position[0], 
        vehicleState.position[1],
        binData.location[0],
        binData.location[1]
      )
      console.log(`📏 Mashina va quti orasidagi masofa: ${distance.toFixed(2)} km`)
      
      // OSRM API dan real marshrut olish
      const getRoute = async () => {
        const result = await fetchRouteFromOSRM(
          vehicleState.position[0],
          vehicleState.position[1],
          binData.location[0],
          binData.location[1]
        )
        
        let route
        if (result.success) {
          route = result.path
          console.log(`✅ Real OpenStreetMap marshruti ishlatilmoqda`)
        } else {
          // Backup: to'g'ridan-to'g'ri marshrut
          route = [vehicleState.position, binData.location]
          console.log(`⚠️ Backup marshrut ishlatilmoqda`)
        }
        
        setVehicleState(prev => ({
          ...prev,
          isPatrolling: false, // Patrolni to'xtatish
          routePath: route,
          currentPathIndex: 0
        }))
      }
      
      getRoute()
    }
  }, [binStatus, vehicleState.isPatrolling, vehicleState.hasCleanedOnce])

  // Mashina qutiga borish animatsiyasi
  useEffect(() => {
    if (!vehicleState.isPatrolling && vehicleState.routePath) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }

      const startTime = Date.now()

      animationIntervalRef.current = setInterval(() => {
        setVehicleState(prev => {
          const nextIndex = prev.currentPathIndex + 1
          
          if (nextIndex >= prev.routePath.length) {
            // Qutiga yetdi - tozalash
            const endTime = Date.now()
            const durationMinutes = Math.round((endTime - startTime) / 1000 / 60) || 1
            
            console.log('✅ Mashina qutiga yetdi!')
            console.log('🧹 Quti tozalanmoqda...')
            
            // Tozalash yozuvi yaratish
            const cleaningData = {
              binId: binData.id,
              vehicleId: vehicleState.id,
              driverName: vehicleState.driver,
              binLocation: binData.address,
              fillLevelBefore: 95,
              fillLevelAfter: 15,
              distanceTraveled: calculateDistance(
                prev.routePath[0][0],
                prev.routePath[0][1],
                binData.location[0],
                binData.location[1]
              ),
              durationMinutes: durationMinutes,
              notes: 'Avtomatik tozalash (ESP32 signali)',
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
            
            // Qutini EMPTY holatiga o'tkazish
            setBinStatus('EMPTY')
            
            // AppContext dagi qutini yangilash
            setBinsData(prevBins => prevBins.map(bin =>
              bin.id === binData.id ? {
                ...bin,
                status: 15,
                fillLevel: 15,
                lastCleaned: new Date().toLocaleDateString('uz-UZ') + ' ' + new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
              } : bin
            ))
            
            console.log('🟢 BIN STATUS: EMPTY (Yashil)')
            console.log('🚛 Mashina patrolga qaytmoqda...')
            
            // Mashina patrolga qaytadi
            clearInterval(animationIntervalRef.current)
            
            return {
              ...prev,
              isPatrolling: true, // Patrolga qaytish
              routePath: null,
              hasCleanedOnce: true,
              currentPathIndex: 0
            }
          }
          
          // Keyingi nuqtaga o'tish
          return {
            ...prev,
            position: prev.routePath[nextIndex],
            currentPathIndex: nextIndex
          }
        })
      }, 1500) // Har 1.5 soniyada harakat
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [vehicleState.isPatrolling, vehicleState.routePath])

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
      map.remove()
    }
  }, [])

  // Markerlarni yangilash
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Quti markeri
    if (binMarkerRef.current) {
      map.removeLayer(binMarkerRef.current)
    }

    const binColor = binData.status >= 90 ? '#ef4444' : '#10b981'
    const binIcon = L.divIcon({
      html: `<div style="background: ${binColor}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid white;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })

    binMarkerRef.current = L.marker(binData.location, { icon: binIcon })
      .addTo(map)
      .bindPopup(`<div><h4>${binData.id}</h4><p><strong>Holat:</strong> ${binStatus}</p><p><strong>Status:</strong> ${binData.status}%</p></div>`)

    // Mashina markeri
    if (vehicleMarkerRef.current) {
      map.removeLayer(vehicleMarkerRef.current)
    }

    const vehicleColor = vehicleState.isMoving ? '#3b82f6' : '#10b981'
    const vehicleIcon = L.divIcon({
      html: `<div style="background: ${vehicleColor}; width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); border: 2px solid white;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
        </svg>
      </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44]
    })

    vehicleMarkerRef.current = L.marker(vehicleState.position, { icon: vehicleIcon })
      .addTo(map)
      .bindPopup(`<div><h4>${vehicleState.id}</h4><p><strong>Haydovchi:</strong> ${vehicleState.driver}</p><p><strong>Holat:</strong> ${vehicleState.isMoving ? 'Harakatda' : 'To\'xtagan'}</p></div>`)

    // Marshrut chizig'i
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current)
    }

    if (vehicleState.isMoving && vehicleState.routePath) {
      routeLineRef.current = L.polyline(vehicleState.routePath, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 4'
      }).addTo(map)
    }

  }, [binData, vehicleState, binStatus])

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
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#555' }}>Status:</div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
            <span>Bo'sh (EMPTY)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
            <span>To'la (FULL)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '4px' }}></div>
            <span>Mashina harakatda</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMapSimple
