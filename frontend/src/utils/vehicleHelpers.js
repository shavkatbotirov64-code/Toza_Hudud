// Mashina yordamchi funksiyalari

// Ikki nuqta orasidagi masofani hisoblash (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
export const fetchRouteFromOSRM = async (startLat, startLon, endLat, endLon) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const coordinates = route.geometry.coordinates
      
      // GeoJSON format [lon, lat] dan Leaflet format [lat, lon] ga o'zgartirish
      const leafletCoordinates = coordinates.map(coord => [coord[1], coord[0]])
      
      const distanceKm = (route.distance / 1000).toFixed(2)
      const durationMin = (route.duration / 60).toFixed(1)
      
      return {
        success: true,
        path: leafletCoordinates,
        distance: distanceKm,
        duration: durationMin
      }
    } else {
      return { success: false }
    }
  } catch (error) {
    console.error('❌ OSRM API xatolik:', error)
    return { success: false }
  }
}

// Mashina qutiga yaqinligini tekshirish (metrda)
export const isVehicleNearBin = (vehiclePos, binPos, thresholdMeters = 50) => {
  const distanceKm = calculateDistance(vehiclePos[0], vehiclePos[1], binPos[0], binPos[1])
  const distanceMeters = distanceKm * 1000
  return distanceMeters <= thresholdMeters
}
