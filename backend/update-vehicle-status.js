// Mashinalar statusini moving ga o'zgartirish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function updateVehicleStatus() {
  console.log('🔧 Updating vehicle status to moving...\n');

  try {
    // Get all vehicles
    const response = await fetch(`${API_URL}/vehicles`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`✅ Found ${data.data.length} vehicles\n`);
      
      // Update each vehicle
      for (const vehicle of data.data) {
        console.log(`🔄 Updating ${vehicle.vehicleId}...`);
        
        try {
          // Update using PATCH (partial update)
          const updateResponse = await fetch(`${API_URL}/vehicles/${vehicle.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'moving',
              isMoving: true
            })
          });
          
          const updateData = await updateResponse.json();
          
          if (updateData.success) {
            console.log(`✅ ${vehicle.vehicleId} status updated to moving`);
          } else {
            console.log(`❌ Failed to update ${vehicle.vehicleId}:`, updateData.error);
          }
        } catch (error) {
          console.error(`❌ Error updating ${vehicle.vehicleId}:`, error.message);
        }
      }
      
      console.log('\n⏳ Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify
      console.log('🔍 Verifying...\n');
      const verifyResponse = await fetch(`${API_URL}/vehicles`);
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success && verifyData.data) {
        verifyData.data.forEach(vehicle => {
          console.log(`🚛 ${vehicle.vehicleId}:`);
          console.log(`   Status: ${vehicle.status}`);
          console.log(`   isMoving: ${vehicle.isMoving}`);
          console.log(`   isPatrolling: ${vehicle.isPatrolling}`);
          console.log('');
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('✅ Update complete!');
  console.log('\n📝 Next step:');
  console.log('   Open Haydovchi Panel and press F12');
  console.log('   Run: localStorage.clear(); location.reload(true);');
}

updateVehicleStatus();
