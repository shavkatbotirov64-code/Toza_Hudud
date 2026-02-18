// Real-time monitoring - Samarqand chegarasini tekshirish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

const SAMARQAND_BOUNDS = {
  north: 39.70,
  south: 39.62,
  east: 67.00,
  west: 66.92
};

function isInSamarqand(lat, lon) {
  return lat >= SAMARQAND_BOUNDS.south && 
         lat <= SAMARQAND_BOUNDS.north && 
         lon >= SAMARQAND_BOUNDS.west && 
         lon <= SAMARQAND_BOUNDS.east;
}

async function monitorVehicles() {
  console.clear();
  console.log('🔍 Real-time Vehicle Monitor - Samarqand Boundaries');
  console.log('═'.repeat(60));
  console.log(`Bounds: N:${SAMARQAND_BOUNDS.north} S:${SAMARQAND_BOUNDS.south} E:${SAMARQAND_BOUNDS.east} W:${SAMARQAND_BOUNDS.west}\n`);

  try {
    const response = await fetch(`${API_URL}/vehicles`);
    const data = await response.json();
    
    if (data.success && data.data) {
      data.data.forEach(vehicle => {
        const lat = parseFloat(vehicle.latitude);
        const lon = parseFloat(vehicle.longitude);
        const inSamarqand = isInSamarqand(lat, lon);
        
        const icon = inSamarqand ? '✅' : '🚨';
        const status = inSamarqand ? 'IN BOUNDS' : '⚠️ OUT OF BOUNDS!';
        
        console.log(`${icon} ${vehicle.vehicleId} - ${status}`);
        console.log(`   Position: [${lat.toFixed(6)}, ${lon.toFixed(6)}]`);
        console.log(`   Driver: ${vehicle.driver}`);
        console.log('');
      });
      
      console.log(`Last check: ${new Date().toLocaleTimeString()}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Monitor every 3 seconds
console.log('Starting monitor... (Press Ctrl+C to stop)\n');
monitorVehicles();
setInterval(monitorVehicles, 3000);
