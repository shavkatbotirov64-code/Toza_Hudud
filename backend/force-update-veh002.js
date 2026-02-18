// VEH-002 ni majburiy yangilash
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function forceUpdateVEH002() {
  console.log('🔧 Force updating VEH-002...\n');

  try {
    // Get all vehicles
    const getResponse = await fetch(`${API_URL}/vehicles`);
    const getData = await getResponse.json();
    
    if (getData.success && getData.data) {
      const veh002 = getData.data.find(v => v.vehicleId === 'VEH-002');
      
      if (veh002) {
        console.log('📍 Current VEH-002 position:', veh002.latitude, veh002.longitude);
        console.log('🆔 VEH-002 ID:', veh002.id);
        
        // Update location
        console.log('\n📍 Updating location to [39.6650, 66.9750]...');
        const locationResponse = await fetch(`${API_URL}/vehicles/VEH-002/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: 39.6650,
            longitude: 66.9750
          })
        });
        
        const locationData = await locationResponse.json();
        if (locationData.success) {
          console.log('✅ Location updated');
        } else {
          console.log('❌ Location update failed:', locationData.error);
        }
        
        // Update state
        console.log('\n🔄 Updating state...');
        const stateResponse = await fetch(`${API_URL}/vehicles/VEH-002/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isPatrolling: true,
            hasCleanedOnce: false,
            patrolIndex: 0,
            status: 'moving',
            patrolRoute: [],
            currentRoute: null
          })
        });
        
        const stateData = await stateResponse.json();
        if (stateData.success) {
          console.log('✅ State updated');
        } else {
          console.log('❌ State update failed:', stateData.error);
        }
        
        // Verify
        console.log('\n🔍 Verifying...');
        const verifyResponse = await fetch(`${API_URL}/vehicles/VEH-002/status`);
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          console.log('✅ VEH-002 verified:');
          console.log('   Position:', verifyData.data.latitude, verifyData.data.longitude);
          console.log('   Status:', verifyData.data.status);
          console.log('   Patrolling:', verifyData.data.isPatrolling);
        }
        
      } else {
        console.log('❌ VEH-002 not found in backend');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceUpdateVEH002();
