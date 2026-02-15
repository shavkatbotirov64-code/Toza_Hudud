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
  const { showToast } = useAppContext()
  
  // Quti holati
  const [binStatus, setBinStatus] = useState('EMPTY') // 'EMPTY' yoki 'FULL'
  const [binData, setBinData] = useState({
    id: 'ESP32-IBN-SINO',
    location: [39.6542, 66.9597],
    address: 'Samarqand',
    status: 15, // Yashil (bo'sh)
    capacity: 120
  })
  
  // Mashina holati
  const [vehicleState, setVehicleState] = useState({
    id: 'VEH-001',
    driver: 'Akmaljon Karimov',
    position: [39.650, 66.955], // Boshlang'ich pozitsiya
    isMoving: false,
    hasCleanedOnce: false, // Faqat 1 marta tozalash uchun
    routePath: null,
    currentPathIndex: 0
  })

  // Samarqand ko'chalari (backup uchun)
  const samarqandRoads = [
    {
      name: "Registon ko'chasi",
      points: [
        [39.650, 66.955], [39.6510, 66.9560], [39.6520, 66.9570], [39.6530, 66.9580],
        [39.6540, 66.9590], [39.6542, 66.9597]
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
    })

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
    })

    // ESP32 dan yangi ma'lumot kelganda
    socket.on('sensorData', (data) => {
      console.log(`📡 REAL-TIME ESP32 SIGNAL: ${data.distance} sm`)
      
      // Qutini FULL holatiga o'tkazish
      setBinStatus('FULL')
      setBinData(prev => ({
        ...prev,
        status: 95, // Qizil rang
        distance: data.distance,
        timestamp: data.timestamp
      }))
      
      // hasCleanedOnce ni reset qilish - yangi FULL signal uchun
      setVehicleState(prev => ({
        ...prev,
        hasCleanedOnce: false
      }))
      
      console.log('🔴 BIN STATUS: FULL (Qizil) - Real-time!')
    })

    // Quti holati o'zgarganda
    socket.on('binStatus', ({ binId, status }) => {
      console.log(`🗑️ REAL-TIME BIN STATUS: ${binId} = ${status}`)
      setBinStatus(status)
      
      if (status === 'FULL') {
        setBinData(prev => ({ ...prev, status: 95 }))
      } else if (status === 'EMPTY') {
        setBinData(prev => ({ ...prev, status: 15 }))
      }
    })

    // Cleanup
    return () => {
      console.log('🔌 WebSocket disconnecting...')
      socket.disconnect()
    }
  }, [])

  // Quti FULL bo'lganda mashina harakatga keladi
  useEffect(() => {
    if (binStatus === 'FULL' && !vehicleState.isMoving && !vehicleState.hasCleanedOnce) {
      console.log('🚛 Mashina harakatga keldi!')
      
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
          // Backup: oddiy marshrut
          route = samarqandRoads[0].points
          console.log(`⚠️ Backup marshrut ishlatilmoqda`)
        }
        
        setVehicleState(prev => ({
          ...prev,
          isMoving: true,
          routePath: route,
          currentPathIndex: 0
        }))
      }
      
      getRoute()
    }
  }, [binStatus, vehicleState.isMoving, vehicleState.hasCleanedOnce])

  // Mashina animatsiyasi
  useEffect(() => {
    if (vehicleState.isMoving && vehicleState.routePath) {
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
            setBinData(prevBin => ({
              ...prevBin,
              status: 15 // Yashil rang
            }))
            
            console.log('🟢 BIN STATUS: EMPTY (Yashil)')
            
            // Mashina to'xtaydi
            clearInterval(animationIntervalRef.current)
            
            return {
              ...prev,
              isMoving: false,
              hasCleanedOnce: true, // Tozalandi
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
      }, 500) // Har 0.5 soniyada harakat
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [vehicleState.isMoving, vehicleState.routePath])

  // Xaritani yaratish
  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current).setView([39.6542, 66.9597], 14)
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
      mapInstanceRef.current.setView([39.6542, 66.9597], 14)
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
