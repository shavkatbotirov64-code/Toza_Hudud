// Mashinalarni Samarqand ichiga qaytarish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

// Samarqand markaziy nuqtalari
const SAMARQAND_POSITIONS = [
  { vehicleId: 'VEH-001', lat: 39.6542, lon: 66.9597 }, // Registon atrofi
  { vehicleId: 'VEH-002', lat: 39.6650, lon: 66.9750 }  // Shimoliy hudud
];

async function resetPositions() {
  console.log('🔄 Resetting vehicle positions to Samarqand...\n');

  for (const pos of SAMARQAND_POSITIONS) {
    try {
      console.log(`📍 Resetting ${pos.vehicleId} to [${pos.lat}, ${pos.lon}]`);
      
      const response = await fetch(`${API_URL}/vehicles/${pos.vehicleId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: pos.lat,
          longitude: pos.lon
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${pos.vehicleId} position reset successfully`);
      } else {
        console.log(`❌ Failed to reset ${pos.vehicleId}: ${data.error}`);
      }
    } catch (error) {
      console.error(`❌ Error resetting ${pos.vehicleId}:`, error.message);
    }
  }

  console.log('\n✅ All positions reset!');
  console.log('📝 Now refresh the browser and clear localStorage:');
  console.log('   1. Open browser console (F12)');
  console.log('   2. Run: localStorage.clear()');
  console.log('   3. Refresh page (F5)');
}

resetPositions();
