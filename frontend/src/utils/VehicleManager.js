// Barcha mashinalar uchun umumiy patrol va animatsiya manager

import { fetchRouteFromOSRM, calculateDistance } from './vehicleHelpers'

class VehicleManager {
  constructor(updateVehicleState, setBinsData, setBinStatus) {
    this.updateVehicleState = updateVehicleState
    this.setBinsData = setBinsData
    this.setBinStatus = setBinStatus
    this.intervals = {}
  }

  // Patrol marshruti yaratish
  async buildPatrolRoute(vehicle) {
    if (!vehicle.patrolWaypoints || vehicle.patrolWaypoints.length === 0) {
      console.warn(`⚠️ ${vehicle.id}: Patrol waypoints yo'q`)
      return
    }

    console.log(`🗺️ ${vehicle.id}: Patrol marshruti yaratilmoqda...`)
    
    const waypoints = vehicle.patrolWaypoints
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
    
    console.log(`✅ ${vehicle.id}: Patrol marshruti tayyor - ${fullRoute.length} nuqta`)
    
    this.updateVehicleState(vehicle.id, {
      patrolRoute: fullRoute,
      position: fullRoute[0] || vehicle.position
    })
  }

  // Patrol animatsiyasini boshlash
  startPatrol(vehicle) {
    if (this.intervals[vehicle.id]) {
      clearInterval(this.intervals[vehicle.id])
    }

    if (!vehicle.isPatrolling || vehicle.patrolRoute.length === 0 || vehicle.routePath) {
      return
    }

    console.log(`🚛 ${vehicle.id}: Patrol boshlandi`)

    this.intervals[vehicle.id] = setInterval(() => {
      const nextIndex = (vehicle.patrolIndex + 1) % vehicle.patrolRoute.length
      this.updateVehicleState(vehicle.id, {
        position: vehicle.patrolRoute[nextIndex],
        patrolIndex: nextIndex
      })
    }, 2000)
  }

  // Qutiga yo'nalish
  async goToBin(vehicle, binData) {
    console.log(`🚛 ${vehicle.id}: Qutiga yo'nalmoqda...`)
    
    const result = await fetchRouteFromOSRM(
      vehicle.position[0],
      vehicle.position[1],
      binData.location[0],
      binData.location[1]
    )
    
    const route = result.success ? result.path : [vehicle.position, binData.location]
    
    this.updateVehicleState(vehicle.id, {
      isPatrolling: false,
      routePath: route,
      currentPathIndex: 0
    })
  }

  // Qutiga borish animatsiyasi
  startGoingToBin(vehicle, binData) {
    if (this.intervals[vehicle.id]) {
      clearInterval(this.intervals[vehicle.id])
    }

    if (!vehicle.routePath || vehicle.routePath.length === 0) {
      return
    }

    const startTime = Date.now()

    this.intervals[vehicle.id] = setInterval(() => {
      const nextIndex = vehicle.currentPathIndex + 1
      
      if (nextIndex >= vehicle.routePath.length) {
        // Qutiga yetdi
        this.handleArrival(vehicle, binData, startTime)
      } else {
        // Keyingi nuqtaga o'tish
        this.updateVehicleState(vehicle.id, {
          position: vehicle.routePath[nextIndex],
          currentPathIndex: nextIndex
        })
      }
    }, 1500)
  }

  // Qutiga yetganda
  handleArrival(vehicle, binData, startTime) {
    const endTime = Date.now()
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60) || 1
    
    console.log(`✅ ${vehicle.id}: Qutiga yetdi!`)
    console.log(`⏸️ ${vehicle.id}: Qutida to'xtadi - 3 soniya kutilmoqda...`)
    
    // Animatsiyani to'xtatish
    if (this.intervals[vehicle.id]) {
      clearInterval(this.intervals[vehicle.id])
    }
    
    // 3 soniya kutish - tozalash
    setTimeout(() => {
      console.log(`🧹 ${vehicle.id}: Tozalash boshlandi!`)
      
      // Qutini yashil qilish
      console.log(`🟢 QUTI YASHIL QILINYAPTI - ${vehicle.id} tomonidan`)
      this.setBinStatus('EMPTY')
      
      this.setBinsData(prevBins => prevBins.map(bin =>
        bin.id === binData.id ? {
          ...bin,
          status: 15,
          fillLevel: 15,
          lastCleaned: new Date().toLocaleDateString('uz-UZ') + ' ' + new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          lastUpdate: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        } : bin
      ))
      
      console.log(`✅ ${vehicle.id}: Tozalash tugallandi`)
      console.log(`🚛 ${vehicle.id}: Patrolga qaytmoqda...`)
      
      // Mashina patrolga qaytadi
      this.updateVehicleState(vehicle.id, {
        isPatrolling: true,
        routePath: null,
        hasCleanedOnce: true,
        currentPathIndex: 0,
        patrolRoute: [],
        patrolIndex: 0,
        cleaned: (vehicle.cleaned || 0) + 1,
        status: 'moving'
      })
    }, 3000)
  }

  // Barcha intervallarni to'xtatish
  stopAll() {
    Object.keys(this.intervals).forEach(vehicleId => {
      if (this.intervals[vehicleId]) {
        clearInterval(this.intervals[vehicleId])
      }
    })
    this.intervals = {}
  }

  // Bitta mashinani to'xtatish
  stopVehicle(vehicleId) {
    if (this.intervals[vehicleId]) {
      clearInterval(this.intervals[vehicleId])
      delete this.intervals[vehicleId]
    }
  }
}

export default VehicleManager
