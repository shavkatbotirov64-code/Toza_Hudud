// Mashinalar holatini tuzatish - isPatrolling: true qilish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function fixVehicleStates() {
  console.log('🔧 Fixing vehicle states...\n');

  try {
    // 1. Get all vehicles
    const response = await fetch(`${API_URL}/vehicles`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`✅ Found ${data.data.length} vehicles\n`);
      
      // 2. Update each vehicle to patrolling state
      for (const vehicle of data.data) {
        console.log(`🔄 Updating ${vehicle.vehicleId}...`);
        
        try {
          // Update state
          const stateResponse = await fetch(`${API_URL}/vehicles/${vehicle.id}/state`, {
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
            console.log(`✅ ${vehicle.vehicleId} state updated to patrolling`);
          } else {
            console.log(`❌ Failed to update ${vehicle.vehicleId} state:`, stateData.error);
          }
        } catch (error) {
          console.error(`❌ Error updating ${vehicle.vehicleId}:`, error.message);
        }
      }
      
      console.log('\n⏳ Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Verify
      console.log('🔍 Verifying...\n');
      const verifyResponse = await fetch(`${API_URL}/vehicles`);
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success && verifyData.data) {
        verifyData.data.forEach(vehicle => {
          console.log(`🚛 ${vehicle.vehicleId}:`);
          console.log(`   Position: [${vehicle.latitude}, ${vehicle.longitude}]`);
          console.log(`   Status: ${vehicle.status}`);
          console.log(`   isPatrolling: ${vehicle.isPatrolling}`);
          console.log(`   hasCleanedOnce: ${vehicle.hasCleanedOnce}`);
          console.log('');
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('✅ Fix complete!');
  console.log('\n📝 Next step:');
  console.log('   Open Haydovchi Panel in browser');
  console.log('   Press F12 and run: localStorage.clear(); location.reload(true);');
}

fixVehicleStates();
