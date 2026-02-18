// Mashinalarni o'chirish va qayta yaratish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

// Quti pozitsiyasi
const BIN_LOCATION = [39.6742637, 66.9737814];

// Yangi mashinalar
const VEHICLES = [
  {
    vehicleId: 'VEH-001',
    driver: 'Sardor Aliyev',
    phone: '+998 90 123 45 67',
    latitude: BIN_LOCATION[0] + 0.002,  // Qutidan 200m janubi-sharqda
    longitude: BIN_LOCATION[1] - 0.002,
    status: 'moving',
    isMoving: true,
    isPatrolling: true,
    hasCleanedOnce: false,
    patrolIndex: 0
  },
  {
    vehicleId: 'VEH-002',
    driver: 'Aziz Karimov',
    phone: '+998 91 234 56 78',
    latitude: BIN_LOCATION[0] - 0.002,  // Qutidan 200m shimoli-g'arbda
    longitude: BIN_LOCATION[1] + 0.002,
    status: 'moving',
    isMoving: true,
    isPatrolling: true,
    hasCleanedOnce: false,
    patrolIndex: 0
  }
];

async function resetEverything() {
  console.log('🔧 Resetting everything...\n');
  console.log(`📍 Bin location: [${BIN_LOCATION[0]}, ${BIN_LOCATION[1]}]\n`);

  // 1. Get all vehicles
  console.log('📋 Step 1: Getting all vehicles...');
  try {
    const response = await fetch(`${API_URL}/vehicles`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`✅ Found ${data.data.length} vehicles\n`);
      
      // 2. Delete each vehicle
      console.log('🗑️ Step 2: Deleting vehicles...');
      for (const vehicle of data.data) {
        try {
          const deleteResponse = await fetch(`${API_URL}/vehicles/${vehicle.id}`, {
            method: 'DELETE'
          });
          const deleteData = await deleteResponse.json();
          
          if (deleteData.success) {
            console.log(`✅ Deleted ${vehicle.vehicleId}`);
          } else {
            console.log(`❌ Failed to delete ${vehicle.vehicleId}:`, deleteData.error);
          }
        } catch (error) {
          console.error(`❌ Error deleting ${vehicle.vehicleId}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error getting vehicles:', error.message);
  }
  
  console.log('\n⏳ Waiting 2 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. Create new vehicles
  console.log('➕ Step 3: Creating new vehicles...');
  for (const vehicle of VEHICLES) {
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Created ${vehicle.vehicleId} at [${vehicle.latitude}, ${vehicle.longitude}]`);
      } else {
        console.log(`❌ Failed to create ${vehicle.vehicleId}:`, data.error);
      }
    } catch (error) {
      console.error(`❌ Error creating ${vehicle.vehicleId}:`, error.message);
    }
  }
  
  console.log('\n⏳ Waiting 2 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 4. Verify
  console.log('🔍 Step 4: Verifying...');
  try {
    const response = await fetch(`${API_URL}/vehicles`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`\n✅ Total vehicles: ${data.data.length}\n`);
      
      data.data.forEach(vehicle => {
        console.log(`🚛 ${vehicle.vehicleId}:`);
        console.log(`   Position: [${vehicle.latitude}, ${vehicle.longitude}]`);
        console.log(`   Driver: ${vehicle.driver}`);
        console.log(`   Status: ${vehicle.status}`);
        console.log(`   Patrolling: ${vehicle.isPatrolling}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error verifying:', error.message);
  }
  
  console.log('✅ Reset complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Open Admin Panel in browser');
  console.log('   2. Press F12 to open Console');
  console.log('   3. Run: localStorage.clear()');
  console.log('   4. Press Ctrl+Shift+R to hard refresh');
  console.log('');
  console.log('   5. Open Haydovchi Panel in browser');
  console.log('   6. Press F12 to open Console');
  console.log('   7. Run: localStorage.clear()');
  console.log('   8. Press Ctrl+Shift+R to hard refresh');
}

resetEverything();
