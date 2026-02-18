// Barcha mashinalarni tekshirish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function checkVehicles() {
  console.log('🔍 Checking all vehicles...\n');

  try {
    const response = await fetch(`${API_URL}/vehicles`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`✅ Found ${data.data.length} vehicles:\n`);
      
      data.data.forEach(vehicle => {
        const lat = parseFloat(vehicle.latitude);
        const lon = parseFloat(vehicle.longitude);
        
        // Samarqand chegaralari
        const inSamarqand = lat >= 39.62 && lat <= 39.70 && lon >= 66.92 && lon <= 67.00;
        
        console.log(`🚛 ${vehicle.vehicleId}:`);
        console.log(`   Position: [${lat}, ${lon}]`);
        console.log(`   Driver: ${vehicle.driver}`);
        console.log(`   Status: ${vehicle.status}`);
        console.log(`   In Samarqand: ${inSamarqand ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVehicles();
