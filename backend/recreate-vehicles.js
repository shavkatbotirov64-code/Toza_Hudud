// Mashinalarni o'chirib, qayta Samarqand markazida yaratish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function recreateVehicles() {
  console.log('🔄 Recreating vehicles in Samarqand...\n');

  const vehicles = [
    {
      vehicleId: 'VEH-001',
      driver: 'Sardor Aliyev',
      phone: '+998 90 123 45 67',
      licensePlate: 'UZ-001',
      latitude: 39.6542,
      longitude: 66.9597
    },
    {
      vehicleId: 'VEH-002',
      driver: 'Aziz Karimov',
      phone: '+998 91 234 56 78',
      licensePlate: 'UZ-002',
      latitude: 39.6650,
      longitude: 66.9750
    }
  ];

  for (const vehicle of vehicles) {
    try {
      console.log(`\n🚛 Processing ${vehicle.vehicleId}...`);
      
      // Get vehicle ID from backend
      const getResponse = await fetch(`${API_URL}/vehicles`);
      const getData = await getResponse.json();
      
      if (getData.success && getData.data) {
        const existingVehicle = getData.data.find(v => v.vehicleId === vehicle.vehicleId);
        
        if (existingVehicle) {
          console.log(`🗑️ Deleting ${vehicle.vehicleId} (ID: ${existingVehicle.id})...`);
          
          // Delete vehicle
          const deleteResponse = await fetch(`${API_URL}/vehicles/${existingVehicle.id}`, {
            method: 'DELETE'
          });
          
          const deleteData = await deleteResponse.json();
          if (deleteData.success) {
            console.log(`✅ ${vehicle.vehicleId} deleted`);
          }
        }
      }
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create vehicle with upsert
      console.log(`➕ Creating ${vehicle.vehicleId} at [${vehicle.latitude}, ${vehicle.longitude}]...`);
      
      const createResponse = await fetch(`${API_URL}/vehicles/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.vehicleId,
          driver: vehicle.driver,
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          status: 'moving'
        })
      });
      
      const createData = await createResponse.json();
      
      if (createData.success) {
        console.log(`✅ ${vehicle.vehicleId} created successfully`);
        console.log(`   Position: [${vehicle.latitude}, ${vehicle.longitude}]`);
        console.log(`   Driver: ${vehicle.driver}`);
      } else {
        console.log(`❌ Failed to create ${vehicle.vehicleId}: ${createData.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${vehicle.vehicleId}:`, error.message);
    }
  }
  
  console.log('\n✅ All vehicles recreated in Samarqand!');
  console.log('\n📝 Next steps:');
  console.log('   1. Open browser console (F12)');
  console.log('   2. Run: localStorage.clear()');
  console.log('   3. Refresh page (F5)');
}

recreateVehicles();
