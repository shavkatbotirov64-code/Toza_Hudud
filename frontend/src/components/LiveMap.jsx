import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import 'leaflet/dist/leaflet.css'

const LiveMap = () => {
  const { t } = useTranslation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const vehicleMarkersRef = useRef([])
  const routeLinesRef = useRef([]) // Yo'nalish chiziqlari uchun
  const animationIntervalRef = useRef(null)
  const { binsData, vehiclesData, showToast } = useAppContext()
  const [mapFilter, setMapFilter] = useState('all')
  const [vehiclePositions, setVehiclePositions] = useState({})
  const [realTimeBinData, setRealTimeBinData] = useState(null) // Real-time sensor ma'lumoti

  // Mock data - Faqat ESP32 quti (default)
  const mockBinsData = [
    // ESP32 bilan bog'liq quti - Samarqand
    { id: 'ESP32-IBN-SINO', location: [39.6542, 66.9597], address: 'Samarqand', status: 45, capacity: 120 }
  ]

  // Real-time sensor ma'lumotini olish
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('https://tozahudud-production-d73f.up.railway.app/sensors/latest?limit=1')
        const result = await response.json()
        
        if (result.success && result.data && result.data.length > 0) {
          const latestReading = result.data[0]
          
          // ESP32 dan ma'lumot kelsa, quti DOIM qizil (95% to'la)
          const statusPercent = 95 // Doim qizil rang uchun
          
          setRealTimeBinData({
            id: latestReading.binId || 'ESP32-IBN-SINO',
            location: [39.6542, 66.9597],
            address: latestReading.location || 'Samarqand',
            status: statusPercent, // Doim 95%
            capacity: 120,
            distance: latestReading.distance,
            timestamp: latestReading.timestamp
          })
          
          console.log(`🔴 Xarita yangilandi: ${latestReading.distance} sm → QIZIL (${statusPercent}%) - ${latestReading.binId}`)
        } else {
          console.log('⚠️ Sensor ma\'lumoti topilmadi')
        }
      } catch (error) {
        console.error('❌ Sensor ma\'lumotini olishda xatolik:', error)
      }
    }

    // Dastlab olish
    fetchSensorData()
    
    // Har 5 soniyada yangilash
    const interval = setInterval(fetchSensorData, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Real-time yoki mock ma'lumotdan foydalanish
  const activeBinsData = realTimeBinData ? [realTimeBinData] : mockBinsData

  // 1 ta mashina - Samarqand
  const mockVehiclesData = [
    { id: 'VEH-001', driver: 'Akmaljon Karimov', status: 'moving', coordinates: [39.6542, 66.9597] }
  ]

  // Ko'chalar tarmog'i - Samarqand
  const tashkentRoads = [
    // Markaziy yo'llar
    {
      name: "Registon ko'chasi",
      points: [
        [39.654, 66.960], [39.6545, 66.9605], [39.655, 66.961], [39.6555, 66.9615],
        [39.656, 66.962], [39.6565, 66.9625], [39.657, 66.963], [39.6575, 66.9635],
        [39.658, 66.964], [39.6585, 66.9645], [39.659, 66.965], [39.6595, 66.9655]
      ]
    },
    {
      name: "Amir Temur ko'chasi",
      points: [
        [39.650, 66.955], [39.6505, 66.9555], [39.651, 66.956], [39.6515, 66.9565],
        [39.652, 66.957], [39.6525, 66.9575], [39.653, 66.958], [39.6535, 66.9585],
        [39.654, 66.959], [39.6545, 66.9595], [39.655, 66.960], [39.6555, 66.9605]
      ]
    },
    // Shimoliy yo'llar
    {
      name: "Shohruh ko'chasi",
      points: [
        [39.660, 66.950], [39.6620, 66.9520], [39.6640, 66.9540], [39.6660, 66.9560],
        [39.6680, 66.9580], [39.6700, 66.9600], [39.6720, 66.9620], [39.6740, 66.9640]
      ]
    },
    {
      name: "Buyuk Ipak Yo'li",
      points: [
        [39.665, 66.965], [39.6670, 66.9670], [39.6690, 66.9690], [39.6710, 66.9710],
        [39.6730, 66.9730], [39.6750, 66.9750], [39.6770, 66.9770], [39.6790, 66.9790]
      ]
    },
    // Janubiy yo'llar
    {
      name: "Ulug'bek ko'chasi",
      points: [
        [39.640, 66.955], [39.6420, 66.9570], [39.6440, 66.9590], [39.6460, 66.9610],
        [39.6480, 66.9630], [39.6500, 66.9650], [39.6520, 66.9670], [39.6540, 66.9690]
      ]
    },
    {
      name: "Bobur ko'chasi",
      points: [
        [39.635, 66.960], [39.6370, 66.9620], [39.6390, 66.9640], [39.6410, 66.9660],
        [39.6430, 66.9680], [39.6450, 66.9700], [39.6470, 66.9720], [39.6490, 66.9740]
      ]
    },
    // Sharqiy yo'llar
    {
      name: "Gur-Emir ko'chasi",
      points: [
        [39.650, 66.970], [39.6520, 66.9720], [39.6540, 66.9740], [39.6560, 66.9760],
        [39.6580, 66.9780], [39.6600, 66.9800], [39.6620, 66.9820], [39.6640, 66.9840]
      ]
    },
    {
      name: "Bibi Xonim ko'chasi",
      points: [
        [39.655, 66.975], [39.6570, 66.9770], [39.6590, 66.9790], [39.6610, 66.9810],
        [39.6630, 66.9830], [39.6650, 66.9850], [39.6670, 66.9870], [39.6690, 66.9890]
      ]
    },
    // G'arbiy yo'llar
    {
      name: "Shohizinda ko'chasi",
      points: [
        [39.655, 66.945], [39.6570, 66.9470], [39.6590, 66.9490], [39.6610, 66.9510],
        [39.6630, 66.9530], [39.6650, 66.9550], [39.6670, 66.9570], [39.6690, 66.9590]
      ]
    },
    {
      name: "Afrosiyob ko'chasi",
      points: [
        [39.645, 66.950], [39.6470, 66.9520], [39.6490, 66.9540], [39.6510, 66.9560],
        [39.6530, 66.9580], [39.6550, 66.9600], [39.6570, 66.9620], [39.6590, 66.9640]
      ]
    },
    // Qo'shimcha markaziy yo'llar
    {
      name: "Rudaki ko'chasi",
      points: [
        [39.648, 66.958], [39.6500, 66.9600], [39.6520, 66.9620], [39.6540, 66.9640],
        [39.6560, 66.9660], [39.6580, 66.9680], [39.6600, 66.9700], [39.6620, 66.9720]
      ]
    },
    {
      name: "Ismoil Somoni ko'chasi",
      points: [
        [39.652, 66.956], [39.6540, 66.9580], [39.6560, 66.9600], [39.6580, 66.9620],
        [39.6600, 66.9640], [39.6620, 66.9660], [39.6640, 66.9680], [39.6660, 66.9700]
      ]
    }
  ]

  // Eng qisqa yo'lni topish
  const findShortestPath = (startLat, startLng, endLat, endLng) => {
    let startRoad = null, endRoad = null, startPointIndex = 0, endPointIndex = 0
    let minStartDistance = Infinity, minEndDistance = Infinity

    tashkentRoads.forEach((road, roadIndex) => {
      road.points.forEach((point, pointIndex) => {
        const startDistance = Math.sqrt(Math.pow(startLat - point[0], 2) + Math.pow(startLng - point[1], 2))
        const endDistance = Math.sqrt(Math.pow(endLat - point[0], 2) + Math.pow(endLng - point[1], 2))
        
        if (startDistance < minStartDistance) {
          minStartDistance = startDistance
          startRoad = roadIndex
          startPointIndex = pointIndex
        }
        if (endDistance < minEndDistance) {
          minEndDistance = endDistance
          endRoad = roadIndex
          endPointIndex = pointIndex
        }
      })
    })

    if (startRoad === null || endRoad === null) return [[startLat, startLng], [endLat, endLng]]

    const path = [[startLat, startLng]]
    
    if (startRoad === endRoad) {
      const road = tashkentRoads[startRoad]
      const start = Math.min(startPointIndex, endPointIndex)
      const end = Math.max(startPointIndex, endPointIndex)
      for (let i = start; i <= end; i++) {
        path.push(road.points[i])
      }
    } else {
      const startRoadData = tashkentRoads[startRoad]
      for (let i = startPointIndex; i < startRoadData.points.length; i++) {
        path.push(startRoadData.points[i])
      }
      const endRoadData = tashkentRoads[endRoad]
      path.push(endRoadData.points[0])
      for (let i = 0; i <= endPointIndex; i++) {
        path.push(endRoadData.points[i])
      }
    }
    
    path.push([endLat, endLng])
    return path
  }

  // To'la quti haqida eng yaqin bo'sh mashinaga xabar berish - Map.toza.huduh bilan bir xil
  const notifyNearestVehicle = (fullBin) => {
    // Allaqachon bu qutiga yo'naltirilgan mashina bormi tekshirish
    const alreadyAssigned = Object.values(vehiclePositions).some((route) => 
      route.targetBin?.id === fullBin.id && !route.reachedTarget
    )
    
    if (alreadyAssigned) {
      console.log(`⚠️ ${fullBin.id} qutiga allaqachon mashina yo'naltirilgan`)
      return null
    }
    
    // Bo'sh mashinalarni topish (hech qaysi qutiga yo'naltirilmagan)
    const freeVehicles = Object.values(vehiclePositions).filter((route) => 
      !route.reachedTarget && (!route.targetBin || route.targetBin.status < 90)
    )
    
    if (freeVehicles.length === 0) {
      console.log(`⚠️ Barcha mashinalar band, ${fullBin.id} uchun kutish kerak`)
      return null
    }
    
    // Eng yaqin bo'sh mashinani topish
    let nearestVehicle = null
    let minDistance = Infinity
    
    freeVehicles.forEach((route) => {
      const distance = Math.sqrt(
        Math.pow(route.currentLat - fullBin.location[0], 2) + 
        Math.pow(route.currentLng - fullBin.location[1], 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestVehicle = route
      }
    })
    
    if (nearestVehicle) {
      // Mashinani yangi maqsadga yo'naltirish
      nearestVehicle.targetLat = fullBin.location[0]
      nearestVehicle.targetLng = fullBin.location[1]
      nearestVehicle.targetBin = fullBin
      nearestVehicle.isMovingToTarget = true
      nearestVehicle.notificationSent = true
      
      // Eng qisqa yo'lni hisoblash
      nearestVehicle.routePath = findShortestPath(
        nearestVehicle.currentLat,
        nearestVehicle.currentLng,
        fullBin.location[0],
        fullBin.location[1]
      )
      nearestVehicle.pathIndex = 0
      
      console.log(`🚨 AVTOMATIK: ${nearestVehicle.vehicleId} mashinasi ${fullBin.id} qutiga yo'naltirildi! (${nearestVehicle.routePath.length} nuqta)`)
      
      return nearestVehicle
    }
    
    return null
  }

  // Yo'nalish chiziqlarini yangilash - Map.toza.huduh bilan bir xil
  const updateRouteLines = () => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    routeLinesRef.current.forEach(line => {
      if (map.hasLayer(line)) map.removeLayer(line)
    })
    routeLinesRef.current = []

    Object.values(vehiclePositions).forEach((route) => {
      if (route.targetBin && !route.reachedTarget && route.routePath) {
        // Ko'chalar bo'ylab yo'l chizish
        const routeLine = L.polyline(route.routePath, {
          color: '#3b82f6', // Ko'k rang
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 4', // Chiziqli chiziq
          className: 'route-line'
        }).addTo(map)

        // Yo'l bo'ylab o'qlar qo'yish
        for (let i = 1; i < route.routePath.length - 1; i += 3) { // Har 3-nuqtada o'q
          const currentPoint = route.routePath[i]
          const nextPoint = route.routePath[i + 1] || route.routePath[i]
          
          // O'q yo'nalishini hisoblash
          const angle = Math.atan2(
            nextPoint[0] - currentPoint[0],
            nextPoint[1] - currentPoint[1]
          ) * 180 / Math.PI

          const arrowMarker = L.marker(currentPoint, {
            icon: L.divIcon({
              html: `<div style="transform: rotate(${angle}deg); color: #3b82f6; font-size: 14px; text-shadow: 1px 1px 2px white;">▲</div>`,
              className: 'route-arrow',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(map)

          routeLinesRef.current.push(arrowMarker)
        }

        // Maqsad qutini belgilash
        const targetMarker = L.marker([route.targetLat, route.targetLng], {
          icon: L.divIcon({
            html: `<div style="background: #ef4444; color: white; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid white; animation: targetPulse 2s infinite;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A7,7 0 0,1 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9A7,7 0 0,1 12,2M12,7A2,2 0 0,0 10,9A2,2 0 0,0 12,11A2,2 0 0,0 14,9A2,2 0 0,0 12,7Z"/>
              </svg>
            </div>`,
            className: 'target-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 28]
          })
        }).addTo(map)

        routeLinesRef.current.push(routeLine)
        routeLinesRef.current.push(targetMarker)
      }
    })
  }

  // Mashina marshruti yaratish - Map.toza.huduh bilan bir xil
  const generateVehicleRoute = (vehicle) => {
    const vehicleLat = vehicle.coordinates ? vehicle.coordinates[0] : 39.6542
    const vehicleLng = vehicle.coordinates ? vehicle.coordinates[1] : 66.9597
    
    // Eng yaqin yo'lni topish
    let closestRoad = tashkentRoads[0]
    let minDistance = Infinity
    
    tashkentRoads.forEach(road => {
      const firstPoint = road.points[0]
      const distance = Math.sqrt(
        Math.pow(vehicleLat - firstPoint[0], 2) + 
        Math.pow(vehicleLng - firstPoint[1], 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        closestRoad = road
      }
    })
    
    // Tasodifiy maqsad quti tanlash (to'la qutilarni afzal ko'rish)
    const fullBins = activeBinsData.filter(bin => bin.status >= 90)
    const targetBin = fullBins.length > 0 ? 
      fullBins[Math.floor(Math.random() * fullBins.length)] :
      activeBinsData[Math.floor(Math.random() * activeBinsData.length)]
    
    return {
      vehicleId: vehicle.id,
      currentLat: closestRoad.points[0][0], // Yo'lning boshidan boshlash
      currentLng: closestRoad.points[0][1],
      targetLat: targetBin ? targetBin.location[0] : closestRoad.points[closestRoad.points.length - 1][0],
      targetLng: targetBin ? targetBin.location[1] : closestRoad.points[closestRoad.points.length - 1][1],
      roadPoints: closestRoad.points,
      currentPointIndex: 0,
      targetBin: targetBin,
      roadName: closestRoad.name,
      speed: Math.random() * 0.00005 + 0.00002, // Juda sekin tezlik
      isMovingToTarget: false,
      reachedTarget: false,
      lastUpdate: Date.now(),
      notificationSent: false,
      routePath: null, // Yo'l hisoblash kerak
      pathIndex: 0
    }
  }

  // Mashinalarni yo'l bo'ylab harakatlantirish - Map.toza.huduh bilan bir xil
  const moveVehiclesAlongRoads = () => {
    setVehiclePositions(prevPositions => {
      const newPositions = { ...prevPositions }
      const currentTime = Date.now()
      
      // To'la qutilarni tekshirish va eng yaqin bo'sh mashinaga xabar berish
      const fullBins = activeBinsData.filter(bin => bin.status >= 90)
      fullBins.forEach(fullBin => {
        const notifiedVehicle = notifyNearestVehicle(fullBin)
        if (notifiedVehicle) {
          console.log(`🚨 ${notifiedVehicle.vehicleId} mashinasi ${fullBin.id} qutiga yo'naltirildi!`)
          // Yo'nalish chiziqlarini yangilash
          setTimeout(() => updateRouteLines(), 100)
        }
      })
      
      Object.keys(newPositions).forEach(vehicleId => {
        const route = newPositions[vehicleId]
        
        // Agar maqsadga yetgan bo'lsa, yangi marshrut yaratish
        if (route.reachedTarget) {
          const vehicle = mockVehiclesData.find(v => v.id === vehicleId)
          if (vehicle && currentTime - route.lastUpdate > 3000) { // 3 soniya kutish
            // Yangi yo'l tanlash
            const randomRoad = tashkentRoads[Math.floor(Math.random() * tashkentRoads.length)]
            
            // Yangi maqsad quti (to'la qutilarni afzal ko'rish)
            const fullBins = activeBinsData.filter(bin => bin.status >= 90)
            const warningBins = activeBinsData.filter(bin => bin.status >= 70 && bin.status < 90)
            const allTargetBins = fullBins.length > 0 ? fullBins : 
                                 warningBins.length > 0 ? warningBins : activeBinsData
            
            const newTargetBin = allTargetBins[Math.floor(Math.random() * allTargetBins.length)]
            
            newPositions[vehicleId] = {
              ...route,
              currentLat: randomRoad.points[0][0],
              currentLng: randomRoad.points[0][1],
              targetLat: newTargetBin ? newTargetBin.location[0] : randomRoad.points[randomRoad.points.length - 1][0],
              targetLng: newTargetBin ? newTargetBin.location[1] : randomRoad.points[randomRoad.points.length - 1][1],
              roadPoints: randomRoad.points,
              currentPointIndex: 0,
              targetBin: newTargetBin,
              roadName: randomRoad.name,
              isMovingToTarget: false,
              reachedTarget: false,
              lastUpdate: currentTime,
              notificationSent: false,
              routePath: null, // Yangi yo'l hisoblash kerak
              pathIndex: 0
            }
            
            console.log(`🔄 ${vehicleId} yangi marshrut: ${randomRoad.name} → ${newTargetBin?.id}`)
          }
          return
        }
        
        let targetLat, targetLng
        
        if (route.routePath && route.pathIndex < route.routePath.length) {
          // Yo'l bo'ylab harakat
          const currentPathPoint = route.routePath[route.pathIndex]
          targetLat = currentPathPoint[0]
          targetLng = currentPathPoint[1]
        } else if (!route.isMovingToTarget && route.currentPointIndex < route.roadPoints.length) {
          // Eski yo'l nuqtalari bo'ylab harakat (agar yo'l yo'q bo'lsa)
          const currentPoint = route.roadPoints[route.currentPointIndex]
          targetLat = currentPoint[0]
          targetLng = currentPoint[1]
        } else {
          // Maqsad qutiga yo'nalish
          route.isMovingToTarget = true
          targetLat = route.targetLat
          targetLng = route.targetLng
        }
        
        // Maqsadga yo'nalish hisoblash
        const deltaLat = targetLat - route.currentLat
        const deltaLng = targetLng - route.currentLng
        const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng)
        
        if (distance > 0.00005) { // Juda kichik masofa
          // Yo'nalish bo'yicha harakat
          const moveDistance = Math.min(route.speed, distance)
          route.currentLat += (deltaLat / distance) * moveDistance
          route.currentLng += (deltaLng / distance) * moveDistance
        } else {
          // Maqsadga yetdi
          if (route.routePath && route.pathIndex < route.routePath.length - 1) {
            // Yo'l bo'ylab keyingi nuqtaga o'tish
            route.pathIndex++
          } else if (!route.isMovingToTarget && route.currentPointIndex < route.roadPoints.length - 1) {
            // Eski yo'l nuqtasiga yetdi, keyingi nuqtaga o'tish
            route.currentPointIndex++
          } else {
            // Qutiga yetdi - qutini tozalash
            route.reachedTarget = true
            route.lastUpdate = currentTime
            
            if (route.targetBin) {
              console.log(`✅ ${vehicleId} ${route.targetBin.id} qutiga yetdi va tozalaydi!`)
              
              // Qutini tozalash - yashil rangga o'zgartirish (10-20%)
              if (realTimeBinData && realTimeBinData.id === route.targetBin.id) {
                setRealTimeBinData({
                  ...realTimeBinData,
                  status: 15 // Yashil rang uchun (0-30%)
                })
                console.log(`🧹 ${route.targetBin.id} tozalandi! Qizil → Yashil (15%)`)
              }
            }
          }
        }
      })
      
      // Yo'nalish chiziqlarini yangilash
      updateRouteLines()
      
      return newPositions
    })
  }

  // Initialization - Map.toza.huduh bilan bir xil
  useEffect(() => {
    if (mockVehiclesData.length > 0 && activeBinsData.length > 0) {
      const routes = {}
      mockVehiclesData.forEach(vehicle => {
        // Barcha mashinalarni faol qilish
        routes[vehicle.id] = generateVehicleRoute(vehicle)
      })
      setVehiclePositions(routes)
    }
  }, [])

  // Animation interval - yo'l bo'ylab harakat - Map.toza.huduh bilan bir xil
  useEffect(() => {
    if (Object.keys(vehiclePositions).length > 0) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
      
      animationIntervalRef.current = setInterval(moveVehiclesAlongRoads, 300) // Har 0.3 soniyada - tezroq harakat
      
      return () => {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
        }
      }
    }
  }, [vehiclePositions])

  // Map initialization
  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current).setView([39.6542, 66.9597], 13)
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

  // Markers update
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear old markers
    markersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) map.removeLayer(marker)
    })
    markersRef.current = []

    vehicleMarkersRef.current.forEach(marker => {
      if (map.hasLayer(marker)) map.removeLayer(marker)
    })
    vehicleMarkersRef.current = []

    routeLinesRef.current.forEach(line => {
      if (map.hasLayer(line)) map.removeLayer(line)
    })
    routeLinesRef.current = []

    // Filter bins
    let filteredBins = activeBinsData
    if (mapFilter === 'full') {
      filteredBins = activeBinsData.filter(bin => bin.status >= 90)
    } else if (mapFilter === 'warning') {
      filteredBins = activeBinsData.filter(bin => bin.status >= 70 && bin.status < 90)
    } else if (mapFilter === 'empty') {
      filteredBins = activeBinsData.filter(bin => bin.status < 30)
    }

    // Add bin markers
    if (mapFilter !== 'vehicles') {
      filteredBins.forEach(bin => {
        const color = getStatusColor(bin.status)
        const icon = L.divIcon({
          html: `<div class="bin-marker" style="background: ${color}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
            </svg>
          </div>`,
          iconSize: [32, 32], iconAnchor: [16, 32]
        })

        const marker = L.marker(bin.location, { icon })
          .addTo(map)
          .bindPopup(`<div style="min-width: 200px;"><h4>Quti #${bin.id}</h4><p><strong>Manzil:</strong> ${bin.address}</p><p><strong>Holat:</strong> ${bin.status}% - ${getStatusText(bin.status)}</p><p><strong>Sig'im:</strong> ${bin.capacity}L</p></div>`)

        markersRef.current.push(marker)
      })
    }

    // Add vehicle markers
    if (mapFilter === 'all' || mapFilter === 'vehicles') {
      mockVehiclesData.forEach(vehicle => {
        const currentRoute = vehiclePositions[vehicle.id]
        const currentLat = currentRoute ? currentRoute.currentLat : (vehicle.coordinates ? vehicle.coordinates[0] : 39.6542)
        const currentLng = currentRoute ? currentRoute.currentLng : (vehicle.coordinates ? vehicle.coordinates[1] : 66.9597)
        
        const color = vehicle.status === 'moving' ? '#3b82f6' : vehicle.status === 'active' ? '#10b981' : '#94a3b8'
        const isMoving = currentRoute && !currentRoute.reachedTarget
        
        const icon = L.divIcon({
          html: `<div class="vehicle-marker animated-vehicle" style="background: ${color}; width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); border: 2px solid white; ${isMoving ? 'animation: vehicleMoving 2s infinite;' : ''}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
            </svg>
          </div>`,
          iconSize: [44, 44], iconAnchor: [22, 44]
        })

        const routeInfo = currentRoute ? 
          `<p><strong>Maqsad:</strong> ${currentRoute.targetBin ? `${currentRoute.targetBin.id} (${Math.round(currentRoute.targetBin.status)}%)` : 'Aylanib yurmoqda'}</p>
           <p><strong>Yo'l:</strong> ${currentRoute.roadName}</p>
           <p><strong>Holat:</strong> ${currentRoute.reachedTarget ? 'Yetib keldi' : currentRoute.targetBin ? 'Qutiga bormoqda' : 'Aylanib yurmoqda'}</p>` : ''

        const marker = L.marker([currentLat, currentLng], { icon })
          .addTo(map)
          .bindPopup(`<div style="min-width: 250px;">
            <h4>${vehicle.id}</h4>
            <p><strong>Haydovchi:</strong> ${vehicle.driver}</p>
            <p><strong>Holat:</strong> ${vehicle.status === 'moving' ? 'Harakatda' : 'Faol'}</p>
            ${routeInfo}
          </div>`)

        vehicleMarkersRef.current.push(marker)
      })
    }

    updateRouteLines()
  }, [mapFilter, vehiclePositions, realTimeBinData])

  const getStatusColor = (status) => {
    if (status >= 90) return '#ef4444'
    if (status >= 70) return '#f59e0b'
    if (status >= 30) return '#eab308'
    return '#10b981'
  }

  const getStatusText = (status) => {
    if (status >= 90) return 'To\'la'
    if (status >= 70) return 'Deyarli to\'la'
    if (status >= 30) return 'Yarim'
    return 'Bo\'sh'
  }

  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn()
      showToast && showToast('Xarita kattalashtirildi', 'info')
    }
  }

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut()
      showToast && showToast('Xarita kichiklashtirildi', 'info')
    }
  }

  const centerMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([39.6542, 66.9597], 13)
      showToast && showToast('Xarita markazlashtirildi', 'info')
    }
  }

  const showAllVehicles = () => {
    if (mapInstanceRef.current && vehicleMarkersRef.current.length > 0) {
      const bounds = L.latLngBounds(vehicleMarkersRef.current.map(m => m.getLatLng()))
      mapInstanceRef.current.fitBounds(bounds)
      showToast && showToast('Barcha mashinalar ko\'rsatildi', 'info')
    }
  }

  const handleFilterChange = (value) => {
    setMapFilter(value)
    if (showToast) {
      const messages = {
        'full': 'To\'la qutilar ko\'rsatilmoqda',
        'warning': 'Ogohlantirish qutilari ko\'rsatilmoqda',
        'empty': 'Bo\'sh qutilar ko\'rsatilmoqda',
        'vehicles': 'Mashinalar ko\'rsatilmoqda',
        'all': 'Barcha belgilar ko\'rsatilmoqda'
      }
      showToast(messages[value] || messages['all'], value === 'full' || value === 'warning' ? 'warning' : 'info')
    }
  }

  return (
    <div className="content-card map-card">
      <div className="card-header">
        <h3><i className="fas fa-map-marked-alt"></i> {t('liveMap.title')}</h3>
        <div className="card-actions">
          <button className="btn-icon" onClick={zoomIn}>
            <i className="fas fa-plus"></i>
          </button>
          <button className="btn-icon" onClick={zoomOut}>
            <i className="fas fa-minus"></i>
          </button>
          <button className="btn-icon" onClick={centerMap}>
            <i className="fas fa-crosshairs"></i>
          </button>
          <button className="btn-icon" onClick={showAllVehicles}>
            <i className="fas fa-truck"></i>
          </button>
          <select className="map-filter" value={mapFilter} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="all">{t('liveMap.all')}</option>
            <option value="full">{t('liveMap.fullBins')}</option>
            <option value="warning">{t('liveMap.warning')}</option>
            <option value="empty">{t('liveMap.empty')}</option>
            <option value="vehicles">{t('liveMap.vehicles')}</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        <div ref={mapRef} className="live-map" style={{ height: '400px' }}></div>
        <div className="map-legend">
          <div style={{ marginBottom: '8px', fontWeight: '600', color: '#555' }}>Chiqindi qutilar:</div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
              </svg>
            </div>
            <span>Bo'sh (0-30%)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#eab308', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
              </svg>
            </div>
            <span>Yarim (30-70%)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
              </svg>
            </div>
            <span>Ogohlantirish (70-90%)</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9M7 6H17V19H7V6M9 8V17H11V8H9M13 8V17H15V8H13Z"/>
              </svg>
            </div>
            <span>To'la (90-100%)</span>
          </div>
          
          <div style={{ marginBottom: '8px', marginTop: '12px', fontWeight: '600', color: '#555' }}>Yuk mashinalari:</div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
              </svg>
            </div>
            <span>Harakatda</span>
          </div>
          <div className="legend-item">
            <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,12H17V9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8Z"/>
              </svg>
            </div>
            <span>Faol</span>
          </div>

          <div style={{ marginBottom: '8px', marginTop: '12px', fontWeight: '600', color: '#555' }}>Yo'nalishlar:</div>
          <div className="legend-item">
            <span style={{ width: '20px', height: '3px', background: '#3b82f6', borderStyle: 'dashed' }}></span>
            <span>Ko'chalar bo'ylab yo'l</span>
          </div>
          <div className="legend-item">
            <span style={{ fontSize: '12px' }}>📍</span>
            <span>Maqsad quti</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMap