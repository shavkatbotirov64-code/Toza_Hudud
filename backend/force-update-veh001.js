// VEH-001 ni majburiy yangilash
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function forceUpdateVEH001() {
  console.log('🔧 Force updating VEH-001...\n');

  try {
    // Get all vehicles
    const getResponse = await fetch(`${API_URL}/vehicles`);
    const getData = await getResponse.json();
    
    if (getData.success && getData.data) {
      const veh001 = getData.data.find(v => v.vehicleId === 'VEH-001');
      
      if (veh001) {
        console.log('📍 Current VEH-001 position:', veh001.latitude, veh001.longitude);
        console.log('🆔 VEH-001 ID:', veh001.id);
        
        // Update location
        console.log('\n📍 Updating location to [39.6542, 66.9597]...');
        const locationResponse = await fetch(`${API_URL}/vehicles/VEH-001/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: 39.6542,
            longitude: 66.9597
          })
        });
        
        const locationData = await locationResponse.json();
        if (locationData.success) {
          console.log('✅ Location updated');
        } else {
          console.log('❌ Location update failed:', locationData.error);
        }
        
        // Verify
        console.log('\n🔍 Verifying...');
        const verifyResponse = await fetch(`${API_URL}/vehicles/VEH-001/status`);
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          console.log('✅ VEH-001 verified:');
          console.log('   Position:', verifyData.data.latitude, verifyData.data.longitude);
          console.log('   Status:', verifyData.data.status);
        }
        
      } else {
        console.log('❌ VEH-001 not found in backend');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceUpdateVEH001();
