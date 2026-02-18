# Samarqand Boundary Constraint Fix

## Problem
Vehicles were leaving Samarqand city boundaries during animation, especially when going to bins.

## Root Cause
The boundary constraints were only applied during patrol animation, but NOT when vehicles were going to bins in the admin panel (frontend).

## Solution Applied

### 1. Added Boundary Constraints for "Going to Bin" Animation (Admin Panel)

**File**: `frontend/src/components/LiveMapSimple.jsx`

Added position constraints for both VEH-001 and VEH-002 when moving to bins:

```javascript
// Keyingi nuqtaga o'tish
let newPosition = vehicleState.routePath[nextIndex]

// ✨ Pozitsiya Samarqand ichida ekanligini tekshirish
if (!isWithinSamarqand(newPosition[0], newPosition[1])) {
  console.log(`⚠️ VEH-001: Position outside Samarqand (going to bin), constraining...`)
  newPosition = constrainToSamarqand(newPosition[0], newPosition[1])
}

updateVehicleState('VEH-001', {
  position: newPosition,
  currentPathIndex: nextIndex
})
```

### 2. Added Backend Position Saving (Admin Panel)

Added backend position synchronization when vehicles move to bins:

```javascript
// Backend'ga pozitsiyani saqlash (haydovchi paneldagidek)
fetch(`${import.meta.env.VITE_API_URL || 'https://tozahudud-production-d73f.up.railway.app'}/vehicles/VEH-001/location`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: newPosition[0],
    longitude: newPosition[1]
  })
}).catch(err => console.error('Failed to save position for VEH-001:', err))
```

### 3. Reset Vehicle Positions

Reset all vehicles to Samarqand center using `backend/reset-vehicle-positions.js`:
- VEH-001: [39.6542, 66.9597] (Registon area)
- VEH-002: [39.6650, 66.9750] (Northern area)

## Samarqand Boundaries

```javascript
const SAMARQAND_BOUNDS = {
  north: 39.70,
  south: 39.62,
  east: 67.00,
  west: 66.92
}
```

## Constraint Functions

```javascript
// Check if position is within Samarqand
const isWithinSamarqand = (lat, lon) => {
  return lat >= SAMARQAND_BOUNDS.south && 
         lat <= SAMARQAND_BOUNDS.north && 
         lon >= SAMARQAND_BOUNDS.west && 
         lon <= SAMARQAND_BOUNDS.east
}

// Constrain position to Samarqand boundaries
const constrainToSamarqand = (lat, lon) => {
  const constrainedLat = Math.max(SAMARQAND_BOUNDS.south, Math.min(SAMARQAND_BOUNDS.north, lat))
  const constrainedLon = Math.max(SAMARQAND_BOUNDS.west, Math.min(SAMARQAND_BOUNDS.east, lon))
  return [constrainedLat, constrainedLon]
}
```

## Where Constraints Are Applied

### Admin Panel (frontend/src/components/LiveMapSimple.jsx)
1. ✅ Patrol animation - random position generation
2. ✅ Patrol animation - every position update
3. ✅ Going to bin animation - every position update (FIXED)

### Haydovchi Panel (Map.toza.hudud.newversion/Map.toza.huduh/src/components/LiveMap.tsx)
1. ✅ Patrol animation - random position generation
2. ✅ Patrol animation - every position update
3. ✅ Going to bin animation - every position update

## Deployment

Frontend redeployed with fixes:
```bash
cd frontend
railway service
railway redeploy --yes
```

## Testing

1. Clear browser localStorage: `localStorage.clear()`
2. Refresh both panels (Admin and Haydovchi)
3. Vehicles should start from Samarqand center
4. Watch vehicles patrol - they should stay within boundaries
5. When bin becomes FULL, vehicle should go to bin staying within boundaries

## Status

✅ Boundary constraints applied to all vehicle movements
✅ Vehicles reset to Samarqand center
✅ Frontend deployed with fixes
✅ Both panels synchronized via WebSocket
