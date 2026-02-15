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

  // Mock data - Map.toza.huduh dan nusxalangan
  const mockBinsData = [
    // Shimoliy hudud
    { id: 'BIN-001', location: [41.3350, 69.2100], address: 'Chilonzor tumani, Qatortol ko\'chasi, 12', status: 95, capacity: 120 },
    { id: 'BIN-002', location: [41.3280, 69.2850], address: 'Yunusobod tumani, Shota Rustaveli, 45', status: 88, capacity: 150 },
    { id: 'BIN-003', location: [41.3450, 69.2650], address: 'Mirobod tumani, Buyuk Ipak Yo\'li, 78', status: 92, capacity: 180 },
    
    // Markaziy hudud
    { id: 'BIN-004', location: [41.3150, 69.2400], address: 'Shayhontohur tumani, Amir Temur, 23', status: 75, capacity: 140 },
    { id: 'BIN-005', location: [41.3080, 69.2750], address: 'Olmazor tumani, Mustaqillik, 56', status: 98, capacity: 160 },
    { id: 'BIN-006', location: [41.3200, 69.2300], address: 'Mirabad tumani, Navoi ko\'chasi, 89', status: 65, capacity: 130 },
    
    // Janubiy hudud
    { id: 'BIN-007', location: [41.2850, 69.2200], address: 'Sergeli tumani, Qashqadaryo, 34', status: 91, capacity: 170 },
    { id: 'BIN-008', location: [41.2950, 69.2950], address: 'Yakkasaroy tumani, Bobur ko\'chasi, 67', status: 45, capacity: 140 },
    { id: 'BIN-009', location: [41.2750, 69.2600], address: 'Uchtepa tumani, Abdulla Qodiriy, 90', status: 78, capacity: 155 },
    
    // Sharqiy hudud
    { id: 'BIN-010', location: [41.3100, 69.3200], address: 'Yashnobod tumani, Yunus Rajabiy, 12', status: 93, capacity: 165 },
    { id: 'BIN-011', location: [41.3300, 69.3100], address: 'Mirzo Ulug\'bek tumani, Universitet, 45', status: 67, capacity: 145 },
    { id: 'BIN-012', location: [41.2900, 69.3050], address: 'Yashil ko\'cha tumani, Bog\'ishamol, 78', status: 89, capacity: 175 },
    
    // G'arbiy hudud
    { id: 'BIN-013', location: [41.3250, 69.1850], address: 'Bektemir tumani, Farg\'ona yo\'li, 23', status: 96, capacity: 135 },
    { id: 'BIN-014', location: [41.3000, 69.1950], address: 'Almazar tumani, Beruniy ko\'chasi, 56', status: 34, capacity: 125 },
    { id: 'BIN-015', location: [41.2800, 69.1750], address: 'Qibray tumani, Yangi Qibray, 89', status: 82, capacity: 150 },
    
    // Shimoli-sharqiy hudud
    { id: 'BIN-016', location: [41.3500, 69.2900], address: 'Bektimir tumani, Labzak ko\'chasi, 34', status: 94, capacity: 160 },
    { id: 'BIN-017', location: [41.3400, 69.3200], address: 'Zangiota tumani, Zangota yo\'li, 67', status: 58, capacity: 140 },
    
    // Janubi-g'arbiy hudud
    { id: 'BIN-018', location: [41.2650, 69.2100], address: 'Quyichirchiq tumani, Chirchiq, 12', status: 97, capacity: 170 },
    { id: 'BIN-019', location: [41.2700, 69.2800], address: 'Parkent tumani, Parkent yo\'li, 45', status: 71, capacity: 155 },
    
    // Markaziy-shimoliy hudud
    { id: 'BIN-020', location: [41.3600, 69.2400], address: 'Toshkent shahar markazi, Amir Temur maydoni, 1', status: 99, capacity: 180 }
  ]

  // 7 ta mashina
  const mockVehiclesData = [
    { id: 'VEH-001', driver: 'Akmaljon Karimov', status: 'moving', coordinates: [41.3350, 69.2100] },
    { id: 'VEH-002', driver: 'Bobur Toshmatov', status: 'active', coordinates: [41.2850, 69.2200] },
    { id: 'VEH-003', driver: 'Davron Saidov', status: 'moving', coordinates: [41.3100, 69.3200] },
    { id: 'VEH-004', driver: 'Eldor Rahimov', status: 'active', coordinates: [41.3250, 69.1850] },
    { id: 'VEH-005', driver: 'Farrux Nazarov', status: 'moving', coordinates: [41.3150, 69.2400] },
    { id: 'VEH-006', driver: 'Gulom Yusupov', status: 'active', coordinates: [41.3500, 69.2900] },
    { id: 'VEH-007', driver: 'Husan Aliyev', status: 'moving', coordinates: [41.2650, 69.2100] }
  ]

  // Ko'chalar tarmog'i - Map.toza.huduh bilan bir xil
  const tashkentRoads = [
    // Markaziy yo'llar
    {
      name: "Amir Temur ko'chasi",
      points: [
        [41.311, 69.240], [41.3115, 69.2405], [41.312, 69.241], [41.3125, 69.2415],
        [41.313, 69.242], [41.3135, 69.2425], [41.314, 69.243], [41.3145, 69.2435],
        [41.315, 69.244], [41.3155, 69.2445], [41.316, 69.245], [41.3165, 69.2455]
      ]
    },
    {
      name: "Mustaqillik maydoni",
      points: [
        [41.305, 69.235], [41.3055, 69.2355], [41.306, 69.236], [41.3065, 69.2365],
        [41.307, 69.237], [41.3075, 69.2375], [41.308, 69.238], [41.3085, 69.2385],
        [41.309, 69.239], [41.3095, 69.2395], [41.310, 69.240], [41.3105, 69.2405]
      ]
    },
    // Shimoliy yo'llar
    {
      name: "Chilonzor yo'li",
      points: [
        [41.330, 69.200], [41.3320, 69.2050], [41.3340, 69.2100], [41.3360, 69.2150],
        [41.3380, 69.2200], [41.3400, 69.2250], [41.3420, 69.2300], [41.3440, 69.2350]
      ]
    },
    {
      name: "Buyuk Ipak Yo'li",
      points: [
        [41.340, 69.250], [41.3420, 69.2550], [41.3440, 69.2600], [41.3460, 69.2650],
        [41.3480, 69.2700], [41.3500, 69.2750], [41.3520, 69.2800], [41.3540, 69.2850]
      ]
    },
    // Janubiy yo'llar
    {
      name: "Qashqadaryo ko'chasi",
      points: [
        [41.280, 69.210], [41.2820, 69.2150], [41.2840, 69.2200], [41.2860, 69.2250],
        [41.2880, 69.2300], [41.2900, 69.2350], [41.2920, 69.2400], [41.2940, 69.2450]
      ]
    },
    {
      name: "Bobur ko'chasi",
      points: [
        [41.270, 69.250], [41.2720, 69.2550], [41.2740, 69.2600], [41.2760, 69.2650],
        [41.2780, 69.2700], [41.2800, 69.2750], [41.2820, 69.2800], [41.2840, 69.2850]
      ]
    },
    // Sharqiy yo'llar
    {
      name: "Yunus Rajabiy",
      points: [
        [41.300, 69.310], [41.3020, 69.3120], [41.3040, 69.3140], [41.3060, 69.3160],
        [41.3080, 69.3180], [41.3100, 69.3200], [41.3120, 69.3220], [41.3140, 69.3240]
      ]
    },
    {
      name: "Universitet ko'chasi",
      points: [
        [41.320, 69.300], [41.3220, 69.3050], [41.3240, 69.3100], [41.3260, 69.3150],
        [41.3280, 69.3200], [41.3300, 69.3250], [41.3320, 69.3300], [41.3340, 69.3350]
      ]
    },
    // G'arbiy yo'llar
    {
      name: "Farg'ona yo'li",
      points: [
        [41.320, 69.180], [41.3220, 69.1820], [41.3240, 69.1840], [41.3260, 69.1860],
        [41.3280, 69.1880], [41.3300, 69.1900], [41.3320, 69.1920], [41.3340, 69.1940]
      ]
    },
    {
      name: "Beruniy ko'chasi",
      points: [
        [41.290, 69.190], [41.2920, 69.1920], [41.2940, 69.1940], [41.2960, 69.1960],
        [41.2980, 69.1980], [41.3000, 69.2000], [41.3020, 69.2020], [41.3040, 69.2040]
      ]
    },
    // Qo'shimcha markaziy yo'llar
    {
      name: "Navoi ko'chasi",
      points: [
        [41.295, 69.225], [41.2970, 69.2270], [41.2990, 69.2290], [41.3010, 69.2310],
        [41.3030, 69.2330], [41.3050, 69.2350], [41.3070, 69.2370], [41.3090, 69.2390]
      ]
    },
    {
      name: "Shota Rustaveli",
      points: [
        [41.308, 69.235], [41.3100, 69.2370], [41.3120, 69.2390], [41.3140, 69.2410],
        [41.3160, 69.2430], [41.3180, 69.2450], [41.3200, 69.2470], [41.3220, 69.2490]
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
    const vehicleLat = vehicle.coordinates ? vehicle.coordinates[0] : 41.311
    const vehicleLng = vehicle.coordinates ? vehicle.coordinates[1] : 69.240
    
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
    const fullBins = mockBinsData.filter(bin => bin.status >= 90)
    const targetBin = fullBins.length > 0 ? 
      fullBins[Math.floor(Math.random() * fullBins.length)] :
      mockBinsData[Math.floor(Math.random() * mockBinsData.length)]
    
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
      const fullBins = mockBinsData.filter(bin => bin.status >= 90)
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
            const fullBins = mockBinsData.filter(bin => bin.status >= 90)
            const warningBins = mockBinsData.filter(bin => bin.status >= 70 && bin.status < 90)
            const allTargetBins = fullBins.length > 0 ? fullBins : 
                                 warningBins.length > 0 ? warningBins : mockBinsData
            
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
            // Qutiga yetdi - avtomatik tozalash
            route.reachedTarget = true
            route.lastUpdate = currentTime
            
            if (route.targetBin) {
              console.log(`✅ ${vehicleId} ${route.targetBin.id} qutiga yetdi va tozalaydi!`)
              
              // Qutini avtomatik tozalash - statusni 10-20% ga tushirish
              const binIndex = mockBinsData.findIndex(bin => bin.id === route.targetBin.id)
              if (binIndex !== -1) {
                const oldStatus = mockBinsData[binIndex].status
                mockBinsData[binIndex].status = Math.max(10, Math.random() * 20 + 10) // 10-30% orasida
                console.log(`🧹 ${route.targetBin.id} tozalandi! ${oldStatus}% → ${Math.round(mockBinsData[binIndex].status)}%`)
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
    if (mockVehiclesData.length > 0 && mockBinsData.length > 0) {
      const routes = {}
      mockVehiclesData.forEach(vehicle => {
        // Barcha mashinalarni faol qilish
        routes[vehicle.id] = generateVehicleRoute(vehicle)
      })
      setVehiclePositions(routes)
    }
  }, [])

  // Qutilar holatini tasodifiy o'zgartirish - Map.toza.huduh bilan bir xil
  useEffect(() => {
    const binStatusInterval = setInterval(() => {
      mockBinsData.forEach(bin => {
        // Tasodifiy ravishda ba'zi qutilar to'ladi
        if (Math.random() > 0.95 && bin.status < 90) { // 5% ehtimol
          const oldStatus = bin.status
          bin.status = Math.min(100, bin.status + Math.random() * 20 + 10)
          console.log(`📈 ${bin.id} quti to'lmoqda: ${Math.round(bin.status)}%`)
          
          // Agar quti to'la bo'lsa, darhol yo'nalish chiziq paydo qilish
          if (bin.status >= 90 && oldStatus < 90) {
            console.log(`🚨 ${bin.id} quti to'ldi! Yo'nalish chiziqlari yangilanmoqda...`)
            // Yo'nalish chiziqlarni yangilash uchun kichik kechikish
            setTimeout(() => {
              updateRouteLines()
            }, 100)
          }
        }
      })
    }, 10000) // Har 10 soniyada

    return () => clearInterval(binStatusInterval)
  }, [vehiclePositions])

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

    const map = L.map(mapRef.current).setView([41.311, 69.240], 12)
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
    let filteredBins = mockBinsData
    if (mapFilter === 'full') {
      filteredBins = mockBinsData.filter(bin => bin.status >= 90)
    } else if (mapFilter === 'warning') {
      filteredBins = mockBinsData.filter(bin => bin.status >= 70 && bin.status < 90)
    } else if (mapFilter === 'empty') {
      filteredBins = mockBinsData.filter(bin => bin.status < 30)
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
        const currentLat = currentRoute ? currentRoute.currentLat : (vehicle.coordinates ? vehicle.coordinates[0] : 41.311)
        const currentLng = currentRoute ? currentRoute.currentLng : (vehicle.coordinates ? vehicle.coordinates[1] : 69.240)
        
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
  }, [mapFilter, vehiclePositions])

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
      mapInstanceRef.current.setView([41.311, 69.240], 12)
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