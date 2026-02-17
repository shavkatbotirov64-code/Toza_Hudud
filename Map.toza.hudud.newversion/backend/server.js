require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'New Map Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Find closest vehicle to bin
app.post('/dispatch/find-closest', async (req, res) => {
  try {
    const { binLocation, vehicles } = req.body;

    if (!binLocation || !vehicles || vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'binLocation and vehicles are required',
      });
    }

    console.log('📍 Bin location:', binLocation);
    console.log('🚛 Vehicles count:', vehicles.length);

    // Filter patrolling vehicles
    const patrollingVehicles = vehicles.filter(v => v.isPatrolling);

    if (patrollingVehicles.length === 0) {
      return res.json({
        success: false,
        error: 'No patrolling vehicles available',
      });
    }

    console.log('🔍 Patrolling vehicles:', patrollingVehicles.length);

    // Calculate distances
    const distances = patrollingVehicles.map(vehicle => {
      const distance = calculateDistance(
        vehicle.position[0],
        vehicle.position[1],
        binLocation[0],
        binLocation[1]
      );

      return {
        vehicle,
        distance,
      };
    });

    // Find closest
    const closest = distances.reduce((prev, curr) =>
      curr.distance < prev.distance ? curr : prev
    );

    console.log(`✅ Closest vehicle: ${closest.vehicle.id} (${closest.distance.toFixed(2)} km)`);

    res.json({
      success: true,
      data: {
        vehicle: closest.vehicle,
        distance: closest.distance.toFixed(2),
        estimatedTime: Math.round((closest.distance / 30) * 60), // 30 km/h average
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Dispatch vehicle to bin
app.post('/dispatch/send-to-bin', async (req, res) => {
  try {
    const { binId, binLocation, binAddress, vehicles } = req.body;

    if (!binId || !binLocation || !vehicles) {
      return res.status(400).json({
        success: false,
        error: 'binId, binLocation, and vehicles are required',
      });
    }

    console.log('🚀 Dispatching vehicle to bin:', binId);

    // Find closest vehicle
    const patrollingVehicles = vehicles.filter(v => v.isPatrolling);

    if (patrollingVehicles.length === 0) {
      return res.json({
        success: false,
        error: 'No patrolling vehicles available',
      });
    }

    const distances = patrollingVehicles.map(vehicle => {
      const distance = calculateDistance(
        vehicle.position[0],
        vehicle.position[1],
        binLocation[0],
        binLocation[1]
      );

      return { vehicle, distance };
    });

    const closest = distances.reduce((prev, curr) =>
      curr.distance < prev.distance ? curr : prev
    );

    console.log(`✅ Dispatching ${closest.vehicle.id} to bin ${binId}`);

    // Get route from OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${closest.vehicle.position[1]},${closest.vehicle.position[0]};${binLocation[1]},${binLocation[0]}?overview=full&geometries=geojson`;
    
    let route = [closest.vehicle.position, binLocation];
    let routeDistance = closest.distance.toFixed(2);
    let routeDuration = Math.round((closest.distance / 30) * 60);

    try {
      const osrmResponse = await fetch(osrmUrl);
      const osrmData = await osrmResponse.json();

      if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
        const osrmRoute = osrmData.routes[0];
        route = osrmRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        routeDistance = (osrmRoute.distance / 1000).toFixed(2);
        routeDuration = Math.round(osrmRoute.duration / 60);
      }
    } catch (osrmError) {
      console.warn('⚠️ OSRM error, using direct route:', osrmError.message);
    }

    res.json({
      success: true,
      data: {
        vehicleId: closest.vehicle.id,
        vehicleDriver: closest.vehicle.driver,
        binId: binId,
        binAddress: binAddress || 'Unknown',
        distance: routeDistance,
        estimatedTime: routeDuration,
        route: route,
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ New Map Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🚛 Dispatch endpoint: http://localhost:${PORT}/dispatch/send-to-bin`);
});
